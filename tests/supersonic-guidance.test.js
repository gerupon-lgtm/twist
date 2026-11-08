import test from 'node:test';
import assert from 'node:assert/strict';
import {computeSupersonicGuidance} from '../src/supersonic-guidance.js';
import {guidanceDirectionAllowed} from '../src/guidance-layout.js';
const fixture=(speed=340)=>({position:{x:0,y:1500,z:6000},targetPosition:{x:0,y:1500,z:0},velocity:{x:0,y:0,z:-speed},heading:0,bank:0,throttle:1,angleOfAttack:0,
 targetGate:{center:{x:0,y:1500,z:0},normal:{x:0,y:0,z:1},radius:80},supersonic:{effectiveSettings:{maxG:9,pitchGain:.35},availableNormalAcceleration:88.2}});
test('level guidance uses the shared nine-G radius at real speed, not the normal sphere/lift model',()=>{
 const advice=computeSupersonicGuidance(fixture());assert.equal(advice.mode,'target');
 assert.ok(Math.abs(advice.turnRadius-1318.825)<1);assert.deepEqual(advice.direction,{x:0,y:0,z:-1});
 assert.equal(advice.approach.gateRadius,80);assert.ok(guidanceDirectionAllowed(advice.direction,advice));
 assert.ok(computeSupersonicGuidance(fixture(680)).turnRadius>5200);
});
test('a close inbound approach keeps the real gate and advises a turn instead of expanding capture',()=>{
 const state=fixture(680);state.position={x:2000,y:1500,z:100};
 const advice=computeSupersonicGuidance(state);assert.equal(advice.approach.staging,false);
 assert.equal(advice.approach.gateRadius,80);assert.deepEqual(advice.approach.point,state.targetGate.center);assert.equal(advice.insideTurnCircle,true);assert.equal(advice.rawMode,'go-around');
 assert.ok(guidanceDirectionAllowed(advice.direction,advice));
});
test('a missed gate can be approached from the other side and high altitude advice descends',()=>{
 const state=fixture();state.position={x:500,y:6200,z:-1000};state.velocity={x:0,y:0,z:340};
 const advice=computeSupersonicGuidance(state);assert.equal(advice.approach.point.z,state.targetGate.center.z);assert.equal(advice.approach.staging,false);assert.ok(advice.climbErrorDegrees<0);
 assert.ok(guidanceDirectionAllowed(advice.direction,advice));
});
test('low-speed recovery shares its available lift budget and gives no blind lateral command',()=>{
 const state=fixture(30);state.supersonic.availableNormalAcceleration=4;
 const advice=computeSupersonicGuidance(state);assert.equal(advice.criticalRecovery,true);assert.equal(advice.yawErrorDegrees,0);
 assert.ok(Number.isFinite(advice.turnRadius));assert.equal(computeSupersonicGuidance({...state,targetGate:null}),null);
});
