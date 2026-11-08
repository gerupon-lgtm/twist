import {useLegacyCourse} from './helpers/legacy-course.js';
import {test,expect} from './helpers/legacy-ui.js';

// Real wall time is intentional: AudioWorklet.currentTime must advance with the
// native AudioContext, so these cases must not use page.clock or a fake worklet.
const diagnostics=page=>page.locator('#feedback-diagnostics').getAttribute('data-audio').then(value=>JSON.parse(value||'{}'));
const probe=page=>page.evaluate(()=>window.__v0125AudioProbe.audio.snapshot());
const ack=async page=>(await probe(page)).navigation?.acknowledged;
const pollOptions={timeout:8000,intervals:[25,50,100,200]};
const send=(page,state={},navigation={bearingDeg:80,enabled:true},settings={})=>page.evaluate(
  ({state,navigation,settings})=>window.__v0125AudioProbe.send(state,navigation,settings),{state,navigation,settings});

async function installNativeProbe(page){
  await page.goto('/?mode=flight');
  await page.evaluate(async()=>{
    const [{createGameAudio},{flightFeedback},{normalizeFeedbackSettings}]=await Promise.all([
      import('/src/feedback/audio.js'),import('/src/feedback/model.js'),import('/src/feedback/settings.js'),
    ]);
    const audio=createGameAudio();
    const fixture={audio,state:{mode:'flight',altitude:30,groundClearance:30,verticalSpeed:0,
      throttle:.5,speed:10,angleOfAttack:0},settings:normalizeFeedbackSettings({sound:true,sfx:true,vario:true,bgm:false,volume:25})};
    fixture.send=(changes={},navigation={bearingDeg:80,enabled:true},settings={})=>{
      fixture.state={...fixture.state,...changes};fixture.settings=normalizeFeedbackSettings({...fixture.settings,...settings});
      audio.update(flightFeedback(fixture.state,fixture.settings),fixture.settings,null,navigation);
    };
    fixture.send();
    window.__v0125AudioProbe=fixture;
    const button=document.createElement('button');button.id='v0125-unlock-audio';button.textContent='Start native audio probe';
    Object.assign(button.style,{position:'fixed',top:'10px',left:'10px',zIndex:'2147483647'});
    button.onclick=()=>{audio.start();fixture.ready=audio.unlock();};document.body.append(button);
  });
  expect((await probe(page)).contextState).toBe('none');
  // Trusted browser click exercises the production explicit-unlock API.
  await page.locator('#v0125-unlock-audio').click();
  await expect.poll(async()=>(await probe(page)).workletReady,pollOptions).toBe(true);
  await expect.poll(async()=>(await ack(page))?.accepted??0,pollOptions).toBeGreaterThan(0);
  expect((await probe(page)).contextState).toBe('running');
}

test('actual app passes the sixth navigation argument and honors the saved audio-guidance toggle',async({page})=>{
  test.setTimeout(30000);
  await page.goto('/?mode=flight&camera=cockpit');
  await expect.poll(async()=>(await diagnostics(page)).contextState,pollOptions).toBe('none');
  await page.locator('#practice-button').click();
  await expect.poll(async()=>(await diagnostics(page)).workletReady,pollOptions).toBe(true);
  await expect.poll(async()=>(await diagnostics(page)).navigation?.acknowledged?.accepted??0,pollOptions).toBeGreaterThan(0);
  const running=await diagnostics(page);
  expect(running.navigation.requested.enabled).toBe(true);
  expect(Number.isFinite(running.navigation.requested.bearingDeg)).toBe(true);
  expect(running.navigation.acknowledged.enabled).toBe(true);

  await page.locator('#pause-button').click();
  await expect.poll(async()=>(await diagnostics(page)).contextState,pollOptions).toBe('suspended');
  await page.locator('#flight-adjustments > summary').click();
  await page.locator('#setting-audioGuidance').uncheck();
  await page.locator('#start-button').click();
  await expect.poll(async()=>(await diagnostics(page)).navigation?.requested?.enabled,pollOptions).toBe(false);
  await expect.poll(async()=>(await diagnostics(page)).navigation?.acknowledged?.reason,pollOptions).toBe('disabled');
  const disabled=await diagnostics(page);
  expect(disabled.navigation.acknowledged.active).toBe(false);expect(disabled.navigation.acknowledged.pan).toBe(0);

  await page.locator('#pause-button').click();
  await expect.poll(async()=>(await diagnostics(page)).contextState,pollOptions).toBe('suspended');
  await page.reload();await page.locator('#practice-button').click();await page.locator('#pause-button').click();
  await page.locator('#flight-adjustments > summary').click();
  await expect(page.locator('#setting-audioGuidance')).not.toBeChecked();
  await page.locator('#setting-audioGuidance').check();await page.locator('#start-button').click();
  await expect.poll(async()=>(await diagnostics(page)).navigation?.requested?.enabled,pollOptions).toBe(true);
  await expect.poll(async()=>(await diagnostics(page)).navigation?.acknowledged?.enabled,pollOptions).toBe(true);
});

test('native AudioContext and worklet acknowledge right, left, forward and immediate toggle cancellation',async({page})=>{
  test.setTimeout(25000);await installNativeProbe(page);
  let value=await ack(page);
  expect(value.lastPan).toBeCloseTo(8/9,6);expect(value.lastIntervalMs).toBe(700);
  let accepted=value.accepted;
  await send(page,{}, {bearingDeg:-80,enabled:true});
  await expect.poll(async()=>{const n=await ack(page);return n?.accepted>accepted&&n.lastPan<0;},pollOptions).toBe(true);
  value=await ack(page);expect(value.lastPan).toBeCloseTo(-8/9,6);expect(value.lastIntervalMs).toBe(700);

  accepted=value.accepted;await send(page,{}, {bearingDeg:0,enabled:true});
  await expect.poll(async()=>{const n=await ack(page);return n?.accepted>accepted&&n.lastPan===0&&n.lastIntervalMs===300;},pollOptions).toBe(true);
  await send(page,{}, {bearingDeg:80,enabled:false});
  await expect.poll(async()=>(await ack(page))?.reason,pollOptions).toBe('disabled');
  value=await ack(page);expect(value.active).toBe(false);expect(value.pan).toBe(0);accepted=value.accepted;
  // Longer than a complete normal forward cue interval: no late/stale restart.
  await page.waitForTimeout(450);expect((await ack(page)).accepted).toBe(accepted);
  await send(page,{}, {bearingDeg:80,enabled:true});
  await expect.poll(async()=>(await ack(page))?.accepted??0,pollOptions).toBeGreaterThan(accepted);
  await page.evaluate(()=>window.__v0125AudioProbe.audio.dispose());
});

test('real worklet reserves vario quiet gaps and warning/event priority above navigation',async({page})=>{
  test.setTimeout(25000);await installNativeProbe(page);
  await send(page,{verticalSpeed:2});
  await expect.poll(async()=>(await ack(page))?.reason,pollOptions).toBe('vario');
  let value=await ack(page),accepted=value.accepted;
  expect(value.active).toBe(false);expect(value.pan).toBe(0);expect(value.suppressed).toBeGreaterThan(0);
  // v/s=2 has a 570ms period and a 110ms sounding part. Hold through the quiet
  // gap and next cycle; the 300ms+ navigation scheduler must stay blocked.
  await page.waitForTimeout(700);expect((await ack(page)).accepted).toBe(accepted);
  await expect.poll(async()=>(await probe(page)).varioActive,pollOptions).toBe(true);

  await send(page,{verticalSpeed:0,angleOfAttack:25*Math.PI/180});
  await expect.poll(async()=>(await ack(page))?.reason,pollOptions).toBe('warning');
  value=await ack(page);expect(value.pan).toBe(0);expect(value.active).toBe(false);accepted=value.accepted;
  await page.waitForTimeout(700);expect((await ack(page)).accepted).toBe(accepted);

  await send(page,{angleOfAttack:0});
  await expect.poll(async()=>(await ack(page))?.accepted??0,pollOptions).toBeGreaterThan(accepted);
  await page.evaluate(()=>{const p=window.__v0125AudioProbe;p.audio.event('collect',p.settings);});
  await expect.poll(async()=>(await ack(page))?.reason,{timeout:3000,intervals:[10,20,30]}).toBe('event');
  value=await ack(page);expect(value.active).toBe(false);expect(value.pan).toBe(0);accepted=value.accepted;
  await expect.poll(async()=>(await ack(page))?.accepted??0,pollOptions).toBeGreaterThan(accepted);
  await page.evaluate(()=>window.__v0125AudioProbe.audio.stop());
  await expect.poll(async()=>(await probe(page)).contextState,pollOptions).toBe('suspended');
  await page.evaluate(()=>window.__v0125AudioProbe.audio.dispose());
});

useLegacyCourse(test);
