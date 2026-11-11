import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {formatSupersonicAltitude} from '../src/supersonic-presentation.js';
import {waitForCountdownThree} from './helpers/countdown.js';

const sizes=[{width:390,height:844},{width:360,height:640},{width:844,height:390}];
const step=(page,value)=>expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step',value);
async function read(page){return page.locator('#app').evaluate(app=>({sonic:JSON.parse(app.dataset.supersonic),position:JSON.parse(app.dataset.position),speed:Number(app.dataset.speed)}));}
async function input(page,id,value){await page.locator('#'+id).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);}
async function boot(page,size){
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize(size);await page.clock.install();
  await page.addInitScript(()=>{
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'chase'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,vibration:false}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
  });
  await page.goto('/?course=supersonic&camera=chase');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  await step(page,'title');await page.locator('#start-flow-start').click();await step(page,'courses');
  await page.locator('#start-flow-course-start').click();await step(page,'pose');await page.locator('#start-flow-hold').click();
  await step(page,'countdown');await waitForCountdownThree(page);
  await page.clock.runFor(3500);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');return errors;
}
async function geometry(page){return page.evaluate(()=>{
  const rect=id=>{const el=document.getElementById(id);if(!el||el.hasAttribute('hidden')||!el.getClientRects().length)return null;const r=el.getBoundingClientRect();return r.width&&r.height?{id,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null;};
  const controls=['throttle-input','practice-pitch','practice-steer','practice-twist','pause-button','recenter-button','help-button','practice-neutral','practice-brake','start-flow-view-button'].map(rect);
  const card=rect('supersonic-mach-g'),ids=['radar','flight-essential-speed','flight-essential-altitude','cockpit-speed','cockpit-altitude','cockpit-vario','cockpit-heading','cockpit-target-height','cockpit-power','bottom-panel','practice-panel','start-flow-view-button'];
  const navigation=document.querySelector('.navigation').getBoundingClientRect();
  return {width:innerWidth,height:innerHeight,roots:[document.documentElement,document.body,document.getElementById('app')].map(e=>({id:e.id||e.tagName,width:e.scrollWidth,height:e.scrollHeight})),controls,card,markers:['guidance-director','guidance-flight-path'].map(rect),obstacles:[...ids.map(rect).filter(Boolean),{id:'navigation',left:navigation.left,right:navigation.right,top:navigation.top,bottom:navigation.bottom}]};
});}
function checkGeometry(g,label){
  for(const r of g.roots){expect(r.width,`${label} ${r.id} scroll width`).toBeLessThanOrEqual(g.width+1);expect(r.height,`${label} ${r.id} scroll height`).toBeLessThanOrEqual(g.height+1);}
  expect(g.card,`${label} Mach/G card`).not.toBeNull();
  for(const r of [...g.controls,g.card,...g.markers]){expect(r,`${label} required control or guidance`).not.toBeNull();expect(r.left,`${label} ${r.id}`).toBeGreaterThanOrEqual(-.5);expect(r.top,`${label} ${r.id}`).toBeGreaterThanOrEqual(-.5);expect(r.right,`${label} ${r.id}`).toBeLessThanOrEqual(g.width+.5);expect(r.bottom,`${label} ${r.id}`).toBeLessThanOrEqual(g.height+.5);}
  for(const r of g.obstacles)expect(g.card.left<r.right&&g.card.right>r.left&&g.card.top<r.bottom&&g.card.bottom>r.top,`${label} Mach/G intersects ${r.id}`).toBe(false);
  for(const marker of g.markers)for(const r of [...g.obstacles,g.card])expect(marker.left<r.right&&marker.right>r.left&&marker.top<r.bottom&&marker.bottom>r.top,`${label} ${marker.id} intersects ${r.id}`).toBe(false);
}

for(const size of sizes)test(`sonic real play keeps M/G, kilometre altitude and actual controls separate in all views ${size.width}x${size.height}`,async({page})=>{
  const errors=await boot(page,size),throttle=await page.locator('#throttle-input').boundingBox(),evidence=[];
  for(const camera of ['chase','cockpit']){
    if(camera!=='chase'){await page.locator('#start-flow-view-button').click();await page.clock.runFor(100);}
    await expect(page.locator('#app')).toHaveAttribute('data-camera',camera);
    await expect(page.locator('#app')).toHaveAttribute('data-guidance-ready','true');
    const state=await read(page);expect(state.sonic).not.toBeNull();
    await expect(page.locator('#supersonic-mach')).toHaveText(`M ${state.sonic.mach.toFixed(2)}`);
    await expect(page.locator('#supersonic-g')).toHaveText(`G ${state.sonic.gLoad.toFixed(1)}`);
    expect(state.sonic.mach).toBeCloseTo(state.speed/340,4);
    if(camera==='cockpit'){await expect(page.locator('#cockpit-altitude strong')).toHaveText(formatSupersonicAltitude(state.position.y));await expect(page.locator('#cockpit-altitude')).toHaveAttribute('aria-label',`ALT ${state.position.y.toFixed(1)} m`);}
    else await expect(page.locator('#altitude-value')).toHaveText(formatSupersonicAltitude(state.position.y));
    await expect(page.locator('#afterburner-hud output')).toHaveText('∞');
    const g=await geometry(page);checkGeometry(g,`${camera} ${size.width}x${size.height}`);evidence.push({camera,state,geometry:g});
    const box=await page.locator('#throttle-input').boundingBox();for(const key of ['x','y','width','height'])expect(Math.abs(box[key]-throttle[key])).toBeLessThanOrEqual(.5);
    await page.screenshot({path:`.cache/v0137-sonic-ui-${camera}-${size.width}x${size.height}.png`});
  }
  await writeFile(`.cache/v0137-sonic-ui-${size.width}x${size.height}.json`,JSON.stringify({evidence,errors},null,2));expect(errors).toEqual([]);
});

test('sonic settings save independently and physical changes wait for the next attempt',async({page})=>{
  const errors=await boot(page,sizes[1]),before=await read(page);
  await page.locator('#pause-button').click();await step(page,'pause');await page.locator('#start-flow-pause-settings').click();await step(page,'settings');
  const normalBefore=await page.evaluate(()=>localStorage.getItem('twist.flight-settings.v1'));
  await input(page,'supersonic-maxG',12);await input(page,'supersonic-pitchGain',.4);await input(page,'supersonic-radarRange',14000);await page.locator('#supersonic-fuelMode').selectOption('gauge');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('twist.supersonic-settings.v1')))).toEqual({maxG:12,fuelMode:'gauge',pitchGain:.4,radarRange:14000});
  expect(await page.evaluate(()=>localStorage.getItem('twist.flight-settings.v1'))).toBe(normalBefore);
  await expect(page.locator('#supersonic-effective-settings')).toContainText('現在の飛行：9G');
  await page.locator('#start-flow-settings-close').click();await step(page,'pause');await page.locator('#start-flow-resume').click();await page.clock.runFor(200);
  const resumed=await read(page);expect(resumed.sonic.effectiveSettings).toEqual(before.sonic.effectiveSettings);await expect(page.locator('#afterburner-hud output')).toHaveText('∞');
  await page.locator('#pause-button').click();await page.locator('#start-flow-course-exit').click();await step(page,'confirm-exit');await page.locator('#start-flow-confirm-exit').click();await step(page,'courses');
  await page.locator('#start-flow-course-start').click();await step(page,'pose');await page.locator('#start-flow-hold').click();await page.clock.runFor(3500);
  const fresh=await read(page);expect(fresh.sonic.attemptId).not.toBe(before.sonic.attemptId);
  expect(fresh.sonic.effectiveSettings).toMatchObject({maxG:12,fuelMode:'gauge',pitchGain:.4});
  await expect(page.locator('#afterburner-hud output')).not.toHaveText('∞');
  expect(errors).toEqual([]);
});

test('actual sonic climb reaches ALT2.4k and reports measured Mach/G across all three views',async({page})=>{
  test.setTimeout(60000);const errors=await boot(page,sizes[0]);
  await page.locator('#throttle-input').press('End');await input(page,'practice-pitch',12);
  let state=await read(page),sawSonic=false,sawNotice=false,sawCone=false;
  for(let i=0;i<480&&state.position.y<2400;i++){
    await page.clock.runFor(250);state=await read(page);
    expect(state.position.y).toBeGreaterThan(1000);
    if(state.sonic.mach>=1.01)sawSonic=true;
    if(await page.locator('#supersonic-transition-notice').textContent()==='SUPERSONIC')sawNotice=true;
    const effects=await page.locator('#app').evaluate(app=>JSON.parse(app.dataset.speedEffects??'{}'));
    if(effects.coneVisible){sawCone=true;}
  }
  expect(sawSonic).toBe(true);expect(sawNotice).toBe(true);expect(sawCone).toBe(true);expect(state.position.y).toBeGreaterThanOrEqual(2400);
  expect(formatSupersonicAltitude(state.position.y)).toBe('2.4k');
  for(const camera of ['chase','cockpit']){
    if(camera!=='chase'){await page.locator('#start-flow-view-button').click();await page.clock.runFor(100);}
    state=await read(page);
    if(camera==='cockpit'){
      const speed=await page.locator('#cockpit-speed').evaluate(e=>{const value=e.querySelector('strong'),range=document.createRange();range.selectNodeContents(value);const text=range.getBoundingClientRect(),box=e.getBoundingClientRect();return{text:value.textContent,inside:text.left>=box.left&&text.right<=box.right};});
      expect(speed.text).toBe((state.speed*3.6).toFixed(1));expect(speed.inside).toBe(true);
    }
    await expect(page.locator('#supersonic-mach')).toHaveText(`M ${state.sonic.mach.toFixed(2)}`);
    await expect(page.locator('#supersonic-g')).toHaveText(`G ${state.sonic.gLoad.toFixed(1)}`);
    const altitude=camera==='cockpit'?page.locator('#cockpit-altitude strong'):page.locator('#altitude-value');
    await expect(altitude).toHaveText(formatSupersonicAltitude(state.position.y));checkGeometry(await geometry(page),`ALT2.4k ${camera}`);
    await page.screenshot({path:`.cache/v0137-sonic-alt24-${camera}.png`});
  }
  expect(errors).toEqual([]);
});
