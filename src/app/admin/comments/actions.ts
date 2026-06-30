'use server';

import { revalidatePath } from 'next/cache';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import type { CommentStatus } from '@/types/database';

export async function moderateCommentAction(
  id: string,
  status: CommentStatus
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireModule('comments');
  const supabase = await createClient();

  const { error } = await supabase.from('comments').update({ status }).eq('id', id);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'comment.moderate',
    entityType: 'comment',
    entityId: id,
    metadata: { status },
  });
  revalidatePath('/admin/comments');
  return { ok: true };
}

export async function deleteCommentAction(
  id: string
): Promise<{ ok: boolean; message?: string }> {
  const user = await requireModule('comments');
  const supabase = await createClient();

  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) return { ok: false, message: error.message };

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'comment.delete',
    entityType: 'comment',
    entityId: id,
  });
  revalidatePath('/admin/comments');
  return { ok: true };
}
