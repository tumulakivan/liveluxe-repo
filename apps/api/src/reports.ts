import {
  FIELD_BY_KEY,
  formatValue,
  REPORT_COLUMN_BY_KEY,
  REPORT_PRESETS,
  type ReportColumn,
  type ReportQuery,
} from '@repo/shared';
import { db } from './db.ts';
import { activePlatforms, collator, hasActiveTag, loadSummaries, matchesSearch, sortName, type Summary } from './properties.ts';

// Reports (admin only): filter the repo, then lay out the chosen columns as plain text rows.
// The CSV and the PDF are both rendered from these rows, so they always agree with the preview.

export interface Report {
  total: number;
  columns: ReportColumn[];
  rows: string[][];
  filters: string[];
}

type Values = Map<number, Map<string, unknown>>;

function loadValues(ids: number[], keys: string[]): Values {
  const out: Values = new Map(ids.map((id) => [id, new Map()]));
  if (ids.length === 0 || keys.length === 0) return out;
  const rows = db
    .prepare(
      `SELECT property_id, field_key, value FROM field_values
       WHERE property_id IN (${ids.map(() => '?').join(',')}) AND field_key IN (${keys.map(() => '?').join(',')})`,
    )
    .all(...ids, ...keys) as { property_id: number; field_key: string; value: string | null }[];
  for (const r of rows) out.get(r.property_id)?.set(r.field_key, r.value === null ? null : JSON.parse(r.value));
  return out;
}

function isEmpty(key: string, value: unknown): boolean {
  const def = FIELD_BY_KEY.get(key);
  return !def || formatValue(def, value) === null;
}

function filter(q: ReportQuery): Summary[] {
  const base = loadSummaries()
    .filter((p) => !p.removed)
    .filter((p) => (q.archivedOnly ? p.archived : q.includeArchived || !p.archived))
    .filter((p) => !q.manualOnly || p.hostawayId === null)
    .filter((p) => !q.activeOnly || hasActiveTag(p))
    .filter((p) => matchesSearch(p, q.q))
    .filter((p) => {
      const keys = new Set(p.platforms.map((b) => b.key));
      if (q.notListed && keys.size > 0) return false;
      if (q.on.length > 0 && !(q.match === 'all' ? q.on.every((k) => keys.has(k)) : q.on.some((k) => keys.has(k)))) return false;
      return !q.notOn.some((k) => keys.has(k));
    })
    .filter((p) => q.cities.length === 0 || (p.city !== null && q.cities.includes(p.city)))
    .filter((p) => q.tags.length === 0 || q.tags.every((t) => p.tags.includes(t)));

  const emptyKeys = q.empty.filter((k) => FIELD_BY_KEY.has(k));
  if (emptyKeys.length === 0) return base;
  const values = loadValues(
    base.map((p) => p.id),
    emptyKeys,
  );
  return base.filter((p) => emptyKeys.every((k) => isEmpty(k, values.get(p.id)?.get(k))));
}

function describe(q: ReportQuery): string[] {
  const names = new Map(activePlatforms().map((p) => [p.key, p.name]));
  const list = (keys: string[]) => keys.map((k) => names.get(k) ?? k).join(', ');
  const parts: string[] = [];
  if (q.on.length) parts.push(q.on.length === 1 ? `Listed on ${list(q.on)}` : `Listed on ${q.match === 'all' ? 'all of' : 'any of'} ${list(q.on)}`);
  if (q.notOn.length) parts.push(`Not on ${list(q.notOn)}`);
  if (q.notListed) parts.push('Not listed anywhere');
  if (q.cities.length) parts.push(`Area: ${q.cities.join(', ')}`);
  if (q.tags.length) parts.push(`Tags: ${q.tags.join(', ')}`);
  if (q.activeOnly) parts.push('Active tag');
  if (q.manualOnly) parts.push('Added by hand');
  if (q.empty.length) parts.push(`Empty: ${q.empty.map((k) => FIELD_BY_KEY.get(k)?.label ?? k).join(', ')}`);
  if (q.q) parts.push(`Search “${q.q}”`);
  parts.push(q.archivedOnly ? 'Archived only' : q.includeArchived ? 'Archived included' : 'Archived excluded');
  return parts;
}

function cell(key: string, p: Summary, values: Map<string, unknown> | undefined): string {
  switch (key) {
    case 'p:name':
      return p.name;
    case 'p:id':
      return p.hostawayId ? String(p.hostawayId) : 'Not in Hostaway yet';
    case 'p:city':
      return p.city ?? '';
    case 'p:platforms':
      return p.platforms.length ? p.platforms.map((b) => b.name).join(', ') : 'Not listed yet';
    case 'p:links':
      return p.platforms
        .filter((b) => b.url)
        .map((b) => `${b.name}: ${b.url}`)
        .join('\n');
    case 'p:tags':
      return p.tags.join(', ');
    case 'p:photos':
      return p.photoCount === null ? '' : String(p.photoCount);
    case 'p:status':
      return [p.archived && 'Archived', p.hostawayId === null && 'Added by hand', hasActiveTag(p) && 'Active tag'].filter(Boolean).join(', ');
    default: {
      const def = FIELD_BY_KEY.get(key.slice(2));
      return def ? (formatValue(def, values?.get(def.key)) ?? '') : '';
    }
  }
}

export function buildReport(q: ReportQuery, opts: { limit?: number } = {}): Report {
  const keys = (q.columns.length ? q.columns : [...REPORT_PRESETS.summary]).filter((k) => REPORT_COLUMN_BY_KEY.has(k));
  const columns = keys.map((k) => REPORT_COLUMN_BY_KEY.get(k)!);
  const matched = filter(q).sort((a, b) => collator.compare(sortName(a.name), sortName(b.name)));
  const shown = opts.limit === undefined ? matched : matched.slice(0, opts.limit);
  const fieldKeys = keys.filter((k) => k.startsWith('f:')).map((k) => k.slice(2));
  const values = loadValues(
    shown.map((p) => p.id),
    fieldKeys,
  );
  return {
    total: matched.length,
    columns,
    rows: shown.map((p) => keys.map((k) => cell(k, p, values.get(p.id)))),
    filters: describe(q),
  };
}

// ---------------------------------------------------------------- CSV

/** Spreadsheet apps run cells starting with these as formulas; a leading apostrophe keeps them text. */
const FORMULA_START = /^[=+\-@\t\r]/;

function csvCell(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(report: Report): string {
  const lines = [report.columns.map((c) => csvCell(c.label)), ...report.rows.map((r) => r.map(csvCell))].map((r) => r.join(','));
  // BOM so Excel opens it as UTF-8 (names with “curly quotes”, en dashes, accents).
  return `﻿${lines.join('\r\n')}\r\n`;
}
