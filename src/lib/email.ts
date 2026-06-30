import { resendConfig } from '@/lib/env';

interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send a transactional email via Resend. Optional: if RESEND_API_KEY is not
 * configured this is a no-op that returns `{ sent: false }`, so the app works
 * end-to-end without an email provider. Never throws on send failure.
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendEmailArgs): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const apiKey = resendConfig.apiKey();
  if (!apiKey) {
    return { sent: false, skipped: true };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: resendConfig.fromEmail(),
      to,
      subject,
      html,
      replyTo,
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (err) {
    console.error('[email] send failed', err);
    return { sent: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

/** Minimal branded HTML wrapper for transactional emails. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0f0d0b;font-family:Helvetica,Arial,sans-serif;color:#efe9e1;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#17140f;border:1px solid #2a251d;border-radius:12px;padding:32px">
    <h1 style="font-size:20px;margin:0 0 16px;color:#d6ad6a">${title}</h1>
    <div style="font-size:15px;line-height:1.6;color:#d8d0c4">${bodyHtml}</div>
    <p style="margin-top:32px;font-size:12px;color:#8a8175">New Life Tagum · 1489 Manuel B. Suaybaguio Sr. St, Tagum, Davao del Norte</p>
  </div></body></html>`;
}
