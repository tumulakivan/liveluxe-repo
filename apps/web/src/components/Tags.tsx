import clsx from 'clsx';

export function Tags({ tags, max, className }: { tags: string[]; max?: number; className?: string }) {
  if (tags.length === 0) return null;
  const shown = max ? tags.slice(0, max) : tags;
  const rest = tags.length - shown.length;
  return (
    <ul className={clsx('flex flex-wrap gap-1.5', className)} aria-label="Tags">
      {shown.map((t) => (
        <li key={t} className="border border-gold/70 bg-paper/60 px-2 py-0.5 text-xs leading-5 text-ink-soft">
          {t}
        </li>
      ))}
      {rest > 0 && (
        <li className="px-1 py-0.5 text-xs leading-5 text-muted" title={tags.slice(shown.length).join(', ')}>
          +{rest} more
        </li>
      )}
    </ul>
  );
}
