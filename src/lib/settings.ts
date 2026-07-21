import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export interface SiteSettings {
  branding: {
    churchName: string;
    tagline: string;
    logoUrl: string | null;
    accentColor: string;
  };
  contact: {
    address: string;
    email: string;
    phone: string;
    mapsDirectionsUrl: string;
  };
  socials: { facebook: string; youtube: string; instagram: string };
  serviceSummary: { text: string };
  live: { isLive: boolean; watchUrl: string };
  seo: { defaultTitle: string; titleTemplate: string; description: string };
}

const DEFAULTS: SiteSettings = {
  branding: {
    churchName: 'New Life Tagum',
    tagline: 'A welcoming family of faith in the heart of Tagum.',
    logoUrl: null,
    accentColor: 'brand',
  },
  contact: {
    address: '1489 Manuel B. Suaybaguio Sr. St, Tagum, Davao del Norte',
    email: '',
    phone: '',
    mapsDirectionsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=1489+Manuel+B.+Suaybaguio+Sr.+St,+Tagum,+Davao+del+Norte',
  },
  socials: { facebook: '', youtube: '', instagram: '' },
  serviceSummary: { text: 'Sunday Worship — see Services for times.' },
  live: { isLive: false, watchUrl: '' },
  seo: {
    defaultTitle: 'New Life Tagum',
    titleTemplate: '%s · New Life Tagum',
    description:
      'New Life Tagum — a welcoming, Christ-centered community in Tagum, Davao del Norte.',
  },
};

/**
 * Load all site settings, merged over sane defaults so the site renders even
 * before Supabase is seeded or configured. Cached per request.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('site_settings').select('key, value');
    if (!data) return DEFAULTS;
    const map = new Map(data.map((r) => [r.key, r.value as Record<string, unknown>]));
    return {
      branding: { ...DEFAULTS.branding, ...(map.get('branding') ?? {}) },
      contact: { ...DEFAULTS.contact, ...(map.get('contact') ?? {}) },
      socials: { ...DEFAULTS.socials, ...(map.get('socials') ?? {}) },
      serviceSummary: { ...DEFAULTS.serviceSummary, ...(map.get('serviceSummary') ?? {}) },
      live: { ...DEFAULTS.live, ...(map.get('live') ?? {}) },
      seo: { ...DEFAULTS.seo, ...(map.get('seo') ?? {}) },
    } as SiteSettings;
  } catch {
    return DEFAULTS;
  }
});
