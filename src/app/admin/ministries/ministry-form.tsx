'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { MinistryRow } from '@/types/database';
import { saveMinistryAction } from './actions';
import { initialActionState } from '@/lib/form';
import { slugify } from '@/lib/utils';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { ImageField } from '@/components/admin/image-field';

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

interface GalleryItem {
  url: string;
  alt: string;
}

function parseGallery(gallery: unknown): GalleryItem[] {
  if (!Array.isArray(gallery)) return [];
  return gallery
    .filter((g): g is Record<string, unknown> => !!g && typeof g === 'object')
    .map((g) => ({ url: String(g.url ?? ''), alt: String(g.alt ?? '') }))
    .filter((g) => g.url);
}

function GalleryEditor({ initial }: { initial: GalleryItem[] }) {
  const [rows, setRows] = React.useState<GalleryItem[]>(initial);

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2">
          <Field label={i === 0 ? 'Image URL' : undefined} className="flex-1 min-w-[200px]">
            <Input
              name="gallery_url"
              value={row.url}
              placeholder="https://…"
              onChange={(e) =>
                setRows((r) => r.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
              }
            />
          </Field>
          <Field label={i === 0 ? 'Alt text' : undefined} className="flex-1 min-w-[160px]">
            <Input
              name="gallery_alt"
              value={row.alt}
              placeholder="Describe the image"
              onChange={(e) =>
                setRows((r) => r.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))
              }
            />
          </Field>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-red-400"
            onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setRows((r) => [...r, { url: '', alt: '' }])}>
        <Plus className="h-4 w-4" /> Add image
      </Button>
    </div>
  );
}

export function MinistryForm({ ministry }: { ministry?: MinistryRow }) {
  const router = useRouter();
  const [state, action] = useActionState(saveMinistryAction, initialActionState);
  const [slug, setSlug] = React.useState(ministry?.slug ?? '');
  const [slugTouched, setSlugTouched] = React.useState(!!ministry);
  const fe = state.fieldErrors ?? {};

  React.useEffect(() => {
    if (state.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  return (
    <form action={action} className="space-y-6">
      {ministry && <input type="hidden" name="id" value={ministry.id} />}
      <FormMessage ok={state.ok} message={state.message} />

      <Card>
        <CardContent className="space-y-4 py-6">
          <Field label="Name" htmlFor="name" required error={fe.name}>
            <Input
              id="name"
              name="name"
              defaultValue={ministry?.name}
              onChange={(e) => {
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              required
            />
          </Field>
          <Field label="Slug" htmlFor="slug" required error={fe.slug}>
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
          <Field label="Short description" htmlFor="shortDescription" error={fe.shortDescription}>
            <Textarea id="shortDescription" name="shortDescription" defaultValue={ministry?.short_description ?? ''} rows={2} />
          </Field>
          <Field label="Full description" error={fe.longDescriptionHtml}>
            <RichTextEditor name="longDescriptionHtml" defaultValue={ministry?.long_description_html ?? ''} placeholder="Tell people about this ministry…" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 py-6">
          <ImageField name="imageUrl" label="Main image" defaultValue={ministry?.image_url ?? ''} />
          <div>
            <Label className="mb-2 block">Gallery</Label>
            <GalleryEditor initial={parseGallery(ministry?.gallery)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 py-6 sm:grid-cols-2">
          <Field label="Leader name" htmlFor="leaderName" error={fe.leaderName}>
            <Input id="leaderName" name="leaderName" defaultValue={ministry?.leader_name ?? ''} />
          </Field>
          <Field label="Leader contact" htmlFor="leaderContact" error={fe.leaderContact}>
            <Input id="leaderContact" name="leaderContact" defaultValue={ministry?.leader_contact ?? ''} />
          </Field>
          <Field label="Meeting schedule" htmlFor="meetingSchedule" error={fe.meetingSchedule}>
            <Input id="meetingSchedule" name="meetingSchedule" defaultValue={ministry?.meeting_schedule ?? ''} />
          </Field>
          <Field label="Location" htmlFor="location" error={fe.location}>
            <Input id="location" name="location" defaultValue={ministry?.location ?? ''} />
          </Field>
          <Field label="External URL" htmlFor="externalUrl" error={fe.externalUrl}>
            <Input id="externalUrl" name="externalUrl" type="url" defaultValue={ministry?.external_url ?? ''} placeholder="https://" />
          </Field>
          <Field label="Position" htmlFor="position" error={fe.position} hint="Lower numbers appear first.">
            <Input id="position" name="position" type="number" defaultValue={ministry?.position ?? 0} />
          </Field>
          <SwitchField name="published" label="Published" defaultChecked={ministry?.published ?? true} />
        </CardContent>
      </Card>

      <SubmitButton pendingText="Saving…">{ministry ? 'Save changes' : 'Create ministry'}</SubmitButton>
    </form>
  );
}
