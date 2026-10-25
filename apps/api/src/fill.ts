import { createHash, randomBytes } from 'node:crypto';
import { FIELD_BY_KEY, FIELDS, fieldValueSchemas, formatValue } from '@repo/shared';
import { Hono, type MiddlewareHandler } from 'hono';
import { z } from 'zod';
import { db, transaction } from './db.ts';

// The Claude fill: an access token lets a script fill the fields Hostaway's API doesn't return
// (source "dashboard"), many properties per request, with a dry run. Nothing else is writable.

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const now = () => new Date().toISOString();
const TOKEN_PREFIX = 'lrt_';

export const DASHBOARD_FIELDS = FIELDS.filter((f) => f.source === 'dashboard' && !f.hidden);
const DASHBOARD_KEYS = new Set(DASHBOARD_FIELDS.map((f) => f.key));

// ---------------------------------------------------------------- tokens (managed by admins)

export interface ApiToken {
  id: number;
  name: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export function listTokens(): ApiToken[] {
  return (db.prepare('SELECT id, name, created_by, created_at, last_used_at, revoked_at FROM api_tokens ORDER BY id DESC').all() as {
    id: number;
    name: string;
    created_by: string;
    created_at: string;
    last_used_at: string | null;
    revoked_at: string | null;
  }[]).map((r) => ({ id: r.id, name: r.name, createdBy: r.created_by, createdAt: r.created_at, lastUsedAt: r.last_used_at, revokedAt: r.revoked_at }));
}

/** Returns the token itself once; only its hash is kept. */
export function createToken(name: string, createdBy: string): string {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`;
  db.prepare('INSERT INTO api_tokens (name, token_hash, created_by, created_at) VALUES (?, ?, ?, ?)').run(name, sha256(token), createdBy, now());
  return token;
}

export function revokeToken(id: number): boolean {
  return db.prepare('UPDATE api_tokens SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL').run(now(), id).changes > 0;
}

// ---------------------------------------------------------------- the fill API (token holders)

type FillEnv = { Variables: { tokenName: string } };

const requireToken: MiddlewareHandler<FillEnv> = async (c, next) => {
  const header = c.req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token.startsWith(TOKEN_PREFIX)) return c.json({ error: 'Send an access token as "Authorization: Bearer <token>".' }, 401);
  const row = db.prepare('SELECT id, name FROM api_tokens WHERE token_hash = ? AND revoked_at IS NULL').get(sha256(token)) as
    | { id: number; name: string }
    | undefined;
  if (!row) return c.json({ error: 'This access token is not valid or was cancelled.' }, 401);
  db.prepare('UPDATE api_tokens SET last_used_at = ? WHERE id = ?').run(now(), row.id);
  c.set('tokenName', row.name);
  await next();
};

export const fill = new Hono<FillEnv>();
fill.use('*', requireToken);

/** The fields this token may fill, with their types. */
fill.get('/fields', (c) =>
  c.json(DASHBOARD_FIELDS.map((f) => ({ key: f.key, label: f.label, section: f.section, group: f.group ?? null, type: f.type, platform: f.platform ?? null }))),
);

interface PropertyRow {
  id: number;
  hostaway_id: number | null;
  name: string;
}

/** Properties in the repo (not removed), each with the dashboard fields still empty. */
fill.get('/properties', (c) => {
  const props = db.prepare('SELECT id, hostaway_id, name FROM properties WHERE hidden = 0 ORDER BY id').all() as unknown as PropertyRow[];
  const filled = new Map<number, Set<string>>();
  const rows = db
    .prepare(`SELECT property_id, field_key, value FROM field_values WHERE field_key IN (${[...DASHBOARD_KEYS].map(() => '?').join(',')})`)
    .all(...DASHBOARD_KEYS) as { property_id: number; field_key: string; value: string | null }[];
  for (const r of rows) {
    const def = FIELD_BY_KEY.get(r.field_key)!;
    if (r.value !== null && formatValue(def, JSON.parse(r.value)) !== null) {
      filled.set(r.property_id, (filled.get(r.property_id) ?? new Set()).add(r.field_key));
    }
  }
  return c.json(
    props.map((p) => ({
      id: p.id,
      hostawayId: p.hostaway_id,
      name: p.name,
      missing: [...DASHBOARD_KEYS].filter((k) => !filled.get(p.id)?.has(k)),
    })),
  );
});

const batchSchema = z.object({
  /** true: report what would change, save nothing. */
  dryRun: z.boolean().default(true),
  /** false (default): never replace a value an admin typed by hand. */
  overwriteAdmin: z.boolean().default(false),
  items: z
    .array(
      z
        .object({
          id: z.number().int().optional(),
          hostawayId: z.number().int().optional(),
          values: z.record(z.string(), z.unknown()),
        })
        .refine((i) => i.id !== undefined || i.hostawayId !== undefined, 'Give each item an id or a hostawayId.'),
    )
    .min(1)
    .max(200),
});

interface ItemResult {
  ref: { id?: number; hostawayId?: number };
  propertyId: number | null;
  changes: { field: string; from: unknown; to: unknown }[];
  unchanged: string[];
  skipped: { field: string; reason: string }[];
  errors: string[];
}

fill.post('/batch', async (c) => {
  const parsed = batchSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid batch.' }, 400);
  const { dryRun, overwriteAdmin, items } = parsed.data;
  const by = c.get('tokenName');

  const findById = db.prepare('SELECT id FROM properties WHERE id = ? AND hidden = 0');
  const findByHostaway = db.prepare('SELECT id FROM properties WHERE hostaway_id = ? AND hidden = 0');
  const current = db.prepare('SELECT value, source FROM field_values WHERE property_id = ? AND field_key = ?');
  const upsert = db.prepare(
    `INSERT INTO field_values (property_id, field_key, value, source, updated_at, updated_by) VALUES (?, ?, ?, 'claude', ?, ?)
     ON CONFLICT (property_id, field_key) DO UPDATE SET value = excluded.value, source = 'claude',
       updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  );
  const touch = db.prepare('UPDATE properties SET updated_at = ? WHERE id = ?');

  const results: ItemResult[] = [];
  const writes: [number, string, string | null][] = [];

  for (const item of items) {
    const result: ItemResult = { ref: { id: item.id, hostawayId: item.hostawayId }, propertyId: null, changes: [], unchanged: [], skipped: [], errors: [] };
    results.push(result);
    const found = (item.id !== undefined ? findById.get(item.id) : findByHostaway.get(item.hostawayId!)) as { id: number } | undefined;
    if (!found) {
      result.errors.push('No such property in the repo (or it was removed).');
      continue;
    }
    result.propertyId = found.id;
    for (const [key, raw] of Object.entries(item.values)) {
      const def = FIELD_BY_KEY.get(key);
      if (!def || !DASHBOARD_KEYS.has(key)) {
        result.skipped.push({ field: key, reason: 'Not a dashboard-only field; tokens can only fill those.' });
        continue;
      }
      const checked = fieldValueSchemas[def.type].safeParse(raw);
      if (!checked.success) {
        result.errors.push(`${key}: ${checked.error.issues[0]?.message ?? 'invalid value'}`);
        continue;
      }
      const v = checked.data;
      const encoded = v === null || v === '' || (Array.isArray(v) && v.length === 0) ? null : JSON.stringify(v);
      const existing = current.get(found.id, key) as { value: string | null; source: string } | undefined;
      if (existing?.source === 'admin' && !overwriteAdmin) {
        result.skipped.push({ field: key, reason: 'An admin set this by hand; left as is.' });
        continue;
      }
      if ((existing?.value ?? null) === encoded) {
        result.unchanged.push(key);
        continue;
      }
      result.changes.push({ field: key, from: existing?.value ? JSON.parse(existing.value) : null, to: encoded ? JSON.parse(encoded) : null });
      writes.push([found.id, key, encoded]);
    }
  }

  if (!dryRun && writes.length > 0) {
    transaction(() => {
      const at = now();
      for (const [id, key, encoded] of writes) upsert.run(id, key, encoded, at, by);
      for (const id of new Set(writes.map((w) => w[0]))) touch.run(at, id);
    });
  }

  return c.json({
    dryRun,
    saved: dryRun ? 0 : writes.length,
    wouldSave: writes.length,
    results,
  });
});
