import {test,expect} from './helpers/legacy-ui.js';
import {COURSE_BESTS_KEY,formatCourseTime} from '../src/course-bests.js';
import {RADAR_UPGRADE_KEY} from '../src/radar-upgrade.js';

const data=(page,key)=>page.locator('#app').getAttribute('data-'+key).then(JSON.parse);
const tick=(page,ms=160)=>page.clock.runFor(ms);
async function prepare(page,query='mode=flight&course=legacy&camera=cockpit',settings={}){
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(settings=>{if(!localStorage.getItem('twist.flight-settings.v1'))localStorage.setItem('twist.flight-settings.v1',JSON.stringify({maxBank:30,...settings}));localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,vibration:false}));Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.speedfeelCopy=JSON.parse(text);}}});},settings);
  await page.clock.install();await page.goto('/?'+query);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));return errors;
}
async function start(page){await page.locator('#practice-button').click();await tick(page);}
async function copy(page){await page.locator('#result-copy').click();return page.evaluate(()=>window.speedfeelCopy);}

for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}])test(`one-time 60m radar offer preserves other choices and fits ${size.width}x${size.height}`,async({page})=>{
  await page.setViewportSize(size);const errors=await prepare(page,'mode=flight',{radarRange:60,maxBank:27,deadzone:5,hudLanguage:'ja'});
  await expect(page.locator('#radar-upgrade-notice')).toBeHidden();expect(await page.evaluate(key=>localStorage.getItem(key),RADAR_UPGRADE_KEY)).toBeNull();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','intro');
  for(const id of ['start-button','practice-button'])await expect(page.locator('#'+id)).toBeInViewport();
  await start(page);await page.locator('#pause-button').click();await tick(page);await expect(page.locator('#start-button')).toBeInViewport();
  await page.locator('#flight-adjustments > summary').click();await tick(page);expect(await page.evaluate(key=>localStorage.getItem(key),RADAR_UPGRADE_KEY)).toBeNull();
  // A notice below the scroll position has not been seen. Closing it must keep
  // the proposal eligible for a later visit to the radar settings.
  await page.locator('#flight-adjustments > summary').click();await tick(page);expect(await page.evaluate(key=>localStorage.getItem(key),RADAR_UPGRADE_KEY)).toBeNull();
  await page.locator('#flight-adjustments > summary').click();await page.locator('#radar-upgrade-notice').scrollIntoViewIfNeeded();await tick(page);
  await expect.poll(()=>page.evaluate(key=>localStorage.getItem(key),RADAR_UPGRADE_KEY)).toBe('shown');
  const row=await page.locator('[data-setting-key="radarRange"]').boundingBox(),notice=await page.locator('#radar-upgrade-notice').boundingBox();expect(notice.y).toBeGreaterThanOrEqual(row.y+row.height-1);expect(notice.x).toBeGreaterThanOrEqual(0);expect(notice.x+notice.width).toBeLessThanOrEqual(size.width+.5);
  await page.screenshot({path:`test-results/v0129-radar-offer-${size.width}x${size.height}.png`});
  await page.locator('#radar-upgrade-accept').click();await expect(page.locator('#radar-upgrade-notice')).toBeHidden();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('twist.flight-settings.v1')));expect(saved).toMatchObject({radarRange:180,maxBank:27,deadzone:5,hudLanguage:'ja'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#flight-adjustments > summary').click();await page.locator('#start-button').scrollIntoViewIfNeeded();await expect(page.locator('#start-button')).toBeInViewport();
  // The next page load must retain the user's chosen 180m without another offer.
  await page.goto('/?mode=flight');await tick(page);await expect(page.locator('#radar-upgrade-notice')).toBeHidden();expect(errors).toEqual([]);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('twist.flight-settings.v1')).radarRange)).toBe(180);
});

test('keeping the old radar range leaves saved settings untouched and a shown offer never reappears',async({page})=>{
  const errors=await prepare(page,'mode=explore',{radarRange:60,maxBank:27});const before=await page.evaluate(()=>localStorage.getItem('twist.flight-settings.v1'));
  await expect(page.locator('#radar-upgrade-notice')).toBeHidden();await start(page);await page.locator('#pause-button').click();await tick(page);await page.locator('#flight-adjustments > summary').click();await page.locator('#radar-upgrade-notice').scrollIntoViewIfNeeded();await tick(page);
  await page.locator('#radar-upgrade-keep').click();expect(await page.evaluate(()=>localStorage.getItem('twist.flight-settings.v1'))).toBe(before);
  expect(await page.evaluate(key=>localStorage.getItem(key),RADAR_UPGRADE_KEY)).toBe('shown');await page.locator('#flight-adjustments > summary').click();await page.locator('#flight-adjustments > summary').click();await tick(page);await expect(page.locator('#radar-upgrade-notice')).toBeHidden();
  await page.reload();await tick(page);await expect(page.locator('#radar-upgrade-notice')).toBeHidden();await start(page);await page.locator('#pause-button').click();await tick(page);await page.locator('#flight-adjustments > summary').click();await expect(page.locator('#radar-upgrade-notice')).toBeHidden();expect(errors).toEqual([]);
});

test('a radar proposal seen in settings disappears on close without changing its saved value',async({page})=>{
  const errors=await prepare(page,'mode=flight',{radarRange:60});await start(page);await page.locator('#pause-button').click();await tick(page);await page.locator('#flight-adjustments > summary').click();await page.locator('#radar-upgrade-notice').scrollIntoViewIfNeeded();await tick(page);
  await expect.poll(()=>page.evaluate(key=>localStorage.getItem(key),RADAR_UPGRADE_KEY)).toBe('shown');
  await page.locator('#flight-adjustments > summary').click();await page.locator('#flight-adjustments > summary').click();await tick(page);await expect(page.locator('#radar-upgrade-notice')).toBeHidden();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('twist.flight-settings.v1')).radarRange)).toBe(60);expect(errors).toEqual([]);
});

for(const mode of ['flight','explore'])test(`ground strength follows the saved panel value and classic disables it in ${mode}`,async({page})=>{
  const errors=await prepare(page,`mode=${mode}&course=legacy`,{groundPatternStrength:.3});await tick(page);expect((await data(page,'ground-pattern')).strength).toBe(.3);
  await start(page);await page.locator('#pause-button').click();await tick(page);await page.locator('#flight-adjustments > summary').click();
  const input=page.locator('#setting-groundPatternStrength');await expect(input).toBeVisible();await expect(input).toBeEnabled();
  await input.evaluate(el=>{el.value='.6';el.dispatchEvent(new Event('input',{bubbles:true}));});await tick(page);
  const pattern=await data(page,'ground-pattern');expect(pattern.strength).toBe(.6);await tick(page,1000);expect((await data(page,'ground-pattern')).updates).toBe(pattern.updates);
  await page.locator('#view-classic').click();await tick(page);await expect(input).toBeDisabled();expect((await data(page,'ground-pattern')).visible).toBe(false);
  await page.locator('#settings-copy').click();expect((await page.evaluate(()=>window.speedfeelCopy)).inactiveSettings).toContain('groundPatternStrength');
  await page.locator('#view-assisted').click();await tick(page);await expect(input).toBeEnabled();expect((await data(page,'ground-pattern')).strength).toBe(.6);expect(errors).toEqual([]);
});

async function finishLegacyFlight(page,{pause=false}={}){
  let paused=false;
  for(let i=0;i<500;i++){
    const state=await page.evaluate(()=>{
      const d=document.getElementById('app').dataset;if(d.phase!=='running')return d.phase;
      const velocity=JSON.parse(d.velocity),direction=JSON.parse(d.guidanceDirection||'null'),speed=+d.speed,pitch=+d.flightPitch,gravity=+d.turnGravity;
      const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let inputPitch=0,steer=0;
      if(d.guidanceReady==='true'&&direction){
        const yaw=Math.atan2(direction.x,-direction.z),track=Math.atan2(velocity.x,-velocity.z),error=Math.atan2(Math.sin(yaw-track),Math.cos(yaw-track));
        const climb=Math.atan2(direction.y,Math.hypot(direction.x,direction.z)),actualClimb=Math.atan2(velocity.y,Math.hypot(velocity.x,velocity.z));
        const nose=clamp(pitch+1.5*(climb-actualClimb),-Math.PI/12,Math.PI/12),bank=clamp(Math.atan(error*1.5*Math.max(speed,6)/gravity),-Math.PI/6,Math.PI/6);
        inputPitch=Math.sign(nose)*(3+Math.abs(nose)/(Math.PI/12)*22);steer=Math.sign(bank)*(3+Math.abs(bank)/(Math.PI/6)*12);
      }
      for(const [id,value]of [['practice-pitch',inputPitch],['practice-steer',steer],['throttle-input',100*clamp(.5+(8-speed)*.3+pitch*.8,.15,1)]]){const input=document.getElementById(id);input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));}
      return d.phase;
    });
    if(state!=='running'){expect(state).toBe('complete');return;}
    if(pause&&!paused&&i===10){await page.locator('#pause-button').click();await tick(page);const before=await data(page,'segments');await tick(page,10000);expect(await data(page,'segments')).toEqual(before);await page.locator('#start-button').click();paused=true;}
    await tick(page,200);
  }
  throw Error('Actual legacy flight did not complete');
}

test('actual success saves active course time, result reads it back after reload, and failure cannot replace the best',async({page})=>{
  test.setTimeout(90000);const errors=await prepare(page);await start(page);await finishLegacyFlight(page,{pause:true});
  const report=await copy(page),seconds=report.segments.reduce((sum,row)=>sum+row.seconds,0);
  expect(report.courseTime).toMatchObject({mode:'flight',seconds,bestSeconds:seconds,newBest:true,saved:true});expect(report.courseTime.courseKey).toMatch(/^flight:legacy:/);
  expect(report.lastLeg.elapsedSeconds).toBeCloseTo(seconds,5);expect(report.segments.every(row=>Number.isFinite(row.closestDistance)&&row.nearMisses>=0&&row.nearMissRadius===15)).toBe(true);expect(report.approaches).toHaveLength(4);
  await expect(page.locator('#result-course-time')).toHaveText(formatCourseTime(seconds));await expect(page.locator('#result-best-time')).toHaveText(formatCourseTime(seconds));await expect(page.locator('#result-best-status')).toContainText('自己ベスト更新');
  for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}]){
    await page.setViewportSize(size);await tick(page);await page.locator('#result-title').evaluate(el=>el.scrollIntoView({block:'start'}));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const boxes=await page.locator('#result-course-time, #result-best-time').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
    expect(boxes[0].right<=boxes[1].left||boxes[1].right<=boxes[0].left||boxes[0].bottom<=boxes[1].top||boxes[1].bottom<=boxes[0].top).toBe(true);
    await page.screenshot({path:`test-results/v0129-results-${size.width}x${size.height}.png`});
  }
  const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),COURSE_BESTS_KEY);expect(stored.records[report.courseTime.courseKey].seconds).toBe(seconds);
  await page.reload();await tick(page);expect((await data(page,'course-time')).bestSeconds).toBe(seconds);expect((await data(page,'course-time')).seconds).toBeNull();
  await start(page);await page.locator('#practice-pitch').evaluate(el=>{el.value='-30';el.dispatchEvent(new Event('input',{bubbles:true}));});await tick(page,12000);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');await expect(page.locator('#result-course-time')).toHaveText('未完了');await expect(page.locator('#result-best-time')).toHaveText(formatCourseTime(seconds));
  const failed=await copy(page);expect(failed.courseTime.seconds).toBeNull();expect(failed.courseTime.bestSeconds).toBe(seconds);
  const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),COURSE_BESTS_KEY);expect(after.records[report.courseTime.courseKey].seconds).toBe(seconds);expect(errors).toEqual([]);
});
