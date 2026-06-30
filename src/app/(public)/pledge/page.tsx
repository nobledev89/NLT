import type { Metadata } from 'next';
import Image from 'next/image';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { PageHero } from '@/components/site/page-hero';
import { RichText } from '@/components/blocks/rich-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatPHP, formatDate } from '@/lib/utils';
import { PledgeForm, type CampaignOption } from './pledge-form';
import type { PledgeCampaignRow, BankAccountRow } from '@/types/database';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('pledge');
  return loaded
    ? { ...pageMetadata(loaded.page), alternates: { canonical: '/pledge' } }
    : { title: 'Give & Pledge' };
}

const STATUS_VARIANT: Record<string, 'success' | 'muted' | 'warning'> = {
  active: 'success',
  completed: 'muted',
  upcoming: 'warning',
};

export default async function PledgePage() {
  const [loaded, supabase] = await Promise.all([
    getPublishedPage('pledge'),
    createClient(),
  ]);
  const service = createServiceRoleClient();

  const [{ data: campaignRows }, { data: bankRows }] = await Promise.all([
    supabase
      .from('pledge_campaigns')
      .select('*')
      .neq('status', 'cancelled')
      .order('position'),
    supabase
      .from('bank_accounts')
      .select('*')
      .eq('active', true)
      .order('position'),
  ]);

  const campaigns = (campaignRows ?? []) as PledgeCampaignRow[];
  const banks = (bankRows ?? []) as BankAccountRow[];

  // Compute raised amount per campaign (confirmed + received) via service role.
  const raisedById = new Map<string, number>();
  if (campaigns.length) {
    const { data: subs } = await service
      .from('pledge_submissions')
      .select('campaign_id, amount, status')
      .in('status', ['confirmed', 'received']);
    for (const s of subs ?? []) {
      if (!s.campaign_id) continue;
      raisedById.set(s.campaign_id, (raisedById.get(s.campaign_id) ?? 0) + Number(s.amount ?? 0));
    }
  }

  const campaignOptions: CampaignOption[] = campaigns
    .filter((c) => c.status === 'active' || c.status === 'upcoming')
    .map((c) => ({ id: c.id, title: c.title }));

  return (
    <>
      <PageHero
        eyebrow="Give generously"
        title={loaded?.page.title ?? 'Give & Pledge'}
        subtitle={
          loaded?.page.seo_description ??
          'Support the mission and ministries of New Life Tagum.'
        }
      />

      {/* Campaigns */}
      {campaigns.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="mb-10">
              <p className="eyebrow">Where your gift goes</p>
              <h2 className="mt-2 text-3xl font-serif font-medium">Current Campaigns</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {campaigns.map((c) => {
                const raised = raisedById.get(c.id) ?? 0;
                const goal = c.goal_amount ? Number(c.goal_amount) : null;
                const pct = goal ? Math.min(100, Math.round((raised / goal) * 100)) : null;
                return (
                  <Card key={c.id} className="overflow-hidden">
                    {c.cover_image_url && (
                      <div className="relative aspect-[16/9] bg-muted">
                        <Image src={c.cover_image_url} alt={c.title} fill className="object-cover" />
                      </div>
                    )}
                    <div className="space-y-3 p-6">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-semibold">{c.title}</h3>
                        <Badge variant={STATUS_VARIANT[c.status] ?? 'muted'} className="capitalize">
                          {c.status}
                        </Badge>
                      </div>
                      {c.description_html && (
                        <RichText html={c.description_html} className="text-sm" />
                      )}
                      {goal != null && (
                        <div className="space-y-1.5">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-gold transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{formatPHP(raised)}</span>{' '}
                            raised of {formatPHP(goal)} goal
                          </p>
                        </div>
                      )}
                      {(c.start_date || c.end_date) && (
                        <p className="text-xs text-muted-foreground">
                          {c.start_date ? formatDate(c.start_date) : ''}
                          {c.end_date ? ` – ${formatDate(c.end_date)}` : ''}
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Bank transfer details */}
      {banks.length > 0 && (
        <section className="section border-t border-border/60">
          <div className="container">
            <div className="mb-10">
              <p className="eyebrow">How to give</p>
              <h2 className="mt-2 text-3xl font-serif font-medium">Bank Transfer Details</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {banks.map((b) => (
                <Card key={b.id} className="space-y-3 p-6">
                  <h3 className="text-lg font-semibold">{b.bank_name}</h3>
                  <dl className="space-y-1.5 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Account name</dt>
                      <dd className="font-medium">{b.account_name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Account number</dt>
                      <dd className="font-mono text-base tracking-wide">{b.account_number}</dd>
                    </div>
                  </dl>
                  {b.instructions && (
                    <p className="text-sm text-muted-foreground">{b.instructions}</p>
                  )}
                  {b.qr_image_url && (
                    <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-lg border border-border bg-white">
                      <Image
                        src={b.qr_image_url}
                        alt={`${b.bank_name} payment QR code`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
            <p className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Payments are never automatically verified; please keep your reference number so we
              can match your gift.
            </p>
          </div>
        </section>
      )}

      {/* Pledge form */}
      <section className="section border-t border-border/60">
        <div className="container max-w-2xl">
          <div className="mb-8">
            <p className="eyebrow">Record your gift</p>
            <h2 className="mt-2 text-3xl font-serif font-medium">Make a Pledge</h2>
            <p className="mt-2 text-muted-foreground">
              Let us know about your gift so we can follow up and steward it well.
            </p>
          </div>
          <PledgeForm campaigns={campaignOptions} />
        </div>
      </section>
    </>
  );
}
