import {test,expect} from './helpers/legacy-ui.js';
import {convertSpeed} from '../src/speed-units.js';
const sizes=[{width:390,height:844},{width:360,height:640},{width:844,height:390}];
const read=(page,key)=>page.locator('#app').getAttribute('data-'+key);
const intersects=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
async function launch(page,mode,camera,size,{collapsePractice=true}={}){
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(size);
  await page.addInitScript(()=>localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,vibration:false})));
  await page.clock.install({time:new Date('2026-11-08T01:00:00Z')});
  await page.goto(`/?mode=${mode}&course=hard&camera=${camera}`);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  await page.locator('#practice-button').click();await page.clock.runFor(160);
  if(collapsePractice&&await page.locator('#practice-panel').evaluate(el=>el.open))await page.locator('#practice-summary').click();
  await page.clock.runFor(160);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');return errors;
}
async function rects(page,selectors){
  return page.evaluate(selectors=>selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getClientRects().length&&!el.closest('[hidden]')).map(el=>{
    const r=el.getBoundingClientRect();return {selector,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
  })),selectors);
}
async function compactPanel(page,size,flight){
  for(const selector of ['#bottom-panel > .input-line','#bottom-panel > .meters','#flight-attitude'])await expect(page.locator(selector)).toBeHidden();
  const panel=await page.locator('#bottom-panel').boundingBox();expect(panel.height).toBeLessThanOrEqual(220);
  expect(panel.x).toBeGreaterThanOrEqual(0);expect(panel.x+panel.width).toBeLessThanOrEqual(size.width+.5);
  for(const id of ['pause-button','recenter-button','help-button'])await expect(page.locator('#'+id)).toBeInViewport();
  if(flight){await expect(page.locator('#throttle-input')).toBeVisible();await expect(page.locator('#throttle-input')).toBeEnabled();await expect(page.locator('#afterburner-hud')).toBeVisible();}
  else{await expect(page.locator('#flight-throttle')).toBeHidden();}
}
async function essentialValues(page,size){
  await expect(page.locator('#flight-essential-hud')).toBeVisible();
  const words=await page.locator('#flight-essential-hud').innerText();expect(words).toContain('SPD');expect(words).toContain('ALT');expect(words).not.toMatch(/[\u3040-\u30ff\u3400-\u9fff]/);
  for(const id of ['speed-value','altitude-value'])await expect(page.locator('#'+id)).toBeInViewport();
  const speed=Number(await read(page,'speed')),altitude=JSON.parse(await read(page,'position')).y;
  const unit=await page.locator('#speed-unit').textContent();expect(Number(await page.locator('#speed-value').textContent())).toBeCloseTo(convertSpeed(speed,unit),0);
  expect(Number(await page.locator('#altitude-value').textContent())).toBeCloseTo(altitude,0);
  const information=await rects(page,['#speed-value','#altitude-value','#target-height-inline']);
  const reserved=await rects(page,['#radar','.navigation','#bottom-panel']);
  for(const r of information){expect(r.left).toBeGreaterThanOrEqual(0);expect(r.right).toBeLessThanOrEqual(size.width+.5);expect(r.top).toBeGreaterThanOrEqual(0);expect(r.bottom).toBeLessThanOrEqual(size.height+.5);
    for(const other of reserved)expect(intersects(r,other),`${r.selector} overlaps ${other.selector}`).toBe(false);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
for(const size of sizes)for(const camera of ['overlay','chase','cockpit'])test(`flight ${camera} has its own HUD and compact controls ${size.width}x${size.height}`,async({page})=>{
  const errors=await launch(page,'flight',camera,size);await compactPanel(page,size,true);
  await expect(page.locator('#app')).toHaveAttribute('data-guidance-ready','true');
  for(const id of ['guidance-flight-path','guidance-director'])await expect(page.locator('#'+id)).toBeVisible();
  if(camera==='cockpit'){
    await expect(page.locator('#flight-essential-hud')).toBeHidden();
    for(const id of ['cockpit-speed','cockpit-altitude','cockpit-target-height'])await expect(page.locator('#'+id)).toBeInViewport();
  }else{
    await essentialValues(page,size);await expect(page.locator('#target-height-inline')).toBeInViewport();
    await expect(page.locator('#cockpit-hud')).toBeHidden();
    expect(await page.locator('#bottom-panel').locator('#speed-value, #altitude-value, #target-height-inline').count()).toBe(0);
  }
  await page.screenshot({path:`.cache/v0129-mode-hud-${camera}-${size.width}x${size.height}.png`});
  await page.locator('#pause-button').click();await page.clock.runFor(160);await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
  await page.locator('#start-button').click();await page.clock.runFor(160);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  expect(errors).toEqual([]);
});
for(const size of sizes)test(`exploration exposes movement and target information without flight controls ${size.width}x${size.height}`,async({page})=>{
  const errors=await launch(page,'explore','overlay',size);await compactPanel(page,size,false);await essentialValues(page,size);
  await expect(page.locator('#cockpit-hud')).toBeHidden();await expect(page.locator('#target-height-inline')).toBeInViewport();
  await page.screenshot({path:`.cache/v0129-mode-hud-explore-${size.width}x${size.height}.png`});expect(errors).toEqual([]);
});
for(const size of sizes)test(`exploration keeps the actual screen-input panel open and separate ${size.width}x${size.height}`,async({page})=>{
  const errors=await launch(page,'explore','overlay',size,{collapsePractice:false});
  expect(await page.locator('#practice-panel').evaluate(el=>el.open)).toBe(true);
  await essentialValues(page,size);
  const instruments=await rects(page,['#flight-essential-speed','#flight-essential-altitude']),controls=await rects(page,['#bottom-panel','#practice-panel','#bottom-panel .toolbar']);
  for(const a of instruments)for(const b of controls)expect(intersects(a,b),`${a.selector} overlaps open ${b.selector}`).toBe(false);
  // The established input panel deliberately scrolls at a 42vh maximum height.
  // Exercise every real input through that interface rather than requiring all
  // rows on screen at once and changing the product to satisfy a new test.
  for(const id of ['practice-pitch','practice-steer','practice-twist']){
    const input=page.locator('#'+id);await input.scrollIntoViewIfNeeded();await expect(input).toBeInViewport();await expect(input).toBeEnabled();
    const value=Number(await input.inputValue());await input.focus();await page.keyboard.press('ArrowRight');await expect(input).toHaveValue(String(value+1));
    await page.keyboard.press('ArrowLeft');await expect(input).toHaveValue(String(value));
  }
  for(const id of ['pause-button','recenter-button','help-button'])await expect(page.locator('#'+id)).toBeInViewport();
  const finalInstruments=await rects(page,['#flight-essential-speed','#flight-essential-altitude']),finalControls=await rects(page,['#bottom-panel','#practice-panel','#bottom-panel .toolbar']);
  for(const a of finalInstruments)for(const b of finalControls)expect(intersects(a,b),`${a.selector} overlaps scrolled ${b.selector}`).toBe(false);
  await page.screenshot({path:`.cache/v0129-mode-hud-explore-open-${size.width}x${size.height}.png`});expect(errors).toEqual([]);
});
test('the outer-view HUD retains saved Japanese labels and the chosen speed unit',async({page})=>{
  const errors=await launch(page,'flight','overlay',sizes[0]);
  await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();
  await page.locator('#setting-hudLanguage').selectOption('ja');await page.locator('#setting-speedUnit').selectOption('kt');
  await page.locator('#start-button').click();await page.clock.runFor(160);
  await expect(page.locator('#flight-essential-hud')).toHaveAttribute('aria-label',/飛行/);
  await expect(page.locator('#speed-unit')).toHaveText('kt');
  expect(Number(await page.locator('#speed-value').textContent())).toBeCloseTo(convertSpeed(Number(await read(page,'speed')),'kt'),0);
  expect(await page.locator('#target-height-inline').innerText()).toContain('目標');expect(errors).toEqual([]);
});
test('warning rendering fixture keeps an unpowered stall visible without claiming powered recovery',async({page})=>{
  const errors=await launch(page,'flight','overlay',sizes[0]);const before=await read(page,'position');
  const warning=await page.evaluate(async()=>{
    const {updateEssentialHud}=await import('/src/essential-hud.js');
    updateEssentialHud({angleOfAttack:25*Math.PI/180,recoveryAssist:0,throttle:0,verticalSpeed:-2},{phase:'running',mode:'flight',camera:'overlay',language:'ja'});
    const node=document.getElementById('flight-warning-text');return {text:node.textContent,visible:!node.hidden&&node.getClientRects().length>0};
  });
  expect(warning).toEqual({text:'失速',visible:true});expect(await read(page,'position')).toBe(before);expect(errors).toEqual([]);
});
test('actual unpowered cockpit flight warns when incidence stalls without powered recovery',async({page})=>{
  const errors=await launch(page,'flight','cockpit',sizes[0]);
  await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();
  await page.locator('#setting-maxPitch').focus();await page.keyboard.press('End');await expect(page.locator('#setting-maxPitch')).toHaveValue('35');
  await page.locator('#start-button').click();await page.clock.runFor(100);
  await page.locator('#throttle-input').focus();await page.keyboard.press('Home');await expect(page.locator('#throttle-input')).toHaveValue('0');
  if(!await page.locator('#practice-panel').evaluate(el=>el.open))await page.locator('#practice-summary').click();
  await page.locator('#practice-pitch').focus();await page.keyboard.press('End');
  for(let i=0;i<40&&!((await page.locator('#cockpit-power').textContent()).includes('STALL'));i++)await page.clock.runFor(100);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  expect(Number(await read(page,'throttle'))).toBe(0);expect(Number(await read(page,'recovery-assist'))).toBe(0);
  await expect(page.locator('#cockpit-power')).toContainText('STALL');await expect(page.locator('#cockpit-power')).toBeVisible();expect(errors).toEqual([]);
});
