import {test,expect} from './helpers/legacy-ui.js';
import {readFile} from 'node:fs/promises';
import {APP_VERSION} from '../src/version.js';
const tracks=JSON.parse(await readFile('public/music/tracks.json','utf8'));
const poll={timeout:10000,intervals:[25,50,100,200]};
const state=(page,name)=>page.locator('#app').getAttribute('data-'+name).then(JSON.parse);
const preview=page=>page.locator('.music-preview-controls').getAttribute('data-music').then(value=>JSON.parse(value||'{}'));
const previewAudio=page=>page.locator('.music-preview-controls').getAttribute('data-audio').then(value=>JSON.parse(value||'{}'));
const main=page=>page.locator('#feedback-diagnostics').getAttribute('data-music').then(value=>JSON.parse(value||'{}'));
const audio=page=>page.locator('#feedback-diagnostics').getAttribute('data-audio').then(value=>JSON.parse(value||'{}'));
async function prepare(page){
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    const Native=window.AudioContext||window.webkitAudioContext,probe=window.__previewNative={contexts:[],maxRunning:0,vibrations:[],messages:[],schedules:[]};
    if(Native){const key=window.AudioContext?'AudioContext':'webkitAudioContext';window[key]=class extends Native{constructor(...args){super(...args);probe.contexts.push(this);const count=()=>{probe.maxRunning=Math.max(probe.maxRunning,probe.contexts.filter(c=>c.state==='running').length);};this.addEventListener('statechange',count);count();}};}
    const Worklet=window.AudioWorkletNode;if(Worklet)window.AudioWorkletNode=class extends Worklet{constructor(context,...args){super(context,...args);const send=this.port.postMessage.bind(this.port);this.port.postMessage=(message,...rest)=>{const index=probe.contexts.indexOf(context);if(['settings','musicGain'].includes(message.type))probe.messages.push({context:index,...message});if(message.type==='musicReg')probe.schedules.push({context:index,count:message.writes?.length??0});return send(message,...rest);};}};
    Object.defineProperty(navigator,'vibrate',{configurable:true,value:pattern=>{probe.vibrations.push(pattern);return true;}});
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:true,bgm:false,sfx:true,vario:false,vibration:true,bgmVolume:35}));
  });
  await page.goto('/?mode=flight&course=legacy&camera=cockpit');expect(await page.evaluate(()=>window.__previewNative.contexts.length)).toBe(0);
  await page.locator('#practice-button').click();await expect.poll(async()=>(await audio(page)).workletReady,poll).toBe(true);
  await page.locator('#pause-button').click();await expect.poll(async()=>(await audio(page)).contextState,poll).toBe('suspended');
  await page.locator('#flight-adjustments > summary').click();await expect(page.locator('#music-preview-track option')).toHaveCount(16);return errors;
}
async function play(page){await page.locator('#music-preview-start').click();await expect.poll(async()=>(await preview(page)).playing,poll).toBe(true);await expect.poll(async()=>(await previewAudio(page)).musicActive,poll).toBe(true);}
async function openSettings(page){if(!await page.locator('#flight-adjustments').evaluate(el=>el.open))await page.locator('#flight-adjustments > summary').click();}
async function stopped(page){await expect.poll(async()=>page.evaluate(()=>window.__previewNative.contexts.slice(1).every(c=>c.state==='closed')),poll).toBe(true);await expect.poll(async()=>(await preview(page)).playing,poll).toBe(false);}

test('explicit native BGM preview leaves flight, saved BGM-off, timing and played history stopped; selection and lifecycle cancel cleanly',async({page})=>{
  test.setTimeout(45000);const errors=await prepare(page);
  const saved=await page.evaluate(()=>localStorage.getItem('twist.feedback-settings.v1'));
  await page.locator('#music-preview-track').selectOption('ignition');
  expect(await page.evaluate(()=>localStorage.getItem('twist.feedback-settings.v1'))).toBe(saved);
  const position=await state(page,'position'),session=await state(page,'session'),segments=await state(page,'segments'),before=await main(page),vibrations=await page.evaluate(()=>window.__previewNative.vibrations.length);
  expect(await page.evaluate(()=>window.__previewNative.contexts.length)).toBe(1);expect((await preview(page)).playing).toBe(false);
  await play(page);expect((await preview(page)).track).toBe(tracks.ignition.title);expect((await previewAudio(page)).peak).toBeGreaterThan(0);
  expect(await page.evaluate(()=>window.__previewNative.messages.some(m=>m.context===1&&m.type==='musicGain'&&m.gain===.35))).toBe(true);
  expect(await page.evaluate(()=>window.__previewNative.messages.some(m=>m.context===1&&m.type==='settings'&&m.settings.bgm===true&&m.settings.sfx===false))).toBe(true);
  await expect(page.locator('#feedback-bgm')).not.toBeChecked();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('twist.feedback-settings.v1')).bgm)).toBe(false);
  expect((await audio(page)).contextState).toBe('suspended');await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');expect(await state(page,'position')).toEqual(position);expect(await state(page,'session')).toEqual(session);expect(await state(page,'segments')).toEqual(segments);expect(await page.evaluate(()=>window.__previewNative.vibrations.length)).toBe(vibrations);
  const after=await main(page);expect(after.playedTracks).toEqual(before.playedTracks);expect(after.flightNumber).toBe(before.flightNumber);expect(after.current).toBeNull();
  await page.locator('#music-preview-track').selectOption('advance');await expect.poll(async()=>(await preview(page)).track,poll).toBe(tracks.advance.title);expect(await page.evaluate(()=>window.__previewNative.contexts.length)).toBe(2);
  for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}]){
    await page.setViewportSize(size);await page.locator('.music-preview-controls').scrollIntoViewIfNeeded();const box=await page.locator('.music-preview-controls').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(size.width+.5);await page.screenshot({path:`test-results/v${APP_VERSION.replaceAll('.','')}-music-preview-${size.width}x${size.height}.png`});
  }
  await page.locator('#music-preview-stop').click();await stopped(page);
  await play(page);await page.locator('#flight-adjustments > summary').click();await stopped(page);
  await openSettings(page);await play(page);await page.locator('#course-select').selectOption('easy');await stopped(page);await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
  await openSettings(page);await play(page);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await stopped(page);
  await play(page);await page.locator('#start-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await expect.poll(async()=>page.evaluate(()=>window.__previewNative.contexts.slice(1).every(c=>c.state==='closed')),poll).toBe(true);expect((await main(page)).playedTracks).toEqual(before.playedTracks);expect(await page.evaluate(()=>window.__previewNative.maxRunning)).toBeLessThanOrEqual(1);expect(errors).toEqual([]);
});

test('pending song changes and rapid stop/play never restart a closed preview or leak a running native context',async({page})=>{
  test.setTimeout(35000);const errors=await prepare(page);let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/music/*.mid*',async route=>{await gate;await route.continue();});
  await page.locator('#music-preview-start').click();await expect.poll(async()=>page.evaluate(()=>window.__previewNative.contexts.length),poll).toBe(2);
  await page.locator('#music-preview-track').selectOption('ignition');await page.locator('#music-preview-track').selectOption('overdrive');await page.locator('#flight-adjustments > summary').click();
  release();await stopped(page);await page.waitForTimeout(500);expect(await page.evaluate(()=>window.__previewNative.contexts.length)).toBe(2);expect((await main(page)).playedTracks).toEqual([]);
  await page.locator('#flight-adjustments > summary').click();
  await page.locator('#music-preview-start').click();await page.locator('#music-preview-stop').click();await page.locator('#music-preview-start').click();await expect.poll(async()=>(await preview(page)).playing,poll).toBe(true);expect((await preview(page)).track).toBe(tracks.overdrive.title);
  await page.locator('#music-preview-stop').click();await stopped(page);expect(await page.evaluate(()=>window.__previewNative.maxRunning)).toBeLessThanOrEqual(1);expect(await page.evaluate(()=>window.__previewNative.contexts.filter(c=>c.state!=='closed').length)).toBe(1);
  await page.locator('#feedback-sound').uncheck();await expect(page.locator('#music-preview-start')).toBeDisabled();await expect(page.locator('#music-preview-status')).toContainText('「音」をオン');expect(errors).toEqual([]);
});

test('all sixteen individual previews keep their roles; one-shots finish and suspend without changing game records or replaying on selection',async({page})=>{
  test.setTimeout(120000);const errors=await prepare(page),select=page.locator('#music-preview-track');
  const options=await select.locator('option').evaluateAll(elements=>elements.map(element=>({id:element.value,label:element.textContent})));
  expect(options.map(option=>option.id)).toEqual(tracks.catalog.preview);expect(new Set(options.map(option=>option.id)).size).toBe(16);
  for(const id of ['flight','flight2','brave'])expect(options.find(option=>option.id===id).label).toContain('試聴専用');
  for(const id of tracks.catalog.clear)expect(options.find(option=>option.id===id).label).toContain('クリア');
  expect(options.find(option=>option.id===tracks.catalog.afterburner).label).toContain('AB');expect(options.find(option=>option.id===tracks.catalog.comparison).label).toContain('比較');
  const before={position:await state(page,'position'),session:await state(page,'session'),segments:await state(page,'segments'),music:await main(page)},saved=await page.evaluate(()=>localStorage.getItem('twist.feedback-settings.v1'));
  for(const id of [...tracks.catalog.clear,tracks.catalog.afterburner,tracks.catalog.comparison]){
    await select.selectOption(id);expect((await preview(page)).playing).toBe(false);await play(page);
    expect((await preview(page)).trackId).toBe(id);expect((await preview(page)).afterburnerMusic.active).toBe(false);
    await expect.poll(async()=>(await preview(page)).playing,{...poll,timeout:id===tracks.catalog.comparison?55000:12000}).toBe(false);
    await expect.poll(async()=>(await previewAudio(page)).contextState,poll).toBe('suspended');
    await expect(page.locator('#music-preview-status')).toContainText('試聴が終わりました');await expect(page.locator('#music-preview-stop')).toBeDisabled();
    const scheduled=await page.evaluate(()=>window.__previewNative.schedules.length);await page.waitForTimeout(300);
    expect((await preview(page)).playing).toBe(false);expect((await previewAudio(page)).contextState).toBe('suspended');expect(await page.evaluate(()=>window.__previewNative.schedules.length)).toBe(scheduled);
    expect(await state(page,'position')).toEqual(before.position);expect(await state(page,'session')).toEqual(before.session);expect(await state(page,'segments')).toEqual(before.segments);expect((await main(page)).playedTracks).toEqual(before.music.playedTracks);expect((await main(page)).flightNumber).toBe(before.music.flightNumber);
    expect(await page.evaluate(()=>localStorage.getItem('twist.feedback-settings.v1'))).toBe(saved);
  }
  await select.selectOption('flight');await page.locator('#feedback-musicEngine').selectOption('fm');await page.waitForTimeout(300);expect((await preview(page)).playing).toBe(false);expect((await previewAudio(page)).contextState).toBe('suspended');
  await play(page);expect((await preview(page)).trackId).toBe('flight');expect((await preview(page)).synth?.requestedEngine).toBe('fm');await page.locator('#feedback-musicEngine').selectOption('scc');await expect.poll(async()=>(await preview(page)).synth?.requestedEngine,poll).toBe('scc');expect((await preview(page)).synth?.effectiveEngine).toBe('scc');expect((await preview(page)).trackId).toBe('flight');
  await page.locator('#flight-adjustments > summary').click();await stopped(page);expect(await page.evaluate(()=>window.__previewNative.maxRunning)).toBeLessThanOrEqual(1);expect(errors).toEqual([]);
});
