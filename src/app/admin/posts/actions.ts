'use server';

import { revalidatePath } from 'next/cache';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { postInputSchema } from '@/lib/validations';
import { slugify } from '@/lib/utils';
import {
  type ActionResult,
  fail,
  succeed,
  zodFieldErrors,
} from '@/lib/form';
import { z } from 'zod';
import type { PostRow } from '@/types/database';

function bool(formData: FormData, key: string): boolean {
  const v = formData.get(key);
  return v === 'true' || v === 'on' || v === '1';
}

export async function savePostAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('posts');
  const supabase = await createClient();

  const id = (formData.get('id') as string | null)?.trim() || null;

  const parsed = postInputSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt') ?? '',
    contentHtml: formData.get('contentHtml') ?? '',
    featuredImageUrl: formData.get('featuredImageUrl') ?? '',
    status: formData.get('status'),
    commentsEnabled: bool(formData, 'commentsEnabled'),
    isFeatured: bool(formData, 'isFeatured'),
    scheduledFor: formData.get('scheduledFor') ?? '',
    categoryIds: formData.getAll('categoryIds').map(String).filter(Boolean),
    seoTitle: formData.get('seoTitle') ?? '',
    seoDescription: formData.get('seoDescription') ?? '',
  });

  if (!parsed.success) {
    return fail('Please fix the errors below.', zodFieldErrors(parsed.error));
  }
  const input = parsed.data;

  if (input.status === 'scheduled' && !input.scheduledFor) {
    return fail('Pick a date to schedule this post.', {
      scheduledFor: 'Required when scheduling.',
    });
  }

  const nowIso = new Date().toISOString();

  // Determine published_at. Set it when the post becomes published and has none.
  let publishedAt: string | null | undefined;
  if (input.status === 'published') {
    if (id) {
      const { data: existing } = await supabase
        .from('posts')
        .select('published_at')
        .eq('id', id)
        .single();
      publishedAt = existing?.published_at ?? nowIso;
    } else {
      publishedAt = nowIso;
    }
  }

  const row = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt || null,
    content_html: input.contentHtml ?? '',
    featured_image_url: input.featuredImageUrl || null,
    status: input.status,
    comments_enabled: input.commentsEnabled,
    is_featured: input.isFeatured,
    scheduled_for: input.status === 'scheduled' ? input.scheduledFor || null : null,
    seo_title: input.seoTitle || null,
    seo_description: input.seoDescription || null,
    is_placeholder: false,
    ...(publishedAt !== undefined ? { published_at: publishedAt } : {}),
  };

  let postId = id;

  if (id) {
    const { error } = await supabase.from('posts').update(row).eq('id', id);
    if (error) return fail(error.message);
  } else {
    const { data: created, error } = await supabase
      .from('posts')
      .insert({ ...row, author_id: user.id })
      .select('id')
      .single();
    if (error || !created) return fail(error?.message ?? 'Could not create post.');
    postId = created.id;
  }

  if (!postId) return fail('Could not resolve post id.');

  // Replace category assignments.
  await supabase.from('post_category_assignments').delete().eq('post_id', postId);
  if (input.categoryIds.length > 0) {
    const { error: catErr } = await supabase
      .from('post_category_assignments')
      .insert(input.categoryIds.map((category_id) => ({ post_id: postId!, category_id })));
    if (catErr) return fail(catErr.message);
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: id ? 'post.update' : 'post.create',
    entityType: 'post',
    entityId: postId,
    metadata: { title: input.title, status: input.status },
  });

  revalidatePath('/admin/posts');
  revalidatePath('/blog');
  revalidatePath(`/blog/${input.slug}`);

  return succeed(id ? 'Post saved.' : 'Post created.', { redirectTo: '/admin/posts' });
}

export async function deletePostAction(id: string): Promise<{ ok: boolean; message?: string }> {
  const user = await requireModule('posts');
  const supabase = await createClient();
  const { error } = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'post.delete',
    entityType: 'post',
    entityId: id,
  });
  revalidatePath('/admin/posts');
  return { ok: true };
}

export async function togglePostStatusAction(
  id: string,
  status: 'draft' | 'scheduled' | 'published' | 'archived'
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireModule('posts');
  const supabase = await createClient();

  const patch: Partial<PostRow> = { status };
  if (status === 'published') {
    const { data: existing } = await supabase
      .from('posts')
      .select('published_at')
      .eq('id', id)
      .single();
    if (!existing?.published_at) patch.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from('posts').update(patch).eq('id', id);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'post.status',
    entityType: 'post',
    entityId: id,
    metadata: { status },
  });
  revalidatePath('/admin/posts');
  return { ok: true };
}

// ----- categories ----------------------------------------------------

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Enter a name').max(80),
});

export async function saveCategoryAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('posts');
  const supabase = await createClient();

  const parsed = categorySchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    return fail('Please fix the errors below.', zodFieldErrors(parsed.error));
  }
  const name = parsed.data.name;
  const slug = slugify(name);
  if (!slug) return fail('Could not derive a slug from that name.', { name: 'Invalid name.' });

  const { data: created, error } = await supabase
    .from('post_categories')
    .insert({ name, slug })
    .select('id')
    .single();
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'post_category.create',
    entityType: 'post_category',
    entityId: created?.id,
    metadata: { name, slug },
  });
  revalidatePath('/admin/posts/categories');
  return succeed('Category added.');
}

export async function deleteCategoryAction(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireModule('posts');
  const supabase = await createClient();
  const { error } = await supabase.from('post_categories').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'post_category.delete',
    entityType: 'post_category',
    entityId: id,
  });
  revalidatePath('/admin/posts/categories');
  return { ok: true };
}
