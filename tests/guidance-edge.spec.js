import {useLegacyCourse} from './helpers/legacy-course.js';
import {test,expect} from '@playwright/test';
for(const size of [[390,844],[360,640],[844,390]])test(`off-screen guidance is on the real edge ${size}`,async({page})=>{
 await page.setViewportSize({width:size[0],height:size[1]});await page.clock.install();await page.goto('/?mode=flight&camera=cockpit');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(100);
 await page.locator('#practice-steer').evaluate(e=>{e.value='15';e.dispatchEvent(new Event('input',{bubbles:true}));});await page.clock.runFor(2500);
 await expect(page.locator('#guidance-edge-arrow')).toBeVisible();const d=await page.locator('#guidance-edge-arrow').evaluate(e=>({...e.dataset}));const x=+d.x,y=+d.y;
 expect(Math.min(Math.abs(x-18),Math.abs(x-(size[0]-18)),Math.abs(y-18),Math.abs(y-(size[1]-18)))).toBeLessThan(.01);
 await expect(page.locator('#guidance-edge-label')).toBeVisible();await expect(page.locator('#guidance-edge-label')).toContainText('TGT');
 const box=await page.locator('#guidance-edge-label').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(size[0]);expect(box.y+box.height).toBeLessThanOrEqual(size[1]);
 await page.screenshot({path:`test-results/v0125-edge-${size[0]}x${size[1]}.png`});
});
test('guided header respects a simulated 44px left cutout and restores when the director is off',async({page})=>{
 await page.setViewportSize({width:844,height:390});
 await page.route('**/src/*.css*',async route=>{const response=await route.fetch();const body=(await response.text()).replaceAll('env(safe-area-inset-left)','44px').replaceAll('env(safe-area-inset-left,0px)','44px');await route.fulfill({response,body});});
 await page.clock.install();await page.goto('/?mode=flight&camera=chase');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(150);
 const brand=await page.locator('#home-link').boundingBox(),nav=await page.locator('.navigation').boundingBox();expect(brand.x).toBeGreaterThanOrEqual(44);expect(nav.x).toBeGreaterThanOrEqual(brand.x+brand.width+4);
 expect(await page.locator('#home-link').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBe(18);
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await page.locator('#setting-flightDirector').uncheck();await page.locator('#start-button').click();await page.clock.runFor(150);
 await expect(page.locator('#app')).toHaveAttribute('data-guidance-director','off');expect(await page.locator('#home-link').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThan(18);
});

useLegacyCourse(test);
