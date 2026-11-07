import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDirectionGuidance, headingTargetCue, trueScreenEdge } from '../src/guidance.js';

const state = (targetPosition, extra = {}) => ({ position:{x:0,y:14,z:0}, targetPosition,
  velocity:{x:0,y:0,z:-10}, bank:0, angleOfAttack:0, ...extra });
const near = (actual, expected, tolerance=1e-7) => assert.ok(Math.abs(actual-expected)<=tolerance, `${actual} vs ${expected}`);

test('heading cue places center and a known quarter-span offset on the actual tape', () => {
  assert.deepEqual(headingTargetCue(0), {inside:true,x:90,side:null,angleDegrees:0});
  assert.deepEqual(headingTargetCue(10), {inside:true,x:135,side:null,angleDegrees:10});
});
test('heading cue retains signed off-tape bearing and wraps a full rotation', () => {
  assert.deepEqual(headingTargetCue(34), {inside:false,x:180,side:'right',angleDegrees:34});
  assert.deepEqual(headingTargetCue(-34), {inside:false,x:0,side:'left',angleDegrees:-34});
  assert.deepEqual(headingTargetCue(370), headingTargetCue(10));
});
test('edge marker lies 24 px inside the real viewport, including diagonal and rear targets', () => {
  assert.deepEqual(trueScreenEdge({x:100,y:0,z:-20},390,844), {x:366,y:422,rotation:90,behind:false});
  near(trueScreenEdge({x:-100,y:0,z:-20},390,844).x,24);
  near(trueScreenEdge({x:0,y:100,z:-20},390,844).y,24);
  for (const [w,h] of [[390,844],[360,640],[844,390]]) {
    for (const target of [{x:2,y:4,z:-1},{x:-4,y:-2,z:-1},{x:0,y:0,z:1},{x:-1e-9,y:0,z:1}]) {
      const p=trueScreenEdge(target,w,h);
      assert.ok(p.x>=24 && p.x<=w-24 && p.y>=24 && p.y<=h-24);
      assert.ok(Math.min(Math.abs(p.x-24),Math.abs(p.x-(w-24)),Math.abs(p.y-24),Math.abs(p.y-(h-24)))<1e-7);
    }
  }
});
test('rear edge arrows point backward with left/right sign while height stays independent',()=>{
  assert.deepEqual(trueScreenEdge({x:0,y:0,z:10},390,844),{x:195,y:820,rotation:180,behind:true});
  const right=trueScreenEdge({x:10,y:0,z:10},390,844);
  const left=trueScreenEdge({x:-10,y:0,z:10},390,844);
  near(right.rotation,135);near(left.rotation,225);near(right.x,366);near(left.x,24);
  assert.ok(right.y>422 && left.y>422);
  assert.deepEqual(trueScreenEdge({x:10,y:1000,z:10},390,844),right);
  assert.deepEqual(trueScreenEdge({x:10,y:-1000,z:10},390,844),right);
  near(trueScreenEdge({x:0,y:10,z:0},390,844).y,24);
});
test('invalid heading and edge geometry returns null', () => {
  for (const input of [NaN,Infinity,null,undefined]) assert.equal(headingTargetCue(input),null);
  assert.equal(headingTargetCue(0,{spanDegrees:0}),null);
  assert.equal(headingTargetCue(0,{width:-1}),null);
  assert.equal(headingTargetCue(0,null),null);
  for (const vector of [null,{x:0,y:0,z:0},{x:NaN,y:0,z:-1}]) assert.equal(trueScreenEdge(vector,390,844),null);
  assert.equal(trueScreenEdge({x:1,y:0,z:-1},0,844),null);
  assert.equal(trueScreenEdge({x:1,y:0,z:-1},40,40,24),null);
});

test('forward flightpath aligns with the ring; nose attitude cannot replace velocity', () => {
  const g=computeDirectionGuidance(state({x:0,y:14,z:-100}));
  assert.equal(g.mode,'target'); assert.equal(g.aligned,true);
  near(g.direction.x,0); near(g.direction.y,0); near(g.direction.z,-1);
  const movingRight=computeDirectionGuidance(state({x:0,y:14,z:-100},
    {velocity:{x:10,y:0,z:0},orientation:{x:0,y:0,z:0,w:1}}));
  near(movingRight.yawErrorDegrees,-15);
});
test('distant side targets give at most 15 degrees of incremental yaw', () => {
  for (const side of [-1,1]) {
    const g=computeDirectionGuidance(state({x:side*1000,y:14,z:-1000}));
    assert.equal(g.mode,'target'); near(g.yawErrorDegrees,side*15);
    near(Math.hypot(g.direction.x,g.direction.y,g.direction.z),1);
  }
});
test('rearward noise consistently chooses one turn direction', () => {
  for (const x of [-.00001,0,.00001]) {
    const g=computeDirectionGuidance(state({x,y:14,z:1000}));
    assert.equal(g.mode,'go-around'); near(g.yawErrorDegrees,15);
  }
});
test('upper and lower targets respect pitch settings and ten-degree climb increment', () => {
  const above=computeDirectionGuidance(state({x:0,y:114,z:-100}));
  const below=computeDirectionGuidance(state({x:0,y:-86,z:-100}));
  near(above.commandedClimbDegrees,10); near(below.commandedClimbDegrees,-10);
  const limited=computeDirectionGuidance(state({x:0,y:114,z:-100}),{maxPitch:5});
  near(limited.commandedClimbDegrees,5);
  const climbing=computeDirectionGuidance(state({x:0,y:-86,z:-100},
    {velocity:{x:0,y:Math.sin(8*Math.PI/180)*10,z:-Math.cos(8*Math.PI/180)*10}}));
  near(climbing.commandedClimbDegrees,-2);
});

test('close target inside the turning circle gives a level escape instead of endless target-side orbit', () => {
  const g=computeDirectionGuidance(state({x:5,y:20,z:-5}));
  assert.equal(g.insideTurnCircle,true); assert.equal(g.mode,'go-around');
  near(g.commandedClimbDegrees,0); near(g.yawErrorDegrees,-15);
  assert.ok(g.turnRadius>12 && g.turnRadius<13);
});
test('low airspeed trim, current attack margin and engine-off constrain climb advice', () => {
  const low=computeDirectionGuidance(state({x:0,y:114,z:-100},{velocity:{x:0,y:0,z:-8}}));
  assert.ok(low.maxClimbDegrees>7 && low.maxClimbDegrees<8);
  assert.ok(low.commandedClimbDegrees+low.trimDegrees<=15+1e-9);
  const nearStall=computeDirectionGuidance(state({x:0,y:114,z:-100},{angleOfAttack:16*Math.PI/180}));
  assert.ok(nearStall.climbErrorDegrees<=1);
  const off=computeDirectionGuidance(state({x:0,y:114,z:-100},{throttle:0}));
  assert.equal(off.mode,'recover'); assert.ok(off.commandedClimbDegrees<=0);
});
test('a stall warning asks for less incidence while returning excessive climb in ten-degree steps', () => {
  const stalled=computeDirectionGuidance(state({x:0,y:114,z:-100},{angleOfAttack:25*Math.PI/180}));
  assert.equal(stalled.mode,'recover'); assert.ok(stalled.commandedClimbDegrees<0);
  const vertical=computeDirectionGuidance(state({x:0,y:114,z:-100},{velocity:{x:0,y:10,z:0}}));
  assert.equal(vertical.mode,'recover'); near(vertical.commandedClimbDegrees,80);
  near(vertical.climbErrorDegrees,-10);
});
test('zero travel falls back to body attitude, never reports alignment or promises lift', () => {
  const g=computeDirectionGuidance(state({x:100,y:14,z:0},{velocity:{x:0,y:0,z:0},
    orientation:{x:0,y:-Math.SQRT1_2,z:0,w:Math.SQRT1_2}}));
  assert.equal(g.mode,'recover'); assert.equal(g.aligned,false);
  near(g.direction.x/Math.hypot(g.direction.x,g.direction.z),1);
  assert.ok(g.commandedClimbDegrees<=0);
});
test('invalid guidance state and settings return null without editing supplied values', () => {
  const original=state({x:0,y:14,z:-100}); const json=JSON.stringify(original);
  computeDirectionGuidance(original); assert.equal(JSON.stringify(original),json);
  for (const value of [undefined,null,{},state({x:NaN,y:14,z:0}),state({x:0,y:14,z:0}),
    state({x:0,y:14,z:-1},{velocity:{x:Infinity,y:0,z:0}})]) assert.equal(computeDirectionGuidance(value),null);
  assert.equal(computeDirectionGuidance(original,{maxPitch:NaN}),null);
  assert.equal(computeDirectionGuidance(original,{maxBank:0}),null);
  assert.equal(computeDirectionGuidance(original,null),null);
  assert.equal(computeDirectionGuidance(state({x:0,y:14,z:-1},{velocity:{x:1e308,y:0,z:0}})),null);
});
test('current v24 course has target advice at every normal segment launch', () => {
  for (const [position,targetPosition] of [[{x:0,y:14,z:26},{x:0,y:14,z:0}],
    [{x:0,y:14,z:0},{x:4,y:16,z:-34}],[{x:4,y:16,z:-34},{x:4,y:18,z:-68}],
    [{x:4,y:18,z:-68},{x:8,y:20,z:-96}]]) {
    const g=computeDirectionGuidance(state(targetPosition,{position}));
    assert.equal(g.mode,'target'); assert.ok(g.commandedClimbDegrees>=0 && g.commandedClimbDegrees<5);
  }
});
test('optional turn state permits a bounded continuous transition across the turn-circle boundary',()=>{
  const position={x:0,y:14,z:0},targetPosition={x:20,y:14,z:-34};
  const before=computeDirectionGuidance(state(targetPosition,{position,velocity:{x:0,y:0,z:-17.9058}}));
  const afterState=state(targetPosition,{position,velocity:{x:0,y:0,z:-17.9095}});
  const after=computeDirectionGuidance(afterState,{turnState:{mode:'go-around',yawDegrees:14.25}});
  assert.equal(before.rawMode,'target');near(before.rawYawErrorDegrees,15);
  assert.equal(after.rawMode,'go-around');near(after.rawYawErrorDegrees,-15);
  assert.equal(after.mode,'go-around');near(after.yawErrorDegrees,14.25);
  assert.ok(after.turnCircleRatio>0.9 && after.turnCircleRatio<1.1);
  near(after.commandedClimbDegrees,0);
});
test('guidance shares the stronger turn radius and accepts the setting from either options or status',()=>{
  const input=state({x:100,y:14,z:-100});
  const current=computeDirectionGuidance(input),old=computeDirectionGuidance(input,{turnGravity:3});
  assert.ok(current.turnRadius<old.turnRadius);near(current.turnRadius*9.8,old.turnRadius*3);
  near(computeDirectionGuidance({...input,turnGravity:15}).turnRadius,
    computeDirectionGuidance(input,{turnGravity:15}).turnRadius);
  assert.equal(computeDirectionGuidance(input,{turnGravity:NaN}),null);
});
test('turn-state advice cannot override yaw limits or recovery safety',()=>{
  const above=state({x:1000,y:100,z:-1000});
  near(computeDirectionGuidance(above,{turnState:{mode:'target',yawDegrees:200}}).yawErrorDegrees,15);
  const recover=computeDirectionGuidance({...above,angleOfAttack:25*Math.PI/180},
    {turnState:{mode:'go-around',yawDegrees:-15}});
  assert.equal(recover.mode,'recover');assert.equal(recover.rawMode,'recover');
  near(recover.yawErrorDegrees,0);near(recover.rawYawErrorDegrees,0);
  assert.ok(recover.commandedClimbDegrees<0);
  for(const turnState of [{mode:'bad',yawDegrees:0},{mode:'target',yawDegrees:NaN},'bad'])
    assert.equal(computeDirectionGuidance(above,{turnState}),null);
});
