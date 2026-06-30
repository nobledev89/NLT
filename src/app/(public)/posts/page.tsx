import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { createClient } from '@/lib/supabase/server';
import { PageHero, EmptyState } from '@/components/site/page-hero';
import { PostCard } from '@/components/site/content-cards';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PostRow, PostCategoryRow } from '@/types/database';

export const revalidate = 60;
const PAGE_SIZE = 12;

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('posts');
  return loaded
    ? { ...pageMetadata(loaded.page), alternates: { canonical: '/posts' } }
    : { title: 'News & Stories' };
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const category = sp.category ?? '';
  const q = (sp.q ?? '').trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const [loaded, supabase] = await Promise.all([
    getPublishedPage('posts'),
    createClient(),
  ]);

  const nowIso = new Date().toISOString();

  // Resolve category + post ids if filtering by category.
  let postIdsForCategory: string[] | null = null;
  if (category) {
    const { data: cat } = await supabase
      .from('post_categories')
      .select('id')
      .eq('slug', category)
      .maybeSingle();
    if (cat) {
      const { data: assignments } = await supabase
        .from('post_category_assignments')
        .select('post_id')
        .eq('category_id', cat.id);
      postIdsForCategory = (assignments ?? []).map((a) => a.post_id);
    } else {
      postIdsForCategory = [];
    }
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .lte('published_at', nowIso)
    .is('deleted_at', null)
    .order('published_at', { ascending: false });

  if (postIdsForCategory != null) {
    query = query.in('id', postIdsForCategory.length ? postIdsForCategory : ['00000000-0000-0000-0000-000000000000']);
  }
  if (q) {
    query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`);
  }

  const { data, count } = await query.range(from, to);
  const posts = (data ?? []) as PostRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Featured post (only on first page, no filters).
  let featured: PostRow | null = null;
  if (page === 1 && !category && !q) {
    const { data: feat } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .eq('is_featured', true)
      .lte('published_at', nowIso)
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle<PostRow>();
    featured = feat ?? null;
  }
  const featuredId = featured?.id;
  const gridPosts = featured ? posts.filter((p) => p.id !== featuredId) : posts;

  // Categories for chips.
  const { data: cats } = await supabase
    .from('post_categories')
    .select('*')
    .order('name');
  const categories = (cats ?? []) as PostCategoryRow[];

  const buildHref = (next: Partial<{ category: string; q: string; page: number }>) => {
    const params = new URLSearchParams();
    const c = next.category ?? category;
    const query2 = next.q ?? q;
    const p = next.page ?? 1;
    if (c) params.set('category', c);
    if (query2) params.set('q', query2);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/posts?${qs}` : '/posts';
  };

  return (
    <>
      <PageHero
        eyebrow="From the church"
        title={loaded?.page.title ?? 'News & Stories'}
        subtitle={loaded?.page.seo_description ?? 'Updates, testimonies, and encouragement.'}
      />

      <section className="section">
        <div className="container space-y-8">
          {/* Search + categories */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <form action="/posts" method="get" className="flex max-w-sm gap-2">
              {category && <input type="hidden" name="category" value={category} />}
              <Input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search stories…"
                aria-label="Search posts"
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>

            {categories.length > 0 && (
              <nav aria-label="Post categories" className="flex flex-wrap gap-2">
                <Link
                  href={buildHref({ category: '', page: 1 })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    !category
                      ? 'border-foreground/40 text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  All
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={buildHref({ category: c.slug, page: 1 })}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      category === c.slug
                        ? 'border-foreground/40 text-foreground'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {featured && (
            <div>
              <PostCard post={featured} featured />
            </div>
          )}

          {gridPosts.length === 0 && !featured ? (
            <EmptyState
              title="Nothing here yet"
              description={q ? `No posts match "${q}".` : 'No stories have been published yet.'}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-between pt-4" aria-label="Pagination">
              {page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildHref({ page: page - 1 })}>Previous</Link>
                </Button>
              ) : (
                <span />
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildHref({ page: page + 1 })}>Next</Link>
                </Button>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </section>
    </>
  );
}
