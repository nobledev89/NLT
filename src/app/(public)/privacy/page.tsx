import type { Metadata } from 'next';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { PageBySlug } from '@/components/blocks/page-by-slug';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('privacy');
  return loaded ? { ...pageMetadata(loaded.page), alternates: { canonical: '/privacy' } } : {};
}

export default function PrivacyPage() {
  return <PageBySlug slug="privacy" />;
}
