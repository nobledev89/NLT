import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { MinistryRow } from '@/types/database';
import { DeleteMinistryButton } from './row-actions';

export const dynamic = 'force-dynamic';

export default async function MinistriesPage() {
  await requireModule('ministries');
  const supabase = await createClient();

  const { data } = await supabase
    .from('ministries')
    .select('*')
    .order('position', { ascending: true })
    .order('name', { ascending: true });

  const ministries = (data ?? []) as MinistryRow[];

  return (
    <div>
      <AdminPageHeader title="Ministries" description="Manage ministries and their public listings.">
        <Button asChild>
          <Link href="/admin/ministries/new">
            <Plus className="h-4 w-4" /> New ministry
          </Link>
        </Button>
      </AdminPageHeader>

      <Card>
        <CardContent className="p-0">
          {ministries.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No ministries yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Position</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ministries.map((m) => (
                    <tr key={m.id} className="border-b border-border transition-colors hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <Link href={`/admin/ministries/${m.id}`} className="font-medium hover:text-gold">
                          {m.name}
                        </Link>
                        {m.is_placeholder && <Badge variant="warning" className="ml-2">Placeholder</Badge>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.slug}</td>
                      <td className="px-4 py-3">
                        <Badge variant={m.published ? 'success' : 'muted'}>{m.published ? 'Published' : 'Draft'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.position}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="sm" title="Edit">
                            <Link href={`/admin/ministries/${m.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DeleteMinistryButton id={m.id} name={m.name} />
                        </div>
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
