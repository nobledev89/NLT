import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isStaffOrAbove } from '@/lib/rbac';
import { AccountNav } from './account-nav';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?redirect=/account');

  const showDashboard = isStaffOrAbove(user.actor);

  return (
    <div className="container section">
      <header className="mb-8">
        <p className="eyebrow">My Account</p>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          {user.profile.full_name || 'Welcome'}
        </h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AccountNav showDashboard={showDashboard} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
