'use server';

import { revalidatePath } from 'next/cache';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { eventInputSchema } from '@/lib/validations';
import {
  type ActionResult,
  fail,
  succeed,
  zodFieldErrors,
} from '@/lib/form';

function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === 'on' || fd.get(key) === 'true';
}

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v : '';
}

/** Insert or update an event. Hidden `id` controls which. */
export async function saveEventAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('events');

  const id = str(formData, 'id');

  const parsed = eventInputSchema.safeParse({
    title: str(formData, 'title'),
    slug: str(formData, 'slug'),
    descriptionHtml: str(formData, 'descriptionHtml'),
    coverImageUrl: str(formData, 'coverImageUrl'),
    startAt: str(formData, 'startAt'),
    endAt: str(formData, 'endAt'),
    venue: str(formData, 'venue'),
    address: str(formData, 'address'),
    mapsUrl: str(formData, 'mapsUrl'),
    organizer: str(formData, 'organizer'),
    contactEmail: str(formData, 'contactEmail'),
    isPublic: bool(formData, 'isPublic'),
    rsvpEnabled: bool(formData, 'rsvpEnabled'),
    guestRsvpAllowed: bool(formData, 'guestRsvpAllowed'),
    rsvpCapacity: str(formData, 'rsvpCapacity') || null,
    rsvpDeadline: str(formData, 'rsvpDeadline'),
    category: str(formData, 'category'),
    isFeatured: bool(formData, 'isFeatured'),
    status: str(formData, 'status') || 'draft',
  });

  if (!parsed.success) {
    return fail('Please fix the errors below.', zodFieldErrors(parsed.error));
  }
  const v = parsed.data;

  const supabase = await createClient();

  const toIso = (s: string) => (s ? new Date(s).toISOString() : null);

  const row = {
    title: v.title,
    slug: v.slug,
    description_html: v.descriptionHtml || null,
    cover_image_url: v.coverImageUrl || null,
    start_at: new Date(v.startAt).toISOString(),
    end_at: toIso(v.endAt ?? ''),
    venue: v.venue || null,
    address: v.address || null,
    maps_url: v.mapsUrl || null,
    organizer: v.organizer || null,
    contact_email: v.contactEmail || null,
    is_public: v.isPublic,
    rsvp_enabled: v.rsvpEnabled,
    guest_rsvp_allowed: v.guestRsvpAllowed,
    rsvp_capacity: v.rsvpCapacity ?? null,
    rsvp_deadline: toIso(v.rsvpDeadline ?? ''),
    category: v.category || null,
    is_featured: v.isFeatured,
    status: v.status,
    deleted_at: null as string | null,
  };

  let entityId = id;
  if (id) {
    const { error } = await supabase.from('events').update(row).eq('id', id);
    if (error) return fail(error.message);
  } else {
    const { data, error } = await supabase
      .from('events')
      .insert({ ...row, created_by: user.id })
      .select('id')
      .single();
    if (error) return fail(error.message);
    entityId = data.id;
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: id ? 'event.update' : 'event.create',
    entityType: 'event',
    entityId,
  });

  revalidatePath('/admin/events');
  return succeed(id ? 'Event updated.' : 'Event created.', {
    redirectTo: '/admin/events',
  });
}

export async function deleteEventAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('events');
  const id = str(formData, 'id');
  if (!id) return fail('Missing event id.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'event.delete',
    entityType: 'event',
    entityId: id,
  });

  revalidatePath('/admin/events');
  return succeed('Event deleted.');
}

export async function closeRsvpsAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('events');
  const id = str(formData, 'id');
  if (!id) return fail('Missing event id.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('events')
    .update({ rsvp_enabled: false })
    .eq('id', id);
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'event.close_rsvps',
    entityType: 'event',
    entityId: id,
  });

  revalidatePath('/admin/events');
  return succeed('RSVPs closed.');
}
