import test from 'node:test';
import assert from 'node:assert/strict';
import {createRouteTiming} from '../src/route-timing.js';

const views=r=>r.targetViewsSnapshot().map(s=>s.firstVisibleSeconds);

test('initial visibility can be sampled at zero without completing a segment',()=>{
  const r=createRouteTiming();
  assert.equal(typeof r.targetViewsSnapshot,'function');
  assert.deepEqual(r.targetViewsSnapshot(),[
    {id:'start-light1',firstVisibleSeconds:null},
    {id:'light1-light2',firstVisibleSeconds:null},
    {id:'light2-light3',firstVisibleSeconds:null},
    {id:'light3-exit',firstVisibleSeconds:null},
  ]);
  r.advance(0,{collected:0,targetVisible:true});
  assert.deepEqual(views(r),[0,null,null,null]);
  assert.deepEqual(r.snapshot().map(s=>s.seconds),[null,null,null,null]);
});

test('each active target measures its own first view and latches that result',()=>{
  const r=createRouteTiming();
  r.advance(0,{collected:0,targetVisible:false});
  r.advance(2,{collected:0,targetVisible:false});
  r.advance(3,{collected:0,targetVisible:true});
  r.advance(8,{collected:0,targetVisible:false});
  r.advance(1,{collected:1,targetVisible:false});
  r.advance(4,{collected:1,targetVisible:true});
  r.advance(1,{collected:2,targetVisible:true});
  r.advance(2,{collected:3,targetVisible:false});
  r.advance(6,{collected:3,targetVisible:true});
  assert.deepEqual(views(r),[5,4,0,6]);
});

test('collection-frame visibility belongs only to the new target',()=>{
  const r=createRouteTiming();
  r.advance(2,{collected:0,targetVisible:false});
  r.advance(3,{collected:1,targetVisible:true});
  assert.deepEqual(views(r),[null,0,null,null]);
  r.advance(4,{collected:2,targetVisible:false});
  r.advance(5,{collected:3,targetVisible:true});
  assert.deepEqual(views(r),[null,0,null,0]);
});

test('skipped collection counts leave skipped targets unmeasured',()=>{
  const r=createRouteTiming();
  r.advance(3,{collected:2,targetVisible:true});
  assert.deepEqual(views(r),[null,null,0,null]);
  r.advance(2,{collected:3,targetVisible:false});
  r.advance(1,{collected:3,targetVisible:true});
  assert.deepEqual(views(r),[null,null,0,1]);
});

test('zero-time transitions start a new target clock without completing old intervals',()=>{
  const r=createRouteTiming();
  r.advance(0,{collected:1,targetVisible:true});
  r.advance(0,{collected:2,targetVisible:false});
  r.advance(2,{collected:2,targetVisible:true});
  assert.deepEqual(views(r),[null,0,2,null]);
  assert.deepEqual(r.snapshot().map(s=>s.seconds),[2,0,null,null]);
});

test('only supplied active time counts and camera or replay fields do not reset it',()=>{
  const r=createRouteTiming();
  r.advance(1,{collected:0,targetVisible:false,camera:'cockpit'});
  for(const dt of [-1,NaN,Infinity,-Infinity,undefined,'3']) {
    r.advance(dt,{collected:3,targetVisible:true,complete:true});
  }
  r.advance(0,{collected:0,targetVisible:false,camera:'chase',replay:true});
  r.advance(2,{collected:0,targetVisible:true,camera:'overlay'});
  assert.deepEqual(views(r),[3,null,null,null]);
});

test('invalid or decreasing counts cannot reveal or restart targets',()=>{
  const r=createRouteTiming();
  r.advance(1,{collected:1,targetVisible:false});
  for(const collected of [-1,4,1.5,NaN,undefined,'3',0]) {
    r.advance(1,{collected,targetVisible:true,complete:true});
  }
  assert.deepEqual(views(r),[null,null,null,null]);
  r.advance(1,{collected:1,targetVisible:true});
  assert.deepEqual(views(r),[null,8,null,null]);
});

test('malformed state is safe and still advances valid supplied play time',()=>{
  const r=createRouteTiming();
  for(const state of [null,undefined,3,'bad',false])r.advance(1,state);
  r.advance(1,{collected:0,targetVisible:1});
  assert.deepEqual(views(r),[null,null,null,null]);
  r.advance(1,{collected:0,targetVisible:true});
  assert.deepEqual(views(r),[7,null,null,null]);
});

test('an active exit can be first seen on its completion frame and then stays frozen',()=>{
  const r=createRouteTiming();
  r.advance(1,{collected:3,targetVisible:false});
  r.advance(2,{collected:3,complete:true,targetVisible:true,exitVisible:true});
  r.advance(99,{collected:3,targetVisible:true});
  r.advance(0,{collected:0,targetVisible:true});
  assert.deepEqual(views(r),[null,null,null,2]);
  assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:2});
  assert.deepEqual(r.snapshot().map(s=>s.seconds),[1,0,0,2]);
});

test('zero-time completion freezes target timing while retaining v24 interval semantics',()=>{
  const r=createRouteTiming();
  r.advance(1,{collected:3,targetVisible:false});
  r.advance(0,{collected:3,complete:true,targetVisible:true,exitVisible:true});
  assert.deepEqual(r.snapshot().map(s=>s.seconds),[1,0,0,null]);
  assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:0});
  r.advance(5,{collected:3,targetVisible:true});
  assert.deepEqual(views(r),[null,null,null,0]);
});

test('jumping straight to complete does not apply the final sample to an inactive exit',()=>{
  const r=createRouteTiming();
  r.advance(1,{collected:0,targetVisible:false});
  r.advance(3,{collected:3,complete:true,targetVisible:true,exitVisible:true});
  assert.deepEqual(views(r),[null,null,null,null]);
  assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:0});
});

test('snapshots are isolated and reset clears target clocks and frozen state',()=>{
  const r=createRouteTiming();
  r.advance(0,{collected:0,targetVisible:true});
  r.advance(1,{collected:3,complete:true,targetVisible:true});
  const copy=r.targetViewsSnapshot();copy[0].firstVisibleSeconds=999;copy[1].id='bad';copy.pop();
  assert.deepEqual(views(r),[0,null,null,null]);
  r.reset();
  assert.deepEqual(views(r),[null,null,null,null]);
  assert.deepEqual(r.exitSnapshot(),{opened:false,firstVisibleSeconds:null});
  assert.deepEqual(r.snapshot().map(s=>s.seconds),[null,null,null,null]);
  r.advance(2,{collected:0,targetVisible:true});
  assert.deepEqual(views(r),[2,null,null,null]);
});

test('targetVisible is independent of the v24 exitVisible sample',()=>{
  const r=createRouteTiming();
  r.advance(2,{collected:3,targetVisible:false,exitVisible:true});
  r.advance(3,{collected:3,targetVisible:true,exitVisible:false});
  assert.deepEqual(views(r),[null,null,null,3]);
  assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:0});
});
