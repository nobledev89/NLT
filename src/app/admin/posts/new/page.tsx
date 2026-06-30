import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { PostForm } from '../post-form';
import type { PostCategoryRow } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  await requireModule('posts');
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('post_categories')
    .select('*')
    .order('name');

  return (
    <div>
      <AdminPageHeader title="New post" description="Create a new article.">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/posts">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </AdminPageHeader>
      <PostForm categories={(categories as PostCategoryRow[]) ?? []} />
    </div>
  );
}
