import { notFound } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import type { EventRow } from '@/types/database';
import { EventForm } from '../event-form';

export const dynamic = 'force-dynamic';

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModule('events');
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!data) notFound();
  const event = data as EventRow;

  return (
    <div>
      <AdminPageHeader title="Edit event" description={event.title} />
      <EventForm event={event} />
    </div>
  );
}
