import test from 'node:test';
import assert from 'node:assert/strict';
import {flightFeedback,sfxRegisters,EVENT_FEEDBACK} from '../src/feedback/model.js';
import {createHaptics} from '../src/feedback/haptics.js';
import {createSonicEventConsumer,validSonicTransition} from '../src/feedback/supersonic-model.js';

const settings={sound:true,sfx:true,volume:25,vario:false,vibration:true,vibrationScale:1,engineVibration:true};
const state={mode:'flight',speed:200,altitude:1500,groundClearance:1499.52,verticalSpeed:0,throttle:.5,supersonic:{attemptId:1,mach:200/340,gLoad:1,events:[]}};
const event=(serial=1,direction='up',attemptId=1)=>({attemptId,id:serial,serial,type:'sonic-transition',direction,atSeconds:5,mach:direction==='up'?1.01:.99});
const model=(speed=200,extra={})=>flightFeedback({...state,speed,...extra},settings);

test('sonic wind amplitude, pitch and engine frequency use true 0..680 speed while ordinary model stays capped at45',()=>{
  const values=[0,200,340,680].map(speed=>model(speed));assert.deepEqual(values.map(m=>m.speed),[0,200,340,680]);
  assert.equal(values.at(-1).wind,1);
  for(const ab of [false,true]){
    const regs=[0,200,340,680].map(speed=>sfxRegisters(model(speed,{afterburner:{active:ab,burstSeconds:1}})));
    assert.ok(regs.every((r,i)=>!i||r[8]>regs[i-1][8]));assert.ok(regs.every((r,i)=>!i||r[6]<regs[i-1][6]));
  }
  assert.ok(values.every((v,i)=>!i||v.engineHz>values[i-1].engineHz));
  const ordinary=flightFeedback({...state,supersonic:undefined,speed:680},settings);assert.equal(ordinary.speed,45);assert.equal(ordinary.wind,1);assert.equal(ordinary.supersonic,undefined);
  assert.deepEqual(ordinary.pattern,[11,49,11,49,11,49,11,49]);
});
test('sea warnings use the lowest hull clearance without treating center altitude as zero, and sonic never replaces priority audio',()=>{
  const warning=model(680,{groundClearance:.2});assert.equal(warning.cue,'ground');assert.equal(state.altitude,1500);
  for(const extra of [{groundClearance:.2},{angleOfAttack:25*Math.PI/180},{angleOfAttack:16*Math.PI/180}]){
    const m=model(340,extra);for(const pulse of [false,true])assert.deepEqual(sfxRegisters(m,null,0,pulse,undefined,0,null,0,{sonic:{...event(),elapsedMs:30}}),sfxRegisters(m,null,0,pulse));
  }
  for(const kind of Object.keys(EVENT_FEEDBACK))assert.deepEqual(sfxRegisters(model(),kind,20,false,undefined,0,null,0,{sonic:{...event(),elapsedMs:30}}),sfxRegisters(model(),kind,20));
  assert.notDeepEqual(sfxRegisters(model(),null,0,false,undefined,0,null,0,{sonic:{...event(),elapsedMs:30}}),sfxRegisters(model()));
});
test('each ordered attempt crossing is consumed once even when the caller suppresses it',()=>{
  const consumer=createSonicEventConsumer(),sample=events=>({...state,supersonic:{attemptId:1,events}});
  assert.equal(consumer.consume(sample([event(1)])).length,1); // caller can be paused/muted
  assert.equal(consumer.consume(sample([event(1)])).length,0);
  assert.equal(consumer.consume(sample([event(1),event(2,'down')])).length,1);
  assert.equal(consumer.consume({...state,supersonic:{attemptId:2,events:[event(0,'up',2)]}}).length,1);
  assert.equal(consumer.consume(sample([event(99)])).length,0,'retired attempt cannot replay');
  assert.equal(validSonicTransition({...event(),mach:NaN}),false);
  assert.equal(consumer.snapshot().consumed,3);
});
test('sonic vibration requires arming, yields to current warnings/events, and stops immediately',()=>{
  const calls=[],h=createHaptics(pattern=>calls.push(pattern));
  try{
    assert.equal(h.sonic(event(),settings,0,model()),false);h.arm();
    assert.equal(h.sonic(event(),settings,1,model(200,{groundClearance:.1})),false);
    assert.equal(h.sonic(event(),settings,2,model()),true);assert.deepEqual(calls.at(-1),[150,35,90]);
    const warning=model(200,{groundClearance:.1});h.update(warning,settings,3);assert.deepEqual(calls.at(-1),warning.pattern);
    h.event('collect',settings,4);assert.equal(h.sonic(event(2,'down'),settings,5,model()),false);
    h.stop();assert.equal(calls.at(-1),0);
    assert.equal(h.sonic(event(),{...settings,vibration:false},1000,model()),false);
  }finally{h.stop();}
});
test('real worklet consumes muted/stopped/duplicate transitions and immediately prioritizes warnings and collection',async()=>{
  let Processor;const messages=[];
  globalThis.AudioWorkletProcessor=class{constructor(){this.port={postMessage:m=>messages.push(m),onmessage:null};}};
  globalThis.sampleRate=48000;globalThis.currentTime=10;globalThis.registerProcessor=(_name,C)=>{Processor=C;};
  try{
    await import('../src/feedback/audio-worklet.js?unit-supersonic');
    const p=new Processor(),send=data=>p.port.onmessage({data}),process=()=>{p.untilUpdate=0;p.process([],[[new Float32Array(128),new Float32Array(128)]]);};
    send({type:'state',model:model(340),settings});send({type:'sonic',event:event()});globalThis.currentTime=10.03;process();
    assert.equal(p.sonicSnapshot().accepted,1);assert.ok(p.registers[9]>0);
    send({type:'sonic',event:event()});assert.equal(p.sonicSnapshot().reason,'duplicate');
    send({type:'state',model:model(340,{groundClearance:.1}),settings});assert.equal(p.sonicSnapshot().active,false);
    send({type:'sonic',event:event(2,'down')});assert.equal(p.sonicSnapshot().reason,'warning');
    send({type:'state',model:model(340),settings:{...settings,sound:false}});send({type:'sonic',event:event(3)});assert.equal(p.sonicSnapshot().reason,'disabled');
    send({type:'state',model:model(340),settings});send({type:'sonic',event:event(3)});assert.equal(p.sonicSnapshot().reason,'duplicate');
    send({type:'sonic',event:event(4)});send({type:'event',kind:'collect',settings});assert.equal(p.sonicSnapshot().active,false);
    globalThis.currentTime=11;process();assert.equal(p.sonicSnapshot().active,false);
    send({type:'stop'});send({type:'sonic',event:event(5,'down')});assert.equal(p.sonicSnapshot().reason,'inactive');
    send({type:'state',model:model(),settings});send({type:'sonic',event:event(5,'down')});assert.equal(p.sonicSnapshot().reason,'duplicate');
    send({type:'sonic',event:event(6,'down')});assert.equal(p.sonicSnapshot().active,true);send({type:'stop'});
    const out=new Float32Array(128);p.process([],[[out]]);assert.ok(out.every(value=>value===0));
    assert.ok(messages.some(message=>message.sonic?.direction==='down'));
  }finally{delete globalThis.AudioWorkletProcessor;delete globalThis.sampleRate;delete globalThis.currentTime;delete globalThis.registerProcessor;}
});
