import Link from 'next/link';
import {
  CalendarDays,
  ClipboardList,
  MailOpen,
  Receipt,
  FileEdit,
  MessageSquare,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { requireDashboard } from '@/lib/auth';
import { can, isAdmin } from '@/lib/rbac';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function count(table: string, build: (q: any) => any) {
  const supabase = await createClient();
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  q = build(q);
  const { count: c } = await q;
  return c ?? 0;
}

export default async function AdminOverview({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requireDashboard();
  const { denied } = await searchParams;
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [upcomingEvents, recentRsvps, formSubs, pledgeSubs, draftPosts, pendingComments] =
    await Promise.all([
      can(user.actor, 'events')
        ? count('events', (q) => q.eq('status', 'published').gte('start_at', nowIso).is('deleted_at', null))
        : Promise.resolve(0),
      can(user.actor, 'event_rsvps')
        ? count('event_rsvps', (q) => q.eq('status', 'confirmed'))
        : Promise.resolve(0),
      can(user.actor, 'form_submissions')
        ? count('connection_form_submissions', (q) => q.eq('status', 'new'))
        : Promise.resolve(0),
      can(user.actor, 'pledge_submissions')
        ? count('pledge_submissions', (q) => q.eq('status', 'pending'))
        : Promise.resolve(0),
      can(user.actor, 'posts')
        ? count('posts', (q) => q.eq('status', 'draft').is('deleted_at', null))
        : Promise.resolve(0),
      can(user.actor, 'comments')
        ? count('comments', (q) => q.eq('status', 'pending'))
        : Promise.resolve(0),
    ]);

  const { data: nextEvents } = can(user.actor, 'events')
    ? await supabase
        .from('events')
        .select('id, title, slug, start_at, status')
        .gte('start_at', nowIso)
        .order('start_at')
        .limit(5)
    : { data: [] as any[] };

  const stats = [
    { label: 'Upcoming events', value: upcomingEvents, icon: CalendarDays, href: '/admin/events', show: can(user.actor, 'events') },
    { label: 'Confirmed RSVPs', value: recentRsvps, icon: ClipboardList, href: '/admin/rsvps', show: can(user.actor, 'event_rsvps') },
    { label: 'New form submissions', value: formSubs, icon: MailOpen, href: '/admin/form-submissions', show: can(user.actor, 'form_submissions') },
    { label: 'Pending pledges', value: pledgeSubs, icon: Receipt, href: '/admin/pledge-submissions', show: can(user.actor, 'pledge_submissions') },
    { label: 'Draft posts', value: draftPosts, icon: FileEdit, href: '/admin/posts', show: can(user.actor, 'posts') },
    { label: 'Comments to moderate', value: pendingComments, icon: MessageSquare, href: '/admin/comments', show: can(user.actor, 'comments') },
  ].filter((s) => s.show);

  return (
    <div>
      <AdminPageHeader
        title={`Welcome back`}
        description="Here's what's happening across New Life Tagum."
      />

      {denied && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-center gap-3 py-4 text-sm text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            You don&apos;t have permission to access that section ({denied}).
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="transition-colors hover:border-gold/40">
                <CardContent className="flex items-center justify-between py-6">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-3xl font-semibold">{s.value}</p>
                  </div>
                  <Icon className="h-8 w-8 text-gold/70" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {stats.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You have access to specific modules. Use the sidebar to get started.
          </CardContent>
        </Card>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {can(user.actor, 'events') && (
          <Card>
            <CardContent className="py-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Upcoming events</h2>
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/events"><Plus className="h-4 w-4" /> Manage</Link>
                </Button>
              </div>
              {(nextEvents ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {(nextEvents ?? []).map((e: any) => (
                    <li key={e.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(e.start_at)}</p>
                      </div>
                      <Badge variant={e.status === 'published' ? 'success' : 'muted'}>{e.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="py-6">
            <h2 className="mb-4 font-semibold">Quick actions</h2>
            <div className="flex flex-wrap gap-2">
              {can(user.actor, 'posts') && <Button asChild size="sm" variant="outline"><Link href="/admin/posts/new">New post</Link></Button>}
              {can(user.actor, 'events') && <Button asChild size="sm" variant="outline"><Link href="/admin/events/new">New event</Link></Button>}
              {can(user.actor, 'pages') && <Button asChild size="sm" variant="outline"><Link href="/admin/pages">Edit pages</Link></Button>}
              {can(user.actor, 'media') && <Button asChild size="sm" variant="outline"><Link href="/admin/media">Upload media</Link></Button>}
              {isAdmin(user.actor) && <Button asChild size="sm" variant="outline"><Link href="/admin/users">Invite staff</Link></Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
