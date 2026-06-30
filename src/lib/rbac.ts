/**
 * Role-Based Access Control.
 *
 * Roles (no read-only role):
 *  - super_admin: everything, including platform/integration settings & user roles
 *  - admin: full operational content access; manages staff but not super admins
 *  - staff: access limited to granted module permissions
 *  - member: public account only, never the dashboard
 *
 * Module permissions are the checkbox grid shown when an Admin edits a Staff
 * account. super_admin and admin implicitly hold every module permission.
 */

export const ROLES = ['super_admin', 'admin', 'staff', 'member'] as const;
export type Role = (typeof ROLES)[number];

export const DASHBOARD_ROLES: Role[] = ['super_admin', 'admin', 'staff'];

export const MODULE_PERMISSIONS = [
  'pages',
  'posts',
  'comments',
  'services',
  'events',
  'event_rsvps',
  'ministries',
  'pledge_campaigns',
  'pledge_submissions',
  'connection_forms',
  'form_submissions',
  'merch',
  'media',
] as const;

export type ModulePermission = (typeof MODULE_PERMISSIONS)[number];

export const MODULE_LABELS: Record<ModulePermission, string> = {
  pages: 'Pages & Landing Content',
  posts: 'Posts',
  comments: 'Comment Moderation',
  services: 'Services & Sermons',
  events: 'Events',
  event_rsvps: 'Event RSVPs',
  ministries: 'Ministries',
  pledge_campaigns: 'Pledge Campaigns',
  pledge_submissions: 'Pledge Submissions',
  connection_forms: 'Get Connected Forms',
  form_submissions: 'Form Submissions',
  merch: 'Merch Catalog',
  media: 'Media Library',
};

/** Sections only super_admin can reach. */
export const SUPER_ADMIN_ONLY_SECTIONS = ['settings', 'navigation', 'integrations'] as const;

/** Sections admins and super admins reach (staff never do). */
export const ADMIN_ONLY_SECTIONS = ['users', 'audit_log'] as const;

export interface Actor {
  id: string;
  role: Role;
  permissions: ModulePermission[];
}

export function isSuperAdmin(actor: Pick<Actor, 'role'>): boolean {
  return actor.role === 'super_admin';
}

export function isAdmin(actor: Pick<Actor, 'role'>): boolean {
  return actor.role === 'admin' || actor.role === 'super_admin';
}

export function isStaffOrAbove(actor: Pick<Actor, 'role'>): boolean {
  return DASHBOARD_ROLES.includes(actor.role);
}

/** Does the actor have access to a given content module? */
export function can(actor: Actor, module: ModulePermission): boolean {
  if (isAdmin(actor)) return true; // admin + super_admin: all modules
  if (actor.role === 'staff') return actor.permissions.includes(module);
  return false;
}

/** Can the actor reach a non-module dashboard section? */
export function canAccessSection(actor: Pick<Actor, 'role'>, section: string): boolean {
  if ((SUPER_ADMIN_ONLY_SECTIONS as readonly string[]).includes(section)) {
    return isSuperAdmin(actor);
  }
  if ((ADMIN_ONLY_SECTIONS as readonly string[]).includes(section)) {
    return isAdmin(actor);
  }
  return isStaffOrAbove(actor);
}

/**
 * Can `actor` modify the account of `target`?
 * - super_admin can manage anyone.
 * - admin can manage staff/members, but NOT super_admins (and not other admins'
 *   roles upward); admin cannot create/destroy super_admins.
 */
export function canManageUser(actor: Pick<Actor, 'role'>, targetRole: Role): boolean {
  if (isSuperAdmin(actor)) return true;
  if (actor.role === 'admin') {
    return targetRole === 'staff' || targetRole === 'member';
  }
  return false;
}

/** Roles an actor is allowed to assign when inviting/editing users. */
export function assignableRoles(actor: Pick<Actor, 'role'>): Role[] {
  if (isSuperAdmin(actor)) return ['super_admin', 'admin', 'staff', 'member'];
  if (actor.role === 'admin') return ['staff', 'member'];
  return [];
}
