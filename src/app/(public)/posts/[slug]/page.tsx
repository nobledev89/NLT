import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { RichText } from '@/components/blocks/rich-text';
import { PostCard } from '@/components/site/content-cards';
import { Badge } from '@/components/ui/badge';
import { formatDate, absoluteUrl } from '@/lib/utils';
import { CommentSection, type DisplayComment } from './comment-section';
import type { PostRow, PostCategoryRow } from '@/types/database';

export const revalidate = 60;

async function loadPost(slug: string): Promise<PostRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .is('deleted_at', null)
    .maybeSingle<PostRow>();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: 'Post not found' };
  const description =
    post.seo_description ||
    post.excerpt ||
    post.content_html.replace(/<[^>]+>/g, '').slice(0, 180);
  const image = post.og_image_url || post.featured_image_url;
  return {
    title: post.seo_title || post.title,
    description,
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      title: post.seo_title || post.title,
      description,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const supabase = await createClient();
  const service = createServiceRoleClient();
  const user = await getCurrentUser();

  // Author (profiles RLS is restricted — read minimal fields via service role).
  let authorName: string | null = null;
  if (post.author_id) {
    const { data: author } = await service
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', post.author_id)
      .maybeSingle();
    authorName = author?.full_name ?? null;
  }

  // Categories for this post.
  const { data: assignments } = await supabase
    .from('post_category_assignments')
    .select('category_id')
    .eq('post_id', post.id);
  const categoryIds = (assignments ?? []).map((a) => a.category_id);
  let categories: PostCategoryRow[] = [];
  if (categoryIds.length) {
    const { data: cats } = await supabase
      .from('post_categories')
      .select('*')
      .in('id', categoryIds);
    categories = (cats ?? []) as PostCategoryRow[];
  }

  // Related posts (same category, exclude current).
  let related: PostRow[] = [];
  if (categoryIds.length) {
    const { data: relAssign } = await supabase
      .from('post_category_assignments')
      .select('post_id')
      .in('category_id', categoryIds);
    const relIds = [...new Set((relAssign ?? []).map((a) => a.post_id))].filter(
      (id) => id !== post.id
    );
    if (relIds.length) {
      const { data: rel } = await supabase
        .from('posts')
        .select('*')
        .in('id', relIds)
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .is('deleted_at', null)
        .order('published_at', { ascending: false })
        .limit(3);
      related = (rel ?? []) as PostRow[];
    }
  }

  // Best-effort view count increment.
  void service
    .from('posts')
    .update({ view_count: post.view_count + 1 })
    .eq('id', post.id)
    .then(() => undefined);

  // Approved comments.
  let displayComments: DisplayComment[] = [];
  if (post.comments_enabled) {
    const { data: comments } = await service
      .from('comments')
      .select('id, body, created_at, author_id')
      .eq('post_id', post.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });
    const rows = comments ?? [];
    const authorIds = [...new Set(rows.map((c) => c.author_id).filter(Boolean))];
    const nameById = new Map<string, string>();
    if (authorIds.length) {
      const { data: authors } = await service
        .from('profiles')
        .select('id, full_name')
        .in('id', authorIds);
      for (const a of authors ?? []) nameById.set(a.id, a.full_name ?? 'Member');
    }
    displayComments = rows.map((c) => ({
      id: c.id,
      body: c.body,
      authorName: nameById.get(c.author_id) ?? 'Member',
      createdAt: c.created_at,
    }));
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: post.featured_image_url ? [post.featured_image_url] : undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    author: authorName ? { '@type': 'Person', name: authorName } : undefined,
    description: post.excerpt ?? undefined,
    url: absoluteUrl(`/posts/${post.slug}`),
  };

  return (
    <article className="container max-w-3xl py-12 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="space-y-4">
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Badge key={c.id} variant="outline">
                {c.name}
              </Badge>
            ))}
          </div>
        )}
        <h1 className="text-4xl font-serif font-medium md:text-5xl">{post.title}</h1>
        <p className="text-sm text-muted-foreground">
          {authorName ? `By ${authorName} · ` : ''}
          {formatDate(post.published_at)}
        </p>
      </header>

      {post.featured_image_url && (
        <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border bg-muted">
          <Image src={post.featured_image_url} alt={post.title} fill priority className="object-cover" />
        </div>
      )}

      <div className="mt-8">
        <RichText html={post.content_html} />
      </div>

      {post.comments_enabled ? (
        <CommentSection
          postId={post.id}
          postSlug={post.slug}
          isSignedIn={!!user}
          comments={displayComments}
        />
      ) : (
        <p className="mt-12 border-t border-border/60 pt-8 text-sm text-muted-foreground">
          Comments are closed for this post.
        </p>
      )}

      {related.length > 0 && (
        <section className="mt-16 border-t border-border/60 pt-10">
          <h2 className="mb-6 text-2xl font-serif font-medium">More stories</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
