import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupersonicActivity} from '../src/supersonic-activity.js';
import {createSupersonicStageAdapter} from '../src/supersonic/stage.js';

// Explicit accounting snapshots test the activity-clock boundary separately
// from integration and rendering. These are not observed native frame deltas.
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-15,`${a} vs ${b}`);
function state(simulationSeconds,{advanced=0,carryIn=0,carryOut=0,tail=0,events=[],...extra}={}){
  return {attemptId:1,simulationSeconds,clockCarrySeconds:0,pendingSeconds:carryOut,
    timing:{advancedSeconds:advanced,carriedInSeconds:carryIn,carriedOutSeconds:carryOut,terminalRemainder:tail},events,...extra};
}
function heldClock(seconds){
  const clock=createSupersonicActivity();clock.begin(state(0));clock.advance(seconds,state(0,{carryOut:seconds}));return clock;
}

test('a positive interval held explicitly for integration is active time, without an interruption',()=>{
  const duration=1e-13,clock=heldClock(duration),record=clock.snapshot();
  assert.equal(record.activeSeconds,duration);assert.equal(record.interruptedSeconds,0);
  assert.equal(record.firstMach1ActiveSeconds,null);
});

test('a crossing frame offset debits the prior carry exactly once',()=>{
  const carry=1e-13,clock=heldClock(carry),raw=.1,physical=raw+carry,crossing=.05;
  clock.advance(raw,state(physical,{advanced:physical,carryIn:carry,firstMach1Seconds:crossing,
    events:[{type:'mach-crossing',thresholdMach:1,direction:'up',atSeconds:crossing,offsetSeconds:crossing-carry}]}));
  const record=clock.snapshot();near(record.activeSeconds,raw+carry);assert.equal(record.interruptedSeconds,0);
  near(record.firstMach1ActiveSeconds,crossing);
});

test('terminal unused time may refund the tiny part already counted in the previous frame',()=>{
  const carry=1e-13,clock=heldClock(carry),raw=.1,physical=carry/2,crossing=carry/4;
  clock.advance(raw,state(physical,{advanced:physical,carryIn:carry,tail:raw+carry-physical,
    complete:true,firstMach1Seconds:crossing,
    events:[{type:'mach-crossing',thresholdMach:1,direction:'up',atSeconds:crossing,offsetSeconds:crossing-carry}]}));
  const record=clock.snapshot();near(record.activeSeconds,physical);assert.equal(record.interruptedSeconds,0);
  near(record.firstMach1ActiveSeconds,crossing);
});

test('a ledger with a real unprocessed interval still reports it and never invents a crossing',()=>{
  const clock=createSupersonicActivity();clock.begin(state(0));
  clock.advance(1,state(.5,{advanced:.5,firstMach1Seconds:.3,
    events:[{type:'mach-crossing',thresholdMach:1,direction:'up',atSeconds:.3,offsetSeconds:.3}]}));
  assert.equal(clock.snapshot().activeSeconds,1);assert.equal(clock.snapshot().interruptedSeconds,.5);
  assert.equal(clock.snapshot().firstMach1ActiveSeconds,null);
});

test('real stage carry, Mach crossings and EXIT share one active-time budget',()=>{
  const drawing={sync(){},snapshot:()=>({cameraMode:'overlay',fieldOfView:{vertical:64,horizontal:64}}),localPosition:p=>({...p}),
    resize(){},setVisibility(){},setGroundPatternStrength(){},getPassObjects:()=>[],setDisplay(){},setCameraMode(){},resetDisplayRotation(){},dispose(){}};
  const stage=createSupersonicStageAdapter(drawing),clock=createSupersonicActivity();
  const boost={bankDemand:0,pitchDemandRadians:0,throttle:.5,afterburnerRequested:true};
  stage.launchFlight();clock.begin(stage.getStatus().supersonic);
  for(const duration of [1e-13,10,500]){
    stage.update(duration,{supersonic:boost});clock.advance(duration,stage.getStatus().supersonic);
  }
  const final=stage.getStatus().supersonic,record=clock.snapshot();
  assert.equal(final.complete,true);assert.equal(final.gateResults.filter(row=>row.passedAtSeconds!==null).length,6);
  assert.equal(record.interruptedSeconds,0);
  const matches=(a,b)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-10,`${a} vs ${b}`);
  matches(record.activeSeconds,final.simulationSeconds+final.clockCarrySeconds);
  matches(record.firstMach1ActiveSeconds,final.metrics.firstMach1Seconds);
  matches(record.firstMach2ActiveSeconds,final.metrics.firstMach2Seconds);
  stage.dispose();
});
