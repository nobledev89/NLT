import { createHash } from 'crypto';
import { headers } from 'next/headers';

/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * NOTE: state is per server instance and resets on cold start, so on a
 * multi-instance serverless deploy it is best-effort, not a hard guarantee.
 * It is paired with honeypot fields and Zod validation on every public form.
 * For strict global limits, back this with Upstash/Redis (see
 * docs/architecture.md). Good enough to blunt casual abuse at launch.
 */

interface Bucket {
  hits: number[];
}

const store = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  // Opportunistic cleanup at most once a minute.
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.hits.length === 0 || bucket.hits[bucket.hits.length - 1] < now - 3_600_000) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * @param key      unique identifier (e.g. `comment:${ipHash}`)
 * @param limit    max events allowed within the window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > now - windowMs);

  if (bucket.hits.length >= limit) {
    store.set(key, bucket);
    const resetMs = bucket.hits[0] + windowMs - now;
    return { success: false, remaining: 0, resetMs };
  }

  bucket.hits.push(now);
  store.set(key, bucket);
  return { success: true, remaining: limit - bucket.hits.length, resetMs: windowMs };
}

/** Best-effort client IP from proxy headers. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return h.get('x-real-ip') ?? '0.0.0.0';
}

/** One-way hash of an IP for privacy-preserving storage / keying. */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'new-life-tagum';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

/** Convenience: derive a hashed IP for the current request. */
export async function currentIpHash(): Promise<string> {
  return hashIp(await getClientIp());
}
