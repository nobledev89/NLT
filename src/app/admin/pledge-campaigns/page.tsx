import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPHP, formatDate } from '@/lib/utils';
import type {
  BankAccountRow,
  CampaignStatus,
  PledgeCampaignRow,
} from '@/types/database';
import { BankAccountsSection } from './bank-accounts';
import { DeleteCampaignButton } from './delete-campaign-button';

export const dynamic = 'force-dynamic';

const STATUS_VARIANT: Record<CampaignStatus, 'default' | 'success' | 'muted' | 'danger'> = {
  upcoming: 'default',
  active: 'success',
  completed: 'muted',
  cancelled: 'danger',
};

export default async function PledgeCampaignsPage() {
  await requireModule('pledge_campaigns');
  const supabase = await createClient();

  const [{ data: campaigns }, { data: accounts }] = await Promise.all([
    supabase.from('pledge_campaigns').select('*').order('position').order('created_at'),
    supabase.from('bank_accounts').select('*').order('position').order('created_at'),
  ]);

  const list = (campaigns ?? []) as PledgeCampaignRow[];
  const bankAccounts = (accounts ?? []) as BankAccountRow[];

  return (
    <div>
      <AdminPageHeader title="Pledge Campaigns" description="Manage giving campaigns and bank deposit details.">
        <Button asChild>
          <Link href="/admin/pledge-campaigns/new">
            <Plus className="h-4 w-4" /> New campaign
          </Link>
        </Button>
      </AdminPageHeader>

      {list.length === 0 ? (
        <p className="rounded-md border border-border py-10 text-center text-sm text-muted-foreground">
          No campaigns yet. Create your first one.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium">Goal</th>
                <th className="px-4 py-2 font-medium">Dates</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Featured</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium">
                    <span className="flex items-center gap-2">
                      {c.title}
                      {c.is_placeholder && <Badge variant="warning">Placeholder</Badge>}
                    </span>
                    <span className="block text-xs text-muted-foreground">/{c.slug}</span>
                  </td>
                  <td className="px-4 py-2.5">{c.goal_amount ? formatPHP(c.goal_amount) : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {c.start_date ? formatDate(c.start_date, { dateStyle: 'medium' }) : '—'}
                    {c.end_date ? ` → ${formatDate(c.end_date, { dateStyle: 'medium' })}` : ''}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5">{c.is_featured ? 'Yes' : '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/pledge-campaigns/${c.id}`}>
                          <Pencil className="h-4 w-4" /> Edit
                        </Link>
                      </Button>
                      <DeleteCampaignButton id={c.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Separator className="my-10" />

      <BankAccountsSection accounts={bankAccounts} />
    </div>
  );
}
