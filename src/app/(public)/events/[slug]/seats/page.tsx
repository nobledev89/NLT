import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { formatDateTime } from '@/lib/utils';
import type { EventRow, ServiceSession } from '@/types/database';
import { SeatBooking } from './seat-booking';

export const revalidate = 0;

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
  if (!event || !event.seating_enabled) return { title: 'Book a seat' };
  return {
    title: `Book a seat — ${event.title}`,
    description: `Pick and reserve your seat for ${event.title}.`,
    alternates: { canonical: `/events/${event.slug}/seats` },
  };
}

export default async function SeatBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event || !event.seating_enabled) notFound();

  const user = await getCurrentUser();

  // All active reservations (service role reads across all bookers), split by
  // service session so the morning and evening maps are independent.
  const service = createServiceRoleClient();
  const { data: bookedRows } = await service
    .from('event_seat_bookings')
    .select('seat_label, service_session')
    .eq('event_id', event.id)
    .eq('status', 'reserved');
  const bookedBySession: Record<ServiceSession, string[]> = { morning: [], evening: [] };
  for (const r of bookedRows ?? []) {
    bookedBySession[r.service_session].push(r.seat_label);
  }

  return (
    <div className="container py-10 md:py-14">
      <Link
        href={`/events/${event.slug}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>

      <header className="mt-4 space-y-3">
        <p className="eyebrow">Reserve your seat</p>
        <h1 className="text-3xl font-serif font-medium md:text-4xl">{event.title}</h1>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold" />
            {formatDateTime(event.start_at)}
          </div>
          {event.venue && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" />
              {event.venue}
            </div>
          )}
        </dl>
      </header>

      <div className="mt-8">
        <SeatBooking
          eventId={event.id}
          bookedBySession={bookedBySession}
          isSignedIn={!!user}
          guestAllowed={event.guest_rsvp_allowed}
          eventSlug={event.slug}
        />
      </div>
    </div>
  );
}
