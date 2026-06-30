import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  type Actor,
  type ModulePermission,
  type Role,
  can,
  isAdmin,
  isStaffOrAbove,
  isSuperAdmin,
} from '@/lib/rbac';
import type { ProfileRow } from '@/types/database';

export interface CurrentUser {
  id: string;
  email: string;
  profile: ProfileRow;
  actor: Actor;
}

/**
 * Resolve the signed-in user + profile + module permissions. Cached per
 * request. Returns null when not signed in.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  let permissions: ModulePermission[] = [];
  if (profile.role === 'staff') {
    const { data: perms } = await supabase
      .from('staff_permissions')
      .select('module')
      .eq('profile_id', user.id);
    permissions = (perms ?? []).map((p) => p.module as ModulePermission);
  }

  const actor: Actor = {
    id: profile.id,
    role: profile.role as Role,
    permissions,
  };

  return { id: user.id, email: profile.email, profile, actor };
});

/** Redirect to login if not authenticated; returns the current user. */
export async function requireUser(redirectTo = '/admin'): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  return user;
}

/** Require a dashboard role (staff+). Members are sent to their account page. */
export async function requireDashboard(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!isStaffOrAbove(user.actor)) redirect('/account');
  return user;
}

/** Require access to a specific module; 403 otherwise. */
export async function requireModule(
  module: ModulePermission
): Promise<CurrentUser> {
  const user = await requireDashboard();
  if (!can(user.actor, module)) redirect('/admin?denied=' + module);
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireDashboard();
  if (!isAdmin(user.actor)) redirect('/admin?denied=admin');
  return user;
}

export async function requireSuperAdmin(): Promise<CurrentUser> {
  const user = await requireDashboard();
  if (!isSuperAdmin(user.actor)) redirect('/admin?denied=super');
  return user;
}

export { can, isAdmin, isSuperAdmin, isStaffOrAbove };
