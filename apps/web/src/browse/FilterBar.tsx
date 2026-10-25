import type { FacetCount, FacetsResponse } from '@repo/shared';
import * as Popover from '@radix-ui/react-popover';
import clsx from 'clsx';
import { Check, ChevronDown, LayoutGrid, List, Rows3, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { BrowseState, SortMode, ViewMode } from '../lib/browse-state.ts';

// The index rows: the brand site's precinct index turned into filters.
// Tracked capitals with counts, bronze underline when active.

function IndexItem({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={clsx(
          'caps group flex items-baseline gap-1.5 border-b py-1.5 whitespace-nowrap transition-colors duration-200',
          active ? 'border-bronze text-ink' : 'border-transparent text-muted hover:border-gold hover:text-ink',
        )}
      >
        {label}
        {count !== undefined && (
          <span className={clsx('tabular font-normal', active ? 'text-bronze' : 'text-muted')}>({count})</span>
        )}
      </button>
    </li>
  );
}

function IndexRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-5">
      <span className="caps w-20 shrink-0 text-[0.625rem] text-bronze">{label}</span>
      <ul
        className="-mb-1 flex min-w-0 flex-1 gap-x-6 overflow-x-auto pr-8 pb-1 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_82%,transparent)] sm:[mask-image:none] sm:flex-wrap sm:overflow-visible sm:pr-0"
        aria-label={`Filter by ${label.toLowerCase()}`}
      >
        {children}
      </ul>
    </div>
  );
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function TagPicker({ tags, selected, onChange }: { tags: FacetCount[]; selected: string[]; onChange: (t: string[]) => void }) {
  const [query, setQuery] = useState('');
  const shown = tags.filter((t) => t.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <Popover.Root onOpenChange={(o) => !o && setQuery('')}>
      <Popover.Trigger
        className={clsx(
          'caps flex items-center gap-1.5 border-b py-1.5 transition-colors',
          selected.length ? 'border-bronze text-ink' : 'border-transparent text-muted hover:border-gold hover:text-ink',
        )}
      >
        {selected.length ? `Tags (${selected.length} chosen)` : 'Choose tags'}
        <ChevronDown aria-hidden className="size-3.5" strokeWidth={1.75} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-40 w-72 border border-gold bg-paper shadow-[0_12px_32px_-12px_rgb(10_10_12/0.25)]"
        >
          <label className="flex items-center gap-2 border-b border-gold/60 px-3">
            <Search aria-hidden className="size-4 text-muted" strokeWidth={1.5} />
            <span className="sr-only">Find a tag</span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a tag"
              className="h-10 w-full bg-transparent text-sm text-ink outline-none"
            />
          </label>
          <ul className="max-h-72 overflow-y-auto py-1" aria-label="Tags">
            {shown.map((t) => {
              const on = selected.includes(t.value);
              return (
                <li key={t.value}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange(toggle(selected, t.value))}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink-soft hover:bg-gold-wash focus-visible:bg-gold-wash"
                  >
                    <span
                      className={clsx(
                        'grid size-4 shrink-0 place-items-center border',
                        on ? 'border-bronze bg-bronze text-paper' : 'border-muted',
                      )}
                    >
                      {on && <Check aria-hidden className="size-3" strokeWidth={2.5} />}
                    </span>
                    <span className="flex-1 truncate">{t.label}</span>
                    <span className="tabular text-xs text-muted">{t.count}</span>
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && <li className="px-3 py-3 text-sm text-muted">No tag matches “{query}”.</li>}
          </ul>
          {selected.length > 0 && (
            <div className="border-t border-gold/60 px-3 py-2">
              <button type="button" onClick={() => onChange([])} className="caps text-[0.625rem] text-bronze underline">
                Clear tags
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

const VIEW_OPTIONS: { value: ViewMode; label: string; Icon: typeof Rows3 }[] = [
  { value: 'card', label: 'Card', Icon: Rows3 },
  { value: 'tile', label: 'Tile', Icon: LayoutGrid },
  { value: 'list', label: 'List', Icon: List },
];

export function ViewSwitch({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div role="radiogroup" aria-label="View" className="flex border border-gold">
      {VIEW_OPTIONS.map(({ value, label, Icon }) => {
        const on = view === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(value)}
            className={clsx(
              'caps flex h-9 items-center gap-2 px-3 text-[0.625rem] transition-colors duration-200',
              on ? 'bg-ink text-paper' : 'text-muted hover:bg-gold-wash hover:text-ink',
            )}
          >
            <Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function SortSelect({ sort, onChange }: { sort: SortMode; onChange: (s: SortMode) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="caps text-[0.625rem] text-muted">Sort</span>
      <span className="relative">
        <select
          value={sort}
          onChange={(e) => onChange(e.target.value as SortMode)}
          className="h-9 appearance-none border border-gold bg-transparent pr-8 pl-3 text-sm text-ink hover:bg-gold-wash"
        >
          <option value="name">Name A–Z</option>
          <option value="recent">Recently updated</option>
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted" />
      </span>
    </label>
  );
}

export function SearchField({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => onChange(draft.trim()), 200);
    return () => clearTimeout(t);
  }, [draft, value, onChange]);
  return (
    <div className="relative w-full max-w-xl">
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-0 size-[18px] -translate-y-1/2 text-muted" strokeWidth={1.5} />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Name, address, area, tag or Listing ID"
        aria-label="Search properties"
        className="h-12 w-full border-b border-gold bg-transparent pr-9 pl-8 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-bronze [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft('');
            onChange('');
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-0 grid size-8 -translate-y-1/2 place-items-center text-muted hover:text-ink"
        >
          <X aria-hidden className="size-4" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

export function FilterRows({
  state,
  facets,
  update,
}: {
  state: BrowseState;
  facets: FacetsResponse | undefined;
  update: (patch: Partial<BrowseState>) => void;
}) {
  const allPlatforms = state.platforms.length === 0 && !state.notListed;
  const cities = facets?.cities ?? [];
  return (
    <div className="flex flex-col gap-2.5">
      <IndexRow label="Platform">
        <IndexItem label="All" count={facets?.total} active={allPlatforms} onClick={() => update({ platforms: [], notListed: false })} />
        {(facets?.platforms ?? []).map((p) => (
          <IndexItem
            key={p.value}
            label={p.label}
            count={p.count}
            active={state.platforms.includes(p.value)}
            onClick={() => update({ platforms: toggle(state.platforms, p.value) })}
          />
        ))}
        <IndexItem
          label="Not listed yet"
          count={facets?.notListed}
          active={state.notListed}
          onClick={() => update({ notListed: !state.notListed })}
        />
      </IndexRow>
      <IndexRow label="Area">
        <IndexItem label="All" active={state.cities.length === 0} onClick={() => update({ cities: [] })} />
        {cities.map((c) => (
          <IndexItem
            key={c.value}
            label={c.label}
            count={c.count}
            active={state.cities.includes(c.value)}
            onClick={() => update({ cities: toggle(state.cities, c.value) })}
          />
        ))}
      </IndexRow>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        <span className="caps w-20 shrink-0 text-[0.625rem] text-bronze">Tags</span>
        <TagPicker tags={facets?.tags ?? []} selected={state.tags} onChange={(tags) => update({ tags })} />
        {state.tags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => update({ tags: state.tags.filter((x) => x !== t) })}
            className="flex items-center gap-1.5 border border-bronze/60 bg-paper px-2 py-0.5 text-xs text-ink hover:border-bronze"
            aria-label={`Remove tag ${t}`}
          >
            {t}
            <X aria-hidden className="size-3" strokeWidth={2} />
          </button>
        ))}
      </div>
    </div>
  );
}
