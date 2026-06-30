import Link from 'next/link';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { CommentStatus } from '@/types/database';

export const metadata: Metadata = { title: 'My Comments' };

interface CommentWithPost {
  id: string;
  body: string;
  status: CommentStatus;
  created_at: string;
  posts: { title: string; slug: string } | null;
}

const STATUS_VARIANT: Record<CommentStatus, 'success' | 'warning' | 'muted' | 'danger'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  hidden: 'muted',
};

export default async function MyCommentsPage() {
  const user = await requireUser('/account/comments');
  const supabase = await createClient();

  const { data } = await supabase
    .from('comments')
    .select('*, posts(title, slug)')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  const comments = (data ?? []) as unknown as CommentWithPost[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">My Comments</h2>
        <p className="text-sm text-muted-foreground">Comments you have shared on posts.</p>
      </div>

      {comments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            You have not posted any comments yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id}>
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div className="min-w-0 text-sm text-muted-foreground">
                    {comment.posts?.slug ? (
                      <Link
                        href={`/blog/${comment.posts.slug}`}
                        className="text-foreground hover:text-gold"
                      >
                        {comment.posts.title}
                      </Link>
                    ) : (
                      <span>Post</span>
                    )}
                    <span className="ml-2">{formatDate(comment.created_at)}</span>
                  </div>
                  <Badge variant={STATUS_VARIANT[comment.status]} className="capitalize">
                    {comment.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="prose-church text-sm">{comment.body}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
