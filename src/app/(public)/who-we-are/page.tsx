import type { Metadata } from 'next';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { PageBySlug } from '@/components/blocks/page-by-slug';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('who-we-are');
  return loaded ? { ...pageMetadata(loaded.page), alternates: { canonical: '/who-we-are' } } : {};
}

export default function WhoWeArePage() {
  return <PageBySlug slug="who-we-are" />;
}
