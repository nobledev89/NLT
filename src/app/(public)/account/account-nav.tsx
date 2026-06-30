'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/account', label: 'Profile' },
  { href: '/account/rsvps', label: 'My RSVPs' },
  { href: '/account/pledges', label: 'My Pledges' },
  { href: '/account/comments', label: 'My Comments' },
];

export function AccountNav({ showDashboard }: { showDashboard: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-card text-gold'
                : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
            )}
          >
            {link.label}
          </Link>
        );
      })}

      {showDashboard && (
        <Link
          href="/admin"
          className="mt-2 rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
        >
          Go to Dashboard
        </Link>
      )}
    </nav>
  );
}
