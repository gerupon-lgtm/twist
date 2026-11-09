import test from 'node:test';
import assert from 'node:assert/strict';
import {SIERRA10_COURSE as base} from '../src/courses/sierra10.js';
import {createSupersonicProfile} from '../src/supersonic/profile.js';
import {createSupersonicState,advanceSupersonic} from '../src/supersonic/physics.js';
import {gateCrossing} from '../src/supersonic/gate-crossing.js';
import {sierra10Pilot} from './helpers/sierra10-pilot.js';

test('rounded arrival at a gate plane counts once in either direction without widening its aperture',()=>{
 const gate=base.gates[1],at=distance=>({x:gate.center.x+gate.normal.x*distance,y:gate.center.y,z:gate.center.z+gate.normal.z*distance});
 for(const sign of [1,-1]){
  const edge=at(sign*5e-10),hit=gateCrossing(at(sign*2.5),edge,gate);
  assert.ok(hit?.inside,'A sub-nanometre rounding remainder must count as arrival at the plane');
  assert.equal(hit.fraction,1);assert.equal(gateCrossing(edge,at(-sign*2.5),gate),null);
  const outside={...gate.center,y:gate.center.y+gate.radius+.001};
  assert.equal(gateCrossing({...at(sign*2.5),y:outside.y},{...at(-sign*2.5),y:outside.y},gate).inside,false);
 }
});

for(let index=1;index<=5;index++)test(`actual capped-speed controls negotiate corner ${base.gates[index].pointName} at 300m/s within 9G`,()=>{
 const gate=base.gates[index],next=base.gates[index+1],n=gate.normal;
 // One isolated corner starts 1km before the real gate at the rated speed.
 // After initialisation only controls move the unmodified physical kernel.
 const course={...base,start:{x:gate.center.x+n.x*1000,y:gate.center.y,z:gate.center.z+n.z*1000},startHeading:Math.atan2(-n.x,n.z),
  gates:[{...gate,index:0,kind:'gate'},{...next,index:1,kind:'exit'}],flightProfile:{...base.flightProfile,startSpeed:300}};
 const profile=createSupersonicProfile(null,course);let state=createSupersonicState(profile,course),minimumSpeed=300;
 for(let i=0;i<3000&&!state.complete&&!state.grounded;i++){
  state=advanceSupersonic(state,{...sierra10Pilot(state,course),afterburnerRequested:true},1/60,profile,course).state;
  minimumSpeed=Math.min(minimumSpeed,state.speed);
 }
 const evidence={corner:gate.pointName,seconds:state.simulationSeconds,complete:state.complete,minimumSpeed,maxG:state.metrics.maximumG,fuel:state.afterburner.fuel,gates:state.gateResults.map(g=>({radial:g.lastCrossingRadialDistance,misses:g.missCount}))};
 assert.equal(state.complete,true,JSON.stringify(evidence));assert.equal(state.grounded,false);assert.ok(state.simulationSeconds<25);
 assert.ok(minimumSpeed>299.9,JSON.stringify(evidence));assert.ok(state.metrics.maximumSpeed<=300.000001);assert.ok(state.metrics.maximumG<=9.000001);
 assert.ok(state.gateResults.every(g=>g.missCount===0&&g.lastCrossingRadialDistance<=40));assert.ok(state.afterburner.fuel>0);
 console.log(JSON.stringify(evidence));
});
