import test from 'node:test';
import assert from 'node:assert/strict';
import {FmEngine} from '../src/music/fm-engine.js';
import {FM_PRESETS,fmPartStatus} from '../src/music/fm-presets.js';
const render=(engine,seconds=.03)=>{const out=new Float32Array(Math.ceil(engine.rate*seconds));engine.render(out);return out;};
const energy=out=>out.reduce((sum,v)=>sum+v*v,0);
test('two-operator voice sounds, scales CC7 once, bends held notes and has a bounded release',()=>{
 const e=new FmEngine(48000,8);assert.equal(e.handle({type:'noteOn',channel:0,note:69,velocity:110},'lead'),true);
 const before=render(e);assert.ok(energy(before)>0);assert.ok(before.every(Number.isFinite));
 e.handle({type:'pitchBend',channel:0,value:4096});assert.ok(e.snapshot().voices[0].frequency>440);
 e.handle({type:'cc',channel:0,controller:7,value:0});assert.ok(render(e).every(v=>v===0));
 e.handle({type:'cc',channel:0,controller:7,value:127});assert.ok(energy(render(e))>0);
 e.handle({type:'noteOff',channel:0,note:69});assert.equal(e.snapshot().releasingVoices,1);assert.ok(energy(render(e,.01))>0);
 render(e,.11);assert.equal(e.snapshot().activeVoices,0);assert.ok(render(e).every(v=>v===0));
});
test('retrigger and channel stops preserve another voice, and capacity never silently steals',()=>{
 const e=new FmEngine(44100,2);e.handle({type:'noteOn',channel:0,note:60,velocity:100},'chords');e.handle({type:'noteOn',channel:1,note:64,velocity:100},'lead');
 e.handle({type:'noteOn',channel:0,note:60,velocity:90},'chords');assert.equal(e.snapshot().activeVoices,2);
 assert.equal(e.handle({type:'noteOn',channel:2,note:67,velocity:100},'lead'),false);assert.equal(e.snapshot().overflows,1);
 e.handle({type:'cc',channel:0,controller:123,value:0});assert.equal(e.snapshot().activeVoices,1);assert.equal(e.snapshot().voices[0].channel,1);
 e.stop();assert.ok(render(e).every(v=>v===0));assert.equal(e.snapshot().activeVoices,0);
});
test('metadata fallback and high-note rendering are finite at both native rates',()=>{
 assert.equal(fmPartStatus({role:'bass',fmPreset:'lead'}).eligible,false);assert.equal(fmPartStatus({role:'lead',fmPreset:'unknown'}).reason,'unknown-preset');
 for(const rate of [44100,48000])for(const preset of Object.keys(FM_PRESETS)){
  const e=new FmEngine(rate,4);e.handle({type:'noteOn',channel:0,note:127,velocity:127},preset);e.handle({type:'pitchBend',channel:0,value:8191});
  assert.ok(render(e).every(v=>Number.isFinite(v)&&Math.abs(v)<1));e.handle({type:'cc',channel:0,controller:120,value:0});assert.equal(e.snapshot().activeVoices,0);
 }
});
