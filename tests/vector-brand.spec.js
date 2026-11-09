import {test,expect} from '@playwright/test';
import {APP_VERSION} from '../src/version.js';
for(const [width,height]of [[360,640],[390,844],[844,390]])test(`TWIST VECTOR title fits ${width}x${height} and retains app identity`,async({page})=>{
  await page.setViewportSize({width,height});await page.goto(`/?v=${APP_VERSION}`);
  await expect(page).toHaveTitle('TWIST VECTOR — Tilt to Play.');
  await expect(page.locator('#start-flow-title-heading')).toHaveText('TWIST VECTOR');
  await expect(page.getByText('Tilt to Play.',{exact:true})).toBeVisible();
  await expect(page.locator('#start-flow-version')).toContainText(APP_VERSION);
  const layout=await page.evaluate(()=>{const heading=document.querySelector('#start-flow-title-heading'),r=heading.getBoundingClientRect();return{left:r.left,right:r.right,bottom:r.bottom,overflow:document.documentElement.scrollHeight-innerHeight,body:document.body.scrollWidth-innerWidth};});
  expect(layout.left).toBeGreaterThanOrEqual(0);expect(layout.right).toBeLessThanOrEqual(width);expect(layout.bottom).toBeLessThan(height);expect(layout.overflow).toBeLessThanOrEqual(1);expect(layout.body).toBeLessThanOrEqual(1);
  const manifest=await page.evaluate(async()=>fetch(document.querySelector('link[rel=manifest]').href).then(r=>r.json()));
  expect(manifest.name).toBe('TWIST VECTOR');expect(manifest.short_name).toBe('TWIST VECTOR');expect(manifest.id).toBe('./');expect(manifest.start_url).toContain(APP_VERSION);
  await page.screenshot({path:`.cache/v${APP_VERSION.replaceAll('.','')}-title-${width}x${height}.png`});
});
