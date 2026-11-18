import type { FacetCount, FacetsResponse } from '@repo/shared';
import * as Popover from '@radix-ui/react-popover';
import clsx from 'clsx';
import { Check, ChevronDown, LayoutGrid, List, Rows3, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { BrowseState, SortMode, ViewMode } from '../lib/browse-state.ts';

// Filters: a row of multi-select dropdowns (Platform, Area, Tags). Each opens a checklist with
// counts; chosen values also show as removable chips under the row.

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  searchable,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState('');
  const shown = query ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())) : options;
  const names = new Map(options.map((o) => [o.value, o.label]));
  const first = selected[0];
  const summary =
    selected.length === 0 ? 'All' : selected.length === 1 && first ? (names.get(first) ?? first) : `${selected.length} selected`;
  const active = selected.length > 0;

  return (
    <Popover.Root onOpenChange={(o) => !o && setQuery('')}>
      <Popover.Trigger
        aria-label={`${label}: ${summary}`}
        className={clsx(
          'flex h-10 min-w-44 items-center gap-2 border bg-paper pr-2.5 pl-3 text-left transition-colors duration-200 hover:bg-gold-wash data-[state=open]:border-bronze',
          active ? 'border-bronze' : 'border-gold',
        )}
      >
        <span className="caps text-[0.625rem] text-bronze">{label}</span>
        <span className={clsx('max-w-48 flex-1 truncate text-sm', active ? 'text-ink' : 'text-muted')}>{summary}</span>
        <ChevronDown aria-hidden className="size-3.5 shrink-0 text-muted" strokeWidth={1.75} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-40 w-72 border border-gold bg-paper shadow-[0_12px_32px_-12px_rgb(10_10_12/0.25)]"
        >
          {searchable && (
            <label className="flex items-center gap-2 border-b border-gold/60 px-3">
              <Search aria-hidden className="size-4 text-muted" strokeWidth={1.5} />
              <span className="sr-only">Find {label.toLowerCase()}</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Find ${label.toLowerCase()}`}
                className="h-10 w-full bg-transparent text-sm text-ink outline-none"
              />
            </label>
          )}
          <ul className="max-h-72 overflow-y-auto py-1" aria-label={label}>
            {shown.map((o) => {
              const on = selected.includes(o.value);
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onChange(toggle(selected, o.value))}
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
                    <span className="flex-1 truncate">{o.label}</span>
                    {o.count !== undefined && <span className="tabular text-xs text-muted">{o.count}</span>}
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && (
              <li className="px-3 py-3 text-sm text-muted">{query ? `Nothing matches “${query}”.` : 'Nothing to choose yet.'}</li>
            )}
          </ul>
          {active && (
            <div className="border-t border-gold/60 px-3 py-2">
              <button type="button" onClick={() => onChange([])} className="caps text-[0.625rem] text-bronze underline hover:text-ink">
                Show all
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="flex items-center gap-1.5 border border-bronze/60 bg-paper px-2 py-0.5 text-xs text-ink hover:border-bronze"
      aria-label={`Remove filter ${label}`}
    >
      {label}
      <X aria-hidden className="size-3" strokeWidth={2} />
    </button>
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

// "Not listed yet" sits in the Platform dropdown as a peer of the platforms.
const NOT_LISTED = '__not_listed__';

export function FilterRows({
  state,
  facets,
  update,
}: {
  state: BrowseState;
  facets: FacetsResponse | undefined;
  update: (patch: Partial<BrowseState>) => void;
}) {
  const toOptions = (list: FacetCount[] | undefined): FilterOption[] =>
    (list ?? []).map((f) => ({ value: f.value, label: f.label, count: f.count }));

  const platformOptions: FilterOption[] = [
    ...toOptions(facets?.platforms),
    { value: NOT_LISTED, label: 'Not listed yet', count: facets?.notListed },
  ];
  const cityOptions = toOptions(facets?.cities);
  const tagOptions = toOptions(facets?.tags);

  const platformSelected = state.notListed ? [...state.platforms, NOT_LISTED] : state.platforms;
  const setPlatforms = (next: string[]) =>
    update({ platforms: next.filter((v) => v !== NOT_LISTED), notListed: next.includes(NOT_LISTED) });

  const nameOf = (opts: FilterOption[], v: string) => opts.find((o) => o.value === v)?.label ?? v;
  const chips = [
    ...platformSelected.map((v) => ({
      key: `p:${v}`,
      label: nameOf(platformOptions, v),
      remove: () => setPlatforms(platformSelected.filter((x) => x !== v)),
    })),
    ...state.cities.map((v) => ({
      key: `c:${v}`,
      label: nameOf(cityOptions, v),
      remove: () => update({ cities: state.cities.filter((x) => x !== v) }),
    })),
    ...state.tags.map((v) => ({
      key: `t:${v}`,
      label: nameOf(tagOptions, v),
      remove: () => update({ tags: state.tags.filter((x) => x !== v) }),
    })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <FilterDropdown label="Platform" options={platformOptions} selected={platformSelected} onChange={setPlatforms} />
        <FilterDropdown
          label="Area"
          options={cityOptions}
          selected={state.cities}
          onChange={(cities) => update({ cities })}
          searchable={cityOptions.length > 8}
        />
        <FilterDropdown label="Tags" options={tagOptions} selected={state.tags} onChange={(tags) => update({ tags })} searchable />
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Chosen filters">
          {chips.map((c) => (
            <Chip key={c.key} label={c.label} onRemove={c.remove} />
          ))}
        </div>
      )}
    </div>
  );
}
