import {
  HeroBlock,
  RichTextBlock,
  ImageTextBlock,
  FullImageBlock,
  VideoEmbedBlock,
  CtaBannerBlock,
  FeatureCardsBlock,
  QuoteBlock,
  MapLocationBlock,
  FaqBlock,
  DividerBlock,
  GalleryBlock,
} from './static-blocks';
import {
  ScheduleBlock,
  EventListBlock,
  PostListBlock,
  MinistryCardsBlock,
  PledgeDetailsBlock,
} from './dynamic-blocks';
import type { PageBlockRow } from '@/types/database';

/** Render a single page block by its stored type + data. */
export async function renderBlock(block: PageBlockRow) {
  const data = (block.data ?? {}) as never;
  switch (block.block_type) {
    case 'hero':
      return <HeroBlock data={data} />;
    case 'rich_text':
      return <RichTextBlock data={data} />;
    case 'image_text':
      return <ImageTextBlock data={data} />;
    case 'full_image':
      return <FullImageBlock data={data} />;
    case 'video_embed':
      return <VideoEmbedBlock data={data} />;
    case 'cta_banner':
      return <CtaBannerBlock data={data} />;
    case 'feature_cards':
      return <FeatureCardsBlock data={data} />;
    case 'quote':
      return <QuoteBlock data={data} />;
    case 'schedule':
      return <ScheduleBlock data={data} />;
    case 'event_list':
      return <EventListBlock data={data} />;
    case 'post_list':
      return <PostListBlock data={data} />;
    case 'ministry_cards':
      return <MinistryCardsBlock data={data} />;
    case 'map_location':
      return <MapLocationBlock data={data} />;
    case 'pledge_details':
      return <PledgeDetailsBlock data={data} />;
    case 'faq':
      return <FaqBlock data={data} />;
    case 'gallery':
      return <GalleryBlock data={data} />;
    case 'divider':
      return <DividerBlock />;
    default:
      return null;
  }
}

export async function BlockList({ blocks }: { blocks: PageBlockRow[] }) {
  const ordered = [...blocks].sort((a, b) => a.position - b.position);
  return (
    <>
      {await Promise.all(
        ordered.map(async (b) => <div key={b.id}>{await renderBlock(b)}</div>)
      )}
    </>
  );
}
