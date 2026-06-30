'use server';

import { revalidatePath } from 'next/cache';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { type ActionResult, fail, succeed } from '@/lib/form';
import type { PledgeStatus } from '@/types/database';

const VALID: PledgeStatus[] = ['pending', 'confirmed', 'received', 'cancelled'];

export async function setPledgeStatusAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('pledge_submissions');

  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '') as PledgeStatus;

  if (!id) return fail('Missing submission id.');
  if (!VALID.includes(status)) return fail('Invalid status.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('pledge_submissions')
    .update({ status })
    .eq('id', id);
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'pledge.status_change',
    entityType: 'pledge_submission',
    entityId: id,
    metadata: { status },
  });

  revalidatePath('/admin/pledge-submissions');
  return succeed('Status updated.');
}
