import {test,expect} from '@playwright/test';

async function sensors(page,{permission='pending'}={}){
  await page.addInitScript(({permission})=>{
    if(!/^https?:$/.test(location.protocol))return;
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,camera:'overlay',inputMethod:'sensor'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    Object.defineProperty(navigator,'userAgent',{value:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Version/18.7 Mobile/15E148 Safari/604.1',configurable:true});
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true,writable:true});
    window.sensorPermissionCalls=[];window.sensorPermissionResolvers=[];
    let pending;
    const request=kind=>{
      window.sensorPermissionCalls.push({kind,userActivation:navigator.userActivation.isActive});
      if(permission==='pending'){
        if(kind==='orientation')pending=new Promise(resolve=>{window.resolveSensorPermission=resolve;window.sensorPermissionResolvers.push(resolve);});
        return pending;
      }
      return Promise.resolve(permission==='denied'?'denied':'granted');
    };
    if(permission==='unsupported'){
      delete window.DeviceOrientationEvent;delete window.DeviceMotionEvent;
    }else{
      class Orientation extends Event{static requestPermission(){return request('orientation');}}
      class Motion extends Event{static requestPermission(){return request('motion');}}
      Object.defineProperty(window,'DeviceOrientationEvent',{value:Orientation,configurable:true});
      Object.defineProperty(window,'DeviceMotionEvent',{value:Motion,configurable:true});
    }
  },{permission});
}
async function pose(page){
  await page.goto('/?mode=flight&course=easy');
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','title');
  await page.locator('#start-flow-start').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','courses');
  await page.locator('#start-flow-course-start').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');
}
async function samples(page){
  await page.evaluate(()=>{
    const send=()=>window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta:25,gamma:0}));
    send();window.sensorSamples=setInterval(send,100);
  });
}
const method=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('twist.start-flow.v1')).inputMethod);
const waitForThree=page=>expect.poll(async()=>{await page.clock.runFor(50);return page.locator('#start-flow-countdown').textContent();},{timeout:10000,intervals:[0,10,20]}).toBe('3');

test('pose requests both sensor permissions in its click and pending permission blur preserves the flow',async({page})=>{
  await sensors(page);await page.clock.install();await pose(page);
  expect(await page.evaluate(()=>window.sensorPermissionCalls)).toEqual([]);
  await page.locator('#start-flow-hold').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','waiting');
  expect(await page.evaluate(()=>window.sensorPermissionCalls)).toEqual([{kind:'orientation',userActivation:true},{kind:'motion',userActivation:true}]);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#app')).toHaveAttribute('data-phase','waiting');
  await page.evaluate(()=>window.resolveSensorPermission('granted'));
  await page.clock.runFor(100);await expect(page.locator('#app')).toHaveAttribute('data-phase','waiting');
  await expect(page.locator('#throttle-value')).toHaveText('0%');
  await samples(page);await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','countdown');
  await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');
  await waitForThree(page);
  await page.clock.runFor(2500);await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');
  await page.clock.runFor(550);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  await expect(page.locator('#app')).toHaveAttribute('data-input','sensor');
  await expect(page.locator('#pitch-value')).toHaveText('0°');await expect(page.locator('#steer-value')).toHaveText('0°');
  expect(await method(page)).toBe('sensor');
});

test('denied sensor access recommends explicit screen control and never chooses it automatically',async({page})=>{
  await sensors(page,{permission:'denied'});await page.clock.install();await pose(page);await page.locator('#start-flow-hold').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','error');
  await expect(page.locator('#start-flow-pose-error')).toContainText('許可されていません');
  await expect(page.locator('#start-flow-pose-error')).toContainText('画面で操縦');
  await page.clock.runFor(10000);await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');
  await expect(page.locator('#app')).toHaveAttribute('data-phase','error');await expect(page.locator('#throttle-value')).toHaveText('0%');
  expect(await method(page)).toBe('sensor');
});

test('an unavailable orientation API leaves a stopped pose with the screen-control recommendation',async({page})=>{
  await sensors(page,{permission:'unsupported'});await page.clock.install();await pose(page);
  expect(await page.evaluate(()=>('DeviceOrientationEvent' in window))).toBe(false);
  await page.locator('#start-flow-hold').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','error');
  await expect(page.locator('#start-flow-pose-error')).toContainText('傾きを取得できません');
  await expect(page.locator('#start-flow-pose-error')).toContainText('画面で操縦');
  await page.clock.runFor(10000);await expect(page.locator('#app')).toHaveAttribute('data-phase','error');
  expect(await method(page)).toBe('sensor');await expect(page.locator('#throttle-value')).toHaveText('0%');
});

test('hiding during permission wait prevents a late grant and sensor samples from starting flight',async({page})=>{
  await sensors(page);await page.clock.install();await pose(page);await page.locator('#start-flow-hold').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','waiting');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
  const position=await page.locator('#app').getAttribute('data-position');
  await page.evaluate(()=>window.resolveSensorPermission('granted'));await samples(page);await page.clock.runFor(10000);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.runFor(1000);await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pause');
  expect(await page.locator('#app').getAttribute('data-position')).toBe(position);await expect(page.locator('#throttle-value')).toHaveText('0%');
  expect(await method(page)).toBe('sensor');
});

test('granted permission without the first valid sample times out without a countdown or practice fallback',async({page})=>{
  await sensors(page,{permission:'granted'});await page.clock.install();await pose(page);await page.locator('#start-flow-hold').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','waiting');
  await page.clock.runFor(6100);await expect(page.locator('#app')).toHaveAttribute('data-phase','error');
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');
  await expect(page.locator('#start-flow-pose-error')).toContainText('傾きデータが届きません');
  await expect(page.locator('#start-flow-pose-error')).toContainText('画面で操縦');
  expect(await method(page)).toBe('sensor');await expect(page.locator('#throttle-value')).toHaveText('0%');
});

test('opening pose settings cancels a pending permission and returns to pose without a late countdown',async({page})=>{
  await sensors(page);await page.clock.install();await pose(page);await page.locator('#start-flow-hold').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','waiting');
  await page.locator('#start-flow-pose-settings').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','settings');
  await expect(page.locator('#app')).toHaveAttribute('data-phase','intro');
  await page.evaluate(()=>window.resolveSensorPermission('granted'));await samples(page);await page.clock.runFor(10000);
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','settings');
  await expect(page.locator('#app')).toHaveAttribute('data-phase','intro');await expect(page.locator('#throttle-value')).toHaveText('0%');
  await page.locator('#start-flow-settings-close').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');
  await expect(page.locator('#app')).toHaveAttribute('data-phase','intro');expect(await method(page)).toBe('sensor');
});

test('a late cancelled permission cannot clear the blur guard for a newer permission request',async({page})=>{
  await sensors(page);await page.clock.install();await pose(page);await page.locator('#start-flow-hold').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','waiting');
  await page.locator('#start-flow-pose-settings').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','intro');
  await page.locator('#start-flow-settings-close').click();await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');
  await page.locator('#start-flow-hold').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','waiting');
  expect(await page.evaluate(()=>window.sensorPermissionResolvers.length)).toBe(2);
  await page.evaluate(()=>window.sensorPermissionResolvers[0]('granted'));
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#app')).toHaveAttribute('data-phase','waiting');
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');
  await page.evaluate(()=>window.sensorPermissionResolvers[1]('granted'));await samples(page);
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','countdown');
  await waitForThree(page);
  await page.clock.runFor(3050);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  await expect(page.locator('#app')).toHaveAttribute('data-input','sensor');expect(await method(page)).toBe('sensor');
});
