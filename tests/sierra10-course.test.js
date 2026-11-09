import test from 'node:test';
import assert from 'node:assert/strict';
import {SIERRA10_COURSE,SIERRA10_PROJECTION} from '../src/courses/sierra10.js';
import {projectSierraCoordinates,SIERRA_SOURCE_POINTS,SIERRA_COURSE} from '../src/courses/sierra50.js';
import {createSupersonicProfile} from '../src/supersonic/profile.js';
import {validateSupersonicCourse,supersonicTurnRadius,SUPERSONIC_COURSE} from '../src/supersonic/course.js';
import {createSupersonicState,advanceSupersonic} from '../src/supersonic/physics.js';
import {sweepSea,gateCrossing} from '../src/supersonic/gate-crossing.js';
import {supersonicSpeedPresentation} from '../src/supersonic-presentation.js';
import {supersonicFeedback} from '../src/feedback/supersonic-model.js';
import {courseRecordMetadata} from '../src/course-world-profile.js';
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<e,`${a} vs ${b}`);
const expected=[[-3880,60,7682],[-4331,97,5142],[-617,94,3363],[842,91,65],[1579,103,-2975],[4331,139,-5495],[3068,72,-7682]];
test('1/10 projection exactly reproduces supplied estimated A..G coordinates and keeps 1/50 separate',()=>{
 assert.deepEqual(SIERRA10_PROJECTION.points.map(p=>Object.values(p.position)),expected);
 assert.deepEqual(projectSierraCoordinates(SIERRA_SOURCE_POINTS,{horizontalDivisor:10,verticalExaggeration:1,gateHeightOffset:60,roundDecimals:0}),SIERRA10_PROJECTION);
 assert.equal(SIERRA_COURSE.id,'sierra50');assert.equal(SIERRA_COURSE.coordinateTransform.horizontalDivisor,50);
 assert.equal(SIERRA10_COURSE.gates.length,7);assert.equal(SIERRA10_COURSE.surface.heightAt(1,1),0);
 const {start,lights:[a,b]}=SIERRA10_COURSE;near(Math.hypot(start.x-a.x,start.z-a.z),1000);
 near(SIERRA10_COURSE.startHeading,Math.atan2(b.x-a.x,a.z-b.z));
 assert.ok((SIERRA10_COURSE.startHeading*180/Math.PI+360)%360>349);
 assert.equal(courseRecordMetadata(SIERRA10_COURSE).coordinateTransform.horizontalDivisor,10);
});
test('subsonic profile is course-owned and does not alter the existing sonic profile or shared settings',()=>{
 const saved={maxG:12,fuelMode:'unlimited',pitchGain:1,radarRange:20000},before=structuredClone(saved);
 const p=createSupersonicProfile(saved,SIERRA10_COURSE);assert.deepEqual(saved,before);
 assert.equal(p.startSpeed,150);assert.equal(p.maxSpeed,300);assert.equal(p.maxG,9);assert.equal(p.fuelMode,'gauge');assert.equal(p.effectiveSettings.radarRange,5000);
 assert.equal(p.presentationReferenceSpeed,300);assert.equal(p.fuel.lowAltitude.maxClearance,160);
 assert.deepEqual(createSupersonicProfile(saved,SUPERSONIC_COURSE),createSupersonicProfile(saved));
 const check=validateSupersonicCourse(SIERRA10_COURSE,p);assert.equal(check.valid,true,check.errors.join(';'));
 assert.ok(check.geometry.length>19000&&check.geometry.length<21000);
 assert.ok(check.checks.abLength>2000);
 assert.ok(check.geometry.turns.every(t=>t.radius===null||t.radius>=supersonicTurnRadius(300,9)));
});
test('AB reaches the real 300m/s cap without false M1/M2 records and normal level thrust tends to 250',()=>{
 const p=createSupersonicProfile(null,SIERRA10_COURSE);let state=createSupersonicState(p,SIERRA10_COURSE),events=[];
 for(let i=0;i<15;i++){const r=advanceSupersonic(state,{throttle:1,afterburnerRequested:true},1,p,SIERRA10_COURSE);state=r.state;events.push(...r.events);assert.ok(state.speed<=300+1e-7);}
 assert.ok(state.metrics.maximumSpeed>299);assert.ok(state.metrics.maximumMach<1);assert.equal(state.metrics.firstMach1Seconds,null);assert.equal(state.metrics.firstMach2Seconds,null);
 assert.ok(!events.some(e=>['mach2-reached','sonic-transition'].includes(e.type)));
 let dry=createSupersonicState(p,SIERRA10_COURSE);for(let i=0;i<300;i++)dry=advanceSupersonic(dry,{throttle:1},1,p,SIERRA10_COURSE).state;
 assert.ok(dry.speed>245&&dry.speed<=250.001);
});
test('300m/s segments cannot tunnel through a 40m gate or the flat ground',()=>{
 const gate=SIERRA10_COURSE.gates[0],n=gate.normal,from={x:gate.center.x+n.x*100,y:gate.center.y,z:gate.center.z+n.z*100},to={x:gate.center.x-n.x*200,y:gate.center.y,z:gate.center.z-n.z*200};
 assert.equal(gateCrossing(from,to,gate).inside,true);
 const p=createSupersonicProfile(null,SIERRA10_COURSE),s=sweepSea({x:0,y:60,z:0},{x:0,y:-240,z:0},SIERRA10_COURSE.surface.heightAt(0,0),{hull:p.hull});assert.ok(s.contact&&s.contact.fraction>0&&s.contact.fraction<1);
});

test('low-altitude fuel rewards conserve the gauge and pauses cannot generate fuel',()=>{
 const p=createSupersonicProfile(null,SIERRA10_COURSE),initial=createSupersonicState(p,SIERRA10_COURSE);
 const low=advanceSupersonic(initial,{throttle:1},1,p,SIERRA10_COURSE).state;
 assert.ok(low.afterburner.earned>0);near(low.afterburner.fuel,p.fuel.startFuel+low.afterburner.earned-low.afterburner.consumed);
 const paused=advanceSupersonic(low,{paused:true},30,p,SIERRA10_COURSE).state;near(paused.afterburner.earned,low.afterburner.earned);near(paused.simulationSeconds,low.simulationSeconds);
 const high={...initial,position:{...initial.position,y:300}};const result=advanceSupersonic(high,{throttle:1},1,p,SIERRA10_COURSE).state;assert.equal(result.afterburner.earned,0);
});
test('the real kernel stops at physical ground contact during a 300m/s descent',()=>{
 const course={...SIERRA10_COURSE,start:{...SIERRA10_COURSE.start,y:10},flightProfile:{...SIERRA10_COURSE.flightProfile,startSpeed:300}},p=createSupersonicProfile(null,course),initial=createSupersonicState(p,course);
 const result=advanceSupersonic(initial,{throttle:0,pitchDemandRadians:-5.25*Math.PI/180},4,p,course);
 assert.equal(result.state.grounded,true);assert.ok(result.state.simulationSeconds<4);near(result.state.terminal.contactPoint.y,0,1e-7);assert.equal(result.state.groundClearance,0);
 assert.ok(result.events.some(e=>e.type==='sea-contact'));assert.ok(result.state.speed<=300.000001);
});

test('speed presentation and wind still rise from 250 to 300 without changing physical speed',()=>{
 const settings={speedFov:10,highSpeedShake:false,presentationReferenceSpeed:300};assert.ok(supersonicSpeedPresentation(250,settings).extraFov<supersonicSpeedPresentation(300,settings).extraFov);
 const feedback=v=>supersonicFeedback({speed:v,supersonic:{mach:v/340,presentationReferenceSpeed:300}},{engineHz:100});assert.ok(feedback(250).wind<feedback(300).wind);assert.equal(feedback(250).speed,250);assert.equal(feedback(300).speed,300);
});
