import { FIELD_BY_KEY, SECTIONS } from '@repo/shared';
import { Link } from 'react-router';
import { Notice } from '../components/ui.tsx';
import { useMissing } from '../lib/admin-api.ts';
import { PageHeading } from './AdminShell.tsx';

// What's still empty among the fields only Hostaway's dashboard shows. Each count opens the
// matching report, so the gap can be pulled as a list or CSV.

const sectionLabel = new Map(SECTIONS.map((s) => [s.key, s.label]));

function reportLink(key: string) {
  const platform = FIELD_BY_KEY.get(key)?.platform;
  const p = new URLSearchParams({ empty: key, columns: `p:name,p:id,p:city,f:${key}` });
  if (platform) p.set('on', platform);
  return `/admin/reports?${p.toString()}`;
}

export function MissingFieldsPage() {
  const missing = useMissing();
  const m = missing.data;
  const filledPct = m && m.totalSlots > 0 ? Math.round(((m.totalSlots - m.totalMissing) / m.totalSlots) * 100) : null;
  const fields = (m?.fields ?? []).filter((f) => f.applicable > 0).sort((a, b) => b.missing - a.missing);

  return (
    <>
      <PageHeading title="Missing fields" />
      <p className="mb-8 max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-soft">
        These fields only show in Hostaway’s dashboard, so Sync Hostaway can’t fill them. Claude fills them with an access token, or an admin types them
        in the property panel. Counts leave out archived and removed properties, and a platform’s fields count only where the property is listed on it.
      </p>
      {missing.isError && <Notice>{missing.error.message}</Notice>}

      <ul className="mb-12 grid grid-cols-2 gap-x-8 md:grid-cols-3" aria-label="Fill progress">
        <li className="border-t border-gold py-5">
          <span className="font-display tabular block text-[3.5rem] leading-none font-semibold text-ink">{filledPct ?? '—'}%</span>
          <span className="caps mt-2 block text-ink-soft">Filled</span>
        </li>
        <li className="border-t border-gold py-5">
          <span className="font-display tabular block text-[3.5rem] leading-none font-semibold text-ink">{m?.totalMissing ?? '—'}</span>
          <span className="caps mt-2 block text-ink-soft">Values still empty</span>
          {m && <span className="mt-1 block text-[0.8125rem] text-muted">of {m.totalSlots} that apply</span>}
        </li>
        <li className="border-t border-gold py-5">
          <span className="font-display tabular block text-[3.5rem] leading-none font-semibold text-ink">{m?.properties.length ?? '—'}</span>
          <span className="caps mt-2 block text-ink-soft">Properties with gaps</span>
        </li>
      </ul>

      <section aria-labelledby="by-field" className="mb-14">
        <h2 id="by-field" className="font-display mb-4 text-[1.6rem] leading-tight font-semibold text-ink">
          By field
        </h2>
        {/* Phones: stacked rows. */}
        <ul className="border-t border-gold md:hidden">
          {fields.map((f) => (
            <li key={f.key} className="flex items-baseline justify-between gap-4 border-b border-gold/45 py-3">
              <span className="min-w-0">
                <span className="block text-[0.9375rem] text-ink">{f.label}</span>
                <span className="text-[0.8125rem] text-muted">{[sectionLabel.get(f.section as never), f.group].filter(Boolean).join(', ')}</span>
              </span>
              <Link to={reportLink(f.key)} className="tabular shrink-0 text-sm text-bronze underline hover:text-ink">
                {f.missing} of {f.applicable}
              </Link>
            </li>
          ))}
        </ul>
        <div className="relative hidden overflow-x-auto border-t border-gold md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="caps text-bronze">
                <th scope="col" className="py-3 pr-4 font-medium">Field</th>
                <th scope="col" className="py-3 pr-4 font-medium">Section</th>
                <th scope="col" className="py-3 pr-4 text-right font-medium">Empty</th>
                <th scope="col" className="py-3 pr-4 text-right font-medium">Applies to</th>
                <th scope="col" className="py-3 text-right font-medium">
                  <span className="sr-only">Report</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f.key} className="border-t border-gold/45 hover:bg-paper">
                  <td className="py-2.5 pr-4 text-[0.9375rem] text-ink">{f.label}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{[sectionLabel.get(f.section as never), f.group].filter(Boolean).join(', ')}</td>
                  <td className="tabular py-2.5 pr-4 text-right text-ink">{f.missing}</td>
                  <td className="tabular py-2.5 pr-4 text-right text-ink-soft">{f.applicable}</td>
                  <td className="py-2.5 text-right">
                    <Link to={reportLink(f.key)} className="caps text-bronze underline hover:text-ink">
                      {f.missing ? 'Report' : 'Complete'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="by-property">
        <h2 id="by-property" className="font-display mb-4 text-[1.6rem] leading-tight font-semibold text-ink">
          Properties with the most gaps
        </h2>
        <ul className="border-t border-gold">
          {(m?.properties ?? []).slice(0, 30).map((p) => (
            <li key={p.id} className="flex items-baseline justify-between gap-4 border-b border-gold/45 py-3">
              <Link to={`/admin/properties?p=${p.id}`} className="font-display min-w-0 text-[1.1rem] leading-tight font-semibold text-ink no-underline hover:text-bronze">
                {p.name}
              </Link>
              <span className="tabular shrink-0 text-sm text-ink-soft">{p.missing} empty</span>
            </li>
          ))}
        </ul>
        {m && m.properties.length > 30 && <p className="mt-3 text-[0.8125rem] text-muted">Showing the 30 with the most gaps of {m.properties.length}.</p>}
      </section>
    </>
  );
}
