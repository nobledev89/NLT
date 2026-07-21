'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { CheckCircle2, Sun, Moon } from 'lucide-react';
import { submitSeatBookingAction } from '@/app/actions/seat-bookings';
import { initialActionState } from '@/lib/form';
import {
  SEAT_MAP,
  MAX_SEATS_PER_BOOKING,
  TOTAL_SEATS,
  SERVICE_SESSIONS,
  type SeatSection,
  type ServiceSession,
} from '@/lib/seat-map';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SeatState = 'available' | 'selected' | 'booked';

const SECTION_STYLE: Record<SeatSection['id'], string> = {
  A: 'border-sky-500/40 bg-sky-500/10 text-sky-100 hover:bg-sky-500/25',
  B: 'border-amber-500/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/25',
};

const SESSION_ICON: Record<ServiceSession, typeof Sun> = { morning: Sun, evening: Moon };

export function SeatBooking({
  eventId,
  bookedBySession,
  isSignedIn,
  guestAllowed,
}: {
  eventId: string;
  bookedBySession: Record<ServiceSession, string[]>;
  isSignedIn: boolean;
  guestAllowed: boolean;
  eventSlug: string;
}) {
  const [state, action] = useActionState(submitSeatBookingAction, initialActionState);
  const [session, setSession] = React.useState<ServiceSession>('morning');
  const [bookedBy, setBookedBy] = React.useState<Record<ServiceSession, Set<string>>>(() => ({
    morning: new Set(bookedBySession.morning),
    evening: new Set(bookedBySession.evening),
  }));
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());

  // Keep in sync if the server re-renders with fresh reservations.
  React.useEffect(() => {
    setBookedBy({
      morning: new Set(bookedBySession.morning),
      evening: new Set(bookedBySession.evening),
    });
  }, [bookedBySession]);

  // On a successful booking, mark those seats taken in the booked session and
  // clear the selection.
  const lastHandled = React.useRef<ActionResultSeats | null>(null);
  React.useEffect(() => {
    if (state.ok && state !== lastHandled.current) {
      lastHandled.current = state as ActionResultSeats;
      const justBooked = (state.data?.seats as string[] | undefined) ?? [];
      const bookedSession = (state.data?.session as ServiceSession | undefined) ?? session;
      if (justBooked.length) {
        setBookedBy((prev) => ({
          ...prev,
          [bookedSession]: new Set([...prev[bookedSession], ...justBooked]),
        }));
        setSelected(new Set());
      }
    }
  }, [state, session]);

  const booked = bookedBy[session];

  function toggle(label: string) {
    if (booked.has(label)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        if (next.size >= MAX_SEATS_PER_BOOKING) return prev;
        next.add(label);
      }
      return next;
    });
  }

  function switchSession(next: ServiceSession) {
    if (next === session) return;
    setSession(next);
    setSelected(new Set());
  }

  const selectedList = [...selected].sort(sortSeatLabels);
  const atLimit = selected.size >= MAX_SEATS_PER_BOOKING;
  const needGuestInfo = !isSignedIn && guestAllowed;

  return (
    <div className={cn('grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start', selected.size > 0 && 'pb-24 lg:pb-0')}>
      {/* ---- Seat map ---- */}
      <div className="space-y-5">
        {/* Service session picker */}
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Choose a service</p>
          <div className="inline-flex w-full rounded-xl border border-border bg-card/40 p-1 sm:w-auto">
            {SERVICE_SESSIONS.map((s) => {
              const Icon = SESSION_ICON[s.id];
              const remaining = Math.max(0, TOTAL_SEATS - bookedBy[s.id].size);
              const active = s.id === session;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => switchSession(s.id)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:flex-none',
                    active
                      ? 'bg-brand text-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{s.label}</span>
                  <span className={cn('tabular-nums', active ? 'text-background/70' : 'opacity-60')}>
                    · {remaining}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card/40 py-2 text-center text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Stage
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [--seat:2rem] sm:[--seat:2.4rem]">
          <div className="flex flex-col items-center gap-10 sm:w-max sm:flex-row sm:items-start sm:justify-center sm:gap-8">
            {SEAT_MAP.map((section) => (
              <section key={section.id} className="space-y-3">
                <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </p>
                <div className="space-y-1.5">
                  {Array.from({ length: section.topSpacerRows }).map((_, i) => (
                    <div key={`spacer-${i}`} aria-hidden className="h-[var(--seat)]" />
                  ))}
                  {section.blocks.map((block, bi) => (
                    <div key={bi} className={cn('space-y-1.5', bi > 0 && 'pt-4')}>
                      {block.rows.map((row, ri) => (
                        <div
                          key={ri}
                          className="grid gap-1.5 [grid-template-columns:repeat(var(--cols),var(--seat))]"
                          style={{ ['--cols' as string]: block.gridCols }}
                        >
                          {row.map((seat) => {
                            const st: SeatState = booked.has(seat.label)
                              ? 'booked'
                              : selected.has(seat.label)
                                ? 'selected'
                                : 'available';
                            return (
                              <button
                                key={seat.label}
                                type="button"
                                aria-pressed={st === 'selected'}
                                aria-label={`Seat ${seat.label}${st === 'booked' ? ' (reserved)' : ''}`}
                                disabled={st === 'booked' || (st === 'available' && atLimit)}
                                onClick={() => toggle(seat.label)}
                                style={{ gridColumnStart: seat.col }}
                                className={cn(
                                  'flex h-[var(--seat)] w-[var(--seat)] items-center justify-center rounded border text-[9px] font-medium tabular-nums transition-colors sm:text-[10px]',
                                  st === 'available' &&
                                    cn(SECTION_STYLE[section.id], atLimit && 'cursor-not-allowed opacity-50'),
                                  st === 'selected' &&
                                    'border-brand bg-brand font-semibold text-background',
                                  st === 'booked' &&
                                    'cursor-not-allowed border-transparent bg-muted/40 text-muted-foreground/40 line-through'
                                )}
                              >
                                {seat.label.replace(/-.+$/, '')}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <LegendSwatch className="border-sky-500/40 bg-sky-500/10" label="Section A" />
          <LegendSwatch className="border-amber-500/40 bg-amber-500/10" label="Section B" />
          <LegendSwatch className="border-brand bg-brand" label="Selected" />
          <LegendSwatch className="border-transparent bg-muted/40" label="Reserved" />
        </div>
      </div>

      {/* ---- Booking summary / form ---- */}
      <aside id="booking-form" className="scroll-mt-24 lg:sticky lg:top-24">
        <form
          action={action}
          className="space-y-4 rounded-2xl border border-border bg-card/60 p-6"
        >
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="session" value={session} />
          <input type="hidden" name="seats" value={selectedList.join(',')} />
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute left-[-9999px]"
            aria-hidden
          />

          <div>
            <h2 className="text-lg font-serif font-medium">Your seats</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {SERVICE_SESSIONS.find((s) => s.id === session)?.label}
              </span>
              {' — '}
              {selectedList.length === 0
                ? 'tap seats on the map to select them.'
                : `${selectedList.length} of ${MAX_SEATS_PER_BOOKING} selected`}
            </p>
          </div>

          {selectedList.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {selectedList.map((label) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => toggle(label)}
                    className="inline-flex items-center gap-1 rounded-full border border-brand/50 bg-brand/15 px-2.5 py-1 text-xs font-medium text-brand hover:bg-brand/25"
                    aria-label={`Remove seat ${label}`}
                  >
                    {label} <span aria-hidden>×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <FormMessage ok={state.ok} message={state.message} />

          {needGuestInfo && (
            <div className="space-y-3 border-t border-border pt-4">
              <Field label="Your name" htmlFor="guestName" required error={state.fieldErrors?.guestName}>
                <Input id="guestName" name="guestName" autoComplete="name" />
              </Field>
              <Field label="Email" htmlFor="guestEmail" required error={state.fieldErrors?.guestEmail}>
                <Input id="guestEmail" name="guestEmail" type="email" autoComplete="email" />
              </Field>
              <Field label="Phone" htmlFor="guestPhone" hint="Optional" error={state.fieldErrors?.guestPhone}>
                <Input id="guestPhone" name="guestPhone" type="tel" autoComplete="tel" />
              </Field>
            </div>
          )}

          {!isSignedIn && !guestAllowed && (
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Please sign in to book seats for this event.
            </p>
          )}

          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" name="consent" required className="mt-0.5" />
            <span>
              I agree to my details being used to manage this booking in line with the church&apos;s
              privacy notice.
            </span>
          </label>

          <SubmitButton
            className="w-full"
            pendingText="Reserving…"
            disabled={selectedList.length === 0 || (!isSignedIn && !guestAllowed)}
          >
            {selectedList.length > 0
              ? `Reserve ${selectedList.length} ${selectedList.length === 1 ? 'seat' : 'seats'}`
              : 'Reserve seats'}
          </SubmitButton>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
            Online payment is coming soon — for now your seat is held and settled at the venue.
          </p>
        </form>
      </aside>

      {/* ---- Mobile sticky action bar ---- */}
      {selectedList.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
          <a
            href="#booking-form"
            className="flex items-center justify-between gap-3 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-background"
          >
            <span>
              {selectedList.length} {selectedList.length === 1 ? 'seat' : 'seats'} ·{' '}
              {SERVICE_SESSIONS.find((s) => s.id === session)?.short}
            </span>
            <span>Review &amp; reserve →</span>
          </a>
        </div>
      )}
    </div>
  );
}

type ActionResultSeats = typeof initialActionState;

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-4 w-4 rounded border', className)} />
      {label}
    </span>
  );
}

/** Sort seat labels like "9-A" before "10-A" (numeric, then section). */
function sortSeatLabels(a: string, b: string): number {
  const [an, as] = a.split('-');
  const [bn, bs] = b.split('-');
  if (as !== bs) return as.localeCompare(bs);
  return Number(an) - Number(bn);
}
