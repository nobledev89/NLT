import { requireModule } from '@/lib/auth';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { EventForm } from '../event-form';

export const dynamic = 'force-dynamic';

export default async function NewEventPage() {
  await requireModule('events');
  return (
    <div>
      <AdminPageHeader title="New event" description="Create an event for the calendar." />
      <EventForm />
    </div>
  );
}
