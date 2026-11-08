import {test,expect} from './helpers/legacy-ui.js';
const sizes=[{width:390,height:844},{width:360,height:640},{width:844,height:390}];
const read=(page,key)=>page.locator('#app').getAttribute('data-'+key).then(JSON.parse);
const tick=(page,ms=100)=>page.clock.runFor(ms);
async function prepare(page,camera='cockpit'){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.addInitScript(()=>{
  localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,vibration:false}));
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.abCopy=JSON.parse(text);}}});
 });
 await page.goto(`/?mode=flight&course=legacy&camera=${camera}`);
 await expect(page.locator('#app')).toHaveAttribute('data-phase','intro');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 await page.locator('#practice-button').click();await tick(page,50);return errors;
}
async function dragTo(page,value){
 const input=page.locator('#throttle-input'),rect=await input.boundingBox(),before=Number(await input.inputValue());
 const delta=(value-before)/120*(rect.width-28),x=delta>=0?rect.x+14:rect.x+rect.width-14,y=rect.y+rect.height/2;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+delta,y,{steps:8});await page.mouse.up();await tick(page,120); // HUD snapshots refresh every 80 ms.
 await expect(input).toHaveValue(String(value));
}
async function earn(page){await tick(page,2700);await expect(page.locator('#collection-count')).toHaveText('1');expect((await read(page,'afterburner')).fuel).toBe(25);}
async function pauseSettings(page){await page.locator('#pause-button').click();await tick(page);await page.locator('#flight-adjustments > summary').click();}
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;

for(const camera of ['overlay','chase','cockpit'])for(const size of sizes)test(`paid AB drag, real speed and gauge fit ${camera} ${size.width}x${size.height}`,async({page})=>{
 await page.setViewportSize(size);const errors=await prepare(page,camera);
 await expect(page.locator('#afterburner-hud')).toHaveAttribute('data-active','false');await earn(page);
 const initialEffects=await read(page,'speed-effects');await dragTo(page,120);await tick(page,850);
 const ab=await read(page,'afterburner'),effects=await read(page,'speed-effects'),velocity=await read(page,'velocity');
 const actualSpeed=Math.hypot(velocity.x,velocity.y,velocity.z);
 expect(ab.active).toBe(true);expect(ab.uses).toBe(1);expect(ab.fuel).toBeGreaterThan(0);expect(ab.fuel).toBeLessThan(25);
 expect(actualSpeed).toBeGreaterThan(15);expect(ab.maxSpeed).toBeGreaterThanOrEqual(actualSpeed-1e-7);
 expect(effects.extraFov).toBeGreaterThan(3);expect(effects.lineCount).toBeGreaterThan(initialEffects.lineCount);
 await expect(page.locator('#speed-unit')).toHaveText('km/h');expect(Number(await page.locator('#speed-value').textContent())).toBeCloseTo(actualSpeed*3.6,0);
 await expect(page.locator('#afterburner-hud')).toHaveAttribute('data-active','true');
 const gauge=await page.locator('#afterburner-hud').boundingBox();
 expect(gauge.x).toBeGreaterThanOrEqual(0);expect(gauge.y).toBeGreaterThanOrEqual(0);expect(gauge.x+gauge.width).toBeLessThanOrEqual(size.width);expect(gauge.y+gauge.height).toBeLessThanOrEqual(size.height);
 for(const id of ['throttle-input','pause-button','recenter-button','afterburner-status','target-height-inline']){
  const element=page.locator('#'+id);if(await element.isVisible())expect(overlaps(gauge,await element.boundingBox()),id).toBe(false);
 }
 await page.screenshot({path:`.cache/v0127-ab-${camera}-${size.width}.png`});
 await dragTo(page,105);expect((await read(page,'afterburner')).active).toBe(true);
 const beforeRelease=(await read(page,'afterburner')).fuel;await dragTo(page,100);const released=await read(page,'afterburner');expect(released.active).toBe(false);expect(released.fuel).toBeLessThanOrEqual(beforeRelease);await tick(page,150);expect((await read(page,'afterburner')).fuel).toBe(released.fuel);
 expect(errors).toEqual([]);
});

test('an AB track tap and an empty request cannot ignite; exhaustion needs a release and pause freezes counters',async({page})=>{
 const errors=await prepare(page),input=page.locator('#throttle-input'),rect=await input.boundingBox();
 await page.mouse.click(rect.x+rect.width*.97,rect.y+rect.height/2);await tick(page);await expect(input).toHaveValue('50');
 await dragTo(page,120);await tick(page,250);expect((await read(page,'afterburner')).active).toBe(false);
 await dragTo(page,50);await earn(page);await dragTo(page,120);await tick(page,2400);
 let ab=await read(page,'afterburner');expect(ab.fuel).toBe(0);expect(ab.active).toBe(false);expect(ab.uses).toBe(1);expect(ab.needsRelease).toBe(true);
 await tick(page,250);expect((await read(page,'afterburner')).uses).toBe(1);
 await dragTo(page,100);expect((await read(page,'afterburner')).needsRelease).toBe(false);
 await pauseSettings(page);await page.locator('#settings-copy').click();const before=await page.evaluate(()=>window.abCopy);
 expect(before.afterburner.uses).toBe(1);expect(before.afterburner.seconds).toBeCloseTo(25/12,5);expect(before.afterburner.earned).toBe(25);expect(before.afterburner.maxSpeed).toBeGreaterThan(25);
 await tick(page,3000);await page.locator('#settings-copy').click();expect((await page.evaluate(()=>window.abCopy)).afterburner).toEqual(before.afterburner);expect(errors).toEqual([]);
});

test('six settings save individually and speed units convert real speed without changing the recording unit',async({page})=>{
 const errors=await prepare(page);await earn(page);await dragTo(page,120);await tick(page,600);await dragTo(page,100);await pauseSettings(page);
 await expect(page.locator('#setting-autoAfterburner')).not.toBeChecked();await expect(page.locator('#setting-autoAfterburnerAngle')).toBeDisabled();
 await page.locator('#setting-speedUnit').selectOption('kt');
 for(const [key,value]of Object.entries({streakAmount:.5,speedFov:7,autoAfterburnerAngle:40}))await page.locator('#setting-'+key).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 await page.locator('#setting-highSpeedShake').uncheck();await page.locator('#setting-autoAfterburner').check();
 await expect(page.locator('#setting-autoAfterburnerAngle')).toBeEnabled();
 await page.locator('#settings-copy').click();const report=await page.evaluate(()=>window.abCopy);
 expect(report.settings).toMatchObject({speedUnit:'kt',streakAmount:.5,speedFov:7,highSpeedShake:false,autoAfterburner:true,autoAfterburnerAngle:40});
 expect(report.afterburner.uses).toBe(1);expect(report.afterburner.maxSpeed).toBeGreaterThan(15);expect(report.afterburner.maxSpeed).toBeLessThan(45.000001);
 await page.locator('#start-button').click();await tick(page,100);let velocity=await read(page,'velocity');
 expect(Number(await page.locator('#speed-value').textContent())).toBeCloseTo(Math.hypot(velocity.x,velocity.y,velocity.z)*3600/1852,0);
 await page.reload();await tick(page,100);await page.locator('#practice-button').click();await tick(page,100);await expect(page.locator('#speed-unit')).toHaveText('kt');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('twist.flight-settings.v1')));expect(saved.autoAfterburner).toBe(true);expect(saved.speedFov).toBe(7);expect(errors).toEqual([]);
});

test('automatic AB is off initially and uses the actual nose-down input only when enabled',async({page})=>{
 const errors=await prepare(page);await earn(page);
 const pitch=page.locator('#practice-pitch');await pitch.evaluate(el=>{el.value='-25';el.dispatchEvent(new Event('input',{bubbles:true}));});await tick(page,250);
 expect((await read(page,'afterburner')).active).toBe(false);
 await pauseSettings(page);await page.locator('#setting-autoAfterburner').check();await page.locator('#setting-autoAfterburnerAngle').evaluate(el=>{el.value='25';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#start-button').click();await tick(page,50);await pitch.evaluate(el=>{el.value='-25';el.dispatchEvent(new Event('input',{bubbles:true}));});await tick(page,300);
 expect((await read(page,'afterburner')).active).toBe(true);
 await pitch.evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});await tick(page,100);expect((await read(page,'afterburner')).active).toBe(false);expect(errors).toEqual([]);
});

test('trusted keyboard can request AB; a scripted AB input and vertical touch cannot',async({page})=>{
 const errors=await prepare(page);await earn(page);const input=page.locator('#throttle-input');
 await input.evaluate(el=>{el.value='120';el.dispatchEvent(new Event('input',{bubbles:true}));});await tick(page);
 await expect(input).toHaveValue('50');expect((await read(page,'afterburner')).active).toBe(false);
 const r=await input.boundingBox(),touch=await page.context().newCDPSession(page),x=r.x+r.width/2,y=r.y+r.height/2;
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+1,y:y-35}]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touch.detach();await tick(page);
 await expect(input).toHaveValue('50');await input.focus();await input.press('End');await tick(page);
 expect((await read(page,'afterburner')).active).toBe(true);await input.press('Home');await tick(page);
 expect((await read(page,'afterburner')).active).toBe(false);await expect(input).toHaveValue('0');expect(errors).toEqual([]);
});

test('exploration shares assisted flow and units, resets those defaults, and preserves flight tuning',async({page})=>{
 const errors=await prepare(page);await pauseSettings(page);
 await page.locator('#setting-maxPitch').evaluate(el=>{el.value='25';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#mode-explore').click();await page.locator('#start-button').click();await tick(page,50);
 await page.keyboard.down('w');await tick(page,3000);await page.keyboard.up('w');await tick(page,100);
 const effects=await read(page,'speed-effects');expect(effects.visible).toBe(true);expect(effects.lineCount).toBeGreaterThan(0);expect(effects.extraFov).toBe(0);
 expect((await read(page,'afterburner')).active).toBe(false);await expect(page.locator('#afterburner-hud')).toBeHidden();
 await pauseSettings(page);await expect(page.locator('#setting-streakAmount')).toBeVisible();await page.locator('#setting-speedUnit').selectOption('kt');
 await page.locator('#setting-streakAmount').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.locator('#settings-copy').click();const report=await page.evaluate(()=>window.abCopy);
 expect(report.inactiveSettings).not.toContain('streakAmount');expect(report.inactiveSettings).not.toContain('speedUnit');expect(report.afterburner).toBeUndefined();
 await page.locator('#settings-reset').click();await expect(page.locator('#setting-speedUnit')).toHaveValue('km/h');await expect(page.locator('#setting-streakAmount')).toHaveValue('1');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('twist.flight-settings.v1')).maxPitch)).toBe(25);expect(errors).toEqual([]);
});
