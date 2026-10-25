import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { BrowsePage } from './browse/BrowsePage.tsx';
import { TopBar } from './components/TopBar.tsx';

// The dashboard loads only when someone opens /admin, so browsing staff don't download it.
const AdminRoot = lazy(() => import('./admin/AdminRoot.tsx').then((m) => ({ default: m.AdminRoot })));

const adminLoading = (
  <main id="main" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12" aria-busy="true">
    <div className="shimmer h-12 w-64" />
  </main>
);

export function App() {
  return (
    <>
      <a
        href="#main"
        className="caps sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:text-ground"
      >
        Skip to properties
      </a>
      <TopBar />
      <Routes>
        <Route path="/" element={<BrowsePage />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={adminLoading}>
              <AdminRoot />
            </Suspense>
          }
        />
        <Route path="*" element={<BrowsePage />} />
      </Routes>
    </>
  );
}
