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
        {/* Visitors who aren't signed in get the sign-in link in the footer instead, so it stays out of the way. */}
        {(inAdmin || signedIn) && (
          <Link
            to={inAdmin ? '/' : '/admin'}
            className="caps whitespace-nowrap text-muted underline decoration-transparent transition-colors hover:text-bronze hover:decoration-bronze"
          >
            {inAdmin ? (signedIn ? 'Browse properties' : 'Back to properties') : 'Dashboard'}
          </Link>
        )}
      </div>
    </header>
  );
}

// A quiet footer: the admin sign-in link lives here, since most visitors never need it.
export function Footer() {
  const me = useMe();
  const inAdmin = useLocation().pathname.startsWith('/admin');
  const signedIn = !!me.data && !me.data.mustChangePassword;
  if (inAdmin || signedIn) return null;
  return (
    <footer className="border-t border-gold/60">
      <div className="mx-auto flex max-w-[1440px] justify-end px-5 py-5 sm:px-8 lg:px-12">
        <Link
          to="/admin"
          className="caps text-[0.625rem] whitespace-nowrap text-muted/80 underline decoration-transparent transition-colors hover:text-bronze hover:decoration-bronze"
        >
          Admin sign-in
        </Link>
      </div>
    </footer>
  );
}
