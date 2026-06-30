import type { Metadata } from 'next';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { PageBySlug } from '@/components/blocks/page-by-slug';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('mission-vision');
  return loaded ? { ...pageMetadata(loaded.page), alternates: { canonical: '/mission-vision' } } : {};
}

export default function MissionVisionPage() {
  return <PageBySlug slug="mission-vision" />;
}
