# Content Management

Content is managed from `/admin`; there is no external CMS.

## Pages

System pages such as home, services, ministries, pledge, get connected, merch,
privacy, and terms are seeded in `supabase/seed.sql`. Editors can update page
metadata and structured blocks. Publishing a page snapshots its blocks into
`page_revisions`.

## Blocks

Supported blocks are defined in `src/lib/blocks/types.ts` and rendered by
`src/components/blocks/block-renderer.tsx`.

Dynamic blocks pull live data for schedules, events, posts, ministries, and
pledge details. Static blocks store structured JSON such as hero copy, feature
cards, map details, FAQ items, gallery images, and CTA buttons.

## Media

Admin media uploads are stored in Supabase Storage and indexed in
`media_assets`. Image fields can use uploaded media or pasted URLs.

## Forms

Connection forms are fully data-driven. Admins define forms and fields in
`connection_forms` and `connection_form_fields`; `/get-connected` renders all
enabled forms and stores submissions when configured.

