/**
 * Structured content blocks. Pages are composed of an ordered list of these
 * (stored one-row-per-block in `page_blocks`). The editor never stores raw
 * HTML for layout — only structured block data. Rich text *within* a RichText
 * block is sanitized Tiptap HTML.
 */

export const BLOCK_TYPES = [
  'hero',
  'rich_text',
  'image_text',
  'full_image',
  'video_embed',
  'cta_banner',
  'feature_cards',
  'quote',
  'schedule',
  'event_list',
  'post_list',
  'ministry_cards',
  'map_location',
  'pledge_details',
  'faq',
  'divider',
  'gallery',
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: 'Hero',
  rich_text: 'Rich Text',
  image_text: 'Image with Text',
  full_image: 'Full-width Image',
  video_embed: 'Video Embed',
  cta_banner: 'CTA Banner',
  feature_cards: 'Feature Cards',
  quote: 'Quote / Testimonial',
  schedule: 'Service Schedule',
  event_list: 'Event List',
  post_list: 'Post List',
  ministry_cards: 'Ministry Cards',
  map_location: 'Map / Location',
  pledge_details: 'Donation / Pledge Details',
  faq: 'FAQ',
  divider: 'Divider',
  gallery: 'Gallery',
};

// --- Per-block data shapes -------------------------------------------------

export interface HeroData {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  /** CSS object-position for the background media (e.g. '75% center'). Controls
   *  the focal point when the image is cropped on narrow/tall viewports. */
  backgroundPosition?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  alignment?: 'left' | 'center';
}

export interface RichTextData {
  html: string;
  width?: 'narrow' | 'wide';
}

export interface ImageTextData {
  imageUrl: string;
  imageAlt: string;
  heading?: string;
  html: string;
  imageSide?: 'left' | 'right';
  cta?: { label: string; href: string };
}

export interface FullImageData {
  imageUrl: string;
  imageAlt: string;
  caption?: string;
  height?: 'short' | 'tall';
}

export interface VideoEmbedData {
  provider: 'youtube' | 'facebook' | 'vimeo';
  url: string;
  title?: string;
  caption?: string;
}

export interface CtaBannerData {
  heading: string;
  body?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export interface FeatureCard {
  icon?: string;
  title: string;
  body: string;
  href?: string;
}
export interface FeatureCardsData {
  heading?: string;
  intro?: string;
  cards: FeatureCard[];
}

export interface QuoteData {
  quote: string;
  attribution?: string;
  role?: string;
}

export interface ScheduleData {
  heading?: string;
  intro?: string;
  /** When empty, the renderer pulls live `service_schedules`. */
  manualItems?: { title: string; day: string; time: string; location?: string }[];
}

export interface CollectionData {
  heading?: string;
  intro?: string;
  limit?: number;
  category?: string;
}

export interface MapLocationData {
  heading?: string;
  addressLine: string;
  directionsUrl?: string;
  embedUrl?: string;
}

export interface PledgeDetailsData {
  heading?: string;
  intro?: string;
  showCampaigns?: boolean;
  showBankAccounts?: boolean;
}

export interface FaqData {
  heading?: string;
  items: { question: string; answer: string }[];
}

export interface GalleryData {
  heading?: string;
  images: { url: string; alt: string; caption?: string }[];
}

export type BlockData =
  | { type: 'hero'; data: HeroData }
  | { type: 'rich_text'; data: RichTextData }
  | { type: 'image_text'; data: ImageTextData }
  | { type: 'full_image'; data: FullImageData }
  | { type: 'video_embed'; data: VideoEmbedData }
  | { type: 'cta_banner'; data: CtaBannerData }
  | { type: 'feature_cards'; data: FeatureCardsData }
  | { type: 'quote'; data: QuoteData }
  | { type: 'schedule'; data: ScheduleData }
  | { type: 'event_list'; data: CollectionData }
  | { type: 'post_list'; data: CollectionData }
  | { type: 'ministry_cards'; data: CollectionData }
  | { type: 'map_location'; data: MapLocationData }
  | { type: 'pledge_details'; data: PledgeDetailsData }
  | { type: 'faq'; data: FaqData }
  | { type: 'divider'; data: Record<string, never> }
  | { type: 'gallery'; data: GalleryData };

export interface PageBlock {
  id: string;
  page_id: string;
  block_type: BlockType;
  position: number;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Sensible empty data when a new block is added in the editor. */
export function defaultBlockData(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'hero':
      return { heading: 'Heading', alignment: 'center' } satisfies HeroData;
    case 'rich_text':
      return { html: '<p>Write something…</p>', width: 'narrow' } satisfies RichTextData;
    case 'image_text':
      return { imageUrl: '', imageAlt: '', html: '<p>…</p>', imageSide: 'left' } satisfies ImageTextData;
    case 'full_image':
      return { imageUrl: '', imageAlt: '', height: 'tall' } satisfies FullImageData;
    case 'video_embed':
      return { provider: 'youtube', url: '' } satisfies VideoEmbedData;
    case 'cta_banner':
      return { heading: 'Heading', primaryCta: { label: 'Get Connected', href: '/get-connected' } } satisfies CtaBannerData;
    case 'feature_cards':
      return { cards: [] } satisfies FeatureCardsData;
    case 'quote':
      return { quote: '…' } satisfies QuoteData;
    case 'schedule':
      return {} satisfies ScheduleData;
    case 'event_list':
    case 'post_list':
    case 'ministry_cards':
      return { limit: 3 } satisfies CollectionData;
    case 'map_location':
      return { addressLine: '1489 Manuel B. Suaybaguio Sr. St, Tagum, Davao del Norte' } satisfies MapLocationData;
    case 'pledge_details':
      return { showCampaigns: true, showBankAccounts: true } satisfies PledgeDetailsData;
    case 'faq':
      return { items: [] } satisfies FaqData;
    case 'gallery':
      return { images: [] } satisfies GalleryData;
    case 'divider':
      return {};
    default:
      return {};
  }
}
