import type { Metadata } from 'next';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { createClient } from '@/lib/supabase/server';
import { PageHero, EmptyState } from '@/components/site/page-hero';
import { MinistryCard } from '@/components/site/content-cards';
import type { MinistryRow } from '@/types/database';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('ministries');
  return loaded
    ? { ...pageMetadata(loaded.page), alternates: { canonical: '/ministries' } }
    : { title: 'Ministries' };
}

export default async function MinistriesPage() {
  const [loaded, supabase] = await Promise.all([
    getPublishedPage('ministries'),
    createClient(),
  ]);

  const { data } = await supabase
    .from('ministries')
    .select('*')
    .eq('published', true)
    .order('position');
  const ministries = (data ?? []) as MinistryRow[];

  return (
    <>
      <PageHero
        eyebrow="Get involved"
        title={loaded?.page.title ?? 'Ministries'}
        subtitle={
          loaded?.page.seo_description ?? 'Discover a place to belong, grow, and serve.'
        }
      />

      <section className="section">
        <div className="container">
          {ministries.length === 0 ? (
            <EmptyState
              title="Ministries coming soon"
              description="We're preparing details about our ministries. Check back shortly."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ministries.map((m) => (
                <MinistryCard key={m.id} ministry={m} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
