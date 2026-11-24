import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
    serviceWorkers: 'block'
  },
  webServer: {
    command: 'npm --prefix .. start',
    url: 'http://localhost:3001',
    env: { PORT: '3001', GEMINI_API_KEY: '', AURA_EDGE_TOKEN: '' },
    reuseExistingServer: false,
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
