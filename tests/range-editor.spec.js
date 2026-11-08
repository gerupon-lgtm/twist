import {useLegacyCourse} from './helpers/legacy-course.js';
import {test,expect} from './helpers/legacy-ui.js';
test.use({hasTouch:true});
const input=page=>page.locator('#setting-maxPitch');
async function settings(page,camera='overlay') {
 await page.goto('/?mode=flight&camera='+camera);await page.locator('#practice-button').click();await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await input(page).scrollIntoViewIfNeeded();
}
async function drag(page,locator,delta) {
 const box=await locator.boundingBox(),x=box.x+box.width*.3,y=box.y+box.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+delta,y,{steps:5});await page.mouse.up();
}
test('range track taps preserve values; relative dragging, arrows, individual undo/default and reload history work',async({page})=>{
 await settings(page);const range=input(page),box=await range.boundingBox();
 await page.mouse.click(box.x+box.width*.9,box.y+box.height/2);await expect(range).toHaveValue('15');
 await drag(page,range,40);const changed=Number(await range.inputValue());expect(changed).toBeGreaterThan(15);expect(changed).toBeLessThan(35);
 await expect(page.locator('[data-range-before=setting-maxPitch]')).toHaveText('変更前：15°');
 await page.locator('[data-range-undo=setting-maxPitch]').click();await expect(range).toHaveValue('15');
 await range.focus();await page.keyboard.press('ArrowRight');await expect(range).toHaveValue('16');
 await page.locator('[data-range-reset=setting-maxPitch]').click();await expect(range).toHaveValue('15');await expect(page.locator('[data-range-before=setting-maxPitch]')).toHaveText('変更前：16°');
 await page.reload();await page.locator('#practice-button').click();await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();
 await expect(page.locator('[data-range-before=setting-maxPitch]')).toHaveText('変更前：16°');await page.locator('[data-range-undo=setting-maxPitch]').click();await expect(range).toHaveValue('16');
});
test('one-field reset preserves other settings, and a full reset can be undone',async({page})=>{
 await settings(page);
 const adjust=async(id,v)=>page.locator('#setting-'+id).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},v);
 await adjust('maxPitch',25);await adjust('maxBank',20);await page.locator('[data-range-reset=setting-maxPitch]').click();await expect(input(page)).toHaveValue('15');await expect(page.locator('#setting-maxBank')).toHaveValue('20');
 await page.locator('#settings-reset').click();await expect(page.locator('#setting-maxBank')).toHaveValue('40');await page.locator('#settings-undo-reset').click();await expect(page.locator('#setting-maxBank')).toHaveValue('20');
});
test('practice gauges also reject track taps and display current/previous values',async({page})=>{
 await page.goto('/?mode=flight');await page.locator('#practice-button').click();await expect(page.locator('#practice-summary')).toContainText('スマホの傾きは無効');await page.locator('#practice-summary').click();
 const range=page.locator('#practice-pitch');await range.scrollIntoViewIfNeeded();const box=await range.boundingBox();await page.mouse.click(box.x+box.width*.9,box.y+box.height/2);await expect(range).toHaveValue('0');
 await drag(page,range,20);expect(Number(await range.inputValue())).toBeGreaterThan(0);await expect(page.locator('[data-range-before=practice-pitch]')).toHaveText('変更前：0°');
 await page.locator('[data-range-reset=practice-pitch]').click();await expect(range).toHaveValue('0');
});
test('practice can switch to sensors safely; denial keeps the game stopped and explains it',async({page})=>{
 await page.addInitScript(()=>{
  class Orientation extends Event {static requestPermission(){return Promise.resolve('denied');}}
  Object.defineProperty(window,'DeviceOrientationEvent',{value:Orientation,configurable:true});
 });
 await page.goto('/?mode=flight&camera=cockpit');await page.locator('#practice-button').click();await expect(page.locator('#recenter-button')).toHaveText('スマホの傾きに切替');await page.locator('#recenter-button').click();
 await expect(page.locator('#app')).toHaveAttribute('data-phase','error');await expect(page.locator('#error-message')).toContainText('許可されていません');await expect(page.locator('#throttle-value')).toHaveText('0%');await expect(page.locator('#speed-value')).toHaveText('0.0');
});
test('successful switch requires a fresh held-pose start before tilt controls resume',async({page})=>{
 await page.addInitScript(()=>{
  class Orientation extends Event {static requestPermission(){return Promise.resolve('granted');}}
  Object.defineProperty(window,'DeviceOrientationEvent',{value:Orientation,configurable:true});
 });
 await page.goto('/?mode=flight&camera=cockpit');await page.locator('#practice-button').click();await page.locator('#recenter-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','waiting');
 await page.evaluate(()=>{window.pose=setInterval(()=>window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta:0,gamma:0})),50);});
 await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');await expect(page.locator('#throttle-value')).toHaveText('0%');await page.locator('#start-button').click();await expect(page.locator('#app')).toHaveAttribute('data-input','sensor');await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await expect(page.locator('#practice-panel')).toBeHidden();
 await page.evaluate(()=>{clearInterval(window.pose);window.pose=setInterval(()=>window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta:15,gamma:0})),50);});
 await expect.poll(()=>page.locator('#app').getAttribute('data-pitch-target').then(Number)).toBeGreaterThan(0);
});
test('sensor mode cannot be replaced in flight or by an unconfirmed screen-mode selection',async({page})=>{
 await page.addInitScript(()=>{
  class Orientation extends Event {static requestPermission(){return Promise.resolve('granted');}}
  Object.defineProperty(window,'DeviceOrientationEvent',{value:Orientation,configurable:true});
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copied=text},configurable:true});
 });
 await page.goto('/?mode=flight');await page.locator('#start-button').click();
 await page.evaluate(()=>{window.pose=setInterval(()=>window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta:0,gamma:0})),50);});await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');await page.locator('#start-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
 await page.evaluate(()=>document.querySelector('#practice-button').click());await expect(page.locator('#app')).toHaveAttribute('data-input','sensor');await expect(page.locator('#practice-panel')).toBeHidden();
 await page.locator('#pause-button').click();page.once('dialog',dialog=>dialog.dismiss());await page.locator('#practice-button').click();await expect(page.locator('#app')).toHaveAttribute('data-input','sensor');await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
 page.once('dialog',dialog=>dialog.accept());await page.locator('#practice-button').click();await expect(page.locator('#app')).toHaveAttribute('data-input','practice');await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await page.locator('#settings-copy').click();expect(await page.evaluate(()=>JSON.parse(window.copied).input.transitions.at(-1))).toMatchObject({from:'sensor',to:'practice',reason:'screen-button-confirmed'});
});
test('touch taps do not jump, horizontal dragging adjusts, and vertical scrolling preserves the setting',async({page})=>{
 await settings(page);const range=input(page);let box=await range.boundingBox();
 await page.touchscreen.tap(box.x+box.width*.9,box.y+box.height/2);await expect(range).toHaveValue('15');
 const session=await page.context().newCDPSession(page);
 const gesture=async(dx,dy)=>{box=await range.boundingBox();const x=box.x+box.width*.4,y=box.y+box.height/2;await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=5;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/5,y:y+dy*i/5}]});await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});};
 await gesture(30,0);expect(Number(await range.inputValue())).toBeGreaterThan(15);const value=await range.inputValue();
 const beforeScroll=await page.locator('#veil').evaluate(el=>el.scrollTop);
 await gesture(0,-60);await expect(range).toHaveValue(value);await expect.poll(()=>page.locator('#veil').evaluate(el=>el.scrollTop)).toBeGreaterThan(beforeScroll);await session.detach();
});
test('FOV history restores automatic mode as well as the previous manual value after an individual reset',async({page})=>{
 await settings(page,'cockpit');await page.locator('#cockpit-fov-auto').uncheck();await expect(page.locator('[data-range-before=setting-cockpitFov]')).toHaveText('変更前：自動');
 await page.locator('[data-range-undo=setting-cockpitFov]').click();await expect(page.locator('#cockpit-fov-auto')).toBeChecked();
 await page.locator('#cockpit-fov-auto').uncheck();await page.locator('#setting-cockpitFov').evaluate(el=>{el.value='60';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('[data-range-reset=setting-cockpitFov]').click();await expect(page.locator('#cockpit-fov-auto')).toBeChecked();await expect(page.locator('[data-range-undo=setting-cockpitFov]')).toBeEnabled();
 await page.locator('[data-range-undo=setting-cockpitFov]').click();await expect(page.locator('#cockpit-fov-auto')).not.toBeChecked();await expect(page.locator('#setting-cockpitFov')).toHaveValue('60');
});

useLegacyCourse(test);
