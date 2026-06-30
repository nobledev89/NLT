'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import type { EventRow } from '@/types/database';
import { saveEventAction } from './actions';
import { initialActionState } from '@/lib/form';
import { slugify } from '@/lib/utils';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { ImageField } from '@/components/admin/image-field';

/** A Radix Switch that also posts its value via a hidden input. */
export function SwitchField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = React.useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2.5">
      <div>
        <Label htmlFor={name}>{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <input type="hidden" name={name} value={checked ? 'true' : 'false'} />
      <Switch id={name} checked={checked} onCheckedChange={setChecked} />
    </div>
  );
}

/** datetime-local value from an ISO string. */
function dtLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // local time, sliced to minutes
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function EventForm({ event }: { event?: EventRow }) {
  const router = useRouter();
  const [state, action] = useActionState(saveEventAction, initialActionState);
  const [slug, setSlug] = React.useState(event?.slug ?? '');
  const [slugTouched, setSlugTouched] = React.useState(!!event);
  const fe = state.fieldErrors ?? {};

  React.useEffect(() => {
    if (state.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  return (
    <form action={action} className="space-y-6">
      {event && <input type="hidden" name="id" value={event.id} />}
      <FormMessage ok={state.ok} message={state.message} />

      <Card>
        <CardContent className="space-y-4 py-6">
          <Field label="Title" htmlFor="title" required error={fe.title}>
            <Input
              id="title"
              name="title"
              defaultValue={event?.title}
              onChange={(e) => {
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
          </Field>
          <Field label="Slug" htmlFor="slug" required error={fe.slug} hint="Used in the public URL.">
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
            />
          </Field>
          <Field label="Description" error={fe.descriptionHtml}>
            <RichTextEditor name="descriptionHtml" defaultValue={event?.description_html ?? ''} placeholder="Describe the event…" />
          </Field>
          <ImageField name="coverImageUrl" label="Cover image" defaultValue={event?.cover_image_url ?? ''} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 py-6 sm:grid-cols-2">
          <Field label="Starts" htmlFor="startAt" required error={fe.startAt}>
            <Input id="startAt" name="startAt" type="datetime-local" defaultValue={dtLocal(event?.start_at)} required />
          </Field>
          <Field label="Ends" htmlFor="endAt" error={fe.endAt}>
            <Input id="endAt" name="endAt" type="datetime-local" defaultValue={dtLocal(event?.end_at)} />
          </Field>
          <Field label="Venue" htmlFor="venue" error={fe.venue}>
            <Input id="venue" name="venue" defaultValue={event?.venue ?? ''} />
          </Field>
          <Field label="Category" htmlFor="category" error={fe.category}>
            <Input id="category" name="category" defaultValue={event?.category ?? ''} />
          </Field>
          <Field label="Address" htmlFor="address" error={fe.address} className="sm:col-span-2">
            <Input id="address" name="address" defaultValue={event?.address ?? ''} />
          </Field>
          <Field label="Maps URL" htmlFor="mapsUrl" error={fe.mapsUrl}>
            <Input id="mapsUrl" name="mapsUrl" type="url" defaultValue={event?.maps_url ?? ''} placeholder="https://" />
          </Field>
          <Field label="Organizer" htmlFor="organizer" error={fe.organizer}>
            <Input id="organizer" name="organizer" defaultValue={event?.organizer ?? ''} />
          </Field>
          <Field label="Contact email" htmlFor="contactEmail" error={fe.contactEmail}>
            <Input id="contactEmail" name="contactEmail" type="email" defaultValue={event?.contact_email ?? ''} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 py-6 sm:grid-cols-2">
          <SwitchField name="rsvpEnabled" label="Enable RSVPs" defaultChecked={event?.rsvp_enabled ?? false} />
          <SwitchField name="guestRsvpAllowed" label="Allow guest (non-member) RSVPs" defaultChecked={event?.guest_rsvp_allowed ?? false} />
          <Field label="RSVP capacity" htmlFor="rsvpCapacity" error={fe.rsvpCapacity} hint="Leave blank for unlimited.">
            <Input id="rsvpCapacity" name="rsvpCapacity" type="number" min={1} defaultValue={event?.rsvp_capacity ?? ''} />
          </Field>
          <Field label="RSVP deadline" htmlFor="rsvpDeadline" error={fe.rsvpDeadline}>
            <Input id="rsvpDeadline" name="rsvpDeadline" type="datetime-local" defaultValue={dtLocal(event?.rsvp_deadline)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 py-6 sm:grid-cols-2">
          <SwitchField name="isPublic" label="Public" hint="Visible on the public site." defaultChecked={event?.is_public ?? true} />
          <SwitchField name="isFeatured" label="Featured" defaultChecked={event?.is_featured ?? false} />
          <Field label="Status" htmlFor="status" error={fe.status}>
            <Select name="status" defaultValue={event?.status ?? 'draft'}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <SubmitButton pendingText="Saving…">{event ? 'Save changes' : 'Create event'}</SubmitButton>
      </div>
    </form>
  );
}
