import type { FieldDef } from '@repo/shared';
import clsx from 'clsx';
import { useId, useState, type FormEvent } from 'react';
import { Button, Notice } from '../components/ui.tsx';
import { useSaveFields } from '../lib/admin-api.ts';

// Inline editor for one field in the admin panel. The value is checked again on the server.

type Draft = string;

function toDraft(def: FieldDef, value: unknown): Draft {
  if (value === null || value === undefined) return '';
  if (def.type === 'list' && Array.isArray(value)) return value.join('\n');
  if (def.type === 'boolean') return value ? 'yes' : 'no';
  return String(value);
}

function fromDraft(def: FieldDef, draft: Draft): { ok: true; value: unknown } | { ok: false; message: string } {
  const t = draft.trim();
  if (t === '') return { ok: true, value: null };
  switch (def.type) {
    case 'boolean':
      return { ok: true, value: t === 'yes' };
    case 'number':
    case 'percent':
    case 'hour':
    case 'hours': {
      const n = Number(t);
      if (!Number.isFinite(n)) return { ok: false, message: 'Enter a number.' };
      if ((def.type === 'hour' || def.type === 'hours') && !Number.isInteger(n)) return { ok: false, message: 'Enter a whole number.' };
      return { ok: true, value: n };
    }
    case 'list':
      return { ok: true, value: t.split(/\n|,/).map((s) => s.trim()).filter(Boolean) };
    case 'longtext':
      return { ok: true, value: draft };
    default:
      return { ok: true, value: t };
  }
}

const HINT: Partial<Record<FieldDef['type'], string>> = {
  hour: 'Hour of the day, 0–23 (15 = 15:00)',
  hours: 'In hours (24 = 1 day)',
  percent: 'Percent, e.g. 22',
  list: 'One per line',
};

export function FieldEditor({ propertyId, def, value, onDone }: { propertyId: number; def: FieldDef; value: unknown; onDone: () => void }) {
  const [draft, setDraft] = useState(() => toDraft(def, value));
  const [problem, setProblem] = useState<string | null>(null);
  const save = useSaveFields(propertyId);
  const id = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = fromDraft(def, draft);
    if (!parsed.ok) return setProblem(parsed.message);
    setProblem(null);
    save.mutate({ [def.key]: parsed.value }, { onSuccess: onDone });
  };

  const field =
    def.type === 'boolean' ? (
      <div role="group" aria-labelledby={`${id}-l`} className="flex w-fit border border-gold">
        {[
          ['yes', 'Yes'],
          ['no', 'No'],
          ['', 'Not set'],
        ].map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={draft === v}
            onClick={() => setDraft(v!)}
            className={clsx('caps h-9 px-3', draft === v ? 'bg-ink text-paper' : 'text-muted hover:bg-gold-wash hover:text-ink')}
          >
            {label}
          </button>
        ))}
      </div>
    ) : def.type === 'longtext' || def.type === 'list' ? (
      <textarea
        id={id}
        autoFocus
        rows={def.type === 'list' ? 4 : 7}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full border border-gold bg-paper p-3 text-[0.9375rem] leading-relaxed text-ink focus:border-bronze"
      />
    ) : (
      <input
        id={id}
        autoFocus
        inputMode={def.type === 'text' ? undefined : 'decimal'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="h-10 w-full max-w-md border border-gold bg-paper px-3 text-[0.9375rem] text-ink focus:border-bronze"
      />
    );

  return (
    <form data-field-editor onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onDone()} className="flex flex-col gap-2">
      <label id={`${id}-l`} htmlFor={id} className="sr-only">
        {def.label}
      </label>
      {field}
      {HINT[def.type] && <span className="text-[0.8125rem] text-muted">{HINT[def.type]}</span>}
      <Notice>{problem ?? save.error?.message}</Notice>
      <span className="flex items-center gap-3">
        <Button type="submit" busy={save.isPending}>
          Save
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </span>
    </form>
  );
}
