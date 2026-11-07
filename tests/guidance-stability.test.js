import test from 'node:test';import assert from 'node:assert/strict';
import {advanceGuidanceTurn} from '../src/guidance-stability.js';
const sample=(ratio,mode='target',yaw=15)=>({rawMode:mode,mode,rawYawErrorDegrees:yaw,yawErrorDegrees:yaw,targetBearingDegrees:34,turnCircleRatio:ratio});
test('radius hysteresis and 0.6-second hold prevent noisy target/go-around flips',()=>{
 let previous=advanceGuidanceTurn(sample(1.2),null,{now:0,dt:0});
 for(const [now,ratio]of [[100,.95],[200,1.05],[300,.85],[500,.85]]){previous=advanceGuidanceTurn(sample(ratio,'go-around',-15),previous,{now,dt:1/60});assert.equal(previous.mode,'target');}
 previous=advanceGuidanceTurn(sample(.85,'go-around',-15),previous,{now:600,dt:1/60});assert.equal(previous.mode,'go-around');assert.ok(previous.yawDegrees>=12.5);
});
test('held go-around sign survives radius boundary and exits through a bounded zero crossing',()=>{
 let previous=advanceGuidanceTurn(sample(.8,'go-around',-15),null,{now:0,dt:0});
 previous=advanceGuidanceTurn(sample(1.05),previous,{now:700,dt:1/60});assert.equal(previous.mode,'go-around');assert.equal(previous.yawDegrees,-15);
 const values=[];for(let frame=0;frame<16;frame++){const next=advanceGuidanceTurn(sample(1.2),previous,{now:800+frame*1000/60,dt:1/60});assert.ok(Math.abs(next.yawDegrees-previous.yawDegrees)<=2.500001);assert.ok(Math.abs(next.yawDegrees)<=15);values.push(next.yawDegrees);previous=next;}
 assert.ok(values.some(yaw=>Math.abs(yaw)<1e-8));assert.equal(values.at(-1),15);
});
test('recovery overrides held turns immediately and target changes still slew',()=>{
 const previous=advanceGuidanceTurn(sample(.8,'go-around',-15),null,{now:0,dt:0});
 const recovering=advanceGuidanceTurn({...sample(.8),mode:'recover',rawMode:'recover',rawYawErrorDegrees:0},previous,{now:10,dt:1/60});assert.equal(recovering.mode,'recover');assert.equal(recovering.yawDegrees,0);
 const next=advanceGuidanceTurn(sample(1.2),previous,{now:20,dt:1/60,targetChanged:true});assert.equal(next.mode,'target');assert.equal(next.yawDegrees,-12.5);
});
