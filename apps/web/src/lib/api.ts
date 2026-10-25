import type { FacetsResponse, ListResponse, PropertyDetail } from '@repo/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { BrowseState } from './browse-state.ts';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function listParams(s: BrowseState, withPaging: boolean): string {
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q);
  if (s.platforms.length) p.set('platforms', s.platforms.join(','));
  if (s.notListed) p.set('notListed', '1');
  if (s.cities.length) p.set('cities', s.cities.join(','));
  if (s.tags.length) p.set('tags', s.tags.join(','));
  if (s.includeArchived) p.set('includeArchived', '1');
  p.set('sort', s.sort);
  if (withPaging) {
    p.set('page', String(s.page));
    p.set('pageSize', String(s.pageSize));
  }
  return p.toString();
}

export function useProperties(s: BrowseState) {
  const qs = listParams(s, true);
  return useQuery({
    queryKey: ['properties', qs],
    queryFn: () => getJson<ListResponse>(`/api/properties?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export function useFacets(s: BrowseState) {
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q);
  if (s.includeArchived) p.set('includeArchived', '1');
  const qs = p.toString();
  return useQuery({
    queryKey: ['facets', qs],
    queryFn: () => getJson<FacetsResponse>(`/api/facets?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export function useProperty(id: number | null) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => getJson<PropertyDetail>(`/api/properties/${id}`),
    enabled: id !== null,
  });
}
