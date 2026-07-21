import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import type { RsvpStatus } from '@/types/database';
import { CancelRsvpButton } from './cancel-rsvp-button';

export const metadata: Metadata = { title: 'My RSVPs' };

type RsvpEvent = Pick<
  import('@/types/database').EventRow,
  'title' | 'slug' | 'start_at' | 'venue'
>;

interface RsvpWithEvent {
  id: string;
  status: RsvpStatus;
  party_size: number;
  created_at: string;
  events: RsvpEvent | null;
}

const STATUS_VARIANT: Record<RsvpStatus, 'success' | 'warning' | 'muted'> = {
  confirmed: 'success',
  waitlist: 'warning',
  cancelled: 'muted',
};

interface SeatBookingWithEvent {
  id: string;
  seat_label: string;
  service_session: 'morning' | 'evening';
  events: RsvpEvent | null;
}

const SESSION_LABEL: Record<'morning' | 'evening', string> = {
  morning: 'Morning Service',
  evening: 'Evening Service',
};

export default async function MyRsvpsPage() {
  const user = await requireUser('/account/rsvps');
  const supabase = await createClient();

  const [{ data }, { data: seatData }] = await Promise.all([
    supabase
      .from('event_rsvps')
      .select('*, events(title, slug, start_at, venue)')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('event_seat_bookings')
      .select('id, seat_label, service_session, events(title, slug, start_at, venue)')
      .eq('profile_id', user.id)
      .eq('status', 'reserved')
      .order('created_at', { ascending: false }),
  ]);

  const rsvps = (data ?? []) as unknown as RsvpWithEvent[];
  const seatBookings = (seatData ?? []) as unknown as SeatBookingWithEvent[];

  // Group reserved seats by event + service session.
  const seatsByEvent = new Map<
    string,
    { event: RsvpEvent | null; session: 'morning' | 'evening'; seats: string[] }
  >();
  for (const b of seatBookings) {
    const key = `${b.events?.slug ?? b.id}:${b.service_session}`;
    const entry = seatsByEvent.get(key) ?? {
      event: b.events,
      session: b.service_session,
      seats: [],
    };
    entry.seats.push(b.seat_label);
    seatsByEvent.set(key, entry);
  }
  const seatGroups = [...seatsByEvent.values()];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">My RSVPs</h2>
        <p className="text-sm text-muted-foreground">Events you have responded to.</p>
      </div>

      {rsvps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>You have no RSVPs yet.</p>
            <p className="mt-2 text-sm">
              <Link href="/events" className="text-brand hover:underline">
                Browse upcoming events
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {rsvps.map((rsvp) => (
            <li key={rsvp.id}>
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="truncate">
                      {rsvp.events?.slug ? (
                        <Link
                          href={`/events/${rsvp.events.slug}`}
                          className="hover:text-brand"
                        >
                          {rsvp.events.title}
                        </Link>
                      ) : (
                        (rsvp.events?.title ?? 'Event')
                      )}
                    </CardTitle>
                    <CardDescription>
                      {rsvp.events?.start_at ? formatDateTime(rsvp.events.start_at) : null}
                      {rsvp.events?.venue ? ` · ${rsvp.events.venue}` : null}
                    </CardDescription>
                  </div>
                  <Badge variant={STATUS_VARIANT[rsvp.status]} className="capitalize">
                    {rsvp.status}
                  </Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Party of {rsvp.party_size}
                  </p>
                  {rsvp.status !== 'cancelled' && <CancelRsvpButton rsvpId={rsvp.id} />}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {seatGroups.length > 0 && (
        <div className="space-y-4 pt-4">
          <div>
            <h2 className="font-serif text-2xl tracking-tight">My reserved seats</h2>
            <p className="text-sm text-muted-foreground">Seats you have booked for events.</p>
          </div>
          <ul className="space-y-4">
            {seatGroups.map((group, i) => (
              <li key={`${group.event?.slug ?? i}:${group.session}`}>
                <Card>
                  <CardHeader>
                    <CardTitle className="truncate">
                      {group.event?.slug ? (
                        <Link href={`/events/${group.event.slug}`} className="hover:text-brand">
                          {group.event.title}
                        </Link>
                      ) : (
                        (group.event?.title ?? 'Event')
                      )}
                    </CardTitle>
                    <CardDescription>
                      {SESSION_LABEL[group.session]}
                      {group.event?.start_at ? ` · ${formatDateTime(group.event.start_at)}` : null}
                      {group.event?.venue ? ` · ${group.event.venue}` : null}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center gap-2">
                    {[...group.seats]
                      .sort((a, b) => Number(a.split('-')[0]) - Number(b.split('-')[0]))
                      .map((seat) => (
                        <Badge key={seat} variant="success">
                          {seat}
                        </Badge>
                      ))}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
