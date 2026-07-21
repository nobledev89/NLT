import type { Metadata } from 'next';
import { Radio } from 'lucide-react';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { getSiteSettings } from '@/lib/settings';
import { createClient } from '@/lib/supabase/server';
import { PageHero } from '@/components/site/page-hero';
import { ScheduleList } from '@/components/site/content-cards';
import { VideoEmbed } from '@/components/site/video-embed';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SermonGrid, type SermonCardData } from './sermon-grid';
import type {
  ServiceScheduleRow,
  SermonRow,
  SermonSeriesRow,
} from '@/types/database';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('services');
  return loaded
    ? { ...pageMetadata(loaded.page), alternates: { canonical: '/services' } }
    : { title: 'Services' };
}

export default async function ServicesPage() {
  const [loaded, settings, supabase] = await Promise.all([
    getPublishedPage('services'),
    getSiteSettings(),
    createClient(),
  ]);

  const todayIso = new Date().toISOString().slice(0, 10);

  const [{ data: schedules }, { data: sermons }, { data: series }] = await Promise.all([
    supabase
      .from('service_schedules')
      .select('*')
      .eq('published', true)
      .order('position'),
    supabase
      .from('sermons')
      .select('*')
      .eq('published', true)
      .order('preached_on', { ascending: false }),
    supabase.from('sermon_series').select('*'),
  ]);

  const allSchedules = (schedules ?? []) as ServiceScheduleRow[];
  const recurring = allSchedules.filter((s) => !s.is_special);
  const special = allSchedules
    .filter((s) => s.is_special && s.special_date && s.special_date >= todayIso)
    .sort((a, b) => (a.special_date ?? '').localeCompare(b.special_date ?? ''));

  const allSermons = (sermons ?? []) as SermonRow[];
  const seriesList = (series ?? []) as SermonSeriesRow[];
  const seriesById = new Map(seriesList.map((s) => [s.id, s]));

  const toCard = (s: SermonRow): SermonCardData => ({
    id: s.id,
    title: s.title,
    speaker: s.speaker,
    preachedOn: s.preached_on,
    videoUrl: s.video_url,
    thumbnailUrl: s.thumbnail_url,
  });

  // Group sermons by series; ungrouped first.
  const ungrouped = allSermons.filter((s) => !s.series_id || !seriesById.has(s.series_id));
  const grouped = new Map<string, SermonRow[]>();
  for (const s of allSermons) {
    if (s.series_id && seriesById.has(s.series_id)) {
      const arr = grouped.get(s.series_id) ?? [];
      arr.push(s);
      grouped.set(s.series_id, arr);
    }
  }

  const live = settings.live;
  const liveUrl = live.watchUrl;

  return (
    <>
      <PageHero
        eyebrow="Gather with us"
        title={loaded?.page.title ?? 'Services'}
        subtitle={loaded?.page.seo_description ?? settings.serviceSummary.text}
      />

      {/* Live banner */}
      {live.isLive && liveUrl && (
        <section className="section">
          <div className="container">
            <div className="rounded-3xl border border-brand/40 bg-gradient-to-br from-secondary/40 to-card p-6 md:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <Badge variant="danger" className="gap-1.5">
                  <Radio className="h-3.5 w-3.5 animate-pulse" /> Live now
                </Badge>
                <h2 className="text-2xl font-serif font-medium">We&apos;re live now</h2>
                <Button asChild className="ml-auto" size="sm">
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                    Watch live
                  </a>
                </Button>
              </div>
              <VideoEmbed url={liveUrl} title="Live stream" />
            </div>
          </div>
        </section>
      )}

      {/* Configured (not-live) embed */}
      {!live.isLive && liveUrl && (
        <section className="section">
          <div className="container max-w-4xl">
            <p className="eyebrow mb-3">Watch online</p>
            <h2 className="mb-6 text-2xl font-serif font-medium">Join our livestream</h2>
            <VideoEmbed url={liveUrl} title="Service stream" />
          </div>
        </section>
      )}

      {/* Schedules */}
      <section className="section">
        <div className="container">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="eyebrow">When we meet</p>
            <h2 className="mt-2 text-3xl font-serif font-medium">Weekly Gatherings</h2>
          </div>
          <ScheduleList schedules={recurring} />

          {special.length > 0 && (
            <div className="mx-auto mt-12 max-w-3xl">
              <h3 className="mb-4 text-center text-xl font-serif font-medium">Special Services</h3>
              <ScheduleList schedules={special} />
            </div>
          )}
        </div>
      </section>

      {/* Sermons */}
      {allSermons.length > 0 && (
        <section className="section border-t border-border/60">
          <div className="container">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="eyebrow">Revisit the Word</p>
              <h2 className="mt-2 text-3xl font-serif font-medium">Previous Messages</h2>
            </div>

            {ungrouped.length > 0 && (
              <div className="mb-12">
                <SermonGrid sermons={ungrouped.map(toCard)} />
              </div>
            )}

            {[...grouped.entries()].map(([seriesId, items]) => {
              const s = seriesById.get(seriesId)!;
              return (
                <div key={seriesId} className="mb-12">
                  <div className="mb-5">
                    <Separator className="mb-5" />
                    <p className="eyebrow">Series</p>
                    <h3 className="mt-1 text-2xl font-serif font-medium">{s.title}</h3>
                    {s.description && (
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{s.description}</p>
                    )}
                  </div>
                  <SermonGrid sermons={items.map(toCard)} />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
