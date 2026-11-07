import { test,expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const trackConfig=JSON.parse(await readFile('public/music/tracks.json','utf8'));
const music=p=>p.locator('#feedback-diagnostics').getAttribute('data-music').then(s=>JSON.parse(s||'{}'));
const audio=p=>p.locator('#feedback-diagnostics').getAttribute('data-audio').then(s=>JSON.parse(s||'{}'));
const slider=(p,id,value)=>p.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
test('MIDI BGM starts only after a gesture, remains audible with effects off, and stops on pause',async({page})=>{
 await page.goto('/?mode=flight');expect((await music(page)).playing).toBe(false);
 await page.locator('#practice-button').click();await expect.poll(async()=>(await music(page)).playing).toBe(true);
 expect((await music(page)).track).toBe(trackConfig.flight.title);
 await page.locator('#pause-button').click();await expect.poll(async()=>(await music(page)).playing).toBe(false);
 await page.locator('#flight-adjustments > summary').click();await page.locator('#feedback-sfx').uncheck();await page.locator('#start-button').click();
 await expect.poll(async()=>(await audio(page)).musicActive,{timeout:8000}).toBe(true);await expect.poll(async()=>(await audio(page)).peak).toBeGreaterThan(0);
 await page.locator('.feedback-metrics summary').click();await page.screenshot({path:'test-results/v0118-music-metrics.png'});
});
test('BGM switch and separate volume persist and are copied along with played titles',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text;}},configurable:true}));
 await page.goto('/?mode=flight');await page.locator('#practice-button').click();await expect.poll(async()=>(await music(page)).playing).toBe(true);
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await page.locator('#feedback-bgm').uncheck();await slider(page,'feedback-bgmVolume',35);await page.locator('#settings-copy').click();
 const report=await page.evaluate(()=>JSON.parse(window.copied));expect(report.feedback.settings).toMatchObject({bgm:false,bgmVolume:35});expect(report.feedback.music.playedTracks).toContain(trackConfig.flight.title);
 await page.reload();await page.locator('#practice-button').click();await expect.poll(async()=>(await audio(page)).workletReady).toBe(true);expect((await music(page)).playing).toBe(false);
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await expect(page.locator('#feedback-bgmVolume')).toHaveValue('35');await expect(page.locator('#feedback-bgm')).not.toBeChecked();
});
test('missing music configuration leaves effects and game controls usable',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/music/tracks.json*',r=>r.fulfill({status:404,body:'missing'}));
 await page.goto('/?mode=flight');await page.locator('#practice-button').click();await expect.poll(async()=>(await music(page)).status).toBe('unavailable');
 await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await expect.poll(async()=>(await audio(page)).peak,{timeout:8000}).toBeGreaterThan(0);expect(errors).toEqual([]);
});
test('replacing the MIDI and its loop config plays a short alternate track through a loop',async({page})=>{
 const config=JSON.parse(await readFile('public/music/tracks.json','utf8')),bytes=await readFile('tests/fixtures/alternate.mid');
 config.flight={...config.flight,title:'差し替え確認',file:'alternate.mid',loop:{start:.4,end:1.8}};
 await page.route('**/music/tracks.json*',r=>r.fulfill({json:config}));await page.route('**/music/alternate.mid*',r=>r.fulfill({body:bytes,contentType:'audio/midi'}));
 await page.goto('/?mode=flight');await page.locator('#practice-button').click();await expect.poll(async()=>(await music(page)).track).toBe('差し替え確認');
 await expect.poll(async()=>(await music(page)).loopCount,{timeout:8000}).toBeGreaterThanOrEqual(1);expect((await music(page)).playing).toBe(true);
 await page.screenshot({path:'test-results/v0118-alternate-midi.png'});
});

test('late AudioContext resume cannot race past cached MIDI preparation',async({page})=>{
 await page.addInitScript(()=>{
  const resume=AudioContext.prototype.resume;
  AudioContext.prototype.resume=function(){return new Promise((resolve,reject)=>setTimeout(()=>resume.call(this).then(resolve,reject),800));};
 });
 await page.goto('/?mode=flight');await page.locator('#practice-button').click();
 await expect.poll(async()=>(await music(page)).playing,{timeout:10000}).toBe(true);
 await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
});

test('effects still start with BGM off when the first game frame is late',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({bgm:false}));
  const raf=requestAnimationFrame.bind(window);let first=true;
  window.requestAnimationFrame=callback=>{if(first){first=false;return setTimeout(()=>raf(callback),500);}return raf(callback);};
 });
 await page.goto('/?mode=flight');await page.locator('#practice-button').click();
 await expect.poll(async()=>(await audio(page)).peak,{timeout:8000}).toBeGreaterThan(0);
 expect((await music(page)).playing).toBe(false);expect((await audio(page)).contextState).toBe('running');
});
