import type {
  AdminAccount,
  AdminMe,
  AdminPlatform,
  FacetsResponse,
  ListResponse,
  OverviewResponse,
  PropertyDetail,
  ReportPreview,
  SyncRun,
} from '@repo/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  // Every write carries this header; the server refuses writes without it (CSRF guard).
  if (init.method && init.method !== 'GET') headers.set('X-Listing-Repo', '1');
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const res = await fetch(url, { ...init, headers, credentials: 'same-origin' });
  const body = (await res.json().catch(() => null)) as (T & { error?: string; code?: string }) | null;
  if (!res.ok) throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status, body?.code);
  return body as T;
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

// ---- session

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => request<AdminMe | null>('/api/auth/me'), staleTime: 30_000 });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { username: string; password: string }) => request<AdminMe>('/api/auth/sign-in', json('POST', v)),
    onSuccess: (me) => qc.setQueryData(['me'], me),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => request('/api/auth/sign-out', json('POST')),
    onSuccess: () => {
      qc.setQueryData(['me'], null);
      qc.removeQueries({ queryKey: ['admin'] });
    },
  });
}

export function useChangePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { current: string; next: string }) => request<AdminMe>('/api/auth/password', json('POST', v)),
    onSuccess: (me) => qc.setQueryData(['me'], me),
  });
}

// ---- overview and sync

export function useOverview() {
  return useQuery({ queryKey: ['admin', 'overview'], queryFn: () => request<OverviewResponse>('/api/admin/overview') });
}

export function useSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => request<SyncRun>('/api/admin/sync', json('POST')),
    onSettled: () => qc.invalidateQueries(),
  });
}

// ---- properties

export function useAdminProperties(qs: string) {
  return useQuery({
    queryKey: ['admin', 'properties', qs],
    queryFn: () => request<ListResponse>(`/api/admin/properties?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export function useAdminFacets(qs: string) {
  return useQuery({
    queryKey: ['admin', 'facets', qs],
    queryFn: () => request<FacetsResponse>(`/api/admin/facets?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export function useAdminProperty(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'property', id],
    queryFn: () => request<PropertyDetail>(`/api/admin/properties/${id}`),
    enabled: id !== null,
  });
}

/** After any property write: store the fresh detail, refresh lists and counts everywhere. */
function usePropertyWrite<V>(fn: (v: V) => Promise<PropertyDetail>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (p) => {
      qc.setQueryData(['admin', 'property', p.id], p);
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
      qc.invalidateQueries({ queryKey: ['admin', 'facets'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      qc.invalidateQueries({ queryKey: ['admin', 'platforms'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['facets'] });
      qc.invalidateQueries({ queryKey: ['property', p.id] });
    },
  });
}

export const useSaveFields = (id: number) =>
  usePropertyWrite((values: Record<string, unknown>) => request<PropertyDetail>(`/api/admin/properties/${id}/fields`, json('PATCH', { values })));

export const useSetRemoved = (id: number) =>
  usePropertyWrite((removed: boolean) => request<PropertyDetail>(`/api/admin/properties/${id}/${removed ? 'remove' : 'restore'}`, json('POST')));

export const useSetListing = (id: number) =>
  usePropertyWrite((v: { key: string; listed: boolean; url: string | null }) =>
    request<PropertyDetail>(`/api/admin/properties/${id}/platforms/${v.key}`, json('PUT', { listed: v.listed, url: v.url })),
  );

export const useUploadPhoto = (id: number) =>
  usePropertyWrite((v: { photo: Blob; count: number }) => {
    const form = new FormData();
    const ext = v.photo.type === 'image/webp' ? 'webp' : 'jpg';
    form.set('photo', v.photo, `display.${ext}`);
    form.set('count', String(v.count));
    return request<PropertyDetail>(`/api/admin/properties/${id}/photo`, { method: 'POST', body: form });
  });

export const useCreateProperty = () =>
  usePropertyWrite((name: string) => request<PropertyDetail>('/api/admin/properties', json('POST', { name })));

// ---- platforms

export function useAdminPlatforms() {
  return useQuery({ queryKey: ['admin', 'platforms'], queryFn: () => request<AdminPlatform[]>('/api/admin/platforms') });
}

function usePlatformWrite<V>(fn: (v: V) => Promise<AdminPlatform[]>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (list) => {
      qc.setQueryData(['admin', 'platforms'], list);
      qc.invalidateQueries({ queryKey: ['facets'] });
      qc.invalidateQueries({ queryKey: ['admin', 'facets'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
    },
  });
}

export const useAddPlatform = () => usePlatformWrite((name: string) => request<AdminPlatform[]>('/api/admin/platforms', json('POST', { name })));

export const useRetirePlatform = () =>
  usePlatformWrite((v: { key: string; retired: boolean }) => request<AdminPlatform[]>(`/api/admin/platforms/${v.key}`, json('PATCH', { retired: v.retired })));

// ---- accounts

export function useAccounts() {
  return useQuery({ queryKey: ['admin', 'accounts'], queryFn: () => request<AdminAccount[]>('/api/admin/accounts') });
}

function useAccountWrite<V>(fn: (v: V) => Promise<AdminAccount[]>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: (list) => qc.setQueryData(['admin', 'accounts'], list) });
}

export const useAddAccount = () =>
  useAccountWrite((v: { username: string; password: string }) => request<AdminAccount[]>('/api/admin/accounts', json('POST', v)));

export const useResetAccount = () =>
  useAccountWrite((v: { id: number; password: string }) => request<AdminAccount[]>(`/api/admin/accounts/${v.id}/reset`, json('POST', { password: v.password })));

export const useRemoveAccount = () => useAccountWrite((id: number) => request<AdminAccount[]>(`/api/admin/accounts/${id}`, json('DELETE')));

// ---- reports

export function useReportPreview(qs: string) {
  return useQuery({
    queryKey: ['admin', 'report', qs],
    queryFn: () => request<ReportPreview>(`/api/admin/reports/preview?${qs}`),
    placeholderData: keepPreviousData,
  });
}

// ---- missing fields and access tokens

export interface MissingResponse {
  totalSlots: number;
  totalMissing: number;
  fields: { key: string; label: string; section: string; group: string | null; applicable: number; missing: number }[];
  properties: { id: number; name: string; hostawayId: number | null; missing: number }[];
}

export function useMissing() {
  return useQuery({ queryKey: ['admin', 'missing'], queryFn: () => request<MissingResponse>('/api/admin/missing') });
}

export interface ApiToken {
  id: number;
  name: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export function useTokens() {
  return useQuery({ queryKey: ['admin', 'tokens'], queryFn: () => request<ApiToken[]>('/api/admin/tokens') });
}

export function useCreateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => request<{ token: string; tokens: ApiToken[] }>('/api/admin/tokens', json('POST', { name })),
    onSuccess: (r) => qc.setQueryData(['admin', 'tokens'], r.tokens),
  });
}

export function useRevokeToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => request<ApiToken[]>(`/api/admin/tokens/${id}/revoke`, json('POST')),
    onSuccess: (list) => qc.setQueryData(['admin', 'tokens'], list),
  });
}
