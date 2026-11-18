import type { FacetCount, FacetsResponse } from '@repo/shared';
import clsx from 'clsx';
import { ChevronDown, LayoutGrid, List, Rows3, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ChecklistPopover, RemovableChip, type PickerOption } from '../components/MultiPicker.tsx';
import type { BrowseState, SortMode, ViewMode } from '../lib/browse-state.ts';

// Filters: a row of multi-select dropdowns (Platform, Area, Tags). Each opens a checklist with
// counts; chosen values also show as removable chips under the row.

type FilterOption = PickerOption;

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
  const names = new Map(options.map((o) => [o.value, o.label]));
  const first = selected[0];
  const summary =
    selected.length === 0 ? 'All' : selected.length === 1 && first ? (names.get(first) ?? first) : `${selected.length} selected`;
  const active = selected.length > 0;

  return (
    <ChecklistPopover
      label={label}
      options={options}
      selected={selected}
      onChange={onChange}
      searchable={searchable}
      showAll
      trigger={
        // Phones: three equal columns with the label stacked over the value. Wider: one line each.
        <button
          type="button"
          aria-label={`${label}: ${summary}`}
          className={clsx(
            'flex h-12 min-w-0 items-center gap-2 border bg-paper pr-2 pl-2.5 text-left transition-colors duration-200 hover:bg-gold-wash data-[state=open]:border-bronze sm:h-10 sm:min-w-44 sm:pr-2.5 sm:pl-3',
            active ? 'border-bronze' : 'border-edge',
          )}
        >
          <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="caps text-[0.625rem] leading-4 text-bronze">{label}</span>
            <span className={clsx('truncate text-sm leading-5 sm:max-w-48', active ? 'text-ink' : 'text-muted')}>{summary}</span>
          </span>
          <ChevronDown aria-hidden className="size-3.5 shrink-0 text-muted" strokeWidth={1.75} />
        </button>
      }
    />
  );
}

const VIEW_OPTIONS: { value: ViewMode; label: string; Icon: typeof Rows3 }[] = [
  { value: 'card', label: 'Card', Icon: Rows3 },
  { value: 'tile', label: 'Tile', Icon: LayoutGrid },
  { value: 'list', label: 'List', Icon: List },
];

export function ViewSwitch({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div role="radiogroup" aria-label="View" className="flex border border-edge">
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
          className="h-9 appearance-none border border-edge bg-transparent pr-8 pl-3 text-sm text-ink hover:bg-gold-wash"
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
        className="h-12 w-full border-b border-edge bg-transparent pr-9 pl-8 text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-bronze [&::-webkit-search-cancel-button]:hidden"
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
    (list ?? []).map((f) => ({ value: f.value, label: f.label, hint: f.count }));

  const platformOptions: FilterOption[] = [
    ...toOptions(facets?.platforms),
    { value: NOT_LISTED, label: 'Not listed yet', hint: facets?.notListed },
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
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
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
            <RemovableChip key={c.key} label={c.label} onRemove={c.remove} removeLabel={`Remove filter ${c.label}`} />
          ))}
        </div>
      )}
    </div>
  );
}
