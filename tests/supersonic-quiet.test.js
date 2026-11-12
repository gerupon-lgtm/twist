import test from 'node:test';
import assert from 'node:assert/strict';
import {flightFeedback,sfxRegisters} from '../src/feedback/model.js';
import {createSpeedSoundClock} from '../src/feedback/speed-sound.js';
import {createHaptics} from '../src/feedback/haptics.js';

const settings={sound:true,sfx:true,bgm:true,volume:25,speedSound:true,vario:true,vibration:true,vibrationScale:1,engineVibration:true};
const state=(mach,extra={})=>({mode:'flight',speed:340*mach,altitude:1500,groundClearance:1499,throttle:1,verticalSpeed:0,supersonic:{mach},...extra});
const model=(mach,extra={},options={})=>flightFeedback(state(mach,extra),{...settings,...options});
const onTime=pattern=>pattern.reduce((sum,n,i)=>sum+(i%2===0?n:0),0);

test('Mach 1 suppresses environmental engine, AB, speed and pass-by without changing subsonic sound',()=>{
 for(const ab of [false,true]){
  const extra={afterburner:{active:ab,burstSeconds:1}},before=model(.99,extra),after=model(1.01,extra);
  const effects={speed:{enabled:true,hz:600,volume:12},passby:{elapsedMs:40,speed:350}};
  const loud=sfxRegisters(before,null,0,false,undefined,0,null,1,effects),quiet=sfxRegisters(after,null,0,false,undefined,0,null,1,effects);
  assert.ok(loud[8]>5&&loud[9]>5);assert.ok(quiet[8]<=1&&quiet[9]<=1,'external sound stays very quiet beyond Mach 1');
 }
 const clock=createSpeedSoundClock();clock.observe(350,0);
 assert.equal(clock.advance(model(1.01),settings,.02).enabled,false);
 assert.equal(clock.snapshot().reason,'supersonic');
 assert.equal(clock.advance(model(.99),settings,.02).enabled,true,'decelerating below Mach 1 restores the accent');
});

test('vario, navigation, warning and acquisition voices survive the supersonic quiet mix',()=>{
 const before=model(.99,{verticalSpeed:5}),after=model(1.01,{verticalSpeed:5});
 assert.equal(sfxRegisters(after)[10],sfxRegisters(before)[10]);assert.ok(sfxRegisters(after)[10]>0);
 for(const cue of ['ground','stall','buffet']){
  const a=sfxRegisters({...before,cue},null,0,true),b=sfxRegisters({...after,cue},null,0,true);
  assert.equal(b[9],a[9]);assert.ok(b[9]>0);
 }
 for(const event of ['collect','exitOpen','clear','crash']){
  const a=sfxRegisters(before,event,40),b=sfxRegisters(after,event,40);assert.equal(b[10],a[10]);assert.ok(b[10]>0);
 }
 const a=sfxRegisters(model(.99),null,0,false,undefined,0,{elapsedMs:30});
 const b=sfxRegisters(model(1.01),null,0,false,undefined,0,{elapsedMs:30});assert.equal(b[10],a[10]);assert.ok(b[10]>0);
});

test('approaching Mach 1 increases actual vibration on-time while preserving warnings and settings',()=>{
 for(const flightVibration of ['fine','classic'])for(const active of [false,true]){
  const extra={afterburner:{active,burstSeconds:1}},s={flightVibration};
  const patterns=[.8,.9,.97,.995].map(mach=>model(mach,extra,s).pattern);
  assert.ok(patterns.every((p,i)=>!i||onTime(p)>onTime(patterns[i-1])));
  assert.ok(onTime(patterns.at(-1))>onTime(patterns[0])*1.5);
  assert.deepEqual(model(1.02,extra,s).pattern,patterns[0]);
 }
 assert.equal(onTime(model(.99,{}, {vibrationScale:0}).pattern),0);
 assert.deepEqual(model(.99,{}, {engineVibration:false}).pattern,[]);
 assert.deepEqual(model(.99,{groundClearance:.1}).pattern,model(.8,{groundClearance:.1}).pattern);
 const calls=[],h=createHaptics(p=>calls.push(p));h.arm();
 try{h.update(model(.99),settings,0);assert.ok(onTime(calls.at(-1))>180);h.stop();assert.equal(calls.at(-1),0);}finally{h.stop();}
});

test('production worklet keeps BGM gain and vario, rejects supersonic pass-by, and restores subsonic output',async()=>{
 let Processor;globalThis.AudioWorkletProcessor=class{constructor(){this.port={postMessage(){},onmessage:null};}};
 globalThis.sampleRate=48000;globalThis.currentTime=10;globalThis.registerProcessor=(_name,C)=>{Processor=C;};
 try{
  await import('../src/feedback/audio-worklet.js?supersonic-quiet');
  const p=new Processor(),send=data=>p.port.onmessage({data}),process=()=>{p.untilUpdate=0;p.process([],[[new Float32Array(128),new Float32Array(128)]]);};
  send({type:'musicGain',gain:.5});send({type:'musicReg',writes:[]});
  send({type:'state',model:model(.99),settings});process();const engine=p.registers[8];assert.ok(engine>5);
  send({type:'passby',payload:{id:1,speed:350,distance:1,side:1}});assert.equal(p.passbySnapshot().active,true);
  send({type:'state',model:model(1.01,{verticalSpeed:5}),settings});process();
  assert.equal(p.passbySnapshot().active,false);assert.equal(p.passbySnapshot().reason,'supersonic');
  assert.ok(p.registers[8]<=1&&p.registers[9]===0);assert.ok(p.registers[10]>0);
  assert.equal(p.musicPlaying,true);assert.equal(p.mixer.musicGain,.5);
  send({type:'passby',payload:{id:2,speed:350,distance:1,side:1}});assert.equal(p.passbySnapshot().active,false);
  send({type:'state',model:model(.99),settings});process();assert.equal(p.registers[8],engine);
  send({type:'stop'});assert.equal(p.speedClock.snapshot().enabled,false);
 }finally{delete globalThis.AudioWorkletProcessor;delete globalThis.sampleRate;delete globalThis.currentTime;delete globalThis.registerProcessor;}
});
