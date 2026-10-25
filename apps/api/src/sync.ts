import { db, transaction } from './db.ts';
import { fetchCancellationPolicies, fetchListings, fetchPropertyTypes, type HostawayListing } from './hostaway.ts';
import { hostawayPlatforms, hostawayValues, images, tagNames, type Lookups } from './mapping.ts';

// Sync Hostaway: pulls every field the public API returns. It only ever writes
// 'hostaway'-sourced fields, so values Claude or an admin set are never touched,
// and it never un-hides a property an admin removed.

export interface SyncSummary {
  added: number;
  updated: number;
  unchanged: number;
  archived: number;
  fieldsChanged: number;
  finishedAt: string;
}

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
  const [listings, propertyTypes, cancellationPolicies] = await Promise.all([
    fetchListings(),
    fetchPropertyTypes(),
    fetchCancellationPolicies(),
  ]);
  const lookups: Lookups = {
    propertyTypes: new Map(propertyTypes.map((p) => [p.id, p.name])),
    cancellationPolicies,
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
     VALUES (?, ?, ?, 'sync', ?, 'Sync Hostaway')
     ON CONFLICT (property_id, field_key) DO UPDATE SET value = excluded.value, source = 'sync',
       updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  );
  const upsertPlatform = db.prepare(
    `INSERT INTO property_platforms (property_id, platform_id, listed, url, source, updated_at)
     VALUES (?, ?, ?, ?, 'sync', ?)
     ON CONFLICT (property_id, platform_id) DO UPDATE SET listed = excluded.listed, url = excluded.url,
       source = 'sync', updated_at = excluded.updated_at`,
  );

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
      let changed = 0;
      for (const [key, value] of Object.entries(values)) {
        const encoded = value === null || value === undefined ? null : JSON.stringify(value);
        if (before.has(key) && before.get(key) === encoded) continue;
        upsertValue.run(propertyId, key, encoded, now);
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
  });

  return summary;
}
