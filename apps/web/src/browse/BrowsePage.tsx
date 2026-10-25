import * as Tooltip from '@radix-ui/react-tooltip';
import { useCallback, useEffect, useRef } from 'react';
import { useFacets, useProperties } from '../lib/api.ts';
import { useBrowseState } from '../lib/browse-state.ts';
import { DetailPanel } from './DetailPanel.tsx';
import { FilterRows, SearchField, SortSelect, ViewSwitch } from './FilterBar.tsx';
import { Pagination } from './Pagination.tsx';
import { CardView, ListView, LoadingView, TileView } from './Views.tsx';

export function BrowsePage() {
  const { state, update, filtersActive, clearFilters } = useBrowseState();
  const list = useProperties(state);
  const facets = useFacets(state);
  const resultsTop = useRef<HTMLDivElement>(null);

  const onSearch = useCallback((q: string) => update({ q }, { replace: true }), [update]);
  const onOpen = useCallback((id: number) => update({ open: id }), [update]);

  // The server clamps an out-of-range page; keep the URL in step with it.
  useEffect(() => {
    if (list.data && list.data.page !== state.page) update({ page: list.data.page }, { replace: true });
  }, [list.data, state.page, update]);

  const goToPage = (page: number) => {
    update({ page });
    resultsTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const total = list.data?.total;
  const archivedNote = state.includeArchived ? ' including archived' : '';

  return (
    <Tooltip.Provider delayDuration={250}>
      <main id="main" className="mx-auto max-w-[1440px] px-5 pt-10 pb-20 sm:px-8 lg:px-12 lg:pt-14">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h1 className="font-display flex items-baseline gap-4 text-[2.75rem] leading-none font-semibold tracking-[-0.015em] text-ink sm:text-[3.5rem]">
              Properties
              <span className="caps tabular text-[0.6875rem] font-medium tracking-[0.2em] text-bronze" aria-live="polite">
                {total === undefined ? '' : `${total} shown${archivedNote}`}
              </span>
            </h1>
            <SearchField value={state.q} onChange={onSearch} />
          </div>

          <div className="border-y border-gold py-5">
            <FilterRows state={state} facets={facets.data} update={update} />
          </div>

          <div ref={resultsTop} className="-mt-2 flex scroll-mt-6 flex-wrap items-center justify-between gap-x-6 gap-y-3">
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="caps text-[0.625rem] text-bronze underline hover:text-ink">
                Clear search and filters
              </button>
            )}
            <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={state.includeArchived}
                  onChange={(e) => update({ includeArchived: e.target.checked })}
                  className="size-4 accent-bronze"
                />
                Include archived
              </label>
              <SortSelect sort={state.sort} onChange={(sort) => update({ sort })} />
              <ViewSwitch view={state.view} onChange={(view) => update({ view }, { replace: true })} />
            </div>
          </div>

          <div className="-mt-3">
            {list.isPending ? (
              <LoadingView view={state.view} />
            ) : list.isError ? (
              <div role="alert" className="border border-gold bg-paper px-6 py-10">
                <h2 className="font-display text-2xl font-semibold text-ink">Properties couldn't be loaded</h2>
                <p className="mt-2 text-sm text-muted">{list.error.message}. Check your connection, then try again.</p>
                <button type="button" onClick={() => list.refetch()} className="caps mt-5 bg-ink px-4 py-2.5 text-paper hover:bg-bronze-deep">
                  Try again
                </button>
              </div>
            ) : list.data.items.length === 0 ? (
              <div className="border-y border-gold px-1 py-16 text-center">
                <h2 className="font-display text-3xl font-semibold text-ink">No properties match</h2>
                <p className="mx-auto mt-3 max-w-[48ch] text-ink-soft">
                  {state.q ? `Nothing matches “${state.q}” with these filters.` : 'Nothing matches this combination of filters.'}
                  {!state.includeArchived && ' Archived listings are hidden.'}
                </p>
                <div className="mt-6 flex justify-center gap-4">
                  {filtersActive && (
                    <button type="button" onClick={clearFilters} className="caps bg-ink px-4 py-2.5 text-paper hover:bg-bronze-deep">
                      Clear search and filters
                    </button>
                  )}
                  {!state.includeArchived && (
                    <button type="button" onClick={() => update({ includeArchived: true })} className="caps border border-gold px-4 py-2.5 text-ink hover:bg-gold-wash">
                      Include archived
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={list.isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                {state.view === 'card' && <CardView items={list.data.items} onOpen={onOpen} />}
                {state.view === 'tile' && <TileView items={list.data.items} onOpen={onOpen} />}
                {state.view === 'list' && <ListView items={list.data.items} onOpen={onOpen} />}
              </div>
            )}
          </div>

          {list.data && list.data.total > 0 && (
            <Pagination
              page={list.data.page}
              pageCount={list.data.pageCount}
              pageSize={list.data.pageSize}
              total={list.data.total}
              onPage={goToPage}
              onPageSize={(pageSize) => update({ pageSize })}
            />
          )}
        </div>
        <DetailPanel id={state.open} onClose={() => update({ open: null })} />
      </main>
    </Tooltip.Provider>
  );
}
