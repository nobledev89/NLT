# Implementation Tracker

## Completed

- Public site shell with header, footer, SEO metadata, sitemap, and robots.
- Editable system pages backed by structured content blocks.
- Public pages for services, events, ministries, posts, pledge/giving, get
  connected, merch, privacy, and terms.
- Auth flows for register, login, password reset, and callback handling.
- Member account pages for profile, comments, pledges, and RSVPs.
- Admin dashboard for pages, posts/categories, comments, events, ministries,
  media, pledge campaigns, pledge submissions/export, connection forms, and
  merch.
- Supabase migrations, RLS policies, storage setup, and seed data.
- Unit tests for RBAC, utility functions, and validation schemas.
- Playwright smoke test configuration.

## Launch checklist

- Replace all placeholder seed content with real copy, images, event dates,
  ministry leaders, bank details, and contact information.
- Configure production Supabase Auth email templates and redirect URLs.
- Set production environment variables in Vercel.
- Create and promote the first super-admin account.
- Run `npm run typecheck`, `npm run test`, `npm run build`, and e2e smoke tests
  against the target environment.

