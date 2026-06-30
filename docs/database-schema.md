# Database Schema

All tables use UUID primary keys, `created_at`/`updated_at` timestamps (an
`updated_at` trigger keeps the latter current), slugs with uniqueness
constraints where relevant, publish-status fields, and soft deletion
(`deleted_at`) on the large editorial tables. Migrations live in
`supabase/migrations/`; seed data in `supabase/seed.sql`.

Enums: `user_role`, `publish_status`, `post_status`, `comment_status`,
`rsvp_status`, `pledge_status`, `campaign_status`, `submission_status`,
`video_provider`, `form_field_type`.

## Tables

### Identity & access
- **profiles** — one per auth user (`id` = `auth.users.id`). `email`,
  `full_name`, `phone`, `avatar_url`, `bio`, `role`, `is_placeholder`. Created
  by the `handle_new_user` trigger on signup.
- **staff_permissions** — `(profile_id, module)` grants for staff. Unique per
  pair. Admins/super admins ignore this (implicit full access).
- **audit_logs** — `actor_id`, `actor_email`, `action`, `entity_type`,
  `entity_id`, `metadata` jsonb. Indexed by `created_at` and entity.

### Site configuration
- **site_settings** — key/value (`key` PK, `value` jsonb). Keys: `branding`,
  `contact`, `socials`, `serviceSummary`, `live`, `seo`. Public-readable.
- **navigation_items** — header/footer links. Self-referential `parent_id` for
  dropdowns; `location` ∈ {`header`, `footer_quick`}; `position`, `visible`.

### Pages & media
- **pages** — `slug` (unique), `title`, `status`, `is_system`, `is_placeholder`,
  SEO fields, `published_at`, soft delete.
- **page_blocks** — ordered blocks per page: `block_type`, `position`, `data`
  jsonb. Indexed `(page_id, position)`.
- **page_revisions** — block snapshots on publish (`blocks` jsonb).
- **media_assets** — `bucket`, `path`, `url`, `file_name`, `mime_type`,
  `size_bytes`, `width/height`, `alt_text`, `caption`, `uploaded_by`. Unique
  `(bucket, path)`.

### Posts
- **posts** — `slug`, `title`, `excerpt`, `content_html`, `featured_image_url`,
  `author_id`, `status` (draft/scheduled/published/archived), `comments_enabled`,
  `is_featured`, `view_count`, SEO + OG fields, `published_at`, `scheduled_for`,
  soft delete.
- **post_categories** — `slug`, `name`, `description`.
- **post_category_assignments** — M:N join `(post_id, category_id)`.
- **comments** — `post_id`, `author_id`, `body` (1–4000 chars), `status`
  (pending/approved/rejected/hidden), `ip_hash`. A trigger forces new comments
  to `pending` unless the author is a moderator.

### Services & sermons
- **service_schedules** — `title`, `day_of_week` (0–6), `start_time`/`end_time`,
  `location`, `audience`, `is_special` + `special_date`, `is_live`, `position`,
  `published`.
- **sermon_series** — `slug`, `title`, `description`, `image_url`.
- **sermons** — `slug`, `title`, `speaker`, `preached_on`, `notes_html`,
  `thumbnail_url`, `video_url`, `provider`, `series_id`, `published`, `position`.

### Events
- **events** — `slug`, `title`, `description_html`, `cover_image_url`,
  `start_at`/`end_at`, `venue`, `address`, `maps_url`, `organizer`,
  `contact_email`, `is_public`, `rsvp_enabled`, `guest_rsvp_allowed`,
  `rsvp_capacity`, `rsvp_deadline`, `category`, `is_featured`, `status`, soft
  delete.
- **event_rsvps** — `event_id`, `profile_id` (nullable for guests),
  `guest_name/email/phone`, `party_size` (1–20), `status`, `attended`,
  `ip_hash`. Unique `(event_id, profile_id)` and `(event_id, guest_email)`.

### Ministries
- **ministries** — `slug`, `name`, short/long descriptions, `image_url`,
  `leader_name`, `leader_contact`, `meeting_schedule`, `location`,
  `external_url`, `gallery` jsonb, `published`, `is_placeholder`, `position`.

### Giving
- **pledge_campaigns** — `slug`, `title`, `description_html`, `goal_amount`,
  `start_date`/`end_date`, `status`, `cover_image_url`, `is_featured`,
  `position`.
- **bank_accounts** — `bank_name`, `account_name`, `account_number`,
  `instructions`, `qr_image_url`, `active`, `is_placeholder`, `position`.
- **pledge_submissions** — `campaign_id` (nullable), `profile_id` (nullable),
  `name`, `email`, `phone`, `amount`, `notes`, `reference_number`, `status`
  (pending/confirmed/received/cancelled), `ip_hash`. Payment is **never**
  auto-verified; status is set manually by staff.

### Get Connected forms
- **connection_forms** — `slug`, `title`, `intro`, `success_message`,
  `recipient_email`, `store_submissions`, `enabled`, `position`.
- **connection_form_fields** — `form_id`, `label`, `field_key`, `field_type`,
  `placeholder`, `help_text`, `options` jsonb, `required`, `position`. Unique
  `(form_id, field_key)`.
- **connection_form_submissions** — `form_id`, `profile_id` (nullable), `data`
  jsonb, `status` (new/archived), `ip_hash`.

### Merch
- **merch_items** — `slug`, `title`, `description_html`, `price_display`,
  `suggested_donation`, `category`, `availability_label`, `external_url`,
  `contact_to_order`, `images` jsonb, `status`, `is_placeholder`, `position`.
  Modeled so a future e-commerce upgrade (variants, inventory, orders) can be
  layered on without rebuilding the catalog.

## Storage

- **media** bucket — public read; writes restricted to the `media` module.
  10 MB limit; image MIME types only. Served via public URLs through
  `next/image`.

## Indexes (selected)

`profiles(role)`, `pages(status) where deleted_at is null`,
`page_blocks(page_id, position)`, `posts(status, published_at) where not deleted`,
`comments(post_id, status, created_at)`, `events(start_at)` &
`events(status, start_at)`, `event_rsvps(event_id, status)`,
`pledge_submissions(status, created_at)` & `(profile_id)`,
`connection_form_submissions(form_id, status, created_at)`,
`audit_logs(created_at)` & `(entity_type, entity_id)`.

## Regenerating types

Types in `src/types/database.ts` are hand-maintained. To regenerate from a
running database: `npx supabase gen types typescript --local > src/types/database.ts`
(then re-export the helper aliases the app imports).
