import {Quaternion,Vector3,Euler} from 'three';
import {test,expect} from '@playwright/test';
import {waitForCountdownThree} from './helpers/countdown.js';
test.use({userAgent:'Mozilla/5.0 (Linux; Android 15; Android fixture) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'});
const step=(page,value)=>expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step',value);
const tick=(page,ms)=>page.clock.runFor(ms);
const installedClocks=new WeakSet(),phones=new WeakMap();
function physicalPhone(hold,screenAngle){
 const rad=d=>d*Math.PI/180,up=new Vector3(0,0,1),right=new Vector3(1,0,0),rot=(axis,angle)=>new Quaternion().setFromAxisAngle(axis,rad(angle));
 const reference=rot(up,37).multiply(rot(right,hold)).multiply(rot(up,screenAngle));
 const axis=new Vector3(0,1,0).applyAxisAngle(up,rad(37)),pitchAxis=axis.clone().cross(up).normalize();
 return {sample({wrist=0,pitch=0,yaw=0}={}){
  const current=rot(up,yaw).multiply(rot(pitchAxis,pitch)).multiply(rot(axis,wrist)).multiply(reference),e=new Euler().setFromQuaternion(current,'ZXY');
  const local=reference.clone().invert().multiply(current).normalize();if(local.w<0)local.set(-local.x,-local.y,-local.z,-local.w);
  return {sample:{alpha:e.z/rad(1),beta:e.x/rad(1),gamma:e.y/rad(1)},degrees:-2*Math.atan2(local.z,local.w)/rad(1)};
 }};
}
const read=page=>page.locator('#app').evaluate(app=>{const d=app.dataset,j=key=>JSON.parse(d[key]??'null');return {phase:d.phase,mode:d.playMode,steering:d.flightSteering,bank:+d.bank,pitchTarget:+d.pitchTarget,displayRoll:+d.displayRoll,wrist:j('wrist'),session:j('session'),position:j('position'),velocity:j('velocity'),held:d.inputHeld};});
async function boot(page,{course='easy',screenAngle=0,hold=45,mode='flight',query='wrist',saved=null,camera='overlay'}={}){
  await page.setViewportSize(screenAngle?{width:844,height:390}:{width:390,height:844});if(!installedClocks.has(page)){await page.clock.install();installedClocks.add(page);}
  await page.addInitScript(({screenAngle,saved,camera})=>{
    if(!/^https?:$/.test(location.protocol))return;
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,camera,inputMethod:'sensor'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,bgm:false,vibration:false}));
    if(saved!==null&&!localStorage.getItem('twist.steering.v1'))localStorage.setItem('twist.steering.v1',JSON.stringify({version:1,mode:saved}));
    window.wristScreen=Number(new URLSearchParams(location.search).get('fixtureScreen')??screenAngle);Object.defineProperty(screen.orientation,'angle',{configurable:true,get:()=>window.wristScreen});
    Object.defineProperty(screen.orientation,'type',{configurable:true,get:()=>window.wristScreen?'landscape-primary':'portrait-primary'});
    Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value:undefined});
    class Orientation extends Event{static requestPermission(){return Promise.resolve('granted');}}
    class Motion extends Event{static requestPermission(){return Promise.resolve('granted');}}
    Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,value:Orientation});Object.defineProperty(window,'DeviceMotionEvent',{configurable:true,value:Motion});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.wristCopied=value;}}});
  },{screenAngle,saved,camera});
  await page.goto(`/?dev=1&mode=${mode}&course=${course}&fixtureScreen=${screenAngle}${query===null?'':'&steer='+query}`);await step(page,'title');
  expect(await page.evaluate(()=>screen.orientation.angle)).toBe(screenAngle);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  // Use independently constructed physical orientations, not product projection
  // output or angle/aircraft state injection. DeviceOrientation uses Z-X-Y.
  const phone=physicalPhone(hold,screenAngle);phones.set(page,phone);
  await page.evaluate(({sample,degrees})=>{
    window.wristSensor={sample,degrees,legacyTwist(){return this.degrees;}};
    window.wristSend=()=>window.dispatchEvent(Object.assign(new Event('deviceorientation'),window.wristSensor.sample));
    window.wristSensorTimer=setInterval(window.wristSend,40);window.wristSend();
  },phone.sample());
  await page.locator('#start-flow-start').click();await step(page,'courses');await page.locator('#start-flow-course-start').click();await step(page,'pose');
}
async function launch(page){await page.locator('#start-flow-hold').click();await tick(page,100);if((await read(page)).phase!=='running'){await waitForCountdownThree(page);await tick(page,3100);}await step(page,'play');expect((await read(page)).phase).toBe('running');}
async function input(page,value,ms=400){await page.evaluate(({sample,degrees})=>{Object.assign(window.wristSensor,{sample,degrees});window.wristSend();},phones.get(page).sample(value));await tick(page,ms);}

for(const course of ['supersonic','sierra10'])for(const steering of ['tilt','wrist','twist'])test('sensor startup '+course+' '+steering,async({page})=>{
 test.setTimeout(90000);
 for(const screenAngle of [0,90,-90])for(const hold of [0,45,80]){
  await boot(page,{course,hold,screenAngle,query:steering});await launch(page);await tick(page,5000);
  const state=await read(page),sonic=JSON.parse(await page.locator('#app').getAttribute('data-supersonic'));
  console.log(JSON.stringify({course,steering,hold,phase:state.phase,bank:sonic.bank,pitch:sonic.pitch,heading:sonic.heading,vertical:sonic.verticalSpeed,time:sonic.simulationSeconds,wrist:state.wrist.angle}));
  expect(state.phase).toBe('running');expect(state.wrist.calibration.screenAngleAtCalibration).toBe(screenAngle);expect(Math.abs(sonic.bank)).toBeLessThan(.001);expect(Math.abs(sonic.pitch)).toBeLessThan(.001);expect(Math.abs(sonic.verticalSpeed)).toBeLessThan(.001);
  await page.evaluate(()=>clearInterval(window.wristSensorTimer));
 }
});

for(const course of ['supersonic','sierra10'])for(const steering of ['tilt','wrist'])for(const camera of ['overlay','chase','cockpit'])test('fixed display small phone rotation '+course+' '+steering+' '+camera,async({page})=>{
 await boot(page,{course,hold:45,query:steering,camera});await page.locator('#start-flow-pose-settings').click();await page.getByText('② 詳しい設定',{exact:true}).click();await page.locator('#display-fixed').click();
 await page.locator('#setting-displayTimeConstant').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#start-flow-settings-close').click();await launch(page);
 const samples=[];
 for(const wrist of [1,2,3,4,5]){await input(page,{wrist},100);const state=await read(page),degrees=await page.evaluate(()=>window.wristSensor.legacyTwist());samples.push({wrist,displayRoll:state.displayRoll,degrees});expect(state.displayRoll).toBeCloseTo(degrees*Math.PI/180,5);}
 console.log(JSON.stringify({course,steering,samples}));
 // A layout quarter-turn is90degrees, not90radians. No physical pose changes.
 await page.evaluate(()=>{window.wristScreen=90;screen.orientation.dispatchEvent(new Event('change'));window.dispatchEvent(new Event('orientationchange'));});await tick(page,250);
 const rotated=await read(page),degrees=await page.evaluate(()=>window.wristSensor.legacyTwist());
 expect(rotated.phase).toBe('running');expect(rotated.displayRoll).toBeCloseTo(degrees*Math.PI/180+Math.PI/2,5);
 await page.locator('#recenter-button').click();await step(page,'pose');await launch(page);await tick(page,250);
 const recentered=await read(page);expect(Math.abs(recentered.displayRoll)).toBeLessThan(1e-5);
 if(steering==='wrist')expect(Math.abs(recentered.wrist.angle)).toBeLessThan(1e-5);
});
