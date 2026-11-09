import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createMusicPlayer} from '../src/music/player.js';
const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
const midi=new Map(await Promise.all(config.catalog.preview.map(async id=>[config[id].file,new Uint8Array(await readFile(new URL('../public/music/'+config[id].file,import.meta.url)))])));
const flush=async()=>{for(let i=0;i<160;i++)await Promise.resolve();};
test('an unrequested song stays unknown and cannot delay a fresh third-leg selection',async t=>{
  const requests=[],clock={now:()=>0,setScheduleTime(){},write(){},event(){}};
  const audio={musicClock:clock,stopMusic(){},setMusicGain(){},configure(){},suspendIfIdle(){},waitForReady:async()=>true,resume:async()=>{}};
  const fetchFile=async url=>{const file=new URL(url).pathname.split('/').pop();requests.push(file);if(file==='tracks.json')return {ok:true,json:async()=>config};return {ok:file!=='advance.mid',arrayBuffer:async()=>midi.get(file).slice().buffer};};
  const player=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});t.after(()=>player.stop());
  player.setSettings({sound:true,bgm:true,sfx:true,musicSet:'proposals',musicEngine:'scc'});player.setFlightNumber(3);
  assert.equal(await player.play('flight'),'played');assert.equal(player.snapshot().trackId,'overdrive');assert.ok(!requests.includes('advance.mid'));
  assert.deepEqual(player.snapshot().flightTracks,['Ignition Sky','Steel Advance','Overdrive Horizon']);
});
test('a lazily discovered missing second song preserves the filtered playlist leg order',async t=>{
  const requests=[],clock={now:()=>0,setScheduleTime(){},write(){},event(){}};
  const audio={musicClock:clock,stopMusic(){},setMusicGain(){},configure(){},suspendIfIdle(){},waitForReady:async()=>true,resume:async()=>{}};
  const fetchFile=async url=>{const file=new URL(url).pathname.split('/').pop();requests.push(file);if(file==='tracks.json')return {ok:true,json:async()=>config};return {ok:file!=='advance.mid',arrayBuffer:async()=>midi.get(file).slice().buffer};};
  const player=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});t.after(()=>player.stop());
  player.setSettings({sound:true,bgm:true,sfx:true,musicSet:'proposals',musicEngine:'scc'});
  assert.equal(await player.play('flight'),'played');assert.equal(player.snapshot().trackId,'ignition');assert.ok(!requests.includes('advance.mid'));
  player.stop();player.setFlightNumber(2);assert.equal(await player.play('flight'),'played');assert.equal(player.snapshot().trackId,'overdrive');
  assert.deepEqual(player.snapshot().flightTracks,['Ignition Sky','Overdrive Horizon']);assert.equal(requests.filter(file=>file==='advance.mid').length,1);
  player.stop();assert.equal(await player.play('flight'),'played');assert.equal(player.snapshot().trackId,'overdrive');
  player.stop();player.setFlightNumber(3);assert.equal(await player.play('flight'),'played');assert.equal(player.snapshot().trackId,'ignition');
});
test('first SCC flight does not wait for an unrelated MIDI stalled during warmup',async t=>{
  let release;const blocked=new Promise(resolve=>{release=resolve;}),requests=[],writes=[];
  const clock={now:()=>0,setScheduleTime(){},write:(...args)=>writes.push(args),event(){}};
  const audio={musicClock:clock,stopMusic(){},setMusicGain(){},configure(){},suspendIfIdle(){},waitForReady:async()=>true,resume:async()=>{}};
  const fetchFile=async url=>{
    const file=new URL(url).pathname.split('/').pop();requests.push(file);
    if(file==='tracks.json')return {ok:true,json:async()=>config};
    if(file==='flight.mid')await blocked;
    return {ok:true,arrayBuffer:async()=>midi.get(file).slice().buffer};
  };
  const player=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});
  t.after(()=>{release();player.stop();});
  player.setSettings({sound:true,bgm:true,sfx:true,musicSet:'ignition',musicEngine:'scc',bgmVolume:50});
  void player.preload();await flush();let result=null;void player.play('flight').then(value=>{result=value;});await flush();
  assert.equal(result,'played','selected BGM must begin while unrelated MIDI is still blocked');
  assert.equal(player.snapshot().trackId,'ignition');assert.ok(writes.length>0);assert.equal(requests.filter(file=>file==='ignition.mid').length,1);
});
test('late AB data attaches to the running song and is ignored after a stop',async t=>{
  for(const cancel of [false,true]){
    let release,now=0;const blocked=new Promise(resolve=>{release=resolve;}),layers=[];
    const clock={now:()=>now,setScheduleTime(){},write(){},event(){}};
    const audio={musicClock:clock,stopMusic(){},setMusicGain(){},configure(){},suspendIfIdle(){},waitForReady:async()=>true,resume:async()=>{},createMusicLayerClock:()=>({...clock,write:(...args)=>layers.push(args)}),cancelMusicLayer(){}};
    const fetchFile=async url=>{const file=new URL(url).pathname.split('/').pop();if(file==='tracks.json')return {ok:true,json:async()=>config};if(file==='afterburner.mid')await blocked;return {ok:true,arrayBuffer:async()=>midi.get(file).slice().buffer};};
    const player=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});t.after(()=>{release();player.stop();});player.setSettings({sound:true,bgm:true,sfx:true,abMusic:true,musicSet:'ignition'});
    void player.warmup();assert.equal(await player.play('flight'),'played');const before=player.snapshot();now=.2;player.setAfterburner(true);assert.equal(player.snapshot().afterburnerMusic.available,false);
    if(cancel)player.stop();release();await flush();
    if(cancel){assert.equal(player.snapshot().afterburnerMusic.available,false);assert.equal(layers.length,0);assert.equal(player.snapshot().playing,false);}
    else{const ready=player.snapshot();assert.equal(ready.afterburnerMusic.available,true);assert.equal(ready.afterburnerMusic.requested,true);assert.equal(ready.trackId,before.trackId);assert.deepEqual(ready.playedTracks,before.playedTracks);now=ready.afterburnerMusic.startAt+.02;player.setAfterburner(true);assert.equal(player.snapshot().afterburnerMusic.active,true);assert.ok(layers.length>0);}
  }
});
test('warmup fetches only the needed songs, shares its selected request, and retry uses the cached score',async t=>{
  const requests=[],clock={now:()=>0,setScheduleTime(){},write(){},event(){}};
  const audio={musicClock:clock,stopMusic(){},setMusicGain(){},configure(){},suspendIfIdle(){},waitForReady:async()=>true,resume:async()=>{}};
  const fetchFile=async url=>{const file=new URL(url).pathname.split('/').pop();requests.push(file);return file==='tracks.json'?{ok:true,json:async()=>config}:{ok:true,arrayBuffer:async()=>midi.get(file).slice().buffer};};
  const player=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});t.after(()=>player.stop());player.setSettings({sound:true,bgm:true,sfx:true,abMusic:true,musicSet:'ignition',clearTrackId:'clear-overdrive'});
  await Promise.all([player.warmup(),player.play('flight')]);assert.deepEqual(requests.filter(file=>file.endsWith('.mid')).sort(),['afterburner.mid','clear-overdrive.mid','ignition.mid']);
  player.stop();assert.equal(await player.play('flight'),'played');assert.equal(requests.filter(file=>file==='ignition.mid').length,1);
});
