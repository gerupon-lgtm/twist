import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {APP_VERSION} from '../src/version.js';

async function boot(page,settings={}){
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(settings=>{
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'overlay'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:true,sfx:true,bgm:false,volume:25,vibration:false,...settings}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true});
    const state=window.buttonNative={contexts:[],voices:[],tones:[],paints:[],presses:[]},Audio=window.AudioContext,Node=window.AudioWorkletNode;
    document.addEventListener('pointerdown',e=>{if(e.isTrusted&&e.target.closest?.('button'))state.presses.push({at:performance.now(),id:e.target.closest('button').id});},true);
    window.AudioContext=class extends Audio{constructor(...a){super(...a);state.contexts.push(this);if(state.contexts.length===2&&settings.__previewDelay){const add=this.audioWorklet.addModule.bind(this.audioWorklet);this.audioWorklet.addModule=async(...args)=>{await new Promise(resolve=>setTimeout(resolve,settings.__previewDelay));return add(...args);};}}
      createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source);source.start=(...a)=>{const pcm=source.buffer.getChannelData(0),entry={at:performance.now(),duration:source.buffer.duration,peak:Math.max(...pcm.map(Math.abs)),context:this.state};state.voices.push(entry);source.addEventListener('ended',()=>entry.endedAt=performance.now());return start(...a);};return source;}};
    window.AudioWorkletNode=class extends Node{constructor(...a){super(...a);const post=this.port.postMessage.bind(this.port);this.port.postMessage=(m,...rest)=>{if(m.type==='countdownTone')state.tones.push({...m,at:performance.now()});return post(m,...rest);};}};
    document.addEventListener('DOMContentLoaded',()=>{let previous='';new MutationObserver(()=>{const output=document.getElementById('start-flow-countdown'),digit=output?.textContent;if(digit===previous)return;previous=digit;if(output?.getClientRects().length&&['3','2','1'].includes(digit)){const p={digit,changedAt:performance.now()};state.paints.push(p);requestAnimationFrame(()=>requestAnimationFrame(()=>p.presentedAt=performance.now()));}}).observe(document.documentElement,{subtree:true,characterData:true,childList:true});});
  },settings);
  await page.goto('/');return errors;
}
const voices=page=>page.evaluate(()=>buttonNative.voices);
test.afterEach(async({page},info)=>{if(info.status!==info.expectedStatus)console.log(await page.locator('#feedback-diagnostics').getAttribute('data-audio'));});
test('trusted touch and keyboard buttons play one soft short sound; synthetic clicks and mute remain silent',async({page})=>{
  const errors=await boot(page);expect(await page.evaluate(()=>buttonNative.contexts.length)).toBe(1);expect(await voices(page)).toEqual([]);
  await page.locator('#start-flow-title-settings').click();await expect.poll(async()=>(await voices(page)).length).toBe(1);
  await expect.poll(()=>page.evaluate(()=>buttonNative.contexts[0].state)).toBe('suspended');
  await page.locator('#start-flow-settings-close').focus();await page.keyboard.press('Enter');await expect.poll(async()=>(await voices(page)).length).toBe(2);
  await page.waitForTimeout(110);await page.locator('#start-flow-title-settings').evaluate(el=>el.click());await page.waitForTimeout(100);expect((await voices(page)).length).toBe(2);
  await page.getByText('③ 音と振動',{exact:true}).click();await page.locator('#feedback-sfx').uncheck();await page.locator('#start-flow-settings-close').click();await page.waitForTimeout(100);expect((await voices(page)).length).toBe(2);
  expect(await page.evaluate(()=>buttonNative.contexts.length)).toBe(1);
  for(const voice of await voices(page)){expect(voice.duration).toBeCloseTo(.07,3);expect(voice.peak).toBeLessThan(.091);expect(voice.context).toBe('running');}
  expect(errors).toEqual([]);
});
test('hold click ends well before 3; each native countdown request follows its displayed digit',async({page})=>{
  const errors=await boot(page);await page.locator('#start-flow-start').click();await expect.poll(async()=>(await voices(page)).length).toBe(1);await expect.poll(()=>page.evaluate(()=>buttonNative.contexts[0].state)).toBe('suspended');
  await page.locator('#start-flow-course-start').click();await expect.poll(async()=>(await voices(page)).length).toBe(2);await expect.poll(()=>page.evaluate(()=>buttonNative.contexts[0].state)).toBe('suspended');
  await page.locator('#start-flow-hold').click();await expect.poll(async()=>(await voices(page)).length).toBe(3);await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:10000});
  const evidence=await page.evaluate(()=>({voices:buttonNative.voices,paints:buttonNative.paints,tones:buttonNative.tones}));
  expect(evidence.tones.map(t=>t.cue)).toEqual([3,2,1,'go']);expect(evidence.paints.map(p=>p.digit)).toEqual(['3','2','1']);
  for(const digit of ['3','2','1']){const paint=evidence.paints.find(p=>p.digit===digit),tone=evidence.tones.find(t=>t.cue===Number(digit));expect(paint.presentedAt).toBeTruthy();expect(tone.at).toBeGreaterThanOrEqual(paint.presentedAt);}
  const hold=evidence.voices.at(-1);expect(hold.at+hold.duration*1000).toBeLessThan(evidence.tones[0].at-300);
  await page.locator('#pause-button').click();await expect.poll(()=>page.evaluate(()=>buttonNative.contexts[0].state)).toBe('suspended');
  expect(errors).toEqual([]);await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-button-countdown-native.json`,JSON.stringify({...evidence,errors},null,2));
});
for(const settings of [{sound:false},{sfx:false},{volume:0}])test(`no menu audio context when ${JSON.stringify(settings)}`,async({page})=>{
  const errors=await boot(page,settings);await page.locator('#start-flow-title-settings').click();await page.waitForTimeout(100);expect(await page.evaluate(()=>buttonNative.contexts.length)).toBe(0);expect(errors).toEqual([]);
});
test('rapid real menu presses keep each short cue and never replay a delayed click',async({page})=>{
 const errors=await boot(page);for(const id of ['start-flow-title-settings','start-flow-settings-close','start-flow-title-settings','start-flow-settings-close'])await page.locator('#'+id).click();
 await expect.poll(async()=>(await voices(page)).length).toBe(4);await page.waitForTimeout(150);
 const evidence=await page.evaluate(()=>({voices:buttonNative.voices,presses:buttonNative.presses}));expect(evidence.presses).toHaveLength(4);
 for(let i=0;i<4;i++){const voice=evidence.voices[i];expect(voice.at-evidence.presses[i].at).toBeLessThanOrEqual(i===0?300:200);expect(voice.endedAt-voice.at).toBeGreaterThan(45);}
 expect(errors).toEqual([]);await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-button-rapid-native.json`,JSON.stringify(evidence,null,2));
});
test('preview loading and disposal never delay or truncate the game button cue',async({page})=>{
 const errors=await boot(page,{__previewDelay:500});await page.locator('#start-flow-title-settings').click();await page.getByText('③ 音と振動',{exact:true}).click();await expect(page.locator('#music-preview-start')).toBeEnabled();
 await page.locator('#music-preview-start').click();await expect.poll(async()=>(await voices(page)).length).toBe(2);await page.locator('#music-preview-stop').click();await expect.poll(async()=>(await voices(page)).length).toBe(3);await page.waitForTimeout(650);
 const evidence=await page.evaluate(()=>({voices:buttonNative.voices,presses:buttonNative.presses}));expect(evidence.voices).toHaveLength(3);
 for(let i=1;i<3;i++){expect(evidence.voices[i].at-evidence.presses[i].at).toBeLessThan(100);expect(evidence.voices[i].endedAt-evidence.voices[i].at).toBeGreaterThan(45);}
 expect(errors).toEqual([]);await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-button-preview-native.json`,JSON.stringify(evidence,null,2));
});
