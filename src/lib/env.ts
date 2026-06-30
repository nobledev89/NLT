/**
 * Centralised, lazily-validated environment access.
 *
 * Public (NEXT_PUBLIC_*) vars are safe in the browser. Server-only vars throw
 * if read in a client context. Optional integrations (Resend) degrade
 * gracefully so the app builds and runs without them.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    // During `next build` we don't want to hard-crash on a missing var for
    // pages that don't actually touch Supabase, so we surface a clear message
    // only when the value is genuinely accessed at runtime.
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`
    );
  }
  return value;
}

export const env = {
  supabaseUrl: () =>
    required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    required(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
  supabaseServiceRoleKey: () =>
    required(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
  siteUrl: () =>
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    'http://localhost:3000',
  superAdminEmail: () => process.env.SUPER_ADMIN_EMAIL ?? '',
} as const;

/** Resend is optional — return null when not configured. */
export const resendConfig = {
  apiKey: () => process.env.RESEND_API_KEY ?? null,
  fromEmail: () =>
    process.env.RESEND_FROM_EMAIL ?? 'New Life Tagum <onboarding@resend.dev>',
  isEnabled: () => Boolean(process.env.RESEND_API_KEY),
};

export const isProd = process.env.NODE_ENV === 'production';
