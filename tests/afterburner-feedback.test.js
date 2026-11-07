import test from 'node:test';
import assert from 'node:assert/strict';
import {flightFeedback,sfxRegisters,EVENT_FEEDBACK,afterburnerPhase} from '../src/feedback/model.js';
import {createHaptics} from '../src/feedback/haptics.js';
import {normalizeFeedbackSettings} from '../src/feedback/settings.js';
import {ChipMixer} from '../src/feedback/chip-mixer.js';

const settings=normalizeFeedbackSettings(),state={mode:'flight',altitude:25,verticalSpeed:0,throttle:1,speed:30};
const ab=(seconds=0,extra={})=>flightFeedback({...state,...extra,afterburner:{active:true,burstSeconds:seconds}},settings);
const duty=pattern=>pattern.filter((_,i)=>i%2===0).reduce((a,b)=>a+b,0)/pattern.reduce((a,b)=>a+b,0);

test('AB state is pure, invalid metadata preserves ordinary output and ignition ends after 120ms',()=>{
  const input={...state,afterburner:{active:true,burstSeconds:.04}},before=structuredClone(input),model=flightFeedback(input,settings);
  assert.deepEqual(input,before);assert.equal(model.cue,'afterburner');
  assert.equal(afterburnerPhase(model),'ignition');assert.equal(afterburnerPhase(model,.12),'roar');
  const ordinary=sfxRegisters(flightFeedback(state,settings));
  for(const invalid of [undefined,{active:false,burstSeconds:0},{active:1,burstSeconds:0},{active:true,burstSeconds:NaN},{active:true,burstSeconds:-1},{active:true,burstSeconds:Infinity}]){
    const invalidModel=flightFeedback({...state,afterburner:invalid},settings);assert.equal(afterburnerPhase(invalidModel),'off');assert.deepEqual(sfxRegisters(invalidModel),ordinary);
  }
  const ignition=sfxRegisters(model),roar=sfxRegisters(ab(1));assert.ok(ignition[8]>roar[8]);assert.ok(roar[8]>ordinary[8]);
  assert.equal(ignition[7]&1,1);assert.equal(ignition[7]&8,0);assert.notEqual(ignition[6],roar[6]);
});
test('every warning and event keeps its complete baseline registers and haptic rhythm even between pulses',()=>{
  for(const extra of [{altitude:2},{angleOfAttack:25*Math.PI/180},{angleOfAttack:16*Math.PI/180}]){
    const baseline=flightFeedback({...state,...extra},settings),boost=ab(.04,extra);
    assert.equal(boost.cue,baseline.cue);assert.deepEqual(boost.pattern,baseline.pattern);
    for(const pulse of [false,true])assert.deepEqual(sfxRegisters(boost,null,0,pulse),sfxRegisters(baseline,null,0,pulse));
  }
  for(const [event,definition]of Object.entries(EVENT_FEEDBACK))for(const elapsed of [0,definition.duration/2,definition.duration-1]){
    assert.deepEqual(sfxRegisters(ab(.04),event,elapsed),sfxRegisters(flightFeedback(state,settings),event,elapsed));
  }
  // A suppressed ignition is never queued for playback when the warning later clears.
  assert.equal(afterburnerPhase(ab(.5)),'roar');
});
test('vario and navigation keep channel C and duck AB, with no extra music writes or nonfinite samples',()=>{
  const roar=sfxRegisters(ab(1)),varioState={...state,verticalSpeed:2};
  const baseline=flightFeedback(varioState,settings),boost=ab(.04,{verticalSpeed:2});
  const normal=sfxRegisters(baseline,null,0,false,new Uint8Array(14),0),ducked=sfxRegisters(boost,null,0,false,new Uint8Array(14),0);
  for(const index of [4,5,10])assert.equal(ducked[index],normal[index]);assert.ok(ducked[8]<roar[8]);
  const nav={elapsedMs:30},navNormal=sfxRegisters(flightFeedback(state,settings),null,0,false,new Uint8Array(14),0,nav),navAB=sfxRegisters(ab(.04),null,0,false,new Uint8Array(14),0,nav);
  for(const index of [4,5,10])assert.equal(navAB[index],navNormal[index]);assert.ok(navAB[8]<roar[8]);
  const mixer=new ChipMixer(),music=[...mixer.musicPsg.psg.regs];mixer.writeSfx(navAB);
  const left=new Float32Array(4096),right=new Float32Array(4096);mixer.render(left,right,.8);
  assert.deepEqual([...mixer.musicPsg.psg.regs],music);assert.ok(left.every(Number.isFinite));assert.ok(right.every(Number.isFinite));assert.ok(left.some(n=>n!==0));
});
test('AB stronger duty honors all vibration controls, start gesture and event ownership',()=>{
  const normal=flightFeedback(state,settings),fine=ab(),classic=flightFeedback({...state,afterburner:{active:true,burstSeconds:0}},{...settings,flightVibration:'classic'});
  assert.ok(duty(fine.pattern)>duty(normal.pattern));assert.deepEqual(fine.pattern,[30,30,30,30,30,30,30,30]);assert.deepEqual(classic.pattern,[120,280]);
  const muted=flightFeedback({...state,afterburner:{active:true,burstSeconds:0}},{...settings,engineVibration:false});assert.deepEqual(muted.pattern,[]);assert.equal(muted.afterburner.active,true);
  const calls=[],h=createHaptics(p=>calls.push(p));h.update(fine,settings,0);assert.equal(calls.length,0);h.arm();h.update(normal,settings,1);h.update(fine,settings,2);assert.deepEqual(calls.at(-1),fine.pattern);
  h.event('collect',settings,3);const count=calls.length;h.update(fine,settings,100);assert.equal(calls.length,count);
  h.update(fine,{...settings,vibration:false},101);assert.equal(calls.at(-1),0);
  h.update(fine,{...settings,vibrationScale:0},102);h.stop();assert.equal(calls.at(-1),0);
});

test('worklet advances the ignition clock independently of state/haptic refresh and stop clears actual AB metrics',async()=>{
  let Processor;const messages=[];
  globalThis.AudioWorkletProcessor=class{constructor(){this.port={postMessage:m=>messages.push(m),onmessage:null};}};
  globalThis.sampleRate=48000;globalThis.currentTime=10;globalThis.registerProcessor=(_name,C)=>{Processor=C;};
  try{
    await import('../src/feedback/audio-worklet.js?unit-afterburner');const p=new Processor(),send=data=>p.port.onmessage({data});
    send({type:'state',model:ab(0),settings});globalThis.currentTime=10.04;p.process([],[[new Float32Array(128),new Float32Array(128)]]);const ignition=p.registers[8];
    send({type:'state',model:ab(.04),settings,phase:{restarted:true,elapsedMs:0}});globalThis.currentTime=10.13;p.untilUpdate=0;p.process([],[[new Float32Array(128),new Float32Array(128)]]);assert.ok(p.registers[8]<ignition);
    send({type:'poll'});assert.equal(messages.at(-1).afterburner.phase,'roar');
    send({type:'event',kind:'collect',settings});send({type:'poll'});assert.equal(messages.at(-1).afterburner.phase,'suppressed');
    send({type:'stop'});send({type:'poll'});assert.equal(messages.at(-1).afterburner.active,false);
    const output=new Float32Array(128);p.process([],[[output]]);assert.ok(output.every(n=>n===0));
    send({type:'state',model:ab(.01,{verticalSpeed:2}),settings});send({type:'poll'});assert.equal(messages.at(-1).afterburner.phase,'roar');
    send({type:'state',model:ab(.01,{altitude:2}),settings});send({type:'poll'});assert.equal(messages.at(-1).afterburner.phase,'suppressed');send({type:'stop'});
  }finally{delete globalThis.AudioWorkletProcessor;delete globalThis.sampleRate;delete globalThis.currentTime;delete globalThis.registerProcessor;}
});
