'use server';

import { revalidatePath } from 'next/cache';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';
import { campaignInputSchema } from '@/lib/validations';
import {
  type ActionResult,
  fail,
  succeed,
  zodFieldErrors,
} from '@/lib/form';

function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === 'on' || fd.get(key) === 'true';
}

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v : '';
}

function num(fd: FormData, key: string): number {
  const v = Number(str(fd, key));
  return Number.isFinite(v) ? v : 0;
}

// ----- campaigns -----------------------------------------------------

export async function saveCampaignAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('pledge_campaigns');

  const id = str(formData, 'id');

  const parsed = campaignInputSchema.safeParse({
    title: str(formData, 'title'),
    slug: str(formData, 'slug'),
    descriptionHtml: str(formData, 'descriptionHtml'),
    goalAmount: str(formData, 'goalAmount') || null,
    startDate: str(formData, 'startDate'),
    endDate: str(formData, 'endDate'),
    status: str(formData, 'status') || 'upcoming',
    coverImageUrl: str(formData, 'coverImageUrl'),
    isFeatured: bool(formData, 'isFeatured'),
  });

  if (!parsed.success) {
    return fail('Please fix the errors below.', zodFieldErrors(parsed.error));
  }
  const v = parsed.data;

  const supabase = await createClient();

  const row = {
    title: v.title,
    slug: v.slug,
    description_html: v.descriptionHtml || null,
    goal_amount: v.goalAmount ?? null,
    start_date: v.startDate || null,
    end_date: v.endDate || null,
    status: v.status,
    cover_image_url: v.coverImageUrl || null,
    is_featured: v.isFeatured,
    position: num(formData, 'position'),
  };

  let entityId = id;
  if (id) {
    const { error } = await supabase
      .from('pledge_campaigns')
      .update(row)
      .eq('id', id);
    if (error) return fail(error.message);
  } else {
    const { data, error } = await supabase
      .from('pledge_campaigns')
      .insert(row)
      .select('id')
      .single();
    if (error) return fail(error.message);
    entityId = data.id;
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: id ? 'campaign.update' : 'campaign.create',
    entityType: 'pledge_campaign',
    entityId,
    metadata: { title: v.title },
  });

  revalidatePath('/admin/pledge-campaigns');
  return succeed(id ? 'Campaign updated.' : 'Campaign created.', {
    redirectTo: '/admin/pledge-campaigns',
  });
}

export async function deleteCampaignAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('pledge_campaigns');
  const id = str(formData, 'id');
  if (!id) return fail('Missing campaign id.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('pledge_campaigns')
    .delete()
    .eq('id', id);
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'campaign.delete',
    entityType: 'pledge_campaign',
    entityId: id,
  });

  revalidatePath('/admin/pledge-campaigns');
  return succeed('Campaign deleted.');
}

// ----- bank accounts -------------------------------------------------

export async function saveBankAccountAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('pledge_campaigns');

  const id = str(formData, 'id');
  const bankName = str(formData, 'bank_name').trim();
  const accountName = str(formData, 'account_name').trim();
  const accountNumber = str(formData, 'account_number').trim();

  const fieldErrors: Record<string, string> = {};
  if (!bankName) fieldErrors.bank_name = 'Bank name is required';
  if (!accountName) fieldErrors.account_name = 'Account name is required';
  if (!accountNumber) fieldErrors.account_number = 'Account number is required';
  if (Object.keys(fieldErrors).length > 0) {
    return fail('Please fix the errors below.', fieldErrors);
  }

  const supabase = await createClient();

  const row = {
    bank_name: bankName,
    account_name: accountName,
    account_number: accountNumber,
    instructions: str(formData, 'instructions').trim() || null,
    qr_image_url: str(formData, 'qr_image_url') || null,
    active: bool(formData, 'active'),
    position: num(formData, 'position'),
  };

  let entityId = id;
  if (id) {
    const { error } = await supabase
      .from('bank_accounts')
      .update(row)
      .eq('id', id);
    if (error) return fail(error.message);
  } else {
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert(row)
      .select('id')
      .single();
    if (error) return fail(error.message);
    entityId = data.id;
  }

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: id ? 'bank_account.update' : 'bank_account.create',
    entityType: 'bank_account',
    entityId,
    metadata: { bank_name: bankName },
  });

  revalidatePath('/admin/pledge-campaigns');
  return succeed(id ? 'Bank account updated.' : 'Bank account added.');
}

export async function deleteBankAccountAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('pledge_campaigns');
  const id = str(formData, 'id');
  if (!id) return fail('Missing bank account id.');

  const supabase = await createClient();
  const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'bank_account.delete',
    entityType: 'bank_account',
    entityId: id,
  });

  revalidatePath('/admin/pledge-campaigns');
  return succeed('Bank account deleted.');
}

export async function toggleBankActiveAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireModule('pledge_campaigns');
  const id = str(formData, 'id');
  if (!id) return fail('Missing bank account id.');
  const active = bool(formData, 'active');

  const supabase = await createClient();
  const { error } = await supabase
    .from('bank_accounts')
    .update({ active })
    .eq('id', id);
  if (error) return fail(error.message);

  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: 'bank_account.toggle_active',
    entityType: 'bank_account',
    entityId: id,
    metadata: { active },
  });

  revalidatePath('/admin/pledge-campaigns');
  return succeed(active ? 'Activated.' : 'Deactivated.');
}
