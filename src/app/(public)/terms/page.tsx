import type { Metadata } from 'next';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { PageBySlug } from '@/components/blocks/page-by-slug';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('terms');
  return loaded ? { ...pageMetadata(loaded.page), alternates: { canonical: '/terms' } } : {};
}

export default function TermsPage() {
  return <PageBySlug slug="terms" />;
}
