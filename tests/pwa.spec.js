import {useLegacyCourse} from './helpers/legacy-course.js';
import { test, expect } from './helpers/legacy-ui.js';
const iphone='Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Version/18.7 Mobile/15E148 Safari/604.1';
const android='Mozilla/5.0 (Linux; Android 16; Pixel 9a) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36';

async function device(page,userAgent,{installed=false,androidApis=false,failFullscreen=false,failLock=false}={}) {
  await page.addInitScript(({userAgent,installed,androidApis,failFullscreen,failLock})=>{
    Object.defineProperty(navigator,'userAgent',{value:userAgent,configurable:true});
    Object.defineProperty(navigator,'standalone',{value:installed,configurable:true});
    window.screenType='portrait-primary';
    Object.defineProperty(screen.orientation,'type',{get:()=>window.screenType,configurable:true});
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copied=text},configurable:true});
    class Orientation extends Event { static requestPermission() { window.permissionCalls=(window.permissionCalls||0)+1; return Promise.resolve('granted'); } }
    class Motion extends Event { static requestPermission() { window.permissionCalls=(window.permissionCalls||0)+1; return Promise.resolve('granted'); } }
    Object.defineProperty(window,'DeviceOrientationEvent',{value:Orientation,configurable:true});
    Object.defineProperty(window,'DeviceMotionEvent',{value:Motion,configurable:true});
    window.platformCalls=[];
    if(androidApis) {
      let fullscreenElement=null;
      Object.defineProperty(document,'fullscreenElement',{get:()=>fullscreenElement,configurable:true});
      Element.prototype.requestFullscreen=async()=>{
        window.platformCalls.push('fullscreen');
        if(failFullscreen) throw Error('unsupported');
        // Simulate fullscreen changing the OS orientation before the lock call.
        window.screenType='landscape-secondary'; fullscreenElement=document.documentElement;
        document.dispatchEvent(new Event('fullscreenchange'));
      };
      document.exitFullscreen=async()=>{window.platformCalls.push('exit');fullscreenElement=null;document.dispatchEvent(new Event('fullscreenchange'));};
      screen.orientation.lock=async type=>{window.platformCalls.push(type);if(failLock) throw Error('denied');window.screenType=type;};
      screen.orientation.unlock=()=>window.platformCalls.push('unlock');
    }
  },{userAgent,installed,androidApis,failFullscreen,failLock});
}
async function rotate(page,type,size) {
  if(size) await page.setViewportSize(size);
  await page.evaluate(type=>{window.screenType=type;screen.orientation.dispatchEvent(new Event('change'));},type);
}
async function sensors(page) {
  await page.locator('#start-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','waiting');
  await page.evaluate(()=>{
    const send=()=>{
      window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta:0,gamma:0}));
      window.dispatchEvent(Object.assign(new Event('devicemotion'),{rotationRate:{alpha:0,beta:0,gamma:0}}));
    };send();window.poseTimer=setInterval(send,100);
  });
  await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');
  await page.locator('#start-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
}

test('iPhone toast and install advice are visible without covering version or controls',async({page})=>{
  await device(page,iphone);
  for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}]) {
    await page.setViewportSize(size);await page.goto('/?mode=flight&camera=cockpit');
    await expect(page.locator('#orientation-notice')).toBeVisible();
    await expect(page.locator('#orientation-notice')).toContainText(size.width>size.height ? '縦向き用' : '画面縦向きのロック');
    await expect(page.locator('#intro-version')).toContainText('v0.1.38');
    await expect(page.locator('#intro-version')).toBeInViewport();
    await expect(page.locator('#installation-advice')).toContainText('共有メニュー');
    const overlap=await page.evaluate(()=>{
      const a=document.querySelector('#orientation-notice').getBoundingClientRect();
      return [...document.querySelectorAll('#intro-card button:not(#orientation-notice button),#intro-version')].filter(e=>!e.hidden&&e.getClientRects().length).some(e=>{
        const b=e.getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
      });
    });expect(overlap).toBe(false);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`test-results/v0119-iphone-${size.width}.png`});
    await page.getByRole('button',{name:'向き固定の案内を閉じる'}).click();
    await expect(page.locator('#orientation-notice')).toBeHidden();
    await expect(page.locator('#dialog-title')).toBeVisible();
  }
});
test('toast times out and is not shown for Android or desktop',async({page})=>{
  await device(page,iphone);await page.clock.install();await page.goto('/?mode=flight');
  await page.clock.runFor(10100);await expect(page.locator('#orientation-notice')).toBeHidden();
  for(const ua of [android,'Mozilla/5.0 Macintosh','Mozilla/5.0 iPad']) {
    await device(page,ua);await page.goto('/?mode=flight');
    await expect(page.locator('#orientation-notice')).toBeHidden();await expect(page.locator('#installation-advice')).toBeHidden();
  }
});
for(const [start,end,startSize,endSize] of [
  ['portrait-primary','landscape-primary',{width:390,height:844},{width:844,height:390}],
  ['landscape-primary','portrait-primary',{width:844,height:390},{width:390,height:844}],
  ['landscape-primary','landscape-secondary',{width:844,height:390},{width:844,height:390}],
]) test(`iPhone ${start} to ${end} pauses and requires fresh calibration on return`,async({page})=>{
  await device(page,iphone);await page.setViewportSize(startSize);await page.goto('/?mode=flight&display=fixed');
  await rotate(page,start);await sensors(page);
  await rotate(page,end,endSize);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
  await expect(page.locator('#dialog-description')).toContainText('開始したときの向きに戻してください');
  await expect(page.locator('#throttle-value')).toHaveText('0%');await expect(page.locator('#speed-value')).toHaveText('0.0');
  await expect(page.locator('#start-button')).toBeDisabled();await expect(page.locator('#practice-button')).toBeDisabled();
  const stopped=await page.locator('#app').getAttribute('data-position');
  await rotate(page,start,startSize);
  await expect(page.locator('#dialog-title')).toHaveText('元の向きに戻りました');
  await expect(page.locator('#start-button')).toBeEnabled();
  await page.waitForTimeout(150);expect(await page.locator('#app').getAttribute('data-position')).toBe(stopped);
  await rotate(page,end);await expect(page.locator('#start-button')).toBeDisabled();
  await rotate(page,start);await page.locator('#start-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  await expect(page.locator('#throttle-value')).toHaveText('50%');await expect(page.locator('#pitch-value')).toHaveText('0°');
});
test('manually paused iPhone can choose a new orientation; exploration receives the same automatic hold',async({page})=>{
  await device(page,iphone);await page.goto('/?mode=explore');await page.locator('#practice-button').click();
  await page.locator('#pause-button').click();await rotate(page,'landscape-primary',{width:844,height:390});
  await page.locator('#start-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  await rotate(page,'portrait-primary',{width:390,height:844});
  await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');await expect(page.locator('#start-button')).toBeDisabled();
  await page.locator('#reset-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
});
test('Android locks the exact type captured before fullscreen, recenter locks again, and pause can release',async({page})=>{
  await device(page,android,{androidApis:true});await page.goto('/?mode=flight');
  await rotate(page,'landscape-primary');await sensors(page);
  expect(await page.evaluate(()=>window.platformCalls)).toEqual(['fullscreen','landscape-primary']);
  expect(await page.evaluate(()=>window.permissionCalls)).toBe(2);
  await page.locator('#recenter-button').click();
  await expect.poll(()=>page.evaluate(()=>window.platformCalls.filter(x=>x==='landscape-primary').length)).toBe(2);
  await expect(page.locator('#release-screen-button')).toBeVisible();await page.locator('#release-screen-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-fullscreen','false');
  expect(await page.evaluate(()=>window.platformCalls)).toContain('unlock');expect(await page.evaluate(()=>window.platformCalls)).toContain('exit');
  await page.locator('#flight-adjustments > summary').click();await page.locator('#settings-copy').click();
  const report=await page.evaluate(()=>JSON.parse(window.copied));expect(report.launch).toBe('browser');expect(report.fullscreen).toBe(false);
});
for(const failure of ['fullscreen','lock']) test(`Android ${failure} rejection still allows play without errors`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await device(page,android,{androidApis:true,failFullscreen:failure==='fullscreen',failLock:failure==='lock'});
  await page.goto('/?mode=flight');await page.locator('#practice-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await expect(page.locator('#throttle-value')).toHaveText('50%');
  expect(await page.evaluate(()=>window.platformCalls)).toContain('portrait-primary');expect(errors).toEqual([]);
});
test('install offer only appears after browser event and never changes the current launch record',async({page})=>{
  await device(page,android);await page.goto('/?mode=flight');await expect(page.locator('#install-button')).toBeHidden();
  await page.evaluate(()=>{
    const event=new Event('beforeinstallprompt',{cancelable:true});
    event.prompt=async()=>window.prompted=true;event.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(event);
  });
  await expect(page.locator('#install-button')).toBeVisible();await page.locator('#install-button').click();
  expect(await page.evaluate(()=>window.prompted)).toBe(true);
  await page.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));
  await expect(page.locator('#install-button')).toBeHidden();await expect(page.locator('#app')).toHaveAttribute('data-launch','browser');
});
test('installed iPhone suppresses only install advice and records installed, while retaining orientation toast',async({page})=>{
  await device(page,iphone,{installed:true});await page.goto('/?mode=flight');
  await expect(page.locator('#installation-advice')).toBeHidden();await expect(page.locator('#orientation-notice')).toBeVisible();
  await expect(page.locator('#app')).toHaveAttribute('data-launch','installed');
  await page.locator('#practice-button').click();await page.locator('#pause-button').click();
  await page.locator('#flight-adjustments > summary').click();await page.locator('#settings-copy').click();
  const report=await page.evaluate(()=>JSON.parse(window.copied));expect(report.launch).toBe('installed');expect(report.fullscreen).toBe(false);
});

for(const phase of ['intro','paused']) for(const leave of ['hidden','blur']) for(const outcome of ['resolve','reject']) test(`leaving ${phase} during pending fullscreen cancels a late start (${leave}, ${outcome})`,async({page})=>{
  await device(page,android,{androidApis:true});await page.goto('/?mode=flight');
  if(phase==='paused') {
    await page.locator('#practice-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
    await page.locator('#pause-button').click();await page.locator('#release-screen-button').click();
  }
  await page.evaluate(()=>{
    window.waitingFullscreen=false;
    Element.prototype.requestFullscreen=()=>new Promise((resolve,reject)=>{window.waitingFullscreen=true;window.finishFullscreen=outcome=>outcome==='resolve'?resolve():reject(Error('cancelled'));});
  });
  await page.locator(phase==='intro'?'#practice-button':'#start-button').click();
  await expect.poll(()=>page.evaluate(()=>window.waitingFullscreen)).toBe(true);
  await page.evaluate(({leave,outcome})=>{
    if(leave==='hidden') {Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));}
    else window.dispatchEvent(new Event('blur'));
    window.finishFullscreen(outcome);
  },{leave,outcome});
  await page.waitForTimeout(200);
  await expect(page.locator('#app')).toHaveAttribute('data-phase',phase);
  await expect(page.locator('#throttle-value')).toHaveText('0%');await expect(page.locator('#speed-value')).toHaveText('0.0');
  expect(await page.locator('#feedback-diagnostics').getAttribute('data-music').then(s=>JSON.parse(s||'{}').playing||false)).toBe(false);
});

test('the sensor permission prompt may blur without cancelling the existing permission flow',async({page})=>{
  await device(page,iphone);await page.goto('/?mode=flight');
  await page.evaluate(()=>{
    const permission=new Promise(resolve=>window.allowSensors=resolve);
    DeviceOrientationEvent.requestPermission=()=>permission;DeviceMotionEvent.requestPermission=()=>permission;
  });
  await page.locator('#start-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','waiting');
  await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.allowSensors('granted');});
  await page.evaluate(()=>{window.poseTimer=setInterval(()=>window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta:0,gamma:0})),50);});
  await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');
});

useLegacyCourse(test);
