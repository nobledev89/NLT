'use client';

import { useActionState } from 'react';
import { signUpAction } from '@/app/actions/auth';
import { initialActionState } from '@/lib/form';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';

export function RegisterForm() {
  const [state, action] = useActionState(signUpAction, initialActionState);

  // On success the action returns a verify-email message; keep the message
  // visible and clear the form by hiding the fields.
  if (state.ok) {
    return <FormMessage ok message={state.message} />;
  }

  return (
    <form action={action} className="space-y-4">
      <Field label="Full name" htmlFor="fullName" required error={state.fieldErrors?.fullName}>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          placeholder="Juan dela Cruz"
        />
      </Field>

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

      <Field
        label="Password"
        htmlFor="password"
        required
        hint="At least 8 characters."
        error={state.fieldErrors?.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <FormMessage ok={state.ok} message={state.message} />

      <SubmitButton className="w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
