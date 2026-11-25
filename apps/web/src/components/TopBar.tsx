import { ROLE_LABEL } from '@repo/shared';
import { LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useMe, useSignOut } from '../lib/admin-api.ts';
// The Live Luxe monogram, taken from liveluxe.au (the brand site's inline SVG).
import mark from './ll-mark.svg';

const linkClass =
  'caps whitespace-nowrap text-muted underline decoration-transparent transition-colors hover:text-bronze hover:decoration-bronze';

/** Sign in and out from any page: signing in returns to the page you were on; signing out keeps you there (or goes home from the dashboard). */
export function TopBar() {
  const me = useMe();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const inAdmin = pathname.startsWith('/admin');
  const signedIn = !!me.data && !me.data.mustChangePassword;
  const next = encodeURIComponent(`${pathname}${search}`);

  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Link to="/" className="group flex items-center gap-3 text-ink no-underline" aria-label="Live Luxe home">
          <img src={mark} alt="" aria-hidden className="h-7 w-auto" />
          <span className="caps whitespace-nowrap text-bronze transition-colors group-hover:text-ink">Live Luxe</span>
        </Link>
        <nav aria-label="Account" className="flex items-center gap-x-5 sm:gap-x-6">
          {signedIn ? (
            <>
              <span className="hidden text-sm text-ink-soft md:inline">
                {me.data!.username}
                <span className="caps ml-2 text-[0.625rem] text-muted">{ROLE_LABEL[me.data!.role]}</span>
              </span>
              <Link to={inAdmin ? '/' : '/admin'} className={linkClass}>
                {inAdmin ? 'Browse properties' : 'Dashboard'}
              </Link>
              <button
                type="button"
                onClick={() => signOut.mutate(undefined, { onSuccess: () => inAdmin && navigate('/') })}
                className="caps flex items-center gap-1.5 whitespace-nowrap text-bronze transition-colors hover:text-ink"
              >
                <LogOut aria-hidden className="size-3.5" strokeWidth={1.5} />
                Sign out
              </button>
            </>
          ) : inAdmin ? (
            <Link to="/" className={linkClass}>
              Back to properties
            </Link>
          ) : (
            <Link to={`/admin?next=${next}`} className={linkClass}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
