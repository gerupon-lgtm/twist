import test from 'node:test';import assert from 'node:assert/strict';
import {createHaptics} from '../src/feedback/haptics.js';
import {flightFeedback} from '../src/feedback/model.js';
import {createSupersonicWind,windPresentation} from '../src/supersonic-wind.js';
const settings={sound:true,sfx:true,vibration:true,vibrationScale:1},event={type:'sonic-transition',direction:'up',serial:1,id:1,attemptId:1,atSeconds:5,mach:1.01};
test('sonic crossing is a sustained double impact, retains its full duration against pickups, and yields to danger',()=>{
 const calls=[],h=createHaptics(p=>calls.push(p));h.arm();try{
  const m=flightFeedback({mode:'flight',speed:340,altitude:1500,groundClearance:1499,throttle:1,supersonic:{mach:1}},settings);
  h.event('collect',settings,0);assert.equal(h.sonic(event,settings,1,m),true);assert.deepEqual(calls.at(-1),[280,45,200]);
  const count=calls.length;h.event('collect',settings,40);h.update(m,settings,300);assert.equal(calls.length,count);
  const danger={...m,cue:'ground',pattern:[85,100,85,430],soundPattern:[85,100,85,430],cycle:700};h.update(danger,settings,301);assert.deepEqual(calls.at(-1),danger.pattern);
 }finally{h.stop();}
});
test('wind keeps growing past Mach 1 and contains long peripheral traces with fixed allocation',()=>{
 assert.ok(windPresentation(680).strength>windPresentation(400).strength);
 const fx=createSupersonicWind(),positions=fx.mesh.geometry.attributes.position.array;try{
  fx.update({speed:680,timeSeconds:.25,aspect:390/844});const d=fx.snapshot();assert.ok(d.windRimCount>=12);assert.ok(d.windCount<=48);assert.equal(positions,fx.mesh.geometry.attributes.position.array);
  const halfH=Math.tan(64*Math.PI/360)*2.2;for(let i=0;i<fx.mesh.geometry.drawRange.count;i++)assert.ok(Math.max(Math.abs(positions[i*3]/(halfH*390/844)),Math.abs(positions[i*3+1]/halfH))>=.78-1e-6);
  fx.update({speed:680,reducedMotion:true});assert.equal(fx.mesh.visible,false);
 }finally{fx.dispose();}
});
