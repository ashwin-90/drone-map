import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  use: {
    baseURL: 'http://localhost:5173',   // 👈 This fixes your error
    trace: 'on-first-retry',
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
