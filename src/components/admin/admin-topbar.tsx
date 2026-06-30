import Link from 'next/link';
import { ExternalLink, LogOut } from 'lucide-react';
import { signOutAction } from '@/app/actions/auth';
import { Badge } from '@/components/ui/badge';
import type { Role } from '@/lib/rbac';

const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Staff',
  member: 'Member',
};

export function AdminTopbar({ email, role }: { email: string; role: Role }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-end gap-4 border-b border-border bg-background/80 px-6 backdrop-blur lg:px-8">
      <Link
        href="/"
        target="_blank"
        className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
      >
        View site <ExternalLink className="h-3.5 w-3.5" />
      </Link>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{email}</p>
        </div>
        <Badge variant="outline">{ROLE_LABELS[role]}</Badge>
        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
