import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import {
  FIELD_BY_KEY,
  fieldValueSchemas,
  listQuerySchema,
  PDF_MAX_COLUMNS,
  reportQuerySchema,
  usernameSchema,
  type AdminAccount,
  type AdminPlatform,
  type OverviewResponse,
  type SyncRun,
  type SyncSummary,
} from '@repo/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import { changePassword, currentAdmin, MIN_PASSWORD, requireAdmin, type AdminEnv } from './auth.ts';
import { config } from './config.ts';
import { db, transaction } from './db.ts';
import { hashPassword } from './passwords.ts';
import { createToken, DASHBOARD_FIELDS, listTokens, revokeToken } from './fill.ts';
import { toPdf } from './pdf.ts';
import { buildReport, toCsv } from './reports.ts';
import { facets, getProperty, hasActiveTag, initialsFor, listProperties, loadSummaries } from './properties.ts';
import { syncHostaway } from './sync.ts';

export const admin = new Hono<AdminEnv>();
admin.use('*', requireAdmin);

const now = () => new Date().toISOString();
const bad = (message: string) => ({ error: message });

// ---------------------------------------------------------------- overview and sync

let syncing = false;

function lastSyncRun(): SyncRun | null {
  const r = db.prepare('SELECT * FROM sync_runs ORDER BY id DESC LIMIT 1').get() as
    | { started_at: string; finished_at: string | null; started_by: string | null; summary: string | null; error: string | null }
    | undefined;
  if (!r) return null;
  return {
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    startedBy: r.started_by,
    summary: r.summary ? (JSON.parse(r.summary) as SyncSummary) : null,
    error: r.error,
  };
}

admin.get('/overview', (c) => {
  const all = loadSummaries();
  const kept = all.filter((p) => !p.removed);
  const body: OverviewResponse = {
    total: kept.length,
    active: kept.filter(hasActiveTag).length,
    notListed: kept.filter((p) => !p.archived && p.platforms.length === 0).length,
    archived: kept.filter((p) => p.archived).length,
    addedByHand: kept.filter((p) => p.hostawayId === null).length,
    removed: all.length - kept.length,
    lastSync: lastSyncRun(),
    syncing,
  };
  return c.json(body);
});

admin.post('/sync', async (c) => {
  if (syncing) return c.json(bad('A sync is already running.'), 409);
  syncing = true;
  const { username } = c.get('admin');
  const runId = (db.prepare('INSERT INTO sync_runs (started_at, started_by) VALUES (?, ?) RETURNING id').get(now(), username) as { id: number }).id;
  try {
    const summary = await syncHostaway();
    db.prepare('UPDATE sync_runs SET finished_at = ?, summary = ? WHERE id = ?').run(now(), JSON.stringify(summary), runId);
    return c.json(lastSyncRun());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    db.prepare('UPDATE sync_runs SET finished_at = ?, error = ? WHERE id = ?').run(now(), message, runId);
    return c.json(bad(`Sync failed: ${message}`), 502);
  } finally {
    syncing = false;
  }
});

// ---------------------------------------------------------------- properties

admin.get('/properties', (c) => {
  const parsed = listQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json(bad('Invalid filter'), 400);
  return c.json(listProperties(parsed.data));
});

admin.get('/facets', (c) => {
  const parsed = listQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json(bad('Invalid filter'), 400);
  return c.json(facets(parsed.data));
});

function propertyId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id)) return null;
  return db.prepare('SELECT 1 FROM properties WHERE id = ?').get(id) ? id : null;
}

admin.get('/properties/:id', (c) => {
  const id = propertyId(c.req.param('id'));
  const p = id === null ? null : getProperty(id, { includeRemoved: true });
  return p ? c.json(p) : c.json(bad('Property not found'), 404);
});

/** Keep the list columns (name, area, tags, summary, search text) in step with field values. */
function refreshSummary(id: number) {
  const values = Object.fromEntries(
    (db.prepare('SELECT field_key, value FROM field_values WHERE property_id = ?').all(id) as { field_key: string; value: string | null }[]).map(
      (r) => [r.field_key, r.value === null ? null : JSON.parse(r.value)],
    ),
  ) as Record<string, unknown>;
  const row = db.prepare('SELECT hostaway_id, name FROM properties WHERE id = ?').get(id) as { hostaway_id: number | null; name: string };
  const name = (values.internalName as string | null) ?? (values.externalName as string | null) ?? row.name;
  const tags = Array.isArray(values.tags) ? (values.tags as string[]) : [];
  const description = (values.description as string | null) ?? null;
  const flat = description?.replace(/\s+/g, ' ').trim() ?? null;
  const summary = flat && flat.length > 220 ? `${flat.slice(0, flat.lastIndexOf(' ', 220))}…` : flat;
  const search = [row.hostaway_id, name, values.externalName, values.address, values.city, ...tags].filter(Boolean).join(' ').toLowerCase();
  db.prepare('UPDATE properties SET name = ?, city = ?, tags = ?, summary = ?, search_text = ?, updated_at = ? WHERE id = ?').run(
    name,
    (values.city as string | null) ?? null,
    JSON.stringify(tags),
    summary,
    search,
    now(),
    id,
  );
}

const fieldPatch = z.object({ values: z.record(z.string(), z.unknown()) });

admin.patch('/properties/:id/fields', async (c) => {
  const id = propertyId(c.req.param('id'));
  if (id === null) return c.json(bad('Property not found'), 404);
  const parsed = fieldPatch.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json(bad('Send the changed values as { values: { field: value } }.'), 400);

  const { hostaway_id } = db.prepare('SELECT hostaway_id FROM properties WHERE id = ?').get(id) as { hostaway_id: number | null };
  const clean: [string, string | null][] = [];
  for (const [key, raw] of Object.entries(parsed.data.values)) {
    const def = FIELD_BY_KEY.get(key);
    if (!def) return c.json(bad(`Unknown field “${key}”.`), 400);
    if (def.source === 'hostaway' && hostaway_id !== null) {
      return c.json(bad(`${def.label} comes from Hostaway. Change it there, then run Sync Hostaway.`), 403);
    }
    const value = fieldValueSchemas[def.type].safeParse(raw);
    if (!value.success) return c.json(bad(`${def.label}: ${value.error.issues[0]?.message ?? 'not a valid value'}.`), 400);
    const v = value.data;
    clean.push([key, v === null || v === '' || (Array.isArray(v) && v.length === 0) ? null : JSON.stringify(v)]);
  }

  const { username } = c.get('admin');
  const upsert = db.prepare(
    `INSERT INTO field_values (property_id, field_key, value, source, updated_at, updated_by) VALUES (?, ?, ?, 'admin', ?, ?)
     ON CONFLICT (property_id, field_key) DO UPDATE SET value = excluded.value, source = 'admin',
       updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  );
  transaction(() => {
    const at = now();
    for (const [key, encoded] of clean) upsert.run(id, key, encoded, at, username);
    refreshSummary(id);
  });
  return c.json(getProperty(id, { includeRemoved: true }));
});

admin.post('/properties/:id/remove', (c) => {
  const id = propertyId(c.req.param('id'));
  if (id === null) return c.json(bad('Property not found'), 404);
  db.prepare('UPDATE properties SET hidden = 1, updated_at = ? WHERE id = ?').run(now(), id);
  return c.json(getProperty(id, { includeRemoved: true }));
});

admin.post('/properties/:id/restore', (c) => {
  const id = propertyId(c.req.param('id'));
  if (id === null) return c.json(bad('Property not found'), 404);
  db.prepare('UPDATE properties SET hidden = 0, updated_at = ? WHERE id = ?').run(now(), id);
  return c.json(getProperty(id, { includeRemoved: true }));
});

const newProperty = z.object({ name: z.string().trim().min(2, 'Give the property a name.').max(300) });

admin.post('/properties', async (c) => {
  const parsed = newProperty.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json(bad(parsed.error.issues[0]?.message ?? 'Give the property a name.'), 400);
  const { username } = c.get('admin');
  const id = transaction(() => {
    const at = now();
    const { id } = db
      .prepare('INSERT INTO properties (name, search_text, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?) RETURNING id')
      .get(parsed.data.name, parsed.data.name.toLowerCase(), username, at, at) as { id: number };
    db.prepare(
      "INSERT INTO field_values (property_id, field_key, value, source, updated_at, updated_by) VALUES (?, 'internalName', ?, 'admin', ?, ?)",
    ).run(id, JSON.stringify(parsed.data.name), at, username);
    return id;
  });
  return c.json(getProperty(id), 201);
});

// ---------------------------------------------------------------- access tokens and missing fields

admin.get('/tokens', (c) => c.json(listTokens()));

admin.post('/tokens', async (c) => {
  const parsed = z.object({ name: z.string().trim().min(2, 'Name the token, e.g. "Claude fill".').max(60) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json(bad(parsed.error.issues[0]?.message ?? 'Name the token.'), 400);
  const token = createToken(parsed.data.name, c.get('admin').username);
  return c.json({ token, tokens: listTokens() }, 201);
});

admin.post('/tokens/:id/revoke', (c) => {
  if (!revokeToken(Number(c.req.param('id')))) return c.json(bad('Token not found or already cancelled.'), 404);
  return c.json(listTokens());
});

/**
 * How complete the dashboard-only fields are. A field counts only for properties it applies to:
 * a platform field only where the property is listed on that platform. Archived and removed are left out.
 */
admin.get('/missing', (c) => {
  const props = loadSummaries().filter((p) => !p.removed && !p.archived);
  const keys = DASHBOARD_FIELDS.map((f) => f.key);
  const filled = new Set(
    (db
      .prepare(`SELECT property_id, field_key FROM field_values WHERE value IS NOT NULL AND field_key IN (${keys.map(() => '?').join(',')})`)
      .all(...keys) as { property_id: number; field_key: string }[]).map((r) => `${r.property_id}:${r.field_key}`),
  );
  const perProperty = new Map<number, number>();
  const fields = DASHBOARD_FIELDS.map((f) => {
    const applicable = props.filter((p) => !f.platform || p.platforms.some((b) => b.key === f.platform));
    const missing = applicable.filter((p) => !filled.has(`${p.id}:${f.key}`));
    for (const p of missing) perProperty.set(p.id, (perProperty.get(p.id) ?? 0) + 1);
    return { key: f.key, label: f.label, section: f.section, group: f.group ?? null, applicable: applicable.length, missing: missing.length };
  });
  const properties = props
    .map((p) => ({ id: p.id, name: p.name, hostawayId: p.hostawayId, missing: perProperty.get(p.id) ?? 0 }))
    .filter((p) => p.missing > 0)
    .sort((a, b) => b.missing - a.missing);
  const totalSlots = fields.reduce((a, f) => a + f.applicable, 0);
  const totalMissing = fields.reduce((a, f) => a + f.missing, 0);
  return c.json({ totalSlots, totalMissing, fields, properties });
});

// ---------------------------------------------------------------- reports

const PREVIEW_ROWS = 25;
const reportName = (ext: string) => `listing-repo-report-${new Date().toISOString().slice(0, 10)}.${ext}`;

admin.get('/reports/preview', (c) => {
  const parsed = reportQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json(bad('Invalid report filter'), 400);
  return c.json(buildReport(parsed.data, { limit: PREVIEW_ROWS }));
});

admin.get('/reports/csv', (c) => {
  const parsed = reportQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json(bad('Invalid report filter'), 400);
  return c.body(toCsv(buildReport(parsed.data)), 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${reportName('csv')}"`,
    'Cache-Control': 'no-store',
  });
});

admin.get('/reports/pdf', async (c) => {
  const parsed = reportQuerySchema.safeParse(c.req.query());
  if (!parsed.success) return c.json(bad('Invalid report filter'), 400);
  const report = buildReport(parsed.data);
  if (report.columns.length > PDF_MAX_COLUMNS) {
    return c.json(bad(`A PDF fits up to ${PDF_MAX_COLUMNS} columns. Choose fewer, or download the CSV.`), 400);
  }
  const pdf = await toPdf(report, c.get('admin').username);
  return c.body(new Uint8Array(pdf), 200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${reportName('pdf')}"`,
    'Cache-Control': 'no-store',
  });
});

// ---------------------------------------------------------------- display photo (properties added by hand)

const PHOTO_TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  'image/webp': { ext: 'webp', magic: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
  'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
};
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
mkdirSync(config.photosDir, { recursive: true });

// The browser resizes the chosen display photo before upload; the server stores only that one file
// and the number of photos the admin selected.
admin.post('/properties/:id/photo', async (c) => {
  const id = propertyId(c.req.param('id'));
  if (id === null) return c.json(bad('Property not found'), 404);
  const prop = db.prepare('SELECT hostaway_id, photo_url, photo_source FROM properties WHERE id = ?').get(id) as {
    hostaway_id: number | null;
    photo_url: string | null;
    photo_source: string;
  };
  if (prop.hostaway_id !== null) return c.json(bad('Photos of Hostaway listings come from Hostaway.'), 403);

  const form = await c.req.parseBody().catch(() => null);
  const file = form?.photo;
  const count = Number(form?.count);
  if (!(file instanceof File)) return c.json(bad('Choose a photo to upload.'), 400);
  if (!Number.isInteger(count) || count < 1 || count > 500) return c.json(bad('The photo count is missing.'), 400);
  const type = PHOTO_TYPES[file.type];
  if (!type) return c.json(bad('Use a JPEG, PNG or WebP photo.'), 415);
  if (file.size > MAX_PHOTO_BYTES) return c.json(bad('That photo is over 5 MB after resizing.'), 413);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!type.magic(bytes)) return c.json(bad('That file isn’t a valid image.'), 415);

  const name = `${id}-${randomBytes(6).toString('hex')}.${type.ext}`;
  await writeFile(resolve(config.photosDir, name), bytes);
  const { username } = c.get('admin');
  transaction(() => {
    db.prepare("UPDATE properties SET photo_url = ?, photo_source = 'upload', photo_count = ?, updated_at = ? WHERE id = ?").run(
      `/photos/${name}`,
      count,
      now(),
      id,
    );
    db.prepare(
      `INSERT INTO field_values (property_id, field_key, value, source, updated_at, updated_by) VALUES (?, 'photoCount', ?, 'admin', ?, ?)
       ON CONFLICT (property_id, field_key) DO UPDATE SET value = excluded.value, source = 'admin', updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ).run(id, JSON.stringify(count), now(), username);
  });
  if (prop.photo_source === 'upload' && prop.photo_url?.startsWith('/photos/')) {
    await unlink(resolve(config.photosDir, basename(prop.photo_url))).catch(() => {});
  }
  return c.json(getProperty(id, { includeRemoved: true }));
});

// ---------------------------------------------------------------- platforms

interface PlatformRow {
  id: number;
  key: string;
  name: string;
  kind: 'hostaway' | 'manual';
  retired: number;
}

function adminPlatforms(): AdminPlatform[] {
  const rows = db.prepare('SELECT id, key, name, kind, retired FROM platforms ORDER BY sort_order, name').all() as unknown as PlatformRow[];
  const counts = new Map(
    (db
      .prepare(
        'SELECT pp.platform_id AS id, COUNT(*) AS n FROM property_platforms pp JOIN properties p ON p.id = pp.property_id WHERE pp.listed = 1 AND p.hidden = 0 GROUP BY pp.platform_id',
      )
      .all() as { id: number; n: number }[]).map((r) => [r.id, r.n]),
  );
  const initials = initialsFor(rows);
  return rows.map((r) => ({
    key: r.key,
    name: r.name,
    kind: r.kind,
    initials: initials.get(r.key)!,
    retired: r.retired === 1,
    listedCount: counts.get(r.id) ?? 0,
  }));
}

admin.get('/platforms', (c) => c.json(adminPlatforms()));

const newPlatform = z.object({ name: z.string().trim().min(2, 'Give the platform a name.').max(60) });

admin.post('/platforms', async (c) => {
  const parsed = newPlatform.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json(bad(parsed.error.issues[0]?.message ?? 'Give the platform a name.'), 400);
  const name = parsed.data.name;
  if (db.prepare('SELECT 1 FROM platforms WHERE name = ? COLLATE NOCASE').get(name)) return c.json(bad(`${name} already exists.`), 409);
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'platform';
  let key = base;
  for (let i = 2; db.prepare('SELECT 1 FROM platforms WHERE key = ?').get(key); i++) key = `${base}${i}`;
  const { n } = db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM platforms').get() as { n: number };
  db.prepare("INSERT INTO platforms (key, name, kind, sort_order) VALUES (?, ?, 'manual', ?)").run(key, name, n);
  return c.json(adminPlatforms(), 201);
});

const platformPatch = z.object({ name: z.string().trim().min(2).max(60).optional(), retired: z.boolean().optional() });

admin.patch('/platforms/:key', async (c) => {
  const row = db.prepare('SELECT kind FROM platforms WHERE key = ?').get(c.req.param('key')) as { kind: string } | undefined;
  if (!row) return c.json(bad('Platform not found'), 404);
  if (row.kind === 'hostaway') return c.json(bad('Hostaway platforms are fixed; their status comes from Sync Hostaway.'), 403);
  const parsed = platformPatch.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json(bad('Invalid change.'), 400);
  if (parsed.data.name) db.prepare('UPDATE platforms SET name = ? WHERE key = ?').run(parsed.data.name, c.req.param('key'));
  if (parsed.data.retired !== undefined) {
    db.prepare('UPDATE platforms SET retired = ? WHERE key = ?').run(parsed.data.retired ? 1 : 0, c.req.param('key'));
  }
  return c.json(adminPlatforms());
});

const listing = z.object({ listed: z.boolean(), url: z.string().trim().url('Use a full link, starting with https://').max(500).nullable().optional() });

/** Tick a platform on a property: manual platforms anywhere; Hostaway platforms only on properties added by hand. */
admin.put('/properties/:id/platforms/:key', async (c) => {
  const id = propertyId(c.req.param('id'));
  if (id === null) return c.json(bad('Property not found'), 404);
  const platform = db.prepare('SELECT id, kind, name FROM platforms WHERE key = ? AND retired = 0').get(c.req.param('key')) as
    | { id: number; kind: string; name: string }
    | undefined;
  if (!platform) return c.json(bad('Platform not found'), 404);
  const { hostaway_id } = db.prepare('SELECT hostaway_id FROM properties WHERE id = ?').get(id) as { hostaway_id: number | null };
  if (platform.kind === 'hostaway' && hostaway_id !== null) {
    return c.json(bad(`${platform.name} status comes from Hostaway. Change it there, then run Sync Hostaway.`), 403);
  }
  const parsed = listing.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json(bad(parsed.error.issues[0]?.message ?? 'Invalid change.'), 400);
  db.prepare(
    `INSERT INTO property_platforms (property_id, platform_id, listed, url, source, updated_at) VALUES (?, ?, ?, ?, 'admin', ?)
     ON CONFLICT (property_id, platform_id) DO UPDATE SET listed = excluded.listed, url = excluded.url, source = 'admin', updated_at = excluded.updated_at`,
  ).run(id, platform.id, parsed.data.listed ? 1 : 0, parsed.data.url ?? null, now());
  db.prepare('UPDATE properties SET updated_at = ? WHERE id = ?').run(now(), id);
  return c.json(getProperty(id, { includeRemoved: true }));
});

// ---------------------------------------------------------------- admin accounts

function accounts(selfId: number): AdminAccount[] {
  return (db.prepare('SELECT id, username, must_change_password, created_at, last_sign_in_at FROM admins ORDER BY username').all() as {
    id: number;
    username: string;
    must_change_password: number;
    created_at: string;
    last_sign_in_at: string | null;
  }[]).map((r) => ({
    id: r.id,
    username: r.username,
    mustChangePassword: r.must_change_password === 1,
    createdAt: r.created_at,
    lastSignInAt: r.last_sign_in_at,
    isYou: r.id === selfId,
  }));
}

const startingPassword = z.string().min(MIN_PASSWORD, `Use at least ${MIN_PASSWORD} characters.`).max(200);

admin.get('/accounts', (c) => c.json(accounts(c.get('admin').id)));

admin.post('/accounts', async (c) => {
  const parsed = z.object({ username: usernameSchema, password: startingPassword }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json(bad(parsed.error.issues[0]?.message ?? 'Invalid account.'), 400);
  if (db.prepare('SELECT 1 FROM admins WHERE username = ?').get(parsed.data.username)) {
    return c.json(bad(`${parsed.data.username} already exists.`), 409);
  }
  db.prepare('INSERT INTO admins (username, password_hash, must_change_password) VALUES (?, ?, 1)').run(
    parsed.data.username,
    await hashPassword(parsed.data.password),
  );
  return c.json(accounts(c.get('admin').id), 201);
});

admin.post('/accounts/:id/reset', async (c) => {
  const id = Number(c.req.param('id'));
  const parsed = z.object({ password: startingPassword }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json(bad(parsed.error.issues[0]?.message ?? 'Invalid password.'), 400);
  const result = db.prepare('UPDATE admins SET password_hash = ?, must_change_password = 1 WHERE id = ?').run(await hashPassword(parsed.data.password), id);
  if (!result.changes) return c.json(bad('Account not found'), 404);
  db.prepare('DELETE FROM sessions WHERE admin_id = ?').run(id);
  return c.json(accounts(c.get('admin').id));
});

admin.delete('/accounts/:id', (c) => {
  const id = Number(c.req.param('id'));
  if (id === c.get('admin').id) return c.json(bad('You can’t remove your own account.'), 400);
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM admins').get() as { n: number };
  if (n <= 1) return c.json(bad('The last admin can’t be removed.'), 400);
  const result = db.prepare('DELETE FROM admins WHERE id = ?').run(id);
  if (!result.changes) return c.json(bad('Account not found'), 404);
  return c.json(accounts(c.get('admin').id));
});

// ---------------------------------------------------------------- own password (also reachable while a change is required)

export const passwordRoute = new Hono();
passwordRoute.post('/', async (c) => {
  const me = currentAdmin(c);
  if (!me) return c.json(bad('Sign in to continue.'), 401);
  const parsed = z.object({ current: z.string().max(200), next: z.string().max(200) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json(bad('Fill in both passwords.'), 400);
  const problem = await changePassword(me, parsed.data.current, parsed.data.next);
  if (problem) return c.json(bad(problem), 400);
  return c.json({ username: me.username, mustChangePassword: false });
});
