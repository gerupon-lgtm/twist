import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests',testMatch:'pwa-build.spec.js',workers:1,timeout:30000,
  outputDir:'test-results/pwa-build',
  use:{baseURL:'http://localhost:4174',viewport:{width:390,height:844},headless:true,
    launchOptions:{...(process.env.CI?{}:{channel:'msedge'}),args:['--enable-unsafe-swiftshader']},screenshot:'only-on-failure'},
  webServer:{command:'node tools/serve-built.mjs',url:'http://localhost:4174',reuseExistingServer:!process.env.CI},
});
