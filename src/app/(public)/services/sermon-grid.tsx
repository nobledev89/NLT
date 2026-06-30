'use client';

import * as React from 'react';
import { Play } from 'lucide-react';
import Image from 'next/image';
import { VideoEmbed } from '@/components/site/video-embed';
import { parseVideoUrl } from '@/lib/video';
import { formatDate } from '@/lib/utils';

export interface SermonCardData {
  id: string;
  title: string;
  speaker: string | null;
  preachedOn: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
}

function SermonCard({ sermon }: { sermon: SermonCardData }) {
  const [active, setActive] = React.useState(false);
  const thumb =
    sermon.thumbnailUrl ??
    (sermon.videoUrl ? parseVideoUrl(sermon.videoUrl).thumbnailUrl : null);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card/50">
      {sermon.videoUrl && active ? (
        <VideoEmbed url={sermon.videoUrl} title={sermon.title} poster={thumb ?? undefined} />
      ) : sermon.videoUrl ? (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={`Play sermon: ${sermon.title}`}
          className="group relative flex aspect-video w-full items-center justify-center overflow-hidden bg-muted"
        >
          {thumb ? (
            <Image
              src={thumb}
              alt={sermon.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background" />
          )}
          <span className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gold text-background shadow-lg transition-transform group-hover:scale-110">
            <Play className="h-6 w-6 translate-x-0.5 fill-current" />
          </span>
        </button>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-secondary to-background text-muted-foreground">
          <span className="font-serif text-2xl opacity-40">NL</span>
        </div>
      )}
      <div className="space-y-1.5 p-5">
        <h3 className="text-base font-semibold leading-tight">{sermon.title}</h3>
        <p className="text-sm text-muted-foreground">
          {sermon.speaker}
          {sermon.speaker && sermon.preachedOn ? ' · ' : ''}
          {sermon.preachedOn ? formatDate(sermon.preachedOn) : ''}
        </p>
      </div>
    </article>
  );
}

export function SermonGrid({ sermons }: { sermons: SermonCardData[] }) {
  if (sermons.length === 0) return null;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sermons.map((s) => (
        <SermonCard key={s.id} sermon={s} />
      ))}
    </div>
  );
}
