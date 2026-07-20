'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { currentIpHash, rateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';
import { sendEmail, emailLayout } from '@/lib/email';
import { formatDateTime } from '@/lib/utils';
import { seatBookingSchema } from '@/lib/validations';
import { isValidSeatLabel, SERVICE_SESSIONS } from '@/lib/seat-map';
import { type ActionResult, fail, succeed, zodFieldErrors } from '@/lib/form';
import type { EventRow } from '@/types/database';

/** Postgres unique-violation code. */
const UNIQUE_VIOLATION = '23505';

function rawString(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v : '';
}

export async function submitSeatBookingAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = seatBookingSchema.safeParse({
    eventId: rawString(formData, 'eventId'),
    session: rawString(formData, 'session'),
    seats: rawString(formData, 'seats'),
    guestName: rawString(formData, 'guestName'),
    guestEmail: rawString(formData, 'guestEmail'),
    guestPhone: rawString(formData, 'guestPhone'),
    website: rawString(formData, 'website'),
  });

  if (!parsed.success) {
    return fail('Please check the form and try again.', zodFieldErrors(parsed.error));
  }
  const data = parsed.data;
  const session = data.session;
  const sessionLabel = SERVICE_SESSIONS.find((s) => s.id === session)?.label ?? 'Service';

  // Normalise + de-dupe selected seats; reject anything not on the map.
  const seats = [...new Set(data.seats)];
  if (seats.some((label) => !isValidSeatLabel(label))) {
    return fail('One of the selected seats is invalid. Please refresh and try again.');
  }

  const ipHash = await currentIpHash();
  if (!rateLimit(`seat:${ipHash}`, 10, 60 * 60 * 1000).success) {
    return fail('Too many booking attempts from this connection. Please try again later.');
  }

  const service = createServiceRoleClient();
  const { data: event } = await service
    .from('events')
    .select('*')
    .eq('id', data.eventId)
    .eq('status', 'published')
    .eq('is_public', true)
    .is('deleted_at', null)
    .maybeSingle<EventRow>();

  if (!event) return fail('This event could not be found.');
  if (!event.seating_enabled) return fail('Seat booking is not open for this event.');

  // Reject seats already reserved (fast pre-check; the unique index is the
  // real guard against races below).
  const { data: takenRows } = await service
    .from('event_seat_bookings')
    .select('seat_label')
    .eq('event_id', event.id)
    .eq('service_session', session)
    .eq('status', 'reserved')
    .in('seat_label', seats);
  const taken = new Set((takenRows ?? []).map((r) => r.seat_label));
  const clashes = seats.filter((s) => taken.has(s));
  if (clashes.length > 0) {
    return fail(
      `Sorry, ${clashes.join(', ')} ${clashes.length === 1 ? 'was' : 'were'} just taken. Please pick again.`
    );
  }

  const user = await getCurrentUser();

  let notifyEmail: string | null = null;
  let notifyName = '';
  const base: Record<string, unknown> = {
    event_id: event.id,
    service_session: session,
    status: 'reserved',
    ip_hash: ipHash,
  };

  if (user) {
    base.profile_id = user.id;
    notifyEmail = user.email;
    notifyName = user.profile.full_name ?? 'Friend';
  } else {
    if (!event.guest_rsvp_allowed) {
      return fail('Please sign in to book seats for this event.');
    }
    if (!data.guestName || !data.guestEmail) {
      return fail('Please provide your name and email.', {
        ...(data.guestName ? {} : { guestName: 'Enter your name' }),
        ...(data.guestEmail ? {} : { guestEmail: 'Enter your email' }),
      });
    }
    base.guest_name = data.guestName;
    base.guest_email = data.guestEmail;
    base.guest_phone = data.guestPhone || null;
    notifyEmail = data.guestEmail;
    notifyName = data.guestName;
  }

  const rows = seats.map((label) => ({ ...base, seat_label: label }));

  // Signed-in members insert via their RLS-bound client (profile_id =
  // auth.uid()); guests go through the service role after validation.
  const db = user ? await createClient() : service;
  const { error } = await db.from('event_seat_bookings').insert(rows);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return fail('One or more of those seats were just taken. Please pick again.');
    }
    console.error('[seat-booking] insert failed', error);
    return fail('We could not reserve your seats. Please try again.');
  }

  await logAudit({
    actorId: user?.id ?? null,
    actorEmail: user?.email ?? notifyEmail,
    action: 'seat_booking.create',
    entityType: 'event',
    entityId: event.id,
    metadata: { seats, session },
  });

  if (notifyEmail) {
    void sendEmail({
      to: notifyEmail,
      subject: `Your seats are reserved: ${event.title}`,
      html: emailLayout(
        'Your seats are reserved!',
        `<p>Dear ${notifyName},</p>
         <p>We've reserved the following ${seats.length === 1 ? 'seat' : 'seats'} for
         <strong>${event.title}</strong> (${sessionLabel}):</p>
         <p style="font-size:18px;color:#d6ad6a"><strong>${seats.join(', ')}</strong></p>
         <p><strong>Service:</strong> ${sessionLabel}<br/>
         <strong>When:</strong> ${formatDateTime(event.start_at)}<br/>
         ${event.venue ? `<strong>Where:</strong> ${event.venue}` : ''}</p>
         <p><strong>Payment:</strong> settled at the venue for now — online payment is coming soon.</p>
         <p>We look forward to seeing you!<br/>New Life Tagum</p>`
      ),
    });
  }

  revalidatePath(`/events/${event.slug}/seats`);

  return succeed(
    `You've reserved ${seats.length === 1 ? 'seat' : 'seats'} ${seats.join(', ')} ` +
      `for the ${sessionLabel}. A confirmation was sent if you provided an email.`,
    { data: { seats, session } }
  );
}
