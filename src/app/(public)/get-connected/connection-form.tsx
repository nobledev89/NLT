'use client';

import { useActionState } from 'react';
import { submitConnectionFormAction } from '@/app/actions/public-forms';
import { initialActionState } from '@/lib/form';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { ConnectionFormFieldRow, ConnectionFormRow, Json } from '@/types/database';

function optionsFromJson(options: Json): string[] {
  return Array.isArray(options) ? options.filter((o): o is string => typeof o === 'string') : [];
}

export function ConnectionForm({
  form,
  fields,
}: {
  form: ConnectionFormRow;
  fields: ConnectionFormFieldRow[];
}) {
  const [state, formAction] = useActionState(submitConnectionFormAction, initialActionState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border bg-card/60 p-5">
      <input type="hidden" name="formId" value={form.id} />
      <input className="hidden" name="website" tabIndex={-1} autoComplete="off" />
      <div>
        <h2 className="text-xl font-semibold">{form.title}</h2>
        {form.intro && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{form.intro}</p>}
      </div>
      {state.message && <FormMessage ok={state.ok} message={state.message} />}

      {fields.map((field) => {
        if (field.field_type === 'hidden') {
          return <input key={field.id} type="hidden" name={field.field_key} />;
        }

        if (field.field_type === 'long_text') {
          return (
            <Field key={field.id} label={field.label} error={errors[field.field_key]} hint={field.help_text ?? undefined} required={field.required}>
              <Textarea name={field.field_key} placeholder={field.placeholder ?? undefined} rows={4} />
            </Field>
          );
        }

        if (field.field_type === 'select') {
          const options = optionsFromJson(field.options);
          return (
            <Field key={field.id} label={field.label} error={errors[field.field_key]} hint={field.help_text ?? undefined} required={field.required}>
              <select
                name={field.field_key}
                className="flex h-10 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                defaultValue=""
              >
                <option value="" disabled>{field.placeholder || 'Select an option'}</option>
                {options.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>
          );
        }

        if (field.field_type === 'checkbox' || field.field_type === 'consent') {
          return (
            <Field key={field.id} error={errors[field.field_key]} hint={field.help_text ?? undefined}>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox name={field.field_key} />
                <span>
                  {field.label}
                  {(field.required || field.field_type === 'consent') && <span className="ml-0.5 text-gold">*</span>}
                </span>
              </label>
            </Field>
          );
        }

        const type = field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text';
        return (
          <Field key={field.id} label={field.label} error={errors[field.field_key]} hint={field.help_text ?? undefined} required={field.required}>
            <Input name={field.field_key} type={type} placeholder={field.placeholder ?? undefined} />
          </Field>
        );
      })}

      <SubmitButton pendingText="Sending...">Send</SubmitButton>
    </form>
  );
}
