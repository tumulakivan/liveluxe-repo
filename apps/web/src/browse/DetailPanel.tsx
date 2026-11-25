import {
  FIELDS,
  SECTIONS,
  type FieldDef,
  type FieldValue,
  type PropertyDetail,
  type SectionKey,
} from '@repo/shared';
import * as Dialog from '@radix-ui/react-dialog';
import clsx from 'clsx';
import { Check, Copy, ImageOff, Lock, Pencil, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PlatformBubbles } from '../components/PlatformBubbles.tsx';
import { Tags } from '../components/Tags.tsx';
import { Link } from 'react-router';
import { useAdminProperty, useMe } from '../lib/admin-api.ts';
import { useProperty } from '../lib/api.ts';
import { AdminTools } from './AdminTools.tsx';
import { FieldEditor } from './FieldEditor.tsx';
import { copyText } from '../lib/clipboard.ts';
import { formatValue, formatWhen } from '../lib/format.ts';
import { ApiError } from '../lib/http.ts';
import { scrollBehavior } from '../lib/motion.ts';

// The property dossier: every field, grouped by section, in one scroll with a sticky index.
// Read-only on the main app; in the dashboard (mode "admin") the fields an admin may change get an editor.

interface Group {
  label: string | null;
  fields: FieldDef[];
}

interface Section {
  key: SectionKey;
  label: string;
  groups: Group[];
  filled: number;
  total: number;
}

function buildSections(p: PropertyDetail): Section[] {
  const listed = new Set(p.platforms.map((b) => b.key));
  const visible = FIELDS.filter((f) => !f.hidden && (!f.platform || listed.has(f.platform)));
  return SECTIONS.map((s) => {
    const fields = visible.filter((f) => f.section === s.key);
    const groups: Group[] = [];
    for (const f of fields) {
      const label = f.group ?? null;
      const last = groups.at(-1);
      if (last && last.label === label) last.fields.push(f);
      else groups.push({ label, fields: [f] });
    }
    const filled = fields.filter((f) => formatValue(f, p.values[f.key]?.value) !== null).length;
    return { key: s.key, label: s.label, groups, filled, total: fields.length };
  });
}

const SOURCE_LABEL: Record<FieldValue['source'], string> = {
  sync: 'Hostaway',
  claude: 'Claude',
  admin: 'Admin',
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [result, setResult] = useState<'copied' | 'failed' | null>(null);
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 2400);
    return () => clearTimeout(t);
  }, [result]);
  return (
    <>
      <button
        type="button"
        onClick={() => copyText(text).then((ok) => setResult(ok ? 'copied' : 'failed'))}
        aria-label={`Copy ${label}`}
        className={clsx(
          'grid size-7 shrink-0 place-items-center text-muted transition-opacity group-hover/field:opacity-100 hover:text-bronze focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
          result ? 'opacity-100' : 'opacity-0',
        )}
      >
        {result === 'copied' ? <Check aria-hidden className="size-3.5 text-bronze" strokeWidth={2} /> : <Copy aria-hidden className="size-3.5" strokeWidth={1.5} />}
      </button>
      {/* Announced; shown when copying fails so the value can be selected by hand instead. */}
      <span role="status" className={clsx('self-center text-[0.6875rem]', result === 'failed' ? 'text-danger' : 'sr-only')}>
        {result === 'copied' ? `${label} copied` : result === 'failed' ? "Couldn't copy. Select the text instead." : ''}
      </span>
    </>
  );
}

const URL_PART = /(https?:\/\/[^\s<>"')\]]+)/;

/** Text with its web addresses as links (check-in videos, the photos folder). */
function Linked({ text }: { text: string }) {
  return (
    <>
      {text.split(URL_PART).map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noreferrer noopener" className="[overflow-wrap:anywhere] text-bronze underline hover:text-ink">
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

function LongText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 420 || text.split('\n').length > 7;
  return (
    <div>
      <p className={clsx('max-w-[68ch] leading-relaxed whitespace-pre-line text-ink-soft', long && !open && 'line-clamp-6')}>
        <Linked text={text} />
      </p>
      {long && (
        <button type="button" onClick={() => setOpen(!open)} className="caps mt-2 text-[0.625rem] text-bronze underline">
          {open ? 'Show less' : 'Show all'}
        </button>
      )}
    </div>
  );
}

/**
 * Hostaway-sourced fields stay read-only on imported properties; everything else is an admin's to edit.
 * A fillable field (the house manual parts) is the admin's to fill while Hostaway has nothing for it.
 */
const canEdit = (def: FieldDef, p: PropertyDetail, value: FieldValue | undefined) =>
  def.source !== 'hostaway' ||
  p.hostawayId === null ||
  (!!def.fillable && !(value?.source === 'sync' && formatValue(def, value.value) !== null));

const SYNC_BY = 'Sync Hostaway';

function FieldRow({ def, value, p, admin }: { def: FieldDef; value: FieldValue | undefined; p: PropertyDetail; admin: boolean }) {
  const [editing, setEditing] = useState(false);
  const [refocus, setRefocus] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!editing && refocus) {
      editButton.current?.focus();
      setRefocus(false);
    }
  }, [editing, refocus]);
  const editable = admin && canEdit(def, p, value);
  const text = formatValue(def, value?.value);
  // Synced values are credited once per section. Marked here: values set by Claude or an admin, and
  // synced values taken from somewhere other than the usual place (Airbnb's check-in instructions).
  const provenance =
    !value || text === null
      ? null
      : value.source !== 'sync'
        ? `Set by ${value.updatedBy ?? SOURCE_LABEL[value.source]} · ${formatWhen(value.updatedAt)}`
        : value.updatedBy && value.updatedBy !== SYNC_BY
          ? `From ${value.updatedBy}`
          : null;
  const empty = def.source === 'dashboard' && !value ? 'Not filled yet' : 'Empty';
  const list = Array.isArray(value?.value) ? (value.value as string[]) : null;
  const url = def.type === 'text' && text !== null && URL_PART.test(text) && !/\s/.test(text);
  return (
    <div className="group/field grid grid-cols-[minmax(0,1fr)] gap-1 py-2.5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-6">
      <dt className="flex flex-col gap-0.5 pt-0.5 text-[0.8125rem] leading-snug text-muted">
        <span className="flex items-start gap-1.5">
          {def.label}
          {admin && !editable && (
            <span title="From Hostaway. Change it there, then run Sync Hostaway." className="mt-px shrink-0">
              <Lock aria-label="From Hostaway, read-only" className="size-3 text-muted" strokeWidth={1.75} />
            </span>
          )}
        </span>
        {def.hint && admin && <span className="text-[0.6875rem] leading-snug text-muted/80">{def.hint}</span>}
      </dt>
      <dd className="min-w-0 text-[0.9375rem]">
        {editing ? (
          <FieldEditor
            propertyId={p.id}
            def={def}
            value={value?.value}
            onDone={() => {
              setEditing(false);
              setRefocus(true);
            }}
          />
        ) : (
        <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
        {text === null ? (
          <span className="text-sm text-muted">{empty}</span>
        ) : def.type === 'longtext' ? (
          <LongText text={text} />
        ) : list && def.display === 'lines' ? (
          <ul className="flex flex-col gap-0.5 text-ink">
            {list.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : list && (def.display === 'chips' || def.key === 'tags') ? (
          <Tags tags={list} label={def.label} />
        ) : url ? (
          <span className="flex items-start gap-1">
            <span className="min-w-0">
              <Linked text={text} />
            </span>
            <CopyButton text={text} label={def.label} />
          </span>
        ) : (
          <span className="flex items-start gap-1">
            <span className="tabular min-w-0 select-all [overflow-wrap:anywhere] text-ink">{text}</span>
            {def.type === 'text' && <CopyButton text={text} label={def.label} />}
          </span>
        )}
        {provenance && <span className="mt-1 block text-[0.6875rem] text-bronze">{provenance}</span>}
        </div>
        {editable && (
          <button
            ref={editButton}
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${def.label}`}
            className="grid size-8 shrink-0 place-items-center text-muted transition-colors hover:bg-hover-wash hover:text-bronze"
          >
            <Pencil aria-hidden className="size-3.5" strokeWidth={1.5} />
          </button>
        )}
        </div>
        )}
      </dd>
    </div>
  );
}

function SectionBlock({ section, p, admin }: { section: Section; p: PropertyDetail; admin: boolean }) {
  return (
    <section id={`sec-${section.key}`} data-section={section.key} aria-labelledby={`h-${section.key}`} className="scroll-mt-6 pt-8 first:pt-2">
      <h3 id={`h-${section.key}`} className="font-display flex items-baseline gap-3 border-b border-hairline pb-2 text-[1.6rem] leading-tight font-semibold text-ink">
        {section.label}
        <span className="caps tabular text-[0.625rem] font-normal text-muted">
          {section.filled} of {section.total} filled
        </span>
      </h3>
      {section.total === 0 ? (
        <p className="py-4 text-sm text-muted">No fields.</p>
      ) : (
        section.groups.map((g, i) => (
          <div key={`${g.label}-${i}`}>
            {g.label && <h4 className="caps pt-5 pb-1 text-[0.625rem] text-bronze">{g.label}</h4>}
            <dl className="divide-y divide-hairline/35">
              {g.fields.map((f) => (
                <FieldRow key={f.key} def={f} value={p.values[f.key]} p={p} admin={admin} />
              ))}
            </dl>
          </div>
        ))
      )}
    </section>
  );
}

/** The section whose heading most recently passed the top of the panel. */
function useActiveSection(root: HTMLElement | null, keys: string[]) {
  const [active, setActive] = useState(keys[0]);
  useEffect(() => {
    if (!root) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const top = root.getBoundingClientRect().top + 96;
      let current = keys[0];
      for (const el of root.querySelectorAll<HTMLElement>('[data-section]')) {
        if (el.getBoundingClientRect().top <= top) current = el.dataset.section!;
      }
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 4) current = keys.at(-1);
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [root, keys]);
  return active;
}

function Dossier({ p, admin: signedIn }: { p: PropertyDetail; admin: boolean }) {
  const me = useMe();
  // Contributors change onboarding listings only; on existing listings they get the read-only view.
  const admin = signedIn && (me.data?.role === 'admin' || p.hostawayId === null);
  const sections = useMemo(() => buildSections(p), [p]);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const keys = useMemo(() => sections.map((s) => s.key), [sections]);
  const active = useActiveSection(scroller, keys);
  const photo = p.photoUrl;
  // Remember which photo failed, so a newly uploaded one gets its own chance to load.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const photoFailed = failedSrc === photo;

  const jump = (key: string) => {
    scroller?.querySelector(`#sec-${key}`)?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  };

  return (
    <div ref={setScroller} className="h-full overflow-y-auto overscroll-contain">
      <header className="grid grid-cols-[minmax(0,1fr)] gap-5 border-b border-hairline px-6 pt-6 pb-6 sm:grid-cols-[13rem_minmax(0,1fr)] sm:px-8">
        <div className="aspect-[4/3] overflow-hidden bg-stone sm:aspect-auto sm:h-40">
          {photo && !photoFailed ? (
            <img src={photo} alt={`Display photo of ${p.name}`} onError={() => setFailedSrc(photo)} className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-muted">
              <ImageOff aria-hidden className="size-6" strokeWidth={1.25} />
              <span className="sr-only">No photo</span>
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-3 pr-8">
          <Dialog.Title className="font-display text-[1.9rem] leading-[1.08] font-semibold tracking-[-0.005em] [overflow-wrap:anywhere] text-ink">{p.name}</Dialog.Title>
          <Dialog.Description className="caps tabular flex flex-wrap gap-x-2 text-[0.625rem] text-bronze">
            <span>{p.hostawayId ? `Listing ${p.hostawayId}` : 'Onboarding · not in Hostaway yet'}</span>
            {p.city && <span>· {p.city}</span>}
            <span>· {p.photoCount ?? 0} photos</span>
            {p.lastSyncedAt && <span className="text-muted">· Synced {formatWhen(p.lastSyncedAt)}</span>}
            {p.archived && <span className="text-muted">· Archived in Hostaway</span>}
          </Dialog.Description>
          <PlatformBubbles platforms={p.platforms} size="md" />
          <Tags tags={p.tags} />
          {!signedIn && me.data && !me.data.mustChangePassword && (
            <Link to={`/admin/properties?p=${p.id}`} className="caps w-fit text-bronze underline hover:text-ink">
              Edit in dashboard
            </Link>
          )}
        </div>
      </header>
      {admin && <AdminTools p={p} />}

      <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[11rem_minmax(0,1fr)]">
        <nav aria-label="Sections" className="sticky top-0 z-10 border-b border-hairline bg-paper/95 backdrop-blur-sm sm:h-fit sm:border-b-0 sm:bg-transparent sm:backdrop-blur-none">
          <ul className="flex gap-x-5 overflow-x-auto px-6 py-3 pr-12 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_82%,transparent)] sm:[mask-image:none] sm:flex-col sm:gap-0.5 sm:px-0 sm:py-8 sm:pr-0 sm:pl-8">
            {sections.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => jump(s.key)}
                  aria-current={active === s.key ? 'location' : undefined}
                  className={clsx(
                    'caps w-full border-b py-1.5 text-left text-[0.625rem] leading-snug whitespace-nowrap transition-colors sm:border-b-0 sm:border-l sm:py-1.5 sm:pl-3 sm:whitespace-normal',
                    active === s.key ? 'border-bronze text-ink' : 'border-transparent text-muted hover:text-ink sm:border-hairline/50',
                  )}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 px-6 pb-16 sm:pr-8 sm:pl-6">
          {sections.map((s) => (
            <SectionBlock key={s.key} section={s} p={p} admin={admin} />
          ))}
          <p className="mt-12 border-t border-hairline pt-4 text-xs text-muted">
            {p.lastSyncedAt ? `Hostaway values last synced ${formatWhen(p.lastSyncedAt)}.` : 'Never synced from Hostaway.'} The house manual
            parts are cut out of Hostaway’s house manual. Values set by an admin, or taken from Airbnb’s settings, say so beneath them.
          </p>
        </div>
      </div>
    </div>
  );
}

export function DetailPanel({ id, onClose, mode = 'view' }: { id: number | null; onClose: () => void; mode?: 'view' | 'admin' }) {
  const viewQuery = useProperty(mode === 'view' ? id : null);
  const adminQuery = useAdminProperty(mode === 'admin' ? id : null);
  const { data, isPending, isError, error, refetch } = mode === 'admin' ? adminQuery : viewQuery;
  const lastId = useRef(id);
  if (id !== null) lastId.current = id;

  return (
    <Dialog.Root open={id !== null} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-ink/25 animate-[scrim-in_300ms_ease-out]" />
        <Dialog.Content
          onEscapeKeyDown={(e) => {
            // Escape inside a field editor closes the editor, not the panel.
            if (document.activeElement?.closest('[data-field-editor]')) e.preventDefault();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            // List view renders the opener twice (phone rows and desktop table); focus the visible one.
            const openers = document.querySelectorAll<HTMLElement>(`[data-open-id="${lastId.current}"]`);
            [...openers].find((el) => el.offsetParent !== null)?.focus();
          }}
          className="fixed inset-y-0 right-0 z-40 w-full max-w-[52rem] border-l border-hairline bg-paper shadow-[-24px_0_48px_-24px_rgb(10_10_12/0.28)] animate-[panel-in_420ms_var(--ease-out-expo)] focus:outline-none"
        >
          <Dialog.Close
            aria-label="Close property"
            className="absolute top-4 right-4 z-20 grid size-10 place-items-center bg-paper text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            <X aria-hidden className="size-5" strokeWidth={1.5} />
          </Dialog.Close>
          {isPending && id !== null ? (
            <div className="flex h-full flex-col gap-4 p-8" aria-busy="true">
              <Dialog.Title className="sr-only">Loading property</Dialog.Title>
              <Dialog.Description className="sr-only">The property's details are loading.</Dialog.Description>
              <div className="shimmer h-40 w-52" />
              <div className="shimmer h-9 w-3/4" />
              <div className="shimmer h-4 w-1/3" />
              <div className="shimmer mt-6 h-64 w-full" />
            </div>
          ) : isError && error instanceof ApiError && error.status === 404 ? (
            // An old or mistyped link (?p=…), or a property removed since the page loaded.
            <div className="p-8 pr-16">
              <Dialog.Title className="font-display text-2xl font-semibold text-ink">This property isn't in the repo</Dialog.Title>
              <Dialog.Description className="mt-3 max-w-[52ch] text-sm text-muted">
                It may have been removed, or the link is out of date. Close this panel to search the properties.
              </Dialog.Description>
              <Dialog.Close className="caps mt-6 bg-ink px-4 py-2.5 text-paper hover:bg-bronze-deep">Back to properties</Dialog.Close>
            </div>
          ) : isError ? (
            <div className="p-8 pr-16">
              <Dialog.Title className="font-display text-2xl font-semibold text-ink">This property couldn't be loaded</Dialog.Title>
              <Dialog.Description className="mt-3 max-w-[52ch] text-sm text-muted">{error.message}</Dialog.Description>
              <button type="button" onClick={() => refetch()} className="caps mt-6 bg-ink px-4 py-2.5 text-paper hover:bg-bronze-deep">
                Try again
              </button>
            </div>
          ) : data ? (
            <Dossier key={data.id} p={data} admin={mode === 'admin'} />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
