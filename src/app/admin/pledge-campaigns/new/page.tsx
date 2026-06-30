import { requireModule } from '@/lib/auth';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { CampaignForm } from '../campaign-form';

export const dynamic = 'force-dynamic';

export default async function NewCampaignPage() {
  await requireModule('pledge_campaigns');
  return (
    <div>
      <AdminPageHeader title="New campaign" description="Create a new pledge campaign." />
      <CampaignForm />
    </div>
  );
}
