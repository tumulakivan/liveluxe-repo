import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router';
import { Button, Notice } from '../components/ui.tsx';
import { useOverview, useSync } from '../lib/admin-api.ts';
import { formatWhen } from '../lib/format.ts';
import { PageHeading } from './AdminShell.tsx';

/** One figure in the house style of liveluxe.au's "90 apartments hosted": serif numeral, tracked caption. */
function Figure({ value, label, to, note }: { value: number | undefined; label: string; to: string; note?: string }) {
  return (
    <li className="border-t border-gold">
      <Link to={to} className="group flex flex-col gap-2 py-5 pr-4 no-underline">
        <span className="font-display tabular text-[3.5rem] leading-none font-semibold text-ink transition-colors group-hover:text-bronze">
          {value ?? <span className="shimmer inline-block h-12 w-20 align-middle" />}
        </span>
        <span className="caps text-ink-soft group-hover:text-bronze">{label}</span>
        {note && <span className="text-[0.8125rem] text-muted">{note}</span>}
      </Link>
    </li>
  );
}

export function OverviewPage() {
  const overview = useOverview();
  const sync = useSync();
  const o = overview.data;
  const last = sync.data ?? o?.lastSync ?? null;
  const s = last?.summary;

  return (
    <>
      <PageHeading title="Overview" />

      {overview.isError && <Notice>{overview.error.message}</Notice>}

      <ul className="grid grid-cols-2 gap-x-8 md:grid-cols-3" aria-label="Portfolio figures">
        <Figure value={o?.total} label="Properties" to="/admin/properties?archived=1" note="In the repo, archived included" />
        <Figure value={o?.active} label="Active" to="/admin/properties?active=1&archived=1" note="Carrying the “Active” tag" />
        <Figure value={o?.notListed} label="Not listed anywhere" to="/admin/properties?notListed=1" note="Not archived, on no platform" />
        <Figure value={o?.archived} label="Archived in Hostaway" to="/admin/properties?archivedOnly=1" note="Kept here, hidden from browsing" />
        <Figure value={o?.addedByHand} label="Added by hand" to="/admin/properties?manual=1" note="Not in Hostaway yet" />
        <Figure value={o?.removed} label="Removed" to="/admin/properties?removed=only" note="Hidden from the repo" />
      </ul>

      <section aria-labelledby="sync-h" className="mt-14 grid gap-6 border-t border-gold pt-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <h2 id="sync-h" className="font-display text-[1.6rem] leading-tight font-semibold text-ink">
            Sync Hostaway
          </h2>
          <p className="mt-2 max-w-[60ch] text-[0.9375rem] leading-relaxed text-ink-soft">
            Fetches every field Hostaway’s API returns and adds new listings. Fields filled by Claude or an admin are never touched, and removed
            properties stay removed.
          </p>
          <div className="mt-5 text-sm text-ink-soft" aria-live="polite">
            {sync.isPending ? (
              <p>Syncing with Hostaway. This takes a few seconds…</p>
            ) : last ? (
              <>
                <p>
                  Last synced <span className="text-ink">{formatWhen(last.finishedAt ?? last.startedAt)}</span>
                  {last.startedBy && <> by {last.startedBy}</>}.
                </p>
                {s && (
                  <p className="tabular mt-1 flex flex-wrap gap-x-4 text-muted">
                    <span>{s.added} added</span>
                    <span>{s.updated} updated</span>
                    <span>{s.unchanged} unchanged</span>
                    <span>{s.fieldsChanged} field values changed</span>
                  </p>
                )}
                {last.error && <Notice className="mt-1">The last sync failed: {last.error}</Notice>}
              </>
            ) : (
              <p className="text-muted">Not synced from the dashboard yet.</p>
            )}
          </div>
          <Notice className="mt-2">{sync.error?.message}</Notice>
        </div>
        <Button onClick={() => sync.mutate()} busy={sync.isPending || o?.syncing}>
          <RefreshCw aria-hidden className={sync.isPending ? 'size-4 animate-spin' : 'size-4'} strokeWidth={1.75} />
          {sync.isPending ? 'Syncing…' : 'Sync Hostaway'}
        </Button>
      </section>
    </>
  );
}
