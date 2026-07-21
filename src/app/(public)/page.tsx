import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/settings';
import { absoluteUrl, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 60;

export const metadata: Metadata = {
  description:
    'New Life Tagum — a welcoming, Christ-centered community in Tagum, Davao del Norte. Join us for worship, connect with a ministry, or plan your visit.',
  alternates: { canonical: '/' },
};

/* ---------------------------------------------------------------------------
 * HOMEPAGE IMAGES — the only place you touch to add/replace photos.
 *
 * To add an image: drop the file in `public/home/` and set its path below.
 * Any slot left null/empty renders a themed placeholder (or the whole section
 * is hidden), so the page always looks finished.
 *
 *   hero    — full-bleed, 16:9 landscape ....... ~2560×1440  (public/hero.png)
 *   welcome — beside the intro text, 4:3 ....... ~1600×1200  (public/home/…)
 *   band    — full-width band, 21:8 wide ....... ~2560×1000  (public/home/…)
 *   gallery — square tiles, 1:1 ................ ~1000×1000  (best in 4s)
 * ------------------------------------------------------------------------- */
const HOME_IMAGES = {
  hero: { src: '/hero.png', position: '75% center' as string | undefined },
  welcome: null as string | null, // e.g. '/home/welcome.jpg'
  band: null as string | null, // e.g. '/home/band.jpg'
  gallery: [] as { src: string; alt: string }[],
  // e.g. [{ src: '/home/gallery-1.jpg', alt: 'Sunday worship' }, …]
};

/** Renders a cover image, or a tasteful themed panel when no image is set. */
function ImageSlot({
  src,
  alt = '',
  sizes,
  position,
  priority,
}: {
  src: string | null;
  alt?: string;
  sizes?: string;
  position?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-accent/25 to-card">
        <div className="absolute inset-0 bg-grain" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover"
      style={position ? { objectPosition: position } : undefined}
    />
  );
}

export default async function HomePage() {
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

      {/* Hero -------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden border-b border-border/60">
        <ImageSlot
          src={HOME_IMAGES.hero.src}
          position={HOME_IMAGES.hero.position}
          sizes="100vw"
          priority
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

      {/* Three next-steps ------------------------------------------------- */}
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

      {/* Welcome / who we are --------------------------------------------- */}
      <section className="section border-t border-border/60">
        <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
            <ImageSlot
              src={HOME_IMAGES.welcome}
              alt="New Life Tagum gathered in worship"
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </div>
          <div className="space-y-5">
            <p className="eyebrow">Who we are</p>
            <h2 className="text-headline font-serif font-medium">
              A place to belong, believe, and become.
            </h2>
            <p className="text-lg leading-relaxed text-foreground/75">
              We&apos;re an ordinary community of people following Jesus
              together — worshipping, growing in faith, and caring for one
              another and our city.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Whether you&apos;re exploring faith for the first time or looking
              for a church to call home, there&apos;s a place for you here.
            </p>
            <Button asChild variant="outline">
              <Link href="/who-we-are">Our story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Full-width photo band (shown once a band image is set) ----------- */}
      {HOME_IMAGES.band && (
        <section className="border-y border-border/60">
          <figure className="relative aspect-[16/9] w-full overflow-hidden md:aspect-[21/8]">
            <ImageSlot
              src={HOME_IMAGES.band}
              alt="New Life Tagum community"
              sizes="100vw"
            />
          </figure>
        </section>
      )}

      {/* Gallery (shown once gallery images are added) -------------------- */}
      {HOME_IMAGES.gallery.length > 0 && (
        <section className="section border-t border-border/60">
          <div className="container">
            <h2 className="mb-8 text-headline font-serif font-medium">
              Life at New Life
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {HOME_IMAGES.gallery.map((img, i) => (
                <figure
                  key={i}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-xl border border-border'
                  )}
                >
                  <ImageSlot
                    src={img.src}
                    alt={img.alt}
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  />
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closing call to action ------------------------------------------- */}
      <section className="section">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-accent/40 via-card to-card px-8 py-16 text-center md:px-16 md:py-20">
            <div className="absolute inset-0 bg-grain" />
            <div className="relative mx-auto max-w-2xl space-y-5">
              <h2 className="text-headline font-serif font-medium">
                Plan your first visit
              </h2>
              <p className="text-lg text-foreground/75">
                We&apos;d love to meet you. Tell us you&apos;re coming and
                we&apos;ll help you know what to expect.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button asChild size="lg">
                  <Link href="/get-connected">Plan your visit</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/services">Service times</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
