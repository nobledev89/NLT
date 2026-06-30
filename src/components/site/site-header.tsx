import { getNavigation } from '@/lib/navigation';
import { getSiteSettings } from '@/lib/settings';
import { getCurrentUser } from '@/lib/auth';
import { isStaffOrAbove } from '@/lib/rbac';
import { HeaderNav } from './header-nav';

/**
 * Server component shell for the public site header. Loads navigation, brand,
 * live status, and the viewer's role, then hands rendering to the client
 * HeaderNav (which owns the desktop dropdowns + mobile drawer).
 */
export async function SiteHeader() {
  const [{ header }, settings, user] = await Promise.all([
    getNavigation(),
    getSiteSettings(),
    getCurrentUser(),
  ]);

  const isLive = Boolean(settings.live.isLive && settings.live.watchUrl);

  return (
    <HeaderNav
      nav={header}
      churchName={settings.branding.churchName}
      logoUrl={settings.branding.logoUrl}
      isLive={isLive}
      watchUrl={settings.live.watchUrl}
      isSignedIn={Boolean(user)}
      isStaff={user ? isStaffOrAbove(user.actor) : false}
    />
  );
}
