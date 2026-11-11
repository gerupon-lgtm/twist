import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {validateTrack,prepareScore} from '../src/music/score.js';import {createMusicSynth} from '../src/music/music-synth.js';
const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
test('Overdrive FM uses organ sixteenths and an analog-style lead while SCC keeps its original volume and events',async()=>{
 const track=validateTrack(config.overdrive),score=prepareScore(await readFile(new URL('../public/music/overdrive.mid',import.meta.url)),track);assert.equal(track.parts[2].volume,46);assert.equal(track.parts[2].fmVolume,90);
 const notes=score.events.filter(e=>e.channel===1&&e.type==='noteOn');assert.equal(notes.length,1088);
 for(const engine of ['scc','fm']){const writes=[],scc={resetControllers(){},handle(e){writes.push({event:e,presetId:'scc'});},allNotesOff(){}};const clock={sampleRate:48000,event:e=>writes.push(e)};
  const synth=createMusicSynth({scc,clock,track,engine,score});synth.resetControllers();for(const e of score.events)synth.handle(e);
  const part=writes.filter(w=>w.event?.channel===1);assert.equal(part.filter(w=>w.event.type==='noteOn').length,1088);
  const volume=part.find(w=>w.event.type==='cc'&&w.event.controller===7);assert.equal(volume.event.value,engine==='fm'?90:46);
  assert.ok(part.filter(w=>w.event.type==='noteOn').every(w=>w.presetId===(engine==='fm'?'pipe-organ':'scc')));
  const lead=writes.filter(w=>w.event?.channel===0&&w.event.type==='noteOn');
  assert.equal(lead.length,score.events.filter(e=>e.channel===0&&e.type==='noteOn').length);
  assert.ok(lead.every(w=>w.presetId===(engine==='fm'?'minimoog-lead':'scc')));
  const originalLead=score.events.filter(e=>e.channel===0&&(e.type==='noteOn'||e.type==='noteOff'));
  const renderedLead=writes.filter(w=>w.event?.channel===0&&(w.event.type==='noteOn'||w.event.type==='noteOff'));
  assert.equal(renderedLead.length,originalLead.length);
  for(let i=0;i<originalLead.length;i++)assert.equal(renderedLead[i].event.note,originalLead[i].note+(engine==='fm'?-12:0),`${engine} lead event ${i}`);
 }
 for(const value of [-1,128,NaN])assert.throws(()=>validateTrack({...config.overdrive,parts:{...config.overdrive.parts,2:{...config.overdrive.parts[2],fmVolume:value}}}));
});
