'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { ChevronDown, Menu, Radio, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { NavNode } from '@/lib/navigation';

interface HeaderNavProps {
  nav: NavNode[];
  churchName: string;
  logoUrl: string | null;
  isLive: boolean;
  watchUrl: string;
  isSignedIn: boolean;
  isStaff: boolean;
}

function LiveBadge({ watchUrl }: { watchUrl: string }) {
  return (
    <Link
      href={watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-300 transition-colors hover:bg-red-500/20"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-pulse-live rounded-full bg-red-400" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      Watch Live
    </Link>
  );
}

export function HeaderNav({
  nav,
  churchName,
  logoUrl,
  isLive,
  watchUrl,
  isSignedIn,
  isStaff,
}: HeaderNavProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close the mobile drawer on navigation
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-colors duration-300',
        scrolled
          ? 'border-b border-border/70 bg-background/85 backdrop-blur-md'
          : 'bg-gradient-to-b from-background/80 to-transparent'
      )}
    >
      <div className="container flex h-20 items-center justify-between gap-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          {logoUrl ? (
            <Image src={logoUrl} alt={churchName} width={40} height={40} className="h-10 w-10 rounded-md object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-gold/40 bg-gold/10 font-serif text-lg text-gold">
              NL
            </span>
          )}
          <span className="font-serif text-lg font-medium tracking-tight text-foreground">
            {churchName}
          </span>
        </Link>

        {/* Desktop nav */}
        <NavigationMenu.Root className="relative hidden lg:flex" delayDuration={80}>
          <NavigationMenu.List className="flex items-center gap-1">
            {nav.map((item) =>
              item.children.length === 0 && item.href ? (
                <NavigationMenu.Item key={item.id}>
                  <NavigationMenu.Link asChild active={pathname === item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground data-[active]:text-gold'
                      )}
                    >
                      {item.label}
                    </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              ) : (
                <NavigationMenu.Item key={item.id}>
                  <NavigationMenu.Trigger className="group inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content className="absolute left-0 top-full data-[state=open]:animate-fade-in">
                    <ul className="mt-2 grid w-56 gap-1 rounded-xl border border-border bg-popover p-2 shadow-xl">
                      {item.children.map((child) => (
                        <li key={child.id}>
                          <NavigationMenu.Link asChild>
                            <Link
                              href={child.href}
                              className="block rounded-md px-3 py-2.5 text-sm text-foreground/85 transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              {child.label}
                            </Link>
                          </NavigationMenu.Link>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              )
            )}
          </NavigationMenu.List>

          <div className="absolute left-0 top-full flex w-full justify-start">
            <NavigationMenu.Viewport className="origin-top" />
          </div>
        </NavigationMenu.Root>

        {/* Right cluster */}
        <div className="hidden items-center gap-3 lg:flex">
          {isLive && <LiveBadge watchUrl={watchUrl} />}
          <Button asChild>
            <Link href="/get-connected">Get Connected</Link>
          </Button>
        </div>

        {/* Mobile trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          {isLive && <LiveBadge watchUrl={watchUrl} />}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <MobileDrawer
          nav={nav}
          churchName={churchName}
          isSignedIn={isSignedIn}
          isStaff={isStaff}
          isLive={isLive}
          watchUrl={watchUrl}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </header>
  );
}

function MobileDrawer({
  nav,
  churchName,
  isSignedIn,
  isStaff,
  isLive,
  watchUrl,
  onClose,
}: {
  nav: NavNode[];
  churchName: string;
  isSignedIn: boolean;
  isStaff: boolean;
  isLive: boolean;
  watchUrl: string;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-background shadow-2xl animate-fade-in">
        <div className="flex h-20 items-center justify-between border-b border-border px-6">
          <span className="font-serif text-lg">{churchName}</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <ul className="space-y-1">
            {nav.map((item) => (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block rounded-lg px-4 py-3.5 text-lg font-medium text-foreground hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <div className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {item.label}
                  </div>
                )}
                {item.children.length > 0 && (
                  <ul className="mb-2 space-y-0.5">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={child.href}
                          className="block rounded-lg px-6 py-3 text-base text-foreground/80 hover:bg-secondary"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-border p-6">
          {isLive && (
            <Button asChild variant="outline" className="w-full">
              <Link href={watchUrl} target="_blank" rel="noopener noreferrer">
                <Radio className="h-4 w-4" /> Watch Live
              </Link>
            </Button>
          )}
          <Button asChild size="lg" className="w-full">
            <Link href="/get-connected">Get Connected</Link>
          </Button>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            {isStaff && <Link href="/admin" className="hover:text-foreground">Dashboard</Link>}
            {isSignedIn ? (
              <Link href="/account" className="hover:text-foreground">My Account</Link>
            ) : (
              <Link href="/login" className="hover:text-foreground">Sign in</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
