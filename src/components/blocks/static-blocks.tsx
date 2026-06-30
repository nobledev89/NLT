import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Quote as QuoteIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VideoEmbed } from '@/components/site/video-embed';
import { RichText } from './rich-text';
import { cn } from '@/lib/utils';
import type {
  HeroData,
  RichTextData,
  ImageTextData,
  FullImageData,
  VideoEmbedData,
  CtaBannerData,
  FeatureCardsData,
  QuoteData,
  MapLocationData,
  FaqData,
  GalleryData,
} from '@/lib/blocks/types';

export function HeroBlock({ data }: { data: HeroData }) {
  const centered = data.alignment !== 'left';
  return (
    <section className="relative isolate overflow-hidden">
      {data.backgroundVideoUrl ? (
        <video
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={data.backgroundImageUrl}
        >
          <source src={data.backgroundVideoUrl} />
        </video>
      ) : data.backgroundImageUrl ? (
        <Image src={data.backgroundImageUrl} alt="" fill priority className="absolute inset-0 -z-10 object-cover" />
      ) : (
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/40 via-background to-background" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-background/30" />

      <div className="container flex min-h-[68vh] flex-col justify-center py-28 md:min-h-[78vh]">
        <div className={cn('max-w-3xl space-y-6 animate-fade-in', centered && 'mx-auto text-center')}>
          {data.eyebrow && <p className="eyebrow">{data.eyebrow}</p>}
          <h1 className="text-display-lg font-serif font-medium text-foreground">{data.heading}</h1>
          {data.subheading && (
            <p className={cn('text-lg leading-relaxed text-foreground/75 md:text-xl', centered && 'mx-auto max-w-2xl')}>
              {data.subheading}
            </p>
          )}
          {(data.primaryCta || data.secondaryCta) && (
            <div className={cn('flex flex-wrap gap-3 pt-2', centered && 'justify-center')}>
              {data.primaryCta && (
                <Button asChild size="lg">
                  <Link href={data.primaryCta.href}>{data.primaryCta.label}</Link>
                </Button>
              )}
              {data.secondaryCta && (
                <Button asChild size="lg" variant="outline">
                  <Link href={data.secondaryCta.href}>{data.secondaryCta.label}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function RichTextBlock({ data }: { data: RichTextData }) {
  return (
    <section className="section">
      <div className={cn('container', data.width === 'wide' ? 'max-w-4xl' : 'max-w-2xl')}>
        <RichText html={data.html} />
      </div>
    </section>
  );
}

export function ImageTextBlock({ data }: { data: ImageTextData }) {
  const right = data.imageSide === 'right';
  return (
    <section className="section">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <div className={cn('relative aspect-[4/3] overflow-hidden rounded-2xl border border-border', right && 'lg:order-2')}>
          {data.imageUrl ? (
            <Image src={data.imageUrl} alt={data.imageAlt} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">Image</div>
          )}
        </div>
        <div className="space-y-5">
          {data.heading && <h2 className="text-headline font-serif font-medium">{data.heading}</h2>}
          <RichText html={data.html} />
          {data.cta && (
            <Button asChild variant="outline">
              <Link href={data.cta.href}>{data.cta.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export function FullImageBlock({ data }: { data: FullImageData }) {
  return (
    <section className="my-12">
      <figure className={cn('relative w-full overflow-hidden', data.height === 'short' ? 'aspect-[21/9]' : 'aspect-[16/9] md:aspect-[21/8]')}>
        {data.imageUrl ? (
          <Image src={data.imageUrl} alt={data.imageAlt} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">Full-width image</div>
        )}
        {data.caption && (
          <figcaption className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-6 text-sm text-white/90">
            {data.caption}
          </figcaption>
        )}
      </figure>
    </section>
  );
}

export function VideoEmbedBlock({ data }: { data: VideoEmbedData }) {
  return (
    <section className="section">
      <div className="container max-w-4xl space-y-4">
        {data.title && <h2 className="text-headline font-serif font-medium">{data.title}</h2>}
        <VideoEmbed url={data.url} title={data.title} />
        {data.caption && <p className="text-sm text-muted-foreground">{data.caption}</p>}
      </div>
    </section>
  );
}

export function CtaBannerBlock({ data }: { data: CtaBannerData }) {
  return (
    <section className="section">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-to-br from-accent/40 via-card to-card px-8 py-16 text-center md:px-16 md:py-20">
          <div className="absolute inset-0 bg-grain" />
          <div className="relative mx-auto max-w-2xl space-y-5">
            <h2 className="text-headline font-serif font-medium">{data.heading}</h2>
            {data.body && <p className="text-lg text-foreground/75">{data.body}</p>}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild size="lg">
                <Link href={data.primaryCta.href}>{data.primaryCta.label}</Link>
              </Button>
              {data.secondaryCta && (
                <Button asChild size="lg" variant="outline">
                  <Link href={data.secondaryCta.href}>{data.secondaryCta.label}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeatureCardsBlock({ data }: { data: FeatureCardsData }) {
  return (
    <section className="section">
      <div className="container">
        {(data.heading || data.intro) && (
          <div className="mx-auto mb-12 max-w-2xl text-center">
            {data.heading && <h2 className="text-headline font-serif font-medium">{data.heading}</h2>}
            {data.intro && <p className="mt-3 text-foreground/70">{data.intro}</p>}
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.cards.map((c, i) => {
            const inner = (
              <Card className="h-full p-6 transition-colors hover:border-gold/40">
                <h3 className="text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </Card>
            );
            return c.href ? (
              <Link key={i} href={c.href}>{inner}</Link>
            ) : (
              <div key={i}>{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function QuoteBlock({ data }: { data: QuoteData }) {
  return (
    <section className="section">
      <div className="container max-w-3xl text-center">
        <QuoteIcon className="mx-auto mb-6 h-10 w-10 text-gold/60" />
        <blockquote className="font-serif text-2xl leading-relaxed text-foreground/90 md:text-3xl">
          “{data.quote}”
        </blockquote>
        {(data.attribution || data.role) && (
          <p className="mt-6 text-sm uppercase tracking-widest text-muted-foreground">
            {data.attribution}
            {data.role ? ` · ${data.role}` : ''}
          </p>
        )}
      </div>
    </section>
  );
}

export function MapLocationBlock({ data }: { data: MapLocationData }) {
  const directions =
    data.directionsUrl ??
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.addressLine)}`;
  return (
    <section className="section">
      <div className="container">
        <div className="grid items-center gap-8 rounded-3xl border border-border bg-card/50 p-8 md:grid-cols-2 md:p-12">
          <div className="space-y-4">
            {data.heading && <h2 className="text-headline font-serif font-medium">{data.heading}</h2>}
            <p className="flex items-start gap-3 text-lg text-foreground/80">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-gold" />
              {data.addressLine}
            </p>
            <Button asChild>
              <a href={directions} target="_blank" rel="noopener noreferrer">Get Directions</a>
            </Button>
          </div>
          <div className="aspect-video overflow-hidden rounded-2xl border border-border">
            {data.embedUrl ? (
              <iframe src={data.embedUrl} className="h-full w-full" loading="lazy" title="Map" referrerPolicy="no-referrer-when-downgrade" />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted text-center text-sm text-muted-foreground">
                Map preview — use the Get Directions button
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqBlock({ data }: { data: FaqData }) {
  return (
    <section className="section">
      <div className="container max-w-3xl">
        {data.heading && <h2 className="mb-8 text-center text-headline font-serif font-medium">{data.heading}</h2>}
        <div className="divide-y divide-border rounded-2xl border border-border bg-card/40">
          {data.items.map((item, i) => (
            <details key={i} className="group p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {item.question}
                <span className="ml-4 text-gold transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DividerBlock() {
  return (
    <div className="container">
      <div className="mx-auto my-4 h-px max-w-3xl bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

export function GalleryBlock({ data }: { data: GalleryData }) {
  return (
    <section className="section">
      <div className="container">
        {data.heading && <h2 className="mb-8 text-headline font-serif font-medium">{data.heading}</h2>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {data.images.map((img, i) => (
            <figure key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
              <Image src={img.url} alt={img.alt} fill className="object-cover transition-transform duration-500 hover:scale-105" loading="lazy" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
