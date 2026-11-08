import test from 'node:test';import assert from 'node:assert/strict';
import {createApproachRecords,closestSegmentDistance} from '../src/approach-records.js';
import {createCourseBestStore,courseBestKey,formatCourseTime,COURSE_BESTS_KEY} from '../src/course-bests.js';
import {createStraightRecords,laneMovementFraction} from '../src/straight-records.js';
import {createPassByTracker} from '../src/passby-events.js';
import {radarUpgradeOffer,RADAR_UPGRADE_KEY} from '../src/radar-upgrade.js';
const storage=()=>{const map=new Map();return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value))};};
const pos=(x,z=0,y=20)=>({x,y,z});
const state=(x,count=0,extra={})=>({position:pos(x),targetPosition:pos(0),total:3,collected:count,complete:false,...extra});
test('closest approaches use the travelled line without awarding any collection',()=>{
  assert.equal(closestSegmentDistance(pos(-20),pos(20),pos(0)),0);
  const r=createApproachRecords();r.advance(0,state(-25));r.advance(1,state(25));
  assert.equal(r.snapshot()[0].closestDistance,0);assert.equal(r.snapshot()[0].nearMisses,1);
  r.advance(1,state(30));assert.equal(r.snapshot()[0].nearMisses,1);
});
test('near visits count once with boundary hysteresis and successful capture is not a miss',()=>{
  const r=createApproachRecords();r.advance(0,state(25));for(const x of [14,16,14,17,19])r.advance(.1,state(x));
  assert.equal(r.snapshot()[0].nearMisses,1);
  r.advance(.1,state(14));r.advance(.1,state(2,1,{targetPosition:pos(100)}));
  assert.equal(r.snapshot()[0].nearMisses,1);assert.equal(r.snapshot()[0].closestDistance,2);
  assert.equal(r.snapshot()[1].closestDistance,98);assert.equal(r.snapshot()[2].closestDistance,null);
  r.reset(5);assert.equal(r.snapshot().length,6);assert.equal(r.snapshot()[0].closestDistance,null);
});
test('best times are local, separate modes/layouts, retain a faster previous record and survive reload',()=>{
  const data=storage(),course={id:'easy',start:pos(0),lights:[pos(10),pos(20),pos(30)],exit:pos(40)};
  const store=createCourseBestStore(data,{now:()=>new Date(0).toISOString()});
  assert.equal(store.best(course,'flight'),null);assert.equal(store.complete(course,'flight',75).newBest,true);
  const slower=store.complete(course,'flight',80);assert.equal(slower.bestSeconds,75);assert.equal(slower.newBest,false);
  assert.equal(createCourseBestStore(data).best(course,'flight'),75);assert.equal(store.best(course,'explore'),null);
  assert.notEqual(courseBestKey(course),courseBestKey({...course,exit:pos(50)}));
  assert.equal(store.complete(course,'flight',NaN),null);assert.equal(store.complete(course,'flight',-1),null);
  assert.equal(formatCourseTime(59.96),'1:00.0');assert.equal(formatCourseTime(75.12),'1:15.1');
  data.setItem(COURSE_BESTS_KEY,'broken');assert.equal(createCourseBestStore(data).best(course,'flight'),null);
  assert.equal(createCourseBestStore({getItem(){throw Error();},setItem(){throw Error();}}).complete(course,'flight',70).saved,false);
});
test('AB use is accumulated only for the actual movement within a straight corridor',()=>{
  const lane={id:'final',from:pos(0),to:pos(100),width:24,heightTolerance:12};
  assert.equal(laneMovementFraction(lane,pos(-50),pos(150)),.5);
  assert.equal(laneMovementFraction(lane,pos(-50,30),pos(150,30)),0);
  const r=createStraightRecords([lane]);r.advance({position:pos(-50),afterburner:{seconds:0}});r.advance({position:pos(150),afterburner:{seconds:4},afterburnerMotion:[{from:pos(-50),to:pos(150),seconds:4}]});
  assert.deepEqual(r.snapshot()[0],{id:'final',length:100,usedAfterburner:true,afterburnerSeconds:2});
  r.advance({position:pos(150),afterburner:{seconds:4},afterburnerMotion:[{from:pos(-50),to:pos(150),seconds:4}]});assert.equal(r.snapshot()[0].afterburnerSeconds,2,'resuming does not count the previous movement again');
  r.reset([lane]);r.advance({position:pos(0),afterburner:{seconds:0}});r.advance({position:pos(100),afterburner:{seconds:0}});assert.equal(r.snapshot()[0].usedAfterburner,false);
  r.reset([lane]);r.advance({position:pos(-.2),afterburner:{seconds:0}});r.advance({position:pos(.3),afterburner:{seconds:.001},afterburnerMotion:[{from:pos(-.2),to:pos(-.19),seconds:.001}]});assert.equal(r.snapshot()[0].usedAfterburner,false,'fuel exhausted before entry does not become an in-lane burn');
});
test('near props produce one speed-sensitive pass event, no queued event at slow speed or on pause',()=>{
  const r=createPassByTracker(),objects=[{id:'pillar',position:pos(0),radius:1}];
  r.advance(0,{position:pos(-30),speed:30,objects});
  assert.equal(r.advance(.1,{position:pos(-5),speed:30,objects}).length,1);
  assert.equal(r.advance(.1,{position:pos(5),speed:30,objects}).length,0);
  assert.equal(r.advance(.3,{position:pos(30),speed:30,objects}).length,0,'leaving one visit does not sound twice after the cooldown');
  assert.equal(r.advance(.1,{position:pos(0),speed:10,objects}).length,0);
  assert.equal(r.advance(.3,{position:pos(0),speed:30,objects}).length,0);
});
test('a fast pass down the marked straight can hear pillars eighteen metres to the side',()=>{
  const r=createPassByTracker(),objects=[{id:'lane-pillar',position:pos(0,18),radius:1.7}];
  r.advance(0,{position:pos(-40),speed:45,objects});
  assert.equal(r.advance(.5,{position:pos(0),speed:45,objects}).length,1);
  assert.equal(r.advance(.5,{position:pos(40),speed:45,objects}).length,0);
});
test('radar upgrade asks once for 60m without changing chosen range or unrelated fields',()=>{
  const data=storage();data.setItem('twist.flight-settings.v1',JSON.stringify({radarRange:60,maxBank:25}));
  const offer=radarUpgradeOffer(data);assert.equal(offer.next,180);assert.equal(JSON.parse(data.getItem('twist.flight-settings.v1')).radarRange,60);
  offer.shown();assert.equal(data.getItem(RADAR_UPGRADE_KEY),'shown');assert.equal(radarUpgradeOffer(data),null);
  for(const range of [40,90,180]){const s=storage();s.setItem('twist.flight-settings.v1',JSON.stringify({radarRange:range}));assert.equal(radarUpgradeOffer(s),null);}
});
