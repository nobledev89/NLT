'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { type AdminSection, GROUP_LABELS } from '@/lib/admin-nav';
import { cn } from '@/lib/utils';

export function AdminSidebar({
  sections,
  churchName,
}: {
  sections: AdminSection[];
  churchName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const groups = ['main', 'content', 'people', 'system'] as const;

  const Nav = (
    <nav className="space-y-6">
      {groups.map((g) => {
        const items = sections.filter((s) => s.group === g);
        if (items.length === 0) return null;
        return (
          <div key={g} className="space-y-1">
            {GROUP_LABELS[g] && (
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                {GROUP_LABELS[g]}
              </p>
            )}
            {items.map((s) => {
              const active = s.href === '/admin' ? pathname === '/admin' : pathname.startsWith(s.href);
              const Icon = s.icon;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-secondary font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {s.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card lg:hidden"
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/30 lg:block">
        <div className="sticky top-0 flex h-dvh flex-col">
          <div className="flex h-16 items-center gap-2 border-b border-border px-6">
            <Link href="/" className="font-serif text-base">{churchName}</Link>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{Nav}</div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <span className="font-serif">{churchName}</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{Nav}</div>
          </div>
        </div>
      )}
    </>
  );
}
