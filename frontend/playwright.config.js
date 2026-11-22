import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true
  },
  webServer: {
    command: 'npm --prefix .. run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    env: { VITE_USE_MOCK: 'true' },
    timeout: 30000
  },
  projects: [
    {
      name: 'Mobile (390px)',
      use: {
        viewport: { width: 390, height: 844 }
      }
    },
    {
      name: 'Desktop (1280px)',
      use: {
        viewport: { width: 1280, height: 800 }
      }
    }
  ]
});
