import type { MetadataRoute } from 'next';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { absoluteUrl } from '@/lib/utils';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    '',
    '/who-we-are',
    '/mission-vision',
    '/services',
    '/events',
    '/ministries',
    '/posts',
    '/pledge',
    '/get-connected',
    '/merch',
    '/privacy',
    '/terms',
  ];

  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: absoluteUrl(p || '/'),
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: p === '' ? 1 : 0.7,
  }));

  try {
    const supabase = createServiceRoleClient();
    const [posts, events, ministries, merch] = await Promise.all([
      supabase.from('posts').select('slug, updated_at').eq('status', 'published').is('deleted_at', null),
      supabase.from('events').select('slug, updated_at').eq('status', 'published').eq('is_public', true).is('deleted_at', null),
      supabase.from('ministries').select('slug, updated_at').eq('published', true),
      supabase.from('merch_items').select('slug, updated_at').eq('status', 'published'),
    ]);

    const push = (rows: { slug: string; updated_at: string }[] | null, prefix: string) => {
      for (const r of rows ?? []) {
        entries.push({
          url: absoluteUrl(`${prefix}/${r.slug}`),
          lastModified: new Date(r.updated_at),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    };
    push(posts.data, '/posts');
    push(events.data, '/events');
    push(ministries.data, '/ministries');
    push(merch.data, '/merch');
  } catch {
    // If the DB isn't reachable at build time, return static entries only.
  }

  return entries;
}
