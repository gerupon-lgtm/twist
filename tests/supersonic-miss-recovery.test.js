import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupersonicProfile} from '../src/supersonic/profile.js';
import {SUPERSONIC_COURSE as course} from '../src/supersonic/course.js';
import {createSupersonicState,advanceSupersonic,supersonicDrag} from '../src/supersonic/physics.js';
import {computeSupersonicGuidance} from '../src/supersonic-guidance.js';
import {advanceGuidanceTurn} from '../src/guidance-stability.js';

const profile=createSupersonicProfile({maxG:9,fuelMode:'unlimited',pitchGain:.35});
const dt=.1,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

test('returning across the active gate plane keeps the gate as the aim instead of pulling outward again',()=>{
  const gate=course.gates[0],state={position:{x:200,y:gate.center.y,z:gate.center.z-1000},velocity:{x:0,y:0,z:340},heading:Math.PI,bank:0,throttle:1,angleOfAttack:0,
    targetGate:gate,targetPosition:gate.center,supersonic:{effectiveSettings:profile.effectiveSettings,availableNormalAcceleration:88.2}};
  const advice=computeSupersonicGuidance(state);
  assert.equal(advice.approach.staging,false);
  assert.deepEqual(advice.approach.point,gate.center);
  const outbound=computeSupersonicGuidance({...state,heading:0,velocity:{x:0,y:0,z:-340}});
  assert.equal(outbound.approach.staging,true);assert.ok(outbound.approach.point.z<gate.center.z);
});

// Closed-loop integration, not a mock of guidance or capture. All seeding and
// recovery use canonical controls; no position/velocity/fuel hooks are present.
for(const target of [200,340,680])test(`real ${target}m/s seed miss returns through the same active gate by advice alone`,()=>{
  let state=createSupersonicState(profile,course,{attemptId:`miss-regression-${target}`});
  const speedInput=()=>({throttle:target>=340?1:clamp(supersonicDrag(target,profile)/profile.dryThrust+.12*(target-state.speed),0,1),afterburnerRequested:target>=340&&state.speed<target-.15});
  const input=(bank,pitch=0)=>({bankDemand:bank,pitchMode:'angle',pitchDemandRadians:pitch,...speedInput()});
  let warmSteps=0;while(state.speed<target-.3&&warmSteps++<1000)state=advanceSupersonic(state,{bankDemand:0,pitchDemandRadians:0,throttle:1,afterburnerRequested:true},dt,profile,course).state;
  assert.ok(state.speed>=target-.3);
  const gateIndex=state.activeGateIndex,startHeading=state.heading;let seedSteps=0,phase='pulse',miss=null;
  while(!miss&&!state.complete&&!state.grounded&&seedSteps++<1000){
    if(phase==='pulse'&&wrap(state.heading-startHeading)>=.04)phase='coast';
    const result=advanceSupersonic(state,input(phase==='pulse'?.7:0),dt,profile,course);state=result.state;
    miss=result.events.find(e=>e.type==='gate-miss'&&e.gateIndex===gateIndex)??null;
  }
  assert.ok(miss,'the actual bank pulse must miss before recovery starts');assert.equal(state.activeGateIndex,gateIndex);
  const atMiss=state.simulationSeconds;let passed=null,turnState=null,turn=0,maximumG=0,previousHeading=state.heading;
  for(let i=0;i<900&&!state.grounded&&!passed;i++){
    const gate=course.gates[state.activeGateIndex],status={...state,targetGate:gate,targetPosition:gate.center,supersonic:{...state,effectiveSettings:profile.effectiveSettings}};
    const raw=computeSupersonicGuidance(status);turnState=advanceGuidanceTurn(raw,turnState,{now:state.simulationSeconds*1000,dt});
    const advice=computeSupersonicGuidance(status,{turnState});
    const climb=Math.atan2(state.velocity.y,Math.hypot(state.velocity.x,state.velocity.z));
    const commandClimb=Math.atan2(advice.direction.y,Math.hypot(advice.direction.x,advice.direction.z));
    const yaw=wrap(Math.atan2(advice.direction.x,-advice.direction.z)-state.heading);
    const bank=clamp(Math.atan(1.5*yaw*state.speed/profile.gravity),-profile.maxBankRadians,profile.maxBankRadians);
    const pitch=clamp(state.controlPitch+1.5*(commandClimb-climb),-profile.maxPitchRadians,profile.maxPitchRadians);
    const result=advanceSupersonic(state,input(bank/profile.maxBankRadians,pitch),dt,profile,course);state=result.state;
    turn+=Math.abs(wrap(state.heading-previousHeading));previousHeading=state.heading;maximumG=Math.max(maximumG,state.gLoad);
    passed=result.events.find(e=>(e.type==='gate-pass'||e.type==='exit-pass')&&e.gateIndex===gateIndex)??null;
  }
  assert.ok(passed,JSON.stringify({target,gateIndex,recoverySeconds:state.simulationSeconds-atMiss,turn,position:state.position}));
  assert.equal(state.grounded,false);assert.equal(state.activeGateIndex,gateIndex+1);assert.ok(state.simulationSeconds-atMiss<90);
  assert.ok(passed.radialDistance<=course.gates[gateIndex].radius);assert.ok(maximumG<=profile.maxG+1e-8);
  assert.ok(state.gateResults[gateIndex].missCount>=1);assert.ok(Number.isFinite(state.gateResults[gateIndex].passedAtSeconds));
});
