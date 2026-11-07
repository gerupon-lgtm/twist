import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/smoke.spec.js', '**/flight.spec.js', '**/visibility.spec.js', '**/device-flight.spec.js', '**/ground-proximity.spec.js', '**/flight-input.spec.js', '**/flight-display.spec.js', '**/radar.spec.js', '**/camera.spec.js', '**/steering.spec.js', '**/feedback.spec.js', '**/music.spec.js', '**/pwa.spec.js', '**/hard-music.spec.js', '**/cockpit-aids.spec.js', '**/target-height.spec.js', '**/feedback-variants.spec.js'],
  workers: 1,
  timeout: 30000,
  use: {
    viewport: { width: 390, height: 844 },
    headless: true,
    launchOptions: {
      ...(process.env.CI ? {} : { channel: 'msedge' }),
      args: ['--enable-unsafe-swiftshader'],
    },
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
  },
  webServer: { command: 'npm run dev -- --port 4173', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI },
});
