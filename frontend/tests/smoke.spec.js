import { test, expect } from './fixtures.js';

const routes = [
  { path: '/', expectedText: 'Aura' },
  { path: '/advisor', expectedText: 'Advisor' },
  { path: '/routines', expectedText: 'Routines' },
  { path: '/hacks', expectedText: 'DIY' },
  { path: '/community', expectedText: 'Community' },
  { path: '/impact', expectedText: 'Impact' },
  { path: '/home', expectedText: 'Sanctuary' }
];

for (const route of routes) {
  test(`loads route ${route.path} cleanly`, async ({ page }) => {
    await page.goto(route.path);

    // Verify main content is mounted
    const main = page.locator('#main-content');
    await expect(main).toBeVisible();

    // Verify expected text content
    await expect(page.locator('body')).toContainText(route.expectedText);

    // Verify skip link is attached
    const skipLink = page.locator('a.skip-link');
    await expect(skipLink).toBeAttached();
  });
}

test('handles 404 route with friendly message', async ({ page }) => {
  await page.goto('/non-existent-page-test');
  await expect(page.locator('body')).toContainText('404');
  await expect(page.locator('body')).toContainText('The air is clearer back home');
});

test.describe('production service worker', () => {
  test.use({ serviceWorkers: 'allow' });

  test('serves app routes offline and returns 404 for missing assets and API routes', async ({ page, context }) => {
    await page.goto('/routines');
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    const missingAsset = await page.goto('/assets/missing-test.js');
    expect(missingAsset.status()).toBe(404);
    const unknownApi = await page.goto('/api/unknown-test');
    expect(unknownApi.status()).toBe(404);
    expect(unknownApi.headers()['content-type']).toContain('application/json');

    await context.setOffline(true);
    const offlineRoute = await page.goto('/routines?file=example.js');
    expect(offlineRoute.fromServiceWorker()).toBe(true);
    await expect(page).toHaveTitle(/Hourly Air Quality/);
  });
});
