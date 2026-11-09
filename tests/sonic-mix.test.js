import test from 'node:test';import assert from 'node:assert/strict';import {ChipMixer} from '../src/feedback/chip-mixer.js';import {FmEngine} from '../src/music/fm-engine.js';import {Synth} from '../src/vendor/scc/engine/synth.js';import {flightFeedback,sfxRegisters} from '../src/feedback/model.js';import {sonicBoomSample,sonicBoomDucking} from '../src/feedback/sonic-boom.js';
test('maximum music, engine and explosion mix remains finite without full-scale clipping at both native rates',()=>{
 for(const rate of [44100,48000])for(const engine of ['scc','fm'])for(const pan of [null,1]){
 const m=new ChipMixer(rate);m.setVolume(100);m.musicGain=1;const s=new Synth({write:(a,v)=>m.writeMusic(a,v)},{drums:true});s.init();const f=new FmEngine(rate,16);
 for(let channel=0;channel<5;channel++)for(const note of [52,59]){if(engine==='scc')s.handle({type:'noteOn',channel,note,velocity:127});else f.handle({type:'noteOn',channel,note,velocity:127},'distortion-guitar');}
 m.writeSfx(sfxRegisters(flightFeedback({mode:'flight',speed:680,altitude:1500,groundClearance:1499,throttle:1,supersonic:{mach:2}},{sound:true,sfx:true,volume:100})));
 const l=new Float32Array(128),r=new Float32Array(128),fm=new Float32Array(128),impact=new Float32Array(128),duck=new Float32Array(128);let peak=0,energy=0;
 for(let n=0;n<Math.ceil(rate*1.4/128);n++){for(let i=0;i<128;i++){const t=(n*128+i)/rate;impact[i]=sonicBoomSample(t);duck[i]=sonicBoomDucking(t);}f.render(fm);m.render(l,r,pan,engine==='fm'?fm:null,impact,duck);for(const v of [...l,...r]){assert.ok(Number.isFinite(v)&&Math.abs(v)<1,JSON.stringify({rate,engine,pan,n,value:v}));peak=Math.max(peak,Math.abs(v));energy+=v*v;}}
 assert.ok(peak>.2&&energy>1);
 }
});

