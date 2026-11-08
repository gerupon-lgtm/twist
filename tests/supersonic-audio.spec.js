import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

// Isolated native-audio integration. Real AudioContext/AudioWorklet and production
// modules; the legacy page supplies a document without starting an actual flight.
test('native sonic bus is gesture gated, single use, and gives warnings and pause immediate priority',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?dev=1&flow=legacy&course=easy');
  await page.evaluate(async()=>{
    const {createGameAudio}=await import('/src/feedback/audio.js'),{flightFeedback}=await import('/src/feedback/model.js');
    window.sonicNativeAudio=createGameAudio();
    window.sonicNativeSettings={sound:true,sfx:true,vario:false,volume:25};
    window.sonicNativeModel=(extra={})=>flightFeedback({mode:'flight',speed:340,altitude:1500,groundClearance:1499.52,verticalSpeed:0,throttle:.5,supersonic:{mach:1},...extra},sonicNativeSettings);
    const button=document.createElement('button');button.id='sonic-native-unlock';button.textContent='音を確認';
    Object.assign(button.style,{position:'fixed',top:'4px',left:'4px',zIndex:'999'});
    button.onclick=async()=>{await sonicNativeAudio.unlock();sonicNativeAudio.start();sonicNativeAudio.configure(sonicNativeSettings);sonicNativeAudio.update(sonicNativeModel(),sonicNativeSettings);button.dataset.ready='true';};document.body.append(button);
    window.sonicNativeEvent=(serial,direction='up')=>({attemptId:1,id:serial,serial,type:'sonic-transition',direction,atSeconds:5,mach:direction==='up'?1.01:.99});
  });
  expect(await page.evaluate(()=>sonicNativeAudio.snapshot().contextState)).toBe('none');
  await page.locator('#sonic-native-unlock').click();
  await expect(page.locator('#sonic-native-unlock')).toHaveAttribute('data-ready','true');
  await expect.poll(()=>page.evaluate(()=>sonicNativeAudio.snapshot().contextState)).toBe('running');
  await page.evaluate(()=>sonicNativeAudio.sonicTransition(sonicNativeEvent(1),sonicNativeSettings));
  await page.waitForTimeout(150);
  const first=await page.evaluate(()=>({audio:sonicNativeAudio.snapshot(),model:sonicNativeModel(),event:sonicNativeEvent(1)}));
  await writeFile('.cache/v0136-sonic-audio-native-first-state.json',JSON.stringify(first,null,2));console.log(JSON.stringify({sonicFirst:first}));
  await expect.poll(()=>page.evaluate(()=>sonicNativeAudio.snapshot().sonic?.accepted)).toBe(1);
  await page.evaluate(()=>sonicNativeAudio.sonicTransition(sonicNativeEvent(1),sonicNativeSettings));
  await expect.poll(()=>page.evaluate(()=>sonicNativeAudio.snapshot().sonic?.reason)).toBe('duplicate');
  await page.evaluate(()=>sonicNativeAudio.update(sonicNativeModel({groundClearance:.1}),sonicNativeSettings));
  await expect.poll(()=>page.evaluate(()=>sonicNativeAudio.snapshot().sonic?.active)).toBe(false);
  await page.evaluate(()=>sonicNativeAudio.sonicTransition(sonicNativeEvent(2,'down'),sonicNativeSettings));
  await expect.poll(()=>page.evaluate(()=>sonicNativeAudio.snapshot().sonic?.reason)).toBe('warning');
  await page.evaluate(()=>{sonicNativeAudio.update(sonicNativeModel(),sonicNativeSettings);sonicNativeAudio.sonicTransition(sonicNativeEvent(2,'down'),sonicNativeSettings);});
  await expect.poll(()=>page.evaluate(()=>sonicNativeAudio.snapshot().sonic?.reason)).toBe('duplicate');
  await page.evaluate(()=>sonicNativeAudio.sonicTransition(sonicNativeEvent(3,'down'),sonicNativeSettings));
  await expect.poll(()=>page.evaluate(()=>sonicNativeAudio.snapshot().sonic?.accepted)).toBe(2);
  await page.evaluate(()=>sonicNativeAudio.event('collect',sonicNativeSettings));
  await expect.poll(()=>page.evaluate(()=>sonicNativeAudio.snapshot().sonic?.active)).toBe(false);
  await expect.poll(()=>page.evaluate(()=>sonicNativeAudio.snapshot().peak)).toBeGreaterThan(0);
  await page.evaluate(()=>sonicNativeAudio.stop());
  await expect.poll(()=>page.evaluate(()=>sonicNativeAudio.snapshot().contextState)).toBe('suspended');
  expect(await page.evaluate(()=>sonicNativeAudio.sonicTransition(sonicNativeEvent(4),sonicNativeSettings))).toBe(false);
  const result=await page.evaluate(()=>sonicNativeAudio.snapshot());
  await writeFile('.cache/v0136-sonic-audio-native.json',JSON.stringify({result,errors},null,2));
  await page.evaluate(()=>sonicNativeAudio.dispose());expect(errors).toEqual([]);
});

test('actual native sonic flight produces both direction signals and consumes a muted crossing without replay',async({page})=>{
  test.setTimeout(45000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'overlay'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:true,bgm:false,vibration:true}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
    window.sonicFlightVibrations=[];Object.defineProperty(navigator,'vibrate',{value:pattern=>{sonicFlightVibrations.push(pattern);return true;},configurable:true});
    window.sonicFlightContexts=[];const Audio=window.AudioContext;
    if(Audio)window.AudioContext=class extends Audio{constructor(...args){super(...args);sonicFlightContexts.push(this);}};
  });
  const audio=()=>page.locator('#feedback-diagnostics').evaluate(el=>JSON.parse(el.dataset.audio??'null'));
  const mach=()=>page.locator('#app').evaluate(el=>JSON.parse(el.dataset.supersonic??'null')?.mach??0);
  const pulses=()=>page.evaluate(()=>sonicFlightVibrations.filter(p=>Array.isArray(p)&&p.join(',')==='150,35,90').length);
  const phase=value=>expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step',value);
  const soundSettings=async()=>{const summary=page.getByText('③ 音と振動',{exact:true});if(!await summary.evaluate(el=>el.parentElement.open))await summary.click();};
  await page.goto('/?course=supersonic&camera=overlay');await phase('title');
  expect(await page.evaluate(()=>sonicFlightContexts.length)).toBe(0);expect(await pulses()).toBe(0);
  await page.locator('#start-flow-start').click();await phase('courses');await page.locator('#start-flow-course-start').click();await phase('pose');
  await page.locator('#start-flow-hold').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:12000});
  await page.locator('#throttle-input').press('End');
  await expect.poll(async()=>Boolean((await audio())?.sonic?.accepted>=1),{timeout:15000}).toBe(true);
  const up=await audio();expect(up.sonic.direction).toBe('up');expect(await pulses()).toBe(1);
  await page.locator('#throttle-input').press('Home');
  await expect.poll(async()=>(await audio())?.sonic?.accepted,{timeout:10000}).toBe(2);
  const down=await audio();expect(down.sonic.direction).toBe('down');expect(await pulses()).toBe(2);
  await page.locator('#pause-button').click();await phase('pause');await page.locator('#start-flow-pause-settings').click();await phase('settings');
  await soundSettings();
  await page.locator('#feedback-sound').uncheck();await page.locator('#feedback-vibration').uncheck();await page.locator('#start-flow-settings-close').click();await phase('pause');
  await page.locator('#start-flow-resume').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  await page.locator('#throttle-input').press('End');await expect.poll(mach,{timeout:10000}).toBeGreaterThan(1.03);
  await page.locator('#pause-button').click();await phase('pause');await page.locator('#start-flow-pause-settings').click();await phase('settings');
  await soundSettings();
  await page.locator('#feedback-sound').check();await page.locator('#feedback-vibration').check();await page.locator('#start-flow-settings-close').click();await page.locator('#start-flow-resume').click();
  await page.waitForTimeout(450);
  expect((await audio()).sonic.accepted).toBe(2);expect(await pulses()).toBe(2);
  await page.locator('#pause-button').click();await phase('pause');
  await expect.poll(async()=>(await audio())?.contextState).toBe('suspended');
  await writeFile('.cache/v0136-sonic-audio-flight-native.json',JSON.stringify({up,down,final:await audio(),vibrations:await page.evaluate(()=>sonicFlightVibrations),errors},null,2));
  expect(errors).toEqual([]);
});
