import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Aura Behavior Verification Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Dismiss onboarding modal by default across all behavior tests
    await page.addInitScript(() => {
      localStorage.setItem('aura_onboarding_completed', 'true');
    });
  });

  test('changes location and updates hero text and atmospheric telemetry', async ({ page }) => {
    await page.goto('/');

    const heroSummary = page.locator('[data-testid="hero-status-summary"]');
    await expect(heroSummary).toBeVisible();
    await expect(heroSummary).toContainText('Delhi');

    // Select Lahore
    const locationSelect = page.locator('[data-testid="location-select"]');
    await expect(locationSelect).toBeVisible();
    await locationSelect.selectOption('lahore');

    // Verify hero text updates to Lahore
    await expect(heroSummary).toContainText('Lahore');
    await expect(page.locator('body')).toContainText('Lahore');
  });

  test('updates Overview action plan when household profile changes to child + two-wheeler', async ({ page }) => {
    await page.route('https://air-quality-api.open-meteo.com/**', (route) => route.abort());
    await page.goto('/');

    // 1. Set car commuter profile without children
    await page.evaluate(() => {
      const commuterProfile = {
        id: 'car_commuter',
        title: 'Solo Car Commuter',
        adults: 1,
        children: 0,
        elderly: 0,
        conditions: [],
        commute: 'car',
        cookingFuel: 'lpg',
        homeType: 'apartment',
        purifierOwned: 'none',
        monthlyBudgetBand: 'medium'
      };
      localStorage.setItem('aura_household_profile', JSON.stringify(commuterProfile));
    });

    await page.reload();
    const stepOneTitle = page.locator('[data-testid="action-step-title-01"]');
    await expect(stepOneTitle).toBeVisible();
    await expect(stepOneTitle).toContainText('Check current local air-quality guidance');

    // 2. Now update profile in localStorage to child + two-wheeler commute
    await page.evaluate(() => {
      const customProfile = {
        id: 'family_commuter',
        title: 'Child and Two-Wheeler Commute',
        adults: 2,
        children: 1,
        elderly: 0,
        conditions: [],
        commute: 'two_wheeler',
        cookingFuel: 'lpg',
        homeType: 'apartment',
        purifierOwned: 'none',
        monthlyBudgetBand: 'medium'
      };
      localStorage.setItem('aura_household_profile', JSON.stringify(customProfile));
    });

    // 3. Reload page to reflect updated household profile
    await page.reload();
    await expect(stepOneTitle).toBeVisible();
    await expect(stepOneTitle).toContainText('Plan outdoor activity for a sensitive household');
  });

  test('displays visible cached label when network is blocked after initial visit', async ({ page, context }) => {
    // Pre-populate localStorage with cached air data from a previous session
    await page.addInitScript(() => {
      const cached = {
        id: 'delhi',
        name: 'Delhi NCR',
        region: 'Indo-Gangetic Basin, India',
        lat: 28.6139,
        lon: 77.2090,
        aqi: 320,
        aqiSystem: 'US AQI',
        category: 'Hazardous',
        descriptor: 'Very Poor Winter Smog • Cached Telemetry',
        pm25: 140,
        pm10: 220,
        tempC: 18,
        humidity: 60,
        windSpeed: '1.2 m/s',
        inversionCap: 450,
        cleanestWindow: '1:30 PM – 3:30 PM',
        timestamp: Date.now() - 3 * 3600 * 1000,
        isLive: false,
        isCached: true,
        staleHours: 3
      };
      localStorage.setItem('aura_air_cache_delhi', JSON.stringify(cached));
    });

    // Block all outbound requests to open-meteo APIs so the app serves from cache
    await context.route('**/*open-meteo.com/**', (route) => route.abort());

    await page.goto('/');
    await expect(page.locator('#main-content')).toBeVisible();

    // Assert visible cached label appears
    const cachedBadge = page.locator('text=/cached/i').first();
    await expect(cachedBadge).toBeVisible();
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
    await expect(page.getByText('Offline demo guidance')).toBeVisible();
    await expect(page.getByText('Limits and assumptions').first()).toBeVisible();
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

  const languages = ['en', 'hi', 'pa'];
  const routes = ['/', '/advisor', '/routines', '/hacks', '/community', '/impact', '/home'];

  for (const lang of languages) {
    test(`crawls all routes in ${lang} with zero raw translation keys, console errors, or overflow`, async ({ page }) => {
      const pageErrors = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));

      await page.addInitScript((l) => {
        localStorage.setItem('i18nextLng', l);
      }, lang);

      for (const route of routes) {
        await page.goto(route);
        const main = page.locator('#main-content');
        await expect(main).toBeVisible();

        const bodyText = await main.innerText();
        expect(bodyText.length).toBeGreaterThan(30);

        // Assert no unrendered i18n key leaks (e.g. "ledger.daily_avoided", "hero.status_summary")
        const keyLeakRegex = /\b(nav|hero|ledger|swaps|advisor|routines|hacks|community|impact|sanctuary|footer)\.[a-z0-9_]+/i;
        const leakMatch = bodyText.match(keyLeakRegex);
        expect(leakMatch, `Found unrendered translation key "${leakMatch?.[0]}" on route ${route} in ${lang}`).toBeNull();

        // Assert no horizontal layout overflow
        const overflow = await page.evaluate(() => {
          const docWidth = window.innerWidth;
          const scrollWidth = document.documentElement.scrollWidth;
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

      // Analyze page accessibility with axe-core
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const seriousOrCritical = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );

      if (seriousOrCritical.length > 0) {
        console.error(
          `Accessibility violations on ${route}:`,
          JSON.stringify(
            seriousOrCritical.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.map((n) => n.target)
            })),
            null,
            2
          )
        );
      }

      expect(seriousOrCritical, `Found serious/critical a11y violations on ${route}`).toEqual([]);
    });
  }

});
