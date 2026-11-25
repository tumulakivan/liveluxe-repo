import { unlink } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import type { SyncSummary } from '@repo/shared';
import { config } from './config.ts';
import { db, transaction } from './db.ts';
import { fetchBedTypes, fetchCancellationPolicies, fetchListings, fetchPropertyTypes, type HostawayListing } from './hostaway.ts';
import { manualValues, MANUAL_DASHBOARD_KEYS } from './manual.ts';
import { hostawayPlatforms, hostawayValues, images, tagNames, type Lookups } from './mapping.ts';

// Sync Hostaway: pulls every field the public API returns. It only ever writes
// 'hostaway'-sourced fields, and never un-hides a property an admin removed.
// Where Hostaway has no value, a value an admin typed by hand (a "fillable" field,
// or any field of a property added by hand and linked later) is left as it is.

export type { SyncSummary };

const SUMMARY_LENGTH = 220;

function summarise(description: string | null): string | null {
  if (!description) return null;
  const flat = description.replace(/\s+/g, ' ').trim();
  if (flat.length <= SUMMARY_LENGTH) return flat;
  const cut = flat.slice(0, SUMMARY_LENGTH);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

function searchText(l: HostawayListing, values: Record<string, unknown>): string {
  return [l.id, values.internalName, l.name, values.externalName, values.address, values.city, ...tagNames(l)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export async function syncHostaway(): Promise<SyncSummary> {
  const [listings, propertyTypes, cancellationPolicies, bedTypes] = await Promise.all([
    fetchListings(),
    fetchPropertyTypes(),
    fetchCancellationPolicies(),
    fetchBedTypes(),
  ]);
  const lookups: Lookups = {
    propertyTypes: new Map(propertyTypes.map((p) => [p.id, p.name])),
    cancellationPolicies,
    bedTypes: new Map(bedTypes.map((b) => [b.id, b.name])),
  };
  const now = new Date().toISOString();
  const summary: SyncSummary = { added: 0, updated: 0, unchanged: 0, archived: 0, fieldsChanged: 0, finishedAt: now };

  const platformIds = new Map(
    (db.prepare("SELECT id, key FROM platforms WHERE kind = 'hostaway'").all() as { id: number; key: string }[]).map(
      (p) => [p.key, p.id],
    ),
  );

  const findProperty = db.prepare('SELECT id FROM properties WHERE hostaway_id = ?');
  const insertProperty = db.prepare(
    `INSERT INTO properties (hostaway_id, name, summary, city, tags, photo_url, photo_count, archived, search_text, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
  );
  const updateProperty = db.prepare(
    // An uploaded display photo survives syncs (a hand-added property linked to Hostaway later keeps it).
    `UPDATE properties SET name = ?, summary = ?, city = ?, tags = ?,
       photo_url = CASE WHEN photo_source = 'upload' THEN photo_url ELSE COALESCE(?, photo_url) END, photo_count = ?,
       archived = ?, search_text = ?, synced_at = ?, updated_at = ? WHERE id = ?`,
  );
  const readValues = db.prepare("SELECT field_key, value FROM field_values WHERE property_id = ? AND source = 'sync'");
  const upsertValue = db.prepare(
    `INSERT INTO field_values (property_id, field_key, value, source, updated_at, updated_by)
     VALUES (?, ?, ?, 'sync', ?, ?)
     ON CONFLICT (property_id, field_key) DO UPDATE SET value = excluded.value, source = 'sync',
       updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  );
  // The dashboard values (filled by Claude) the house manual parts fall back on.
  const readDashboard = db.prepare(
    `SELECT field_key, value FROM field_values WHERE property_id = ? AND value IS NOT NULL
       AND field_key IN (${MANUAL_DASHBOARD_KEYS.map(() => '?').join(',')})`,
  );
  const upsertPlatform = db.prepare(
    `INSERT INTO property_platforms (property_id, platform_id, listed, url, source, updated_at)
     VALUES (?, ?, ?, ?, 'sync', ?)
     ON CONFLICT (property_id, platform_id) DO UPDATE SET listed = excluded.listed, url = excluded.url,
       source = 'sync', updated_at = excluded.updated_at`,
  );

  const leftoverPhotos: string[] = [];
  transaction(() => {
    for (const l of listings) {
      const values = hostawayValues(l, lookups);
      const archived = l.specialStatus === 'archived' ? 1 : 0;
      if (archived) summary.archived++;
      const row = [
        String(values.internalName ?? `Listing ${l.id}`),
        summarise(values.description as string | null),
        (values.city as string | null) ?? null,
        JSON.stringify(values.tags),
        images(l)[0]?.url ?? (typeof l.thumbnailUrl === 'string' ? l.thumbnailUrl : null),
        values.photoCount as number,
        archived,
        searchText(l, values),
      ] as const;

      const existing = findProperty.get(l.id) as { id: number } | undefined;
      let propertyId: number;
      if (existing) {
        propertyId = existing.id;
        updateProperty.run(...row, now, now, propertyId);
      } else {
        propertyId = (insertProperty.get(l.id, ...row, now) as { id: number }).id;
        summary.added++;
      }

      const before = new Map(
        (readValues.all(propertyId) as { field_key: string; value: string | null }[]).map((r) => [r.field_key, r.value]),
      );
      const dashboard = new Map(
        (readDashboard.all(propertyId, ...MANUAL_DASHBOARD_KEYS) as { field_key: string; value: string }[]).map((r) => [
          r.field_key,
          JSON.parse(r.value) as unknown,
        ]),
      );
      const text = (v: unknown) => (typeof v === 'string' ? v : null);
      const manual = manualValues({
        customManual: text(values.cfHouseManual),
        dashboardManual: text(dashboard.get('houseManual')),
        specialInstruction: text(values.specialInstruction),
        parkingField: text(values.cfParking),
        airbnbCheckIn: text(dashboard.get('airbnbCheckinInstructions')),
        airbnbCheckoutTasks: Array.isArray(dashboard.get('airbnbCheckoutTasks')) ? (dashboard.get('airbnbCheckoutTasks') as string[]) : null,
      });
      const writes: [string, unknown, string][] = [
        ...Object.entries(values).map(([k, v]): [string, unknown, string] => [k, v, 'Sync Hostaway']),
        ...Object.entries(manual).map(([k, m]): [string, unknown, string] => [k, m.value, m.from]),
      ];
      let changed = 0;
      for (const [key, value, by] of writes) {
        const encoded = value === null || value === undefined ? null : JSON.stringify(value);
        if (before.has(key) && before.get(key) === encoded) continue;
        // Nothing from Hostaway and no synced value to clear: keep whatever an admin typed.
        if (encoded === null && !before.has(key)) continue;
        upsertValue.run(propertyId, key, encoded, now, by);
        changed++;
      }
      for (const [key, p] of Object.entries(hostawayPlatforms(l))) {
        const platformId = platformIds.get(key);
        if (platformId) upsertPlatform.run(propertyId, platformId, p.listed ? 1 : 0, p.url, now);
      }
      summary.fieldsChanged += changed;
      if (existing) {
        if (changed > 0) summary.updated++;
        else summary.unchanged++;
      }
    }
    const handover = replaceOnboarding(new Set(listings.map((l) => l.id)), now);
    summary.replaced = handover.replaced;
    summary.notFound = handover.notFound;
    leftoverPhotos.push(...handover.leftoverPhotos);
  });

  // Uploaded photos of replaced onboarding listings that the Hostaway listing didn't take over.
  for (const url of leftoverPhotos) await unlink(resolve(config.photosDir, basename(url))).catch(() => {});

  return summary;
}

/**
 * Onboarding listings an admin has linked to a Hostaway listing (pending_hostaway_id) are replaced by
 * that listing once this sync has it: what the team typed carries over wherever Hostaway has nothing,
 * then the onboarding listing is deleted. Hostaway's values always win.
 */
function replaceOnboarding(synced: Set<number>, now: string) {
  const replaced: { name: string; hostawayId: number }[] = [];
  const notFound: { name: string; hostawayId: number }[] = [];
  const leftoverPhotos: string[] = [];
  const drafts = db
    .prepare('SELECT id, name, pending_hostaway_id, photo_url, photo_source, photo_count, created_by FROM properties WHERE hostaway_id IS NULL AND hidden = 0 AND pending_hostaway_id IS NOT NULL')
    .all() as { id: number; name: string; pending_hostaway_id: number; photo_url: string | null; photo_source: string; photo_count: number | null; created_by: string | null }[];

  const liveRow = db.prepare('SELECT id, photo_url FROM properties WHERE hostaway_id = ?');
  const draftValues = db.prepare('SELECT field_key, value, source, updated_at, updated_by FROM field_values WHERE property_id = ? AND value IS NOT NULL');
  const liveHas = db.prepare('SELECT 1 FROM field_values WHERE property_id = ? AND field_key = ? AND value IS NOT NULL');
  const copyValue = db.prepare(
    `INSERT INTO field_values (property_id, field_key, value, source, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (property_id, field_key) DO UPDATE SET value = excluded.value, source = excluded.source,
       updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  );
  // Ticks on manual platforms (Blueground, SilverDoor…). Hostaway's own platforms come from the sync.
  const copyPlatforms = db.prepare(
    `INSERT OR IGNORE INTO property_platforms (property_id, platform_id, listed, url, source, updated_at)
     SELECT ?, pp.platform_id, pp.listed, pp.url, pp.source, pp.updated_at FROM property_platforms pp
     JOIN platforms p ON p.id = pp.platform_id WHERE pp.property_id = ? AND p.kind = 'manual'`,
  );
  const takePhoto = db.prepare("UPDATE properties SET photo_url = ?, photo_source = 'upload', photo_count = COALESCE(photo_count, ?) WHERE id = ?");
  const credit = db.prepare('UPDATE properties SET created_by = COALESCE(created_by, ?), updated_at = ? WHERE id = ?');
  const remove = db.prepare('DELETE FROM properties WHERE id = ?');

  for (const d of drafts) {
    if (!synced.has(d.pending_hostaway_id)) {
      notFound.push({ name: d.name, hostawayId: d.pending_hostaway_id });
      continue;
    }
    const live = liveRow.get(d.pending_hostaway_id) as { id: number; photo_url: string | null } | undefined;
    if (!live) continue;
    for (const v of draftValues.all(d.id) as { field_key: string; value: string; source: string; updated_at: string; updated_by: string | null }[]) {
      if (liveHas.get(live.id, v.field_key)) continue;
      // Hand-typed values stay marked as the admin's or contributor's, so the next sync leaves them alone.
      copyValue.run(live.id, v.field_key, v.value, v.source === 'sync' ? 'admin' : v.source, v.updated_at, v.updated_by);
    }
    copyPlatforms.run(live.id, d.id);
    if (d.photo_source === 'upload' && d.photo_url) {
      if (!live.photo_url) takePhoto.run(d.photo_url, d.photo_count, live.id);
      else leftoverPhotos.push(d.photo_url);
    }
    credit.run(d.created_by, now, live.id);
    remove.run(d.id);
    replaced.push({ name: d.name, hostawayId: d.pending_hostaway_id });
  }
  return { replaced, notFound, leftoverPhotos };
}
