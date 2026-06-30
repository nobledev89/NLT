import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { env } from '@/lib/env';

/**
 * Server Supabase client bound to the request cookies (RLS-enforced as the
 * signed-in user). Use inside Server Components, Route Handlers, and Server
 * Actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.supabaseUrl(),
    env.supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component where cookies are read-only.
            // Session refresh is handled in middleware, so this is safe to
            // ignore here.
          }
        },
      },
    }
  );
}

/**
 * Service-role client that BYPASSES RLS. Never expose to the browser. Use only
 * in trusted server code for admin operations, webhooks, or seeding that must
 * sidestep row-level policies. Always perform your own authorization checks
 * before calling this.
 */
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    env.supabaseUrl(),
    env.supabaseServiceRoleKey(),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
