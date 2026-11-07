import test from 'node:test';import assert from 'node:assert/strict';
import {createRouteTiming} from '../src/route-timing.js';
test('route segments record each completed interval and freeze at the exit',()=>{
 const r=createRouteTiming();r.advance(3,{collected:1});r.advance(2,{collected:2});r.advance(4,{collected:3});r.advance(5,{collected:3,complete:true});r.advance(100,{collected:3,complete:true});assert.deepEqual(r.snapshot().map(s=>s.seconds),[3,2,4,5]);
});
test('uncompleted segments remain null, invalid/paused time is excluded, and retry starts fresh',()=>{
 const r=createRouteTiming();for(const dt of [0,-1,NaN,Infinity])r.advance(dt,{collected:1});assert.ok(r.snapshot().every(s=>s.seconds===null));
 r.advance(1,{collected:0});r.advance(1,{collected:1});assert.deepEqual(r.snapshot().map(s=>s.seconds),[2,null,null,null]);const copy=r.snapshot();copy[0].seconds=999;assert.equal(r.snapshot()[0].seconds,2);r.reset();assert.ok(r.snapshot().every(s=>s.seconds===null));
});

test('exit timing starts only at the third light and ignores earlier visibility',()=>{
 const r=createRouteTiming();assert.deepEqual(r.exitSnapshot(),{opened:false,firstVisibleSeconds:null});
 r.advance(3,{collected:1,exitVisible:true});r.advance(2,{collected:2,exitVisible:true});
 assert.deepEqual(r.exitSnapshot(),{opened:false,firstVisibleSeconds:null});
 r.advance(4,{collected:3,exitVisible:false});
 assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:null});
});

test('an exit already in view when the third light is collected records zero seconds',()=>{
 const r=createRouteTiming();r.advance(7,{collected:3,exitVisible:true});
 assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:0});
 assert.deepEqual(r.snapshot().map(s=>s.seconds),[7,0,0,null]);
});

test('first visibility counts only supplied active seconds and survives view changes',()=>{
 const r=createRouteTiming();r.advance(8,{collected:3});
 r.advance(2,{collected:3,exitVisible:false,camera:'cockpit'});
 // Pauses and waiting do not call advance; invalid samples add no play time.
 for(const dt of [-1,NaN,Infinity,-Infinity])r.advance(dt,{collected:3,exitVisible:true});
 r.advance(0,{collected:3,exitVisible:false});
 assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:null});
 r.advance(3,{collected:3,exitVisible:true,camera:'chase'});
 assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:5});
});

test('first visibility is latched even if the exit leaves view or collection state changes',()=>{
 const r=createRouteTiming();r.advance(2,{collected:3});r.advance(1,{collected:3,exitVisible:true});
 r.advance(4,{collected:3,exitVisible:false});r.advance(5,{collected:0,exitVisible:true});
 assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:1});
});

test('invalid collection counts and invalid time cannot open or reveal the exit',()=>{
 const r=createRouteTiming();
 for(const collected of [-1,4,1.5,NaN,undefined,'3'])r.advance(1,{collected,complete:true,exitVisible:true});
 for(const dt of [-1,NaN,Infinity,-Infinity])r.advance(dt,{collected:3,exitVisible:true});
 assert.deepEqual(r.exitSnapshot(),{opened:false,firstVisibleSeconds:null});
 assert.ok(r.snapshot().every(s=>s.seconds===null));
});

test('zero active time can sample visibility without changing existing segment semantics',()=>{
 const r=createRouteTiming();r.advance(1,{collected:3});r.advance(0,{collected:3,complete:true,exitVisible:true});
 assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:0});
 assert.deepEqual(r.snapshot().map(s=>s.seconds),[1,0,0,null]);
 const fresh=createRouteTiming();fresh.advance(0,{collected:3,exitVisible:true});
 assert.deepEqual(fresh.exitSnapshot(),{opened:true,firstVisibleSeconds:0});
 assert.ok(fresh.snapshot().every(s=>s.seconds===null));
});

test('completion freezes an undiscovered exit and all segment intervals',()=>{
 const r=createRouteTiming();r.advance(3,{collected:3});r.advance(2,{collected:3,complete:true});
 r.advance(100,{collected:3,exitVisible:true});r.advance(0,{collected:3,exitVisible:true});
 assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:null});
 assert.deepEqual(r.snapshot().map(s=>s.seconds),[3,0,0,2]);
});

test('visibility on the completion frame is recorded before timing freezes',()=>{
 const r=createRouteTiming();r.advance(3,{collected:3});r.advance(2,{collected:3,complete:true,exitVisible:true});
 r.advance(100,{collected:3,exitVisible:true});
 assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:2});
 assert.deepEqual(r.snapshot().map(s=>s.seconds),[3,0,0,2]);
});

test('retry clears both measurements and returned exit snapshots cannot mutate timing',()=>{
 const r=createRouteTiming();r.advance(2,{collected:3,exitVisible:true,complete:true});
 const snapshot=r.exitSnapshot();snapshot.opened=false;snapshot.firstVisibleSeconds=999;
 assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:0});
 r.reset();assert.deepEqual(r.exitSnapshot(),{opened:false,firstVisibleSeconds:null});
 assert.ok(r.snapshot().every(s=>s.seconds===null));
 r.advance(3,{collected:3});r.advance(4,{collected:3,exitVisible:true});
 assert.deepEqual(r.exitSnapshot(),{opened:true,firstVisibleSeconds:4});
});
