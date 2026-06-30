import type { Metadata } from 'next';
import Image from 'next/image';
import { ExternalLink, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPublishedPage, pageMetadata } from '@/lib/pages';
import { RichText } from '@/components/blocks/rich-text';
import { PageHero, EmptyState } from '@/components/site/page-hero';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Json, MerchItemRow } from '@/types/database';

export const revalidate = 60;

type MerchImage = { url: string; alt?: string };

function parseImages(images: Json): MerchImage[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((image): MerchImage | null => {
      if (typeof image === 'string') return { url: image };
      if (image && typeof image === 'object' && !Array.isArray(image)) {
        const candidate = image as { url?: Json; alt?: Json };
        if (typeof candidate.url === 'string') {
          return {
            url: candidate.url,
            alt: typeof candidate.alt === 'string' ? candidate.alt : undefined,
          };
        }
      }
      return null;
    })
    .filter((image): image is MerchImage => image !== null);
}

export async function generateMetadata(): Promise<Metadata> {
  const loaded = await getPublishedPage('merch');
  return loaded
    ? { ...pageMetadata(loaded.page), alternates: { canonical: '/merch' } }
    : { title: 'Merch' };
}

export default async function MerchPage() {
  const [loaded, supabase] = await Promise.all([
    getPublishedPage('merch'),
    createClient(),
  ]);

  const { data } = await supabase
    .from('merch_items')
    .select('*')
    .eq('status', 'published')
    .order('position');
  const items = (data ?? []) as MerchItemRow[];

  return (
    <>
      <PageHero
        eyebrow="Fundraising"
        title={loaded?.page.title ?? 'Merch'}
        subtitle={loaded?.page.seo_description ?? 'Browse available New Life Tagum merchandise and fundraising items.'}
      />

      <section className="section">
        <div className="container">
          {items.length === 0 ? (
            <EmptyState title="No merch items yet" description="Available items will appear here soon." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const [image] = parseImages(item.images);
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="relative aspect-[4/3] bg-muted">
                      {image ? (
                        <Image src={image.url} alt={image.alt ?? item.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-background text-muted-foreground">
                          <span className="font-serif text-3xl opacity-50">NL</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.category && <Badge variant="secondary">{item.category}</Badge>}
                          {item.availability_label && <Badge variant="outline">{item.availability_label}</Badge>}
                        </div>
                        <h2 className="text-xl font-semibold">{item.title}</h2>
                        {item.price_display && <p className="font-medium text-gold">{item.price_display}</p>}
                      </div>
                      {item.description_html && <RichText html={item.description_html} />}
                      {item.external_url ? (
                        <Button asChild className="w-full">
                          <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            Order
                          </a>
                        </Button>
                      ) : item.contact_to_order ? (
                        <Button asChild variant="secondary" className="w-full">
                          <a href="/get-connected">
                            <MessageCircle className="h-4 w-4" />
                            Ask to order
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
