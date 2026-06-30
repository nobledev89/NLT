'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import type { PledgeCampaignRow } from '@/types/database';
import { saveCampaignAction } from './actions';
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
function SwitchField({
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

export function CampaignForm({ campaign }: { campaign?: PledgeCampaignRow }) {
  const router = useRouter();
  const [state, action] = useActionState(saveCampaignAction, initialActionState);
  const [slug, setSlug] = React.useState(campaign?.slug ?? '');
  const [slugTouched, setSlugTouched] = React.useState(!!campaign);
  const fe = state.fieldErrors ?? {};

  React.useEffect(() => {
    if (state.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  return (
    <form action={action} className="space-y-6">
      {campaign && <input type="hidden" name="id" value={campaign.id} />}
      <FormMessage ok={state.ok} message={state.message} />

      <Card>
        <CardContent className="space-y-4 py-6">
          <Field label="Title" htmlFor="title" required error={fe.title}>
            <Input
              id="title"
              name="title"
              defaultValue={campaign?.title}
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
            <RichTextEditor
              name="descriptionHtml"
              defaultValue={campaign?.description_html ?? ''}
              placeholder="Describe the campaign…"
            />
          </Field>
          <ImageField name="coverImageUrl" label="Cover image" defaultValue={campaign?.cover_image_url ?? ''} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 py-6 sm:grid-cols-2">
          <Field label="Goal amount (PHP)" htmlFor="goalAmount" error={fe.goalAmount} hint="Leave blank for no target.">
            <Input
              id="goalAmount"
              name="goalAmount"
              type="number"
              min={0}
              step="1"
              defaultValue={campaign?.goal_amount ?? ''}
            />
          </Field>
          <Field label="Position" htmlFor="position" hint="Lower numbers show first.">
            <Input id="position" name="position" type="number" min={0} defaultValue={campaign?.position ?? 0} />
          </Field>
          <Field label="Start date" htmlFor="startDate" error={fe.startDate}>
            <Input id="startDate" name="startDate" type="date" defaultValue={campaign?.start_date ?? ''} />
          </Field>
          <Field label="End date" htmlFor="endDate" error={fe.endDate}>
            <Input id="endDate" name="endDate" type="date" defaultValue={campaign?.end_date ?? ''} />
          </Field>
          <Field label="Status" htmlFor="status" error={fe.status}>
            <Select name="status" defaultValue={campaign?.status ?? 'upcoming'}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <SwitchField name="isFeatured" label="Featured" defaultChecked={campaign?.is_featured ?? false} />
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <SubmitButton pendingText="Saving…">{campaign ? 'Save changes' : 'Create campaign'}</SubmitButton>
      </div>
    </form>
  );
}
