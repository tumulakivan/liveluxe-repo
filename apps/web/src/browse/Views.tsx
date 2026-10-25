import type { PropertySummary } from '@repo/shared';
import clsx from 'clsx';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { PlatformBubbles } from '../components/PlatformBubbles.tsx';
import { Tags } from '../components/Tags.tsx';

type Open = (id: number) => void;

/** The property name as the control that opens the panel. Its ::after covers the whole card. */
function OpenName({ p, onOpen, className }: { p: PropertySummary; onOpen: Open; className?: string }) {
  return (
    <h2 className={className}>
      <button
        type="button"
        data-open-id={p.id}
        onClick={() => onOpen(p.id)}
        className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-bronze"
      >
        {p.name}
      </button>
    </h2>
  );
}

function Meta({ p }: { p: PropertySummary }) {
  return (
    // Items are told apart by colour, not separators, so a wrap never strands a dot.
    <p className="caps tabular flex flex-wrap gap-x-3 gap-y-1 text-[0.625rem]">
      <span className="whitespace-nowrap text-bronze">{p.hostawayId ? `Listing ${p.hostawayId}` : 'Not in Hostaway yet'}</span>
      {p.city && <span className="whitespace-nowrap text-ink-soft">{p.city}</span>}
      {p.archived && <span className="whitespace-nowrap text-muted">Archived</span>}
    </p>
  );
}

function Photo({ src, className }: { src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={clsx('grid place-items-center bg-stone text-muted', className)}>
        <span className="flex flex-col items-center gap-1.5">
          <ImageOff aria-hidden className="size-5" strokeWidth={1.25} />
          <span className="caps text-[0.625rem]">No photo</span>
        </span>
      </div>
    );
  }
  return (
    <div className={clsx('overflow-hidden bg-stone', className)}>
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.035]"
      />
    </div>
  );
}

const cardShell =
  'group relative border border-gold/55 bg-paper/40 transition-[border-color,background-color] duration-300 hover:border-bronze hover:bg-paper has-[button:focus-visible]:border-bronze';

export function CardView({ items, onOpen }: { items: PropertySummary[]; onOpen: Open }) {
  return (
    <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
      {items.map((p) => (
        <li key={p.id} className={clsx(cardShell, 'grid grid-cols-[minmax(0,38%)_1fr] sm:min-h-52')}>
          <Photo src={p.photoUrl} className="h-full min-h-40" />
          <div className="flex min-w-0 flex-col gap-2.5 p-4 sm:p-5">
            <OpenName p={p} onOpen={onOpen} className="font-display text-[1.3rem] leading-[1.15] font-semibold text-ink line-clamp-2" />
            <Meta p={p} />
            <PlatformBubbles platforms={p.platforms} />
            <Tags tags={p.tags} max={3} />
            {p.summary && <p className="mt-auto line-clamp-2 text-sm leading-relaxed text-muted">{p.summary}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TileView({ items, onOpen }: { items: PropertySummary[]; onOpen: Open }) {
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(17rem,1fr))] gap-5">
      {items.map((p) => (
        <li key={p.id} className={clsx(cardShell, 'flex aspect-square flex-col gap-2.5 overflow-hidden p-5')}>
          <OpenName p={p} onOpen={onOpen} className="shrink-0 font-display text-[1.3rem] leading-[1.15] font-semibold text-ink line-clamp-2" />
          <div className="flex shrink-0 flex-col gap-2.5">
            <Meta p={p} />
            <PlatformBubbles platforms={p.platforms} />
            <Tags tags={p.tags} max={2} />
          </div>
          {p.summary && (
            <p className="mt-1 min-h-0 overflow-hidden border-t border-gold/45 pt-2.5 text-[0.8125rem] leading-relaxed text-ellipsis text-muted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
              {p.summary}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function ListView({ items, onOpen }: { items: PropertySummary[]; onOpen: Open }) {
  return (
    <>
      {/* Phones: stacked rows rather than a table scrolled sideways. */}
      <ul className="border-t border-gold md:hidden">
        {items.map((p) => (
          <li key={p.id} className="group relative flex flex-col gap-2 border-b border-gold/45 py-4 has-[button:focus-visible]:bg-paper">
            <OpenName p={p} onOpen={onOpen} className="font-display text-[1.1rem] leading-tight font-semibold text-ink" />
            <Meta p={p} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PlatformBubbles platforms={p.platforms} />
              <span className="caps tabular text-[0.625rem] text-muted">{p.photoCount ?? 0} photos</span>
            </div>
            <Tags tags={p.tags} max={3} />
          </li>
        ))}
      </ul>
      <ListTable items={items} onOpen={onOpen} />
    </>
  );
}

function ListTable({ items, onOpen }: { items: PropertySummary[]; onOpen: Open }) {
  return (
    <div className="hidden overflow-x-auto border-t border-gold md:block">
      <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
        <thead>
          <tr className="caps text-[0.625rem] text-bronze">
            <th scope="col" className="py-3 pr-4 font-medium">Property</th>
            <th scope="col" className="py-3 pr-4 font-medium">Listing ID</th>
            <th scope="col" className="py-3 pr-4 font-medium">Area</th>
            <th scope="col" className="py-3 pr-4 font-medium">Listed on</th>
            <th scope="col" className="py-3 pr-4 font-medium">Tags</th>
            <th scope="col" className="py-3 text-right font-medium">Photos</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr
              key={p.id}
              className="group relative border-t border-gold/45 transition-colors hover:bg-paper has-[button:focus-visible]:bg-paper"
            >
              <td className="py-3 pr-4">
                <span className="flex items-center gap-3">
                  <OpenName p={p} onOpen={onOpen} className="font-display text-[1.1rem] leading-tight font-semibold text-ink" />
                  {p.archived && <span className="caps text-[0.625rem] text-muted">Archived</span>}
                </span>
              </td>
              <td className="tabular py-3 pr-4 text-ink-soft">{p.hostawayId ?? <span className="text-muted">None yet</span>}</td>
              <td className="py-3 pr-4 text-ink-soft">{p.city ?? '—'}</td>
              <td className="py-3 pr-4">
                <PlatformBubbles platforms={p.platforms} />
              </td>
              <td className="py-3 pr-4">
                <Tags tags={p.tags} max={2} />
              </td>
              <td className="tabular py-3 text-right text-ink-soft">{p.photoCount ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoadingView({ view }: { view: 'card' | 'tile' | 'list' }) {
  const n = view === 'list' ? 10 : 6;
  return (
    <div aria-busy="true" aria-label="Loading properties">
      {view === 'list' ? (
        <div className="flex flex-col gap-px border-t border-gold">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="shimmer h-12" />
          ))}
        </div>
      ) : (
        <ul
          className={clsx(
            'grid gap-5',
            view === 'card' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-[repeat(auto-fill,minmax(17rem,1fr))]',
          )}
        >
          {Array.from({ length: n }, (_, i) => (
            <li key={i} className={clsx('shimmer', view === 'card' ? 'h-52' : 'aspect-square')} />
          ))}
        </ul>
      )}
    </div>
  );
}
