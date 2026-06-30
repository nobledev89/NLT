import { requireModule } from '@/lib/auth';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { MinistryForm } from '../ministry-form';

export const dynamic = 'force-dynamic';

export default async function NewMinistryPage() {
  await requireModule('ministries');
  return (
    <div>
      <AdminPageHeader title="New ministry" description="Add a ministry to the site." />
      <MinistryForm />
    </div>
  );
}
