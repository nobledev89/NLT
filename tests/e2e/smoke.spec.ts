import { test, expect } from '@playwright/test';

/**
 * Critical-path smoke tests. These verify the public site renders, navigation
 * works, and admin routes are protected. They avoid asserting on seeded
 * content specifics so they pass against a fresh or populated database.
 */

test('home page renders with brand and primary CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'New Life Tagum' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /get connected/i }).first()).toBeVisible();
});

test('primary navigation links resolve (no dead links)', async ({ page }) => {
  for (const path of ['/services', '/events', '/ministries', '/posts', '/pledge', '/get-connected', '/merch', '/who-we-are', '/mission-vision']) {
    const res = await page.goto(path);
    expect(res?.status(), `GET ${path}`).toBeLessThan(400);
  }
});

test('admin is protected and redirects to login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
});

test('account is protected and redirects to login', async ({ page }) => {
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login/);
});

test('login page renders a sign-in form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
});

test('robots and sitemap are served', async ({ request }) => {
  expect((await request.get('/robots.txt')).status()).toBeLessThan(400);
  expect((await request.get('/sitemap.xml')).status()).toBeLessThan(400);
});
