import type { PropertyDetail } from '@repo/shared';
import clsx from 'clsx';
import { ImagePlus } from 'lucide-react';
import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { TagPicker } from '../components/TagPicker.tsx';
import { Button, Notice, TextInput } from '../components/ui.tsx';
import { useAdminPlatforms, useRole, useSaveFields, useApprove, useUnapprove, useSetListing, useSetRemoved, useUploadPhoto } from '../lib/admin-api.ts';
import { formatWhen } from '../lib/format.ts';
import { ApiError } from '../lib/http.ts';

// Sections for signed-in people: Onboarding (name, tags, approval with the Hostaway ID; first in the
// panel, onboarding listings only) and Platforms (where the property is listed; last in the panel). The display-photo
// picker (PhotoUpload) lives in the Photos section, and RemoveButton in the panel header. Contributors get these on onboarding
// listings only, without approval, the Hostaway ID or removal.

function Step({ n, done, children }: { n: number; done: boolean; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 py-3">
      <span
        aria-hidden
        className={clsx('caps grid size-6 place-items-center border text-[0.625rem]', done ? 'border-bronze bg-bronze text-paper' : 'border-hairline text-muted')}
      >
        {n}
      </span>
      <div className="min-w-0">{children}</div>
    </li>
  );
}

function RenameListing({ p }: { p: PropertyDetail }) {
  const [name, setName] = useState(p.name);
  const save = useSaveFields(p.id);
  const id = useId();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate({ internalName: name.trim() });
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-ink">
        Listing name
      </label>
      <span className="flex flex-wrap gap-2">
        <TextInput id={id} value={name} onChange={(e) => setName(e.target.value)} className="h-9 min-w-0 flex-1 text-sm sm:min-w-80" />
        <Button type="submit" variant="secondary" busy={save.isPending} disabled={name.trim().length < 2 || name.trim() === p.name} className="min-h-9">
          Rename
        </Button>
      </span>
      <Notice>{save.error?.message}</Notice>
    </form>
  );
}

function EditTags({ p }: { p: PropertyDetail }) {
  const [tags, setTags] = useState(p.tags);
  const save = useSaveFields(p.id);
  const dirty = tags.join('\n') !== p.tags.join('\n');
  return (
    <div className="mt-4 flex flex-col gap-2">
      <span className="text-sm text-ink">Tags</span>
      <TagPicker value={tags} onChange={setTags} />
      <span className="flex items-center gap-3">
        <Button variant="secondary" busy={save.isPending} disabled={!dirty} onClick={() => save.mutate({ tags })} className="min-h-9">
          Save tags
        </Button>
        {dirty && (
          <button type="button" onClick={() => setTags(p.tags)} className="caps text-[0.625rem] text-bronze underline hover:text-ink">
            Undo changes
          </button>
        )}
      </span>
      <Notice>{save.error?.message}</Notice>
    </div>
  );
}

/** Type the Hostaway listing ID, then Approve: one step. Approving again with another ID changes it. */
function ApproveForm({ p }: { p: PropertyDetail }) {
  const pending = p.onboarding?.pendingHostawayId ?? null;
  const [value, setValue] = useState(pending ? String(pending) : '');
  const [problem, setProblem] = useState<string | null>(null);
  const approve = useApprove(p.id);
  const id = useId();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = value.trim();
    if (!/^\d+$/.test(t)) return setProblem('Enter the Hostaway listing ID, digits only.');
    setProblem(null);
    approve.mutate({ hostawayId: Number(t) });
  };
  const changing = pending !== null;
  // The ID is already an existing listing here: say which, and let the admin confirm the merge.
  const existing = approve.error instanceof ApiError && approve.error.code === 'existing-listing' ? approve.error.message : null;
  return (
    <form onSubmit={submit} className="flex flex-col gap-2" noValidate>
      <label htmlFor={id} className="text-sm text-ink">
        Hostaway listing ID
      </label>
      <span className="flex items-center gap-2">
        {/* TextInput fills its box, so the box sets the width and the button stays beside it. */}
        <span className="w-44 shrink-0">
          <TextInput
            id={id}
            inputMode="numeric"
            autoComplete="off"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (approve.error) approve.reset();
            }}
            placeholder="e.g. 603123"
            className="tabular h-9 text-sm"
          />
        </span>
        <Button type="submit" busy={approve.isPending} disabled={!value.trim() || value.trim() === String(pending ?? '')} className="min-h-9">
          {changing ? 'Change ID' : 'Approve'}
        </Button>
      </span>
      {existing && !problem ? (
        <div role="alert" className="flex flex-col gap-2 border-l-2 border-bronze py-1 pl-3">
          <p className="text-sm text-ink">{existing}</p>
          <span className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              busy={approve.isPending}
              onClick={() => approve.mutate({ hostawayId: Number(value.trim()), confirmExisting: true })}
              className="min-h-9"
            >
              Approve and merge
            </Button>
            <button type="button" onClick={() => approve.reset()} className="caps text-[0.625rem] text-bronze underline hover:text-ink">
              Cancel
            </button>
          </span>
        </div>
      ) : (
        <Notice>{problem ?? approve.error?.message}</Notice>
      )}
    </form>
  );
}

/** The onboarding path, as two steps: fill in (everyone), then approve with the Hostaway ID (admins). */
export function OnboardingTools({ p }: { p: PropertyDetail }) {
  const o = p.onboarding!;
  const isAdmin = useRole() === 'admin';
  const unapprove = useUnapprove(p.id);
  return (
    <ManageSection id="onboarding" title="Onboarding">
      <ol className="mt-2 divide-y divide-hairline/35">
        <Step n={1} done>
          <p className="mb-2 text-[0.8125rem] text-muted">
            Created{o.createdBy ? ` by ${o.createdBy}` : ''}. Everyone signed in can see and edit it; the public can’t see it.
          </p>
          <RenameListing p={p} />
          <EditTags key={p.tags.join('\n')} p={p} />
        </Step>
        <Step n={2} done={!!o.approvedAt && !!o.pendingHostawayId}>
          {o.approvedAt && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink">
                Approved by {o.approvedBy} · {formatWhen(o.approvedAt)}
                {o.pendingHostawayId && <> · Hostaway listing {o.pendingHostawayId}</>}
              </p>
              {isAdmin && (
                <Button variant="quiet" busy={unapprove.isPending} onClick={() => unapprove.mutate()}>
                  Undo approval
                </Button>
              )}
            </div>
          )}
          <Notice className="mb-2">{unapprove.error?.message}</Notice>
          {isAdmin ? (
            <>
              <ApproveForm key={o.pendingHostawayId ?? 'none'} p={p} />
              <p className="mt-1 text-[0.8125rem] text-muted">
                {o.pendingHostawayId
                  ? 'The next Sync Hostaway replaces this listing with the Hostaway one. Anything typed here that Hostaway doesn’t have carries over.'
                  : 'Once the property is listed on Hostaway, type its listing ID and approve. The next Sync Hostaway then replaces this listing with it.'}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">
              {o.pendingHostawayId
                ? `Approved and linked to Hostaway listing ${o.pendingHostawayId}. The next Sync Hostaway replaces this listing with it.`
                : 'Awaiting approval. The systems team approves it with its Hostaway listing ID once it’s listed there.'}
            </p>
          )}
        </Step>
      </ol>
    </ManageSection>
  );
}

function PlatformRow({ p, platformKey, name, kind }: { p: PropertyDetail; platformKey: string; name: string; kind: 'hostaway' | 'manual' }) {
  const listedBadge = p.platforms.find((b) => b.key === platformKey);
  const fromHostaway = kind === 'hostaway' && p.hostawayId !== null;
  const [listed, setListed] = useState(!!listedBadge);
  const [url, setUrl] = useState(listedBadge?.url ?? '');
  const save = useSetListing(p.id);
  const id = useId();
  const dirty = listed !== !!listedBadge || (url || null) !== (listedBadge?.url ?? null);

  if (fromHostaway) {
    return (
      <li className="grid grid-cols-[8rem_1fr] items-center gap-4 py-2.5 text-sm">
        <span className="text-ink">{name}</span>
        <span className="text-muted">{listedBadge ? 'Listed' : 'Not listed'} · from Hostaway</span>
      </li>
    );
  }
  return (
    <li className="py-2.5">
      <form
        noValidate
        className="grid grid-cols-[8rem_1fr] items-center gap-x-4 gap-y-2 sm:grid-cols-[8rem_auto_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({ key: platformKey, listed, url: listed && url.trim() ? url.trim() : null });
        }}
      >
        <label htmlFor={`${id}-c`} className="text-sm text-ink">
          {name}
        </label>
        <input id={`${id}-c`} type="checkbox" checked={listed} onChange={(e) => setListed(e.target.checked)} className="size-4 accent-bronze" />
        <TextInput
          aria-label={`${name} listing link`}
          type="url"
          placeholder="Listing link (optional)"
          disabled={!listed}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="col-span-2 h-9 text-sm disabled:opacity-50 sm:col-span-1"
        />
        <Button type="submit" variant="secondary" busy={save.isPending} disabled={!dirty} className="col-span-2 min-h-9 justify-self-start sm:col-span-1">
          Save
        </Button>
        {save.error && <Notice className="col-span-full">{save.error.message}</Notice>}
      </form>
    </li>
  );
}

/** Resize in the browser so only one modest file is uploaded and stored. */
async function resizeForUpload(file: File, maxEdge = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.82));
  if (webp && webp.type === 'image/webp') return webp;
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read that photo.'))), 'image/jpeg', 0.85));
}

export function PhotoUpload({ p }: { p: PropertyDetail }) {
  const [files, setFiles] = useState<File[]>([]);
  const [chosen, setChosen] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const upload = useUploadPhoto(p.id);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  const id = useId();

  const submit = async () => {
    setProblem(null);
    try {
      const photo = await resizeForUpload(files[chosen]!);
      upload.mutate({ photo, count: files.length }, { onSuccess: () => setFiles([]) });
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Could not read that photo.');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">
        Choose all of the property’s photos, then pick the one to show. Only that photo is kept; the rest set the photo count.
      </p>
      <label htmlFor={id} className="caps flex w-fit cursor-pointer items-center gap-2 border border-hairline px-4 py-2.5 text-ink hover:bg-hover-wash has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bronze">
        <ImagePlus aria-hidden className="size-4" strokeWidth={1.5} />
        {files.length ? 'Choose different photos' : p.photoSource === 'upload' ? 'Replace photos' : 'Choose photos'}
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => {
            setFiles([...(e.target.files ?? [])]);
            setChosen(0);
          }}
        />
      </label>
      {files.length > 0 && (
        <>
          <fieldset>
            <legend className="caps mb-2 text-bronze">
              Display photo · {files.length} photo{files.length === 1 ? '' : 's'} chosen
            </legend>
            <ul className="flex flex-wrap gap-2">
              {previews.map((src, i) => (
                <li key={src}>
                  <label
                    className={clsx(
                      'relative block size-20 cursor-pointer overflow-hidden border-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bronze',
                      i === chosen ? 'border-bronze' : 'border-transparent',
                    )}
                  >
                    <input type="radio" name={`${id}-display`} checked={i === chosen} onChange={() => setChosen(i)} className="sr-only" />
                    <img src={src} alt={`Photo ${i + 1}: ${files[i]!.name}`} className="size-full object-cover" />
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          <Button onClick={submit} busy={upload.isPending} className="self-start">
            {upload.isPending ? 'Uploading…' : 'Use this photo'}
          </Button>
        </>
      )}
      <Notice>{problem ?? upload.error?.message}</Notice>
    </div>
  );
}

/** Remove from repo / Restore, for admins: bottom right of the panel header. */
export function RemoveButton({ p }: { p: PropertyDetail }) {
  const setRemoved = useSetRemoved(p.id);
  const note = p.onboarding
    ? 'Removing hides this onboarding listing from everyone. An admin can restore it.'
    : 'Removing only hides it here. Hostaway is never changed, and syncs won’t bring it back.';
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={p.removed ? 'primary' : 'secondary'}
        busy={setRemoved.isPending}
        onClick={() => setRemoved.mutate(!p.removed)}
        title={p.removed ? undefined : note}
      >
        {p.removed ? 'Restore property' : 'Remove from repo'}
      </Button>
      <Notice>{setRemoved.error?.message}</Notice>
    </div>
  );
}

/** A section at the bottom of the panel, styled and indexed like the field sections. */
function ManageSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={`sec-${id}`} data-section={id} aria-labelledby={`h-${id}`} className="scroll-mt-6 pt-8 first:pt-2">
      <h3 id={`h-${id}`} className="font-display border-b border-hairline pb-2 text-[1.6rem] leading-tight font-semibold text-ink">
        {title}
      </h3>
      {children}
    </section>
  );
}


export function AdminTools({ p }: { p: PropertyDetail }) {
  const platforms = useAdminPlatforms();
  const active = (platforms.data ?? []).filter((x) => !x.retired);

  return (
    <ManageSection id="platforms" title="Platforms">
        <p className="mt-3 text-[0.8125rem] text-muted">
          {p.hostawayId === null
            ? 'Where the property is listed so far. Tick each platform, with its link if you have it.'
            : 'Where the property is listed. Airbnb, Booking.com and Vrbo update with each Sync Hostaway; tick the others here.'}
        </p>
        <ul className="divide-y divide-hairline/35">
          {active.map((x) => (
            <PlatformRow key={`${x.key}-${p.platforms.map((b) => b.key + b.url).join()}`} p={p} platformKey={x.key} name={x.name} kind={x.kind} />
          ))}
        </ul>
    </ManageSection>
  );
}
