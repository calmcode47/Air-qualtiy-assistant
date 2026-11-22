import { test as base } from '@playwright/test';

export const forecastTime = Date.parse('2026-11-21T12:30:00Z') / 1000;

export const test = base.extend({
  page: async ({ page }, runWithPage) => {
    await page.route(/\/api\/monitor(?:\?.*)?$/, (route) => route.fulfill({
      json: { status: 'no_station', radiusKm: 25 }
    }));
    await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({
      json: { current: { wind_speed_10m: 7.2 } }
    }));
    await page.route('https://air-quality-api.open-meteo.com/**', (route) => {
      const { searchParams } = new URL(route.request().url());
      const isLahore = searchParams.get('latitude') === '31.5204';
      return route.fulfill({
        json: {
          timezone: isLahore ? 'Asia/Karachi' : 'Asia/Kolkata',
          current: { time: forecastTime, us_aqi: isLahore ? 128 : 172, pm2_5: 56 },
          hourly: {
            time: [1, 2, 3].map((hour) => forecastTime + hour * 3600),
            us_aqi: isLahore ? [115, 100, 96] : [210, 124, 130]
          }
        }
      });
    });
    await runWithPage(page);
  }
});

export { expect } from '@playwright/test';
