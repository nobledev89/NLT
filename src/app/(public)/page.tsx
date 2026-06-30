import type { Metadata } from 'next';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { BlockList } from '@/components/blocks/block-renderer';
import { getSiteSettings } from '@/lib/settings';
import { absoluteUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('home');
  if (!loaded) return {};
  return { ...pageMetadata(loaded.page), alternates: { canonical: '/' } };
}

export default async function HomePage() {
  const loaded = await getPublishedPage('home');
  const settings = await getSiteSettings();
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: settings.branding.churchName,
    description: settings.seo.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.contact.address,
      addressLocality: 'Tagum',
      addressRegion: 'Davao del Norte',
      addressCountry: 'PH',
    },
    url: absoluteUrl('/'),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      {loaded ? <BlockList blocks={loaded.blocks} /> : <StaticHome />}
    </>
  );
}

function StaticHome() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/40 via-background to-background" />
        <div className="container py-24 md:py-32">
          <div className="max-w-3xl space-y-6">
            <p className="eyebrow">New Life Tagum</p>
            <h1 className="text-display font-serif font-medium">
              A welcoming family of faith in Tagum.
            </h1>
            <p className="text-lg leading-relaxed text-foreground/70">
              Join us for worship, connect with a ministry, or take your next
              step with our church community.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/get-connected">Get Connected</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/services">Service Times</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Worship With Us',
              body: 'Find service times, sermons, and live stream details.',
              href: '/services',
            },
            {
              title: 'Find Community',
              body: 'Explore ministries for every season of life.',
              href: '/ministries',
            },
            {
              title: 'Take a Next Step',
              body: 'Tell us how we can connect, pray, or help you serve.',
              href: '/get-connected',
            },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full p-6 transition-colors group-hover:border-gold/40">
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
