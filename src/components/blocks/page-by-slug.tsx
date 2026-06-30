import { notFound } from 'next/navigation';
import { getPublishedPage } from '@/lib/pages';
import { BlockList } from './block-renderer';

/** Renders a CMS page (by slug) as its ordered blocks, or 404s. */
export async function PageBySlug({ slug }: { slug: string }) {
  const loaded = await getPublishedPage(slug);
  if (!loaded) notFound();
  return <BlockList blocks={loaded.blocks} />;
}
