import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { flightFeedback, sfxRegisters, scaledPattern, pulseAt } from '../src/feedback/model.js';
import { createHaptics } from '../src/feedback/haptics.js';
import { createSensorJitter } from '../src/feedback/jitter.js';
import { normalizeFeedbackSettings,loadFeedbackSettings,saveFeedbackSettings } from '../src/feedback/settings.js';
import { ChipMixer } from '../src/feedback/chip-mixer.js';
const settings=normalizeFeedbackSettings();
const flying={altitude:25,verticalSpeed:0,throttle:.5,speed:6};
test('feedback uses incidence, not speed, and ground red warning takes precedence',()=>{
  assert.equal(flightFeedback({...flying,speed:18},settings).cue,'engine');
  for(const [angle,cue]of [[13.99,'engine'],[14,'buffet'],[19.99,'buffet'],[20,'stall'],[70,'stall']])assert.equal(flightFeedback({...flying,angleOfAttack:angle*Math.PI/180},settings).cue,cue);
  assert.equal(flightFeedback({...flying,altitude:2,angleOfAttack:1},settings).cue,'ground');
  assert.equal(flightFeedback({...flying,throttle:0,speed:0},{...settings,engineVibration:false}).pattern.length,0);
  for(const value of [NaN,Infinity,undefined,-10]){
    const model=flightFeedback({angleOfAttack:value,throttle:value,speed:value},settings);
    for(const key of ['angleOfAttack','power','speed','engineHz','wind'])assert.ok(Number.isFinite(model[key]));
  }
  const a=flightFeedback({...flying,angleOfAttack:14*Math.PI/180},settings),b=flightFeedback({...flying,angleOfAttack:19*Math.PI/180},settings);
  assert.ok(a.pattern[0]<b.pattern[0]);assert.equal(pulseAt([85,100,85,430],0),true);assert.equal(pulseAt([85,100,85,430],100),false);
  assert.equal(scaledPattern([50,150],2).reduce((a,b)=>a+b),200);
});
test('haptics are gated by the start gesture, events override continuous pulses, and stop cancels them',()=>{
  const calls=[],h=createHaptics(p=>calls.push(p)),model=flightFeedback(flying,settings);
  h.update(model,settings,0);h.event('collect',settings,0);h.stop();assert.equal(calls.length,0);
  h.arm();h.update(model,settings,1);assert.ok(Array.isArray(calls.at(-1)));
  h.event('clear',settings,2);const count=calls.length;h.event('collect',settings,10);h.update(model,settings,100);assert.equal(calls.length,count);
  h.stop();assert.equal(calls.at(-1),0);
  const unsupported=createHaptics(null);unsupported.arm();unsupported.update(model,settings,10);unsupported.stop();
});
test('settings survive reload, invalid storage falls back, and unsupported APIs need no settings rewrite',()=>{
  let value;const storage={getItem:()=>value,setItem:(_k,v)=>{value=v;}};
  assert.equal(loadFeedbackSettings(storage).volume,25);saveFeedbackSettings(storage,{sound:false,vibrationScale:2});
  assert.equal(loadFeedbackSettings(storage).sound,false);assert.equal(loadFeedbackSettings(storage).vibrationScale,2);
  assert.equal(normalizeFeedbackSettings({volume:NaN}).volume,25);assert.equal(normalizeFeedbackSettings({volume:500}).volume,100);
  assert.equal(saveFeedbackSettings({setItem(){throw Error();}},settings),false);
});
test('one-second sensor ranges include intentional input, unwrap angles and aggregate complete windows',()=>{
  const j=createSensorJitter();j.add(0,1,179);j.add(500,2,-179);j.add(1000,3,178);
  const s=j.snapshot();assert.equal(s.windows,1);assert.ok(Math.abs(s.maxPitchRange-2)<1e-10);assert.ok(s.maxSteerRange<4);
  j.clearWindow();j.add(5000,0,0);assert.equal(j.snapshot().windows,1);
  j.reset();assert.equal(j.snapshot().windows,0);
});
test('the second PSG produces finite audio, cannot change music registers, and stop is silent',()=>{
  const m=new ChipMixer(),before=[...m.musicPsg.psg.regs],scc=[...m.chip.volume];
  m.writeSfx(sfxRegisters(flightFeedback(flying,settings),'collect',50));
  assert.deepEqual([...m.musicPsg.psg.regs],before);assert.deepEqual([...m.chip.volume],scc);
  const buf=new Float32Array(4096);m.render(buf);assert.ok(buf.some(n=>Math.abs(n)>.0001));assert.ok(buf.every(Number.isFinite));
  m.stop();m.render(buf);assert.ok(buf.every(n=>n===0));
});
test('all vendored SCC chip bytes match the pinned source commit',async()=>{
  const source=JSON.parse(await readFile(new URL('../src/vendor/scc/source.json',import.meta.url)));
  assert.equal(source.commit,'0036288a134a79b1855915eac47ff09634295e7f');
  for(const [path,hash]of Object.entries(source.sha256))assert.equal(createHash('sha256').update(await readFile(new URL('../src/vendor/scc/'+path,import.meta.url))).digest('hex'),hash,path);
  assert.match(await readFile(new URL('../public/licenses/SCC-NOTICE.txt',import.meta.url),'utf8'),/BSD|Redistribution/);
});

test('warning vibration supplies a fresh shared phase after pause and after an event',()=>{
 const h=createHaptics(()=>{});h.arm();const model=flightFeedback({...flying,altitude:2},settings);
 assert.deepEqual(h.update(model,settings,100),{restarted:true,elapsedMs:0});
 assert.deepEqual(h.update(model,settings,150),{restarted:false,elapsedMs:50});
 h.stop();assert.deepEqual(h.update(model,settings,700),{restarted:true,elapsedMs:0});
 h.event('collect',settings,710);assert.equal(h.update(model,settings,720),undefined);
 assert.deepEqual(h.update(model,settings,1010),{restarted:true,elapsedMs:0});h.stop();
});

test('audio processor resets warning phase on stop and accepts the common haptic phase after events',async()=>{
 let Processor;
 globalThis.AudioWorkletProcessor=class{constructor(){this.port={postMessage(){},onmessage:null};}};
 globalThis.sampleRate=48000;globalThis.currentTime=10;globalThis.registerProcessor=(_name,C)=>{Processor=C;};
 try{
  await import('../src/feedback/audio-worklet.js?unit-phase');const p=new Processor(),model=flightFeedback({...flying,altitude:2},settings);
  const send=data=>p.port.onmessage({data});send({type:'state',model,settings});assert.equal(p.cueAt,10);
  globalThis.currentTime=12;send({type:'stop'});globalThis.currentTime=20;send({type:'state',model,settings});assert.equal(p.cueAt,20);
  send({type:'event',kind:'collect',settings});globalThis.currentTime=20.31;
  p.process([],[[new Float32Array(128)]]);send({type:'state',model,settings,phase:{restarted:true,elapsedMs:0}});
  assert.equal(p.cueAt,20.31);assert.equal(p.event,null);
 }finally{delete globalThis.AudioWorkletProcessor;delete globalThis.sampleRate;delete globalThis.currentTime;delete globalThis.registerProcessor;}
});
