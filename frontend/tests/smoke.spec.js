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
