import {useLegacyCourse} from './helpers/legacy-course.js';
import {test,expect} from '@playwright/test';
// This fixture retains the Japanese/legacy display comparison. Default English guidance is covered in guidance/hud-language.spec.js.
test.beforeEach(async({page})=>{await page.addInitScript(value=>{if(!localStorage.getItem('twist.flight-settings.v1'))localStorage.setItem('twist.flight-settings.v1',JSON.stringify(value));},{"hudLanguage": "ja"});});
const sizes=[{width:390,height:844},{width:360,height:640},{width:844,height:390}];
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
const guide=page=>page.locator('#app').getAttribute('data-target-height').then(JSON.parse);
const slider=(page,id,value)=>page.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
async function launch(page,query='mode=flight') {
 await page.clock.install({time:new Date('2026-11-07T12:00:00Z')});await page.goto('/?'+query);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(100);
}
async function launchSensors(page,camera) {
 await page.addInitScript(()=>{
  class Orientation extends Event {static requestPermission(){return Promise.resolve('granted');}}
  class Motion extends Event {static requestPermission(){return Promise.resolve('granted');}}
  Object.defineProperty(window,'DeviceOrientationEvent',{value:Orientation,configurable:true});Object.defineProperty(window,'DeviceMotionEvent',{value:Motion,configurable:true});
 });
 await page.goto('/?mode=flight&camera='+camera);await page.locator('#start-button').click();
 await page.evaluate(()=>{const send=()=>{window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta:0,gamma:0}));window.dispatchEvent(Object.assign(new Event('devicemotion'),{rotationRate:{alpha:0,beta:0,gamma:0}}));};send();setInterval(send,100);});
 await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');await page.locator('#start-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
}
for(const camera of ['overlay','chase','cockpit'])for(const size of sizes)test(`target height stays clear in ${camera} at ${size.width}x${size.height}`,async({page})=>{
 await page.setViewportSize(size);await launchSensors(page,camera);
 const selector=camera==='cockpit'?'#cockpit-target-height':'#target-height-inline';
 await expect(page.locator(selector)).toBeVisible();await expect(page.locator(selector)).toContainText('目標 14m');await expect(page.locator(selector)).toContainText('高さOK');
 expect(await guide(page)).toMatchObject({target:14,radius:3.2,inside:true});
 const own=await page.locator(selector).boundingBox();expect(own.x).toBeGreaterThanOrEqual(0);expect(own.x+own.width).toBeLessThanOrEqual(size.width);
 const obstacles=camera==='cockpit'?['#cockpit-speed','#cockpit-altitude','#cockpit-vario','#cockpit-heading','#cockpit-power','#radar','.navigation','#bottom-panel']:['#throttle-value','.throttle-heading > label','#throttle-input','#pause-button','#recenter-button','#ground-proximity'];
 for(const other of obstacles)expect(overlap(own,await page.locator(other).boundingBox()),selector+'/'+other).toBe(false);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(camera==='cockpit')await expect(page.locator('#cockpit-altitude .height-band-range')).toHaveCount(1);else await expect(page.locator(selector+' .height-band-range')).toHaveCount(1);
 await page.screenshot({path:`test-results/v0122-${camera}-${size.width}.png`});
});
for(const camera of ['overlay','chase','cockpit'])test(`next light changes the height band and warns early in ${camera}`,async({page})=>{
 await launch(page,'mode=flight&camera='+camera);await page.clock.runFor(4400);
 expect(await guide(page)).toMatchObject({target:16,lower:12.8,upper:19.2,inside:true,direction:'level'});
 const selector=camera==='cockpit'?'#cockpit-target-height':'#target-height-inline';await expect(page.locator(selector)).toContainText('目標 16m');
 // Deliberately descend below the second light's band while still approaching it.
 await slider(page,'practice-pitch',-25);await slider(page,'throttle-input',0);
 for(let i=0;i<80&&!(await guide(page)).urgent;i++)await page.clock.runFor(50);
 expect((await guide(page)).target).toBe(16);expect((await guide(page)).inside).toBe(false);expect((await guide(page)).urgent).toBe(true);await expect(page.locator(selector)).toContainText('早めに▲');
});
test('guide setting survives reload, is copied, is hidden in legacy, and also works in exploration',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copied=text},configurable:true}));
 await launch(page);await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await page.locator('#setting-targetHeightGuide').uncheck();
 await page.locator('#settings-copy').click();expect(await page.evaluate(()=>JSON.parse(window.copied).settings.targetHeightGuide)).toBe(false);
 await page.reload();await page.locator('#practice-button').click();await page.clock.runFor(100);await expect(page.locator('#target-height-inline')).toBeHidden();
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await expect(page.locator('#setting-targetHeightGuide')).not.toBeChecked();await page.locator('#setting-targetHeightGuide').check();
 await page.locator('#view-classic').click();await expect(page.locator('#setting-targetHeightGuide')).toBeDisabled();await page.locator('#settings-copy').click();expect(await page.evaluate(()=>JSON.parse(window.copied).inactiveSettings)).toContain('targetHeightGuide');
 await page.locator('#start-button').click();await page.clock.runFor(100);await expect(page.locator('#target-height-inline')).toBeHidden();
 await page.locator('#pause-button').click();await page.locator('#view-assisted').click();await page.locator('#mode-explore').click();await page.locator('#start-button').click();await page.clock.runFor(100);await expect(page.locator('#flight-essential-height #target-height-inline')).toBeVisible();
});

useLegacyCourse(test);
