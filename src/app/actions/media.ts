'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireModule } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { slugify } from '@/lib/utils';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_BYTES = 10 * 1024 * 1024;

export interface MediaUploadResult {
  ok: boolean;
  message?: string;
  asset?: { id: string; url: string; file_name: string; alt_text: string | null };
}

/** Upload an image to the `media` bucket and record it in media_assets. */
export async function uploadMedia(formData: FormData): Promise<MediaUploadResult> {
  const user = await requireModule('media');
  const file = formData.get('file') as File | null;
  const altText = (formData.get('alt_text') as string | null)?.trim() || null;
  const caption = (formData.get('caption') as string | null)?.trim() || null;

  if (!file || file.size === 0) return { ok: false, message: 'No file provided.' };
  if (!ALLOWED.includes(file.type)) return { ok: false, message: 'Unsupported file type.' };
  if (file.size > MAX_BYTES) return { ok: false, message: 'File exceeds 10 MB.' };

  const supabase = await createClient();
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
  const path = `${new Date().getFullYear()}/${randomUUID()}-${base}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('media')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { ok: false, message: upErr.message };

  const { data: pub } = supabase.storage.from('media').getPublicUrl(path);

  const { data: asset, error: insErr } = await supabase
    .from('media_assets')
    .insert({
      bucket: 'media',
      path,
      url: pub.publicUrl,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text: altText,
      caption,
      uploaded_by: user.id,
    })
    .select('id, url, file_name, alt_text')
    .single();

  if (insErr || !asset) {
    await supabase.storage.from('media').remove([path]);
    return { ok: false, message: insErr?.message ?? 'Could not save asset.' };
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'media.upload',
    entityType: 'media_asset',
    entityId: asset.id,
    metadata: { file_name: file.name },
  });

  revalidatePath('/admin/media');
  return { ok: true, asset };
}

export async function updateMediaMeta(
  id: string,
  altText: string,
  caption: string
): Promise<{ ok: boolean; message?: string }> {
  await requireModule('media');
  const supabase = await createClient();
  const { error } = await supabase
    .from('media_assets')
    .update({ alt_text: altText || null, caption: caption || null })
    .eq('id', id);
  if (error) return { ok: false, message: error.message };
  revalidatePath('/admin/media');
  return { ok: true };
}

export async function deleteMedia(id: string): Promise<{ ok: boolean; message?: string }> {
  const user = await requireModule('media');
  const supabase = await createClient();
  const { data: asset } = await supabase
    .from('media_assets')
    .select('id, path, bucket')
    .eq('id', id)
    .single();
  if (!asset) return { ok: false, message: 'Not found.' };

  await supabase.storage.from(asset.bucket).remove([asset.path]);
  const { error } = await supabase.from('media_assets').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'media.delete',
    entityType: 'media_asset',
    entityId: id,
  });
  revalidatePath('/admin/media');
  return { ok: true };
}
