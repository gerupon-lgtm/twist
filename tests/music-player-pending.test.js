import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createMusicPlayer} from '../src/music/player.js';

const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
const defer=()=>{let resolve;const promise=new Promise(done=>resolve=done);return {promise,resolve};};
const initial={sound:true,bgm:true,sfx:true,musicSet:'rock',clearTrackId:'clear',musicEngine:'fm',bgmVolume:50};
function setup(stage){
 const blocked=defer(),release=defer(),events=[],writes=[];let now=0;
 const wait=async at=>{if(stage===at){blocked.resolve();await release.promise;}};
 const clock={now:()=>now,setScheduleTime(){},write:(...args)=>writes.push(args),event:e=>events.push(e)};
 const audio={musicClock:clock,createMusicClock:()=>clock,stopMusic(){},setMusicGain(){},configure(){},suspendIfIdle(){},waitForReady:async()=>{await wait('ready');return true;},resume:async()=>wait('resume')};
 const fetchFile=async url=>String(url).includes('tracks.json')?{ok:true,json:async()=>{await wait('preload');return config;}}:{ok:true,arrayBuffer:async()=>readFile(new URL('../public/music/'+new URL(url).pathname.split('/').pop(),import.meta.url))};
 const player=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});player.setSettings(initial);
 return {player,blocked,release,events,writes,advance:t=>now=t};
}
for(const stage of ['preload','ready','resume'])for(const [id,change,name] of [
 ['flight',{bgm:false},'BGM permission revoked'],['flight',{musicSet:'advance'},'flight selection changed'],
 ['clear',{sfx:false},'SFX permission revoked'],['clear',{clearTrackId:'clear-overdrive'},'clear selection changed'],
 ['preview',{bgm:false},'preview permission revoked'],
])test(`pending ${stage} ${id}: ${name} cancels before scheduling`,async t=>{
 const f=setup(stage);t.after(()=>f.player.stop());
 const start=id==='preview'?f.player.playTrack('rock',{purpose:'preview'}):f.player.play(id);
 await f.blocked.promise;f.player.setSettings({...initial,...change});f.release.resolve();
 assert.equal(await start,'cancelled');assert.equal(f.player.snapshot().playing,false);assert.equal(f.events.length+f.writes.length,0);
});
for(const stage of ['preload','ready','resume'])test(`pending ${stage}: unrelated volume change preserves the request`,async t=>{
 const f=setup(stage);t.after(()=>f.player.stop());const start=f.player.play('flight');
 await f.blocked.promise;f.player.setSettings({...initial,bgmVolume:35});f.release.resolve();
 assert.equal(await start,'played');assert.equal(f.player.snapshot().trackId,'rock');assert.equal(f.player.snapshot().playing,true);
});
for(const stage of ['preload','ready','resume'])for(const [id,change,trackId] of [
 ['flight',{sfx:false,clearTrackId:'clear-overdrive'},'rock'],['clear',{bgm:false,musicSet:'advance'},'clear'],
 ['preview',{musicSet:'advance',clearTrackId:'clear-overdrive'},'rock'],
])test(`pending ${stage} ${id}: unrelated purpose settings preserve the request`,async t=>{
 const f=setup(stage);t.after(()=>f.player.stop());const start=id==='preview'?f.player.playTrack('rock',{purpose:'preview'}):f.player.play(id);
 await f.blocked.promise;f.player.setSettings({...initial,...change});f.release.resolve();
 assert.equal(await start,'played');assert.equal(f.player.snapshot().trackId,trackId);
});
test('an older cancelled finally cannot erase a newer pending request',async t=>{
 const f=setup(null);t.after(()=>f.player.stop());await f.player.preload();
 // A fresh player shares the real catalog/MIDI fetcher; readiness has independent request gates.
 const gates=[defer(),defer()],reached=[defer(),defer()];let calls=0;const writes=[];
 const clock={now:()=>0,setScheduleTime(){},write:(...w)=>writes.push(w),event:e=>writes.push(e)};
 const audio={musicClock:clock,stopMusic(){},setMusicGain(){},configure(){},suspendIfIdle(){},resume:async()=>{},waitForReady:async()=>{const i=calls++;reached[i].resolve();await gates[i].promise;return true;}};
 const fetchFile=async url=>String(url).includes('tracks.json')?{ok:true,json:async()=>config}:{ok:true,arrayBuffer:async()=>readFile(new URL('../public/music/'+new URL(url).pathname.split('/').pop(),import.meta.url))};
 const player=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});t.after(()=>player.stop());player.setSettings(initial);await player.preload();
 const a=player.play('flight');await reached[0].promise;player.setSettings({...initial,bgm:false});player.setSettings(initial);
 const b=player.play('flight');await reached[1].promise;gates[0].resolve();assert.equal(await a,'cancelled');
 player.setSettings({...initial,bgm:false});gates[1].resolve();assert.equal(await b,'cancelled');assert.equal(writes.length,0);assert.equal(player.snapshot().playing,false);
});
