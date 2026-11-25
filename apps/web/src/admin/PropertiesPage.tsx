import type { PropertySummary } from '@repo/shared';
import * as Tooltip from '@radix-ui/react-tooltip';
import clsx from 'clsx';
import { Plus, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { PlatformBubbles } from '../components/PlatformBubbles.tsx';
import { Button, Notice, TextInput } from '../components/ui.tsx';
import { DetailPanel } from '../browse/DetailPanel.tsx';
import { SearchField } from '../browse/FilterBar.tsx';
import { Pagination } from '../browse/Pagination.tsx';
import { useAdminProperties, useCreateProperty, useRole, useSetRemoved } from '../lib/admin-api.ts';
import { TagPicker } from '../components/TagPicker.tsx';
import { onboardingStatus } from '../lib/onboarding.ts';
import { PageHeading } from './AdminShell.tsx';

type Removed = 'hide' | 'only' | 'all';
type Stage = 'all' | 'live' | 'onboarding';

const STAGES: { value: Stage; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Existing listings' },
  { value: 'onboarding', label: 'Onboarding' },
];

const CHIPS: { key: string; label: string; api: string }[] = [
  { key: 'active', label: 'Active tag', api: 'activeOnly' },
  { key: 'notListed', label: 'Not listed anywhere', api: 'notListed' },
  { key: 'archivedOnly', label: 'Archived only', api: 'archivedOnly' },
  { key: 'archived', label: 'Include archived', api: 'includeArchived' },
];

function useAdminListState() {
  const [params, setParams] = useSearchParams();
  const removed = (['hide', 'only', 'all'] as const).find((r) => r === params.get('removed')) ?? 'hide';
  // ?manual=1 is the old link for hand-added properties, now onboarding listings.
  const stage = STAGES.find((s) => s.value === params.get('stage'))?.value ?? (params.get('manual') === '1' ? 'onboarding' : 'all');
  const state = {
    q: params.get('q') ?? '',
    stage,
    removed: removed as Removed,
    flags: Object.fromEntries(CHIPS.map((c) => [c.key, params.get(c.key) === '1'])) as Record<string, boolean>,
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: [24, 48, 96].includes(Number(params.get('size'))) ? Number(params.get('size')) : 48,
    open: Number(params.get('p')) || null,
  };
  const set = useCallback(
    (patch: Record<string, string | null>, resetPage = true) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
        if (resetPage && !('page' in patch)) next.delete('page');
        return next;
      }),
    [setParams],
  );
  const qs = new URLSearchParams({
    page: String(state.page),
    pageSize: String(state.pageSize),
    removed: state.removed,
    stage: state.stage,
    ...(state.q ? { q: state.q } : {}),
    ...Object.fromEntries(CHIPS.filter((c) => state.flags[c.key]).map((c) => [c.api, '1'])),
  }).toString();
  const filtersActive = !!state.q || state.removed !== 'hide' || state.stage !== 'all' || CHIPS.some((c) => state.flags[c.key]);
  const clear = () => set({ q: null, removed: null, stage: null, manual: null, ...Object.fromEntries(CHIPS.map((c) => [c.key, null])) });
  return { state, set, qs, filtersActive, clear };
}

type Removal = { id: number; name: string };

function RemoveButton({ p, onRemoved }: { p: PropertySummary; onRemoved: (r: Removal) => void }) {
  const setRemoved = useSetRemoved(p.id);
  return (
    <span className="relative z-10 flex flex-col items-end gap-1">
      <Button
        variant="quiet"
        busy={setRemoved.isPending}
        onClick={() => setRemoved.mutate(!p.removed, { onSuccess: () => !p.removed && onRemoved({ id: p.id, name: p.name }) })}
      >
        {p.removed ? 'Restore' : 'Remove'}
      </Button>
      {setRemoved.error && <Notice className="text-xs">{setRemoved.error.message}</Notice>}
    </span>
  );
}

/** After a removal the row leaves the list; this line announces it and offers the way back, with focus on Restore. */
function RemovedNotice({ removal, onDone }: { removal: Removal; onDone: (restored: boolean) => void }) {
  const restore = useSetRemoved(removal.id);
  const button = useRef<HTMLButtonElement>(null);
  const messageId = useId();
  useEffect(() => button.current?.focus(), [removal.id]);
  return (
    <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y border-hairline bg-paper px-4 py-3">
      <p id={messageId} className="text-sm text-ink">
        Removed <span className="font-medium">{removal.name}</span> from the repo. Hostaway is unchanged.
      </p>
      <span className="flex items-center gap-5">
        {/* Focus lands here at once, so the message is tied to the button: focusing it reads what was removed. */}
        <Button
          ref={button}
          variant="secondary"
          aria-describedby={messageId}
          busy={restore.isPending}
          onClick={() => restore.mutate(false, { onSuccess: () => onDone(true) })}
        >
          Restore
        </Button>
        <Button variant="quiet" onClick={() => onDone(false)}>
          Dismiss
        </Button>
      </span>
      <Notice className="basis-full">{restore.error?.message}</Notice>
    </div>
  );
}

function statusBits(p: PropertySummary): string[] {
  return [
    p.removed && 'Removed',
    p.archived && 'Archived',
    onboardingStatus(p),
    p.tags.some((t) => t.toLowerCase() === 'active') && 'Active tag',
  ].filter(Boolean) as string[];
}

function OpenButton({ p, onOpen, className }: { p: PropertySummary; onOpen: (id: number) => void; className?: string }) {
  return (
    <button
      type="button"
      data-open-id={p.id}
      onClick={() => onOpen(p.id)}
      className={clsx(
        'font-display text-left text-[1.1rem] leading-tight font-semibold text-ink after:absolute after:inset-0 after:content-[\'\'] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-bronze',
        className,
      )}
    >
      {p.name}
    </button>
  );
}

function AddProperty({ onCreated }: { onCreated: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const create = useCreateProperty();
  const id = useId();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(
      { name, tags },
      {
        onSuccess: (p) => {
          setName('');
          setTags([]);
          setOpen(false);
          onCreated(p.id);
        },
      },
    );
  };
  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden className="size-4" strokeWidth={1.75} />
        Create new listing
      </Button>
    );
  }
  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:w-auto">
      <label htmlFor={id} className="caps text-bronze">
        New listing name
      </label>
      <div className="flex gap-2">
        <TextInput
          id={id}
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. [ONBOARDING] 123/45 Test Street - 2 BR with Pool and Gym"
          className="sm:w-[28rem]"
        />
        <Button type="submit" busy={create.isPending} disabled={name.trim().length < 2}>
          Create
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} aria-label="Cancel creating a listing">
          <X aria-hidden className="size-4" strokeWidth={1.75} />
        </Button>
      </div>
      <span className="caps mt-2 text-bronze">Tags</span>
      <TagPicker value={tags} onChange={setTags} />
      <Notice>{create.error?.message}</Notice>
      <p className="max-w-[60ch] text-[0.8125rem] text-muted">
        It starts as an onboarding listing, seen only by people signed in. Fill in the details in the panel that opens next. Once an admin approves it
        and adds its Hostaway ID, the next Sync Hostaway replaces it with the Hostaway listing.
      </p>
    </form>
  );
}

export function PropertiesPage() {
  const { state, set, qs, filtersActive, clear } = useAdminListState();
  const list = useAdminProperties(qs);
  const isAdmin = useRole() === 'admin';
  const [removal, setRemoval] = useState<Removal | null>(null);
  // When the strip closes, focus moves on rather than dropping to the page: to the restored row, else to search.
  const [focusAfter, setFocusAfter] = useState<{ id: number | null } | null>(null);
  useEffect(() => {
    if (!focusAfter || list.isFetching) return;
    const openers = focusAfter.id === null ? [] : [...document.querySelectorAll<HTMLElement>(`[data-open-id="${focusAfter.id}"]`)];
    const target = openers.find((el) => el.offsetParent !== null) ?? document.querySelector<HTMLElement>('input[aria-label="Search properties"]');
    target?.focus();
    setFocusAfter(null);
  }, [focusAfter, list.isFetching, list.data]);
  const open = (id: number) => set({ p: String(id) }, false);
  const onSearch = useCallback((q: string) => set({ q: q || null }), [set]);
  const items = list.data?.items ?? [];

  return (
    <Tooltip.Provider delayDuration={250}>
      <PageHeading title="Properties">
        <AddProperty onCreated={open} />
      </PageHeading>

      <div className="flex flex-col gap-5">
        <SearchField value={state.q} onChange={onSearch} />
        <div role="group" aria-label="Which listings" className="flex w-fit border border-hairline">
          {STAGES.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={state.stage === s.value}
              onClick={() => set({ stage: s.value === 'all' ? null : s.value, manual: null })}
              className={clsx('caps h-9 px-4 transition-colors', state.stage === s.value ? 'bg-ink text-paper' : 'text-muted hover:bg-hover-wash hover:text-ink')}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {CHIPS.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={state.flags[c.key]}
              onClick={() => set({ [c.key]: state.flags[c.key] ? null : '1' })}
              className={clsx(
                'caps border-b py-1.5 transition-colors',
                state.flags[c.key] ? 'border-bronze text-ink' : 'border-transparent text-muted hover:border-hairline hover:text-ink',
              )}
            >
              {c.label}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2">
            <span className="caps text-muted">Show</span>
            <select
              value={state.removed}
              onChange={(e) => set({ removed: e.target.value === 'hide' ? null : e.target.value })}
              className="h-9 border border-edge bg-transparent px-3 text-sm text-ink hover:bg-hover-wash"
            >
              <option value="hide">In the repo</option>
              <option value="only">Removed only</option>
              <option value="all">Both</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6">
        {removal && (
          <RemovedNotice
            removal={removal}
            onDone={(restored) => {
              setFocusAfter({ id: restored ? removal.id : null });
              setRemoval(null);
            }}
          />
        )}

        {list.isPending ? (
          <div className="flex flex-col gap-px border-t border-hairline" aria-busy="true">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="shimmer h-14" />
            ))}
          </div>
        ) : list.isError ? (
          <Notice>{list.error.message}</Notice>
        ) : items.length === 0 ? (
          <div className="border-y border-hairline px-1 py-14 text-center">
            <h2 className="font-display text-3xl font-semibold text-ink">No properties match</h2>
            <p className="mx-auto mt-3 max-w-[48ch] text-ink-soft">
              {state.q ? `Nothing matches “${state.q}” with these filters.` : 'Nothing matches this combination of filters.'}
            </p>
            {filtersActive && (
              <Button onClick={clear} className="mt-6">
                Clear search and filters
              </Button>
            )}
          </div>
        ) : (
          <div className={clsx(list.isPlaceholderData && 'opacity-60')}>
            {/* Phones: stacked rows rather than a table scrolled sideways. */}
            <ul className="border-t border-hairline md:hidden">
              {items.map((p) => (
                <li key={p.id} className={clsx('relative flex flex-col gap-2 border-b border-hairline/45 py-4 has-[button[data-open-id]:focus-visible]:bg-paper', p.removed && 'text-muted')}>
                  <OpenButton p={p} onOpen={open} />
                  <p className="caps tabular flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-bronze">{p.hostawayId ? `Listing ${p.hostawayId}` : 'Not in Hostaway yet'}</span>
                    {p.city && <span className="text-ink-soft">{p.city}</span>}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <PlatformBubbles platforms={p.platforms} />
                    {isAdmin && <RemoveButton p={p} onRemoved={setRemoval} />}
                  </div>
                  {statusBits(p).length > 0 && <span className="caps text-muted">{statusBits(p).join(' · ')}</span>}
                </li>
              ))}
            </ul>

            <div className="relative hidden overflow-x-auto border-t border-hairline md:block">
              <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="caps text-bronze">
                    <th scope="col" className="py-3 pr-4 font-medium">Property</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Listing ID</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Listed on</th>
                    <th scope="col" className="py-3 pr-4 font-medium">Status</th>
                    <th scope="col" className="py-3 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className={clsx('group relative border-t border-hairline/45 hover:bg-paper has-[button[data-open-id]:focus-visible]:bg-paper', p.removed && 'text-muted')}>
                      <td className="py-3 pr-4">
                        <OpenButton p={p} onOpen={open} />
                        {p.city && <span className="mt-0.5 block text-[0.8125rem] text-muted">{p.city}</span>}
                      </td>
                      <td className="tabular py-3 pr-4 text-ink-soft">{p.hostawayId ?? <span className="text-muted">None yet</span>}</td>
                      <td className="py-3 pr-4">
                        {/* Keep the logos on one line; the column takes their width. */}
                        <div className="w-max">
                          <PlatformBubbles platforms={p.platforms} />
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="caps whitespace-nowrap text-muted">{statusBits(p).join(' · ') || '—'}</span>
                      </td>
                      <td className="py-3 text-right">
                        {isAdmin && <RemoveButton p={p} onRemoved={setRemoval} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {list.data && list.data.total > 0 && (
        <div className="mt-6">
          <Pagination
            page={list.data.page}
            pageCount={list.data.pageCount}
            pageSize={list.data.pageSize}
            total={list.data.total}
            onPage={(page) => set({ page: page > 1 ? String(page) : null }, false)}
            onPageSize={(s) => set({ size: String(s) })}
          />
        </div>
      )}

      <DetailPanel id={state.open} mode="admin" onClose={() => set({ p: null }, false)} />
    </Tooltip.Provider>
  );
}
