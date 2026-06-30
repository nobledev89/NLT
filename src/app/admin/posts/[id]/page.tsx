import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { PostForm } from '../post-form';
import type { PostRow, PostCategoryRow, PostCategoryAssignmentRow } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModule('posts');
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: categories }, { data: assignments }] = await Promise.all([
    supabase.from('posts').select('*').eq('id', id).is('deleted_at', null).single(),
    supabase.from('post_categories').select('*').order('name'),
    supabase.from('post_category_assignments').select('category_id').eq('post_id', id),
  ]);

  if (!post) notFound();

  const assignedCategoryIds = ((assignments as Pick<PostCategoryAssignmentRow, 'category_id'>[]) ?? []).map(
    (a) => a.category_id
  );

  return (
    <div>
      <AdminPageHeader title="Edit post" description={(post as PostRow).title}>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/posts">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </AdminPageHeader>
      <PostForm
        post={post as PostRow}
        categories={(categories as PostCategoryRow[]) ?? []}
        assignedCategoryIds={assignedCategoryIds}
      />
    </div>
  );
}
