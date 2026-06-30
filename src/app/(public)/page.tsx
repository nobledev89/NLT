import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { BlockList } from '@/components/blocks/block-renderer';
import { getSiteSettings } from '@/lib/settings';
import { absoluteUrl } from '@/lib/utils';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('home');
  if (!loaded) return {};
  return { ...pageMetadata(loaded.page), alternates: { canonical: '/' } };
}

export default async function HomePage() {
  const loaded = await getPublishedPage('home');
  if (!loaded) notFound();

  const settings = await getSiteSettings();
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: settings.branding.churchName,
    description: settings.seo.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.contact.address,
      addressLocality: 'Tagum',
      addressRegion: 'Davao del Norte',
      addressCountry: 'PH',
    },
    url: absoluteUrl('/'),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <BlockList blocks={loaded.blocks} />
    </>
  );
}
