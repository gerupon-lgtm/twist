import test from 'node:test';
import assert from 'node:assert/strict';
import { pitchLadderAngles,verticalSpeedIndicator,varioCue } from '../src/cockpit-aids.js';
import { normalizeFlightSettings } from '../src/flight-settings.js';
import { flightFeedback,sfxRegisters } from '../src/feedback/model.js';
import { createScenery } from '../src/scenery.js';

test('ladder selects inclusive angles around the current elevation, including inverted and invalid poses',()=>{
 assert.deepEqual(pitchLadderAngles(0),[-10,-5,5,10]);
 assert.deepEqual(pitchLadderAngles(15),[5,10,15,20,25]);
 assert.deepEqual(pitchLadderAngles(-30,5),[-35,-30,-25]);
 assert.deepEqual(pitchLadderAngles(100,10),[70,75,80,85]);
 for(const value of [NaN,Infinity,undefined])assert.deepEqual(pitchLadderAngles(value),[-10,-5,5,10]);
 assert.ok(pitchLadderAngles(0,100).every(n=>Math.abs(n)<=30));
});
test('climb/descent bar uses signed direction, a neutral band, and a bounded length',()=>{
 assert.equal(verticalSpeedIndicator(.149).length,0);assert.equal(verticalSpeedIndicator(-.149).direction,'level');
 assert.equal(verticalSpeedIndicator(.15).direction,'up');assert.equal(verticalSpeedIndicator(-.15).direction,'down');
 assert.ok(verticalSpeedIndicator(2).length>verticalSpeedIndicator(1).length);
 assert.equal(verticalSpeedIndicator(1000).length,46);assert.equal(verticalSpeedIndicator(-1000).length,46);
 for(const value of [NaN,Infinity,null])assert.equal(verticalSpeedIndicator(value).length,0);
});
test('vario gets higher and closer during stronger climb, and lower/longer during fast descent',()=>{
 const slow=varioCue(.3),fast=varioCue(6),down=varioCue(-2);
 assert.equal(varioCue(.299).active,false);assert.equal(varioCue(-1.999).active,false);
 assert.equal(slow.active,true);assert.ok(fast.hz>slow.hz);assert.ok(fast.periodMs<slow.periodMs);
 assert.ok(down.hz<slow.hz&&down.onMs>slow.onMs);assert.ok(varioCue(-8).hz<down.hz);
 for(const value of [NaN,Infinity,-Infinity])assert.equal(varioCue(value).active,false);
 assert.equal(varioCue(4,false).active,false);assert.ok(varioCue(1000).hz<=1240);
});
test('warnings and events take precedence over vario without changing haptic patterns',()=>{
 const state={mode:'flight',groundClearance:30,altitude:30,throttle:.5,speed:6,verticalSpeed:2};
 const model=flightFeedback(state,{vario:true}),without=flightFeedback(state,{vario:false});
 assert.deepEqual(model.pattern,without.pattern);
 const on=sfxRegisters(model,null,0,false),off=sfxRegisters(without,null,0,false);
 assert.ok(on[10]>0);assert.equal(off[10],0);
 for(const cue of ['ground','stall','buffet'])assert.equal(sfxRegisters({...model,cue},null,0,true)[10],0);
 assert.deepEqual(sfxRegisters(model,'collect',0,true),sfxRegisters(without,'collect',0,true));
 assert.equal(sfxRegisters(model,null,model.vario.onMs+1,false)[10],0);
});
test('new settings preserve old defaults and distinguish automatic FOV from explicit bounds',()=>{
 const s=normalizeFlightSettings({maxPitch:25});assert.equal(s.maxPitch,25);assert.equal(s.ladderRange,10);assert.equal(s.cockpitFov,0);
 assert.equal(normalizeFlightSettings({cockpitFov:40}).cockpitFov,60);assert.equal(normalizeFlightSettings({cockpitFov:200}).cockpitFov,100);
 assert.equal(normalizeFlightSettings({cockpitFov:NaN}).cockpitFov,0);assert.equal(normalizeFlightSettings({ladderRange:100}).ladderRange,30);
});
test('scenery is static, fogless and grouped in eight batches, with no collision objects',()=>{
 const {group,details}=createScenery();assert.deepEqual(details,{islands:12,towerHeight:116,clouds:12,suns:1,fogless:true,collisions:false,batches:8});
 assert.equal(group.children.length,8);
 let instances=0;group.traverse(object=>{if(object.material)assert.equal(object.material.fog,false);if(object.isInstancedMesh)instances+=object.count;});
 assert.ok(instances>70);assert.equal(group.children.filter(o=>o.isInstancedMesh).length,5);
 group.traverse(o=>{o.geometry?.dispose();if(o.isInstancedMesh)o.dispose();});
});
