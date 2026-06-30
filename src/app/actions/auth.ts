'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { loginSchema, registerSchema, resetRequestSchema, profileSchema } from '@/lib/validations';
import { type ActionResult, fail, succeed, zodFieldErrors } from '@/lib/form';
import { rateLimit, currentIpHash } from '@/lib/rate-limit';
import { getCurrentUser } from '@/lib/auth';

export async function signInAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return fail('Please check the form.', zodFieldErrors(parsed.error));

  const limit = rateLimit(`login:${await currentIpHash()}`, 8, 10 * 60_000);
  if (!limit.success) return fail('Too many attempts. Please try again later.');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return fail('Invalid email or password.');

  const redirectTo = (formData.get('redirect') as string) || '/account';
  return succeed(undefined, { redirectTo });
}

export async function signUpAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return fail('Please check the form.', zodFieldErrors(parsed.error));

  const limit = rateLimit(`signup:${await currentIpHash()}`, 5, 60 * 60_000);
  if (!limit.success) return fail('Too many attempts. Please try again later.');

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${env.siteUrl()}/auth/callback`,
    },
  });
  if (error) return fail(error.message);

  return succeed('Check your email to verify your account, then sign in.');
}

export async function requestPasswordResetAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return fail('Enter a valid email.', zodFieldErrors(parsed.error));

  const limit = rateLimit(`reset:${await currentIpHash()}`, 5, 60 * 60_000);
  if (!limit.success) return fail('Too many attempts. Please try again later.');

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.siteUrl()}/auth/callback?next=/account/reset-password`,
  });
  // Always report success to avoid leaking which emails exist.
  return succeed('If that email exists, a reset link is on its way.');
}

export async function updatePasswordAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const password = String(formData.get('password') ?? '');
  if (password.length < 8) return fail('Use at least 8 characters.', { password: 'Too short' });

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail(error.message);
  return succeed('Password updated.', { redirectTo: '/account' });
}

export async function updateProfileAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail('You must be signed in.');

  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    phone: formData.get('phone'),
    bio: formData.get('bio'),
  });
  if (!parsed.success) return fail('Please check the form.', zodFieldErrors(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      bio: parsed.data.bio || null,
    })
    .eq('id', user.id);
  if (error) return fail(error.message);

  revalidatePath('/account');
  return succeed('Profile updated.');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
