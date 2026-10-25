import type {
  FacetCount,
  FacetsResponse,
  FieldValue,
  ListQuery,
  ListResponse,
  PlatformBadge,
  PropertyDetail,
  PropertySummary,
} from '@repo/shared';
import { db } from './db.ts';

// Reads for the main app. The portfolio is small (~130 rows), so filtering runs in
// memory over one query; every output (list, CSV, PDF) goes through `applyFilter`.

interface Row {
  id: number;
  hostaway_id: number | null;
  name: string;
  summary: string | null;
  city: string | null;
  tags: string;
  photo_url: string | null;
  photo_count: number | null;
  archived: number;
  hidden: number;
  search_text: string;
  updated_at: string;
  synced_at: string | null;
  photo_source: 'hostaway' | 'upload';
  created_by: string | null;
}

interface PlatformRow {
  id: number;
  key: string;
  name: string;
  icon: string | null;
}

// Bubble initials for platforms without an icon. The house's own abbreviations where they exist;
// otherwise derived from the name and made unique, so two platforms never share a bubble.
const KNOWN_INITIALS: Record<string, string> = {
  airbnb: 'A',
  bookingcom: 'BDC',
  vrbo: 'V',
  blueground: 'BG',
  silverdoor: 'SD',
};

function deriveInitials(name: string): string {
  const words = name.replace(/\.[a-z]+$/i, '').split(/[\s.-]+/).filter(Boolean);
  return (words.length > 1 ? words.map((w) => w[0]).join('') : name.slice(0, 2)).toUpperCase().slice(0, 3);
}

export function initialsFor(platforms: Pick<PlatformRow, 'key' | 'name'>[]): Map<string, string> {
  const out = new Map<string, string>();
  const used = new Set<string>();
  for (const p of platforms) {
    let ini = KNOWN_INITIALS[p.key] ?? deriveInitials(p.name);
    const letters = p.name.replace(/[^a-z]/gi, '').toUpperCase();
    for (let i = 2; used.has(ini) && i <= letters.length; i++) ini = letters.slice(0, i).slice(0, 1) + letters[i - 1];
    used.add(ini);
    out.set(p.key, ini);
  }
  return out;
}

export function activePlatforms(): PlatformRow[] {
  return db.prepare('SELECT id, key, name, icon FROM platforms WHERE retired = 0 ORDER BY sort_order, name').all() as unknown as PlatformRow[];
}

function listedPlatforms(platforms: PlatformRow[]): Map<number, PlatformBadge[]> {
  const byId = new Map(platforms.map((p) => [p.id, p]));
  const initials = initialsFor(platforms);
  const rows = db
    .prepare('SELECT property_id, platform_id, url FROM property_platforms WHERE listed = 1')
    .all() as { property_id: number; platform_id: number; url: string | null }[];
  const out = new Map<number, PlatformBadge[]>();
  for (const r of rows) {
    const p = byId.get(r.platform_id);
    if (!p) continue;
    const list = out.get(r.property_id) ?? [];
    list.push({ key: p.key, name: p.name, initials: initials.get(p.key)!, icon: p.icon, url: r.url });
    out.set(r.property_id, list);
  }
  const order = new Map(platforms.map((p, i) => [p.key, i]));
  for (const list of out.values()) list.sort((a, b) => order.get(a.key)! - order.get(b.key)!);
  return out;
}

export function loadSummaries(): (PropertySummary & {
  searchText: string;
  updatedAt: string;
  syncedAt: string | null;
  photoSource: 'hostaway' | 'upload';
  createdBy: string | null;
})[] {
  const listed = listedPlatforms(activePlatforms());
  const rows = db.prepare('SELECT * FROM properties').all() as unknown as Row[];
  return rows.map((r) => ({
    id: r.id,
    hostawayId: r.hostaway_id,
    name: r.name,
    summary: r.summary,
    photoUrl: r.photo_url,
    photoCount: r.photo_count,
    city: r.city,
    tags: JSON.parse(r.tags) as string[],
    platforms: listed.get(r.id) ?? [],
    archived: r.archived === 1,
    removed: r.hidden === 1,
    searchText: r.search_text,
    updatedAt: r.updated_at,
    syncedAt: r.synced_at,
    photoSource: r.photo_source,
    createdBy: r.created_by,
  }));
}

export type Summary = ReturnType<typeof loadSummaries>[number];

export const hasActiveTag = (p: Pick<Summary, 'tags'>) => p.tags.some((t) => t.toLowerCase() === 'active');

const removedFilter = (p: Summary, mode: ListQuery['removed']) =>
  mode === 'all' ? true : mode === 'only' ? p.removed : !p.removed;

export const collator = new Intl.Collator('en-AU', { numeric: true, sensitivity: 'base' });
/** Sort on the name without owner-group prefixes like "[BLUEMO] ". */
export const sortName = (name: string) => name.replace(/^(\[[^\]]*\]\s*)+/, '');

export function matchesSearch(p: Summary, q: string | undefined) {
  if (!q) return true;
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((word) => p.searchText.includes(word));
}

export function applyFilter(all: Summary[], q: ListQuery): Summary[] {
  return all
    .filter((p) => removedFilter(p, q.removed))
    .filter((p) => (q.archivedOnly ? p.archived : q.includeArchived || q.removed === 'only' || !p.archived))
    .filter((p) => !q.manualOnly || p.hostawayId === null)
    .filter((p) => !q.activeOnly || hasActiveTag(p))
    .filter((p) => matchesSearch(p, q.q))
    .filter((p) => {
      if (q.platforms.length === 0 && !q.notListed) return true;
      const keys = new Set(p.platforms.map((b) => b.key));
      return (q.notListed && keys.size === 0) || q.platforms.some((k) => keys.has(k));
    })
    .filter((p) => q.tags.length === 0 || q.tags.every((t) => p.tags.includes(t)))
    .filter((p) => q.cities.length === 0 || (p.city !== null && q.cities.includes(p.city)))
    .sort((a, b) =>
      q.sort === 'recent' ? b.updatedAt.localeCompare(a.updatedAt) : collator.compare(sortName(a.name), sortName(b.name)),
    );
}

const publicSummary = ({
  searchText: _s,
  updatedAt: _u,
  syncedAt: _y,
  photoSource: _p,
  createdBy: _c,
  ...rest
}: Summary): PropertySummary => rest;

export function listProperties(q: ListQuery): ListResponse {
  const filtered = applyFilter(loadSummaries(), q);
  const pageCount = Math.max(1, Math.ceil(filtered.length / q.pageSize));
  const page = Math.min(q.page, pageCount);
  const items = filtered.slice((page - 1) * q.pageSize, page * q.pageSize).map(publicSummary);
  return { items, total: filtered.length, page, pageSize: q.pageSize, pageCount };
}

const count = (values: Iterable<string>, label: (v: string) => string = (v) => v): FacetCount[] => {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m].map(([value, n]) => ({ value, label: label(value), count: n }));
};

/** Counts for the filter row, over properties matching the search and archive toggle. */
export function facets(q: Pick<ListQuery, 'q' | 'includeArchived' | 'removed'>): FacetsResponse {
  const base = loadSummaries()
    .filter((p) => removedFilter(p, q.removed))
    .filter((p) => q.includeArchived || q.removed === 'only' || !p.archived)
    .filter((p) => matchesSearch(p, q.q));
  const platformNames = new Map(activePlatforms().map((p) => [p.key, p.name]));
  const platformCounts = count(base.flatMap((p) => p.platforms.map((b) => b.key)), (k) => platformNames.get(k) ?? k);
  const order = [...platformNames.keys()];
  return {
    total: base.length,
    platforms: order.map(
      (k) => platformCounts.find((c) => c.value === k) ?? { value: k, label: platformNames.get(k)!, count: 0 },
    ),
    notListed: base.filter((p) => p.platforms.length === 0).length,
    cities: count(base.flatMap((p) => (p.city ? [p.city] : []))).sort((a, b) => b.count - a.count),
    tags: count(base.flatMap((p) => p.tags)).sort((a, b) => b.count - a.count || collator.compare(a.label, b.label)),
  };
}

export function getProperty(id: number, opts: { includeRemoved?: boolean } = {}): PropertyDetail | null {
  const summary = loadSummaries().find((p) => p.id === id);
  if (!summary || (summary.removed && !opts.includeRemoved)) return null;
  const rows = db
    .prepare('SELECT field_key, value, source, updated_at, updated_by FROM field_values WHERE property_id = ?')
    .all(id) as { field_key: string; value: string | null; source: FieldValue['source']; updated_at: string; updated_by: string | null }[];
  const values: Record<string, FieldValue> = {};
  for (const r of rows) {
    values[r.field_key] = {
      value: r.value === null ? null : JSON.parse(r.value),
      source: r.source,
      updatedAt: r.updated_at,
      updatedBy: r.updated_by,
    };
  }
  return {
    ...publicSummary(summary),
    values,
    lastSyncedAt: summary.syncedAt,
    photoSource: summary.photoSource,
    createdBy: summary.createdBy,
  };
}
