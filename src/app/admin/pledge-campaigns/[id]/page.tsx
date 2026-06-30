import { notFound } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import type { PledgeCampaignRow } from '@/types/database';
import { CampaignForm } from '../campaign-form';

export const dynamic = 'force-dynamic';

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModule('pledge_campaigns');
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('pledge_campaigns').select('*').eq('id', id).single();
  if (!data) notFound();

  const campaign = data as PledgeCampaignRow;

  return (
    <div>
      <AdminPageHeader title="Edit campaign" description={campaign.title} />
      <CampaignForm campaign={campaign} />
    </div>
  );
}
