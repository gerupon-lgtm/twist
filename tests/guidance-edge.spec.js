import {useLegacyCourse} from './helpers/legacy-course.js';
import {test,expect} from './helpers/legacy-ui.js';
for(const camera of ['cockpit','chase','overlay'])for(const size of [[390,844],[360,640],[844,390]])test(`off-screen guidance is on the real edge ${camera} ${size}`,async({page})=>{
 await page.setViewportSize({width:size[0],height:size[1]});await page.clock.install();await page.goto('/?mode=flight&camera='+camera);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(100);
 await expect(page.locator('#app'),`${camera} ${size} initial paired guidance`).toHaveAttribute('data-guidance-ready','true');
 await expect(page.locator('#guidance-director')).toBeVisible();await expect(page.locator('#guidance-flight-path')).toBeVisible();
 await page.locator('#practice-steer').evaluate(e=>{e.value='15';e.dispatchEvent(new Event('input',{bubbles:true}));});await page.clock.runFor(2500);
 const outside=()=>page.locator('#app').evaluate(element=>{
  const local=JSON.parse(element.dataset.targetLocal);if(local.z>=0)return true;
  const focal=innerHeight/2/Math.tan(Number(element.dataset.verticalFov)*Math.PI/360);
  const x=innerWidth/2+focal*local.x/-local.z,y=innerHeight/2-focal*local.y/-local.z;
  return x<0||x>innerWidth||y<0||y>innerHeight;
 });
 // Chase looks from behind the aircraft: a rearward body bearing can still be
 // on screen. Leave the turn and fly on until the actual camera loses it.
 if(!await outside()){
  await page.locator('#practice-steer').evaluate(e=>{e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}));});
  for(let i=0;i<40&&!await outside();i++)await page.clock.runFor(100);
 }
 expect(await outside(),`${camera} ${size} actual off-screen target`).toBe(true);
 await expect(page.locator('#guidance-edge-arrow')).toBeVisible();const d=await page.locator('#guidance-edge-arrow').evaluate(e=>({...e.dataset}));const x=+d.x,y=+d.y;
 expect(Math.min(Math.abs(x-18),Math.abs(x-(size[0]-18)),Math.abs(y-18),Math.abs(y-(size[1]-18)))).toBeLessThan(.01);
 await expect(page.locator('#guidance-edge-label')).toBeVisible();await expect(page.locator('#guidance-edge-label')).toContainText('TGT');
 const box=await page.locator('#guidance-edge-label').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(size[0]);expect(box.y+box.height).toBeLessThanOrEqual(size[1]);
 for(const hudId of ['flight-essential-speed','flight-essential-altitude'])for(const id of ['guidance-edge-arrow','guidance-edge-label','guidance-heading','guidance-director']){
  const hud=page.locator('#'+hudId),element=page.locator('#'+id);
  if(!await hud.isVisible()||!await element.isVisible())continue;
  const a=await hud.boundingBox(),b=await element.boundingBox();
  expect(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y,`${camera} ${size} HUD/${id}`).toBe(false);
 }
 await page.screenshot({path:`test-results/v0129-edge-${camera}-${size[0]}x${size[1]}.png`});
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
