'use client';

import * as React from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { parseVideoUrl } from '@/lib/video';

/**
 * Privacy-friendly lazy video embed: shows a poster/facade and only loads the
 * provider iframe after the user clicks play. Uses youtube-nocookie.
 */
export function VideoEmbed({
  url,
  title,
  poster,
}: {
  url: string;
  title?: string;
  poster?: string;
}) {
  const [active, setActive] = React.useState(false);
  const video = React.useMemo(() => parseVideoUrl(url), [url]);
  const thumb = poster ?? video.thumbnailUrl;

  if (!video.embedUrl) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted text-sm text-muted-foreground">
        Add a valid video URL
      </div>
    );
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        aria-label={`Play${title ? `: ${title}` : ' video'}`}
        className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted"
      >
        {thumb ? (
          <Image src={thumb} alt={title ?? 'Video thumbnail'} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background" />
        )}
        <span className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand text-background shadow-lg transition-transform group-hover:scale-110">
          <Play className="h-7 w-7 translate-x-0.5 fill-current" />
        </span>
      </button>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-border">
      <iframe
        src={`${video.embedUrl}?autoplay=1`}
        title={title ?? 'Video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
        loading="lazy"
      />
    </div>
  );
}
