import {
  LayoutDashboard,
  FileText,
  Newspaper,
  MessageSquare,
  Radio,
  CalendarDays,
  ClipboardList,
  HeartHandshake,
  HandCoins,
  Receipt,
  Inbox,
  MailOpen,
  ShoppingBag,
  ImageIcon,
  Users,
  Menu,
  Settings,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';
import { type Actor, can, isAdmin, isSuperAdmin, type ModulePermission } from '@/lib/rbac';

type Requirement =
  | { kind: 'always' }
  | { kind: 'module'; module: ModulePermission }
  | { kind: 'admin' }
  | { kind: 'super' };

export interface AdminSection {
  label: string;
  href: string;
  icon: LucideIcon;
  requirement: Requirement;
  group: 'main' | 'content' | 'people' | 'system';
}

export const ADMIN_SECTIONS: AdminSection[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard, requirement: { kind: 'always' }, group: 'main' },

  { label: 'Pages', href: '/admin/pages', icon: FileText, requirement: { kind: 'module', module: 'pages' }, group: 'content' },
  { label: 'Posts', href: '/admin/posts', icon: Newspaper, requirement: { kind: 'module', module: 'posts' }, group: 'content' },
  { label: 'Comments', href: '/admin/comments', icon: MessageSquare, requirement: { kind: 'module', module: 'comments' }, group: 'content' },
  { label: 'Services & Sermons', href: '/admin/services', icon: Radio, requirement: { kind: 'module', module: 'services' }, group: 'content' },
  { label: 'Events', href: '/admin/events', icon: CalendarDays, requirement: { kind: 'module', module: 'events' }, group: 'content' },
  { label: 'RSVPs', href: '/admin/rsvps', icon: ClipboardList, requirement: { kind: 'module', module: 'event_rsvps' }, group: 'content' },
  { label: 'Ministries', href: '/admin/ministries', icon: HeartHandshake, requirement: { kind: 'module', module: 'ministries' }, group: 'content' },
  { label: 'Pledge Campaigns', href: '/admin/pledge-campaigns', icon: HandCoins, requirement: { kind: 'module', module: 'pledge_campaigns' }, group: 'content' },
  { label: 'Pledge Submissions', href: '/admin/pledge-submissions', icon: Receipt, requirement: { kind: 'module', module: 'pledge_submissions' }, group: 'content' },
  { label: 'Get Connected Forms', href: '/admin/forms', icon: Inbox, requirement: { kind: 'module', module: 'connection_forms' }, group: 'content' },
  { label: 'Form Submissions', href: '/admin/form-submissions', icon: MailOpen, requirement: { kind: 'module', module: 'form_submissions' }, group: 'content' },
  { label: 'Merch', href: '/admin/merch', icon: ShoppingBag, requirement: { kind: 'module', module: 'merch' }, group: 'content' },
  { label: 'Media Library', href: '/admin/media', icon: ImageIcon, requirement: { kind: 'module', module: 'media' }, group: 'content' },

  { label: 'Users & Staff', href: '/admin/users', icon: Users, requirement: { kind: 'admin' }, group: 'people' },

  { label: 'Navigation', href: '/admin/navigation', icon: Menu, requirement: { kind: 'super' }, group: 'system' },
  { label: 'Site Settings', href: '/admin/settings', icon: Settings, requirement: { kind: 'super' }, group: 'system' },
  { label: 'Audit Log', href: '/admin/audit', icon: ScrollText, requirement: { kind: 'admin' }, group: 'system' },
];

export const GROUP_LABELS: Record<AdminSection['group'], string> = {
  main: '',
  content: 'Content',
  people: 'People',
  system: 'System',
};

/** Filter sections to those the actor may access. */
export function visibleSections(actor: Actor): AdminSection[] {
  return ADMIN_SECTIONS.filter((s) => {
    switch (s.requirement.kind) {
      case 'always':
        return true;
      case 'module':
        return can(actor, s.requirement.module);
      case 'admin':
        return isAdmin(actor);
      case 'super':
        return isSuperAdmin(actor);
    }
  });
}
