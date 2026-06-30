import { notFound } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import type { MinistryRow } from '@/types/database';
import { MinistryForm } from '../ministry-form';

export const dynamic = 'force-dynamic';

export default async function EditMinistryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModule('ministries');
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.from('ministries').select('*').eq('id', id).single();
  if (!data) notFound();
  const ministry = data as MinistryRow;

  return (
    <div>
      <AdminPageHeader title="Edit ministry" description={ministry.name} />
      <MinistryForm ministry={ministry} />
    </div>
  );
}
