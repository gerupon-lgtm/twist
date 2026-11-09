import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {validateTrack,prepareScore} from '../src/music/score.js';import {createMusicSynth} from '../src/music/music-synth.js';
const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
test('Overdrive FM boosts the actual 16th-note part while SCC keeps its original volume and events',async()=>{
 const track=validateTrack(config.overdrive),score=prepareScore(await readFile(new URL('../public/music/overdrive.mid',import.meta.url)),track);assert.equal(track.parts[2].fmPreset,'sequence');assert.equal(track.parts[2].volume,46);assert.equal(track.parts[2].fmVolume,90);
 const notes=score.events.filter(e=>e.channel===1&&e.type==='noteOn');assert.equal(notes.length,1088);
 for(const engine of ['scc','fm']){const writes=[],scc={resetControllers(){},handle(e){writes.push({event:e,presetId:'scc'});},allNotesOff(){}};const clock={sampleRate:48000,event:e=>writes.push(e)};
  const synth=createMusicSynth({scc,clock,track,engine,score});synth.resetControllers();for(const e of score.events)synth.handle(e);
  const part=writes.filter(w=>w.event?.channel===1);assert.equal(part.filter(w=>w.event.type==='noteOn').length,1088);
  const volume=part.find(w=>w.event.type==='cc'&&w.event.controller===7);assert.equal(volume.event.value,engine==='fm'?90:46);
  assert.ok(part.filter(w=>w.event.type==='noteOn').every(w=>w.presetId===(engine==='fm'?'sequence':'scc')));
 }
 for(const value of [-1,128,NaN])assert.throws(()=>validateTrack({...config.overdrive,parts:{...config.overdrive.parts,2:{...config.overdrive.parts[2],fmVolume:value}}}));
});
