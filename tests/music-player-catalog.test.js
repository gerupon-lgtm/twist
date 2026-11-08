import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {createMusicPlayer} from '../src/music/player.js';
const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
function setup(data=config){
 const requests=[],events=[],writes=[],calls={resume:0,ready:0,stops:0,idleSuspends:0};let now=0;
 const clock={now:()=>now,setScheduleTime(){},write:(...w)=>writes.push(w),event:e=>events.push(e)};
 const audio={musicClock:clock,createMusicClock:()=>clock,stopMusic(){calls.stops++;},setMusicGain(){},configure(){},waitForReady:async()=>{calls.ready++;return true;},resume:async()=>{calls.resume++;},suspendIfIdle(){calls.idleSuspends++;}};
 const fetchFile=async url=>{requests.push(String(url));return String(url).includes('tracks.json')?{ok:true,json:async()=>data}:{ok:true,arrayBuffer:async()=>readFile(new URL('../public/music/'+new URL(url).pathname.split('/').pop(),import.meta.url))};};
 const player=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});
 return {player,requests,events,writes,calls,advance:t=>{now=t;}};
}
test('catalog loading is metadata-only and strict roles never promote preview tracks into flight',async t=>{
 const f=setup();t.after(()=>f.player.stop());const c=await f.player.loadCatalog();
 assert.equal(c.previewIds.length,16);assert.equal(c.flightIds.length,7);assert.equal(f.requests.length,1);assert.equal(f.calls.ready+f.calls.resume,0);assert.equal(f.writes.length,0);
 f.player.setSettings({sound:true,bgm:true,sfx:true,musicSet:'flight2'});assert.equal(await f.player.play('flight'),'played');
 const s=f.player.snapshot();assert.ok(c.flightIds.includes(s.trackId));assert.equal(s.requestedMusicSet,'flight2');assert.equal(s.fallbackReason,'preview-only');assert.equal(s.flightTracks.length,7);
});
test('all sixteen exact previews use BGM permission without flight history or AB attachment',async t=>{
 const f=setup();t.after(()=>f.player.stop());f.player.setSettings({sound:true,bgm:true,sfx:false,musicEngine:'fm'});
 for(const id of config.catalog.preview){assert.equal(await f.player.playTrack(id,{purpose:'preview'}),'played',id);const s=f.player.snapshot();assert.equal(s.trackId,id);assert.equal(s.current,'preview');assert.equal(s.flightNumber,1);assert.deepEqual(s.playedTracks,[]);assert.equal(s.afterburnerMusic.available,false);f.player.stop();}
 assert.ok(f.events.some(e=>e.event.type==='noteOn'));assert.equal(await f.player.playTrack('missing',{purpose:'preview'}),'unavailable');
 assert.equal(await f.player.playTrack('rock',{purpose:'flight'}),'cancelled');
});
test('clear selection and FM engine reach the real facade while SCC remains an explicit engine',async t=>{
 const f=setup();t.after(()=>f.player.stop());f.player.setSettings({sound:true,bgm:false,sfx:true,clearTrackId:'clear-overdrive',musicEngine:'fm'});
 assert.equal(await f.player.play('clear'),'played');assert.equal(f.player.snapshot().trackId,'clear-overdrive');assert.equal(f.player.snapshot().synth.effectiveEngine,'fm');assert.ok(f.events.some(e=>e.event.type==='configure'));
 f.player.setSettings({sound:true,bgm:true,sfx:true,musicSet:'rock',musicEngine:'scc'});assert.equal(f.player.snapshot().playing,false);assert.equal(await f.player.play('flight'),'played');assert.equal(f.player.snapshot().synth.effectiveEngine,'scc');
});
test('malformed authored catalogs cannot silently fall back to old game selection',async t=>{
 const f=setup({...config,catalog:null});t.after(()=>f.player.stop());assert.equal(await f.player.loadCatalog(),null);
 f.player.setSettings({sound:true,bgm:true,sfx:true});assert.equal(await f.player.play('flight'),'unavailable');assert.equal(f.calls.resume,0);assert.equal(f.writes.length,0);
});
test('clear, AB and comparison previews finish once, stop the bus and suspend an idle output',async t=>{
 const f=setup();t.after(()=>f.player.stop());f.player.setSettings({sound:true,bgm:true,sfx:false,musicEngine:'fm'});
 for(const id of ['clear-ignition','afterburner','comparison']){f.advance(0);assert.equal(await f.player.playTrack(id,{purpose:'preview'}),'played');const stopped=f.calls.stops;f.advance(100);
  await new Promise(resolve=>setTimeout(resolve,40));assert.equal(f.player.snapshot().playing,false,id);assert.equal(f.player.snapshot().current,null);assert.ok(f.calls.stops>stopped);assert.deepEqual(f.player.snapshot().playedTracks,[]);
 }
 assert.equal(f.calls.idleSuspends,3);
});
