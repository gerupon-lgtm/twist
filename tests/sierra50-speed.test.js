import assert from 'node:assert/strict';
import test from 'node:test';
import {courseFlightProfile,courseFlightMetadata,FLIGHT_MODEL,NORMAL_FLIGHT_PROFILE,SIERRA50_FLIGHT_PROFILE as fast} from '../src/course-flight-profile.js';
import {stepFlightVelocity} from '../src/flight-physics.js';
import {courseBestKey,createCourseBestStore,COURSE_BESTS_KEY} from '../src/course-bests.js';
import {getCourse} from '../src/course-catalog.js';
const pose={forward:{x:0,y:0,z:-1},up:{x:0,y:1,z:0}};

test('only Sierra50 uses faster ordinary-flight model and unlimited AB',()=>{
  assert.equal(courseFlightProfile(getCourse('sierra50')),fast);
  for(const id of ['easy','normal','hard','supersonic','sierra10'])assert.equal(courseFlightProfile(getCourse(id)),NORMAL_FLIGHT_PROFILE);
  assert.equal(FLIGHT_MODEL.cruiseSpeed,10);assert.equal(FLIGHT_MODEL.maxSpeed,30);
  assert.deepEqual(courseFlightMetadata(getCourse('sierra50')),{id:'sierra50-fast-v1',startSpeed:25,levelFullThrottleSpeed:25*Math.sqrt(2),drySpeedLimit:60,afterburnerSpeedLimit:75,unlimitedAfterburner:true,turnGravity:15});
});

test('new25m/s half-output cruise balances lift and drag without drifting',()=>{
  let velocity={x:0,y:0,z:-25};
  for(let i=0;i<1200;i++)velocity=stepFlightVelocity(velocity,1/60,{...pose,throttle:.5,profile:fast}).velocity;
  assert.ok(Math.abs(velocity.y)<1e-9);assert.ok(Math.abs(velocity.z+25)<1e-9);
});

test('actual AB reaches75 and release keeps momentum instead of clipping to60',()=>{
  let velocity={x:0,y:0,z:-25},result;
  for(let i=0;i<1200;i++){result=stepFlightVelocity(velocity,1/60,{...pose,throttle:1,profile:fast,afterburner:true});velocity=result.velocity;assert.ok(result.speed<=75+1e-9);}
  assert.ok(result.speed>74.9);
  const coast=stepFlightVelocity(velocity,1/60,{...pose,throttle:.5,profile:fast,preserveOverspeed:true});
  assert.ok(coast.speed>60&&coast.speed<result.speed);
  const capped=stepFlightVelocity({x:0,y:0,z:-200},0,{...pose,throttle:1,profile:fast});assert.equal(capped.speed,60);
});

test('an explicit ordinary profile is numerically identical to the original default',()=>{
  for(const throttle of [0,.5,1])for(const afterburner of [false,true]){
    const input={...pose,throttle,afterburner};
    assert.deepEqual(stepFlightVelocity({x:2,y:-3,z:-12},.05,{...input,profile:NORMAL_FLIGHT_PROFILE}),stepFlightVelocity({x:2,y:-3,z:-12},.05,input));
  }
});

test('Sierra flight PB separates faster physics while retaining old stored rows and exploration key',()=>{
  const course=getCourse('sierra50'),geometry=[course.start,...course.lights,course.exit];let hash=2166136261;
  for(const c of JSON.stringify(geometry))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
  const legacy='flight:sierra50:'+hash.toString(16).padStart(8,'0');
  assert.notEqual(courseBestKey(course),legacy);assert.equal(courseBestKey(course,'explore'),'explore:'+legacy.slice(7));
  let data=JSON.stringify({version:1,records:{[legacy]:{seconds:300,completedAt:'2026-11-09'}}});
  const storage={getItem:key=>key===COURSE_BESTS_KEY?data:null,setItem:(key,value)=>{data=value;}},store=createCourseBestStore(storage);
  assert.equal(store.best(course,'flight'),null);store.complete(course,'flight',150);
  assert.equal(JSON.parse(data).records[legacy].seconds,300);assert.equal(store.best(course,'flight'),150);
});
