'use server';

import { revalidatePath } from 'next/cache';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { ministryInputSchema } from '@/lib/validations';
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

/** Parse repeatable gallery rows: gallery_url[] + gallery_alt[]. */
function parseGallery(fd: FormData): Json {
  const urls = fd.getAll('gallery_url').map((v) => String(v).trim());
  const alts = fd.getAll('gallery_alt').map((v) => String(v).trim());
  const out: { url: string; alt: string }[] = [];
  urls.forEach((url, i) => {
    if (url) out.push({ url, alt: alts[i] ?? '' });
  });
  return out as unknown as Json;
}

export async function saveMinistryAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('ministries');
  const id = str(formData, 'id');

  const parsed = ministryInputSchema.safeParse({
    name: str(formData, 'name'),
    slug: str(formData, 'slug'),
    shortDescription: str(formData, 'shortDescription'),
    longDescriptionHtml: str(formData, 'longDescriptionHtml'),
    imageUrl: str(formData, 'imageUrl'),
    leaderName: str(formData, 'leaderName'),
    leaderContact: str(formData, 'leaderContact'),
    meetingSchedule: str(formData, 'meetingSchedule'),
    location: str(formData, 'location'),
    externalUrl: str(formData, 'externalUrl'),
    published: bool(formData, 'published'),
  });

  if (!parsed.success) {
    return fail('Please fix the errors below.', zodFieldErrors(parsed.error));
  }
  const v = parsed.data;
  const positionRaw = str(formData, 'position');
  const position = positionRaw ? Number(positionRaw) : 0;

  const supabase = await createClient();
  const row = {
    name: v.name,
    slug: v.slug,
    short_description: v.shortDescription || null,
    long_description_html: v.longDescriptionHtml || null,
    image_url: v.imageUrl || null,
    leader_name: v.leaderName || null,
    leader_contact: v.leaderContact || null,
    meeting_schedule: v.meetingSchedule || null,
    location: v.location || null,
    external_url: v.externalUrl || null,
    gallery: parseGallery(formData),
    published: v.published,
    position: Number.isFinite(position) ? position : 0,
  };

  let entityId = id;
  if (id) {
    const { error } = await supabase.from('ministries').update(row).eq('id', id);
    if (error) return fail(error.message);
  } else {
    const { data, error } = await supabase
      .from('ministries')
      .insert(row)
      .select('id')
      .single();
    if (error) return fail(error.message);
    entityId = data.id;
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: id ? 'ministry.update' : 'ministry.create',
    entityType: 'ministry',
    entityId,
  });

  revalidatePath('/admin/ministries');
  return succeed(id ? 'Ministry updated.' : 'Ministry created.', {
    redirectTo: '/admin/ministries',
  });
}

export async function deleteMinistryAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('ministries');
  const id = str(formData, 'id');
  if (!id) return fail('Missing id.');

  const supabase = await createClient();
  const { error } = await supabase.from('ministries').delete().eq('id', id);
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'ministry.delete',
    entityType: 'ministry',
    entityId: id,
  });

  revalidatePath('/admin/ministries');
  return succeed('Ministry deleted.');
}

export async function toggleMinistryPublishedAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('ministries');
  const id = str(formData, 'id');
  const published = bool(formData, 'published');
  if (!id) return fail('Missing id.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('ministries')
    .update({ published })
    .eq('id', id);
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'ministry.toggle_published',
    entityType: 'ministry',
    entityId: id,
  });

  revalidatePath('/admin/ministries');
  return succeed(published ? 'Published.' : 'Unpublished.');
}
