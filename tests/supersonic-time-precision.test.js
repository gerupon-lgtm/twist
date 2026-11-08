import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupersonicStageAdapter} from '../src/supersonic/stage.js';
import {createSupersonicProfile} from '../src/supersonic/profile.js';
import {SUPERSONIC_COURSE} from '../src/supersonic/course.js';
import {createSupersonicState,advanceSupersonic} from '../src/supersonic/physics.js';

// CPU drawing boundary only. These deliberate floating-point inputs are not a
// claim that a native browser has produced the same timestamp differences.
const input={bankDemand:0,pitchDemandRadians:0,throttle:.5,afterburnerRequested:false};
function drawingStub(){return {sync(){},snapshot:()=>({cameraMode:'overlay',fieldOfView:{vertical:64,horizontal:64}}),localPosition:p=>({...p}),
  resize(){},setVisibility(){},setGroundPatternStrength(){},getPassObjects:()=>[],setDisplay(){},setCameraMode(){},resetDisplayRotation(){},dispose(){}};}
function stageFor(course=SUPERSONIC_COURSE){const stage=createSupersonicStageAdapter(drawingStub(),{course});stage.launchFlight();return stage;}
const sonic=stage=>stage.getStatus().supersonic;
// A fully consumed frame needs no pending field. A frame which cannot yet move
// its numerical state must expose its positive pending seconds explicitly.
const pending=state=>state.pendingSeconds??0;
function finiteTree(value){
  if(typeof value==='number')assert.ok(Number.isFinite(value),'Nonfinite numerical state or event');
  else if(value&&typeof value==='object')for(const child of Object.values(value))finiteTree(child);
}
function near(a,b,scale=1){assert.ok(Math.abs(a-b)<=Math.max(1e-15,8*Number.EPSILON*Math.max(1,Math.abs(scale))),`${a} != ${b}`);}
function account(before,after,requested){
  const advanced=after.timing.advancedSeconds,tail=after.timing.terminalRemainder;
  assert.ok(Number.isFinite(pending(after))&&pending(after)>=0);
  assert.ok(Number.isFinite(tail)&&tail>=0);
  near(after.timing.carriedInSeconds,pending(before));near(after.timing.carriedOutSeconds,pending(after));
  near(advanced+pending(after)+tail,requested+pending(before),requested+pending(before));
  // Integrated clock compensation is separate from not-yet-integrated time.
  const clockAdvanced=after.simulationSeconds-before.simulationSeconds+(after.clockCarrySeconds??0)-(before.clockCarrySeconds??0);
  near(clockAdvanced,advanced,Math.max(before.simulationSeconds,requested));
  if(requested>0&&!after.complete&&!after.grounded){
    assert.ok(advanced>0||pending(after)>pending(before),'Positive elapsed was neither integrated nor carried');
    assert.equal(tail,0,'A nonterminal residual must not be relabeled terminal time');
  }
  finiteTree(after);
  const events=after.events??[];
  for(let i=0;i<events.length;i++){
    assert.ok(events[i].atSeconds<=after.simulationSeconds+1e-10);
    if(i){assert.ok(events[i].atSeconds>=events[i-1].atSeconds);assert.ok(events[i].serial>events[i-1].serial);}
  }
}

for(const [label,dt]of [['one-second plus one ULP',1+Number.EPSILON],['two-seconds plus one ULP',2+2*Number.EPSILON],['sub-picosecond initial frame',1e-13]])
test(`adapter consumes or explicitly carries ${label} without throwing`,()=>{
  const stage=stageFor(),before=sonic(stage);
  assert.doesNotThrow(()=>stage.update(dt,{supersonic:input}));
  const after=sonic(stage);account(before,after,dt);assert.equal(after.complete,false);assert.equal(after.grounded,false);
  const held=after;stage.update(.05,{supersonic:input});account(held,sonic(stage),.05);
  near(sonic(stage).simulationSeconds+pending(sonic(stage)),dt+.05);
  stage.dispose();
});

for(const elapsed of [5,45])test(`late tiny frames remain accounted after ${elapsed} physical seconds`,()=>{
  const stage=stageFor();stage.update(elapsed,{supersonic:input});
  const initial=sonic(stage);let before=initial;
  for(const dt of [1e-13,Number.EPSILON/4,Number.EPSILON/4]){
    assert.doesNotThrow(()=>stage.update(dt,{supersonic:input}));
    const after=sonic(stage);account(before,after,dt);before=after;
  }
  const carried=pending(before),velocity={...before.velocity};
  stage.update(0,{supersonic:input});assert.deepEqual(sonic(stage).velocity,velocity);assert.equal(pending(sonic(stage)),carried);
  stage.update(.05,{supersonic:input});const final=sonic(stage);account(before,final,.05);
  near(final.simulationSeconds-initial.simulationSeconds+(final.clockCarrySeconds??0)-(initial.clockCarrySeconds??0)+pending(final),.05+1e-13+Number.EPSILON/2,elapsed);
  assert.equal(final.effectiveSettings.maxG,initial.effectiveSettings.maxG);stage.dispose();
});

test('repeated fractions below the current simulation clock ULP accumulate instead of disappearing',()=>{
  const stage=stageFor();stage.update(45,{supersonic:input});const start=sonic(stage),dt=Number.EPSILON/4;
  for(let i=0;i<256;i++){
    const before=sonic(stage);assert.doesNotThrow(()=>stage.update(dt,{supersonic:input}));account(before,sonic(stage),dt);
  }
  const collected=sonic(stage);assert.ok(collected.simulationSeconds>start.simulationSeconds||pending(collected)>0);
  // Compare the small ledger delta before adding it to the larger elapsed clock.
  near(collected.simulationSeconds-start.simulationSeconds+(collected.clockCarrySeconds??0)-(start.clockCarrySeconds??0)+pending(collected)-pending(start),256*dt);
  const before=collected;stage.update(.05,{supersonic:input});account(before,sonic(stage),.05);stage.dispose();
});

test('pure kernel reports finite segment seconds and chronology for a tiny positive interval',()=>{
  const profile=createSupersonicProfile(),initial=createSupersonicState(profile,SUPERSONIC_COURSE),dt=1e-13;
  const result=advanceSupersonic(initial,input,dt,profile,SUPERSONIC_COURSE);
  const advanced=result.timing.advancedSeconds;
  assert.ok(advanced>0||pending(result.state)>0,'Kernel silently discarded positive elapsed');
  near(advanced+pending(result.state),dt);finiteTree(result);
  const sum=result.segments.reduce((seconds,segment)=>seconds+segment.seconds,0);near(sum,advanced);
  for(const segment of result.segments){assert.ok(segment.seconds>0);assert.ok(segment.seconds<=1/120+Number.EPSILON);near(segment.t1-segment.t0,segment.seconds);}
});

test('a deliberately huge simulation clock keeps local elapsed separate from its rounded high part',()=>{
  const profile=createSupersonicProfile();let state=createSupersonicState(profile,SUPERSONIC_COURSE);
  // Explicit numerical-state fixture, not an assertion about real game duration.
  state.simulationSeconds=2**40;state.clockCarrySeconds=0;
  let accepted=0,integrated=0,segmentSeconds=0;
  const start=structuredClone(state);
  for(const dt of [1e-13,.001,Number.EPSILON/4,.05]){
    const before=state,result=advanceSupersonic(before,input,dt,profile,SUPERSONIC_COURSE);state=result.state;
    accepted+=dt;integrated+=result.timing.advancedSeconds;
    near(result.timing.advancedSeconds+pending(state),dt+pending(before));
    const physicalClockDelta=state.simulationSeconds-before.simulationSeconds+state.clockCarrySeconds-before.clockCarrySeconds;
    near(physicalClockDelta,result.timing.advancedSeconds);
    assert.ok(result.timing.advancedSeconds>0||pending(state)>pending(before));
    for(const segment of result.segments){segmentSeconds+=segment.seconds;assert.ok(segment.seconds>0&&segment.seconds<=1/120+Number.EPSILON);}
    finiteTree(result);
  }
  near(integrated+pending(state),accepted);near(segmentSeconds,integrated);
  near(state.simulationSeconds-start.simulationSeconds+state.clockCarrySeconds-start.clockCarrySeconds+pending(state),accepted);
  assert.ok(state.position.z<start.position.z);assert.equal(state.grounded,false);assert.equal(state.complete,false);
});

test('zero and paused updates retain a pending budget and resume retains physical settings',()=>{
  const stage=stageFor();stage.update(5,{supersonic:input});stage.update(Number.EPSILON/4,{supersonic:input});
  const before=sonic(stage),held=pending(before);
  for(const dt of [0,-1,Infinity]){stage.update(dt,{supersonic:input});const after=sonic(stage);assert.equal(after.simulationSeconds,before.simulationSeconds);assert.equal(pending(after),held);assert.deepEqual(after.velocity,before.velocity);}
  stage.update(10,{paused:true,supersonic:{...input,afterburnerRequested:true}});const paused=sonic(stage);
  assert.equal(paused.simulationSeconds,before.simulationSeconds);assert.equal(pending(paused),held);assert.deepEqual(paused.position,before.position);assert.deepEqual(paused.velocity,before.velocity);
  assert.equal(paused.afterburner.active,false);assert.deepEqual(paused.effectiveSettings,before.effectiveSettings);
  stage.launchFlight();assert.equal(pending(sonic(stage)),held);stage.update(.05,{supersonic:input});account(paused,sonic(stage),.05);
  stage.reset();const fresh=sonic(stage);assert.equal(pending(fresh),0);assert.equal(fresh.clockCarrySeconds,0);assert.equal(fresh.simulationSeconds,0);assert.notEqual(fresh.attemptId,before.attemptId);assert.equal(fresh.speed,200);stage.dispose();
});

test('an EXIT terminal fraction accounts its tail and cannot resume or emit the crossing again',()=>{
  const course=structuredClone(SUPERSONIC_COURSE);course.start.z=20;course.gates.forEach((gate,i)=>{gate.center.z=14-6*i;});
  const stage=stageFor(course);stage.update(1e-13,{supersonic:input});
  const before=sonic(stage),dt=1+Number.EPSILON;assert.ok(pending(before)>0);
  stage.update(dt,{supersonic:input});const ended=sonic(stage);assert.equal(ended.complete,true);account(before,ended,dt);
  assert.ok(ended.timing.terminalRemainder>.8);assert.equal(pending(ended),0);
  assert.equal(ended.events.filter(event=>event.type==='gate-pass'||event.type==='exit-pass').length,6);
  for(const event of ended.events)near(event.offsetSeconds,event.atSeconds-before.simulationSeconds-(before.clockCarrySeconds??0)-pending(before));
  const held={position:ended.position,velocity:ended.velocity,simulationSeconds:ended.simulationSeconds,gateResults:ended.gateResults};
  stage.launchFlight();stage.update(1e-13,{supersonic:input});const after=sonic(stage);
  for(const key of Object.keys(held))assert.deepEqual(after[key],held[key]);assert.equal(after.events.length,0);stage.dispose();
});

test('sea terminal time and unused remainder stay finite and do not acquire a later gate',()=>{
  const profile=createSupersonicProfile(),course=structuredClone(SUPERSONIC_COURSE);course.start={x:0,y:1,z:20};course.gates.forEach((gate,i)=>{gate.center={x:0,y:1,z:18-6*i};});
  const before=createSupersonicState(profile,course);before.velocity={x:0,y:-100,z:-200};before.speed=Math.hypot(100,200);
  const dt=.1+Number.EPSILON/16,result=advanceSupersonic(before,{...input,throttle:0},dt,profile,course);
  assert.equal(result.state.grounded,true);assert.equal(result.state.collected,0);assert.equal(pending(result.state),0);
  near(result.timing.advancedSeconds+result.timing.remainingSeconds,dt);finiteTree(result);
  const impact=result.events.find(event=>event.type==='sea-contact');assert.ok(impact);assert.ok(result.events.every(event=>event.atSeconds<=impact.atSeconds));
  assert.ok(result.state.terminal.centerPosition.y>0);near(result.state.terminal.contactPoint.y,0);
  const later=advanceSupersonic(result.state,input,1e-13,profile,course);assert.equal(later.events.length,0);assert.equal(later.state.simulationSeconds,result.state.simulationSeconds);
});
