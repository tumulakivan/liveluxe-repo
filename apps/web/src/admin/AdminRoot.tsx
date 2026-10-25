import { Route, Routes } from 'react-router';
import { useMe } from '../lib/admin-api.ts';
import { AccountsPage } from './AccountsPage.tsx';
import { AdminShell } from './AdminShell.tsx';
import { ChangePasswordPage, SignInPage } from './AuthPages.tsx';
import { MissingFieldsPage } from './MissingFieldsPage.tsx';
import { OverviewPage } from './OverviewPage.tsx';
import { PlatformsPage } from './PlatformsPage.tsx';
import { PropertiesPage } from './PropertiesPage.tsx';
import { ReportsPage } from './ReportsPage.tsx';

/** /admin: sign in first, then replace the starting password, then the dashboard. */
export function AdminRoot() {
  const me = useMe();
  if (me.isPending) {
    return (
      <main id="main" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12" aria-busy="true">
        <div className="shimmer h-12 w-64" />
      </main>
    );
  }
  if (!me.data) return <SignInPage />;
  if (me.data.mustChangePassword) return <ChangePasswordPage username={me.data.username} />;
  return (
    <AdminShell username={me.data.username}>
      <Routes>
        <Route index element={<OverviewPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="missing" element={<MissingFieldsPage />} />
        <Route path="platforms" element={<PlatformsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="*" element={<OverviewPage />} />
      </Routes>
    </AdminShell>
  );
}
