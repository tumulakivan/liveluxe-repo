import { z } from 'zod';

export const PAGE_SIZES = [24, 48, 96] as const;

const csv = z
  .string()
  .optional()
  .transform((s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []));

/** The one filter shared by the list, and later the CSV and PDF reports. */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((n) => (PAGE_SIZES as readonly number[]).includes(n))
    .default(24),
  q: z.string().trim().max(200).optional(),
  platforms: csv,
  notListed: z.coerce.boolean().optional(),
  tags: csv,
  cities: csv,
  includeArchived: z.coerce.boolean().optional(),
  sort: z.enum(['name', 'recent']).default('name'),
  /** Admin only: removed (hidden) properties. Public routes always use 'hide'. */
  removed: z.enum(['hide', 'only', 'all']).default('hide'),
  /** Admin only: properties added by hand (not in Hostaway yet). */
  manualOnly: z.coerce.boolean().optional(),
  /** Admin only: properties carrying the "Active" tag. */
  activeOnly: z.coerce.boolean().optional(),
  /** Admin only: properties archived in Hostaway, and nothing else. */
  archivedOnly: z.coerce.boolean().optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export interface PlatformBadge {
  key: string;
  name: string;
  initials: string;
  /** Path to the icon under /platform-icons, once mapped. */
  icon: string | null;
  url: string | null;
}

export interface PropertySummary {
  id: number;
  hostawayId: number | null;
  name: string;
  summary: string | null;
  photoUrl: string | null;
  photoCount: number | null;
  city: string | null;
  tags: string[];
  platforms: PlatformBadge[];
  archived: boolean;
  /** Removed from the repo by an admin (admin views only). */
  removed: boolean;
}

export interface ListResponse {
  items: PropertySummary[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface FacetCount {
  value: string;
  label: string;
  count: number;
}

export interface FacetsResponse {
  total: number;
  platforms: FacetCount[];
  notListed: number;
  cities: FacetCount[];
  tags: FacetCount[];
}

export type ValueSource = 'sync' | 'claude' | 'admin';

export interface FieldValue {
  value: unknown;
  source: ValueSource;
  updatedAt: string;
  updatedBy: string | null;
}

export interface PropertyDetail extends PropertySummary {
  values: Record<string, FieldValue>;
  lastSyncedAt: string | null;
  photoSource: 'hostaway' | 'upload';
  createdBy: string | null;
}

// Admin

export interface AdminMe {
  username: string;
  mustChangePassword: boolean;
}

export interface SyncSummary {
  added: number;
  updated: number;
  unchanged: number;
  archived: number;
  fieldsChanged: number;
  finishedAt: string;
}

export interface SyncRun {
  startedAt: string;
  finishedAt: string | null;
  startedBy: string | null;
  summary: SyncSummary | null;
  error: string | null;
}

export interface OverviewResponse {
  /** Every property in the repo, archived included, removed excluded. */
  total: number;
  /** Carrying the "Active" tag. */
  active: number;
  /** Not archived and listed on no platform. */
  notListed: number;
  archived: number;
  /** Added by hand, not in Hostaway yet. */
  addedByHand: number;
  removed: number;
  lastSync: SyncRun | null;
  syncing: boolean;
}

export interface AdminPlatform {
  key: string;
  name: string;
  kind: 'hostaway' | 'manual';
  initials: string;
  retired: boolean;
  listedCount: number;
}

export interface AdminAccount {
  id: number;
  username: string;
  mustChangePassword: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  isYou: boolean;
}

/** Field types an admin can type into, and how each is checked. */
export const fieldValueSchemas = {
  text: z.string().trim().max(2000).nullable(),
  longtext: z.string().max(20000).nullable(),
  number: z.number().finite().nullable(),
  boolean: z.boolean().nullable(),
  hour: z.number().int().min(0).max(23).nullable(),
  hours: z.number().int().min(0).max(8760).nullable(),
  percent: z.number().min(-100).max(1000).nullable(),
  list: z.array(z.string().trim().min(1).max(200)).max(100).nullable(),
} as const;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9._-]{2,63}$/, 'Use 3–64 lowercase letters, digits, dots, hyphens or underscores.');
