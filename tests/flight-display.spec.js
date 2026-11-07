import {test,expect} from '@playwright/test';
import {Euler,Quaternion,Vector3} from 'three';
import {readFile} from 'node:fs/promises';
import {COURSE} from '../src/course.js';
const rad=d=>d*Math.PI/180;
const Z=new Vector3(0,0,1);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const data=(page,key)=>page.locator('#app').getAttribute(`data-${key}`).then(Number);
const quat=(page,key)=>page.locator('#app').getAttribute(`data-${key}`).then(JSON.parse).then(q=>new Quaternion(q.x,q.y,q.z,q.w));
const slider=(page,id,value)=>page.locator(`#${id}`).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
async function launch(page,query='') {
 await page.clock.install({time:new Date('2026-11-07T06:00:00Z')});await page.goto('/?mode=flight'+query);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(100);
}
function rawPose({pitch=0,steer=0,twist=0}={}) {
 const axis=new Vector3(rad(pitch),rad(steer),0),length=axis.length();
 const q=new Quaternion().setFromAxisAngle(Z,-rad(twist)).multiply(length?new Quaternion().setFromAxisAngle(axis.normalize(),length):new Quaternion());
 const e=new Euler().setFromQuaternion(q,'ZXY');return{alpha:(e.z*180/Math.PI+360)%360,beta:e.x*180/Math.PI,gamma:e.y*180/Math.PI};
}
const send=(page,pose)=>page.evaluate(sample=>window.dispatchEvent(Object.assign(new Event('deviceorientation'),sample)),rawPose(pose));
async function sensorLaunch(page,steering='tilt',screenAngle=0) {
 await page.addInitScript(angle=>{
  class Orientation extends Event {static requestPermission(){return Promise.resolve('granted');}}
  class Motion extends Event {static requestPermission(){return Promise.resolve('granted');}}
  Object.defineProperty(window,'DeviceOrientationEvent',{value:Orientation,configurable:true});Object.defineProperty(window,'DeviceMotionEvent',{value:Motion,configurable:true});
  Object.defineProperty(screen.orientation,'angle',{value:angle,configurable:true});
 },screenAngle);
 await page.clock.install({time:new Date('2026-11-07T06:00:00Z')});await page.goto('/?mode=flight&display=fixed&steer='+steering);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#start-button').click();await send(page,{});
 await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');
 await page.evaluate(()=>{window.fixedNeutral=setInterval(()=>window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta:0,gamma:0})),50);});
 await page.locator('#start-button').click();
 await page.evaluate(()=>setInterval(()=>window.dispatchEvent(Object.assign(new Event('devicemotion'),{rotationRate:{alpha:0,beta:0,gamma:0}})),100));await page.clock.runFor(100);
 await page.evaluate(()=>clearInterval(window.fixedNeutral));
 await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
}
function rotationClose(a,b,tolerance=.003){expect(a.angleTo(b)).toBeLessThan(tolerance);}

test('bank is the default and both display choices fit the opening phone layouts',async({page})=>{
 for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}]) {
  await page.setViewportSize(size);await page.goto('/?mode=flight');
  await expect(page.locator('#app')).toHaveAttribute('data-display','bank');
  await expect(page.locator('#intro-version')).toContainText('v0.1.25');await expect(page.locator('#intro-version')).toBeInViewport();
  for(const id of ['display-bank','display-fixed','start-button'])await expect(page.locator('#'+id)).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/v0114-intro-${size.width}.png`});
 }
});

for(const steering of ['tilt','twist'])test(`fixed ${steering} draws inverse 30-degree phone roll and keeps HUD/model untilted`,async({page})=>{
 await sensorLaunch(page,steering);const before=await page.locator('#bottom-panel').boundingBox();
 await send(page,{twist:30,pitch:18,steer:15});await page.clock.runFor(550);
 const craft=await quat(page,'craft-screen-quaternion');rotationClose(new Quaternion().setFromAxisAngle(Z,-rad(30)).multiply(craft),new Quaternion());
 rotationClose(await quat(page,'craft-quaternion'),new Quaternion());
 const camera=await quat(page,'camera-quaternion');rotationClose(camera,new Quaternion().setFromAxisAngle(Z,-rad(30)));
 const hud=await page.locator('#bottom-panel').boundingBox();expect(hud).toEqual(before);
 expect(await page.locator('#bottom-panel').evaluate(el=>{const m=new DOMMatrix(getComputedStyle(el).transform);return[m.a,m.b,m.c,m.d];})).toEqual([1,0,0,1]);
 expect(await page.locator('#world').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
 expect(await data(page,'bank')).toBeGreaterThan(.05);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
 await page.screenshot({path:`test-results/v0114-fixed-${steering}-30.png`});
});

test('display uses unfolded half-turn angles and follows the short path through 180 degrees',async({page})=>{
 await sensorLaunch(page);await send(page,{twist:120});await page.clock.runFor(600);
 rotationClose(await quat(page,'craft-screen-quaternion'),new Quaternion().setFromAxisAngle(Z,rad(120)));
 await send(page,{twist:179});await page.clock.runFor(600);const before=await quat(page,'camera-quaternion');
 await send(page,{twist:-179});await page.clock.runFor(50);const after=await quat(page,'camera-quaternion');expect(after.angleTo(before)).toBeLessThan(rad(3));
 await page.clock.runFor(500);rotationClose(await quat(page,'craft-screen-quaternion'),new Quaternion().setFromAxisAngle(Z,rad(-179)));
});

test('layout rotation preserves calibrated display up and maps tilt to the visible screen axes',async({page})=>{
 await sensorLaunch(page,'tilt',0);await send(page,{twist:30,pitch:12});await page.clock.runFor(600);
 for(const screen of [90,180,270,0]) {
  await page.setViewportSize(screen%180?{width:844,height:390}:{width:390,height:844});
  await page.evaluate(angle=>{Object.defineProperty(screen.orientation,'angle',{value:angle,configurable:true});screen.orientation.dispatchEvent(new Event('change'));},screen);
  await page.clock.runFor(100);
  const physical=new Quaternion().setFromAxisAngle(Z,-rad(30)).multiply(new Quaternion().setFromAxisAngle(Z,-rad(screen)));
  rotationClose(physical.multiply(await quat(page,'craft-screen-quaternion')),new Quaternion());
  const pitch=Math.round(Math.atan(Math.tan(rad(12))*Math.cos(rad(screen)))*180/Math.PI);
  const steer=Math.round(Math.atan(Math.tan(rad(12))*Math.sin(rad(screen)))*180/Math.PI);
  await expect(page.locator('#pitch-value')).toHaveText(`${pitch}°`);await expect(page.locator('#steer-value')).toHaveText(`${steer}°`);
  await expect(page.locator('#throttle-value')).toHaveText('50%');
 }
});

test('display switch keeps physical state and returns to the retained bank view',async({page})=>{
 await launch(page);await slider(page,'practice-steer',20);await slider(page,'practice-twist',30);await page.clock.runFor(500);
 await page.locator('#pause-button').click();await page.clock.runFor(100);
 const position=await page.locator('#app').getAttribute('data-position'),bank=await data(page,'bank'),pitch=await data(page,'flight-pitch');
 await page.locator('#display-fixed').click();await page.clock.runFor(100);
 expect(await page.locator('#app').getAttribute('data-position')).toBe(position);expect(await data(page,'bank')).toBe(bank);expect(await data(page,'flight-pitch')).toBe(pitch);
 await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');await expect(page.locator('#throttle-value')).toHaveText('0%');
 rotationClose(await quat(page,'craft-quaternion'),new Quaternion());await expect(page).toHaveURL(/display=fixed/);
 expect(new URL(await page.locator('#home-link').getAttribute('href'),'https://example.test').searchParams.get('display')).toBe('fixed');
 await page.locator('#display-bank').click();await page.clock.runFor(100);
 rotationClose(await quat(page,'craft-quaternion'),new Quaternion().setFromAxisAngle(Z,-bank));rotationClose(await quat(page,'camera-quaternion'),new Quaternion());
 expect(await page.locator('#app').getAttribute('data-position')).toBe(position);
});

for(const steering of ['tilt','twist'])test(`fixed ${steering} navigation matches the rotated 3D camera, including off-screen goals`,async({page})=>{
 // Compare the retained Japanese marker while the new edge overlay is switched off.
 await page.addInitScript(()=>localStorage.setItem('twist.flight-settings.v1',JSON.stringify({hudLanguage:'ja',edgeGuidance:false})));
 await launch(page,'&display=fixed&steer='+steering);
 await slider(page,steering==='tilt'?'practice-steer':'practice-twist',25);
 if(steering==='tilt') await slider(page,'practice-twist',70);
 for(let i=0;i<60 && await page.locator('#app').getAttribute('data-edge-status')!=='shown';i++)await page.clock.runFor(100);
 await expect(page.locator('#target-edge-marker')).toBeVisible();
 const local=JSON.parse(await page.locator('#app').getAttribute('data-target-local'));
 let dx=local.x,dy=-local.y;
 if(local.z>=0){dx=Math.atan2(local.x,-local.z);if(Math.abs(dx)>=rad(175))dx=Math.PI;dy=-Math.atan2(local.y,Math.hypot(local.x,local.z));}
 const expected=(Math.atan2(dx,-dy)*180/Math.PI+360)%360;
 const style=await page.locator('#edge-arrow').getAttribute('style');const actual=Number(style.match(/rotate\(([-\d.]+)deg\)/)[1]);expect(Math.abs(wrap(rad(actual-expected)))).toBeLessThan(1e-5);
 const nav=await page.locator('#nav-arrow').getAttribute('style');expect(Math.abs(wrap(rad(Number(nav.match(/rotate\(([-\d.]+)deg\)/)[1]))-Math.atan2(local.x,-local.z)))).toBeLessThan(1e-5);
 await page.screenshot({path:`test-results/v0114-edge-${steering}.png`});
});

test('legacy conditions retain the v0.1.13 trace and both displays retain current physical flight',async({page})=>{
 const baseline=JSON.parse(await readFile('tests/fixtures/bank-v0113-trace.json','utf8'));
 const capture=()=>page.evaluate(async data=>{
  const {createStage}=await import('/src/stage.js');const rows=[];
  for(const display of ['bank','fixed']){
   const stage=createStage(document.createElement('canvas'),{display});stage.resize(390,844,1);stage.launchFlight();const initial=stage.getStatus(),samples=[];
   for(const row of data.samples){for(let i=0;i<row.frames;i++)stage.update(data.dt,{mode:'flight',...row.input,displayTwist:30});samples.push(stage.getStatus());}
   rows.push({initial,samples});stage.dispose();
  }return rows;
 },baseline);
 await page.goto('/?mode=flight');const current=await capture();
 expect(current[0].initial.speed).toBe(10);expect(current[0].initial.position).toEqual(COURSE.start);
 // Supply only the approved pre-v24 constants in HTTP responses; production files stay untouched.
 const physics=(await readFile('src/flight-physics.js','utf8')).replace(/cruiseSpeed:\s*[\d.]+/,'cruiseSpeed: 6').replace(/maxSpeed:\s*[\d.]+/,'maxSpeed: 18');
 const course=(await readFile('src/course.js','utf8')).replace(/export const COURSE = Object\.freeze\(\{[\s\S]*?\n\}\);/,`export const COURSE = Object.freeze({
  start: {x:0,y:7,z:26}, lights: [{x:0,y:10,z:0},{x:16,y:18,z:-24},{x:-14,y:12,z:-44}], exit: {x:0,y:7,z:-62}
 });`);
 const routes=[[/\/src\/flight-physics\.js(?:\?|$)/,physics],[/\/src\/course\.js(?:\?|$)/,course]];
 for(const [url,body] of routes)await page.route(url,route=>route.fulfill({contentType:'text/javascript',body}));
 await page.reload();const legacy=await capture();
 for(const [url] of routes)await page.unroute(url);
 function compare(actual,expected){for(const[key,value]of Object.entries(expected)){if(typeof value==='number')expect(actual[key]).toBeCloseTo(value,8);else if(value&&typeof value==='object')compare(actual[key],value);else expect(actual[key]).toEqual(value);}}
 for(let i=0;i<baseline.samples.length;i++){
  compare(legacy[0].samples[i],baseline.samples[i].state);
  for(const traces of [current,legacy])for(const key of ['position','velocity','orientation','speed','bank','pitch','grounded','collected','complete'])expect(traces[1].samples[i][key]).toEqual(traces[0].samples[i][key]);
 }
});

test('fixed low-flight horizon uses full bank while the model stays upright',async({page})=>{
 await page.goto('/?mode=flight');const state=await page.evaluate(async()=>{
  const {createStage}=await import('/src/stage.js');const stage=createStage(document.createElement('canvas'),{display:'fixed'});stage.launchFlight();
  let state=stage.getStatus();
  for(let i=0;i<3600&&state.altitude>=5&&!state.grounded;i++){
   stage.update(1/60,{mode:'flight',bankAngle:40*Math.PI/180,throttle:.5,displayTwist:30});state=stage.getStatus();
  }
  stage.dispose();return state;
 });
 expect(state.altitude).toBeLessThan(5);expect(state.grounded).toBe(false);
 const world=new Quaternion(state.worldQuaternion.x,state.worldQuaternion.y,state.worldQuaternion.z,state.worldQuaternion.w);
 const camera=new Quaternion(state.cameraQuaternion.x,state.cameraQuaternion.y,state.cameraQuaternion.z,state.cameraQuaternion.w);
 const up=new Vector3(0,1,0).applyQuaternion(world).applyQuaternion(camera.invert());
 expect(Math.abs(wrap(Math.atan2(-up.x,up.y)-state.bank-state.displayRoll))).toBeLessThan(1e-7);
 rotationClose(new Quaternion(state.craftQuaternion.x,state.craftQuaternion.y,state.craftQuaternion.z,state.craftQuaternion.w),new Quaternion());
});

test('fixed copies result/display and marks unused rate settings; smoothing saves and resets',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text;}},configurable:true}));
 await launch(page,'&display=fixed&pitch=rate');await page.locator('#pause-button').click();await page.locator('#flight-adjustments>summary').click();
 await slider(page,'setting-displayTimeConstant',0);await page.locator('#settings-copy').click();let report=await page.evaluate(()=>JSON.parse(window.copied));
 expect(report.display).toBe('fixed');expect(report.result).toBeUndefined();expect(report.inactiveSettings).toEqual(['timeConstant','chaseTimeConstant','maxSteerTwist','steerTwistDeadzone','ladderRange','cockpitFov']);
 await page.reload();await page.clock.runFor(100);await page.locator('#practice-button').click();await page.clock.runFor(100);
 await slider(page,'practice-twist',30);await page.clock.runFor(100);expect(await data(page,'display-roll')).toBeCloseTo(rad(30),6);
 await slider(page,'throttle-input',0);await slider(page,'practice-pitch',-25);
 for(let i=0;i<150&&await page.locator('#app').getAttribute('data-phase')==='running';i++)await page.clock.runFor(100);
 await page.locator('#result-copy').click();report=await page.evaluate(()=>JSON.parse(window.copied));expect(report.result).toBe('grounded');expect(report.display).toBe('fixed');
 await expect(page.locator('#result-outcome')).toHaveText('墜落');await expect(page.locator('#result-settings')).toContainText('未使用');
 await page.locator('#flight-adjustments>summary').click();await page.locator('#settings-reset').click();await expect(page.locator('#setting-displayTimeConstant')).toHaveValue('0.05');
});
