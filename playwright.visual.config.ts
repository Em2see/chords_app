import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],

  snapshotPathTemplate: '{testDir}/__snapshots__/{projectName}-{arg}{ext}',

  use: {
    baseURL: 'http://localhost:5173',
    reducedMotion: 'reduce',
    screenshot: 'on',
  },

  projects: [
    {
      name: 'iphone-light',
      use: { viewport: { width: 390, height: 844 }, colorScheme: 'light',  isMobile: true, hasTouch: true },
    },
    {
      name: 'iphone-dark',
      use: { viewport: { width: 390, height: 844 }, colorScheme: 'dark',   isMobile: true, hasTouch: true },
    },
    {
      name: 'ipad-landscape-light',
      use: { viewport: { width: 1024, height: 768 }, colorScheme: 'light', isMobile: true, hasTouch: true },
    },
    {
      name: 'ipad-landscape-dark',
      use: { viewport: { width: 1024, height: 768 }, colorScheme: 'dark',  isMobile: true, hasTouch: true },
    },
    {
      name: 'ipad-portrait-light',
      use: { viewport: { width: 768, height: 1024 }, colorScheme: 'light', isMobile: true, hasTouch: true },
    },
    {
      name: 'desktop-light',
      use: { viewport: { width: 1440, height: 900 }, colorScheme: 'light' },
    },
    {
      name: 'desktop-dark',
      use: { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
