'use client';

import { useActionState } from 'react';
import { updateProfileAction } from '@/app/actions/auth';
import { initialActionState } from '@/lib/form';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface ProfileDefaults {
  fullName: string;
  phone: string;
  bio: string;
}

export function ProfileForm({ defaultValues }: { defaultValues: ProfileDefaults }) {
  const [state, action] = useActionState(updateProfileAction, initialActionState);

  return (
    <form action={action} className="space-y-4">
      <Field label="Full name" htmlFor="fullName" required error={state.fieldErrors?.fullName}>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          defaultValue={defaultValues.fullName}
        />
      </Field>

      <Field label="Phone" htmlFor="phone" error={state.fieldErrors?.phone}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={defaultValues.phone}
          placeholder="Optional"
        />
      </Field>

      <Field label="Bio" htmlFor="bio" error={state.fieldErrors?.bio}>
        <Textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={defaultValues.bio}
          placeholder="Tell us a little about yourself."
        />
      </Field>

      <FormMessage ok={state.ok} message={state.message} />

      <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}
