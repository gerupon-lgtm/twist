import {APP_VERSION} from '../src/version.js';
import {useLegacyCourse} from './helpers/legacy-course.js';
import {COURSE} from '../src/course.js';
import { test, expect } from '@playwright/test';
const data=(page,key)=>page.locator('#app').getAttribute(`data-${key}`).then(Number);
const slider=(page,id,value)=>page.locator(`#${id}`).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
async function launch(page,query='') {
  await page.clock.install({time:new Date('2026-11-07T03:00:00Z')});
  await page.goto('/?mode=flight'+query);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  await page.locator('#practice-button').click(); await page.clock.runFor(100);
}
const session=page=>page.locator('#app').getAttribute('data-session').then(JSON.parse);
async function clipboard(page) {
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text;}},configurable:true}));
}

test('opening version and pitch choice are visible on three phone layouts',async({page})=>{
  for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}]) {
    await page.setViewportSize(size); await page.goto('/?mode=flight');
    await expect(page.locator('#intro-version')).toContainText(`v${APP_VERSION}`);
    await expect(page.locator('#intro-version')).toBeInViewport();
    await expect(page.locator('#pitch-angle')).toBeInViewport();
    await expect(page.locator('#start-button')).toBeInViewport();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`test-results/v0113-intro-${size.width}.png`});
  }
});

test('default angle mode follows the physical tilt and returns to level in neutral',async({page})=>{
  await launch(page); await expect(page.locator('#app')).toHaveAttribute('data-pitch-mode','angle');
  await slider(page,'practice-pitch',25); await page.clock.runFor(1600);
  expect(await data(page,'flight-pitch')).toBeCloseTo(15*Math.PI/180,2);
  await slider(page,'practice-pitch',0); await page.clock.runFor(2200);
  expect(Math.abs(await data(page,'flight-pitch'))).toBeLessThan(.002);
  await slider(page,'practice-pitch',-25); await page.clock.runFor(1600);
  expect(await data(page,'flight-pitch')).toBeCloseTo(-15*Math.PI/180,2);
  await slider(page,'practice-pitch',0); await page.clock.runFor(2200);
  expect(Math.abs(await data(page,'flight-pitch'))).toBeLessThan(.002);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
});

test('W and S hold maximum target angles and release back to horizontal',async({page})=>{
  await launch(page);
  await page.keyboard.down('w'); await page.clock.runFor(1400);
  expect(await data(page,'pitch-target')).toBeCloseTo(15*Math.PI/180,6);
  await page.keyboard.up('w'); await page.clock.runFor(2200);
  expect(Math.abs(await data(page,'flight-pitch'))).toBeLessThan(.002);
  await page.keyboard.down('s'); await page.clock.runFor(500);
  expect(await data(page,'pitch-target')).toBeCloseTo(-15*Math.PI/180,6);
  await page.keyboard.up('s'); await page.clock.runFor(2000);
  expect(Math.abs(await data(page,'flight-pitch'))).toBeLessThan(.002);
});

test('rate remains selectable and retains its pitch, switch keeps position and does not relaunch',async({page})=>{
  await launch(page,'&pitch=rate&steer=twist');
  await slider(page,'practice-pitch',20); await page.clock.runFor(550);
  await slider(page,'practice-pitch',0); await page.clock.runFor(100);
  const pitch=await data(page,'flight-pitch'); expect(pitch).toBeGreaterThan(.2);
  await page.clock.runFor(300); expect(await data(page,'flight-pitch')).toBeCloseTo(pitch,6);
  for(const mode of ['angle','rate']) await expect(page.locator(`#pitch-${mode}`)).toBeDisabled();
  await page.locator('#pause-button').click(); await page.clock.runFor(100);
  const position=await page.locator('#app').getAttribute('data-position');
  await page.locator('#pitch-angle').click(); await page.clock.runFor(100);
  expect(await page.locator('#app').getAttribute('data-position')).toBe(position);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
  await expect(page.locator('#throttle-value')).toHaveText('0%');
  const home=new URL(await page.locator('#home-link').getAttribute('href'),'https://example.test');
  expect(home.searchParams.get('pitch')).toBe('angle'); expect(home.searchParams.get('steer')).toBe('twist');
  await expect(page).toHaveURL(/pitch=angle/);
  await page.locator('#start-button').click(); await page.clock.runFor(2000);
  expect(Math.abs(await data(page,'flight-pitch'))).toBeLessThan(.002);
  await expect(page.locator('#throttle-value')).toHaveText('50%');
});

test('tuning persists all flight fields, affects pitch and bank, copies and resets',async({page})=>{
  await clipboard(page); await launch(page);
  await page.locator('#pause-button').click(); await page.locator('#flight-adjustments > summary').click();
  const values={deadzone:2,maxTilt:10,maxPitch:25,timeConstant:.5,maxBank:20,displayTimeConstant:.05,chaseTimeConstant:.15,radarRange:60,maxSteerTilt:10,maxSteerTwist:20,steerTiltDeadzone:2,steerTwistDeadzone:5,steerCurve:1};
  for(const [key,value] of Object.entries(values)) await slider(page,`setting-${key}`,value);
  await page.locator('#settings-copy').click();
  const copied=await page.evaluate(()=>JSON.parse(window.copied));
  expect(copied).toEqual({version:'0.1.29',pitch:'angle',steer:'tilt',display:'bank',camera:'overlay',mode:'flight',view:'assisted',launch:'browser',fullscreen:false,settings:{...values,groundPatternStrength:.8,streakAmount:0,speedFov:0,highSpeedShake:false,speedUnit:'m/s',autoAfterburner:false,autoAfterburnerAngle:35,ladderRange:10,cockpitFov:0,targetHeightGuide:true,turnGravity:3,flightDirector:true,targetHeadingCue:true,edgeGuidance:true,nextTargetNotice:true,audioGuidance:true,hudLanguage:'en'},inactiveSettings:['displayTimeConstant','chaseTimeConstant','maxSteerTwist','steerTwistDeadzone','ladderRange','cockpitFov','autoAfterburnerAngle'],feedback:expect.any(Object),input:expect.any(Object),changedSettings:expect.any(Array),segments:expect.any(Array),approaches:expect.any(Array),abStraights:expect.any(Array),passbys:expect.any(Object),courseTime:expect.any(Object),exitDiscovery:expect.any(Object),targetViews:expect.any(Array),course:expect.any(Object),stageSize:expect.any(Object),afterburner:expect.any(Object)});
  await page.reload(); await page.clock.runFor(100); await page.locator('#practice-button').click(); await page.clock.runFor(100);
  await slider(page,'practice-pitch',10); await slider(page,'practice-steer',10); await page.clock.runFor(3200);
  expect(await data(page,'flight-pitch')).toBeCloseTo(25*Math.PI/180,2);
  expect(await data(page,'bank')).toBeCloseTo(20*Math.PI/180,2);
  await page.locator('#pause-button').click(); await page.locator('#flight-adjustments > summary').click();
  for(const [key,value] of Object.entries(values)) await expect(page.locator(`#setting-${key}`)).toHaveValue(String(value));
  await page.screenshot({path:'test-results/v0113-adjustments.png'});
  await page.locator('#settings-reset').click();
  for(const [key,value] of Object.entries({deadzone:3,maxTilt:25,maxPitch:15,timeConstant:.3,maxBank:40,displayTimeConstant:.05,radarRange:180})) await expect(page.locator(`#setting-${key}`)).toHaveValue(String(value));
});

test('denied storage and clipboard keep flight usable and offer manually selectable copy text',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(window,'localStorage',{get(){throw new Error('denied');}});
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied');}},configurable:true});
  });
  await launch(page); await page.locator('#pause-button').click(); await page.locator('#flight-adjustments > summary').click();
  await expect(page.locator('#setting-maxPitch')).toHaveValue('15');
  await slider(page,'setting-maxPitch',20); await expect(page.locator('#settings-status')).toContainText('保存できません');
  await page.locator('#settings-copy').click(); await expect(page.locator('#settings-copy-text')).toBeVisible();
  expect(JSON.parse(await page.locator('#settings-copy-text').inputValue()).settings.maxPitch).toBe(20);
  await page.locator('#start-button').click(); await page.clock.runFor(1000);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
});

test('contacts and flight time accumulate across crash restarts, pause time is excluded, reports stay frozen',async({page})=>{
  await clipboard(page); await launch(page);
  for(const count of [1,2]) {
    await slider(page,'throttle-input',0); await slider(page,'practice-pitch',-25);
    for(let i=0;i<200 && await page.locator('#app').getAttribute('data-phase')==='running';i++) await page.clock.runFor(100);
    await expect(page.locator('#dialog-title')).toHaveText('地面に接触して停止');
    await expect(page.locator('#result-contacts')).toHaveText(`${count}回`);
    const before=await session(page); expect(before.elapsedSeconds).toBeGreaterThan(count);
    await page.clock.runFor(5000); expect(await session(page)).toEqual(before);
    await page.locator('#result-copy').click(); const report=await page.evaluate(()=>JSON.parse(window.copied));
    expect(report.result).toBe('grounded');expect(report.display).toBe('bank');await expect(page.locator('#result-outcome')).toHaveText('墜落');
    expect(report.stats.groundContacts).toBe(count);expect(report.stats.legs).toBe(count);expect(report.lastLeg.groundContacts).toBe(1); expect(report.stats.elapsedSeconds).toBeCloseTo(before.elapsedSeconds,5);
    if(count===1) {await page.locator('#start-button').click();await page.clock.runFor(100);}
  }
  await page.locator('#flight-adjustments > summary').click(); await slider(page,'setting-maxPitch',25);
  await page.locator('#result-copy').click(); expect(await page.evaluate(()=>JSON.parse(window.copied).settings.maxPitch)).toBe(15);
  await page.screenshot({path:'test-results/v0113-contact-record.png'});
  await page.locator('#reset-button').click(); await page.clock.runFor(100);
  expect((await session(page)).groundContacts).toBe(0);
});

test('recovery assistance time accumulates from real flight and freezes while paused',async({page})=>{
  await launch(page,'&pitch=rate');
  await slider(page,'practice-pitch',25); await page.clock.runFor(1500);
  await slider(page,'practice-pitch',0); await slider(page,'throttle-input',0);
  for(let i=0;i<120 && await data(page,'vertical-speed')>-2;i++) await page.clock.runFor(50);
  await slider(page,'throttle-input',50); await slider(page,'practice-pitch',-25);
  for(let i=0;i<100 && await data(page,'flight-pitch')>.025;i++) await page.clock.runFor(50);
  await slider(page,'practice-pitch',0); await page.clock.runFor(1000);
  const before=await session(page); expect(before.recoverySeconds).toBeGreaterThan(.1);
  expect(before.recoverySeconds).toBeLessThanOrEqual(before.elapsedSeconds);
  await page.locator('#pause-button').click(); await page.clock.runFor(100);
  const paused=await session(page); await page.clock.runFor(5000);expect(await session(page)).toEqual(paused);
});

for(const display of ['bank','fixed']) test(`angle input can fly the full course and copy the ${display} clear result`,async({page})=>{
  test.setTimeout(60000); await clipboard(page);await launch(page,'&display='+display);
  if(display==='bank') {
    await slider(page,'throttle-input',0);await slider(page,'practice-pitch',-25);
    for(let i=0;i<200&&await page.locator('#app').getAttribute('data-phase')==='running';i++)await page.clock.runFor(100);
    await expect(page.locator('#result-contacts')).toHaveText('1回');await page.locator('#start-button').click();await page.clock.runFor(100);
  }
  const targets=[...COURSE.lights,COURSE.exit];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const tilt=d=>Math.sign(d)*(3+Math.abs(d)*22);
  let heading=0, previous=null, sawExit=false;
  for(let i=0;i<1000;i++) {
    const state=await page.locator('#app').evaluate(el=>({phase:el.dataset.phase,position:JSON.parse(el.dataset.position),pitch:Number(el.dataset.flightPitch),speed:Number(el.dataset.speed)}));
    if(state.phase!=='running') break;
    const collected=Number(await page.locator('#collection-count').textContent());
    if(collected===3&&!sawExit){await expect(page.locator('.radar-exit')).toHaveCount(1);await expect(page.locator('.radar-target[data-id^=light]')).toHaveCount(0);expect(JSON.parse(await page.locator('#app').getAttribute('data-target-height'))).toMatchObject({target:COURSE.exit.y,radius:4,lower:COURSE.exit.y-4,upper:COURSE.exit.y+4});await expect(page.locator('#target-height-inline')).toContainText(`TGT ALT ${COURSE.exit.y}m`);sawExit=true;}
    const target=targets[collected],p=state.position;
    if(previous && Math.hypot(p.x-previous.x,p.z-previous.z)>.001) heading=Math.atan2(p.x-previous.x,-(p.z-previous.z));
    previous=p;
    const dx=target.x-p.x,dy=target.y-p.y,dz=target.z-p.z;
    const bearing=Math.atan2(Math.sin(Math.atan2(dx,-dz)-heading),Math.cos(Math.atan2(dx,-dz)-heading));
    const desired=clamp(Math.atan2(dy,Math.hypot(dx,dz)),-.25,.25);
    await slider(page,'practice-pitch',tilt(desired/(15*Math.PI/180)));
    const bankDemand=clamp(bearing*1.4,-40*Math.PI/180,40*Math.PI/180)/(40*Math.PI/180);
    await slider(page,'practice-steer',Math.sign(bankDemand)*(3+Math.abs(bankDemand)*12));
    await slider(page,'throttle-input',Math.round(clamp(.5+(10-state.speed)*.3+state.pitch*.8,.15,1)*100));
    await page.clock.runFor(100);
  }
  expect(sawExit).toBe(true);
  await expect(page.locator('#dialog-title')).toHaveText('出口に到着しました');
  await expect(page.locator('#flight-result')).toBeVisible();
  await expect(page.locator('#result-modes')).toHaveText(`pitch=angle / steer=tilt / display=${display} / camera=overlay`);
  await page.locator('#result-copy').click();
  const report=await page.evaluate(()=>JSON.parse(window.copied));
  expect(report.result).toBe('clear');expect(report.display).toBe(display);await expect(page.locator('#result-outcome')).toHaveText('クリア');
  await expect.poll(async()=>{await page.clock.runFor(50);return JSON.parse(await page.locator('#feedback-diagnostics').getAttribute('data-music')).current;}).toBe('clear');
  expect(JSON.parse(await page.locator('#feedback-diagnostics').getAttribute('data-music')).track).toBe('突破の凱歌');
  expect(report.stats.elapsedSeconds).toBeGreaterThan(10);expect(report.stats.groundContacts).toBe(display==='bank'?1:0);expect(report.stats.legs).toBe(display==='bank'?2:1);expect(report.lastLeg.groundContacts).toBe(0);
  await expect(page.locator('#result-last-contacts')).toHaveText('0回');
  await page.screenshot({path:'test-results/v0113-clear-record.png'});
});

test('contact explanation uses the tuned deadzone and exploration retains its original practice range',async({page})=>{
  await launch(page);
  for(const [deadzone,input,explanation] of [[8,5,'前後操作：中立'],[0,2,'前後操作：手前へ起こし2°']]) {
    await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();
    await slider(page,'setting-deadzone',deadzone);await page.locator('#start-button').click();
    await slider(page,'throttle-input',0);await slider(page,'practice-pitch',input);
    for(let i=0;i<300 && await page.locator('#app').getAttribute('data-phase')==='running';i++) await page.clock.runFor(100);
    await expect(page.locator('#dialog-title')).toHaveText('地面に接触して停止');
    await expect(page.locator('#dialog-description')).toContainText(explanation);
    await page.locator('#start-button').click();await page.clock.runFor(100);
  }
  await page.locator('#pause-button').click();await page.locator('#mode-explore').click();
  await expect(page.locator('#practice-pitch')).toHaveAttribute('max','25');
  await expect(page.locator('#practice-steer')).toHaveAttribute('min','-25');
  await expect(page.locator('#flight-adjustments')).toBeVisible();
  await expect(page.locator('label[for=setting-maxPitch]')).toBeHidden();
});

useLegacyCourse(test);
