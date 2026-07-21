import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, MapPin, User, Tag } from 'lucide-react';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { RichText } from '@/components/blocks/rich-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime, absoluteUrl } from '@/lib/utils';
import { RsvpForm } from './rsvp-form';
import type { EventRow } from '@/types/database';

export const revalidate = 60;

async function loadEvent(slug: string): Promise<EventRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('is_public', true)
    .is('deleted_at', null)
    .maybeSingle<EventRow>();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) return { title: 'Event not found' };
  const description = event.description_html
    ? event.description_html.replace(/<[^>]+>/g, '').slice(0, 180)
    : `${event.title} — ${formatDateTime(event.start_at)}`;
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title: event.title,
      description,
      images: event.cover_image_url ? [{ url: event.cover_image_url }] : undefined,
      type: 'website',
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) notFound();

  const user = await getCurrentUser();

  const now = Date.now();
  const deadlinePassed =
    event.rsvp_deadline != null && new Date(event.rsvp_deadline).getTime() < now;

  // Confirmed count for capacity display (service role to read all rsvps).
  let taken = 0;
  if (event.rsvp_enabled && event.rsvp_capacity != null) {
    const service = createServiceRoleClient();
    const { data: confirmed } = await service
      .from('event_rsvps')
      .select('party_size')
      .eq('event_id', event.id)
      .eq('status', 'confirmed');
    taken = (confirmed ?? []).reduce((sum, r) => sum + (r.party_size ?? 1), 0);
  }
  const remaining =
    event.rsvp_capacity != null ? Math.max(0, event.rsvp_capacity - taken) : null;
  const isFull = remaining != null && remaining <= 0;

  const mapsUrl =
    event.maps_url ||
    (event.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`
      : null);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.start_at,
    endDate: event.end_at ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: event.cover_image_url ? [event.cover_image_url] : undefined,
    description: event.description_html
      ? event.description_html.replace(/<[^>]+>/g, '').slice(0, 300)
      : undefined,
    url: absoluteUrl(`/events/${event.slug}`),
    location: event.venue
      ? {
          '@type': 'Place',
          name: event.venue,
          address: event.address ?? undefined,
        }
      : undefined,
    organizer: event.organizer ? { '@type': 'Organization', name: event.organizer } : undefined,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {event.cover_image_url && (
        <div className="relative aspect-[21/9] w-full overflow-hidden border-b border-border/60 bg-muted">
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}

      <div className="container py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-8">
            <header className="space-y-4">
              {event.category && (
                <Badge variant="outline" className="capitalize">
                  {event.category}
                </Badge>
              )}
              <h1 className="text-4xl font-serif font-medium md:text-5xl">{event.title}</h1>

              <dl className="grid gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-brand" />
                  <span>
                    {formatDateTime(event.start_at)}
                    {event.end_at ? ` – ${formatDateTime(event.end_at)}` : ''}
                  </span>
                </div>
                {(event.venue || event.address) && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-brand" />
                    <span>
                      {event.venue}
                      {event.venue && event.address ? ', ' : ''}
                      {event.address}
                      {mapsUrl && (
                        <>
                          {' · '}
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand underline-offset-4 hover:underline"
                          >
                            Get directions
                          </a>
                        </>
                      )}
                    </span>
                  </div>
                )}
                {event.organizer && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-brand" />
                    <span>Hosted by {event.organizer}</span>
                  </div>
                )}
                {event.category && (
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-brand" />
                    <span className="capitalize">{event.category}</span>
                  </div>
                )}
              </dl>
            </header>

            {event.description_html && <RichText html={event.description_html} />}
          </div>

          {/* Booking / RSVP sidebar */}
          {(event.seating_enabled || event.rsvp_enabled) && (
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {event.seating_enabled && (
                <div className="rounded-2xl border border-brand/40 bg-brand/5 p-6">
                  <h2 className="text-lg font-serif font-medium">Reserve your seat</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pick your seat from the venue map. Online payment is coming soon — your seat is
                    held and settled at the venue for now.
                  </p>
                  <Button asChild className="mt-4 w-full">
                    <Link href={`/events/${event.slug}/seats`}>Book your seat</Link>
                  </Button>
                </div>
              )}

              {event.rsvp_enabled && (
              <div className="rounded-2xl border border-border bg-card/60 p-6">
                <h2 className="text-lg font-serif font-medium">RSVP</h2>
                {remaining != null && !isFull && !deadlinePassed && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {remaining} {remaining === 1 ? 'spot' : 'spots'} remaining
                  </p>
                )}

                <div className="mt-4">
                  {deadlinePassed ? (
                    <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                      The RSVP deadline for this event has passed.
                    </p>
                  ) : isFull ? (
                    <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                      This event is full.
                    </p>
                  ) : !user && !event.guest_rsvp_allowed ? (
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>Please sign in to RSVP for this event.</p>
                      <Button asChild size="sm">
                        <Link href={`/login?redirect=/events/${event.slug}`}>Sign in</Link>
                      </Button>
                    </div>
                  ) : (
                    <RsvpForm
                      eventId={event.id}
                      isSignedIn={!!user}
                      guestAllowed={event.guest_rsvp_allowed}
                    />
                  )}
                </div>
              </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </article>
  );
}
