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

export default async function MyRsvpsPage() {
  const user = await requireUser('/account/rsvps');
  const supabase = await createClient();

  const { data } = await supabase
    .from('event_rsvps')
    .select('*, events(title, slug, start_at, venue)')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  const rsvps = (data ?? []) as unknown as RsvpWithEvent[];

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
              <Link href="/events" className="text-gold hover:underline">
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
                          className="hover:text-gold"
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
    </div>
  );
}
