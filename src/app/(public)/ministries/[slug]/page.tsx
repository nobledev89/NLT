import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, MapPin, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { RichText } from '@/components/blocks/rich-text';
import { Button } from '@/components/ui/button';
import type { MinistryRow } from '@/types/database';

export const revalidate = 60;

interface GalleryItem {
  url: string;
  alt?: string;
}

function parseGallery(gallery: unknown): GalleryItem[] {
  if (!Array.isArray(gallery)) return [];
  return gallery
    .map((g): GalleryItem | null => {
      if (typeof g === 'string') return { url: g };
      if (g && typeof g === 'object' && typeof (g as { url?: unknown }).url === 'string') {
        const obj = g as { url: string; alt?: string };
        return { url: obj.url, alt: obj.alt };
      }
      return null;
    })
    .filter((g): g is GalleryItem => g !== null);
}

async function loadMinistry(slug: string): Promise<MinistryRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('ministries')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle<MinistryRow>();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ministry = await loadMinistry(slug);
  if (!ministry) return { title: 'Ministry not found' };
  return {
    title: ministry.name,
    description: ministry.short_description ?? undefined,
    alternates: { canonical: `/ministries/${ministry.slug}` },
    openGraph: {
      title: ministry.name,
      description: ministry.short_description ?? undefined,
      images: ministry.image_url ? [{ url: ministry.image_url }] : undefined,
    },
  };
}

export default async function MinistryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ministry = await loadMinistry(slug);
  if (!ministry) notFound();

  const gallery = parseGallery(ministry.gallery);

  return (
    <article>
      {ministry.image_url && (
        <div className="relative aspect-[21/9] w-full overflow-hidden border-b border-border/60 bg-muted">
          <Image src={ministry.image_url} alt={ministry.name} fill priority className="object-cover" />
        </div>
      )}

      <div className="container py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-6">
            <header>
              <p className="eyebrow">Ministry</p>
              <h1 className="mt-2 text-4xl font-serif font-medium md:text-5xl">{ministry.name}</h1>
              {ministry.short_description && (
                <p className="mt-3 text-lg text-foreground/70">{ministry.short_description}</p>
              )}
            </header>

            {ministry.long_description_html && (
              <RichText html={ministry.long_description_html} />
            )}

            {gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-3">
                {gallery.map((g, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <Image src={g.url} alt={g.alt ?? `${ministry.name} photo ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-5 rounded-2xl border border-border bg-card/60 p-6">
              <dl className="space-y-4 text-sm">
                {ministry.leader_name && (
                  <div className="flex gap-3">
                    <User className="h-5 w-5 shrink-0 text-brand" />
                    <div>
                      <dt className="text-muted-foreground">Led by</dt>
                      <dd className="font-medium">{ministry.leader_name}</dd>
                      {ministry.leader_contact && (
                        <dd className="text-muted-foreground">{ministry.leader_contact}</dd>
                      )}
                    </div>
                  </div>
                )}
                {ministry.meeting_schedule && (
                  <div className="flex gap-3">
                    <Clock className="h-5 w-5 shrink-0 text-brand" />
                    <div>
                      <dt className="text-muted-foreground">Meets</dt>
                      <dd className="font-medium">{ministry.meeting_schedule}</dd>
                    </div>
                  </div>
                )}
                {ministry.location && (
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 shrink-0 text-brand" />
                    <div>
                      <dt className="text-muted-foreground">Where</dt>
                      <dd className="font-medium">{ministry.location}</dd>
                    </div>
                  </div>
                )}
              </dl>

              {ministry.external_url ? (
                <Button asChild className="w-full">
                  <a href={ministry.external_url} target="_blank" rel="noopener noreferrer">
                    Learn more
                  </a>
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href="/get-connected">Get connected</Link>
                </Button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
