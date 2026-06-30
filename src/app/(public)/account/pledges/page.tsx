import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPHP, formatDate } from '@/lib/utils';
import type { PledgeStatus, PledgeSubmissionRow } from '@/types/database';

export const metadata: Metadata = { title: 'My Pledges' };

const STATUS_VARIANT: Record<PledgeStatus, 'success' | 'warning' | 'muted'> = {
  pending: 'warning',
  confirmed: 'success',
  received: 'success',
  cancelled: 'muted',
};

export default async function MyPledgesPage() {
  const user = await requireUser('/account/pledges');
  const supabase = await createClient();

  const { data } = await supabase
    .from('pledge_submissions')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  const pledges = (data ?? []) as PledgeSubmissionRow[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">My Pledges</h2>
        <p className="text-sm text-muted-foreground">Your giving commitments.</p>
      </div>

      {pledges.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            You have not made any pledges yet.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {pledges.map((pledge) => (
            <li key={pledge.id}>
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="font-serif">{formatPHP(pledge.amount)}</CardTitle>
                    <CardDescription>
                      Pledged on {formatDate(pledge.created_at)}
                    </CardDescription>
                  </div>
                  <Badge variant={STATUS_VARIANT[pledge.status]} className="capitalize">
                    {pledge.status}
                  </Badge>
                </CardHeader>
                {(pledge.reference_number || pledge.notes) && (
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    {pledge.reference_number && (
                      <p>Reference: {pledge.reference_number}</p>
                    )}
                    {pledge.notes && <p>{pledge.notes}</p>}
                  </CardContent>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
