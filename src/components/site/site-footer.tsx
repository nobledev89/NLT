import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Youtube, Instagram, MapPin, Mail, Phone } from 'lucide-react';
import { getNavigation } from '@/lib/navigation';
import { getSiteSettings } from '@/lib/settings';

export async function SiteFooter() {
  const [{ footerQuick }, settings] = await Promise.all([
    getNavigation(),
    getSiteSettings(),
  ]);
  const { branding, contact, socials, serviceSummary } = settings;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="container grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Image
            src="/logo-mark-white.png"
            alt={branding.churchName}
            width={462}
            height={120}
            className="h-11 w-auto"
          />
          <p className="font-serif text-xl">{branding.churchName}</p>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {branding.tagline}
          </p>
          <div className="flex gap-3 pt-2">
            {socials.facebook && (
              <a href={socials.facebook} aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-brand">
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {socials.youtube && (
              <a href={socials.youtube} aria-label="YouTube" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-brand">
                <Youtube className="h-5 w-5" />
              </a>
            )}
            {socials.instagram && (
              <a href={socials.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-brand">
                <Instagram className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-foreground/70">Visit</p>
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            {contact.address}
          </p>
          {contact.email && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0 text-brand" /> {contact.email}
            </p>
          )}
          {contact.phone && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0 text-brand" /> {contact.phone}
            </p>
          )}
          <p className="pt-2 text-sm text-muted-foreground">{serviceSummary.text}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-foreground/70">Quick links</p>
          <ul className="space-y-2">
            {footerQuick.map((l) => (
              <li key={l.id}>
                <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-foreground/70">Connect</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/get-connected" className="text-muted-foreground hover:text-foreground">Plan your visit</Link></li>
            <li><Link href="/pledge" className="text-muted-foreground hover:text-foreground">Give</Link></li>
            <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
            <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Use</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} {branding.churchName}. All rights reserved.</p>
          <Link href="/admin" className="text-muted-foreground transition-colors hover:text-foreground">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
