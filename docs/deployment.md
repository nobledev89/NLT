# Deployment

## Vercel

Deploy the Next.js app to Vercel and set the environment variables from
`.env.example`. Required values are the site URL and Supabase project values.
Resend is optional; email sends are skipped when `RESEND_API_KEY` is unset.

## Supabase

For a new cloud project:

1. Link the Supabase project with `npx supabase link`.
2. Apply migrations with `npx supabase db push`.
3. Seed initial content from `supabase/seed.sql`.
4. Create a user through `/register`.
5. Set `SUPER_ADMIN_EMAIL` and run `node scripts/setup-super-admin.mjs`.

## Post-deploy checks

Run these locally before deploying:

```bash
npm run typecheck
npm run test
npm run build
```

After deploy, verify `/`, `/get-connected`, `/merch`, `/admin`, auth callback,
and public form submissions against the production Supabase project.

