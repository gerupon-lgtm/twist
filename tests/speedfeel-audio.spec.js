import {test,expect} from '@playwright/test';

const poll={timeout:8000,intervals:[25,50,100,200]};
const music=page=>page.locator('#feedback-diagnostics').getAttribute('data-music').then(value=>JSON.parse(value||'{}'));
const probe=page=>page.evaluate(()=>({audio:window.__speedfeelProbe.audio.snapshot(),music:window.__speedfeelProbe.music.snapshot()}));

test('native worklet applies beat-aligned AB drums while base MIDI continues, and cancels layer hits on disable and pause',async({page})=>{
  test.setTimeout(35000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?mode=flight');
  await page.evaluate(async()=>{
    const [{createGameAudio},{createMusicPlayer},{flightFeedback},{normalizeFeedbackSettings}]=await Promise.all([
      import('/src/feedback/audio.js'),import('/src/music/player.js'),import('/src/feedback/model.js'),import('/src/feedback/settings.js')]);
    const audio=createGameAudio(),music=createMusicPlayer(audio,{base:new URL('/music/',location.href)});
    const fixture=window.__speedfeelProbe={audio,music,settings:normalizeFeedbackSettings({sound:true,sfx:true,bgm:true,abMusic:true,vario:false}),
      state:{mode:'flight',altitude:30,verticalSpeed:0,throttle:1,speed:30,afterburner:{active:false,burstSeconds:0}}};
    music.setSettings(fixture.settings);
    fixture.send=(active,extra={})=>{fixture.state={...fixture.state,...extra,afterburner:{active,burstSeconds:active?1:0}};audio.update(flightFeedback(fixture.state,fixture.settings),fixture.settings,null);music.setAfterburner(active);};
    const button=document.createElement('button');button.id='speedfeel-unlock';button.textContent='Start native speedfeel audio';
    Object.assign(button.style,{position:'fixed',top:'10px',left:'10px',zIndex:'2147483647'});
    button.onclick=()=>{fixture.ready=(async()=>{audio.start();await audio.unlock();fixture.send(false);await music.play('flight');})();};document.body.prepend(button);
  });
  expect((await probe(page)).audio.contextState).toBe('none');expect((await probe(page)).music.playing).toBe(false);
  await page.locator('#speedfeel-unlock').click();await expect.poll(async()=>(await probe(page)).music.playing,poll).toBe(true);
  const original=(await probe(page)).music;
  await page.evaluate(()=>window.__speedfeelProbe.send(true));
  await expect.poll(async()=>(await probe(page)).music.afterburnerMusic.active,poll).toBe(true);
  await expect.poll(async()=>(await probe(page)).audio.musicSchedule?.layerWrites??0,poll).toBeGreaterThan(0);
  const boosted=await probe(page);expect(boosted.music.trackId).toBe(original.trackId);expect(boosted.music.playedTracks).toEqual(original.playedTracks);expect(boosted.music.position).toBeGreaterThan(original.position);
  expect(boosted.audio.peak).toBeGreaterThan(0);expect(boosted.music.afterburnerMusic.bpm).toBe(160);
  await page.evaluate(()=>window.__speedfeelProbe.send(false));
  await expect.poll(async()=>(await probe(page)).music.afterburnerMusic.active,{timeout:9000}).toBe(false);
  const restored=(await probe(page)).music;expect(restored.current).toBe('flight');expect(restored.position).toBeGreaterThan(boosted.music.position);expect(restored.afterburnerMusic.startCount).toBe(1);
  await page.evaluate(()=>{const p=window.__speedfeelProbe;p.send(true);p.settings={...p.settings,abMusic:false};p.music.setSettings(p.settings);});
  expect((await probe(page)).music.afterburnerMusic.active).toBe(false);expect((await probe(page)).music.afterburnerMusic.pending).toBe(false);
  // Once cancellation has reached the native worklet, a complete extra poll
  // window must contain no stale scheduled layer hit.
  await page.waitForTimeout(1100);const count=(await probe(page)).audio.musicSchedule.layerWrites;
  await page.waitForTimeout(1100);expect((await probe(page)).audio.musicSchedule.layerWrites).toBe(count);
  await page.evaluate(()=>{const p=window.__speedfeelProbe;p.audio.passBy({id:'fixture-tower',speed:40,distance:3,side:1},p.settings);});
  await expect.poll(async()=>(await probe(page)).audio.passby?.accepted??0,poll).toBeGreaterThan(0);
  const beforeEvent=(await probe(page)).audio.passby.accepted;
  await page.evaluate(()=>{const p=window.__speedfeelProbe;p.audio.event('collect',p.settings);p.audio.passBy({id:'event-blocked',speed:40,distance:3,side:1},p.settings);});
  await expect.poll(async()=>(await probe(page)).audio.passby?.reason,poll).toBe('event');expect((await probe(page)).audio.passby.accepted).toBe(beforeEvent);
  await page.waitForTimeout(350);
  await page.evaluate(()=>{const p=window.__speedfeelProbe;p.send(false,{altitude:2});p.audio.passBy({id:'blocked-tower',speed:40,distance:3,side:1},p.settings);});
  await expect.poll(async()=>(await probe(page)).audio.passby?.reason,poll).toBe('warning');
  await page.evaluate(()=>{const p=window.__speedfeelProbe;p.music.stop();p.audio.stop();});
  await expect.poll(async()=>(await probe(page)).audio.contextState,poll).toBe('suspended');expect((await probe(page)).music.afterburnerMusic.pending).toBe(false);
  await page.evaluate(()=>window.__speedfeelProbe.audio.dispose());expect(errors).toEqual([]);
});

test('earned game fuel and trusted throttle input drive the native AB music layer and return to the same base song',async({page})=>{
  test.setTimeout(30000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:true,bgm:true,sfx:true,vario:false,vibration:false,abMusic:true}));localStorage.setItem('twist.flight-settings.v1',JSON.stringify({audioGuidance:false}));});
  await page.goto('/?mode=flight&course=legacy&camera=overlay&pitch=rate');
  expect((await music(page)).afterburnerMusic.active).toBe(false);
  await page.locator('#practice-button').click();await expect.poll(async()=>(await music(page)).playing,poll).toBe(true);
  await expect(page.locator('#collection-count')).toHaveText('1',{timeout:12000});await page.waitForTimeout(350);
  const original=await music(page),input=page.locator('#throttle-input');await input.press('End');await expect(input).toHaveValue('120');
  await expect.poll(async()=>(await music(page)).afterburnerMusic.active,poll).toBe(true);
  const boosted=await music(page);expect(boosted.trackId).toBe(original.trackId);expect(boosted.position).toBeGreaterThan(original.position);
  await input.press('PageDown');await input.press('PageDown');await expect(input).toHaveValue('100');
  await expect.poll(async()=>(await music(page)).afterburnerMusic.requested,poll).toBe(false);
  await expect.poll(async()=>(await music(page)).afterburnerMusic.active,{timeout:9000}).toBe(false);
  const restored=await music(page);expect(restored.current).toBe('flight');expect(restored.trackId).toBe(original.trackId);expect(restored.position).toBeGreaterThan(boosted.position);expect(restored.playedTracks).toEqual(original.playedTracks);
  await page.locator('#pause-button').click();await expect.poll(async()=>(await music(page)).playing,poll).toBe(false);
  await page.locator('#flight-adjustments > summary').click();await page.locator('#feedback-abMusic').uncheck();await page.locator('#start-button').click();
  await expect.poll(async()=>(await music(page)).playing,poll).toBe(true);expect((await music(page)).afterburnerMusic.enabled).toBe(false);expect((await music(page)).afterburnerMusic.active).toBe(false);
  expect(errors).toEqual([]);
});
