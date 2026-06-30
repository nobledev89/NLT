'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { slugify } from '@/lib/utils';
import {
  type ActionResult,
  fail,
  succeed,
  zodFieldErrors,
} from '@/lib/form';

const FIELD_TYPES = [
  'short_text',
  'long_text',
  'email',
  'phone',
  'select',
  'checkbox',
  'consent',
  'hidden',
] as const;

const slug = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens');

const fieldSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(160),
  field_key: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers, and underscores'),
  field_type: z.enum(FIELD_TYPES),
  placeholder: z.string().trim().max(200).optional().nullable(),
  help_text: z.string().trim().max(400).optional().nullable(),
  required: z.boolean().default(false),
  options: z.array(z.string()).default([]),
});

const formMetaSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(160),
  slug,
  intro: z.string().trim().max(2000).optional().or(z.literal('')),
  success_message: z.string().trim().max(2000).optional().or(z.literal('')),
  recipient_email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  store_submissions: z.boolean().default(true),
  enabled: z.boolean().default(true),
  position: z.coerce.number().int().min(0).default(0),
});

function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === 'on' || fd.get(key) === 'true';
}
function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v : '';
}

export async function saveFormAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('connection_forms');

  const id = str(formData, 'id');

  const meta = formMetaSchema.safeParse({
    title: str(formData, 'title'),
    slug: str(formData, 'slug'),
    intro: str(formData, 'intro'),
    success_message: str(formData, 'success_message'),
    recipient_email: str(formData, 'recipient_email'),
    store_submissions: bool(formData, 'store_submissions'),
    enabled: bool(formData, 'enabled'),
    position: str(formData, 'position') || 0,
  });
  if (!meta.success) {
    return fail('Please fix the errors below.', zodFieldErrors(meta.error));
  }

  // Fields arrive as a JSON array string under "fields".
  let rawFields: unknown;
  try {
    rawFields = JSON.parse(str(formData, 'fields') || '[]');
  } catch {
    return fail('Could not read the field definitions.');
  }
  const fieldsParsed = z.array(fieldSchema).safeParse(rawFields);
  if (!fieldsParsed.success) {
    return fail('One or more fields are invalid. Each field needs a label and a valid key.');
  }
  const fields = fieldsParsed.data;

  // Ensure unique field_key per form.
  const keys = new Set<string>();
  for (const f of fields) {
    if (keys.has(f.field_key)) {
      return fail(`Duplicate field key "${f.field_key}". Each field needs a unique key.`);
    }
    keys.add(f.field_key);
  }

  const v = meta.data;
  const supabase = await createClient();

  const row = {
    title: v.title,
    slug: v.slug,
    intro: v.intro || null,
    success_message: v.success_message || null,
    recipient_email: v.recipient_email || null,
    store_submissions: v.store_submissions,
    enabled: v.enabled,
    position: v.position,
  };

  let formId = id;
  if (id) {
    const { error } = await supabase.from('connection_forms').update(row).eq('id', id);
    if (error) return fail(error.message);
  } else {
    const { data, error } = await supabase
      .from('connection_forms')
      .insert(row)
      .select('id')
      .single();
    if (error) return fail(error.message);
    formId = data.id;
  }

  // Replace fields: delete existing, insert new ordered set.
  const { error: delErr } = await supabase
    .from('connection_form_fields')
    .delete()
    .eq('form_id', formId);
  if (delErr) return fail(delErr.message);

  if (fields.length > 0) {
    const inserts = fields.map((f, i) => ({
      form_id: formId,
      label: f.label,
      field_key: f.field_key,
      field_type: f.field_type,
      placeholder: f.placeholder || null,
      help_text: f.help_text || null,
      options: (f.field_type === 'select' ? f.options : []) as unknown as never,
      required: f.required,
      position: i,
    }));
    const { error: insErr } = await supabase
      .from('connection_form_fields')
      .insert(inserts);
    if (insErr) return fail(insErr.message);
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: id ? 'connection_form.update' : 'connection_form.create',
    entityType: 'connection_form',
    entityId: formId,
    metadata: { title: v.title, fieldCount: fields.length },
  });

  revalidatePath('/admin/forms');
  return succeed(id ? 'Form updated.' : 'Form created.', {
    redirectTo: '/admin/forms',
  });
}

export async function deleteFormAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('connection_forms');
  const id = str(formData, 'id');
  if (!id) return fail('Missing form id.');

  const supabase = await createClient();
  const { error } = await supabase.from('connection_forms').delete().eq('id', id);
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'connection_form.delete',
    entityType: 'connection_form',
    entityId: id,
  });

  revalidatePath('/admin/forms');
  return succeed('Form deleted.');
}

export async function toggleFormEnabledAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('connection_forms');
  const id = str(formData, 'id');
  if (!id) return fail('Missing form id.');
  const enabled = bool(formData, 'enabled');

  const supabase = await createClient();
  const { error } = await supabase
    .from('connection_forms')
    .update({ enabled })
    .eq('id', id);
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'connection_form.toggle_enabled',
    entityType: 'connection_form',
    entityId: id,
    metadata: { enabled },
  });

  revalidatePath('/admin/forms');
  return succeed(enabled ? 'Form enabled.' : 'Form disabled.');
}

export { slugify };
