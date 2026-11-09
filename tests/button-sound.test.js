import test from 'node:test';
import assert from 'node:assert/strict';
import {renderButtonSound,createButtonSound} from '../src/feedback/button-sound.js';

for(const rate of [44100,48000])test(`soft PSG click ${rate}Hz has a short quiet-ended envelope and bounded level`,()=>{
  const pcm=renderButtonSound(rate);assert.equal(pcm.length,Math.ceil(rate*.07));assert.equal(pcm[0],0);assert.equal(pcm.at(-1),0);
  assert.ok(pcm.every(Number.isFinite));const peak=Math.max(...pcm.map(Math.abs));assert.ok(peak>.089&&peak<.091);
  const rms=a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/a.length);
  assert.ok(rms(pcm.slice(0,rate*.004))<rms(pcm.slice(rate*.025,rate*.045))*.1);
  assert.ok(rms(pcm.slice(-Math.round(rate*.004)))<rms(pcm.slice(rate*.025,rate*.045))*.1);
});
test('muted clicks construct no context and a delayed or cancelled resume produces no late sound',async()=>{
  let contexts=0,resumes=[],starts=0,time=0;
  const context={state:'running',resume:()=>new Promise(resolve=>resumes.push(resolve)),suspend:async()=>{},createBufferSource:()=>{starts++;throw Error('must not start');}};
  const sound=createButtonSound({ensureContext:()=>{contexts++;return context;},canSuspend:()=>true,visible:()=>true,now:()=>time});
  assert.equal(await sound.play({sound:false,sfx:true,volume:25}),false);assert.equal(contexts,0);
  const late=sound.play({sound:true,sfx:true,volume:25});time=601;resumes.shift()();assert.equal(await late,false);assert.equal(starts,0);
  const cancelled=sound.play({sound:true,sfx:true,volume:25});sound.cancel();resumes.shift()();assert.equal(await cancelled,false);assert.equal(starts,0);assert.equal(sound.active(),false);
});
