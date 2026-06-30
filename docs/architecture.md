# Architecture

## Overview

New Life Tagum is a single Next.js (App Router) application deployed to Vercel, backed by a Supabase project (Postgres + Auth + Storage). There is no separate CMS — editorial content lives in Postgres and is edited through a custom dashboard at `/admin`.

```
Browser ──► Next.js (Vercel)
               │  Server Components / Server Actions / Route Handlers
               ▼
            Supabase
            ├── Postgres (+ Row Level Security)
            ├── Auth (email/password, verification, reset)
            └── Storage (media bucket, public read)
            ▲
            └── Resend (optional) for transactional email
```

## Rendering model

- **Public pages** are Server Components that read published content with the
  request-scoped Supabase client (anon key, RLS-enforced). Most use
  `export const revalidate = 60` for ISR-style freshness.
- **The admin dashboard** is `force-dynamic`; every page authorizes via
  `requireModule` / `requireAdmin` / `requireSuperAdmin` before rendering.
- **Mutations** are Server Actions (and a few Route Handlers for CSV export and
  the auth callback). Forms use React 19 `useActionState` with actions that
  return a typed `ActionResult`.

## Content blocks

Editable pages are composed of ordered **blocks** stored one-row-per-block in
`page_blocks` (`block_type`, `position`, `data` jsonb). The block type catalog
and per-type data shapes live in `src/lib/blocks/types.ts`. `BlockList` /
`renderBlock` (`src/components/blocks/`) dispatch each block to its renderer.
Dynamic blocks (schedule, event/post/ministry lists, pledge details) query the
database at render time. **Layout is never stored as raw HTML** — only the rich
text *inside* a `rich_text` block is HTML (produced by Tiptap, sanitized on
render).

Publishing a page snapshots its blocks into `page_revisions` for lightweight
revision history.

## Security layers (defense in depth)

1. **Middleware** (`src/middleware.ts`) refreshes the auth session on every
   request and blocks unauthenticated access to `/admin`.
2. **Server-side authorization** — every admin page and every server action
   calls `requireModule`/`requireAdmin`/`requireSuperAdmin` (`src/lib/auth.ts`)
   and re-checks role rules. The client is never trusted.
3. **Row Level Security** — policies in `supabase/migrations/*_rls.sql` enforce
   access at the database. SECURITY DEFINER helper functions (`is_admin`,
   `has_module`, …) avoid recursive policy evaluation. Public reads are limited
   to published content; members see only their own submissions.
4. **Input validation** — Zod schemas (`src/lib/validations.ts`) validate every
   form and action payload.
5. **Anti-abuse** — honeypot fields on all public forms, plus an in-memory
   sliding-window rate limiter (`src/lib/rate-limit.ts`) keyed by hashed IP.

### Service role usage

`createServiceRoleClient()` bypasses RLS and is used **only** in trusted server
code: public/guest form inserts (after honeypot + rate-limit + Zod), reading
author display names for public posts, audit logging, sitemap generation, and
the super-admin setup script. It is never imported into client components.

## Auth & roles

Supabase Auth handles email/password with verification and reset. A Postgres
trigger (`handle_new_user`) creates a `profiles` row (role `member`) on signup.
Roles: `super_admin`, `admin`, `staff`, `member`. Staff access is granted per
module via the `staff_permissions` table. See
[permissions.md](permissions.md).

## Email

`src/lib/email.ts` wraps Resend. When `RESEND_API_KEY` is unset, `sendEmail`
is a no-op that returns `{ sent: false }` — the app works fully without email;
RSVP/pledge/form confirmations are simply skipped.

## Performance & SEO

- `next/image` for all images (remote patterns configured for Supabase Storage,
  YouTube thumbnails, Unsplash).
- Privacy-friendly lazy video embeds (`VideoEmbed`) load the provider iframe
  only on click (YouTube via `youtube-nocookie`).
- Per-page metadata, canonical URLs (from `NEXT_PUBLIC_SITE_URL`), `sitemap.xml`,
  `robots.txt`, an OG image route, and JSON-LD structured data
  (Church/Organization, Event, Article).

## Known architectural trade-offs

- **Rate limiting is in-memory** (per server instance). It blunts casual abuse
  but is not a hard global guarantee on multi-instance serverless. Back it with
  Upstash/Redis for strict limits.
- **HTML sanitization** is a lightweight allowlist suited to trusted staff
  Tiptap output. For untrusted input, add a full sanitizer (sanitize-html).
- **Database types are hand-maintained** in `src/types/database.ts`. Keep them
  in sync with migrations, or regenerate with `supabase gen types typescript`.
  (Row types must be `type` aliases, not `interface`, to satisfy supabase-js.)
