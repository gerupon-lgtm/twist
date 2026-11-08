import test from 'node:test';
import assert from 'node:assert/strict';
import {flightFeedback,EVENT_FEEDBACK} from '../src/feedback/model.js';
import {createHaptics} from '../src/feedback/haptics.js';
import {normalizeFeedbackSettings} from '../src/feedback/settings.js';
const state={mode:'flight',altitude:25,verticalSpeed:0,throttle:.5,speed:6};
const defaults=normalizeFeedbackSettings();
test('fine flight uses short 60ms cycles, classic retains the former 400ms cycle, cues differ by duty and rhythm',()=>{
  const fine=flightFeedback(state,defaults),old=flightFeedback(state,{...defaults,flightVibration:'classic'});
  assert.deepEqual(fine.pattern,[11,49,11,49,11,49,11,49]);assert.equal(fine.cycle,240);
  assert.deepEqual(old.pattern,[3,397]);assert.equal(old.cycle,400);assert.deepEqual(fine.soundPattern,old.soundPattern);
  const stall=flightFeedback({...state,angleOfAttack:40*Math.PI/180},defaults);
  const duty=pattern=>pattern.filter((_,i)=>i%2===0).reduce((a,b)=>a+b,0)/pattern.reduce((a,b)=>a+b,0);
  assert.ok(duty(stall.pattern)>.6);assert.ok(duty(fine.pattern)<.2);
  assert.deepEqual(EVENT_FEEDBACK.collect.pattern,[30,80,70]);
  for(const p of [fine.pattern,stall.pattern,EVENT_FEEDBACK.collect.pattern,EVENT_FEEDBACK.clear.pattern])assert.ok(p.length<=10);
  assert.deepEqual(stall.soundPattern,flightFeedback({...state,angleOfAttack:40*Math.PI/180},{...defaults,flightVibration:'classic'}).soundPattern);
});
test('haptic batches preserve the effects phase and an event interrupts the fine train immediately',()=>{
  const calls=[],h=createHaptics(p=>calls.push(p)),m=flightFeedback(state,defaults);h.arm();
  assert.deepEqual(h.update(m,defaults,0),{restarted:true,elapsedMs:0});
  assert.deepEqual(h.update(m,defaults,240),{restarted:true,elapsedMs:240});
  h.event('collect',defaults,250);assert.equal(calls.at(-2),0);assert.deepEqual(calls.at(-1),[30,80,70]);
  assert.equal(h.update(m,defaults,300),undefined);assert.deepEqual(h.update(m,defaults,550),{restarted:true,elapsedMs:0});h.stop();assert.equal(calls.at(-1),0);
});
test('enum defaults and persisted invalid values cannot create arbitrary music groups or patterns',()=>{
  assert.equal(defaults.flightVibration,'fine');assert.equal(defaults.musicSet,'ignition');
  for(const invalid of [null,undefined,'__proto__',[],42])assert.equal(normalizeFeedbackSettings({musicSet:invalid}).musicSet,'ignition');
  assert.equal(normalizeFeedbackSettings({musicSet:'brave',flightVibration:'classic'}).musicSet,'brave');
});
test('shared ground and buffet rhythms resynchronize after delayed frames instead of accumulating drift',()=>{
  const h=createHaptics(()=>{});h.arm();
  for(const model of [flightFeedback({...state,altitude:2},defaults),flightFeedback({...state,angleOfAttack:16*Math.PI/180},defaults)]){
    h.stop();h.update(model,defaults,0);
    assert.deepEqual(h.update(model,defaults,model.cycle+10),{restarted:true,elapsedMs:0});
    assert.deepEqual(h.update(model,defaults,model.cycle*2+20),{restarted:true,elapsedMs:0});
  }h.stop();
});
