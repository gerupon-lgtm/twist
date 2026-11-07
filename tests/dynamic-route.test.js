import test from 'node:test';
import assert from 'node:assert/strict';
import {createRouteTiming,ROUTE_SEGMENTS} from '../src/route-timing.js';
import {flightReport,copyableFlightReport} from '../src/flight-session.js';

for(const total of [3,5,8])test(`${total} lights produce ${total+1} isolated intervals and open the exit only after the final light`,()=>{
  const timing=createRouteTiming(total),sample=(collected,extra={})=>({collected,total,...extra});
  assert.equal(timing.snapshot().length,total+1);assert.equal(timing.targetViewsSnapshot().length,total+1);
  assert.equal(timing.snapshot().at(-1).id,`light${total}-exit`);
  assert.equal(timing.snapshot().at(-1).label,`光${total}→出口`);
  if(total===3)assert.deepEqual(timing.snapshot().map(({id,label})=>({id,label})),ROUTE_SEGMENTS);
  timing.advance(0,sample(0,{targetVisible:true}));
  for(let collected=1;collected<=total;collected++){
    timing.advance(collected,sample(collected,{targetVisible:true,exitVisible:collected===total}));
    assert.equal(timing.exitSnapshot().opened,collected===total);
  }
  timing.advance(2,sample(total,{complete:true,targetVisible:true,exitVisible:true}));
  assert.deepEqual(timing.snapshot().map(segment=>segment.seconds),[...Array.from({length:total},(_,i)=>i+1),2]);
  assert.deepEqual(timing.targetViewsSnapshot().map(segment=>segment.firstVisibleSeconds),Array(total+1).fill(0));
  assert.deepEqual(timing.exitSnapshot(),{opened:true,firstVisibleSeconds:0});
  const before=JSON.stringify(timing.snapshot());timing.advance(100,sample(total,{complete:true}));assert.equal(JSON.stringify(timing.snapshot()),before);
  const copy=timing.snapshot();copy[0].seconds=999;copy.at(-1).id='bad';copy.pop();
  assert.equal(timing.snapshot().length,total+1);assert.equal(timing.snapshot()[0].seconds,1);
});

test('changing course count resets all clocks; no-argument reset keeps the current count',()=>{
  const timing=createRouteTiming(5);timing.advance(2,{total:5,collected:5,complete:true,targetVisible:true,exitVisible:true});
  timing.reset(8);assert.equal(timing.snapshot().length,9);assert.ok(timing.snapshot().every(segment=>segment.seconds===null));
  assert.ok(timing.targetViewsSnapshot().every(segment=>segment.firstVisibleSeconds===null));
  assert.deepEqual(timing.exitSnapshot(),{opened:false,firstVisibleSeconds:null});
  timing.advance(1,{total:8,collected:1});timing.reset();assert.equal(timing.snapshot().length,9);
  timing.reset('8');assert.equal(timing.snapshot().length,9);
  timing.reset(9);assert.equal(timing.snapshot().length,9);
  timing.reset(3);assert.equal(timing.snapshot().length,4);assert.equal(timing.snapshot().at(-1).label,'光3→出口');
  for(const value of [0,2,9,1.5,NaN,Infinity,'8',null,{}]){
    assert.equal(createRouteTiming(value).snapshot().length,4);
    timing.reset(value);assert.equal(timing.snapshot().length,4);
  }
});

test('samples for a different or malformed total cannot mix course time, visibility, or completion',()=>{
  const timing=createRouteTiming(8);
  timing.advance(1,{total:8,collected:0,targetVisible:false});
  for(const total of [3,5,0,-1,9,NaN,Infinity,'8',null])timing.advance(50,{total,collected:8,complete:true,targetVisible:true,exitVisible:true});
  assert.ok(timing.snapshot().every(segment=>segment.seconds===null));
  assert.ok(timing.targetViewsSnapshot().every(segment=>segment.firstVisibleSeconds===null));
  assert.deepEqual(timing.exitSnapshot(),{opened:false,firstVisibleSeconds:null});
  timing.advance(1,{total:8,collected:1,targetVisible:true});assert.equal(timing.snapshot()[0].seconds,2);
  assert.equal(timing.targetViewsSnapshot()[1].firstVisibleSeconds,0);
});

test('eight-light exit completion preserves zero-time and independent exit discovery semantics',()=>{
  const timing=createRouteTiming(8);
  timing.advance(3,{total:8,collected:8,targetVisible:false,exitVisible:true});
  timing.advance(0,{total:8,collected:8,complete:true,targetVisible:true,exitVisible:false});
  assert.deepEqual(timing.snapshot().map(segment=>segment.seconds),[3,0,0,0,0,0,0,0,null]);
  assert.equal(timing.targetViewsSnapshot().at(-1).firstVisibleSeconds,0);
  assert.deepEqual(timing.exitSnapshot(),{opened:true,firstVisibleSeconds:0});
  timing.advance(20,{total:8,collected:8,targetVisible:true});
  assert.equal(timing.snapshot().at(-1).seconds,null);
});

test('optional course and stage size are cloned into reports and copied without changing legacy segment labels',()=>{
  const course={id:'hard',name:'むずかしい',targetCount:8},stageSize={halfExtent:350,width:700,depth:700};
  const timing=createRouteTiming(8),segments=timing.snapshot(),targetViews=timing.targetViewsSnapshot();
  const report=flightReport({version:'0.1.26',mode:'flight',pitch:'angle',steer:'tilt',course,stageSize,segments,targetViews});
  course.name='changed';stageSize.width=1;segments.at(-1).label='changed';targetViews.at(-1).firstVisibleSeconds=99;
  const copied=JSON.parse(copyableFlightReport(report));
  assert.deepEqual(copied.course,{id:'hard',name:'むずかしい',targetCount:8});
  assert.deepEqual(copied.stageSize,{halfExtent:350,width:700,depth:700});
  assert.equal(copied.segments.at(-1).label,'光8→出口');assert.equal(copied.targetViews.at(-1).firstVisibleSeconds,null);
  const legacy=flightReport({version:'0.1.25',pitch:'angle',steer:'tilt'});
  assert.equal(Object.hasOwn(legacy,'course'),false);assert.equal(Object.hasOwn(legacy,'stageSize'),false);
  assert.ok(flightReport({mode:'explore'}).inactiveSettings.includes('turnGravity'));
});
