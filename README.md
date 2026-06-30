# New Life Tagum

A modern, dark-themed church website and custom admin dashboard for **New Life Tagum** — 1489 Manuel B. Suaybaguio Sr. St, Tagum, Davao del Norte. Built with Next.js, Supabase, and Tailwind. English-only, Asia/Manila timezone.

> No WordPress, no external CMS. Content is managed in a custom dashboard at `/admin`, backed by Postgres with Row Level Security.

## Stack

- **Next.js (App Router) + TypeScript** — public site, admin dashboard, server actions, route handlers
- **Tailwind CSS** + shadcn-style accessible components (Radix primitives)
- **Supabase** — Postgres, Auth (email verification + password reset), Storage, Row Level Security
- **React Hook Form is available**; forms primarily use React 19 `useActionState` + **Zod** validation
- **Tiptap** rich-text editor for structured content
- **Resend** transactional email — optional, enabled via env
- **Vitest** unit tests, **Playwright** end-to-end smoke tests
- **Vercel** hosting

## Quick start (local)

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local   # fill in Supabase + site values

# 3. Start Supabase locally (requires Docker) and apply migrations + seed
npx supabase start
npx supabase db reset        # runs migrations + seed.sql

# 4. Run the app
npm run dev                  # http://localhost:3000
```

Then create your super-admin: sign up at `/register` with the email you set in
`SUPER_ADMIN_EMAIL`, verify it (check the local Inbucket mailbox at
http://localhost:54324), then:

```bash
node scripts/setup-super-admin.mjs   # promotes that email to super_admin
```

Sign in at `/login` and open `/admin`.

> Using Supabase Cloud instead of local? Link the project (`npx supabase link`)
> and run `npx supabase db push`, then upload `supabase/seed.sql` via the SQL
> editor (or `npx supabase db reset --linked` on a fresh project).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright e2e (starts dev server) |
| `npm run db:reset` | Reapply migrations + seed (destructive) |
| `npm run db:push` | Push migrations to the linked project |

## Documentation

- [docs/architecture.md](docs/architecture.md) — system design, data flow, security layers
- [docs/database-schema.md](docs/database-schema.md) — tables, relationships, indexes
- [docs/permissions.md](docs/permissions.md) — roles, module permissions, RLS
- [docs/content-management.md](docs/content-management.md) — pages, blocks, media, forms
- [docs/deployment.md](docs/deployment.md) — Vercel + Supabase deployment
- [docs/implementation-tracker.md](docs/implementation-tracker.md) — feature status, limitations, checklists

## Project layout

```
src/
  app/
    (public)/        public site (header/footer layout)
    (auth)/          login / register / forgot-password
    admin/           custom dashboard (role-gated)
    actions/         shared server actions (auth, media, public forms)
    auth/callback/   Supabase email/reset redirect handler
  components/
    ui/              base components (button, card, dialog, …)
    site/            public chrome (header, footer, cards, video)
    blocks/          content-block renderer + block components
    admin/           dashboard components (sidebar, editor, media)
    forms/           shared form helpers (submit button, field)
  lib/               supabase clients, auth, rbac, validations, utils, …
  types/             hand-maintained Database types
supabase/
  migrations/        schema, RLS, storage
  seed.sql           placeholder content
scripts/             setup-super-admin.mjs
docs/                project documentation
tests/e2e/           Playwright smoke tests
```

## License / content

All seeded content is clearly-marked placeholder material. Replace it in the
admin dashboard before launch. No real staff names, bank details, contact
numbers, event dates, or payment information are included.
