import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { NavigationItemRow } from '@/types/database';

export interface NavNode {
  id: string;
  label: string;
  href: string | null;
  children: { id: string; label: string; href: string }[];
}

/** Fallback header used before navigation is seeded / if the DB is empty. */
const FALLBACK_HEADER: NavNode[] = [
  { id: 'home', label: 'Home', href: '/', children: [] },
  {
    id: 'about',
    label: 'About',
    href: null,
    children: [
      { id: 'who', label: 'Who We Are', href: '/who-we-are' },
      { id: 'mv', label: 'Mission & Vision', href: '/mission-vision' },
    ],
  },
  { id: 'services', label: 'Services', href: '/services', children: [] },
  { id: 'events', label: 'Events', href: '/events', children: [] },
  { id: 'ministries', label: 'Ministries', href: '/ministries', children: [] },
  {
    id: 'more',
    label: 'More',
    href: null,
    children: [
      { id: 'posts', label: 'Posts', href: '/posts' },
      { id: 'pledge', label: 'Pledge', href: '/pledge' },
      { id: 'merch', label: 'Merch', href: '/merch' },
    ],
  },
];

const FALLBACK_FOOTER = [
  { id: 'visit', label: 'Plan Your Visit', href: '/get-connected' },
  { id: 'services', label: 'Services', href: '/services' },
  { id: 'events', label: 'Events', href: '/events' },
  { id: 'ministries', label: 'Ministries', href: '/ministries' },
  { id: 'posts', label: 'Posts', href: '/posts' },
  { id: 'give', label: 'Give', href: '/pledge' },
];

function buildTree(rows: NavigationItemRow[]): NavNode[] {
  const tops = rows
    .filter((r) => !r.parent_id)
    .sort((a, b) => a.position - b.position);
  return tops.map((t) => ({
    id: t.id,
    label: t.label,
    href: t.href,
    children: rows
      .filter((r) => r.parent_id === t.id && r.href)
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ id: c.id, label: c.label, href: c.href as string })),
  }));
}

export const getNavigation = cache(async () => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('navigation_items')
      .select('*')
      .eq('visible', true);

    if (!data || data.length === 0) {
      return { header: FALLBACK_HEADER, footerQuick: FALLBACK_FOOTER };
    }

    const header = buildTree(data.filter((r) => r.location === 'header'));
    const footerQuick = data
      .filter((r) => r.location === 'footer_quick' && r.href)
      .sort((a, b) => a.position - b.position)
      .map((r) => ({ id: r.id, label: r.label, href: r.href as string }));

    return {
      header: header.length ? header : FALLBACK_HEADER,
      footerQuick: footerQuick.length ? footerQuick : FALLBACK_FOOTER,
    };
  } catch {
    return { header: FALLBACK_HEADER, footerQuick: FALLBACK_FOOTER };
  }
});
