import clsx from 'clsx';
import { useId, useState, type FormEvent } from 'react';
import { Button, Notice, TextInput } from '../components/ui.tsx';
import { useAddPlatform, useAdminPlatforms, useRetirePlatform } from '../lib/admin-api.ts';
import { PageHeading } from './AdminShell.tsx';

export function PlatformsPage() {
  const platforms = useAdminPlatforms();
  const add = useAddPlatform();
  const retire = useRetirePlatform();
  const [name, setName] = useState('');
  const id = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    add.mutate(name, { onSuccess: () => setName('') });
  };

  return (
    <>
      <PageHeading title="Platforms" />
      <p className="mb-8 max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-soft">
        <strong className="font-medium text-ink">Hostaway platforms</strong> get each property’s status from Sync Hostaway.{' '}
        <strong className="font-medium text-ink">Manual platforms</strong> are ticked by an admin in each property’s panel. A retired platform
        disappears from the bubbles, filters and panels but keeps its history, so it can be restored.
      </p>

      {platforms.isError && <Notice>{platforms.error.message}</Notice>}

      {/* Phones: stacked rows. */}
      <ul className="border-t border-gold md:hidden">
        {(platforms.data ?? []).map((p) => (
          <li key={p.key} className={clsx('flex items-center gap-4 border-b border-gold/45 py-4', p.retired && 'text-muted')}>
            <span className="inline-grid size-7 shrink-0 place-items-center rounded-full border border-gold bg-paper text-[0.625rem] font-medium text-ink-soft">
              {p.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-display block text-[1.1rem] font-semibold text-ink">
                {p.name}
                {p.retired && <span className="caps ml-3 font-sans text-muted">Retired</span>}
              </span>
              <span className="flex flex-wrap gap-x-4 text-[0.8125rem] text-ink-soft">
                <span>{p.kind === 'hostaway' ? 'From Sync Hostaway' : 'Ticked by an admin'}</span>
                <span className="tabular">{p.listedCount} listed</span>
              </span>
            </span>
            {p.kind === 'manual' && (
              <Button variant="quiet" busy={retire.isPending && retire.variables?.key === p.key} onClick={() => retire.mutate({ key: p.key, retired: !p.retired })}>
                {p.retired ? 'Restore' : 'Retire'}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <div className="relative hidden overflow-x-auto border-t border-gold md:block">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead>
            <tr className="caps text-bronze">
              <th scope="col" className="py-3 pr-4 font-medium">Platform</th>
              <th scope="col" className="py-3 pr-4 font-medium">Bubble</th>
              <th scope="col" className="py-3 pr-4 font-medium">Status comes from</th>
              <th scope="col" className="py-3 pr-4 text-right font-medium">Listed</th>
              <th scope="col" className="py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {(platforms.data ?? []).map((p) => (
              <tr key={p.key} className={clsx('border-t border-gold/45', p.retired && 'text-muted')}>
                <td className="py-3 pr-4">
                  <span className="font-display text-[1.1rem] font-semibold text-ink">{p.name}</span>
                  {p.retired && <span className="caps ml-3 text-muted">Retired</span>}
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-grid size-7 place-items-center rounded-full border border-gold bg-paper text-[0.625rem] font-medium text-ink-soft">
                    {p.initials}
                  </span>
                </td>
                <td className="py-3 pr-4 text-ink-soft">{p.kind === 'hostaway' ? 'Sync Hostaway' : 'Ticked by an admin'}</td>
                <td className="tabular py-3 pr-4 text-right text-ink-soft">{p.listedCount}</td>
                <td className="py-3 text-right">
                  {p.kind === 'manual' ? (
                    <Button variant="quiet" busy={retire.isPending && retire.variables?.key === p.key} onClick={() => retire.mutate({ key: p.key, retired: !p.retired })}>
                      {p.retired ? 'Restore' : 'Retire'}
                    </Button>
                  ) : (
                    <span className="text-[0.8125rem] text-muted">Fixed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Notice className="mt-3">{retire.error?.message}</Notice>

      <form onSubmit={submit} className="mt-12 flex max-w-xl flex-col gap-3 border-t border-gold pt-8">
        <h2 className="font-display text-[1.6rem] leading-tight font-semibold text-ink">Add a platform</h2>
        <p className="text-[0.9375rem] text-ink-soft">New platforms are manual. Tick them per property in the property panel.</p>
        <label htmlFor={id} className="caps mt-2 text-bronze">
          Platform name
        </label>
        <div className="flex gap-2">
          <TextInput id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Homes & Villas" />
          <Button type="submit" busy={add.isPending} disabled={name.trim().length < 2}>
            Add
          </Button>
        </div>
        <Notice>{add.error?.message}</Notice>
      </form>
    </>
  );
}
