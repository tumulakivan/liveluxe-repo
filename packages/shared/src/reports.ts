import { z } from 'zod';
import { FIELDS, SECTIONS, type SectionKey } from './fields.ts';

// Reports: the shared filter plus report-only rules, and the columns a report can carry.

const csv = z
  .string()
  .optional()
  .transform((s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []));

const flag = z
  .union([z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false'), z.boolean()])
  .optional()
  .transform((v) => v === true || v === '1' || v === 'true');

export const reportQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  /** Platforms the property must be listed on. */
  on: csv,
  /** "all": listed on every platform in `on`; "any": on at least one. */
  match: z.enum(['all', 'any']).default('all'),
  /** Platforms the property must NOT be listed on. */
  notOn: csv,
  notListed: flag,
  cities: csv,
  tags: csv,
  activeOnly: flag,
  manualOnly: flag,
  includeArchived: flag,
  archivedOnly: flag,
  /** Field keys that must be empty. */
  empty: csv,
  columns: csv,
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;

export interface ReportColumn {
  key: string;
  label: string;
  /** Section heading in the column picker. */
  group: string;
}

/** Columns that aren't single fields: they describe the property as a whole. */
export const PROPERTY_COLUMNS: ReportColumn[] = [
  { key: 'p:name', label: 'Property', group: 'Property' },
  { key: 'p:id', label: 'Listing ID', group: 'Property' },
  { key: 'p:city', label: 'Area', group: 'Property' },
  { key: 'p:platforms', label: 'Listed on', group: 'Property' },
  { key: 'p:links', label: 'Listing links', group: 'Property' },
  { key: 'p:tags', label: 'Tags', group: 'Property' },
  { key: 'p:photos', label: 'Photos', group: 'Property' },
  { key: 'p:status', label: 'Status', group: 'Property' },
];

const sectionLabel = new Map<SectionKey, string>(SECTIONS.map((s) => [s.key, s.label]));

/** Every field column, in registry order, except fields kept hidden (platforms on hold). Tags and photos are property columns. */
export const FIELD_COLUMNS: ReportColumn[] = FIELDS.filter((f) => !f.hidden && f.key !== 'tags' && f.key !== 'photoCount').map((f) => ({
  key: `f:${f.key}`,
  label: f.group && f.section !== 'additional' ? `${f.group}: ${f.label}` : f.label,
  group: sectionLabel.get(f.section)!,
}));

export const REPORT_COLUMNS: ReportColumn[] = [...PROPERTY_COLUMNS, ...FIELD_COLUMNS];
export const REPORT_COLUMN_BY_KEY: ReadonlyMap<string, ReportColumn> = new Map(REPORT_COLUMNS.map((c) => [c.key, c]));

export const REPORT_PRESETS = {
  summary: ['p:name', 'p:id', 'p:city', 'p:platforms', 'p:tags'],
  everything: REPORT_COLUMNS.map((c) => c.key),
} as const;

/** Wider tables stop fitting an A4 landscape page; the CSV has no limit. */
export const PDF_MAX_COLUMNS = 10;

export interface ReportPreview {
  total: number;
  columns: ReportColumn[];
  rows: string[][];
  /** The filters in words, one item each. Shown as separate pieces, never joined with dots. */
  filters: string[];
}
