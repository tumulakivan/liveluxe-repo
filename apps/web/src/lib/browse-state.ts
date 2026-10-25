import { PAGE_SIZES } from '@repo/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

// Everything about the browse screen lives in the URL, so a view can be shared,
// bookmarked, and stepped back through. The chosen view is also remembered per browser.

export type ViewMode = 'card' | 'tile' | 'list';
export type SortMode = 'name' | 'recent';

export interface BrowseState {
  q: string;
  platforms: string[];
  notListed: boolean;
  cities: string[];
  tags: string[];
  includeArchived: boolean;
  sort: SortMode;
  page: number;
  pageSize: number;
  view: ViewMode;
  /** Property open in the side panel. */
  open: number | null;
}

const VIEW_KEY = 'listing-repo:view';
const VIEWS: ViewMode[] = ['card', 'tile', 'list'];

function storedView(): ViewMode {
  try {
    const v = localStorage.getItem(VIEW_KEY) as ViewMode | null;
    return v && VIEWS.includes(v) ? v : 'card';
  } catch {
    return 'card';
  }
}

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

export function useBrowseState() {
  const [params, setParams] = useSearchParams();

  const state = useMemo<BrowseState>(() => {
    const view = params.get('view') as ViewMode | null;
    const size = Number(params.get('size'));
    const open = Number(params.get('p'));
    return {
      q: params.get('q') ?? '',
      platforms: list(params.get('platforms')),
      notListed: params.get('notListed') === '1',
      cities: list(params.get('areas')),
      tags: list(params.get('tags')),
      includeArchived: params.get('archived') === '1',
      sort: params.get('sort') === 'recent' ? 'recent' : 'name',
      page: Math.max(1, Number(params.get('page')) || 1),
      pageSize: (PAGE_SIZES as readonly number[]).includes(size) ? size : 24,
      view: view && VIEWS.includes(view) ? view : storedView(),
      open: Number.isInteger(open) && open > 0 ? open : null,
    };
  }, [params]);

  /** Apply changes. Anything that changes the result set returns to page 1. */
  const update = useCallback(
    (patch: Partial<BrowseState>, opts: { replace?: boolean } = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const set = (key: string, value: string | null) => (value ? next.set(key, value) : next.delete(key));
          const resets = ['q', 'platforms', 'notListed', 'cities', 'tags', 'includeArchived', 'sort', 'pageSize'];
          if (Object.keys(patch).some((k) => resets.includes(k)) && patch.page === undefined) next.delete('page');
          if ('q' in patch) set('q', patch.q || null);
          if ('platforms' in patch) set('platforms', patch.platforms!.join(',') || null);
          if ('notListed' in patch) set('notListed', patch.notListed ? '1' : null);
          if ('cities' in patch) set('areas', patch.cities!.join(',') || null);
          if ('tags' in patch) set('tags', patch.tags!.join(',') || null);
          if ('includeArchived' in patch) set('archived', patch.includeArchived ? '1' : null);
          if ('sort' in patch) set('sort', patch.sort === 'recent' ? 'recent' : null);
          if ('page' in patch) set('page', patch.page && patch.page > 1 ? String(patch.page) : null);
          if ('pageSize' in patch) set('size', patch.pageSize === 24 ? null : String(patch.pageSize));
          if ('view' in patch) {
            set('view', patch.view === 'card' ? null : patch.view!);
            try {
              localStorage.setItem(VIEW_KEY, patch.view!);
            } catch {
              // Private windows can refuse storage; the URL still carries the view.
            }
          }
          if ('open' in patch) set('p', patch.open ? String(patch.open) : null);
          return next;
        },
        { replace: opts.replace },
      );
    },
    [setParams],
  );

  const filtersActive =
    state.platforms.length > 0 || state.notListed || state.cities.length > 0 || state.tags.length > 0 || !!state.q;

  const clearFilters = useCallback(
    () => update({ q: '', platforms: [], notListed: false, cities: [], tags: [] }),
    [update],
  );

  return { state, update, filtersActive, clearFilters };
}
