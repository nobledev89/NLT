/**
 * Hand-maintained Database types mirroring the Supabase migrations in
 * /supabase/migrations. Keep in sync when the schema changes. (For a generated
 * alternative run `supabase gen types typescript`.)
 *
 * Row = shape returned by SELECT. Insert/Update are pragmatically typed as
 * partials of the row (DB defaults fill the rest); reads are the strongly-typed
 * surface the app relies on.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Role = 'super_admin' | 'admin' | 'staff' | 'member';
export type PublishStatus = 'draft' | 'published';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'hidden';
export type RsvpStatus = 'confirmed' | 'cancelled' | 'waitlist';
export type PledgeStatus = 'pending' | 'confirmed' | 'received' | 'cancelled';
export type CampaignStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type SubmissionStatus = 'new' | 'archived';
export type VideoProvider = 'youtube' | 'facebook' | 'vimeo';

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: Role;
  is_placeholder: boolean;
  created_at: string;
  updated_at: string;
}

export type StaffPermissionRow = {
  id: string;
  profile_id: string;
  module: string;
  created_at: string;
}

export type SiteSettingRow = {
  key: string;
  value: Json;
  updated_at: string;
  updated_by: string | null;
}

export type NavigationItemRow = {
  id: string;
  label: string;
  href: string | null;
  parent_id: string | null;
  position: number;
  location: 'header' | 'footer_quick';
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export type PageRow = {
  id: string;
  slug: string;
  title: string;
  status: PublishStatus;
  is_system: boolean;
  is_placeholder: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type PageBlockRow = {
  id: string;
  page_id: string;
  block_type: string;
  position: number;
  data: Json;
  created_at: string;
  updated_at: string;
}

export type PageRevisionRow = {
  id: string;
  page_id: string;
  blocks: Json;
  title: string;
  created_by: string | null;
  created_at: string;
}

export type MediaAssetRow = {
  id: string;
  bucket: string;
  path: string;
  url: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_html: string;
  featured_image_url: string | null;
  author_id: string | null;
  status: PostStatus;
  comments_enabled: boolean;
  is_featured: boolean;
  is_placeholder: boolean;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  published_at: string | null;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type PostCategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  created_at: string;
}

export type PostCategoryAssignmentRow = {
  post_id: string;
  category_id: string;
}

export type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  status: CommentStatus;
  ip_hash: string | null;
  created_at: string;
  updated_at: string;
}

export type ServiceScheduleRow = {
  id: string;
  title: string;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  description: string | null;
  audience: string | null;
  is_special: boolean;
  special_date: string | null;
  is_live: boolean;
  position: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export type SermonSeriesRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export type SermonRow = {
  id: string;
  slug: string;
  title: string;
  speaker: string | null;
  preached_on: string | null;
  notes_html: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  provider: VideoProvider | null;
  series_id: string | null;
  published: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  description_html: string | null;
  cover_image_url: string | null;
  start_at: string;
  end_at: string | null;
  venue: string | null;
  address: string | null;
  maps_url: string | null;
  organizer: string | null;
  contact_email: string | null;
  is_public: boolean;
  rsvp_enabled: boolean;
  guest_rsvp_allowed: boolean;
  rsvp_capacity: number | null;
  rsvp_deadline: string | null;
  category: string | null;
  is_featured: boolean;
  status: PublishStatus;
  is_placeholder: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type EventRsvpRow = {
  id: string;
  event_id: string;
  profile_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  party_size: number;
  status: RsvpStatus;
  attended: boolean;
  ip_hash: string | null;
  created_at: string;
  updated_at: string;
}

export type MinistryRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  long_description_html: string | null;
  image_url: string | null;
  leader_name: string | null;
  leader_contact: string | null;
  meeting_schedule: string | null;
  location: string | null;
  external_url: string | null;
  gallery: Json;
  published: boolean;
  is_placeholder: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export type PledgeCampaignRow = {
  id: string;
  slug: string;
  title: string;
  description_html: string | null;
  goal_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  status: CampaignStatus;
  cover_image_url: string | null;
  is_featured: boolean;
  is_placeholder: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export type BankAccountRow = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  instructions: string | null;
  qr_image_url: string | null;
  position: number;
  active: boolean;
  is_placeholder: boolean;
  created_at: string;
  updated_at: string;
}

export type PledgeSubmissionRow = {
  id: string;
  campaign_id: string | null;
  profile_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  amount: number;
  notes: string | null;
  reference_number: string | null;
  status: PledgeStatus;
  ip_hash: string | null;
  created_at: string;
  updated_at: string;
}

export type ConnectionFormRow = {
  id: string;
  slug: string;
  title: string;
  intro: string | null;
  success_message: string | null;
  recipient_email: string | null;
  store_submissions: boolean;
  enabled: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export type ConnectionFormFieldRow = {
  id: string;
  form_id: string;
  label: string;
  field_key: string;
  field_type:
    | 'short_text'
    | 'long_text'
    | 'email'
    | 'phone'
    | 'select'
    | 'checkbox'
    | 'consent'
    | 'hidden';
  placeholder: string | null;
  help_text: string | null;
  options: Json;
  required: boolean;
  position: number;
  created_at: string;
}

export type ConnectionFormSubmissionRow = {
  id: string;
  form_id: string;
  profile_id: string | null;
  data: Json;
  status: SubmissionStatus;
  ip_hash: string | null;
  created_at: string;
}

export type MerchItemRow = {
  id: string;
  slug: string;
  title: string;
  description_html: string | null;
  price_display: string | null;
  suggested_donation: number | null;
  category: string | null;
  availability_label: string | null;
  external_url: string | null;
  contact_to_order: boolean;
  images: Json;
  status: PublishStatus;
  is_placeholder: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Json;
  created_at: string;
}

type TableShape<R> = {
  Row: R;
  Insert: Partial<R> & Record<string, unknown>;
  Update: Partial<R>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableShape<ProfileRow>;
      staff_permissions: TableShape<StaffPermissionRow>;
      site_settings: TableShape<SiteSettingRow>;
      navigation_items: TableShape<NavigationItemRow>;
      pages: TableShape<PageRow>;
      page_blocks: TableShape<PageBlockRow>;
      page_revisions: TableShape<PageRevisionRow>;
      media_assets: TableShape<MediaAssetRow>;
      posts: TableShape<PostRow>;
      post_categories: TableShape<PostCategoryRow>;
      post_category_assignments: TableShape<PostCategoryAssignmentRow>;
      comments: TableShape<CommentRow>;
      service_schedules: TableShape<ServiceScheduleRow>;
      sermon_series: TableShape<SermonSeriesRow>;
      sermons: TableShape<SermonRow>;
      events: TableShape<EventRow>;
      event_rsvps: TableShape<EventRsvpRow>;
      ministries: TableShape<MinistryRow>;
      pledge_campaigns: TableShape<PledgeCampaignRow>;
      bank_accounts: TableShape<BankAccountRow>;
      pledge_submissions: TableShape<PledgeSubmissionRow>;
      connection_forms: TableShape<ConnectionFormRow>;
      connection_form_fields: TableShape<ConnectionFormFieldRow>;
      connection_form_submissions: TableShape<ConnectionFormSubmissionRow>;
      merch_items: TableShape<MerchItemRow>;
      audit_logs: TableShape<AuditLogRow>;
    };
    Views: Record<string, never>;
    Functions: {
      is_staff_or_above: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      has_module: { Args: { module_key: string }; Returns: boolean };
      current_role_name: { Args: Record<string, never>; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
