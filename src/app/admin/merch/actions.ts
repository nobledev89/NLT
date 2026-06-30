'use server';

import { revalidatePath } from 'next/cache';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { merchInputSchema } from '@/lib/validations';
import {
  type ActionResult,
  fail,
  succeed,
  zodFieldErrors,
} from '@/lib/form';
import type { Json } from '@/types/database';

function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === 'on' || fd.get(key) === 'true';
}
function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v : '';
}

function parseImages(fd: FormData): Json {
  const urls = fd.getAll('image_url').map((v) => String(v).trim());
  const alts = fd.getAll('image_alt').map((v) => String(v).trim());
  const out: { url: string; alt: string }[] = [];
  urls.forEach((url, i) => {
    if (url) out.push({ url, alt: alts[i] ?? '' });
  });
  return out as unknown as Json;
}

export async function saveMerchAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('merch');
  const id = str(formData, 'id');

  const parsed = merchInputSchema.safeParse({
    title: str(formData, 'title'),
    slug: str(formData, 'slug'),
    descriptionHtml: str(formData, 'descriptionHtml'),
    priceDisplay: str(formData, 'priceDisplay'),
    suggestedDonation: str(formData, 'suggestedDonation') || null,
    category: str(formData, 'category'),
    availabilityLabel: str(formData, 'availabilityLabel'),
    externalUrl: str(formData, 'externalUrl'),
    contactToOrder: bool(formData, 'contactToOrder'),
    status: str(formData, 'status') || 'draft',
  });

  if (!parsed.success) {
    return fail('Please fix the errors below.', zodFieldErrors(parsed.error));
  }
  const v = parsed.data;
  const positionRaw = str(formData, 'position');
  const position = positionRaw ? Number(positionRaw) : 0;

  const supabase = await createClient();
  const row = {
    title: v.title,
    slug: v.slug,
    description_html: v.descriptionHtml || null,
    price_display: v.priceDisplay || null,
    suggested_donation: v.suggestedDonation ?? null,
    category: v.category || null,
    availability_label: v.availabilityLabel || null,
    external_url: v.externalUrl || null,
    contact_to_order: v.contactToOrder,
    images: parseImages(formData),
    status: v.status,
    position: Number.isFinite(position) ? position : 0,
  };

  let entityId = id;
  if (id) {
    const { error } = await supabase.from('merch_items').update(row).eq('id', id);
    if (error) return fail(error.message);
  } else {
    const { data, error } = await supabase
      .from('merch_items')
      .insert(row)
      .select('id')
      .single();
    if (error) return fail(error.message);
    entityId = data.id;
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: id ? 'merch.update' : 'merch.create',
    entityType: 'merch_item',
    entityId,
  });

  revalidatePath('/admin/merch');
  return succeed(id ? 'Item updated.' : 'Item created.', {
    redirectTo: '/admin/merch',
  });
}

export async function deleteMerchAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('merch');
  const id = str(formData, 'id');
  if (!id) return fail('Missing id.');

  const supabase = await createClient();
  const { error } = await supabase.from('merch_items').delete().eq('id', id);
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'merch.delete',
    entityType: 'merch_item',
    entityId: id,
  });

  revalidatePath('/admin/merch');
  return succeed('Item deleted.');
}

export async function toggleMerchStatusAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('merch');
  const id = str(formData, 'id');
  const status = str(formData, 'status') === 'published' ? 'published' : 'draft';
  if (!id) return fail('Missing id.');

  const supabase = await createClient();
  const { error } = await supabase.from('merch_items').update({ status }).eq('id', id);
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'merch.toggle_status',
    entityType: 'merch_item',
    entityId: id,
  });

  revalidatePath('/admin/merch');
  return succeed(status === 'published' ? 'Published.' : 'Unpublished.');
}
