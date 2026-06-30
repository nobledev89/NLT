-- =====================================================================
-- New Life Tagum — Core schema
-- All tables use UUID PKs, created_at/updated_at, and (where useful)
-- soft-delete (deleted_at), publish status, slugs with uniqueness.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ----- shared helpers -------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----- enums ----------------------------------------------------------

do $$ begin
  create type public.user_role as enum ('super_admin', 'admin', 'staff', 'member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.publish_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_status as enum ('draft', 'scheduled', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.comment_status as enum ('pending', 'approved', 'rejected', 'hidden');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.rsvp_status as enum ('confirmed', 'cancelled', 'waitlist');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pledge_status as enum ('pending', 'confirmed', 'received', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.campaign_status as enum ('upcoming', 'active', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.submission_status as enum ('new', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.video_provider as enum ('youtube', 'facebook', 'vimeo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.form_field_type as enum
    ('short_text', 'long_text', 'email', 'phone', 'select', 'checkbox', 'consent', 'hidden');
exception when duplicate_object then null; end $$;

-- ----- profiles -------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  bio text,
  role public.user_role not null default 'member',
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_role_idx on public.profiles (role);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- staff module permissions (checkbox grid). admin/super_admin ignore this.
create table if not exists public.staff_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  module text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, module)
);
create index if not exists staff_permissions_profile_idx on public.staff_permissions (profile_id);

-- ----- site settings (key/value) -------------------------------------

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ----- navigation -----------------------------------------------------

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text,
  parent_id uuid references public.navigation_items (id) on delete cascade,
  position integer not null default 0,
  location text not null default 'header' check (location in ('header', 'footer_quick')),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists navigation_location_idx on public.navigation_items (location, position);

create trigger navigation_items_updated_at before update on public.navigation_items
  for each row execute function public.set_updated_at();

-- ----- pages + blocks + revisions ------------------------------------

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status public.publish_status not null default 'draft',
  is_system boolean not null default false,
  is_placeholder boolean not null default false,
  seo_title text,
  seo_description text,
  og_image_url text,
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists pages_status_idx on public.pages (status) where deleted_at is null;

create trigger pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();

create table if not exists public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  block_type text not null,
  position integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists page_blocks_page_idx on public.page_blocks (page_id, position);

create trigger page_blocks_updated_at before update on public.page_blocks
  for each row execute function public.set_updated_at();

-- lightweight revision history: snapshot of blocks JSON on publish
create table if not exists public.page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  title text not null,
  blocks jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists page_revisions_page_idx on public.page_revisions (page_id, created_at desc);

-- ----- media assets ---------------------------------------------------

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null,
  url text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  alt_text text,
  caption text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);
create index if not exists media_created_idx on public.media_assets (created_at desc);

-- ----- posts / categories / comments ---------------------------------

create table if not exists public.post_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content_html text not null default '',
  featured_image_url text,
  author_id uuid references public.profiles (id) on delete set null,
  status public.post_status not null default 'draft',
  comments_enabled boolean not null default false,
  is_featured boolean not null default false,
  is_placeholder boolean not null default false,
  view_count integer not null default 0,
  seo_title text,
  seo_description text,
  og_image_url text,
  published_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists posts_status_pub_idx on public.posts (status, published_at desc) where deleted_at is null;

create trigger posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

create table if not exists public.post_category_assignments (
  post_id uuid not null references public.posts (id) on delete cascade,
  category_id uuid not null references public.post_categories (id) on delete cascade,
  primary key (post_id, category_id)
);
create index if not exists pca_category_idx on public.post_category_assignments (category_id);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  status public.comment_status not null default 'pending',
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, status, created_at desc);

create trigger comments_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

-- ----- services / sermons --------------------------------------------

create table if not exists public.service_schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  day_of_week smallint check (day_of_week between 0 and 6),
  start_time time,
  end_time time,
  location text,
  description text,
  audience text,
  is_special boolean not null default false,
  special_date date,
  is_live boolean not null default false,
  position integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists service_schedules_pos_idx on public.service_schedules (position);

create trigger service_schedules_updated_at before update on public.service_schedules
  for each row execute function public.set_updated_at();

create table if not exists public.sermon_series (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.sermons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  speaker text,
  preached_on date,
  notes_html text,
  thumbnail_url text,
  video_url text,
  provider public.video_provider,
  series_id uuid references public.sermon_series (id) on delete set null,
  published boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sermons_pub_idx on public.sermons (published, preached_on desc);

create trigger sermons_updated_at before update on public.sermons
  for each row execute function public.set_updated_at();

-- ----- events / rsvps -------------------------------------------------

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description_html text,
  cover_image_url text,
  start_at timestamptz not null,
  end_at timestamptz,
  venue text,
  address text,
  maps_url text,
  organizer text,
  contact_email text,
  is_public boolean not null default true,
  rsvp_enabled boolean not null default false,
  guest_rsvp_allowed boolean not null default false,
  rsvp_capacity integer,
  rsvp_deadline timestamptz,
  category text,
  is_featured boolean not null default false,
  status public.publish_status not null default 'draft',
  is_placeholder boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists events_start_idx on public.events (start_at) where deleted_at is null;
create index if not exists events_status_idx on public.events (status, start_at) where deleted_at is null;

create trigger events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  guest_name text,
  guest_email text,
  guest_phone text,
  party_size integer not null default 1 check (party_size between 1 and 20),
  status public.rsvp_status not null default 'confirmed',
  attended boolean not null default false,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- a member can RSVP an event once; guests dedup by email
  unique (event_id, profile_id),
  unique (event_id, guest_email)
);
create index if not exists rsvps_event_idx on public.event_rsvps (event_id, status);

create trigger event_rsvps_updated_at before update on public.event_rsvps
  for each row execute function public.set_updated_at();

-- ----- ministries -----------------------------------------------------

create table if not exists public.ministries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text,
  long_description_html text,
  image_url text,
  leader_name text,
  leader_contact text,
  meeting_schedule text,
  location text,
  external_url text,
  gallery jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  is_placeholder boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ministries_pos_idx on public.ministries (position) where published;

create trigger ministries_updated_at before update on public.ministries
  for each row execute function public.set_updated_at();

-- ----- pledge / giving ------------------------------------------------

create table if not exists public.pledge_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description_html text,
  goal_amount numeric(12, 2),
  start_date date,
  end_date date,
  status public.campaign_status not null default 'active',
  cover_image_url text,
  is_featured boolean not null default false,
  is_placeholder boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pledge_campaigns_updated_at before update on public.pledge_campaigns
  for each row execute function public.set_updated_at();

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_name text not null,
  account_number text not null,
  instructions text,
  qr_image_url text,
  position integer not null default 0,
  active boolean not null default true,
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger bank_accounts_updated_at before update on public.bank_accounts
  for each row execute function public.set_updated_at();

create table if not exists public.pledge_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.pledge_campaigns (id) on delete set null,
  profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  amount numeric(12, 2) not null check (amount >= 0),
  notes text,
  reference_number text,
  status public.pledge_status not null default 'pending',
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pledge_subs_status_idx on public.pledge_submissions (status, created_at desc);
create index if not exists pledge_subs_profile_idx on public.pledge_submissions (profile_id);

create trigger pledge_submissions_updated_at before update on public.pledge_submissions
  for each row execute function public.set_updated_at();

-- ----- connection (Get Connected) forms ------------------------------

create table if not exists public.connection_forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  intro text,
  success_message text,
  recipient_email text,
  store_submissions boolean not null default true,
  enabled boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger connection_forms_updated_at before update on public.connection_forms
  for each row execute function public.set_updated_at();

create table if not exists public.connection_form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.connection_forms (id) on delete cascade,
  label text not null,
  field_key text not null,
  field_type public.form_field_type not null default 'short_text',
  placeholder text,
  help_text text,
  options jsonb not null default '[]'::jsonb,
  required boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (form_id, field_key)
);
create index if not exists form_fields_form_idx on public.connection_form_fields (form_id, position);

create table if not exists public.connection_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.connection_forms (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  status public.submission_status not null default 'new',
  ip_hash text,
  created_at timestamptz not null default now()
);
create index if not exists form_subs_form_idx on public.connection_form_submissions (form_id, status, created_at desc);

-- ----- merch ----------------------------------------------------------

create table if not exists public.merch_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description_html text,
  price_display text,
  suggested_donation numeric(12, 2),
  category text,
  availability_label text,
  external_url text,
  contact_to_order boolean not null default true,
  images jsonb not null default '[]'::jsonb,
  status public.publish_status not null default 'draft',
  is_placeholder boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists merch_status_idx on public.merch_items (status, position);

create trigger merch_items_updated_at before update on public.merch_items
  for each row execute function public.set_updated_at();

-- ----- audit logs -----------------------------------------------------

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_entity_idx on public.audit_logs (entity_type, entity_id);

-- ----- new-user trigger: create a member profile automatically --------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  super_email text := current_setting('app.super_admin_email', true);
  resolved_role public.user_role := 'member';
begin
  if super_email is not null and super_email <> '' and new.email = super_email then
    resolved_role := 'super_admin';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    resolved_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
