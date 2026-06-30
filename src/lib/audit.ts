import { createServiceRoleClient } from '@/lib/supabase/server';

interface AuditEntry {
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append an entry to the audit log. Best-effort: failures are logged but never
 * block the originating action. Uses the service role so logging is not
 * subject to RLS.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    await supabase.from('audit_logs').insert({
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      metadata: (entry.metadata ?? {}) as never,
    });
  } catch (err) {
    console.error('[audit] failed to write log entry', err);
  }
}
