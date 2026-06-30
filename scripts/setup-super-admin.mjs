#!/usr/bin/env node
/**
 * Promote the configured SUPER_ADMIN_EMAIL to the super_admin role.
 *
 * Run AFTER that user has signed up (so an auth user + profile exist):
 *   node scripts/setup-super-admin.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and
 * SUPER_ADMIN_EMAIL in the environment (e.g. via a loaded .env.local).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// Minimal .env.local loader (no extra deps).
try {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  /* no .env.local — rely on the ambient environment */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SUPER_ADMIN_EMAIL;

if (!url || !serviceKey || !email) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPER_ADMIN_EMAIL.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase
  .from('profiles')
  .update({ role: 'super_admin' })
  .eq('email', email)
  .select('id, email, role');

if (error) {
  console.error('Failed to promote super admin:', error.message);
  process.exit(1);
}
if (!data || data.length === 0) {
  console.error(`No profile found for ${email}. Have them sign up first, then re-run.`);
  process.exit(1);
}

console.log(`✅ ${email} is now super_admin.`);
