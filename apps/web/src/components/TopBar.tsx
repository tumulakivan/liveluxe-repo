import { Link, useLocation } from 'react-router';
import { useMe } from '../lib/admin-api.ts';
// The Live Luxe monogram, taken from liveluxe.au (the brand site's inline SVG).
import mark from './ll-mark.svg';

export function TopBar() {
  const me = useMe();
  const inAdmin = useLocation().pathname.startsWith('/admin');
  const signedIn = !!me.data && !me.data.mustChangePassword;
  return (
    <header className="border-b border-gold">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Link to="/" className="group flex items-center gap-3 text-ink no-underline" aria-label="Listing Repo home">
          <img src={mark} alt="" aria-hidden className="h-7 w-auto" />
          <span className="caps whitespace-nowrap text-bronze transition-colors group-hover:text-ink">
            <span className="hidden sm:inline">Live Luxe · </span>Listing Repo
          </span>
        </Link>
        <Link
          to={inAdmin ? '/' : '/admin'}
          className="caps whitespace-nowrap text-muted underline decoration-transparent transition-colors hover:text-bronze hover:decoration-bronze"
        >
          {inAdmin ? (signedIn ? 'Browse properties' : 'Back to properties') : signedIn ? 'Dashboard' : 'Admin sign-in'}
        </Link>
      </div>
    </header>
  );
}
