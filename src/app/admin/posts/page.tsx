import Link from 'next/link';
import { Plus, FolderTree } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { PostRowActions } from './post-row-actions';
import type { PostRow, PostStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

const STATUS_VARIANT: Record<PostStatus, 'success' | 'warning' | 'muted' | 'secondary'> = {
  published: 'success',
  scheduled: 'warning',
  draft: 'secondary',
  archived: 'muted',
};

export default async function PostsPage() {
  await requireModule('posts');
  const supabase = await createClient();

  const { data } = await supabase
    .from('posts')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  const posts = (data as PostRow[]) ?? [];

  return (
    <div>
      <AdminPageHeader title="Posts" description="Articles and announcements for the blog.">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/posts/categories">
            <FolderTree className="h-4 w-4" /> Categories
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4" /> New post
          </Link>
        </Button>
      </AdminPageHeader>

      <Card>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No posts yet. Create your first post.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Featured</th>
                    <th className="px-4 py-3 font-medium">Comments</th>
                    <th className="px-4 py-3 font-medium">Published</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <Link href={`/admin/posts/${post.id}`} className="font-medium hover:text-gold">
                          {post.title}
                        </Link>
                        {post.is_placeholder && (
                          <Badge variant="warning" className="ml-2">
                            Placeholder
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground">/{post.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[post.status]}>{post.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{post.is_featured ? 'Yes' : '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {post.comments_enabled ? 'On' : 'Off'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {post.published_at ? formatDate(post.published_at) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <PostRowActions id={post.id} status={post.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
