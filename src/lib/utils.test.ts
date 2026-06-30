import { describe, it, expect } from 'vitest';
import { slugify, truncate, formatTime } from './utils';
import { parseVideoUrl } from './video';
import { sanitizeHtml } from './sanitize';

describe('slugify', () => {
  it('produces url-friendly slugs', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
    expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
    expect(slugify("New Life's Building Fund")).toBe('new-lifes-building-fund');
  });
});

describe('truncate', () => {
  it('leaves short text and clips long text', () => {
    expect(truncate('short', 100)).toBe('short');
    expect(truncate('a'.repeat(20), 10)).toBe('aaaaaaaaaa…');
  });
});

describe('formatTime', () => {
  it('converts 24h to 12h labels', () => {
    expect(formatTime('09:00')).toBe('9:00 AM');
    expect(formatTime('16:30')).toBe('4:30 PM');
    expect(formatTime('00:00')).toBe('12:00 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
  });
});

describe('parseVideoUrl', () => {
  it('parses youtube watch + short urls', () => {
    expect(parseVideoUrl('https://www.youtube.com/watch?v=abc123').id).toBe('abc123');
    expect(parseVideoUrl('https://youtu.be/xyz789').embedUrl).toContain('youtube-nocookie.com/embed/xyz789');
  });
  it('parses vimeo', () => {
    const v = parseVideoUrl('https://vimeo.com/123456');
    expect(v.provider).toBe('vimeo');
    expect(v.embedUrl).toContain('player.vimeo.com/video/123456');
  });
  it('builds a facebook plugin embed', () => {
    const v = parseVideoUrl('https://www.facebook.com/watch/?v=999');
    expect(v.provider).toBe('facebook');
    expect(v.embedUrl).toContain('plugins/video.php');
  });
});

describe('sanitizeHtml', () => {
  it('strips scripts and event handlers', () => {
    expect(sanitizeHtml('<p>ok</p><script>alert(1)</script>')).toBe('<p>ok</p>');
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
    expect(sanitizeHtml('<div onclick="evil()">x</div>')).not.toContain('onclick');
  });
});
