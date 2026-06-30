export interface ParsedVideo {
  provider: 'youtube' | 'facebook' | 'vimeo' | 'unknown';
  id: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  watchUrl: string;
}

/** Parse a YouTube / Facebook / Vimeo URL into embed + thumbnail info. */
export function parseVideoUrl(url: string): ParsedVideo {
  const watchUrl = url;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    // YouTube
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? null;
      return yt(id, watchUrl);
    }
    if (host === 'youtu.be') {
      return yt(u.pathname.slice(1) || null, watchUrl);
    }

    // Vimeo
    if (host === 'vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean)[0] ?? null;
      return {
        provider: 'vimeo',
        id,
        embedUrl: id ? `https://player.vimeo.com/video/${id}` : null,
        thumbnailUrl: null,
        watchUrl,
      };
    }

    // Facebook (must be embedded via the plugin URL)
    if (host.endsWith('facebook.com') || host === 'fb.watch') {
      return {
        provider: 'facebook',
        id: null,
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`,
        thumbnailUrl: null,
        watchUrl,
      };
    }
  } catch {
    /* fall through */
  }
  return { provider: 'unknown', id: null, embedUrl: null, thumbnailUrl: null, watchUrl };
}

function yt(id: string | null, watchUrl: string): ParsedVideo {
  return {
    provider: 'youtube',
    id,
    embedUrl: id ? `https://www.youtube-nocookie.com/embed/${id}` : null,
    thumbnailUrl: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null,
    watchUrl,
  };
}
