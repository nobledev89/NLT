'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitPledgeAction } from '@/app/actions/public-forms';
import { initialActionState } from '@/lib/form';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface CampaignOption {
  id: string;
  title: string;
}

export function PledgeForm({ campaigns }: { campaigns: CampaignOption[] }) {
  const [state, action] = useActionState(submitPledgeAction, initialActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state.ok, state.redirectTo, router]);

  return (
    <form action={action} className="space-y-4">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px]"
        aria-hidden
      />

      <FormMessage ok={state.ok} message={state.message} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name" required error={state.fieldErrors?.name}>
          <Input id="name" name="name" autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" htmlFor="phone" hint="Optional" error={state.fieldErrors?.phone}>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        </Field>
        <Field label="Amount (PHP)" htmlFor="amount" required error={state.fieldErrors?.amount}>
          <Input id="amount" name="amount" type="number" min={1} step="1" required />
        </Field>
      </div>

      {campaigns.length > 0 && (
        <Field label="Campaign" htmlFor="campaignId" hint="Optional — choose a fund" error={state.fieldErrors?.campaignId}>
          <select
            id="campaignId"
            name="campaignId"
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">General fund</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field
        label="Reference number"
        htmlFor="referenceNumber"
        hint="If you've already transferred, enter your bank reference so we can match it."
        error={state.fieldErrors?.referenceNumber}
      >
        <Input id="referenceNumber" name="referenceNumber" />
      </Field>

      <Field label="Notes" htmlFor="notes" hint="Optional" error={state.fieldErrors?.notes}>
        <Textarea id="notes" name="notes" placeholder="Anything we should know?" />
      </Field>

      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        <span>
          I consent to New Life Tagum storing these details to record and follow up on my pledge,
          in line with the privacy notice.
        </span>
      </label>
      {state.fieldErrors?.consent && (
        <p className="text-xs text-red-400">{state.fieldErrors.consent}</p>
      )}

      <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        Payments are never automatically verified. Please keep your reference number; our team
        will follow up to confirm your gift.
      </p>

      <SubmitButton pendingText="Submitting…" size="lg">
        Submit pledge
      </SubmitButton>
    </form>
  );
}
