import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateMusic } from '../tools/generate-music.mjs';
import { validateTrack,prepareScore,createLoopStream } from '../src/music/score.js';
import { createMusicPlayer } from '../src/music/player.js';
import { parseSmf } from '../src/vendor/scc/midi/smf.js';
import { ChipMixer } from '../src/feedback/chip-mixer.js';
import { Synth } from '../src/vendor/scc/engine/synth.js';
const songs=generateMusic();
const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
test('original MIDI generation is reproducible, lasts 45 seconds and stays within five SCC voices',async()=>{
  for(const [id,data]of Object.entries(songs)){
    const bytes=await readFile(new URL(`../public/music/${id}.mid`,import.meta.url));assert.equal(Buffer.compare(data,bytes),0);
    const song=parseSmf(data);assert.equal(song.duration,id==='flight'?45:2.4);
    let active=new Set(),max=0;
    for(const e of song.events){if(e.channel===9)continue;const key=e.channel+':'+e.note;
      if(e.type==='noteOn')active.add(key);if(e.type==='noteOff')active.delete(key);max=Math.max(max,active.size);
    }assert.ok(max<=5);assert.ok(song.events.some(e=>e.channel===9&&e.type==='noteOn'));
  }
});
test('track validation rejects invalid paths, parts, corrupt MIDI and unusable loop bounds',()=>{
  for(const file of ['https://elsewhere/music.mid','../x.mid','/x.mid','bad.wav'])assert.throws(()=>validateTrack({file}));
  assert.throws(()=>validateTrack({file:'x.mid',parts:{9:{volume:100}}}));
  assert.throws(()=>validateTrack({file:'x.mid',loop:{start:1,end:1.001}}));
  assert.throws(()=>prepareScore(new Uint8Array([1,2,3]),validateTrack(config.flight)));
  assert.throws(()=>prepareScore(songs.flight,{...validateTrack(config.flight),loop:{start:100,end:101}}));
  assert.equal(prepareScore(songs.clear,{...validateTrack(config.clear),loop:{start:0,end:3}}).duration,3);
});
test('loop segments restore held notes/controllers and repeated events land exactly on the boundary',()=>{
  const track=validateTrack({...config.clear,loop:{start:.1,end:2}}),score=prepareScore(songs.clear,track);
  assert.ok(score.events.some(e=>e.time===0&&e.type==='noteOn'));
  assert.ok(score.events.some(e=>e.time===0&&e.type==='pitchBend'&&e.value===0));
  const stream=createLoopStream(score);assert.equal(stream.extend(score.duration*2),score.duration*2);
  const boundary=stream.events.filter(e=>Math.abs(e.time-score.duration)<1e-10);
  assert.ok(boundary.some(e=>e.type==='noteOn'));assert.equal(boundary[0].controller,123);
  assert.ok(stream.events.every(e=>e.time>=0));
});
test('missing/corrupt configuration can never prevent gameplay or start sound',async()=>{
  let started=0;const audio={stopMusic(){},setMusicGain(){},waitForReady:async()=>true,resume:async()=>{started++;}};
  for(const fetchFile of [async()=>({ok:false}),async()=>({ok:true,json:async()=>({flight:{file:'broken.mid'}}),arrayBuffer:async()=>new ArrayBuffer(0)})]){
    const player=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});player.setSettings({sound:true,bgm:true,sfx:true});
    assert.equal(await player.play('flight'),'unavailable');assert.equal(player.snapshot().playing,false);player.stop();
  }assert.equal(started,0);
});
test('a cancelled load cannot start music after a pause',async()=>{
  let release;const response=new Promise(resolve=>{release=resolve;});let resumed=0;
  const audio={stopMusic(){},setMusicGain(){},waitForReady:async()=>true,resume:async()=>{resumed++;}};
  const fetchFile=async url=>String(url).includes('tracks.json')?response:{ok:true,arrayBuffer:async()=>songs[String(url).includes('clear')?'clear':'flight']};
  const player=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});player.setSettings({sound:true,bgm:true,sfx:true});
  const pending=player.play('flight');player.stop();release({ok:true,json:async()=>config});assert.equal(await pending,'cancelled');assert.equal(resumed,0);
});
test('music writes and drum noise do not touch the effects PSG, and both buses can render together',()=>{
  const m=new ChipMixer();m.musicGain=.5;const before=[...m.sfxPsg.psg.regs];
  const synth=new Synth({write:(a,v)=>m.writeMusic(a,v)},{drums:true});synth.init();synth.handle({type:'noteOn',channel:0,note:74,velocity:96});synth.handle({type:'noteOn',channel:9,note:36,velocity:96});
  assert.deepEqual([...m.sfxPsg.psg.regs],before);const out=new Float32Array(4096);m.render(out);assert.ok(out.some(n=>Math.abs(n)>.001));assert.ok(out.every(Number.isFinite));
  m.stopMusic();assert.deepEqual([...m.sfxPsg.psg.regs],before);
});

test('the goal jingle uses the music bus even when flight BGM is off',async()=>{
 let writes=0,clears=0;
 const audio={stopMusic(){clears++;},setMusicGain(){},configure(){},waitForReady:async()=>true,resume:async()=>{},suspendIfIdle(){},musicClock:{now:()=>0,setScheduleTime(){},write(){writes++;}}};
 const fetchFile=async url=>String(url).includes('tracks.json')?{ok:true,json:async()=>config}:{ok:true,arrayBuffer:async()=>songs[String(url).includes('clear')?'clear':'flight']};
 const p=createMusicPlayer(audio,{fetchFile,base:new URL('https://example.test/music/')});p.setSettings({sound:true,bgm:false,sfx:true,bgmVolume:50});
 assert.equal(await p.play('clear'),'played');assert.equal(p.snapshot().current,'clear');assert.ok(writes>0&&clears>0);p.stop();assert.equal(p.snapshot().playing,false);
});
