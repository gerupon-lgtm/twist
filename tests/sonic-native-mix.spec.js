import {test,expect} from '@playwright/test';import {writeFile} from 'node:fs/promises';import {APP_VERSION} from '../src/version.js';
test('native maximum-volume music plus engine and sonic impact never clips SCC or FM',async({page})=>{
 test.setTimeout(90000);await page.goto('/tests/fixtures/music-offline.html');await page.waitForFunction(()=>window.fixtureReady);const rows=[];
 for(const rate of [44100,48000])for(const engine of ['scc','fm'])for(const id of ['ignition','overdrive']){
  const row=await page.evaluate(o=>window.renderWholeTrack(o),{id,engine,rate,volume:100,bgmVolume:100,sonic:true,durationSeconds:2});rows.push(row);
  expect(row.preparation.metrics.sonic.accepted).toBe(1);expect(row.invalid).toBe(0);for(const c of row.channels){expect(c.fullScale).toBe(0);expect(c.peak).toBeGreaterThan(.3);expect(c.peak).toBeLessThan(1);}
 }
 await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-native-boom.json`,JSON.stringify({complete:true,rows},null,2));
});
