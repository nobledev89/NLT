import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryManager } from './category-manager';
import type { PostCategoryRow } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  await requireModule('posts');
  const supabase = await createClient();

  const { data } = await supabase.from('post_categories').select('*').order('name');

  return (
    <div>
      <AdminPageHeader title="Categories" description="Organize posts into categories.">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/posts">
            <ArrowLeft className="h-4 w-4" /> Back to posts
          </Link>
        </Button>
      </AdminPageHeader>
      <Card>
        <CardContent className="py-6">
          <CategoryManager categories={(data as PostCategoryRow[]) ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
