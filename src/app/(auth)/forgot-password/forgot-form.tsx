'use client';

import { useActionState } from 'react';
import { requestPasswordResetAction } from '@/app/actions/auth';
import { initialActionState } from '@/lib/form';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordResetAction, initialActionState);

  return (
    <form action={action} className="space-y-4">
      <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
      </Field>

      <FormMessage ok={state.ok} message={state.message} />

      <SubmitButton className="w-full" pendingText="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
