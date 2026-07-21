import Link from 'next/link';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { NewPageButton } from './new-page-button';
import type { PageRow } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function PagesPage() {
  await requireModule('pages');
  const supabase = await createClient();

  const { data } = await supabase
    .from('pages')
    .select('*')
    .is('deleted_at', null)
    .order('is_system', { ascending: false })
    .order('title');

  const pages = (data as PageRow[]) ?? [];

  return (
    <div>
      <AdminPageHeader title="Pages" description="Build and edit the site's pages with content blocks.">
        <NewPageButton />
      </AdminPageHeader>

      <Card>
        <CardContent className="p-0">
          {pages.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No pages yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr key={page.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <Link href={`/admin/pages/${page.id}`} className="font-medium hover:text-brand">
                          {page.title}
                        </Link>
                        {page.is_placeholder && (
                          <Badge variant="warning" className="ml-2">
                            Placeholder
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        /{page.slug === 'home' ? '' : page.slug}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={page.status === 'published' ? 'success' : 'secondary'}>
                          {page.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {page.is_system ? 'System' : 'Custom'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(page.updated_at)}</td>
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
