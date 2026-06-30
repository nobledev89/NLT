import Link from 'next/link';
import { requireModule } from '@/lib/auth';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDateTime } from '@/lib/utils';
import { CommentActions } from './comment-actions';
import type { CommentRow, CommentStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

type CommentFilter = CommentStatus | 'all';

const FILTERS: { value: CommentFilter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'all', label: 'All' },
];

const STATUS_VARIANT: Record<CommentStatus, 'warning' | 'success' | 'danger' | 'muted'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  hidden: 'muted',
};

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireModule('comments');
  const { status: rawStatus } = await searchParams;
  const status: CommentFilter = FILTERS.some((f) => f.value === rawStatus)
    ? (rawStatus as CommentFilter)
    : 'pending';

  const supabase = await createClient();
  let query = supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status !== 'all') query = query.eq('status', status);

  const { data } = await query;
  const comments = (data as CommentRow[]) ?? [];

  // Resolve author names + post titles via service role (profiles RLS is strict).
  const service = createServiceRoleClient();
  const authorIds = [...new Set(comments.map((c) => c.author_id).filter(Boolean))];
  const postIds = [...new Set(comments.map((c) => c.post_id).filter(Boolean))];

  const [{ data: profiles }, { data: posts }] = await Promise.all([
    authorIds.length
      ? service.from('profiles').select('id, full_name, email').in('id', authorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string }[] }),
    postIds.length
      ? service.from('posts').select('id, title, slug').in('id', postIds)
      : Promise.resolve({ data: [] as { id: string; title: string; slug: string }[] }),
  ]);

  const authorMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const postMap = new Map((posts ?? []).map((p) => [p.id, p]));

  return (
    <div>
      <AdminPageHeader title="Comments" description="Moderate reader comments on posts." />

      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/comments?status=${f.value}`}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              status === f.value
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {comments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No {status === 'all' ? '' : status} comments.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const author = authorMap.get(comment.author_id);
            const post = postMap.get(comment.post_id);
            return (
              <Card key={comment.id}>
                <CardContent className="space-y-3 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">
                        {author?.full_name || author?.email || 'Unknown'}
                      </span>
                      <span className="text-muted-foreground">on</span>
                      {post ? (
                        <Link href={`/blog/${post.slug}`} className="text-gold hover:underline" target="_blank">
                          {post.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">deleted post</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        · {formatDateTime(comment.created_at)}
                      </span>
                    </div>
                    <Badge variant={STATUS_VARIANT[comment.status]}>{comment.status}</Badge>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground/90">{comment.body}</p>
                  <CommentActions id={comment.id} status={comment.status} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
