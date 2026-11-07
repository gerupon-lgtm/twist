import {test,expect} from '@playwright/test';

// Use wall time: a native AudioContext/AudioWorklet clock must advance alongside
// the actual app. The only API replacement records Vibration API requests.
const pollOptions={timeout:8000,intervals:[25,50,100,200]};
const audio=page=>page.locator('#feedback-diagnostics').getAttribute('data-audio').then(value=>JSON.parse(value||'{}'));
const afterburner=page=>page.locator('#app').getAttribute('data-afterburner').then(value=>JSON.parse(value||'{}'));
const vibrations=page=>page.evaluate(()=>window.__abFeedbackProbe.vibrations);

async function prepare(page,{engineVibration=true}={}) {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({engineVibration})=>{
    const probe=window.__abFeedbackProbe={audioConstructions:0,vibrations:[]};
    Object.defineProperty(navigator,'vibrate',{configurable:true,value:pattern=>{
      probe.vibrations.push(Array.isArray(pattern)?[...pattern]:pattern);return true;
    }});
    const key=window.AudioContext?'AudioContext':'webkitAudioContext',Native=window[key];
    if(Native)window[key]=class extends Native{constructor(...args){super(...args);probe.audioConstructions++;}};
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:true,sfx:true,bgm:false,vario:false,
      volume:25,vibration:true,vibrationScale:1,engineVibration,flightVibration:'fine'}));
    localStorage.setItem('twist.flight-settings.v1',JSON.stringify({audioGuidance:false}));
  },{engineVibration});
  await page.goto('/?mode=flight&course=legacy&camera=overlay&pitch=rate');
  await expect(page.locator('#app')).toHaveAttribute('data-phase','intro');
  await expect.poll(async()=>(await audio(page)).contextState,pollOptions).toBe('none');
  expect(await page.evaluate(()=>window.__abFeedbackProbe.audioConstructions)).toBe(0);
  expect(await vibrations(page)).toEqual([]);
  return errors;
}

async function earnRealFuel(page) {
  await page.locator('#practice-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  await expect.poll(async()=>(await audio(page)).workletReady,pollOptions).toBe(true);
  // Legacy starts level at (0,14,26), so neutral flight really reaches TGT1.
  // No position, gauge, collection or feedback model is overridden by this test.
  await expect(page.locator('#collection-count')).toHaveText('1',{timeout:12000});
  await expect.poll(async()=>(await afterburner(page)).fuel,pollOptions).toBeGreaterThanOrEqual(25);
  expect((await afterburner(page)).uses).toBe(0);
  // Let the real 300ms collect event finish before asking for the steady roar.
  await page.waitForTimeout(350);
}

async function dragToAB(page) {
  const input=page.locator('#throttle-input'),surface=page.locator('.throttle-drag-surface');
  await expect(input).toBeEnabled();
  const box=await surface.boundingBox();expect(box).not.toBeNull();
  const current=Number(await input.inputValue()),start={x:box.x+14,y:box.y+box.height/2};
  const distance=(120-current)/120*Math.max(20,box.width-28);
  await page.mouse.move(start.x,start.y);await page.mouse.down();
  await page.mouse.move(start.x+distance+1,start.y,{steps:12});await page.mouse.up();
  await expect(input).toHaveValue('120');
  await expect.poll(async()=>(await afterburner(page)).active,{timeout:3000,intervals:[20,50]}).toBe(true);
}

async function expectNativeRoar(page) {
  // Poll metrics arrive once per real second. The 120ms ignition envelope is
  // covered by unit tests; a one-second poll must observe the sustained phase.
  await expect.poll(async()=>{
    const snapshot=await audio(page),ack=snapshot.afterburner?.acknowledged;
    return snapshot.contextState==='running'&&snapshot.workletReady
      &&snapshot.afterburner?.requested?.active===true&&ack?.active===true
      &&ack.phase==='roar'&&ack.burstSeconds>=.12&&snapshot.peak>0;
  },pollOptions).toBe(true);
}

async function expectStopped(page) {
  await page.locator('#pause-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
  await expect.poll(async()=>(await audio(page)).contextState,pollOptions).toBe('suspended');
  await expect.poll(async()=>(await audio(page)).afterburner?.requested,pollOptions).toBeNull();
  expect((await vibrations(page)).at(-1)).toBe(0);
  const count=(await vibrations(page)).length;
  await page.waitForTimeout(350);
  expect((await vibrations(page)).slice(count).every(pattern=>pattern===0)).toBe(true);
}

test('earned fuel and trusted AB drag drive the native worklet and stronger vibration; pause cancels both',async({page})=>{
  test.setTimeout(30000);
  const errors=await prepare(page);await earnRealFuel(page);
  const before=(await vibrations(page)).length;
  await dragToAB(page);await expectNativeRoar(page);
  const added=(await vibrations(page)).slice(before);
  expect(added.some(pattern=>Array.isArray(pattern)&&pattern.length===8
    &&pattern.every(value=>value===30))).toBe(true);
  expect((await afterburner(page)).uses).toBe(1);
  expect((await afterburner(page)).earned).toBeGreaterThanOrEqual(25);
  await expectStopped(page);expect(errors).toEqual([]);
});

test('disabling engine vibration preserves real AB roar without issuing the continuous AB vibration',async({page})=>{
  test.setTimeout(30000);
  const errors=await prepare(page,{engineVibration:false});await earnRealFuel(page);
  const before=(await vibrations(page)).length;
  await dragToAB(page);await expectNativeRoar(page);
  // The real collect pulse finished above; no haptic restart can be relied on
  // to publish AB audio when engineVibration is disabled.
  expect((await vibrations(page)).slice(before).some(Array.isArray)).toBe(false);
  await expectStopped(page);expect(errors).toEqual([]);
});
