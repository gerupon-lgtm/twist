import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {FmEngine} from '../src/music/fm-engine.js';import {createMusicSynth} from '../src/music/music-synth.js';
import {fmPartStatus} from '../src/music/fm-presets.js';import {validateTrack,prepareScore,createLoopStream} from '../src/music/score.js';
const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
// This computes every FM sample in Node. Native worklet/full mixed PCM and
// real-time UI load are separate browser checks; no audio time is shortened.
for(const sampleRate of [44100,48000])test(`all sixteen full FM scores and their second loops render every upper note at ${sampleRate}Hz`,async()=>{
 for(const id of config.catalog.preview){
  const track=validateTrack(config[id]),score=prepareScore(await readFile(new URL('../public/music/'+track.file,import.meta.url)),track),stream=createLoopStream(score);stream.extend(score.duration*(track.loop?2:1));
  const writes=[],clock={sampleRate,event:w=>writes.push(w)},scc={handle(){},resetControllers(){},allNotesOff(){}};
  const facade=createMusicSynth({scc,clock,track,score:{events:stream.events},engine:'fm'}),engine=new FmEngine(sampleRate);
  const configure=writes.shift();if(configure)engine.handle(configure.event);let index=0,peak=0,expected=0,invalid=0;const output=new Float32Array(128),end=stream.events.at(-1).time+.2;
  for(let frame=0;frame/sampleRate<end;frame+=128){const blockEnd=(frame+128)/sampleRate;
   while(index<stream.events.length&&stream.events[index].time<blockEnd){const event=stream.events[index++];if(event.type==='noteOn'&&event.velocity>0&&fmPartStatus(track.parts[event.channel+1]).eligible)expected++;facade.handle(event);}
   for(const write of writes)engine.handle(write.event,write.presetId);writes.length=0;engine.render(output);
   for(const sample of output){if(!Number.isFinite(sample))invalid++;peak=Math.max(peak,Math.abs(sample));}
  }
  const result=engine.snapshot();assert.equal(invalid,0,id);assert.equal(result.noteOns,expected,id);assert.equal(result.overflows,0,id);assert.equal(result.invalidEvents,0,id);assert.equal(result.activeVoices,0,id);assert.ok(result.maximumVoices<=facade.snapshot().requiredVoices,id);
  if(expected)assert.ok(peak>0,id);assert.ok(peak<1,id);
 }
});
