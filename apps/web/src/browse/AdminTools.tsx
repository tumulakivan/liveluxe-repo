import type { PropertyDetail } from '@repo/shared';
import clsx from 'clsx';
import { ImagePlus } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { Button, Notice, TextInput } from '../components/ui.tsx';
import { useAdminPlatforms, useSetListing, useSetRemoved, useUploadPhoto } from '../lib/admin-api.ts';

// Admin-only blocks at the top of the panel: where the property is listed, its photo, and removing it.

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

function PhotoUpload({ p }: { p: PropertyDetail }) {
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
      <label htmlFor={id} className="caps flex w-fit cursor-pointer items-center gap-2 border border-gold px-4 py-2.5 text-ink hover:bg-gold-wash has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bronze">
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

export function AdminTools({ p }: { p: PropertyDetail }) {
  const platforms = useAdminPlatforms();
  const setRemoved = useSetRemoved(p.id);
  const active = (platforms.data ?? []).filter((x) => !x.retired);

  return (
    <section aria-labelledby="manage-h" className="border-b border-gold bg-ground/60 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id="manage-h" className="font-display text-[1.6rem] leading-tight font-semibold text-ink">
          Manage
        </h3>
        <span className="flex items-center gap-4">
          {p.removed && <span className="caps text-[#8a2c1f]">Removed from the repo</span>}
          <Button variant={p.removed ? 'primary' : 'secondary'} busy={setRemoved.isPending} onClick={() => setRemoved.mutate(!p.removed)}>
            {p.removed ? 'Restore property' : 'Remove from repo'}
          </Button>
        </span>
      </div>
      <Notice className="mt-2">{setRemoved.error?.message}</Notice>
      {!p.removed && (
        <p className="mt-1 text-[0.8125rem] text-muted">Removing only hides it here. Hostaway is never changed, and syncs won’t bring it back.</p>
      )}

      <h4 className="caps mt-6 text-bronze">Listed on</h4>
      <ul className="divide-y divide-gold/35">
        {active.map((x) => (
          <PlatformRow key={`${x.key}-${p.platforms.map((b) => b.key + b.url).join()}`} p={p} platformKey={x.key} name={x.name} kind={x.kind} />
        ))}
      </ul>

      {p.hostawayId === null && (
        <>
          <h4 className="caps mt-6 mb-2 text-bronze">Photo</h4>
          <PhotoUpload p={p} />
        </>
      )}
    </section>
  );
}
