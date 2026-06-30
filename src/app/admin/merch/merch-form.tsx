'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { MerchItemRow } from '@/types/database';
import { saveMerchAction } from './actions';
import { initialActionState } from '@/lib/form';
import { slugify } from '@/lib/utils';
import { Field, FormMessage } from '@/components/forms/field';
import { SubmitButton } from '@/components/forms/submit-button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/admin/rich-text-editor';

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

interface ImageItem {
  url: string;
  alt: string;
}

function parseImages(images: unknown): ImageItem[] {
  if (!Array.isArray(images)) return [];
  return images
    .filter((g): g is Record<string, unknown> => !!g && typeof g === 'object')
    .map((g) => ({ url: String(g.url ?? ''), alt: String(g.alt ?? '') }))
    .filter((g) => g.url);
}

function ImagesEditor({ initial }: { initial: ImageItem[] }) {
  const [rows, setRows] = React.useState<ImageItem[]>(initial.length ? initial : []);
  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2">
          <Field label={i === 0 ? 'Image URL' : undefined} className="flex-1 min-w-[200px]">
            <Input
              name="image_url"
              value={row.url}
              placeholder="https://…"
              onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
            />
          </Field>
          <Field label={i === 0 ? 'Alt text' : undefined} className="flex-1 min-w-[160px]">
            <Input
              name="image_alt"
              value={row.alt}
              placeholder="Describe the image"
              onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
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

export function MerchForm({ item }: { item?: MerchItemRow }) {
  const router = useRouter();
  const [state, action] = useActionState(saveMerchAction, initialActionState);
  const [slug, setSlug] = React.useState(item?.slug ?? '');
  const [slugTouched, setSlugTouched] = React.useState(!!item);
  const fe = state.fieldErrors ?? {};

  React.useEffect(() => {
    if (state.ok && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  return (
    <form action={action} className="space-y-6">
      {item && <input type="hidden" name="id" value={item.id} />}
      <FormMessage ok={state.ok} message={state.message} />

      <Card>
        <CardContent className="space-y-4 py-6">
          <Field label="Title" htmlFor="title" required error={fe.title}>
            <Input
              id="title"
              name="title"
              defaultValue={item?.title}
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
          <Field label="Description" error={fe.descriptionHtml}>
            <RichTextEditor name="descriptionHtml" defaultValue={item?.description_html ?? ''} placeholder="Describe the item…" />
          </Field>
          <div>
            <Label className="mb-2 block">Images</Label>
            <ImagesEditor initial={parseImages(item?.images)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 py-6 sm:grid-cols-2">
          <Field label="Price display" htmlFor="priceDisplay" error={fe.priceDisplay} hint='Free text, e.g. "₱350" or "By donation".'>
            <Input id="priceDisplay" name="priceDisplay" defaultValue={item?.price_display ?? ''} />
          </Field>
          <Field label="Suggested donation" htmlFor="suggestedDonation" error={fe.suggestedDonation}>
            <Input id="suggestedDonation" name="suggestedDonation" type="number" min={0} step="0.01" defaultValue={item?.suggested_donation ?? ''} />
          </Field>
          <Field label="Category" htmlFor="category" error={fe.category}>
            <Input id="category" name="category" defaultValue={item?.category ?? ''} />
          </Field>
          <Field label="Availability label" htmlFor="availabilityLabel" error={fe.availabilityLabel} hint='e.g. "In stock", "Pre-order".'>
            <Input id="availabilityLabel" name="availabilityLabel" defaultValue={item?.availability_label ?? ''} />
          </Field>
          <Field label="External URL" htmlFor="externalUrl" error={fe.externalUrl}>
            <Input id="externalUrl" name="externalUrl" type="url" defaultValue={item?.external_url ?? ''} placeholder="https://" />
          </Field>
          <Field label="Position" htmlFor="position" error={fe.position} hint="Lower numbers appear first.">
            <Input id="position" name="position" type="number" defaultValue={item?.position ?? 0} />
          </Field>
          <SwitchField name="contactToOrder" label="Contact to order" hint="Show a contact prompt instead of checkout." defaultChecked={item?.contact_to_order ?? true} />
          <Field label="Status" htmlFor="status" error={fe.status}>
            <Select name="status" defaultValue={item?.status ?? 'draft'}>
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

      <SubmitButton pendingText="Saving…">{item ? 'Save changes' : 'Create item'}</SubmitButton>
    </form>
  );
}
