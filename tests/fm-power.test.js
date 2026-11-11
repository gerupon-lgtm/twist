import test from 'node:test';import assert from 'node:assert/strict';
import {FmEngine,FM_OUTPUT_GAIN} from '../src/music/fm-engine.js';
import {FM_PRESETS} from '../src/music/fm-presets.js';
import {FM_PRESETS as previous} from './fixtures/fm-presets-v0143.js';
function tone(id,old=false){const e=new FmEngine(48000,1);e.handle({type:'noteOn',channel:0,note:id==='bass'?40:73,velocity:100},id);if(old)e.voices[0].preset=previous[id];const out=new Float32Array(24000);e.render(out);return out;}
const rms=out=>Math.sqrt(out.reduce((s,v)=>s+v*v,0)/out.length);
test('FM voices gain body and level without changing note or controller handling',()=>{
  for(const id of ['distortion-guitar','bass','lead','chords']){
    const before=tone(id,true),after=tone(id);assert.ok(after.every(v=>Number.isFinite(v)&&Math.abs(v)<1));
    assert.ok(rms(after)>rms(before)*1.4,`${id} RMS must increase by at least 40%`);
  }
});
test('only FM output is reduced by twenty percent while all timbre parameters stay intact',()=>{
 assert.equal(FM_OUTPUT_GAIN,.8);
 for(const id of ['distortion-guitar','bass','lead','chords','sequence']){
  const reduced=tone(id),engine=new FmEngine(48000,1);engine.handle({type:'noteOn',channel:0,note:id==='bass'?40:73,velocity:100},id);
  engine.voices[0].preset={...FM_PRESETS[id],gain:FM_PRESETS[id].gain/FM_OUTPUT_GAIN};const reference=new Float32Array(24000);engine.render(reference);
  assert.ok(Math.abs(rms(reduced)/rms(reference)-.8)<1e-6,id);
 }
});
