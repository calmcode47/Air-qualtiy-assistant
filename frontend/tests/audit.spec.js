import { test, expect } from './fixtures.js';

const languages = ['en', 'hi', 'pa'];

const profiles = [
  {
    name: 'Default Profile',
    storage: null
  },
  {
    name: 'Family with Young Children',
    storage: {
      id: 'family',
      title: 'Family with Young Children',
      adults: 2,
      children: 2,
      elderly: 0,
      conditions: ['asthma'],
      commute: 'car',
      cookingFuel: 'lpg',
      homeType: 'apartment',
      purifierOwned: 'diy',
      monthlyBudgetBand: 'medium'
    }
  },
  {
    name: 'Daily Commuter',
    storage: {
      id: 'commuter',
      title: 'Daily Commuter & Office Worker',
      adults: 1,
      children: 0,
      elderly: 0,
      conditions: [],
      commute: 'two_wheeler',
      cookingFuel: 'piped_gas',
      homeType: 'floor',
      purifierOwned: 'portable',
      monthlyBudgetBand: 'medium'
    }
  },
  {
    name: 'Senior Asthmatic Resident',
    storage: {
      id: 'elderly',
      title: 'Senior / Asthmatic Resident',
      adults: 1,
      children: 0,
      elderly: 1,
      conditions: ['asthma', 'heart'],
      commute: 'walk',
      cookingFuel: 'electric_induction',
      homeType: 'apartment',
      purifierOwned: 'portable',
      monthlyBudgetBand: 'high'
    }
  },
  {
    name: 'Budget Conscious DIY',
    storage: {
      id: 'budget_diy',
      title: 'Budget-Conscious DIY Protector',
      adults: 2,
      children: 1,
      elderly: 0,
      conditions: [],
      commute: 'bus_metro',
      cookingFuel: 'lpg',
      homeType: 'floor',
      purifierOwned: 'none',
      monthlyBudgetBand: 'low'
    }
  }
];

const routes = ['/', '/advisor', '/routines', '/hacks', '/community', '/impact', '/home'];

for (const lang of languages) {
  test.describe(`Language audit: ${lang}`, () => {
    test(`walkthrough in ${lang}`, async ({ page }) => {
      const pageErrors = [];
      page.on('pageerror', err => pageErrors.push(err.message));

      await page.addInitScript((l) => {
        localStorage.setItem('aura_language', l);
        localStorage.setItem('aura_onboarding_completed', 'true');
      }, lang);

      for (const route of routes) {
        await page.goto(route);
        const main = page.locator('#main-content');
        await expect(main).toBeVisible();
        await expect.poll(async () => (await main.innerText()).trim().length).toBeGreaterThan(20);

        // Check horizontal overflow (layout break)
        const overflowInfo = await page.evaluate(() => {
          const docWidth = window.innerWidth;
          const scrollWidth = document.documentElement.scrollWidth;
          const bad = [];
          if (scrollWidth > docWidth + 2) {
            for (const el of document.querySelectorAll('*')) {
              const r = el.getBoundingClientRect();
              if (r.right > docWidth + 2) {
                bad.push({
                  tag: el.tagName,
                  className: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
                  right: Math.round(r.right),
                  width: Math.round(r.width)
                });
              }
            }
          }
          return { scrollWidth, docWidth, bad: bad.slice(0, 5) };
        });

        if (overflowInfo.scrollWidth > overflowInfo.docWidth + 2) {
          console.log(`Route ${route} overflow info in ${lang}:`, JSON.stringify(overflowInfo));
        }

        expect(overflowInfo.scrollWidth > overflowInfo.docWidth + 2, `Horizontal overflow on route ${route} in ${lang}`).toBe(false);
      }

      expect(pageErrors, `Page errors in language ${lang}`).toEqual([]);
    });
  });
}

for (const profile of profiles) {
  test.describe(`Profile audit: ${profile.name}`, () => {
    test(`walkthrough with profile: ${profile.name}`, async ({ page }) => {
      const pageErrors = [];
      page.on('pageerror', err => pageErrors.push(err.message));

      await page.addInitScript((p) => {
        localStorage.setItem('aura_onboarding_completed', 'true');
        if (p) {
          localStorage.setItem('aura_household_profile', JSON.stringify(p));
        }
      }, profile.storage);

      for (const route of ['/', '/advisor', '/routines', '/impact']) {
        await page.goto(route);
        const main = page.locator('#main-content');
        await expect(main).toBeVisible();
        await expect.poll(async () => (await main.innerText()).trim().length).toBeGreaterThan(20);
      }

      expect(pageErrors, `Page errors for profile ${profile.name}`).toEqual([]);
    });
  });
}
