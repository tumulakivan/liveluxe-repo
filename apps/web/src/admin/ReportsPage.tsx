import {
  FIELDS,
  PDF_MAX_COLUMNS,
  REPORT_COLUMNS,
  REPORT_PRESETS,
  type ReportColumn,
} from '@repo/shared';
import clsx from 'clsx';
import { Check, ChevronDown, Download } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { MultiPicker } from '../components/MultiPicker.tsx';
import { Button, Notice } from '../components/ui.tsx';
import { useAdminFacets, useAdminPlatforms, useReportPreview } from '../lib/admin-api.ts';
import { PageHeading } from './AdminShell.tsx';

// Reports: build a filter, choose columns, preview, then download a CSV or PDF of every match.
// The filter lives in the URL (shareable); the column choice is also remembered per browser.

type PlatformRule = 'any' | 'on' | 'off';
type Archived = 'exclude' | 'include' | 'only';

const COLUMNS_KEY = 'listing-repo:report-columns';
const ALL_COLUMN_KEYS = new Set(REPORT_COLUMNS.map((c) => c.key));

function rememberedColumns(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMNS_KEY) ?? 'null') as string[] | null;
    const valid = saved?.filter((k) => ALL_COLUMN_KEYS.has(k));
    return valid?.length ? valid : [...REPORT_PRESETS.summary];
  } catch {
    return [...REPORT_PRESETS.summary];
  }
}

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

function useReportState() {
  const [params, setParams] = useSearchParams();
  const [columns, setColumnsState] = useState<string[]>(() => {
    const fromUrl = list(params.get('columns')).filter((k) => ALL_COLUMN_KEYS.has(k));
    return fromUrl.length ? fromUrl : rememberedColumns();
  });
  const setColumns = useCallback((next: string[]) => {
    setColumnsState(next);
    try {
      localStorage.setItem(COLUMNS_KEY, JSON.stringify(next));
    } catch {
      // Storage can be refused (private windows); the choice still holds for this visit.
    }
  }, []);

  const archived: Archived = params.get('archivedOnly') === '1' ? 'only' : params.get('includeArchived') === '1' ? 'include' : 'exclude';
  const state = {
    on: list(params.get('on')),
    notOn: list(params.get('notOn')),
    match: params.get('match') === 'any' ? 'any' : 'all',
    notListed: params.get('notListed') === '1',
    cities: list(params.get('cities')),
    tags: list(params.get('tags')),
    activeOnly: params.get('activeOnly') === '1',
    manualOnly: params.get('manualOnly') === '1',
    empty: list(params.get('empty')),
    archived,
  };

  const set = useCallback(
    (patch: Record<string, string | null>) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  const filterQs = new URLSearchParams(
    Object.entries({
      on: state.on.join(','),
      notOn: state.notOn.join(','),
      match: state.on.length > 1 ? state.match : '',
      notListed: state.notListed ? '1' : '',
      cities: state.cities.join(','),
      tags: state.tags.join(','),
      activeOnly: state.activeOnly ? '1' : '',
      manualOnly: state.manualOnly ? '1' : '',
      empty: state.empty.join(','),
      includeArchived: archived === 'include' ? '1' : '',
      archivedOnly: archived === 'only' ? '1' : '',
    }).filter(([, v]) => v),
  ).toString();
  const qs = [filterQs, `columns=${columns.join(',')}`].filter(Boolean).join('&');

  return { state, set, columns, setColumns, qs };
}

function Block({ title, hint, first, children }: { title: string; hint?: string; first?: boolean; children: ReactNode }) {
  return (
    <section className={clsx('grid gap-x-10 gap-y-3 py-6 lg:grid-cols-[13rem_minmax(0,1fr)]', first ? 'pt-0' : 'border-t border-gold')}>
      <div>
        <h2 className="font-display text-[1.3rem] leading-tight font-semibold text-ink">{title}</h2>
        {hint && <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={clsx('caps border-b py-1.5 transition-colors', on ? 'border-bronze text-ink' : 'border-transparent text-muted hover:border-gold hover:text-ink')}
    >
      {children}
    </button>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex w-fit border border-gold">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={clsx('caps h-9 px-3 whitespace-nowrap transition-colors', value === v ? 'bg-ink text-paper' : 'text-muted hover:bg-gold-wash hover:text-ink')}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/**
 * A download link that stays a focusable link when unavailable, so keyboard and screen-reader users
 * still reach it and hear why (aria-describedby); activating it then does nothing.
 */
function DownloadLink({ href, disabled, primary, describedBy, children }: { href: string; disabled: boolean; primary?: boolean; describedBy?: string; children: ReactNode }) {
  return (
    <a
      href={disabled ? undefined : href}
      role="link"
      tabIndex={0}
      aria-disabled={disabled || undefined}
      aria-describedby={describedBy}
      onClick={(e) => disabled && e.preventDefault()}
      className={clsx(
        'caps inline-flex min-h-10 items-center gap-2 px-4 no-underline',
        primary
          ? disabled
            ? 'cursor-not-allowed bg-muted text-paper'
            : 'bg-ink text-paper hover:bg-bronze-deep'
          : disabled
            ? 'cursor-not-allowed border border-gold/60 text-muted'
            : 'border border-gold text-ink hover:bg-gold-wash',
      )}
    >
      <Download aria-hidden className="size-4" strokeWidth={1.75} />
      {children}
    </a>
  );
}

function ColumnPicker({ columns, setColumns }: { columns: string[]; setColumns: (c: string[]) => void }) {
  const groups = useMemo(() => {
    const m = new Map<string, ReportColumn[]>();
    for (const c of REPORT_COLUMNS) m.set(c.group, [...(m.get(c.group) ?? []), c]);
    return [...m];
  }, []);
  const chosen = new Set(columns);
  // Columns always keep the picker's order, so unticking and re-ticking never shuffles the report.
  const toggle = (k: string) => {
    const next = new Set(chosen);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setColumns(REPORT_COLUMNS.map((c) => c.key).filter((key) => next.has(key)));
  };
  const isPreset = (p: readonly string[]) => p.length === columns.length && p.every((k, i) => columns[i] === k);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Toggle on={isPreset(REPORT_PRESETS.summary)} onClick={() => setColumns([...REPORT_PRESETS.summary])}>
          Summary
        </Toggle>
        <Toggle on={isPreset(REPORT_PRESETS.everything)} onClick={() => setColumns([...REPORT_PRESETS.everything])}>
          Everything
        </Toggle>
        <span className="tabular text-sm text-ink-soft">
          {columns.length} column{columns.length === 1 ? '' : 's'} chosen
        </span>
      </div>
      <details className="group border border-gold/60 bg-paper/50">
        <summary className="caps flex cursor-pointer list-none items-center gap-1.5 px-4 py-3 text-bronze hover:text-ink [&::-webkit-details-marker]:hidden">
          Choose columns
          <ChevronDown aria-hidden className="size-3.5 transition-transform duration-200 group-open:rotate-180" strokeWidth={1.75} />
        </summary>
        <div className="grid gap-x-8 gap-y-5 border-t border-gold/60 px-4 py-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map(([group, cols]) => (
            <fieldset key={group}>
              <legend className="caps mb-2 text-bronze">{group}</legend>
              <ul className="flex flex-col gap-1">
                {cols.map((c) => (
                  <li key={c.key}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-ink-soft hover:text-ink">
                      <input type="checkbox" checked={chosen.has(c.key)} onChange={() => toggle(c.key)} className="peer sr-only" />
                      {/* The house check: square, bronze when on, focus ring from the hidden input. */}
                      <span
                        aria-hidden
                        className={clsx(
                          'mt-0.5 grid size-4 shrink-0 place-items-center border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bronze',
                          chosen.has(c.key) ? 'border-bronze bg-bronze text-paper' : 'border-muted',
                        )}
                      >
                        {chosen.has(c.key) && <Check className="size-3" strokeWidth={2.5} />}
                      </span>
                      {c.label}
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          ))}
        </div>
      </details>
    </div>
  );
}

export function ReportsPage() {
  const { state, set, columns, setColumns, qs } = useReportState();
  const platforms = useAdminPlatforms();
  const facets = useAdminFacets(new URLSearchParams({ includeArchived: '1', pageSize: '24' }).toString());
  const preview = useReportPreview(qs);
  const [announce, setAnnounce] = useState('');

  const active = (platforms.data ?? []).filter((p) => !p.retired);
  const ruleFor = (key: string): PlatformRule => (state.on.includes(key) ? 'on' : state.notOn.includes(key) ? 'off' : 'any');
  const setRule = (key: string, rule: PlatformRule) => {
    const on = state.on.filter((k) => k !== key);
    const notOn = state.notOn.filter((k) => k !== key);
    if (rule === 'on') on.push(key);
    if (rule === 'off') notOn.push(key);
    set({ on: on.join(',') || null, notOn: notOn.join(',') || null, notListed: null });
  };

  const fieldOptions = FIELDS.filter((f) => !f.hidden && f.key !== 'tags').map((f) => ({
    value: f.key,
    label: f.group && f.section !== 'additional' ? `${f.group}: ${f.label}` : f.label,
    hint: f.source === 'dashboard' ? 'Dashboard' : undefined,
  }));

  const total = preview.data?.total;
  const tooWide = columns.length > PDF_MAX_COLUMNS;
  const noColumns = columns.length === 0;
  const href = (kind: 'csv' | 'pdf') => `/api/admin/reports/${kind}?${qs}`;

  useEffect(() => {
    if (total !== undefined) setAnnounce(`${total} ${total === 1 ? 'property matches' : 'properties match'}.`);
  }, [total]);

  const downloads = (
    <div className="flex flex-wrap items-center gap-3">
      <DownloadLink href={href('csv')} disabled={noColumns} primary>
        Download CSV
      </DownloadLink>
      <DownloadLink href={href('pdf')} disabled={tooWide || noColumns} describedBy={tooWide ? 'pdf-limit' : undefined}>
        Download PDF
      </DownloadLink>
    </div>
  );

  return (
    <>
      <PageHeading title="Reports">{downloads}</PageHeading>
      {tooWide && (
        <p id="pdf-limit" className="-mt-4 mb-6 text-sm text-ink-soft">
          A PDF fits up to {PDF_MAX_COLUMNS} columns; you’ve chosen {columns.length}. The CSV includes them all.
        </p>
      )}

      <Block first title="Platforms" hint="Set each platform to Listed or Not listed. Leave it on Any to ignore it.">
        {platforms.isError && <Notice>{platforms.error.message}</Notice>}
        <ul className="divide-y divide-gold/35">
          {active.map((p) => (
            <li key={p.key} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
              <span className="text-[0.9375rem] text-ink">{p.name}</span>
              <Segmented
                label={`${p.name} rule`}
                value={ruleFor(p.key)}
                onChange={(r) => setRule(p.key, r)}
                options={[
                  ['any', 'Any'],
                  ['on', 'Listed'],
                  ['off', 'Not listed'],
                ]}
              />
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          {state.on.length > 1 && (
            <span className="flex items-center gap-3">
              <span className="text-sm text-ink-soft">Listed on</span>
              <Segmented
                label="Listed on all or any"
                value={state.match as 'all' | 'any'}
                onChange={(m) => set({ match: m === 'all' ? null : m })}
                options={[
                  ['all', 'All of them'],
                  ['any', 'Any of them'],
                ]}
              />
            </span>
          )}
          <Toggle on={state.notListed} onClick={() => set({ notListed: state.notListed ? null : '1', on: null, notOn: null })}>
            Not listed anywhere
          </Toggle>
        </div>
      </Block>

      <Block title="Narrow down">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Toggle on={state.activeOnly} onClick={() => set({ activeOnly: state.activeOnly ? null : '1' })}>
              Active tag
            </Toggle>
            <Toggle on={state.manualOnly} onClick={() => set({ manualOnly: state.manualOnly ? null : '1' })}>
              Added by hand
            </Toggle>
            <span className="flex items-center gap-3">
              <span className="text-sm text-ink-soft">Archived</span>
              <Segmented
                label="Archived properties"
                value={state.archived}
                onChange={(a) => set({ includeArchived: a === 'include' ? '1' : null, archivedOnly: a === 'only' ? '1' : null })}
                options={[
                  ['exclude', 'Leave out'],
                  ['include', 'Include'],
                  ['only', 'Only'],
                ]}
              />
            </span>
          </div>
          <MultiPicker
            placeholder="Area"
            findLabel="Find an area"
            options={(facets.data?.cities ?? []).map((c) => ({ value: c.value, label: c.label, hint: String(c.count) }))}
            selected={state.cities}
            onChange={(cities) => set({ cities: cities.join(',') || null })}
          />
          <MultiPicker
            placeholder="Tags (all of)"
            findLabel="Find a tag"
            options={(facets.data?.tags ?? []).map((t) => ({ value: t.value, label: t.label, hint: String(t.count) }))}
            selected={state.tags}
            onChange={(tags) => set({ tags: tags.join(',') || null })}
          />
        </div>
      </Block>

      <Block title="Empty fields" hint="Only properties where every chosen field is still empty.">
        <MultiPicker
          placeholder="Choose fields"
          findLabel="Find a field"
          options={fieldOptions}
          selected={state.empty}
          onChange={(empty) => set({ empty: empty.join(',') || null })}
        />
      </Block>

      <Block title="Columns" hint="Your choice is remembered on this computer.">
        <ColumnPicker columns={columns} setColumns={setColumns} />
      </Block>

      <section aria-labelledby="preview-h" className="border-t border-gold pt-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="preview-h" className="font-display flex items-baseline gap-3 text-[1.6rem] leading-tight font-semibold text-ink">
            Preview
            <span className="caps tabular text-bronze">{total === undefined ? '' : `${total} ${total === 1 ? 'property' : 'properties'}`}</span>
          </h2>
          {preview.data && preview.data.total > preview.data.rows.length && (
            <p className="text-[0.8125rem] text-muted">
              Showing the first {preview.data.rows.length}. Downloads include all {preview.data.total}.
            </p>
          )}
        </div>
        <p className="sr-only" role="status">
          {announce}
        </p>
        {preview.data && (
          // Each filter is its own piece, told apart by spacing, never joined with dots.
          <ul aria-label="Filters" className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
            {preview.data.filters.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
        {preview.isError && <Notice>{preview.error.message}</Notice>}
        {noColumns ? (
          <p className="border-y border-gold py-10 text-center text-ink-soft">Choose at least one column.</p>
        ) : preview.data && preview.data.total === 0 ? (
          <div className="border-y border-gold px-1 py-12 text-center">
            <h3 className="font-display text-3xl font-semibold text-ink">No properties match</h3>
            <p className="mx-auto mt-3 max-w-[48ch] text-ink-soft">Loosen a platform rule, a tag or an empty-field filter.</p>
            <Button className="mt-6" onClick={() => set(Object.fromEntries(['on', 'notOn', 'match', 'notListed', 'cities', 'tags', 'activeOnly', 'manualOnly', 'empty', 'includeArchived', 'archivedOnly'].map((k) => [k, null])))}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className={clsx(preview.isPlaceholderData && 'opacity-60')}>
            {/* Phones: one stacked block per property, label beside value. */}
            <ul className="border-t border-gold md:hidden">
              {(preview.data?.rows ?? []).map((r, i) => (
                <li key={i} className="border-b border-gold/45 py-4">
                  {r.map((v, j) =>
                    preview.data!.columns[j]!.key === 'p:name' ? (
                      <h3 key="name" className="font-display mb-2 text-[1.1rem] leading-tight font-semibold text-ink">
                        {v}
                      </h3>
                    ) : null,
                  )}
                  <dl className="flex flex-col gap-1.5">
                    {r.map((v, j) => {
                      const col = preview.data!.columns[j]!;
                      return col.key === 'p:name' ? null : (
                        <div key={col.key} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 text-sm">
                          <dt className="text-muted">{col.label}</dt>
                          <dd className="tabular line-clamp-4 whitespace-pre-line [overflow-wrap:anywhere] text-ink-soft">{v || '—'}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </li>
              ))}
            </ul>
          <div className="relative hidden overflow-x-auto border-t border-gold md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="caps text-bronze">
                  {(preview.data?.columns ?? []).map((c) => (
                    <th key={c.key} scope="col" className="min-w-32 py-3 pr-4 align-bottom font-medium">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(preview.data?.rows ?? []).map((r, i) => (
                  <tr key={i} className="border-t border-gold/45 align-top transition-colors hover:bg-paper">
                    {r.map((v, j) => (
                      <td key={j} className={clsx('tabular py-2.5 pr-4', preview.data?.columns[j]?.key === 'p:name' ? 'font-display text-[1.1rem] font-semibold text-ink' : 'text-ink-soft')}>
                        <span className="line-clamp-4 whitespace-pre-line">{v || <span className="text-muted">—</span>}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            {preview.isPending && <div className="shimmer h-40" aria-busy="true" />}
          </div>
        )}
      </section>
    </>
  );
}
