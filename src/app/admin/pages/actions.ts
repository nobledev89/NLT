'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { slugify } from '@/lib/utils';
import { BLOCK_TYPES } from '@/lib/blocks/types';
import {
  type ActionResult,
  fail,
  succeed,
  zodFieldErrors,
} from '@/lib/form';
import type { PageRow } from '@/types/database';

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens');

const blockSchema = z.object({
  block_type: z.enum(BLOCK_TYPES),
  data: z.record(z.unknown()).default({}),
});

const pageMetaSchema = z.object({
  pageId: z.string().uuid(),
  title: z.string().trim().min(2, 'Enter a title').max(160),
  slug: slugSchema,
  status: z.enum(['draft', 'published']),
  seoTitle: z.string().trim().max(70).optional().or(z.literal('')),
  seoDescription: z.string().trim().max(180).optional().or(z.literal('')),
  ogImageUrl: z.string().url().optional().or(z.literal('')),
});

function revalidatePublic(slug: string) {
  // The home page is served from "/" while everything else lives at "/{slug}".
  if (slug === 'home') revalidatePath('/');
  revalidatePath('/' + slug);
}

export async function savePageAction(formData: FormData): Promise<ActionResult> {
  const user = await requireModule('pages');
  const supabase = await createClient();

  const parsedMeta = pageMetaSchema.safeParse({
    pageId: formData.get('pageId'),
    title: formData.get('title'),
    slug: formData.get('slug'),
    status: formData.get('status'),
    seoTitle: formData.get('seoTitle') ?? '',
    seoDescription: formData.get('seoDescription') ?? '',
    ogImageUrl: formData.get('ogImageUrl') ?? '',
  });
  if (!parsedMeta.success) {
    return fail('Please fix the errors below.', zodFieldErrors(parsedMeta.error));
  }
  const meta = parsedMeta.data;

  let blocksRaw: unknown;
  try {
    blocksRaw = JSON.parse((formData.get('blocks') as string) || '[]');
  } catch {
    return fail('Could not parse blocks payload.');
  }
  const parsedBlocks = z.array(blockSchema).safeParse(blocksRaw);
  if (!parsedBlocks.success) {
    return fail('One or more blocks are invalid.');
  }
  const blocks = parsedBlocks.data;

  const action = (formData.get('action') as string | null) ?? 'save';
  const publishing = action === 'publish';
  const unpublishing = action === 'unpublish';

  const status = publishing ? 'published' : unpublishing ? 'draft' : meta.status;

  // Load current page for published_at handling.
  const { data: current } = await supabase
    .from('pages')
    .select('published_at, slug')
    .eq('id', meta.pageId)
    .single();

  const patch: Partial<PageRow> = {
    title: meta.title,
    slug: meta.slug,
    status,
    seo_title: meta.seoTitle || null,
    seo_description: meta.seoDescription || null,
    og_image_url: meta.ogImageUrl || null,
    is_placeholder: false,
  };
  if (status === 'published' && !current?.published_at) {
    patch.published_at = new Date().toISOString();
  }

  const { error: pageErr } = await supabase.from('pages').update(patch).eq('id', meta.pageId);
  if (pageErr) return fail(pageErr.message);

  // Replace blocks: delete existing, insert the ordered set.
  const { error: delErr } = await supabase
    .from('page_blocks')
    .delete()
    .eq('page_id', meta.pageId);
  if (delErr) return fail(delErr.message);

  if (blocks.length > 0) {
    const { error: insErr } = await supabase.from('page_blocks').insert(
      blocks.map((b, i) => ({
        page_id: meta.pageId,
        block_type: b.block_type,
        position: i,
        data: b.data as never,
      }))
    );
    if (insErr) return fail(insErr.message);
  }

  // Snapshot a revision when publishing.
  if (publishing) {
    await supabase.from('page_revisions').insert({
      page_id: meta.pageId,
      title: meta.title,
      blocks: blocks as never,
      created_by: user.id,
    });
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: publishing ? 'page.publish' : 'page.save',
    entityType: 'page',
    entityId: meta.pageId,
    metadata: { slug: meta.slug, status, blocks: blocks.length },
  });

  revalidatePath('/admin/pages');
  revalidatePublic(meta.slug);
  if (current?.slug && current.slug !== meta.slug) revalidatePublic(current.slug);

  return succeed(
    publishing ? 'Page published.' : unpublishing ? 'Page unpublished.' : 'Page saved.',
    { data: { status } }
  );
}

export async function createPageAction(
  title: string,
  slug: string
): Promise<{ ok: boolean; message?: string; id?: string }> {
  const user = await requireModule('pages');
  const supabase = await createClient();

  const cleanTitle = title.trim();
  if (cleanTitle.length < 2) return { ok: false, message: 'Enter a title.' };
  const finalSlug = slugify(slug || title);
  const slugCheck = slugSchema.safeParse(finalSlug);
  if (!slugCheck.success) return { ok: false, message: 'Invalid slug.' };

  const { data: created, error } = await supabase
    .from('pages')
    .insert({
      title: cleanTitle,
      slug: finalSlug,
      status: 'draft',
      is_system: false,
      is_placeholder: false,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (error || !created) return { ok: false, message: error?.message ?? 'Could not create page.' };

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'page.create',
    entityType: 'page',
    entityId: created.id,
    metadata: { slug: finalSlug },
  });
  revalidatePath('/admin/pages');
  return { ok: true, id: created.id };
}

export async function setPageStatusAction(
  id: string,
  status: 'draft' | 'published'
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireModule('pages');
  const supabase = await createClient();

  const patch: Partial<PageRow> = { status };
  if (status === 'published') {
    const { data: existing } = await supabase
      .from('pages')
      .select('published_at')
      .eq('id', id)
      .single();
    if (!existing?.published_at) patch.published_at = new Date().toISOString();
  }

  const { data: page, error } = await supabase
    .from('pages')
    .update(patch)
    .eq('id', id)
    .select('slug')
    .single();
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'page.status',
    entityType: 'page',
    entityId: id,
    metadata: { status },
  });
  revalidatePath('/admin/pages');
  if (page?.slug) revalidatePublic(page.slug);
  return { ok: true };
}
