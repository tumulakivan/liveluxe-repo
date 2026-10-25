import * as Popover from '@radix-ui/react-popover';
import clsx from 'clsx';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useState } from 'react';

// A searchable multi-select in a popover, with the chosen values shown as removable chips.

export interface PickerOption {
  value: string;
  label: string;
  hint?: string;
}

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
  const [query, setQuery] = useState('');
  const shown = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  const label = new Map(options.map((o) => [o.value, o.label]));
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Popover.Root onOpenChange={(o) => !o && setQuery('')}>
        <Popover.Trigger
          className={clsx(
            'caps flex items-center gap-1.5 border-b py-1.5 transition-colors',
            selected.length ? 'border-bronze text-ink' : 'border-transparent text-muted hover:border-gold hover:text-ink',
          )}
        >
          {selected.length ? `${placeholder} (${selected.length})` : placeholder}
          <ChevronDown aria-hidden className="size-3.5" strokeWidth={1.75} />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={8} className="z-40 w-80 border border-gold bg-paper shadow-[0_12px_32px_-12px_rgb(10_10_12/0.25)]">
            <label className="flex items-center gap-2 border-b border-gold/60 px-3">
              <Search aria-hidden className="size-4 text-muted" strokeWidth={1.5} />
              <span className="sr-only">{findLabel}</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={findLabel}
                className="h-10 w-full bg-transparent text-sm text-ink"
              />
            </label>
            <ul className="max-h-80 overflow-y-auto py-1">
              {shown.map((o) => {
                const on = selected.includes(o.value);
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(o.value)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink-soft hover:bg-gold-wash focus-visible:bg-gold-wash"
                    >
                      <span className={clsx('grid size-4 shrink-0 place-items-center border', on ? 'border-bronze bg-bronze text-paper' : 'border-muted')}>
                        {on && <Check aria-hidden className="size-3" strokeWidth={2.5} />}
                      </span>
                      <span className="flex-1">{o.label}</span>
                      {o.hint && <span className="tabular text-xs text-muted">{o.hint}</span>}
                    </button>
                  </li>
                );
              })}
              {shown.length === 0 && <li className="px-3 py-3 text-sm text-muted">Nothing matches “{query}”.</li>}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {selected.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => toggle(v)}
          aria-label={`Remove ${label.get(v) ?? v}`}
          className="flex items-center gap-1.5 border border-bronze/60 bg-paper px-2 py-0.5 text-xs text-ink hover:border-bronze"
        >
          {label.get(v) ?? v}
          <X aria-hidden className="size-3" strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
