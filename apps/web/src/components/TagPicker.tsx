import clsx from 'clsx';
import { ChevronDown, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { useAllTags } from '../lib/admin-api.ts';
import { ChecklistPopover, RemovableChip } from './MultiPicker.tsx';

// Choose a listing's tags ("Property Management", "Rental Arbitrage", …): pick from the tags already
// in use, or add a new one. Used by Create new listing and the onboarding block of the panel.

export function TagPicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const { tags, isError } = useAllTags();
  const [draft, setDraft] = useState('');
  const id = useId();
  // Tags already chosen stay in the list even if no other property uses them.
  const options = [
    ...tags.map((t) => ({ value: t.value, label: t.label, hint: t.count })),
    ...value.filter((v) => !tags.some((t) => t.value === v)).map((v) => ({ value: v, label: v })),
  ];
  const addDraft = () => {
    const t = draft.trim().replace(/\s+/g, ' ');
    if (!t) return;
    // Reuse an existing tag's spelling when only the case differs.
    const known = options.find((o) => o.value.toLowerCase() === t.toLowerCase())?.value ?? t;
    if (!value.includes(known)) onChange([...value, known]);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <ChecklistPopover
          label="Tags"
          findLabel="Find tags"
          options={options}
          selected={value}
          onChange={onChange}
          searchable
          width="w-80"
          emptyText={isError ? 'Tags couldn’t be loaded. Add one below.' : undefined}
          trigger={
            <button
              type="button"
              className={clsx(
                'caps flex items-center gap-1.5 border-b py-1.5 transition-colors',
                value.length ? 'border-bronze text-ink' : 'border-transparent text-muted hover:border-hairline hover:text-ink',
              )}
            >
              {value.length ? `Tags (${value.length})` : 'Choose tags'}
              <ChevronDown aria-hidden className="size-3.5" strokeWidth={1.75} />
            </button>
          }
        />
        {value.map((t) => (
          <RemovableChip key={t} label={t} onRemove={() => onChange(value.filter((x) => x !== t))} removeLabel={`Remove tag ${t}`} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="sr-only">
          New tag
        </label>
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter adds the tag instead of submitting the surrounding form.
            if (e.key === 'Enter') {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder="New tag, e.g. Rental Arbitrage"
          maxLength={200}
          className="h-9 w-64 border border-edge bg-paper px-3 text-sm text-ink focus:border-bronze"
        />
        <button
          type="button"
          onClick={addDraft}
          disabled={!draft.trim()}
          className="caps flex h-9 items-center gap-1.5 border border-hairline px-3 text-ink hover:bg-hover-wash disabled:opacity-40"
        >
          <Plus aria-hidden className="size-3.5" strokeWidth={1.75} />
          Add tag
        </button>
      </div>
    </div>
  );
}
