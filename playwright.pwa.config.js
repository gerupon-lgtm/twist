import { defineConfig } from '@playwright/test';
const builtPort=Number(process.env.TWIST_BUILT_TEST_PORT??4174);
export default defineConfig({
  testDir:'./tests',testMatch:['pwa-build.spec.js','pwa-build-flow.spec.js'],workers:1,timeout:30000,
  outputDir:'test-results/pwa-build',
  use:{baseURL:`http://localhost:${builtPort}`,viewport:{width:390,height:844},headless:true,
    launchOptions:{...(process.env.CI?{}:{channel:'msedge'}),args:['--enable-unsafe-swiftshader']},screenshot:'only-on-failure'},
  webServer:{command:'node tools/serve-built.mjs',url:`http://localhost:${builtPort}`,reuseExistingServer:!process.env.CI},
});
