import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {APP_VERSION} from '../src/version.js';
for(const engine of ['scc','fm'])test(`first ${engine} BGM reaches the native bus after GO without awaiting unrelated MIDI`,async({page})=>{
 test.setTimeout(30000);const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(engine=>{
  localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'overlay'}));
  localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
  localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:true,sfx:true,bgm:true,vibration:false,musicEngine:engine,musicSet:'ignition',volume:25,bgmVolume:50}));
  Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value:undefined});
  const Native=window.AudioWorkletNode;window.musicStartProbe={messages:[],requests:[],stalled:[]};
  // Delay the fetch result before a real service worker sees it; all other
  // requests and actual audio processing pass through unchanged.
  let release;const blocked=new Promise(resolve=>{release=resolve;}),fetchNative=window.fetch.bind(window);window.releaseMusicDownloads=release;
  window.fetch=async(...args)=>{const url=String(args[0]?.url??args[0]),file=new URL(url,location.href).pathname.split('/').pop();
    if(file.endsWith('.mid'))musicStartProbe.requests.push({file,wall:performance.now()});
    if(['flight.mid','afterburner.mid'].includes(file)){musicStartProbe.stalled.push(file);await blocked;}
    return fetchNative(...args);};
  window.AudioWorkletNode=class extends Native{constructor(context,...args){super(context,...args);const send=this.port.postMessage.bind(this.port);this.port.postMessage=(message,...rest)=>{if(message.type==='musicReg'&&message.writes?.length)window.musicStartProbe.messages.push({wall:performance.now(),audioTime:context.currentTime,writes:message.writes.length});return send(message,...rest);};}};
 },engine);
 const music=()=>page.locator('#feedback-diagnostics').getAttribute('data-music').then(s=>JSON.parse(s??'{}'));
 const audio=()=>page.locator('#feedback-diagnostics').getAttribute('data-audio').then(s=>JSON.parse(s??'{}'));
 const report={version:APP_VERSION,engine,scope:'Native desktop bus scheduling under an intentionally stalled unrelated download; physical listening remains unconfirmed'};
 try{
  await page.goto('/?music=ignition');await page.locator('#start-flow-start').click();await page.locator('#start-flow-course-start').click();await page.locator('#start-flow-hold').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:10000});report.launchWall=await page.evaluate(()=>performance.now());
  await expect.poll(async()=>(await music()).playing,{timeout:3500,intervals:[50,100]}).toBe(true);
  // The diagnostic is published once per second, after the actual bus message.
  // Startup latency below is still measured from the native message timestamp.
  await expect.poll(async()=>(await audio()).musicActive,{timeout:2500}).toBe(true);
  report.music=await music();report.audio=await audio();report.probe=await page.evaluate(()=>musicStartProbe);
  expect(report.probe.stalled).toContain('afterburner.mid');expect(report.probe.stalled).not.toContain('flight.mid');
  expect([...new Set(report.probe.requests.map(r=>r.file))].sort()).toEqual(['afterburner.mid','clear.mid','ignition.mid']);
  const go=report.audio.countdown.acknowledged.history.findLast(e=>e.cue==='go');expect(go).toBeTruthy();expect(report.probe.messages.length).toBeGreaterThan(0);
  report.afterGoSeconds=report.probe.messages[0].audioTime-go.at;expect(report.afterGoSeconds).toBeGreaterThanOrEqual(1.48);expect(report.afterGoSeconds).toBeLessThan(2.1);
  expect(report.music.trackId).toBe('ignition');expect(errors).toEqual([]);report.ok=true;
 }finally{report.finalMusic=await music().catch(()=>null);report.finalAudio=await audio().catch(()=>null);report.finalProbe=await page.evaluate(()=>musicStartProbe).catch(()=>null);await page.evaluate(()=>releaseMusicDownloads()).catch(()=>{});await mkdir('.cache',{recursive:true});await writeFile('.cache/v'+APP_VERSION.replaceAll('.','')+'-music-start-native-'+engine+'.json',JSON.stringify({...report,errors},null,2));}
});
