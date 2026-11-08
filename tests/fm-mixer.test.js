import test from 'node:test';import assert from 'node:assert/strict';
import {ChipMixer} from '../src/feedback/chip-mixer.js';import {ChipMixer as V32Mixer} from './fixtures/chip-mixer-v0132.js';
import {Synth} from '../src/vendor/scc/engine/synth.js';import {sfxRegisters,flightFeedback} from '../src/feedback/model.js';
function setup(Mixer){const m=new Mixer(48000);m.setVolume(31);m.musicGain=.53;const s=new Synth({write:(a,v)=>m.writeMusic(a,v)},{drums:true});s.init();s.handle({type:'noteOn',channel:0,note:60,velocity:90});s.handle({type:'noteOn',channel:9,note:36,velocity:100});m.writeSfx(sfxRegisters(flightFeedback({mode:'flight',speed:25,altitude:22,throttle:.5},{sound:true,sfx:true,volume:31})));return m;}
test('SCC samples remain exactly the v32 PCM in common and navigation render paths',()=>{
 for(const pan of [null,-1,0,.7]){const before=setup(V32Mixer),after=setup(ChipMixer);
  for(let block=0;block<20;block++){const a=new Float32Array(128),ar=new Float32Array(128),b=new Float32Array(128),br=new Float32Array(128);before.render(a,ar,pan);after.render(b,br,pan);assert.deepEqual(b,a);assert.deepEqual(br,ar);}
 }
});
test('FM is inside music gain and common post stage, and does not disturb navigation distribution',()=>{
 const fm=new Float32Array(128).fill(.2),m=new ChipMixer(48000);m.setVolume(50);m.musicGain=.5;
 const l=new Float32Array(128),r=new Float32Array(128);m.render(l,r,null,fm);assert.ok(l.some(v=>v!==0));assert.deepEqual(l,r);
 m.stop();m.musicGain=0;m.render(l,r,null,fm);assert.ok(l.every(v=>v===0));
});
