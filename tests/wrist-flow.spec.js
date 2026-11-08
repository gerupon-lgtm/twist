import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {APP_VERSION} from '../src/version.js';
import {waitForCountdownThree} from './helpers/countdown.js';
const step=(page,value)=>expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step',value);
const tick=(page,ms)=>page.clock.runFor(ms);
const installedClocks=new WeakSet();
const read=page=>page.locator('#app').evaluate(app=>{const d=app.dataset,j=key=>JSON.parse(d[key]??'null');return {phase:d.phase,mode:d.playMode,steering:d.flightSteering,bank:+d.bank,pitchTarget:+d.pitchTarget,displayRoll:+d.displayRoll,wrist:j('wrist'),session:j('session'),position:j('position'),velocity:j('velocity'),held:d.inputHeld};});
async function boot(page,{course='easy',screenAngle=0,hold=45,mode='flight',query='wrist',saved=null}={}){
  await page.setViewportSize(screenAngle?{width:844,height:390}:{width:390,height:844});if(!installedClocks.has(page)){await page.clock.install();installedClocks.add(page);}
  await page.addInitScript(({screenAngle,saved})=>{
    if(!/^https?:$/.test(location.protocol))return;
    if(!localStorage.getItem('twist.start-flow.v1'))localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,camera:'overlay',inputMethod:'sensor'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,bgm:false,vibration:false}));
    if(saved!==null&&!localStorage.getItem('twist.steering.v1'))localStorage.setItem('twist.steering.v1',JSON.stringify({version:1,mode:saved}));
    window.wristScreen=screenAngle;Object.defineProperty(screen.orientation,'angle',{configurable:true,get:()=>window.wristScreen});
    Object.defineProperty(screen.orientation,'type',{configurable:true,get:()=>window.wristScreen?'landscape-primary':'portrait-primary'});
    Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value:undefined});
    class Orientation extends Event{static requestPermission(){return Promise.resolve('granted');}}
    class Motion extends Event{static requestPermission(){return Promise.resolve('granted');}}
    Object.defineProperty(window,'DeviceOrientationEvent',{configurable:true,value:Orientation});Object.defineProperty(window,'DeviceMotionEvent',{configurable:true,value:Motion});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.wristCopied=value;}}});
  },{screenAngle,saved});
  await page.goto(`/?dev=1&mode=${mode}&course=${course}${query===null?'':'&steer='+query}`);await step(page,'title');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  // Use independently constructed physical orientations, not product projection
  // output or angle/aircraft state injection. DeviceOrientation uses Z-X-Y.
  await page.evaluate(async({hold,screenAngle})=>{
    const {Quaternion,Vector3,Euler}=await import('/node_modules/three/build/three.module.js');
    const rad=d=>d*Math.PI/180,up=new Vector3(0,0,1),right=new Vector3(1,0,0),heading=37;
    const rot=(axis,angle)=>new Quaternion().setFromAxisAngle(axis,rad(angle));
    const reference=rot(up,heading).multiply(rot(right,hold)).multiply(rot(up,screenAngle));
    const axis=new Vector3(0,1,0).applyAxisAngle(up,rad(heading)),pitchAxis=axis.clone().cross(up).normalize();let current=reference.clone();
    const send=()=>{const e=new Euler().setFromQuaternion(current,'ZXY');window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:e.z/rad(1),beta:e.x/rad(1),gamma:e.y/rad(1)}));};
    window.wristSensor={set({wrist=0,pitch=0,yaw=0}={}){current=rot(up,yaw).multiply(rot(pitchAxis,pitch)).multiply(rot(axis,wrist)).multiply(reference);send();},neutral(){current.copy(reference);send();},
      legacyTwist(){const local=reference.clone().invert().multiply(current).normalize();if(local.w<0)local.set(-local.x,-local.y,-local.z,-local.w);return -2*Math.atan2(local.z,local.w)*180/Math.PI;}};
    window.wristSensorTimer=setInterval(send,40);send();
  },{hold,screenAngle});
  await page.locator('#start-flow-start').click();await step(page,'courses');await page.locator('#start-flow-course-start').click();await step(page,'pose');
}
async function launch(page){await page.locator('#start-flow-hold').click();await tick(page,100);if((await read(page)).phase!=='running'){await waitForCountdownThree(page);await tick(page,3100);}await step(page,'play');expect((await read(page)).phase).toBe('running');}
async function input(page,value,ms=400){await page.evaluate(value=>window.wristSensor.set(value),value);await tick(page,ms);}
async function copy(page){await page.locator('#pause-button').click();await step(page,'pause');await page.locator('#start-flow-pause-settings').click();await step(page,'settings');await page.locator('#settings-copy').click();return page.evaluate(()=>JSON.parse(window.wristCopied));}
async function proof(page,name){await mkdir('.cache',{recursive:true});const prefix=`.cache/v${APP_VERSION.replaceAll('.','')}-wrist-${name}`;await page.screenshot({path:prefix+'.png'});await writeFile(prefix+'.json',JSON.stringify({state:await read(page),evidence:'synthetic DeviceOrientation/default flow; no physical arm acceptance'},null,2));}

for(const course of ['easy','supersonic'])for(const screenAngle of [0,90,-90])test(`wrist physical holds share right/left direction ${course} screen${screenAngle}`,async({page})=>{
  test.setTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Each hold is a fresh calibration, never a direct pose/velocity/target edit.
  for(const hold of [0,30,45,60,90]){
    await boot(page,{course,screenAngle,hold});await launch(page);const neutral=await read(page);expect(neutral.wrist.calibration.holdInclinationDegrees).toBeCloseTo(hold,5);
    expect(neutral.wrist.calibration.axisWorld.z).toBeCloseTo(0,8);expect(neutral.wrist.angle).toBeCloseTo(0,5);
    await input(page,{wrist:15});let state=await read(page);expect(state.wrist.angle).toBeCloseTo(15,4);expect(state.bank).toBeGreaterThan(.01);expect(Math.abs(state.pitchTarget)).toBeLessThan(1e-5);
    await input(page,{wrist:-15},600);state=await read(page);expect(state.wrist.angle).toBeCloseTo(-15,4);expect(state.bank).toBeLessThan(-.01);
    await input(page,{pitch:15},400);state=await read(page);expect(Math.abs(state.wrist.angle)).toBeLessThan(1e-4);expect(state.pitchTarget).toBeGreaterThan(0);
    await input(page,{yaw:30});state=await read(page);expect(Math.abs(state.wrist.angle)).toBeLessThan(1e-4);expect(Math.abs(state.pitchTarget)).toBeLessThan(1e-5);
    await proof(page,`${course}-screen${screenAngle}-hold${hold}`);
    await page.evaluate(()=>clearInterval(window.wristSensorTimer));
  }
  expect(errors).toEqual([]);
});

test('three explicit choices, URL precedence, unchanged old store, preset/reset/undo and copied wrist records',async({page})=>{
  await boot(page,{saved:'twist',query:'wrist'});expect((await read(page)).steering).toBe('wrist');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('twist.steering.v1')).mode)).toBe('twist');
  await page.locator('#start-flow-pose-settings').click();await step(page,'settings');
  for(const mode of ['tilt','twist','wrist']){await page.locator('#steering-'+mode).click();await expect(page.locator('#steering-'+mode)).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('twist.steering.v1')).mode)).toBe(mode);}
  await expect(page.locator('#setting-maxSteerWrist')).toHaveValue('25');await expect(page.locator('#setting-steerWristDeadzone')).toHaveValue('3');
  for(const [id,value]of [['calm','30'],['normal','25'],['agile','18']]){await page.locator(`[data-wrist-preset=${id}]`).click();await expect(page.locator('#setting-maxSteerWrist')).toHaveValue(value);}
  await expect(page.locator('#setting-maxSteerTilt')).toHaveValue('15');await expect(page.locator('#setting-maxSteerTwist')).toHaveValue('20');
  await page.locator('#settings-reset').click();await expect(page.locator('#setting-maxSteerWrist')).toHaveValue('25');await page.locator('#settings-undo-reset').click();await expect(page.locator('#setting-maxSteerWrist')).toHaveValue('18');
  await page.locator('#start-flow-settings-close').click();await step(page,'pose');await launch(page);await input(page,{wrist:15});await input(page,{wrist:-15});
  const report=await copy(page);expect(report.steer).toBe('wrist');expect(report.input.wrist.calibration.holdInclinationDegrees).toBeCloseTo(45,4);expect(report.input.wrist.angleRangeDegrees).toBeGreaterThan(29.9);
  for(const key of ['maxSteerTilt','steerTiltDeadzone','maxSteerTwist','steerTwistDeadzone'])expect(report.inactiveSettings).toContain(key);expect(report.inactiveSettings).not.toContain('maxSteerWrist');
  await expect(page.locator('#result-wrist')).toBeHidden(); // Settings-copy is not a fabricated completion/result screen.
  await page.reload();expect((await read(page)).steering).toBe('wrist');
});

test('URL wrist is visit-only until an explicit click on the already-selected wrist saves it',async({page})=>{
  await boot(page,{saved:'tilt',query:'wrist'});expect((await read(page)).steering).toBe('wrist');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('twist.steering.v1')).mode)).toBe('tilt');
  await page.locator('#start-flow-pose-settings').click();await step(page,'settings');await expect(page.locator('#steering-wrist')).toHaveAttribute('aria-pressed','true');
  const before=await read(page);await page.locator('#steering-wrist').click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('twist.steering.v1')).mode)).toBe('wrist');
  expect((await read(page)).position).toEqual(before.position);expect((await read(page)).session).toEqual(before.session);
  await page.goto('/?dev=1&mode=flight&course=easy');await step(page,'title');expect((await read(page)).steering).toBe('wrist');
});

test('wrist preset undo restores the last manual value and repeated selected presets keep history unchanged',async({page})=>{
  await boot(page);await page.locator('#start-flow-pose-settings').click();await step(page,'settings');
  const input=page.locator('#setting-maxSteerWrist'),history=page.locator('[data-range-before=setting-maxSteerWrist]'),undo=page.locator('[data-range-undo=setting-maxSteerWrist]');
  await expect(input).toHaveValue('25');await expect(history).toHaveText('変更前：—');
  await page.locator('[data-wrist-preset=normal]').click();await expect(history).toHaveText('変更前：—');await expect(undo).toBeDisabled();
  expect(await page.evaluate(()=>localStorage.getItem('twist.range-before.setting-maxSteerWrist'))).toBeNull();
  await input.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await expect(input).toHaveValue('27');
  await page.locator('[data-wrist-preset=agile]').click();await expect(input).toHaveValue('18');await expect(history).toHaveText('変更前：27°');
  const stored=await page.evaluate(()=>localStorage.getItem('twist.range-before.setting-maxSteerWrist'));
  await page.locator('[data-wrist-preset=agile]').click();await expect(history).toHaveText('変更前：27°');expect(await page.evaluate(()=>localStorage.getItem('twist.range-before.setting-maxSteerWrist'))).toBe(stored);
  await undo.click();await expect(input).toHaveValue('27');await expect(history).toHaveText('変更前：18°');
});

test.describe('wrist sensitivity touch feedback',()=>{
  test.use({hasTouch:true});
  test('selected preset is visible after tapping and a custom angle clears the selection',async({page})=>{
    await boot(page);await page.locator('#start-flow-pose-settings').click();await step(page,'settings');
    await expect(page.locator('[data-wrist-preset=normal]')).toHaveAttribute('aria-pressed','true');
    for(const [id,value] of [['calm','30'],['normal','25'],['agile','18']]){
      await page.locator(`[data-wrist-preset=${id}]`).tap();
      await expect(page.locator('#setting-maxSteerWrist')).toHaveValue(value);
      await expect(page.locator(`[data-wrist-preset=${id}]`)).toHaveAttribute('aria-pressed','true');
      await expect(page.locator('#wrist-sensitivity-presets [aria-pressed=true]')).toHaveCount(1);
      await expect(page.locator('#wrist-sensitivity-status')).toContainText(value+'°');
    }
    await page.locator('#setting-maxSteerWrist').evaluate(el=>{el.value='27';el.dispatchEvent(new Event('input',{bubbles:true}));});
    await expect(page.locator('#wrist-sensitivity-presets [aria-pressed=true]')).toHaveCount(0);
    await expect(page.locator('#wrist-sensitivity-status')).toHaveText('カスタム：27°');
    await page.reload();await step(page,'title');await page.locator('#start-flow-title-settings').click();await step(page,'settings');
    await expect(page.locator('#wrist-sensitivity-status')).toHaveText('カスタム：27°');
  });
});

test('fixed display retains legacy twist compensation while wrist controls bank',async({page})=>{
  await boot(page,{hold:45});await page.locator('#start-flow-pose-settings').click();await page.getByText('② 詳しい設定',{exact:true}).click();await page.locator('#display-fixed').click();
  await page.locator('#setting-displayTimeConstant').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#start-flow-settings-close').click();await launch(page);
  await input(page,{wrist:15},500);const state=await read(page);expect(state.wrist.angle).toBeCloseTo(15,4);expect(state.bank).toBeGreaterThan(0);
  // A 45-degree hold produces a local screen twist distinct from wrist15.
  const legacy=await page.evaluate(()=>window.wristSensor.legacyTwist());expect(Math.abs(legacy-15)).toBeGreaterThan(1);
  expect(state.displayRoll).toBeCloseTo(legacy*Math.PI/180,6);await proof(page,'fixed-display');
});

test('sensitivity buttons change the actual bank response to the same wrist motion',async({page})=>{
  const banks=[];
  for(const preset of ['calm','agile']){
    await boot(page);await page.locator('#start-flow-pose-settings').click();await step(page,'settings');
    await page.locator(`[data-wrist-preset=${preset}]`).click();
    await page.locator('#start-flow-settings-close').click();await step(page,'pose');await launch(page);
    await input(page,{wrist:15},1000);banks.push((await read(page)).bank);
    await page.evaluate(()=>clearInterval(window.wristSensorTimer));
  }
  expect(banks[0]).toBeGreaterThan(.1);expect(banks[1]).toBeGreaterThan(banks[0]*1.5);
});

test.describe('Android orientation continuation',()=>{
  test.use({userAgent:'Mozilla/5.0 (Linux; Android 15; Android fixture) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'});
  test('Android display rotation continues the calibrated wrist until explicit recenter without practice fallback',async({page})=>{
    await boot(page);expect(await page.evaluate(()=>navigator.userAgent)).toContain('Android');await launch(page);await input(page,{wrist:20});
    const before=await read(page);expect(before.wrist.angle).toBeCloseTo(20,4);
    await page.evaluate(()=>{window.wristScreen=90;screen.orientation.dispatchEvent(new Event('change'));window.dispatchEvent(new Event('orientationchange'));});await tick(page,300);
    const continued=await read(page);expect(continued.phase).toBe('running');expect(continued.session.elapsedSeconds).toBeGreaterThan(before.session.elapsedSeconds);
    expect(continued.wrist.angle).toBeCloseTo(20,4);expect(continued.wrist.calibration).toEqual(before.wrist.calibration);expect(await page.locator('#app').getAttribute('data-input')).toBe('sensor');
    await page.locator('#recenter-button').click();await step(page,'pose');await launch(page);
    const recentered=await read(page);expect(recentered.wrist.angle).toBeCloseTo(0,4);expect(recentered.wrist.calibration.screenAngleAtCalibration).toBe(90);
    expect(await page.locator('#app').getAttribute('data-input')).toBe('sensor');await proof(page,'android-rotation-recenter');
  });
});

test.describe('iPhone orientation guard',()=>{
  test.use({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1'});
  test('iPhone display rotation pauses and freezes time until old orientation and explicit recenter resume',async({page})=>{
    await boot(page);expect(await page.evaluate(()=>navigator.userAgent)).toContain('iPhone');await launch(page);await input(page,{wrist:20});const before=await read(page);
    await page.evaluate(()=>{window.wristScreen=90;screen.orientation.dispatchEvent(new Event('change'));window.dispatchEvent(new Event('orientationchange'));});await tick(page,100);await step(page,'pause');
    const paused=await read(page);expect(paused.phase).toBe('paused');expect(paused.wrist.calibration).toEqual(before.wrist.calibration);
    expect(await page.locator('#app').getAttribute('data-input')).toBe('sensor');const frozen=paused.session.elapsedSeconds;await tick(page,1000);expect((await read(page)).session.elapsedSeconds).toBe(frozen);
    await page.evaluate(()=>{window.wristScreen=0;screen.orientation.dispatchEvent(new Event('change'));window.dispatchEvent(new Event('orientationchange'));});await tick(page,1000);await step(page,'pause');
    const returned=await read(page);expect(returned.phase).toBe('paused');expect(returned.session.elapsedSeconds).toBe(frozen);expect(returned.wrist.calibration).toEqual(before.wrist.calibration);
    await page.locator('#start-flow-recenter').click();await step(page,'pose');await launch(page);
    const recentered=await read(page);expect(recentered.phase).toBe('running');expect(recentered.wrist.angle).toBeCloseTo(0,4);expect(recentered.wrist.calibration.screenAngleAtCalibration).toBe(0);
    expect(await page.locator('#app').getAttribute('data-input')).toBe('sensor');await proof(page,'iphone-rotation-recenter');
  });
});

for(const size of [{width:360,height:640},{width:390,height:844},{width:844,height:390}])test(`wrist choices are usable inside settings and never expand title/play ${size.width}x${size.height}`,async({page})=>{
  await boot(page);await page.setViewportSize(size);await page.locator('#start-flow-pose-settings').click();await step(page,'settings');
  for(const mode of ['tilt','twist','wrist']){const button=page.locator('#steering-'+mode);await button.click();const box=await button.boundingBox();expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(size.width+1);}
  await expect(page.locator('#wrist-sensitivity-presets')).toBeVisible();await expect(page.locator('#setting-maxSteerWrist')).toBeVisible();
  await expect(page.locator('label[data-setting-key=maxSteerTilt]')).toBeHidden();await expect(page.locator('label[data-setting-key=maxSteerTwist]')).toBeHidden();
  const scroll=await page.evaluate(()=>({doc:document.documentElement.scrollHeight,body:document.body.scrollHeight,app:document.getElementById('app').scrollHeight,width:document.documentElement.scrollWidth,height:innerHeight,w:innerWidth}));
  expect(scroll.doc).toBeLessThanOrEqual(scroll.height+1);expect(scroll.body).toBeLessThanOrEqual(scroll.height+1);expect(scroll.app).toBeLessThanOrEqual(scroll.height+1);expect(scroll.width).toBeLessThanOrEqual(scroll.w+1);
  await page.locator('#start-flow-settings-close').click();await step(page,'pose');await launch(page);await proof(page,`settings-play-${size.width}x${size.height}`);
});

test('exploration keeps its original body-relative control regardless of the remembered flight steering',async({page})=>{
  const outputs=[];
  for(const query of ['tilt','wrist']){
    await boot(page,{mode:'explore',query,hold:45});await launch(page);await input(page,{pitch:-10,wrist:15},500);outputs.push(await read(page));
    const report=await copy(page);expect(report.mode).toBe('explore');expect(report.input.wrist).toBeUndefined();
    for(const key of ['maxSteerTilt','maxSteerTwist','maxSteerWrist','steerTiltDeadzone','steerTwistDeadzone','steerWristDeadzone'])expect(report.inactiveSettings).toContain(key);
  }
  for(const axis of ['x','y','z']){expect(outputs[1].position[axis]).toBeCloseTo(outputs[0].position[axis],6);expect(outputs[1].velocity[axis]).toBeCloseTo(outputs[0].velocity[axis],6);}
});
