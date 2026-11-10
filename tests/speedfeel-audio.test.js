import test from 'node:test';
import assert from 'node:assert/strict';
import {flightFeedback,sfxRegisters,EVENT_FEEDBACK} from '../src/feedback/model.js';
import {normalizeFeedbackSettings} from '../src/feedback/settings.js';

// Isolate the original AB roar/release; the new continuous speed tone has its own coverage.
const settings={...normalizeFeedbackSettings(),vario:false,passbySound:true,speedSound:false};
const state={mode:'flight',altitude:30,verticalSpeed:0,throttle:1};
const model=(speed=30,active=false,extra={})=>flightFeedback({...state,speed,afterburner:{active,burstSeconds:1},...extra},settings);

test('true wind speed, volume and shared noise pitch keep increasing through 18, 30 and 45 m/s, including AB',()=>{
  const values=[0,18,30,45].map(speed=>model(speed));
  assert.deepEqual(values.map(m=>m.speed),[0,18,30,45]);assert.deepEqual(values.map(m=>m.wind),[0,.4,2/3,1]);
  for(const active of [false,true]){
    const registers=[0,18,30,45].map(speed=>sfxRegisters(model(speed,active)));
    assert.ok(registers.every((r,i)=>!i||registers[i-1][8]<r[8]));
    assert.ok(registers.every((r,i)=>!i||registers[i-1][6]>r[6]));
  }
  assert.deepEqual(model(45,true).pattern,[30,30,30,30,30,30,30,30]);
  assert.deepEqual(flightFeedback({...state,speed:45,afterburner:{active:true,burstSeconds:0}},{...settings,flightVibration:'classic'}).pattern,[120,280]);
  assert.deepEqual(model(45).pattern,[14,46,14,46,14,46,14,46]);
});

test('worklet fades AB on actual audio time, drops blocked passbys, and merges/cancels only tagged layer writes',async()=>{
  let Processor;const messages=[];
  globalThis.AudioWorkletProcessor=class{constructor(){this.port={postMessage:m=>messages.push(m),onmessage:null};}};
  globalThis.sampleRate=48000;globalThis.currentTime=10;globalThis.registerProcessor=(_name,C)=>{Processor=C;};
  try{
    await import('../src/feedback/audio-worklet.js?unit-speedfeel');
    const p=new Processor(),send=data=>p.port.onmessage({data}),process=()=>{p.untilUpdate=0;p.process([],[[new Float32Array(128),new Float32Array(128)]]);};
    send({type:'state',model:model(30,true),settings});process();const roar=p.registers[9];assert.ok(roar>0);
    send({type:'state',model:model(),settings});globalThis.currentTime=10.07;process();assert.ok(p.registers[9]>0&&p.registers[9]<roar);
    assert.equal(p.afterburnerSnapshot().phase,'release');globalThis.currentTime=10.16;process();assert.equal(p.registers[9],0);assert.equal(p.afterburnerSnapshot().phase,'off');
    const payload={id:'tower-1',speed:40,distance:3,side:-1};
    send({type:'passby',payload});assert.equal(p.passbySnapshot().accepted,1);assert.equal(p.passbySnapshot().active,true);
    send({type:'event',kind:'collect',settings});assert.equal(p.passbySnapshot().active,false);
    send({type:'passby',payload});assert.equal(p.passbySnapshot().suppressed,1);assert.equal(p.passbySnapshot().reason,'event');
    globalThis.currentTime=11;process();assert.equal(p.passbySnapshot().active,false,'a suppressed crossing is never replayed');
    for(const extra of [{altitude:2},{angleOfAttack:25*Math.PI/180},{angleOfAttack:16*Math.PI/180}]){
      send({type:'state',model:model(40,true,extra),settings});send({type:'passby',payload});assert.equal(p.passbySnapshot().reason,'warning');
      for(const pulse of [false,true])assert.deepEqual(sfxRegisters(model(40,true,extra),null,0,pulse,undefined,0,null,1,{passby:{...payload,elapsedMs:30},afterburnerRelease:.7}),sfxRegisters(model(40,false,extra),null,0,pulse));
    }
    for(const event of Object.keys(EVENT_FEEDBACK))assert.deepEqual(sfxRegisters(model(40,true),event,10,false,undefined,0,null,1,{passby:{...payload,elapsedMs:30}}),sfxRegisters(model(40),event,10));
    send({type:'state',model:model(),settings:{...settings,passbySound:false}});send({type:'passby',payload});assert.equal(p.passbySnapshot().reason,'disabled');
    send({type:'state',model:model(),settings});send({type:'passby',payload:{...payload,speed:NaN}});assert.equal(p.passbySnapshot().reason,'invalid');
    const writes=[];p.mixer.writeMusic=(addr,value)=>writes.push([addr,value]);
    send({type:'musicReg',writes:[{addr:1,value:1,at:12,tag:'base'},{addr:2,value:2,at:11.5,tag:'afterburner-a'},{addr:3,value:3,at:11.7,tag:'base'}]});
    assert.deepEqual(p.musicQueue.map(w=>w.addr),[2,3,1]);send({type:'musicCancel',tag:'afterburner-a'});
    send({type:'musicReg',writes:[{addr:4,value:4,at:11.6,tag:'afterburner-a'},{addr:5,value:5,at:11.8,tag:'afterburner-b'}]});
    assert.deepEqual(p.musicQueue.map(w=>w.addr),[3,5,1]);globalThis.currentTime=12.1;process();assert.deepEqual(writes,[[3,3],[5,5],[1,1]]);
    send({type:'stop'});send({type:'passby',payload});assert.equal(p.passbySnapshot().reason,'inactive');assert.equal(p.afterburnerSnapshot().phase,'off');
    const out=new Float32Array(128);p.process([],[[out]]);assert.ok(out.every(value=>value===0));
  }finally{delete globalThis.AudioWorkletProcessor;delete globalThis.sampleRate;delete globalThis.currentTime;delete globalThis.registerProcessor;}
});
