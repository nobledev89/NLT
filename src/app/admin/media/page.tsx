import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { MediaManager } from './media-manager';
import type { MediaAssetRow } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  await requireModule('media');
  const supabase = await createClient();

  const { data } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });

  const assets = (data as MediaAssetRow[]) ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Media library"
        description={`${assets.length} image${assets.length === 1 ? '' : 's'} in the library.`}
      />
      <MediaManager assets={assets} />
    </div>
  );
}
