import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceFrameClock} from '../src/frame-clock.js';

test('negative and zero first frame deltas retain the actual launch boundary',()=>{
  assert.deepEqual(advanceFrameClock(1000,999),{time:1000,dt:0});
  assert.deepEqual(advanceFrameClock(1000,1000),{time:1000,dt:0});
});

test('rounding-size positive timestamps stay at the boundary and their elapsed time is carried forward',()=>{
  for(const previous of [1000,5833.5,1000000]){
    let clock={time:previous,dt:0};
    for(const offset of [Number.EPSILON*previous,4*Number.EPSILON*previous,5e-10]){
      clock=advanceFrameClock(clock.time,previous+offset);
      assert.deepEqual(clock,{time:previous,dt:0});
    }
    const next=advanceFrameClock(clock.time,previous+16);
    assert.equal((clock.time-previous)/1000+next.dt,.016);
    assert.equal(next.time,previous+16);
  }
});

test('long-uptime timestamp rounding is coalesced while meaningful positive intervals retain the original cap',()=>{
  const previous=1e9,rounding=advanceFrameClock(previous,previous+Number.EPSILON*previous);
  assert.deepEqual(rounding,{time:previous,dt:0});
  assert.deepEqual(advanceFrameClock(rounding.time,previous+16),{time:previous+16,dt:.016});
  const subMicrosecond=advanceFrameClock(1000,1000+1e-6);
  assert.ok(subMicrosecond.dt>0);assert.equal(subMicrosecond.time,1000+1e-6);
});
test('the next positive frame counts from launch rather than the older queued timestamp',()=>{
  const first=advanceFrameClock(1000,999),next=advanceFrameClock(first.time,1016);
  assert.deepEqual(next,{time:1016,dt:.016});
  assert.equal((first.time-1000)/1000+(next.time-first.time)/1000,.016);
});
test('prelaunch menu time is never imported into the first active step',()=>{
  const first=advanceFrameClock(5000,1000),next=advanceFrameClock(first.time,5016);
  assert.deepEqual(first,{time:5000,dt:0});assert.deepEqual(next,{time:5016,dt:.016});
});
test('positive physics steps are capped while the record clock retains the actual elapsed gap',()=>{
  assert.deepEqual(advanceFrameClock(1000,1020),{time:1020,dt:.02});
  assert.deepEqual(advanceFrameClock(1000,1250),{time:1250,dt:.05});
  assert.deepEqual(advanceFrameClock(1000,1250,{maxStep:.02}),{time:1250,dt:.02});
  assert.deepEqual(advanceFrameClock(1000,1016,{maxStep:0}),{time:1016,dt:0});
});
test('an unknown previous timestamp establishes a finite boundary without inventing elapsed time',()=>{
  for(const previous of [undefined,NaN,Infinity,-Infinity])assert.deepEqual(advanceFrameClock(previous,1000),{time:1000,dt:0});
  assert.deepEqual(advanceFrameClock(NaN,Infinity),{time:0,dt:0});
});
test('an invalid incoming timestamp cannot change a valid active boundary',()=>{
  for(const frame of [undefined,NaN,Infinity,-Infinity])assert.deepEqual(advanceFrameClock(1000,frame),{time:1000,dt:0});
});
test('an invalid step limit falls back to the existing fifty millisecond cap',()=>{
  for(const maxStep of [NaN,Infinity,-1])assert.deepEqual(advanceFrameClock(1000,2000,{maxStep}),{time:2000,dt:.05});
});
