import test from 'node:test';
import assert from 'node:assert/strict';
import {FLIGHT_TURN,normalizeTurnGravity,flightYawForBank,flightTurnRadius,applyHorizontalTurn} from '../src/flight-turn.js';
const rad=degrees=>degrees*Math.PI/180;
const near=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} vs ${expected}`);

test('new default turn strength produces the worked 10/20/30 m/s reference radii',()=>{
  assert.equal(FLIGHT_TURN.defaultGravity,9.8);
  near(flightTurnRadius(10,rad(30)),17.673987832335484);
  near(flightTurnRadius(20,rad(30)),70.69595132934194);
  near(flightTurnRadius(30,rad(30)),159.06589049101933);
  near(flightTurnRadius(10,rad(35)),14.572938844307291);
});
test('turns are left/right symmetric and strength 3 remains a meaningful old-law comparison',()=>{
  for(const gravity of [3,9.8,15]){
    near(flightYawForBank(rad(-30),10,gravity),-flightYawForBank(rad(30),10,gravity));
    near(flightTurnRadius(10,rad(-30),gravity),flightTurnRadius(10,rad(30),gravity));
  }
  near(flightTurnRadius(10,rad(35),3),47.60493355807049);
  assert.ok(flightTurnRadius(10,rad(30),15)<flightTurnRadius(10,rad(30),9.8));
});
test('low-speed denominator, rate cap and rest behavior are explicit',()=>{
  near(flightYawForBank(rad(40),1,15),2.0977490779432006);
  near(flightYawForBank(rad(40),6,15),2.0977490779432006);
  near(flightYawForBank(rad(89),6,15),2.5);
  near(flightTurnRadius(6,rad(89),15),2.4);
  assert.equal(flightYawForBank(rad(40),0),0);assert.equal(flightTurnRadius(0,rad(40)),0);
  assert.equal(flightTurnRadius(10,0),Infinity);
});
test('invalid turn inputs are safe and strengths stay in the exposed 3..15 range',()=>{
  for(const value of [undefined,null,NaN,Infinity,'10'])assert.equal(normalizeTurnGravity(value),9.8);
  assert.equal(normalizeTurnGravity(-10),3);assert.equal(normalizeTurnGravity(100),15);
  for(const speed of [-1,NaN,Infinity,undefined])assert.equal(flightYawForBank(rad(30),speed),0);
  for(const angle of [NaN,Infinity,undefined])assert.equal(flightYawForBank(angle,10),0);
});
test('horizontal correction removes duplicate bank curvature while keeping real-bank speed and Y',()=>{
  const banked={x:3,y:-2,z:-4},unbanked={x:0,y:7,z:-10};
  const result=applyHorizontalTurn(banked,unbanked,Math.PI/2,1);
  near(result.x,5);near(result.z,0);assert.equal(result.y,-2);
  near(Math.hypot(result.x,result.z),5);near(Math.hypot(result.x,result.y,result.z),Math.sqrt(29));
  assert.deepEqual(banked,{x:3,y:-2,z:-4});assert.deepEqual(unbanked,{x:0,y:7,z:-10});
});
test('zero bank rate retains unbanked thrust/recovery heading alignment rather than pre-step sideslip',()=>{
  const banked={x:0,y:1,z:-10},unbanked={x:3,y:1,z:-4};
  const result=applyHorizontalTurn(banked,unbanked,0,.05);
  near(result.x,6);near(result.z,-8);assert.equal(result.y,1);
});
test('horizontal correction handles left turns, zero travel and invalid elapsed time without mutation',()=>{
  const velocity={x:0,y:3,z:-10};
  near(applyHorizontalTurn(velocity,velocity,-Math.PI/2,1).x,-10);
  assert.deepEqual(applyHorizontalTurn({x:0,y:-4,z:0},velocity,1,1),{x:0,y:-4,z:0});
  for(const dt of [0,-1,NaN,Infinity])assert.deepEqual(applyHorizontalTurn(velocity,{x:10,y:0,z:0},1,dt),velocity);
  const invalid=applyHorizontalTurn({x:NaN,y:2,z:-10},null,Infinity,.1);
  assert.ok(Object.values(invalid).every(Number.isFinite));assert.equal(invalid.y,2);
});
