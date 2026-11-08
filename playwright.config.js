import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/start-flow-sensor.spec.js','**/start-flow.spec.js','**/start-flow-ui.spec.js','**/pwa-flow.spec.js','**/briefing.spec.js','**/mode-hud.spec.js','**/guidance-motion.spec.js','**/music-preview.spec.js','**/mml-music.spec.js','**/speedfeel-records.spec.js','**/speedfeel-audio.spec.js','**/rock-trilogy.spec.js','**/speed-effects.spec.js','**/afterburner.spec.js','**/afterburner-feedback.spec.js','**/courses-ui.spec.js', '**/boundary.spec.js', '**/courses-flight.spec.js','**/guidance-edge.spec.js','**/navigation-audio.spec.js','**/guidance.spec.js', '**/hud-language.spec.js','**/course.spec.js', '**/smoke.spec.js', '**/flight.spec.js', '**/visibility.spec.js', '**/device-flight.spec.js', '**/ground-proximity.spec.js', '**/flight-input.spec.js', '**/flight-display.spec.js', '**/radar.spec.js', '**/camera.spec.js', '**/steering.spec.js', '**/feedback.spec.js', '**/music.spec.js', '**/pwa.spec.js', '**/hard-music.spec.js', '**/cockpit-aids.spec.js', '**/exit-help.spec.js', '**/rock-music.spec.js', '**/cockpit-objective.spec.js', '**/settings-help.spec.js', '**/range-editor.spec.js', '**/target-height.spec.js', '**/feedback-variants.spec.js'],
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
