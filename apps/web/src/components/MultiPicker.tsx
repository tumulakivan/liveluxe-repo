import * as Popover from '@radix-ui/react-popover';
import clsx from 'clsx';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

// Multi-select pieces shared by the browse filters and the Reports page: a checklist in a
// popover (with an optional find field) and removable chips for the chosen values.

export interface PickerOption {
  value: string;
  label: string;
  /** Shown at the right of the row: a count or a short hint. */
  hint?: string | number;
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** A popover checklist. `trigger` must be a single focusable element (it is rendered asChild). */
export function ChecklistPopover({
  trigger,
  label,
  options,
  selected,
  onChange,
  searchable,
  findLabel,
  emptyText,
  showAll,
  width = 'w-72',
}: {
  trigger: ReactNode;
  /** Names the popover for screen readers and the find field ("Find tags"). */
  label: string;
  options: PickerOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
  /** Placeholder and screen-reader name of the find field; defaults to "Find <label>". */
  findLabel?: string;
  /** Shown in place of the list when there are no options (for example, they failed to load). */
  emptyText?: string;
  /** Offer a "Show all" reset at the foot of the list while anything is chosen. */
  showAll?: boolean;
  width?: string;
}) {
  const [query, setQuery] = useState('');
  const find = findLabel ?? `Find ${label.toLowerCase()}`;
  const q = query.toLowerCase();
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  return (
    <Popover.Root onOpenChange={(o) => !o && setQuery('')}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          aria-label={label}
          collisionPadding={12}
          className={clsx('z-40 max-w-[calc(100vw-24px)] border border-hairline bg-paper shadow-[0_12px_32px_-12px_rgb(10_10_12/0.25)]', width)}
        >
          {searchable && (
            <label className="flex items-center gap-2 border-b border-hairline/60 px-3">
              <Search aria-hidden className="size-4 text-muted" strokeWidth={1.5} />
              <span className="sr-only">{find}</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={find}
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
                    className="flex min-h-10 w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink-soft hover:bg-hover-wash focus-visible:bg-hover-wash"
                  >
                    <span className={clsx('grid size-4 shrink-0 place-items-center border', on ? 'border-bronze bg-bronze text-paper' : 'border-muted')}>
                      {on && <Check aria-hidden className="size-3" strokeWidth={2.5} />}
                    </span>
                    <span className="flex-1 truncate">{o.label}</span>
                    {o.hint !== undefined && <span className="tabular text-xs text-muted">{o.hint}</span>}
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && (
              <li className="px-3 py-3 text-sm text-muted">{query ? `Nothing matches “${query}”.` : (emptyText ?? 'Nothing to choose yet.')}</li>
            )}
          </ul>
          {showAll && selected.length > 0 && (
            <div className="border-t border-hairline/60 px-3 py-2">
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

/** A chosen value as a chip; clicking removes it. */
export function RemovableChip({ label, onRemove, removeLabel }: { label: string; onRemove: () => void; removeLabel?: string }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={removeLabel ?? `Remove ${label}`}
      className="flex min-h-6 items-center gap-1.5 border border-bronze/60 bg-paper px-2 py-1 text-xs leading-4 text-ink transition-colors hover:border-bronze"
    >
      {label}
      <X aria-hidden className="size-3" strokeWidth={2} />
    </button>
  );
}

/** The Reports page picker: an underlined trigger with the chips beside it. */
export function MultiPicker({
  options,
  selected,
  onChange,
  placeholder,
  findLabel,
}: {
  options: PickerOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  findLabel: string;
}) {
  const names = new Map(options.map((o) => [o.value, o.label]));
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <ChecklistPopover
        label={placeholder}
        findLabel={findLabel}
        options={options}
        selected={selected}
        onChange={onChange}
        searchable
        width="w-80"
        trigger={
          <button
            type="button"
            className={clsx(
              'caps flex items-center gap-1.5 border-b py-1.5 transition-colors',
              selected.length ? 'border-bronze text-ink' : 'border-transparent text-muted hover:border-hairline hover:text-ink',
            )}
          >
            {selected.length ? `${placeholder} (${selected.length})` : placeholder}
            <ChevronDown aria-hidden className="size-3.5" strokeWidth={1.75} />
          </button>
        }
      />
      {selected.map((v) => (
        <RemovableChip key={v} label={names.get(v) ?? v} onRemove={() => onChange(selected.filter((x) => x !== v))} />
      ))}
    </div>
  );
}
