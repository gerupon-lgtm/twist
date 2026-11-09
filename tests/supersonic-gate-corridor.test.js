import test from 'node:test';import assert from 'node:assert/strict';
import {computeSupersonicGuidance} from '../src/supersonic-guidance.js';
import {advanceGuidanceTurn} from '../src/guidance-stability.js';
import {gateCrossing} from '../src/supersonic/gate-crossing.js';
const gate={center:{x:0,y:1500,z:0},normal:{x:0,y:0,z:1},right:{x:1,y:0,z:0},up:{x:0,y:1,z:0},radius:80};
const state=(x,z,vx=0)=>({mode:'flight',position:{x,y:1500,z},targetPosition:gate.center,targetGate:gate,velocity:{x:vx,y:0,z:-340},heading:0,bank:0,throttle:1,angleOfAttack:0,supersonic:{effectiveSettings:{maxG:9,pitchGain:.35},availableNormalAcceleration:88.2}});
test('an actual valid offset gate crossing never asks for a go-around immediately before capture',()=>{
  for(const x of [-79,-20,20,79])for(const vx of [-.1,0,.1]){
    const s=state(x,80,vx),to={x:x+vx*160/340,y:1500,z:-80};
    assert.equal(gateCrossing(s.position,to,gate).inside,true);
    const advice=computeSupersonicGuidance(s);
    assert.equal(advice.rawMode,'target',`valid crossing x=${x},vx=${vx} must remain inbound`);
    assert.ok(Math.abs(advice.yawErrorDegrees)<.01,'keep the track that already passes the real aperture');
  }
});
test('switching to the next collinear gate keeps the same track command with a small off-center crossing',()=>{
  const before=computeSupersonicGuidance(state(20,1));
  const nextGate={...gate,center:{x:0,y:1500,z:-6000}},afterState=state(20,-1);
  const after=computeSupersonicGuidance({...afterState,targetGate:nextGate,targetPosition:nextGate.center});
  assert.ok(Math.abs(before.yawErrorDegrees-after.yawErrorDegrees)<.01);
});
test('capture advice leaves a previous go-around while a genuine miss retains recovery advice',()=>{
  const s=state(20,80),advice=computeSupersonicGuidance(s);
  const turn=advanceGuidanceTurn(advice,{mode:'go-around',yawDegrees:15,climbDegrees:0,turnSign:1,changedAt:1000},{now:1100,dt:1/60});
  assert.equal(turn.mode,'target');
  const miss=computeSupersonicGuidance(state(500,80));assert.equal(miss.rawMode,'go-around');
});
