import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {FmEngine} from '../src/music/fm-engine.js';
import {renderFmCompat} from './helpers/fm-compat-render.js';

const rms=x=>Math.sqrt(x.reduce((n,v)=>n+v*v,0)/x.length);
function tone(preset,{rate=48000,note=69,seconds=.5}={}){
 const engine=new FmEngine(rate,2);assert.equal(engine.handle({type:'noteOn',channel:0,note,velocity:110},preset),true);
 const out=new Float32Array(Math.round(seconds*rate));engine.render(out);return {engine,out};
}
function harmonicEnergy(samples,rate,frequency,first,last){
 let energy=0;
 for(let harmonic=first;harmonic<=last;harmonic++){
  let re=0,im=0;const omega=2*Math.PI*frequency*harmonic/rate;
  for(let i=0;i<samples.length;i++){const window=.5-.5*Math.cos(2*Math.PI*i/(samples.length-1));re+=samples[i]*window*Math.cos(omega*i);im+=samples[i]*window*Math.sin(omega*i);}
  energy+=re*re+im*im;
 }
 return energy;
}

test('Overdrive organ sustains strong upper registers instead of only a fundamental and octave',t=>{
 for(const rate of [44100,48000]){
  const {out}=tone('pipe-organ',{rate,note:69});const held=out.subarray(Math.round(rate*.2));
  const lower=harmonicEnergy(held,rate,440,1,2),upper=harmonicEnergy(held,rate,440,3,8);
  assert.ok(upper/lower>.2,`organ upper/lower energy ${upper/lower} at ${rate}`);
  t.diagnostic(JSON.stringify({rate,organUpperToLower:upper/lower,rms:rms(held)}));
  assert.ok(rms(held)>.025);assert.ok(held.every(Number.isFinite));
 }
});

test('all six preceding FM voices retain the exact published v0.1.55 PCM',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/fm-v0155-pcm.json',import.meta.url),'utf8'));
 for(const [rate,presets]of Object.entries(fixture.rates))for(const [id,expected]of Object.entries(presets))assert.equal(renderFmCompat(FmEngine,Number(rate),id),expected,`${id}/${rate}`);
});

test('new FM colors are independent of render block size and stay bounded at pitch/rate extremes',()=>{
 for(const id of ['minimoog-lead','pipe-organ']){
  const whole=tone(id).out,engine=new FmEngine(48000,1);engine.handle({type:'noteOn',channel:0,note:69,velocity:110},id);
  const split=new Float32Array(whole.length);for(let at=0;at<split.length;at+=127)engine.render(split.subarray(at,Math.min(at+127,split.length)));
  const hash=out=>createHash('sha256').update(out).digest('hex');assert.equal(hash(whole),hash(split),id);
  for(const rate of [8000,44100,48000])for(const note of [0,69,127]){
   const {engine,out}=tone(id,{rate,note,seconds:.15});assert.ok(out.every(v=>Number.isFinite(v)&&Math.abs(v)<1));
   for(const value of [-8192,8191]){engine.handle({type:'pitchBend',channel:0,value});engine.render(out);assert.ok(out.every(v=>Number.isFinite(v)&&Math.abs(v)<1));}
   engine.stop();engine.render(out);assert.ok(out.every(v=>v===0));
  }
 }
});

test('Overdrive analog-style FM lead has a rough sustained edge, recovers from bends and ends cleanly',()=>{
 for(const rate of [44100,48000]){
  const {engine,out}=tone('minimoog-lead',{rate,note:69});
  const held=out.subarray(Math.round(rate*.2));
  assert.ok(harmonicEnergy(held,rate,440,3,8)/harmonicEnergy(held,rate,440,1,2)>.12);
  assert.ok(rms(held)>.04);assert.ok(out.every(v=>Number.isFinite(v)&&Math.abs(v)<1));
  engine.handle({type:'pitchBend',channel:0,value:4096});
  assert.ok(Math.abs(engine.snapshot().voices[0].frequency-440*2**(1/12))<1e-8);
  engine.handle({type:'noteOff',channel:0,note:69});const tail=new Float32Array(Math.round(rate*.2));engine.render(tail);
  assert.equal(engine.snapshot().activeVoices,0);assert.ok(tail.subarray(Math.round(rate*.15)).every(v=>v===0));
 }
});
