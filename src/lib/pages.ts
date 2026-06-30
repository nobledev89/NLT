import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { PageRow, PageBlockRow } from '@/types/database';

export interface LoadedPage {
  page: PageRow;
  blocks: PageBlockRow[];
}

/**
 * Load a published page + its blocks by slug. Returns null if missing or not
 * published. RLS also enforces published-only for anon, so this is layered.
 */
export const getPublishedPage = cache(
  async (slug: string): Promise<LoadedPage | null> => {
    try {
      const supabase = await createClient();
      const { data: page } = await supabase
        .from('pages')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .is('deleted_at', null)
        .maybeSingle();

      if (!page) return null;

      const { data: blocks } = await supabase
        .from('page_blocks')
        .select('*')
        .eq('page_id', page.id)
        .order('position');

      return { page, blocks: blocks ?? [] };
    } catch {
      return null;
    }
  }
);

/** Build Next.js metadata from a page's SEO fields. */
export function pageMetadata(page: PageRow) {
  return {
    title: page.seo_title || page.title,
    description: page.seo_description || undefined,
    openGraph: {
      title: page.seo_title || page.title,
      description: page.seo_description || undefined,
      images: page.og_image_url ? [{ url: page.og_image_url }] : undefined,
    },
  };
}
