import Link from 'next/link';
import { Download } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPHP, formatDateTime } from '@/lib/utils';
import type { PledgeStatus } from '@/types/database';
import { PledgeStatusControl } from './status-control';

export const dynamic = 'force-dynamic';

const STATUSES: PledgeStatus[] = ['pending', 'confirmed', 'received', 'cancelled'];

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  amount: number;
  reference_number: string | null;
  status: PledgeStatus;
  created_at: string;
  campaign: { title: string } | null;
};

export default async function PledgeSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireModule('pledge_submissions');
  const { status } = await searchParams;
  const filter = STATUSES.includes(status as PledgeStatus) ? (status as PledgeStatus) : undefined;

  const supabase = await createClient();
  let query = supabase
    .from('pledge_submissions')
    .select('id, name, email, phone, amount, reference_number, status, created_at, campaign:pledge_campaigns(title)')
    .order('created_at', { ascending: false });
  if (filter) query = query.eq('status', filter);

  const { data } = await query;
  const rows = ((data ?? []) as unknown as Row[]) ?? [];

  const exportHref = filter
    ? `/admin/pledge-submissions/export?status=${filter}`
    : '/admin/pledge-submissions/export';

  return (
    <div>
      <AdminPageHeader title="Pledge Submissions" description="Donations pledged through the site. Payment verification is always manual.">
        <Button asChild variant="outline">
          <a href={exportHref}>
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </Button>
      </AdminPageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant={!filter ? 'default' : 'outline'}>
          <Link href="/admin/pledge-submissions">All</Link>
        </Button>
        {STATUSES.map((s) => (
          <Button key={s} asChild size="sm" variant={filter === s ? 'default' : 'outline'}>
            <Link href={`/admin/pledge-submissions?status=${s}`} className="capitalize">
              {s}
            </Link>
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-border py-10 text-center text-sm text-muted-foreground">
          No submissions{filter ? ` with status "${filter}"` : ''}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Contact</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Campaign</th>
                <th className="px-4 py-2 font-medium">Reference</th>
                <th className="px-4 py-2 font-medium">Created</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 align-top hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    <div>{r.email}</div>
                    {r.phone && <div>{r.phone}</div>}
                  </td>
                  <td className="px-4 py-2.5">{formatPHP(r.amount)}</td>
                  <td className="px-4 py-2.5">{r.campaign?.title ?? <span className="text-muted-foreground">General</span>}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{r.reference_number || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDateTime(r.created_at)}</td>
                  <td className="px-4 py-2.5">
                    <div className="space-y-1">
                      <PledgeStatusControl id={r.id} status={r.status} />
                      <Badge
                        variant={
                          r.status === 'received'
                            ? 'success'
                            : r.status === 'confirmed'
                            ? 'default'
                            : r.status === 'cancelled'
                            ? 'danger'
                            : 'muted'
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
