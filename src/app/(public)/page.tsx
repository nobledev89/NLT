import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/settings';
import { createClient } from '@/lib/supabase/server';
import { absoluteUrl, cn, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, CalendarDays, MapPin, Ticket } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { EventRow } from '@/types/database';

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
 *   hero          — full-bleed, 16:9 landscape .. ~2560×1440  (public/hero.png)
 *   welcome       — beside the intro text ....... set `aspect` to match the file
 *   planVisit     — backdrop of the closing CTA . wide & dark, ~21:9
 *   featuredEvent — event poster, spans the card . wide 16:9, ~1600×900
 *   band          — full-width band, 21:8 wide .. ~2560×1000  (public/home/…)
 *   gallery       — square tiles, 1:1 ........... ~1000×1000  (best in 4s)
 * ------------------------------------------------------------------------- */
const HOME_IMAGES = {
  hero: { src: '/hero.png', position: '75% center' as string | undefined },
  welcome: {
    // 1212×977 collage — `aspect` matches the file so nothing gets cropped.
    src: '/home/who-we-are.png' as string | null,
    aspect: 'aspect-[1212/977]',
  },
  planVisit: '/home/plan-visit.png' as string | null,
  // Fallback art for the featured-event band. The event's own
  // `cover_image_url` from the CMS wins over this when one is set.
  featuredEvent: '/home/accelerate.png' as string | null,
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

/**
 * The next upcoming event flagged `is_featured` in the CMS — the anniversary
 * today. Returns null when nothing is featured, and the section is skipped.
 *
 * Swallows errors the same way `getSiteSettings` does: the homepage still
 * renders when Supabase is unconfigured or unreachable, minus this section.
 */
async function getFeaturedEvent(): Promise<EventRow | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .eq('is_public', true)
      .eq('is_featured', true)
      .is('deleted_at', null)
      .gte('start_at', new Date().toISOString())
      .order('start_at', { ascending: true })
      .limit(1);
    return ((data ?? []) as EventRow[])[0] ?? null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [settings, featuredEvent] = await Promise.all([
    getSiteSettings(),
    getFeaturedEvent(),
  ]);

  const featuredBlurb = featuredEvent?.description_html
    ? featuredEvent.description_html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200)
    : null;

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
        {/* Backdrop — photo and its scrims share one layer so the scrims sit
            *over* the photo and the whole stack sits under the copy. Keep the
            image inside this wrapper: as a bare sibling it paints above the
            text (positioned z-auto beats both -z-10 and in-flow content). */}
        <div className="absolute inset-0 -z-10">
          <ImageSlot
            src={HOME_IMAGES.hero.src}
            position={HOME_IMAGES.hero.position}
            sizes="100vw"
            priority
          />
          {/* Narrow screens crop in tight on the subject, so they need a much
              heavier scrim than desktop to keep the headline readable. */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/55 md:via-background/70 md:to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40 md:from-background/85 md:via-background/40 md:to-transparent" />
        </div>
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
              {/* Sits on the photo, so the transparent outline style needs its
                  own backdrop to stay legible. */}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-foreground/30 bg-background/50 backdrop-blur-sm hover:bg-background/70"
              >
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

      {/* Featured event — the anniversary while it's upcoming ------------- */}
      {featuredEvent && (
        <section className="section border-t border-border/60 pt-0">
          <div className="container">
            <div className="overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/10 via-card/50 to-background">
              {/* The poster is a wide title card with centred type, so it spans
                  the full width — a side column would crop the wordmark.
                  Desktop trims top and bottom only, which is safe. */}
              <div className="relative aspect-[16/9] w-full border-b border-brand/20 md:aspect-[2/1]">
                <ImageSlot
                  src={featuredEvent.cover_image_url ?? HOME_IMAGES.featuredEvent}
                  alt={featuredEvent.title}
                  sizes="(min-width: 1280px) 1152px, 100vw"
                />
              </div>
              <div className="space-y-4 p-8 md:p-10">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
                  <Ticket className="h-3.5 w-3.5" />
                  {featuredEvent.category ?? 'Featured event'}
                </span>
                <h2 className="text-headline font-serif font-medium">
                  {featuredEvent.title}
                </h2>
                {featuredBlurb && (
                  <p className="leading-relaxed text-muted-foreground">
                    {featuredBlurb}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-brand" />
                    {formatDateTime(featuredEvent.start_at)}
                  </span>
                  {featuredEvent.venue && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-brand" />
                      {featuredEvent.venue}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  {featuredEvent.seating_enabled ? (
                    <>
                      <Button asChild size="lg">
                        <Link href={`/events/${featuredEvent.slug}/seats`}>
                          Book your seat
                        </Link>
                      </Button>
                      <Button asChild size="lg" variant="outline">
                        <Link href={`/events/${featuredEvent.slug}`}>
                          Event details
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild size="lg">
                      <Link href={`/events/${featuredEvent.slug}`}>
                        Event details
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Welcome / who we are --------------------------------------------- */}
      <section className="section border-t border-border/60">
        <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border border-border',
              HOME_IMAGES.welcome.aspect
            )}
          >
            <ImageSlot
              src={HOME_IMAGES.welcome.src}
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
            {HOME_IMAGES.planVisit && (
              <>
                <Image
                  src={HOME_IMAGES.planVisit}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 1152px, 100vw"
                  className="object-cover"
                />
                {/* Scrim — keeps the copy readable over the photo's bright
                    highlights. Lower the opacity to let more image through. */}
                <div className="absolute inset-0 bg-background/60" />
              </>
            )}
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
