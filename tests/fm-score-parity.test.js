import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {Synth} from '../src/vendor/scc/engine/synth.js';import {PRESET_NAMES} from '../src/vendor/scc/core/presets.js';
import {createMusicSynth,measureFmVoices} from '../src/music/music-synth.js';import {validateTrack,prepareScore,createLoopStream} from '../src/music/score.js';
const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
const oldIds=config.catalog.preview.filter(id=>!id.startsWith('clear-'));
function sink(){const hash=createHash('sha256');let count=0,at=null;return {clock:{setScheduleTime(value){at=value;},write(addr,value){count++;hash.update(`${at}:${addr}:${value};`);}},result:()=>({count,hash:hash.digest('hex')})};}
test('all original thirteen full scores and two loops preserve every SCC register write in order',async()=>{
 assert.equal(oldIds.length,13);
 for(const id of oldIds){
  const track=validateTrack(config[id]),bytes=await readFile(new URL('../public/music/'+track.file,import.meta.url)),score=prepareScore(bytes,track);
  const old=sink(),current=sink(),a=new Synth(old.clock,{drums:true}),b=new Synth(current.clock,{drums:true});
  for(const synth of [a,b]){synth.init();for(const [channel,part]of Object.entries(track.parts))if(Number(channel)<=8)synth.setWave(PRESET_NAMES[part.waveform],Number(channel)-1);}
  const facade=createMusicSynth({scc:b,clock:current.clock,track,engine:'scc',score});
  a.resetControllers();for(const [channel,part]of Object.entries(track.parts))a.handle({type:'cc',channel:Number(channel)-1,controller:7,value:part.volume});facade.resetControllers();
  const stream=createLoopStream(score);stream.extend(score.duration*(track.loop?2:1));
  for(const event of stream.events){old.clock.setScheduleTime(event.time);current.clock.setScheduleTime(event.time);const volume=track.parts[(event.channel??0)+1]?.volume??127;
   a.handle(event.type==='cc'&&event.controller===7?{...event,value:Math.round(event.value*volume/127)}:event);facade.handle(event);
  }
  a.allNotesOff();facade.allNotesOff();assert.deepEqual(current.result(),old.result(),id);
 }
});
test('all sixteen authored FM roles fit the preallocated pool, including tails and two loops at supported minimum rate',async()=>{
 for(const id of config.catalog.preview){const track=validateTrack(config[id]),score=prepareScore(await readFile(new URL('../public/music/'+track.file,import.meta.url)),track),stream=createLoopStream(score);stream.extend(score.duration*2);
  for(const sampleRate of [8000,44100,48000]){const n=measureFmVoices({events:stream.events},track,{sampleRate});assert.ok(n<=128,`${id}/${sampleRate}: ${n}`);assert.ok(n>=0);}
 }
});
