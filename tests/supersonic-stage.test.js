import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupersonicStageAdapter,supersonicBoundaryStatus} from '../src/supersonic/stage.js';
import {supersonicCameraFrame,cameraLocalPosition} from '../src/supersonic/camera.js';
import {SUPERSONIC_COURSE} from '../src/supersonic/course.js';

function drawingStub(){let state,disposed=0;return {sync:s=>{state=s;},snapshot:()=>({cameraMode:'overlay',fieldOfView:{vertical:64,horizontal:64}}),localPosition:p=>{
  const v=cameraLocalPosition(p,supersonicCameraFrame(state));return {x:v.x,y:v.y,z:v.z};
},resize(){},setVisibility(){},setGroundPatternStrength(){},getPassObjects:()=>[],setDisplay(){},setCameraMode(){},resetDisplayRotation(){},dispose(){disposed++;},get disposed(){return disposed;}};}
const intent={bankDemand:0,pitchDemandRadians:0,throttle:.5,afterburnerRequested:false};
const close=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} vs ${b}`);

test('fresh/zero/paused/resume keep physical vectors and clear frame observations',()=>{
  const drawing=drawingStub(),stage=createSupersonicStageAdapter(drawing);
  const fresh=stage.getStatus();assert.equal(fresh.speed,200);assert.equal(fresh.altitude,1500);assert.ok(fresh.groundClearance<1500);assert.equal(fresh.targetGate.radius,80);
  stage.update(2,{supersonic:intent});assert.deepEqual(stage.getStatus().position,fresh.position);
  stage.launchFlight();stage.update(-.1,{supersonic:intent});stage.update(0,{supersonic:intent});assert.equal(stage.getStatus().speed,200);
  stage.update(.5,{supersonic:{...intent,afterburnerRequested:true}});
  const flying=stage.getStatus();assert.ok(flying.afterburner.active);assert.ok(flying.afterburnerMotion.length);assert.ok(flying.supersonic.timing.advancedSeconds>.49);
  stage.update(0,{paused:true,supersonic:intent});const paused=stage.getStatus();assert.deepEqual(paused.position,flying.position);assert.deepEqual(paused.velocity,flying.velocity);assert.equal(paused.afterburner.active,false);
  assert.equal(paused.supersonic.timing.advancedSeconds,0);assert.equal(paused.supersonic.events.length,0);assert.equal(paused.afterburnerMotion.length,0);
  stage.update(10,{paused:true});assert.deepEqual(stage.getStatus().position,paused.position);
  stage.launchFlight();assert.deepEqual(stage.getStatus().velocity,paused.velocity);assert.equal(stage.getStatus().supersonic.timing.advancedSeconds,0);
  stage.update(.1,{supersonic:{...intent,afterburnerRequested:true}});assert.equal(stage.getStatus().afterburner.active,false);
  stage.update(.1,{supersonic:intent});stage.update(.1,{supersonic:{...intent,afterburnerRequested:true}});assert.equal(stage.getStatus().afterburner.active,true);
  stage.dispose();stage.dispose();assert.equal(drawing.disposed,1);
});

test('all raw elapsed is integrated in bounded windows and terminal remainder is explicit',()=>{
  const stage=createSupersonicStageAdapter(drawingStub());stage.launchFlight();stage.update(3.125,{supersonic:intent});
  let status=stage.getStatus();close(status.supersonic.simulationSeconds,3.125);close(status.supersonic.timing.advancedSeconds,3.125);assert.equal(status.supersonic.timing.windowCount,4);assert.equal(status.supersonic.timing.terminalRemainder,0);
  stage.update(500,{supersonic:{...intent,afterburnerRequested:true}});status=stage.getStatus();assert.equal(status.complete,true);assert.equal(status.collected,5);
  assert.ok(status.supersonic.timing.terminalRemainder>0);close(status.supersonic.timing.advancedSeconds+status.supersonic.timing.terminalRemainder,500);
  assert.equal(status.supersonic.gateResults.filter(g=>g.passedAtSeconds!==null).length,6);
  assert.equal(status.supersonic.events.filter(e=>e.type==='gate-pass'||e.type==='exit-pass').length,6);
  for(let i=1;i<status.supersonic.events.length;i++){assert.ok(status.supersonic.events[i].atSeconds>=status.supersonic.events[i-1].atSeconds);assert.ok(status.supersonic.events[i].serial>status.supersonic.events[i-1].serial);}
  const saved=status.supersonic.simulationSeconds;stage.launchFlight();assert.equal(stage.getStatus().supersonic.simulationSeconds,saved);stage.update(0,{});assert.equal(stage.getStatus().supersonic.events.length,0);stage.dispose();
});

test('attempt settings freeze until reset, IDs span stage instances, and status copies cannot mutate physics',()=>{
  const stage=createSupersonicStageAdapter(drawingStub(),{supersonicSettings:{maxG:3,fuelMode:'gauge'}}),first=stage.getStatus();
  const other=createSupersonicStageAdapter(drawingStub());assert.ok(other.getStatus().supersonic.attemptId>first.supersonic.attemptId);
  first.supersonic.position.y=-1;first.supersonic.supportAcceleration.y=-1;first.supersonic.metrics.minimumSeaAltitude=-1;
  assert.equal(stage.getStatus().altitude,1500);assert.ok(stage.getStatus().supersonic.supportAcceleration.y>0);assert.equal(stage.getStatus().supersonic.metrics.minimumSeaAltitude,1500);
  stage.update(0,{supersonicSettings:{maxG:12}});assert.equal(stage.getStatus().supersonic.effectiveSettings.maxG,3);
  stage.reset({supersonicSettings:{maxG:12,fuelMode:'unlimited'},attemptId:1042});const reset=stage.getStatus();assert.equal(reset.supersonic.attemptId,1042);assert.equal(reset.supersonic.effectiveSettings.maxG,12);assert.equal(reset.speed,200);assert.equal(reset.supersonic.timing.advancedSeconds,0);
  other.reset();assert.ok(other.getStatus().supersonic.attemptId>1042);stage.dispose();other.dispose();
});

test('boundaries use available support and remain advisory above the ceiling',()=>{
  const state={position:{x:20500,y:6500,z:0},velocity:{x:100,y:5,z:0},speed:680,heading:Math.PI/2,availableNormalAcceleration:9*9.8};
  const b=supersonicBoundaryStatus(state,{gravity:9.8,maxBankRadians:Math.acos(1/9)},SUPERSONIC_COURSE);
  assert.equal(b.outside,true);assert.equal(b.above,true);assert.equal(b.upperClearance,-500);assert.equal(b.returnDirection.x,-1);assert.equal(state.position.y,6500);
  close(b.turnRadius,680**2/(9.8*Math.sqrt(80)));assert.ok(b.warningDistance>5000);
});
