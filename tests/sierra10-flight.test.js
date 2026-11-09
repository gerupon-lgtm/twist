import test from 'node:test';import assert from 'node:assert/strict';
import {SIERRA10_COURSE} from '../src/courses/sierra10.js';import {createSupersonicProfile} from '../src/supersonic/profile.js';import {createSupersonicState,advanceSupersonic} from '../src/supersonic/physics.js';import {sierra10Pilot} from './helpers/sierra10-pilot.js';
test('physical controls alone pass A..G, retain speed and altitude limits, and record every segment',()=>{
 const course=SIERRA10_COURSE,p=createSupersonicProfile(null,course);let state=createSupersonicState(p,course),events=[];
 for(let i=0;i<15000&&!state.complete&&!state.grounded;i++){const next=advanceSupersonic(state,sierra10Pilot(state,course),1/30,p,course);state=next.state;events.push(...next.events);}
 assert.equal(state.grounded,false,JSON.stringify({position:state.position,index:state.activeGateIndex}));assert.equal(state.complete,true,JSON.stringify({position:state.position,index:state.activeGateIndex,misses:state.gateResults.map(r=>r.missCount)}));
 assert.equal(state.gateResults.length,7);assert.ok(state.gateResults[6].afterburnerSeconds>0);assert.ok(state.gateResults.slice(0,6).every(g=>g.afterburnerSeconds===0));assert.ok(state.gateResults.every(g=>g.segmentSeconds>0&&g.lastCrossingRadialDistance<=40));assert.ok(state.metrics.maximumG<=9.000001);assert.ok(state.metrics.maximumMach<1);assert.ok(state.metrics.minimumSeaClearance>0);
 assert.ok(Math.abs(state.gateResults.reduce((s,g)=>s+g.segmentSeconds,0)-state.simulationSeconds)<1e-7);
 assert.deepEqual(events.filter(e=>['gate-pass','exit-pass'].includes(e.type)).map(e=>e.gateId),course.gates.map(g=>g.id));
 console.log(JSON.stringify({seconds:state.simulationSeconds,maxMach:state.metrics.maximumMach,maxG:state.metrics.maximumG,minClearance:state.metrics.minimumSeaClearance,segments:state.gateResults.map(g=>g.segmentSeconds)}));
});
