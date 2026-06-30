'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { currentIpHash } from '@/lib/rate-limit';
import { rateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';
import { sendEmail, emailLayout } from '@/lib/email';
import { formatPHP, formatDateTime } from '@/lib/utils';
import {
  pledgeSchema,
  rsvpSchema,
  commentSchema,
  connectionSubmissionBase,
  emailSchema,
} from '@/lib/validations';
import { type ActionResult, fail, succeed, zodFieldErrors } from '@/lib/form';
import type {
  EventRow,
  ConnectionFormRow,
  ConnectionFormFieldRow,
} from '@/types/database';

/** Postgres unique-violation code. */
const UNIQUE_VIOLATION = '23505';

function rawString(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === 'string' ? v : '';
}

// ---------------------------------------------------------------------------
// 1. Pledge
// ---------------------------------------------------------------------------

export async function submitPledgeAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = pledgeSchema.safeParse({
    name: rawString(formData, 'name'),
    email: rawString(formData, 'email'),
    phone: rawString(formData, 'phone'),
    amount: rawString(formData, 'amount'),
    campaignId: rawString(formData, 'campaignId'),
    notes: rawString(formData, 'notes'),
    referenceNumber: rawString(formData, 'referenceNumber'),
    consent: formData.get('consent') === 'on' || formData.get('consent') === 'true',
    website: rawString(formData, 'website'),
  });

  if (!parsed.success) {
    return fail('Please check the form and try again.', zodFieldErrors(parsed.error));
  }
  const data = parsed.data;

  const ipHash = await currentIpHash();
  if (!rateLimit(`pledge:${ipHash}`, 5, 60 * 60 * 1000).success) {
    return fail('Too many pledges from this connection. Please try again later.');
  }

  const user = await getCurrentUser();
  const campaignId = data.campaignId ? data.campaignId : null;

  const insert = {
    campaign_id: campaignId,
    profile_id: user?.id ?? null,
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    amount: data.amount,
    notes: data.notes || null,
    reference_number: data.referenceNumber || null,
    ip_hash: ipHash,
    status: 'pending' as const,
  };

  // Signed-in members may insert via their own RLS-bound client (profile_id =
  // auth.uid()); guests go through the service role after validation.
  const db = user ? await createClient() : createServiceRoleClient();
  const { data: row, error } = await db
    .from('pledge_submissions')
    .insert(insert)
    .select('id')
    .single();

  if (error) {
    console.error('[pledge] insert failed', error);
    return fail('We could not record your pledge. Please try again.');
  }

  await logAudit({
    actorId: user?.id ?? null,
    actorEmail: user?.email ?? data.email,
    action: 'pledge.submit',
    entityType: 'pledge_submission',
    entityId: row?.id,
    metadata: { amount: data.amount, campaignId },
  });

  // Best-effort confirmation email. Make clear payment is NOT auto-verified.
  void sendEmail({
    to: data.email,
    subject: 'We received your pledge — New Life Tagum',
    html: emailLayout(
      'Thank you for your pledge',
      `<p>Dear ${data.name},</p>
       <p>We have received your pledge of <strong>${formatPHP(data.amount)}</strong>.</p>
       ${data.referenceNumber ? `<p>Your reference number: <strong>${data.referenceNumber}</strong>. Please keep it for your records.</p>` : ''}
       <p><strong>Please note:</strong> payments are <em>not</em> automatically verified. Our team will follow up to confirm your gift.</p>
       <p>With gratitude,<br/>New Life Tagum</p>`
    ),
  });

  return succeed(
    'Thank you — your pledge was received. Payment is not automatically verified; our team will follow up.',
    { redirectTo: '/pledge/thank-you' }
  );
}

// ---------------------------------------------------------------------------
// 2. RSVP
// ---------------------------------------------------------------------------

export async function submitRsvpAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = rsvpSchema.safeParse({
    eventId: rawString(formData, 'eventId'),
    guestName: rawString(formData, 'guestName'),
    guestEmail: rawString(formData, 'guestEmail'),
    guestPhone: rawString(formData, 'guestPhone'),
    partySize: rawString(formData, 'partySize') || '1',
    website: rawString(formData, 'website'),
  });

  if (!parsed.success) {
    return fail('Please check the form and try again.', zodFieldErrors(parsed.error));
  }
  const data = parsed.data;

  const ipHash = await currentIpHash();
  if (!rateLimit(`rsvp:${ipHash}`, 10, 60 * 60 * 1000).success) {
    return fail('Too many RSVPs from this connection. Please try again later.');
  }

  const service = createServiceRoleClient();
  const { data: event } = await service
    .from('events')
    .select('*')
    .eq('id', data.eventId)
    .eq('status', 'published')
    .eq('is_public', true)
    .is('deleted_at', null)
    .maybeSingle<EventRow>();

  if (!event) return fail('This event could not be found.');
  if (!event.rsvp_enabled) return fail('RSVP is not open for this event.');

  if (event.rsvp_deadline && new Date(event.rsvp_deadline).getTime() < Date.now()) {
    return fail('The RSVP deadline for this event has passed.');
  }

  // Capacity check against confirmed party sizes.
  if (event.rsvp_capacity != null) {
    const { data: confirmed } = await service
      .from('event_rsvps')
      .select('party_size')
      .eq('event_id', event.id)
      .eq('status', 'confirmed');
    const taken = (confirmed ?? []).reduce((sum, r) => sum + (r.party_size ?? 1), 0);
    if (taken + data.partySize > event.rsvp_capacity) {
      return fail('This event is full.');
    }
  }

  const user = await getCurrentUser();

  let insert: Record<string, unknown>;
  let notifyEmail: string | null = null;
  let notifyName = '';

  if (user) {
    insert = {
      event_id: event.id,
      profile_id: user.id,
      party_size: data.partySize,
      status: 'confirmed',
      ip_hash: ipHash,
    };
    notifyEmail = user.email;
    notifyName = user.profile.full_name ?? 'Friend';
  } else {
    if (!event.guest_rsvp_allowed) {
      return fail('Please sign in to RSVP for this event.');
    }
    if (!data.guestName || !data.guestEmail) {
      return fail('Please provide your name and email.', {
        ...(data.guestName ? {} : { guestName: 'Enter your name' }),
        ...(data.guestEmail ? {} : { guestEmail: 'Enter your email' }),
      });
    }
    insert = {
      event_id: event.id,
      guest_name: data.guestName,
      guest_email: data.guestEmail,
      guest_phone: data.guestPhone || null,
      party_size: data.partySize,
      status: 'confirmed',
      ip_hash: ipHash,
    };
    notifyEmail = data.guestEmail;
    notifyName = data.guestName;
  }

  const db = user ? await createClient() : service;
  const { data: row, error } = await db
    .from('event_rsvps')
    .insert(insert)
    .select('id')
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return fail("You've already RSVP'd for this event.");
    }
    console.error('[rsvp] insert failed', error);
    return fail('We could not record your RSVP. Please try again.');
  }

  await logAudit({
    actorId: user?.id ?? null,
    actorEmail: user?.email ?? notifyEmail,
    action: 'rsvp.create',
    entityType: 'event_rsvp',
    entityId: row?.id,
    metadata: { eventId: event.id, partySize: data.partySize },
  });

  if (notifyEmail) {
    void sendEmail({
      to: notifyEmail,
      subject: `You're confirmed: ${event.title}`,
      html: emailLayout(
        "You're confirmed!",
        `<p>Dear ${notifyName},</p>
         <p>We've saved your RSVP for <strong>${event.title}</strong>.</p>
         <p><strong>When:</strong> ${formatDateTime(event.start_at)}<br/>
         ${event.venue ? `<strong>Where:</strong> ${event.venue}` : ''}</p>
         <p>Party size: ${data.partySize}</p>
         <p>We look forward to seeing you!<br/>New Life Tagum</p>`
      ),
    });
  }

  return succeed("You're confirmed! We've sent a confirmation if you provided an email.");
}

// ---------------------------------------------------------------------------
// 3. Comment (members only)
// ---------------------------------------------------------------------------

export async function submitCommentAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = commentSchema.safeParse({
    postId: rawString(formData, 'postId'),
    body: rawString(formData, 'body'),
    website: rawString(formData, 'website'),
  });

  if (!parsed.success) {
    return fail('Please check your comment and try again.', zodFieldErrors(parsed.error));
  }
  const data = parsed.data;

  const ipHash = await currentIpHash();
  if (!rateLimit(`comment:${ipHash}`, 5, 10 * 60 * 1000).success) {
    return fail('You are commenting too quickly. Please wait a moment.');
  }

  const user = await getCurrentUser();
  if (!user) return fail('Please sign in to comment.');

  const supabase = await createClient();

  const { data: post } = await supabase
    .from('posts')
    .select('id, slug, comments_enabled')
    .eq('id', data.postId)
    .maybeSingle();

  if (!post) return fail('This post could not be found.');
  if (!post.comments_enabled) return fail('Comments are closed for this post.');

  const { error } = await supabase.from('comments').insert({
    post_id: data.postId,
    author_id: user.id,
    body: data.body,
    ip_hash: ipHash,
  });

  if (error) {
    console.error('[comment] insert failed', error);
    return fail('We could not submit your comment. Please try again.');
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'comment.submit',
    entityType: 'comment',
    entityId: data.postId,
    metadata: { postId: data.postId },
  });

  if (post.slug) revalidatePath(`/posts/${post.slug}`);

  return succeed('Your comment was submitted and is awaiting moderation.');
}

// ---------------------------------------------------------------------------
// 4. Connection form (dynamic)
// ---------------------------------------------------------------------------

export async function submitConnectionFormAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const envelope = connectionSubmissionBase.safeParse({
    formId: rawString(formData, 'formId'),
    website: rawString(formData, 'website'),
  });
  if (!envelope.success) {
    return fail('Please check the form and try again.', zodFieldErrors(envelope.error));
  }

  const ipHash = await currentIpHash();
  if (!rateLimit(`form:${ipHash}`, 8, 60 * 60 * 1000).success) {
    return fail('Too many submissions from this connection. Please try again later.');
  }

  const service = createServiceRoleClient();
  const { data: form } = await service
    .from('connection_forms')
    .select('*')
    .eq('id', envelope.data.formId)
    .maybeSingle<ConnectionFormRow>();

  if (!form) return fail('This form could not be found.');
  if (!form.enabled) return fail('This form is no longer accepting submissions.');

  const { data: fields } = await service
    .from('connection_form_fields')
    .select('*')
    .eq('form_id', form.id)
    .order('position');

  const fieldDefs = (fields ?? []) as ConnectionFormFieldRow[];

  const record: Record<string, unknown> = {};
  const fieldErrors: Record<string, string> = {};

  for (const field of fieldDefs) {
    const raw = formData.get(field.field_key);
    const value = typeof raw === 'string' ? raw.trim() : '';

    if (field.field_type === 'checkbox' || field.field_type === 'consent') {
      const checked = raw === 'on' || raw === 'true';
      if ((field.required || field.field_type === 'consent') && !checked) {
        fieldErrors[field.field_key] = field.field_type === 'consent'
          ? 'Please provide your consent to continue.'
          : `${field.label} is required.`;
      }
      record[field.field_key] = checked;
      continue;
    }

    if (field.required && !value) {
      fieldErrors[field.field_key] = `${field.label} is required.`;
    }

    if (field.field_type === 'email' && value) {
      const ok = emailSchema.safeParse(value).success;
      if (!ok) fieldErrors[field.field_key] = 'Enter a valid email.';
    }

    record[field.field_key] = value;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return fail('Please correct the highlighted fields.', fieldErrors);
  }

  const user = await getCurrentUser();

  if (form.store_submissions) {
    const { error } = await service.from('connection_form_submissions').insert({
      form_id: form.id,
      profile_id: user?.id ?? null,
      data: record as never,
      ip_hash: ipHash,
    });
    if (error) {
      console.error('[connection-form] insert failed', error);
      return fail('We could not submit the form. Please try again.');
    }
  }

  if (form.recipient_email) {
    const rows = fieldDefs
      .filter((f) => f.field_type !== 'hidden')
      .map(
        (f) =>
          `<tr><td style="padding:4px 12px 4px 0;color:#8a8175">${f.label}</td><td style="padding:4px 0">${formatFieldValue(record[f.field_key])}</td></tr>`
      )
      .join('');
    void sendEmail({
      to: form.recipient_email,
      subject: `New submission: ${form.title}`,
      html: emailLayout(
        `New "${form.title}" submission`,
        `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>`
      ),
    });
  }

  await logAudit({
    actorId: user?.id ?? null,
    actorEmail: user?.email ?? null,
    action: 'form.submit',
    entityType: 'connection_form',
    entityId: form.id,
    metadata: { formSlug: form.slug },
  });

  return succeed(form.success_message || 'Thank you — your submission was received.');
}

function formatFieldValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value == null || value === '') return '—';
  return String(value);
}

// ---------------------------------------------------------------------------
// 5. Cancel RSVP (members)
// ---------------------------------------------------------------------------

export async function cancelRsvpAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const rsvpId = rawString(formData, 'rsvpId');
  if (!rsvpId) return fail('Missing RSVP reference.');

  const user = await getCurrentUser();
  if (!user) return fail('Please sign in to manage your RSVP.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('event_rsvps')
    .update({ status: 'cancelled' })
    .eq('id', rsvpId)
    .eq('profile_id', user.id);

  if (error) {
    console.error('[rsvp] cancel failed', error);
    return fail('We could not cancel your RSVP. Please try again.');
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'rsvp.cancel',
    entityType: 'event_rsvp',
    entityId: rsvpId,
  });

  return succeed('Your RSVP has been cancelled.');
}
