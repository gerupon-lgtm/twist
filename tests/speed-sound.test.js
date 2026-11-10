import test from 'node:test';import assert from 'node:assert/strict';
import {createSpeedSoundClock} from '../src/feedback/speed-sound.js';
import {flightFeedback,sfxRegisters} from '../src/feedback/model.js';
const settings={sound:true,sfx:true,speedSound:true},model=speed=>({speed,wind:speed/680,power:1,speedSound:{reference:680},vario:{active:false}});
test('speed SE rises with real airspeed and has a separate, smooth acceleration accent',()=>{
 const clock=createSpeedSoundClock();clock.observe(200,0);let slow;
 for(let i=0;i<200;i++)slow=clock.advance(model(200),settings,.005,false);
 slow={...slow};
 clock.observe(220,.04);let accelerated;for(let i=0;i<20;i++)accelerated=clock.advance(model(220),settings,.005,false);
 assert.ok(accelerated.hz>slow.hz+20);assert.ok(accelerated.acceleration>0);
 clock.observe(680,2);let fast;for(let i=0;i<200;i++)fast=clock.advance(model(680),settings,.005,false);
 assert.ok(fast.hz>slow.hz);assert.ok(fast.volume>0&&fast.volume<=12);assert.ok(fast.flow>slow.flow);
});
test('speed SE never leaks into muted, preview, stopped, warning or sonic-priority output',()=>{
 const c=createSpeedSoundClock();c.observe(340,0);c.advance(model(340),settings,.02,false);
 for(const [m,s,blocked]of [[model(340),{...settings,sfx:false},false],[model(340),{...settings,sound:false},false],[{},settings,false],[model(340),settings,true]]){
  const cue=c.advance(m,s,.02,blocked);assert.equal(cue.enabled,false);assert.equal(cue.volume,0);
 }
 c.reset();assert.equal(c.snapshot().flow,0);assert.equal(c.snapshot().acceleration,0);
});
test('initial speed and a long interrupted observation do not masquerade as acceleration',()=>{
 const c=createSpeedSoundClock();c.observe(340,10);let a=c.advance(model(340),settings,.02,false);assert.equal(a.acceleration,0);
 c.observe(680,12);a=c.advance(model(680),settings,.02,false);assert.equal(a.acceleration,0);
});

test('the speed tone attack never reduces the existing AB roar or its release',()=>{
 const c=createSpeedSoundClock(),state={mode:'flight',speed:30,altitude:30,throttle:1,afterburner:{active:true,burstSeconds:1}};
 const m=flightFeedback(state,{...settings,vario:false});c.observe(30,10);
 const cue=c.advance(m,settings,128/48000,false);assert.ok(cue.enabled&&cue.volume<.5);
 for(const [model,release]of [[m,0],[{...m,afterburner:{active:false,burstSeconds:0}},.5]]){
  const legacy=sfxRegisters(model,null,0,false,undefined,0,null,1,{afterburnerRelease:release});
  const combined=sfxRegisters(model,null,0,false,undefined,0,null,1,{afterburnerRelease:release,speed:cue});
  assert.equal(combined[9],legacy[9]);assert.ok(combined[9]>0);
 }
});
