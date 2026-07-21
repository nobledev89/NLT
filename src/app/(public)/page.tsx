import type { Metadata } from 'next';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { BlockList } from '@/components/blocks/block-renderer';
import { getSiteSettings } from '@/lib/settings';
import { absoluteUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
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
        {/* Hero background photo with layered scrims so the cream text stays
            legible over the image (vertical fade + left-side darkening). */}
        <Image
          src="/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-background/40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/85 via-background/40 to-transparent" />
        <div className="container flex min-h-[64vh] flex-col justify-center py-24 md:min-h-[72vh] md:py-32">
          <div className="max-w-3xl space-y-6 animate-fade-in">
            <p className="eyebrow">New Life Tagum</p>
            <h1 className="text-display-lg font-serif font-medium">
              A welcoming family of faith in Tagum.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-foreground/75 md:text-xl">
              Join us for worship, connect with a ministry, or take your next
              step with our church community.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/get-connected">Get Connected</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
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
              <Card className="h-full p-6 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-brand/40 group-hover:shadow-lg group-hover:shadow-primary/5">
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
                  Learn more{' '}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
