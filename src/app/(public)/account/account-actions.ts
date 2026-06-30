'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { type ActionResult, fail, succeed } from '@/lib/form';

/**
 * Cancel an RSVP belonging to the current user. RLS also enforces ownership,
 * but we check explicitly for a friendly error.
 */
export async function cancelMyRsvp(rsvpId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail('You must be signed in.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('event_rsvps')
    .update({ status: 'cancelled' })
    .eq('id', rsvpId)
    .eq('profile_id', user.id);

  if (error) return fail(error.message);

  revalidatePath('/account/rsvps');
  return succeed('RSVP cancelled.');
}
