import { test, expect } from './fixtures.js';
import AxeBuilder from '@axe-core/playwright';

test.describe('Aura Behavior Verification Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Dismiss onboarding modal by default across all behavior tests
    await page.addInitScript(() => {
      localStorage.setItem('aura_onboarding_completed', 'true');
    });
  });

  test('updates the overview and forecast when the location changes', async ({ page }) => {
    await page.goto('/');
    const summary = page.getByTestId('hero-status-summary');
    await expect(summary).toContainText('Unhealthy for Delhi');
    await page.getByRole('button', { name: 'View Schedule' }).click();
    const forecast = page.getByRole('group', { name: 'Hourly US AQI forecast' });
    await expect(forecast.getByRole('button', { name: /US AQI 124/ })).toBeVisible();

    await page.getByTestId('location-select').selectOption('lahore');
    await expect(forecast.getByRole('button', { name: /US AQI 115/ })).toBeVisible();
    await expect(forecast.getByRole('button', { name: /US AQI 124/ })).toHaveCount(0);
    await page.goto('/');
    await expect(summary).toContainText('Unhealthy for Sensitive Groups for Lahore');
  });

  test('saves a household edit and updates the overview action plan', async ({ page }) => {
    await page.route('https://air-quality-api.open-meteo.com/**', (route) => route.abort());
    await page.addInitScript(() => {
      if (!localStorage.getItem('aura_household_profile')) {
        localStorage.setItem('aura_household_profile', JSON.stringify({
          adults: 1, children: 0, elderly: 0, conditions: [], commute: 'car', purifierOwned: 'none'
        }));
      }
    });
    await page.goto('/');
    const action = page.getByTestId('action-step-title-01');
    await expect(action).toHaveText('Check current local air-quality guidance');

    const opener = page.getByRole('button', { name: 'Customize Household' });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Who lives in your home?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Add Children' }).click();
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Main way of commuting').selectOption('two_wheeler');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Save household profile' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(action).toHaveText('Plan outdoor activity for a sensitive household');
    await expect(page.getByText('Commute: Motorcycle or scooter')).toBeVisible();
    await page.reload();
    await expect(action).toHaveText('Plan outdoor activity for a sensitive household');
    await expect(page.getByText('Commute: Motorcycle or scooter')).toBeVisible();

    await opener.click();
    await page.getByRole('button', { name: 'Remove Children' }).click();
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
    await expect(action).toHaveText('Plan outdoor activity for a sensitive household');
  });

  test('returns focus to the guide opener on Escape and keeps the background inert', async ({ page }) => {
    await page.goto('/');
    const opener = page.getByRole('button', { name: /respirator guide/i }).last();
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: /respirator guide/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close mask guide' })).toBeFocused();
    await page.locator('.skip-link').evaluate((element) => element.focus());
    await expect(dialog.getByRole('button', { name: 'Close mask guide' })).toBeFocused();
    const result = await new AxeBuilder({ page }).include('dialog').analyze();
    expect(result.violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('exports both share-card sizes and reports clipboard errors', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: async () => { throw new Error('Permission denied'); } }
      });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Share Status' }).click();
    const dialog = page.getByRole('dialog', { name: "Share Today's Air Status" });
    await expect(dialog).toBeVisible();

    for (const [ratio, height] of [['3-4', 1440], ['9-16', 1920]]) {
      const size = dialog.getByTestId(`share-ratio-${ratio}`);
      await size.click();
      await expect(size).toHaveAttribute('aria-pressed', 'true');

      const downloading = page.waitForEvent('download');
      await dialog.getByRole('button', { name: 'Save Image' }).click();
      const output = await downloading;
      expect(output.suggestedFilename()).toBe('aura-air-status-delhi-ncr.png');
      const stream = await output.createReadStream();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const png = Buffer.concat(chunks);
      expect(png.subarray(12, 16).toString()).toBe('IHDR');
      expect(png.readUInt32BE(16)).toBe(1080);
      expect(png.readUInt32BE(20)).toBe(height);
    }

    await dialog.getByRole('button', { name: 'Copy text summary' }).click();
    await expect(dialog.getByRole('status')).toHaveText(/clipboard access is unavailable/i);
  });

  test('applies the language selected in the household editor', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Customize Household' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Interface language').selectOption('pa');
    await page.getByRole('button', { name: 'Save household profile' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pa');
    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Select Language' })).toHaveValue('pa');
    await page.getByRole('button', { name: 'Customize Household' }).click();
    await expect(page.getByRole('dialog', { name: 'ਤੁਹਾਡੇ ਘਰ ਵਿੱਚ ਕੌਣ ਰਹਿੰਦਾ ਹੈ?' })).toBeVisible();
  });

  test('saves a live estimate and hides the forecast when the feed goes offline', async ({ page }) => {
    await page.goto('/routines');
    const forecast = page.getByRole('group', { name: 'Hourly US AQI forecast' });
    await expect(forecast.getByRole('button', { name: /US AQI 124/ })).toBeVisible();

    await page.route('**/*open-meteo.com/**', (route) => route.abort());
    await page.reload();
    await expect(page.getByText(/showing cached data/i)).toBeVisible();
    await expect(page.getByText(/showing a saved current reading only/i)).toBeVisible();
    await expect(forecast).toHaveCount(0);
    await page.goto('/');
    await expect(page.getByText('Cached Data', { exact: true })).toBeVisible();
    await expect(page.getByText('172', { exact: true }).last()).toBeVisible();
  });

  test('renders 2D SVG fallback when WebGL fails', async ({ page }) => {
    // Intercept WebGL context creation and force failure
    await page.addInitScript(() => {
      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (typeof type === 'string' && type.toLowerCase().includes('webgl')) {
          return null;
        }
        return origGetContext.apply(this, [type, ...args]);
      };
    });

    await page.goto('/home');
    await expect(page.locator('#main-content')).toBeVisible();

    // Assert that the 2D SVG fallback diagram is rendered
    const fallbackDiagram = page.locator('[aria-label="Illustrative air-pollution and home-filter diagram"]');
    await expect(fallbackDiagram).toBeVisible();
    await expect(page.locator('text=2D Fallback Mode (WebGL Unavailable)')).toBeVisible();
  });

  test('logs a swap in Impact ledger, updates totals, and survives reload', async ({ page }) => {
    await page.goto('/impact');
    await expect(page.locator('#main-content')).toBeVisible();

    const loggedCountEl = page.locator('[data-testid="choices-logged-count"]');
    await expect(loggedCountEl).toBeVisible();
    const countBefore = parseInt((await loggedCountEl.innerText()).trim(), 10);

    // Toggle a specific swap card (e.g. swap_metro_bus)
    const swapCard = page.locator('[data-testid="swap-card-swap_metro_bus"]');
    await expect(swapCard).toBeVisible();
    await swapCard.locator('button[aria-pressed]').click();

    // Verify count changes
    const countAfter = parseInt((await loggedCountEl.innerText()).trim(), 10);
    expect(countAfter).not.toBe(countBefore);

    // Reload page to verify persistence in localStorage
    await page.reload();
    await expect(loggedCountEl).toBeVisible();
    const countAfterReload = parseInt((await loggedCountEl.innerText()).trim(), 10);
    expect(countAfterReload).toBe(countAfter);
  });

  test('submits an advisor query and labels the structured guidance and its limits', async ({ page }) => {
    await page.goto('/advisor');
    await expect(page.locator('#main-content')).toBeVisible();

    const input = page.locator('[data-testid="advisor-input"]');
    const submitBtn = page.locator('[data-testid="advisor-submit"]');
    await expect(input).toBeVisible();

    // Submit question regarding child safety in smog
    await input.fill('How should I protect children during morning school commute?');
    await submitBtn.click();

    // Verify structured guidance is visibly labeled and avoids invented dose totals.
    await expect(page.getByText('Direct impact:', { exact: false }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Local rule-based guidance')).toBeVisible();
    await expect(page.getByText('Limits and assumptions').first()).toBeVisible();
  });

  test('keeps navigation controls reachable at phone and tablet widths', async ({ page }) => {
    await page.route('https://air-quality-api.open-meteo.com/**', (route) => route.abort());
    await page.goto('/');
    for (const width of [320, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      const toggle = page.getByRole('button', { name: 'Toggle Navigation Menu' });
      await expect(toggle).toBeInViewport();
      await expect(page.getByRole('combobox', { name: 'Select Language' })).toBeInViewport();
      await toggle.click();
      const navigation = page.getByRole('navigation', { name: 'Main navigation' });
      await expect(navigation).toBeVisible();
      await expect(navigation.getByRole('button', { name: /advisor/i })).toBeVisible();
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(width + 2);
    }
  });

  test('uses a searched city’s coordinates and shows the local forecast', async ({ page }) => {
    const current = Date.parse('2026-11-21T18:00:00+05:30') / 1000;
    await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: { current: {} } }));
    await page.route('https://geocoding-api.open-meteo.com/**', (route) => route.fulfill({
      json: { results: [{ id: 1275339, name: 'Mumbai', admin1: 'Maharashtra', country: 'India', latitude: 19.076, longitude: 72.878 }] }
    }));
    await page.route('https://air-quality-api.open-meteo.com/**', (route) => {
      const { searchParams } = new URL(route.request().url());
      if (searchParams.get('latitude') !== '19.076' || searchParams.get('longitude') !== '72.878') return route.abort();
      return route.fulfill({
        json: {
          timezone: 'Asia/Kolkata',
          current: { time: current, us_aqi: 172 },
          hourly: { time: [1, 2, 3].map((hour) => current + hour * 3600), us_aqi: [210, 124, 130] }
        }
      });
    });

    await page.goto('/routines');
    await page.getByRole('button', { name: 'Search city or locality' }).click();
    await expect(page.getByPlaceholder(/search/i)).toBeFocused();
    await page.getByPlaceholder(/search/i).fill('Mumbai');
    await page.getByRole('button', { name: /Mumbai Maharashtra/ }).click();
    await expect(page.getByRole('button', { name: /US AQI 124/ })).toBeVisible();
    await page.getByRole('button', { name: /US AQI 124/ }).click();
    await expect(page.getByRole('button', { name: /US AQI 124/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Peak US AQI 130', { exact: false })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: /US AQI 124/ })).toBeVisible();
  });

  test('compares household presets and keeps follow-up context without sending coordinates', async ({ page }) => {
    await page.goto('/advisor');
    const input = page.getByTestId('advisor-input');
    const responseLog = page.getByRole('log', { name: 'Assistant conversation' });
    const submit = page.getByTestId('advisor-submit');
    const prompt = 'How can I reduce particles indoors?';

    await page.getByRole('button', { name: /Budget-Conscious Household/ }).click();
    await input.fill(prompt);
    const outgoing = page.waitForRequest((request) => request.url().endsWith('/api/advice'));
    await submit.click();
    const request = (await outgoing).postDataJSON();
    expect(request.profile.purifierOwned).toBe('none');
    expect(request.profile.monthlyBudgetBand).toBe('low');
    expect(request.airData).not.toHaveProperty('lat');
    expect(request.airData).not.toHaveProperty('coordinates');
    await expect(responseLog.getByText(/start with no-cost source control/)).toBeVisible();

    await input.fill('What about tomorrow?');
    const nextRequest = page.waitForRequest((request) => request.url().endsWith('/api/advice'));
    await submit.click();
    const followup = (await nextRequest).postDataJSON();
    expect(followup.history.map((turn) => turn.role)).toEqual(['user', 'assistant']);
    await expect(responseLog.getByText(/start with no-cost source control/)).toHaveCount(2);

    await page.getByRole('button', { name: /Daily Commuter/ }).click();
    await input.fill(prompt);
    await submit.click();
    await expect(responseLog.getByText(/Run a particle air cleaner in the room/)).toBeVisible();
    await expect(responseLog.getByText(/start with no-cost source control/)).toHaveCount(0);
  });

  test('keeps the loading state readable while the interactive scene is pending', async ({ page }) => {
    let releaseScene;
    const waitForRelease = new Promise((resolve) => { releaseScene = resolve; });
    await page.route('**/AtmosphericSanctuaryTwin3D.jsx*', async (route) => {
      await waitForRelease;
      await route.continue();
    });
    try {
      await page.goto('/home', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Loading interactive illustration…')).toBeVisible();
      const result = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      expect(result.violations).toEqual([]);
    } finally {
      releaseScene();
    }
  });

  const languages = ['en', 'hi', 'pa'];
  const routes = ['/', '/advisor', '/routines', '/hacks', '/community', '/impact', '/home'];

  for (const lang of languages) {
    test(`crawls all routes in ${lang} with zero raw translation keys, page errors, or overflow`, async ({ page }) => {
      const pageErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      await page.addInitScript((l) => {
        localStorage.setItem('aura_language', l);
      }, lang);

      for (const route of routes) {
        await page.goto(route);
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(page.getByRole('combobox', { name: 'Select Language' })).toHaveValue(lang);
        const main = page.locator('#main-content');
        await expect(main).toBeVisible();

        const bodyText = await main.innerText();
        expect(bodyText.length).toBeGreaterThan(30);

        // Assert no unrendered i18n key leaks (e.g. "ledger.daily_avoided", "hero.status_summary")
        const keyLeakRegex = /\b(nav|hero|ledger|swaps|advisor|routines|hacks|community|impact|sanctuary|footer|onboarding)\.[a-z0-9_]+/i;
        const leakMatch = bodyText.match(keyLeakRegex);
        expect(leakMatch, `Found unrendered translation key "${leakMatch?.[0]}" on route ${route} in ${lang}`).toBeNull();

        // Assert no horizontal layout overflow
        const overflow = await page.evaluate(() => {
          const docWidth = window.innerWidth;
          const scrollWidth = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
          return { hasOverflow: scrollWidth > docWidth + 2, scrollWidth, docWidth };
        });
        expect(overflow.hasOverflow, `Horizontal overflow detected on route ${route} in ${lang}: scrollWidth=${overflow.scrollWidth}, docWidth=${overflow.docWidth}`).toBe(false);
      }

      expect(pageErrors, `Page errors encountered in language ${lang}`).toEqual([]);
    });
  }

  for (const route of routes) {
    test(`axe-core a11y audit on route: ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('#main-content')).toBeVisible();

      if (route === '/home') {
        const scene = page.locator('.winter-smog-stage canvas');
        const diagram = page.getByRole('region', { name: 'Illustrative air-pollution and home-filter diagram' });
        await expect(scene.or(diagram)).toBeVisible();
      }

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const violations = results.violations.map(({ id, impact, nodes }) => ({
        id,
        impact,
        offenders: nodes.map((node) => node.target)
      }));
      expect(violations).toEqual([]);
    });
  }

});
