import { describe, it, expect } from 'vitest';
import {
  can,
  isAdmin,
  isSuperAdmin,
  isStaffOrAbove,
  canManageUser,
  assignableRoles,
  canAccessSection,
  type Actor,
} from './rbac';

const superAdmin: Actor = { id: '1', role: 'super_admin', permissions: [] };
const admin: Actor = { id: '2', role: 'admin', permissions: [] };
const staffPosts: Actor = { id: '3', role: 'staff', permissions: ['posts', 'comments'] };
const member: Actor = { id: '4', role: 'member', permissions: [] };

describe('rbac role checks', () => {
  it('identifies super admin and admin', () => {
    expect(isSuperAdmin(superAdmin)).toBe(true);
    expect(isSuperAdmin(admin)).toBe(false);
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(superAdmin)).toBe(true);
    expect(isAdmin(staffPosts)).toBe(false);
  });

  it('treats staff and above as dashboard users', () => {
    expect(isStaffOrAbove(staffPosts)).toBe(true);
    expect(isStaffOrAbove(member)).toBe(false);
  });
});

describe('module access (can)', () => {
  it('grants admins every module implicitly', () => {
    expect(can(admin, 'pledge_submissions')).toBe(true);
    expect(can(superAdmin, 'merch')).toBe(true);
  });

  it('grants staff only their explicit modules', () => {
    expect(can(staffPosts, 'posts')).toBe(true);
    expect(can(staffPosts, 'comments')).toBe(true);
    expect(can(staffPosts, 'pledge_submissions')).toBe(false);
  });

  it('denies members all modules', () => {
    expect(can(member, 'posts')).toBe(false);
  });
});

describe('section access', () => {
  it('restricts settings/navigation to super admin', () => {
    expect(canAccessSection(superAdmin, 'settings')).toBe(true);
    expect(canAccessSection(admin, 'settings')).toBe(false);
    expect(canAccessSection(admin, 'navigation')).toBe(false);
  });
  it('restricts users/audit to admins', () => {
    expect(canAccessSection(admin, 'users')).toBe(true);
    expect(canAccessSection(staffPosts, 'users')).toBe(false);
    expect(canAccessSection(admin, 'audit_log')).toBe(true);
  });
});

describe('user management rules', () => {
  it('lets super admin manage anyone', () => {
    expect(canManageUser(superAdmin, 'super_admin')).toBe(true);
    expect(canManageUser(superAdmin, 'admin')).toBe(true);
  });

  it('blocks admin from managing super admins or admins', () => {
    expect(canManageUser(admin, 'super_admin')).toBe(false);
    expect(canManageUser(admin, 'admin')).toBe(false);
    expect(canManageUser(admin, 'staff')).toBe(true);
    expect(canManageUser(admin, 'member')).toBe(true);
  });

  it('limits assignable roles per actor', () => {
    expect(assignableRoles(superAdmin)).toContain('super_admin');
    expect(assignableRoles(admin)).toEqual(['staff', 'member']);
    expect(assignableRoles(member)).toEqual([]);
  });
});
