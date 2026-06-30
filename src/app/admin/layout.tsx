import { requireDashboard } from '@/lib/auth';
import { visibleSections } from '@/lib/admin-nav';
import { getSiteSettings } from '@/lib/settings';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminTopbar } from '@/components/admin/admin-topbar';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireDashboard();
  const settings = await getSiteSettings();
  const sections = visibleSections(user.actor).map(({ icon: _icon, requirement: _requirement, ...section }) => section);

  return (
    <div className="flex min-h-dvh bg-background">
      <AdminSidebar sections={sections} churchName={settings.branding.churchName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar email={user.email} role={user.actor.role} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
