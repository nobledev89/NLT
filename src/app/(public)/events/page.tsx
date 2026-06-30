import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { createClient } from '@/lib/supabase/server';
import { PageHero, EmptyState } from '@/components/site/page-hero';
import { EventCard } from '@/components/site/content-cards';
import { cn } from '@/lib/utils';
import type { EventRow } from '@/types/database';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('events');
  return loaded
    ? { ...pageMetadata(loaded.page), alternates: { canonical: '/events' } }
    : { title: 'Events' };
}

type Filter = 'upcoming' | 'past' | 'all';

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const filter: Filter =
    sp.filter === 'past' || sp.filter === 'all' ? sp.filter : 'upcoming';
  const category = sp.category ?? '';

  const [loaded, supabase] = await Promise.all([
    getPublishedPage('events'),
    createClient(),
  ]);

  const nowIso = new Date().toISOString();

  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .eq('is_public', true)
    .is('deleted_at', null);

  if (filter === 'upcoming') {
    query = query.gte('start_at', nowIso).order('start_at', { ascending: true });
  } else if (filter === 'past') {
    query = query.lt('start_at', nowIso).order('start_at', { ascending: false });
  } else {
    query = query.order('start_at', { ascending: false });
  }

  if (category) query = query.eq('category', category);

  const { data } = await query;
  const events = (data ?? []) as EventRow[];

  // Distinct categories across public events for filter chips.
  const { data: catRows } = await supabase
    .from('events')
    .select('category')
    .eq('status', 'published')
    .eq('is_public', true)
    .is('deleted_at', null)
    .not('category', 'is', null);
  const categories = [
    ...new Set((catRows ?? []).map((r) => r.category).filter(Boolean) as string[]),
  ].sort();

  const filters: { key: Filter; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'all', label: 'All' },
  ];

  const buildHref = (next: Partial<{ filter: Filter; category: string }>) => {
    const params = new URLSearchParams();
    const f = next.filter ?? filter;
    const c = next.category ?? category;
    if (f !== 'upcoming') params.set('filter', f);
    if (c) params.set('category', c);
    const qs = params.toString();
    return qs ? `/events?${qs}` : '/events';
  };

  return (
    <>
      <PageHero
        eyebrow="What's happening"
        title={loaded?.page.title ?? 'Events'}
        subtitle={loaded?.page.seo_description ?? 'Find a gathering and join us.'}
      />

      <section className="section">
        <div className="container space-y-8">
          {/* Filter tabs */}
          <nav aria-label="Event time filter" className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <Link
                key={f.key}
                href={buildHref({ filter: f.key })}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                  filter === f.key
                    ? 'border-gold/50 bg-gold/15 text-gold'
                    : 'border-border text-muted-foreground hover:border-gold/40 hover:text-foreground'
                )}
              >
                {f.label}
              </Link>
            ))}
          </nav>

          {/* Category chips */}
          {categories.length > 0 && (
            <nav aria-label="Event category filter" className="flex flex-wrap gap-2">
              <Link
                href={buildHref({ category: '' })}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  !category
                    ? 'border-foreground/40 text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                All categories
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={buildHref({ category: c })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    category === c
                      ? 'border-foreground/40 text-foreground'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {c}
                </Link>
              ))}
            </nav>
          )}

          {events.length === 0 ? (
            <EmptyState
              title="No events to show"
              description={
                filter === 'upcoming'
                  ? 'There are no upcoming events right now. Check back soon.'
                  : 'No events match this filter.'
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
