import Link from 'next/link';
import { Plus, Users, Pencil } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import type { EventRow } from '@/types/database';
import { DeleteEventButton } from './row-actions';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  await requireModule('events');
  const supabase = await createClient();

  const { data } = await supabase
    .from('events')
    .select('*')
    .is('deleted_at', null)
    .order('start_at', { ascending: false });

  const events = (data ?? []) as EventRow[];

  return (
    <div>
      <AdminPageHeader title="Events" description="Manage church events, visibility, and RSVPs.">
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="h-4 w-4" /> New event
          </Link>
        </Button>
      </AdminPageHeader>

      <Card>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Visibility</th>
                    <th className="px-4 py-3 font-medium">RSVP</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="border-b border-border transition-colors hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <Link href={`/admin/events/${e.id}`} className="font-medium hover:text-brand">
                          {e.title}
                        </Link>
                        {e.is_featured && <Badge variant="warning" className="ml-2">Featured</Badge>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(e.start_at)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={e.status === 'published' ? 'success' : 'muted'}>{e.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={e.is_public ? 'default' : 'secondary'}>{e.is_public ? 'Public' : 'Private'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={e.rsvp_enabled ? 'success' : 'muted'}>{e.rsvp_enabled ? 'On' : 'Off'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{e.category ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="sm" title="View RSVPs">
                            <Link href={`/admin/rsvps?event=${e.id}`}>
                              <Users className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="sm" title="Edit">
                            <Link href={`/admin/events/${e.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DeleteEventButton id={e.id} title={e.title} />
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
