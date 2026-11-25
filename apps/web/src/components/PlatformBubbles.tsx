import type { PlatformBadge } from '@repo/shared';
import * as Tooltip from '@radix-ui/react-tooltip';
import clsx from 'clsx';

// Listing status: one round seal per platform the property is listed on.

/** The round seal on its own: the platform's logo, or its initials when it has none. */
export function PlatformMark({
  p,
  size = 'sm',
  interactive = false,
}: {
  p: Pick<PlatformBadge, 'initials' | 'icon'>;
  size?: 'sm' | 'md';
  interactive?: boolean;
}) {
  return (
    <span
      className={clsx(
        'relative z-10 inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-hairline bg-paper text-ink-soft transition-colors',
        size === 'sm' ? 'size-7 text-[0.625rem]' : 'size-9 text-[0.6875rem]',
        interactive && (p.icon ? 'hover:border-bronze hover:ring-2 hover:ring-bronze/40' : 'hover:border-bronze hover:bg-ink hover:text-paper'),
      )}
    >
      {p.icon ? (
        <img src={p.icon} alt="" className="size-full object-cover" />
      ) : (
        <span className={clsx('font-medium', p.initials.length > 2 ? 'text-[0.625rem] tracking-[0.02em]' : 'tracking-[0.08em]')} aria-hidden>
          {p.initials}
        </span>
      )}
    </span>
  );
}

function Bubble({ p, size }: { p: PlatformBadge; size: 'sm' | 'md' }) {
  const label = p.url ? `Open on ${p.name}` : `Listed on ${p.name}`;
  const face = <PlatformMark p={p} size={size} interactive={!!p.url} />;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        {p.url ? (
          <a href={p.url} target="_blank" rel="noreferrer" aria-label={label} className="relative z-10 rounded-full">
            {face}
          </a>
        ) : (
          <span role="img" aria-label={label} tabIndex={0} className="relative z-10 rounded-full">
            {face}
          </span>
        )}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          className="caps z-50 bg-ink px-2.5 py-1.5 text-[0.625rem] text-paper data-[state=delayed-open]:animate-[scrim-in_120ms_ease-out]"
        >
          {p.url ? `${p.name} · open listing` : p.name}
          <Tooltip.Arrow className="fill-ink" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function PlatformBubbles({ platforms, size = 'sm' }: { platforms: PlatformBadge[]; size?: 'sm' | 'md' }) {
  if (platforms.length === 0) {
    return <span className="caps text-[0.625rem] text-muted">Not listed yet</span>;
  }
  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Listed on">
      {platforms.map((p) => (
        <li key={p.key} className="flex">
          <Bubble p={p} size={size} />
        </li>
      ))}
    </ul>
  );
}
