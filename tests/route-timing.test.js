import test from 'node:test';import assert from 'node:assert/strict';
import {createRouteTiming} from '../src/route-timing.js';
test('route segments record each completed interval and freeze at the exit',()=>{
 const r=createRouteTiming();r.advance(3,{collected:1});r.advance(2,{collected:2});r.advance(4,{collected:3});r.advance(5,{collected:3,complete:true});r.advance(100,{collected:3,complete:true});assert.deepEqual(r.snapshot().map(s=>s.seconds),[3,2,4,5]);
});
test('uncompleted segments remain null, invalid/paused time is excluded, and retry starts fresh',()=>{
 const r=createRouteTiming();for(const dt of [0,-1,NaN,Infinity])r.advance(dt,{collected:1});assert.ok(r.snapshot().every(s=>s.seconds===null));
 r.advance(1,{collected:0});r.advance(1,{collected:1});assert.deepEqual(r.snapshot().map(s=>s.seconds),[2,null,null,null]);const copy=r.snapshot();copy[0].seconds=999;assert.equal(r.snapshot()[0].seconds,2);r.reset();assert.ok(r.snapshot().every(s=>s.seconds===null));
});
