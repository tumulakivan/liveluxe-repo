import type { Role } from '@repo/shared';
import clsx from 'clsx';
import { Building2, FileText, Gauge, KeyRound, Layers, ListChecks } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';

const NAV = [
  { to: '/admin', label: 'Overview', Icon: Gauge, end: true, contributor: false },
  { to: '/admin/properties', label: 'Properties', Icon: Building2, end: false, contributor: true },
  { to: '/admin/reports', label: 'Reports', Icon: FileText, end: false, contributor: false },
  { to: '/admin/missing', label: 'Missing fields', Icon: ListChecks, end: false, contributor: false },
  { to: '/admin/platforms', label: 'Platforms', Icon: Layers, end: false, contributor: false },
  { to: '/admin/accounts', label: 'Accounts', Icon: KeyRound, end: false, contributor: false },
];

/** The dashboard frame: a ruled rail of tracked capitals (the panel's section index, scaled up), content beside it. */
export function AdminShell({ role, children }: { username: string; role: Role; children: ReactNode }) {
  const nav = NAV.filter((n) => role === 'admin' || n.contributor);
  return (
    <div className="mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] px-5 sm:px-8 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12 lg:px-12">
      <aside className="border-b border-hairline py-3 lg:sticky lg:top-0 lg:h-fit lg:border-b-0 lg:py-12">
        <nav aria-label="Dashboard">
          <ul className="flex gap-x-6 overflow-x-auto pr-8 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_82%,transparent)] lg:flex-col lg:gap-0.5 lg:pr-0 lg:[mask-image:none]">
            {nav.map(({ to, label, Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    clsx(
                      'caps flex items-center gap-2.5 border-b py-2 whitespace-nowrap no-underline transition-colors lg:border-b-0 lg:border-l lg:py-2.5 lg:pl-4',
                      isActive ? 'border-bronze text-ink' : 'border-transparent text-muted hover:text-ink lg:border-hairline/50',
                    )
                  }
                >
                  <Icon aria-hidden className="size-4" strokeWidth={1.5} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {/* Who's signed in, and Sign out, are in the top bar on every page. */}
      </aside>
      <main id="main" className="min-w-0 pt-8 pb-24 lg:pt-12">
        {children}
      </main>
    </div>
  );
}

export function PageHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
      <h1 className="font-display text-[2.75rem] leading-none font-semibold tracking-[-0.015em] text-ink sm:text-[3.5rem]">{title}</h1>
      {children}
    </div>
  );
}
