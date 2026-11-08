import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createAfterburnerLayer} from '../src/music/ab-layer.js';
import {createMusicPlayer} from '../src/music/player.js';
import {DRUM_ADDR} from '../src/vendor/scc/engine/psg-drums.js';

function fakeAudio(){
  let time=0;const writes=[],cancelled=[],clock={now:()=>time,setScheduleTime(){},write(){}};
  return {writes,cancelled,musicClock:clock,setTime:value=>{time=value;},stopMusic(){},setMusicGain(){},configure(){},waitForReady:async()=>true,resume:async()=>{},
    createMusicLayerClock(tag){let at=null;return {now:clock.now,setScheduleTime:value=>{at=value;},write:(addr,value)=>writes.push({tag,addr,value,at})};},cancelMusicLayer:tag=>cancelled.push(tag)};
}
const overlay={track:{title:'Test pulse',bpm:120,minSeconds:3,parts:{'10':{volume:64}}},score:{duration:8,events:[
  {type:'cc',channel:0,controller:123,value:0,time:0},{type:'noteOn',channel:9,note:42,velocity:100,time:0},
  {type:'noteOn',channel:9,note:38,velocity:90,time:.5},{type:'cc',channel:9,controller:123,value:0,time:8}]}};

test('AB percussion aligns to the next base beat, keeps three seconds, then leaves on a bar with no melody writes',()=>{
  const audio=fakeAudio(),layer=createAfterburnerLayer(audio);layer.attach({...overlay,bpm:160,baseStart:.1});
  audio.setTime(.2);layer.setRequested(true);assert.equal(layer.snapshot().startAt,.475);assert.equal(layer.snapshot().pending,true);
  assert.equal(audio.writes.length,0);audio.setTime(.4);layer.pump();assert.equal(audio.writes[0].at,.475);assert.equal(audio.writes[0].addr,DRUM_ADDR+42);assert.equal(audio.writes[0].value,50);
  audio.setTime(.5);layer.pump();assert.equal(layer.snapshot().active,true);assert.equal(layer.snapshot().startCount,1);
  layer.setRequested(false);assert.equal(layer.snapshot().stopAt,4.6);assert.equal(layer.snapshot().requested,false);
  audio.setTime(3.5);layer.pump();assert.equal(layer.snapshot().active,true);
  audio.setTime(4.6);layer.pump();assert.equal(layer.snapshot().active,false);assert.equal(audio.cancelled.length,1);
  assert.ok(audio.writes.every(w=>w.addr>=DRUM_ADDR&&w.addr<DRUM_ADDR+128&&w.at<4.6));
});

test('short AB bursts share one hold; disabling, pause and stale layer generations cancel immediately',()=>{
  const audio=fakeAudio(),layer=createAfterburnerLayer(audio);layer.attach({...overlay,bpm:120,baseStart:0});
  audio.setTime(.1);layer.setRequested(true);layer.setRequested(false);audio.setTime(.6);layer.pump();assert.equal(layer.snapshot().startCount,1);
  layer.setRequested(true);assert.equal(layer.snapshot().stopAt,null);layer.setRequested(false);assert.equal(layer.snapshot().startCount,1);
  layer.setEnabled(false);assert.equal(layer.snapshot().active,false);assert.equal(layer.snapshot().pending,false);assert.equal(audio.cancelled.length,1);
  layer.setRequested(true);audio.setTime(2);layer.pump();assert.equal(layer.snapshot().active,false);
  layer.setEnabled(true);layer.setRequested(true);assert.equal(layer.snapshot().pending,true);layer.stop();assert.equal(layer.snapshot().available,false);assert.equal(audio.cancelled.length,2);
  layer.attach({...overlay,bpm:120,baseStart:3});layer.setRequested(true);assert.notEqual(layer.snapshot().startAt,.5);layer.reset();assert.equal(layer.snapshot().startCount,0);
});

test('missing metadata and melodic AB files stay unavailable without resetting base audio',()=>{
  const audio=fakeAudio(),layer=createAfterburnerLayer(audio);
  for(const args of [{...overlay,track:{...overlay.track,bpm:undefined}}, {...overlay,score:{...overlay.score,events:[{type:'noteOn',channel:0,note:60,velocity:100,time:0}]}}]){
    layer.attach({...args,bpm:120,baseStart:0});layer.setRequested(true);assert.equal(layer.snapshot().available,false);assert.equal(audio.writes.length,0);
  }
});

test('the real player keeps base track, clock position and played list while AB comes and goes; old configs still play',async()=>{
  const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
  async function playerFor(data){
    const audio=fakeAudio(),fetchFile=async url=>String(url).includes('tracks.json')?{ok:true,json:async()=>data}:{ok:true,arrayBuffer:async()=>readFile(new URL('../public/music/'+new URL(url).pathname.split('/').pop(),import.meta.url))};
    const player=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});player.setSettings({sound:true,bgm:true,sfx:true,abMusic:true,musicSet:'current'});assert.equal(await player.play('flight'),'played');return {audio,player};
  }
  const {audio,player}=await playerFor(config);
  try{
    audio.setTime(.2);const initial=player.snapshot();player.setAfterburner(true);audio.setTime(.6);player.setAfterburner(true);
    const boosted=player.snapshot();assert.equal(boosted.afterburnerMusic.active,true);assert.equal(boosted.trackId,initial.trackId);assert.deepEqual(boosted.playedTracks,initial.playedTracks);assert.equal(boosted.flightNumber,initial.flightNumber);assert.ok(boosted.position>initial.position);
    player.setAfterburner(false);audio.setTime(10);player.setAfterburner(false);const restored=player.snapshot();assert.equal(restored.afterburnerMusic.active,false);assert.ok(restored.position>boosted.position);assert.equal(restored.current,'flight');
    player.setAfterburner(true);player.setSettings({sound:true,bgm:true,sfx:true,abMusic:false,musicSet:'current'});assert.equal(player.snapshot().afterburnerMusic.active,false);assert.equal(player.snapshot().current,'flight');
    assert.equal(await player.play('clear'),'played');player.setAfterburner(true);assert.equal(player.snapshot().current,'clear');assert.equal(player.snapshot().afterburnerMusic.available,false);assert.equal(player.snapshot().afterburnerMusic.active,false);
    player.stop();assert.equal(player.snapshot().afterburnerMusic.pending,false);
  }finally{player.stop();}
  const legacy={...config};delete legacy.afterburner;delete legacy.flightTempos;const old=await playerFor(legacy);
  try{old.player.setAfterburner(true);assert.equal(old.player.snapshot().playing,true);assert.equal(old.player.snapshot().afterburnerMusic.available,false);}finally{old.player.stop();}
  const broken={...config,afterburner:{...config.afterburner,file:'missing.mid'}},fallback=await playerFor(broken);fallback.player.setAfterburner(true);assert.equal(fallback.player.snapshot().playing,true);assert.equal(fallback.player.snapshot().afterburnerMusic.available,false);fallback.player.stop();
  const custom=await playerFor({...config,flightTempos:undefined});try{custom.player.setAfterburner(true);assert.equal(custom.player.snapshot().afterburnerMusic.available,true);assert.equal(custom.player.snapshot().afterburnerMusic.bpm,120);}finally{custom.player.stop();}
});
