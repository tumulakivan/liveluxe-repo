import { PAGE_SIZES } from '@repo/shared';
import clsx from 'clsx';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

/** Page numbers with the ends and the neighbourhood of the current page; gaps become an ellipsis. */
function pageList(page: number, count: number): (number | 'gap')[] {
  const want = new Set([1, count, page - 1, page, page + 1].filter((n) => n >= 1 && n <= count));
  const sorted = [...want].sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1]! > 1) out.push(n - sorted[i - 1]! === 2 ? n - 1 : 'gap');
    out.push(n);
  });
  return out;
}

export function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const step = 'grid h-9 min-w-9 place-items-center px-2 text-sm transition-colors';
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-t border-gold pt-5 sm:flex-row sm:items-center">
      <p className="tabular text-sm text-muted" aria-live="polite">
        Showing <span className="text-ink">{from}–{to}</span> of <span className="text-ink">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2">
          <span className="caps text-[0.625rem] text-muted">Per page</span>
          <span className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              className="tabular h-9 appearance-none border border-gold bg-transparent pr-8 pl-3 text-sm text-ink hover:bg-gold-wash"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted" />
          </span>
        </label>
        {pageCount > 1 && (
          <nav aria-label="Pagination">
            <ul className="tabular flex items-center gap-1">
              <li>
                <button
                  type="button"
                  onClick={() => onPage(page - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                  className={clsx(step, 'text-ink hover:bg-gold-wash disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:bg-transparent')}
                >
                  <ChevronLeft aria-hidden className="size-4" strokeWidth={1.5} />
                </button>
              </li>
              {pageList(page, pageCount).map((n, i) =>
                n === 'gap' ? (
                  <li key={`gap-${i}`} aria-hidden className="px-1 text-muted">
                    …
                  </li>
                ) : (
                  <li key={n}>
                    <button
                      type="button"
                      onClick={() => onPage(n)}
                      aria-current={n === page ? 'page' : undefined}
                      aria-label={`Page ${n}`}
                      className={clsx(step, n === page ? 'bg-ink text-paper' : 'text-ink hover:bg-gold-wash')}
                    >
                      {n}
                    </button>
                  </li>
                ),
              )}
              <li>
                <button
                  type="button"
                  onClick={() => onPage(page + 1)}
                  disabled={page >= pageCount}
                  aria-label="Next page"
                  className={clsx(step, 'text-ink hover:bg-gold-wash disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:bg-transparent')}
                >
                  <ChevronRight aria-hidden className="size-4" strokeWidth={1.5} />
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
