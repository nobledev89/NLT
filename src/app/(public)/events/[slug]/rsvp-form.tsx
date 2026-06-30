'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { submitRsvpAction } from '@/app/actions/public-forms';
import { initialActionState } from '@/lib/form';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';

export function RsvpForm({
  eventId,
  isSignedIn,
  guestAllowed,
}: {
  eventId: string;
  isSignedIn: boolean;
  guestAllowed: boolean;
}) {
  const [state, action] = useActionState(submitRsvpAction, initialActionState);

  if (state.ok) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
        <div>
          <p className="font-medium text-emerald-200">You&apos;re confirmed!</p>
          <p className="mt-1 text-sm text-emerald-200/80">{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px]"
        aria-hidden
      />

      <FormMessage ok={state.ok} message={state.message} />

      {!isSignedIn && guestAllowed && (
        <>
          <Field label="Your name" htmlFor="guestName" required error={state.fieldErrors?.guestName}>
            <Input id="guestName" name="guestName" autoComplete="name" required />
          </Field>
          <Field label="Email" htmlFor="guestEmail" required error={state.fieldErrors?.guestEmail}>
            <Input id="guestEmail" name="guestEmail" type="email" autoComplete="email" required />
          </Field>
          <Field label="Phone" htmlFor="guestPhone" hint="Optional" error={state.fieldErrors?.guestPhone}>
            <Input id="guestPhone" name="guestPhone" type="tel" autoComplete="tel" />
          </Field>
        </>
      )}

      <Field
        label="Number attending"
        htmlFor="partySize"
        required
        error={state.fieldErrors?.partySize}
        className="max-w-[10rem]"
      >
        <Input id="partySize" name="partySize" type="number" min={1} max={20} defaultValue={1} required />
      </Field>

      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        <span>
          I agree to my details being used to manage this RSVP in line with the church&apos;s
          privacy notice.
        </span>
      </label>

      <SubmitButton pendingText="Submitting…">Confirm RSVP</SubmitButton>
    </form>
  );
}
