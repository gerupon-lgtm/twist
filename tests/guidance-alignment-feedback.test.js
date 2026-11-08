import test from 'node:test';
import assert from 'node:assert/strict';
import {createGuidanceAlignmentFeedback} from '../src/guidance-alignment-feedback.js';

const sample=(feedback,now,error,extra={})=>feedback.advance({now,angularErrorDegrees:error,usable:true,phase:'running',courseId:'easy',targetId:'light-1',camera:'chase',...extra});
function pulse(feedback,at=100){sample(feedback,at-30,0);sample(feedback,at-20,3);return sample(feedback,at,2);}

test('first aligned display is quiet; a usable three-to-two degree entry pulses for280ms once',()=>{
  const f=createGuidanceAlignmentFeedback();assert.equal(sample(f,0,0).active,false);
  assert.equal(sample(f,10,3).armed,true);const entered=sample(f,100,2);
  assert.equal(entered.active,true);assert.equal(entered.serial,1);assert.equal(entered.startedAt,100);
  assert.equal(sample(f,200,1).active,true);assert.equal(sample(f,379,1).active,true);
  const ended=sample(f,380,1);assert.equal(ended.active,false);assert.equal(ended.remainingMs,0);
  assert.equal(sample(f,2000,0).serial,1);assert.equal(sample(f,2000,0).active,false);
});

test('hysteresis needs an observed separation and does not arm between two and three degrees',()=>{
  const f=createGuidanceAlignmentFeedback();sample(f,0,2.5);sample(f,10,2.8);assert.equal(sample(f,20,1).active,false);
  assert.equal(sample(f,30,3).armed,true);assert.equal(sample(f,40,2.6).armed,true);
  assert.equal(sample(f,50,2).active,true);
});

test('cooldown consumes a suppressed entry without replaying it while overlap continues',()=>{
  const f=createGuidanceAlignmentFeedback();assert.equal(pulse(f).active,true);
  sample(f,200,4);assert.equal(sample(f,300,1).serial,1);
  const held=sample(f,1200,1);assert.equal(held.active,false);assert.equal(held.serial,1);
  sample(f,1250,3);const fresh=sample(f,1300,2);assert.equal(fresh.active,true);assert.equal(fresh.serial,2);
});

test('a fresh entry can fire exactly900ms after the previous entry',()=>{
  const f=createGuidanceAlignmentFeedback();pulse(f);sample(f,998,3);assert.equal(sample(f,999,2).serial,1);
  sample(f,999.5,3);assert.equal(sample(f,1000,2).serial,2);
});

test('hidden pair cancels the active pulse and cannot arm or replay an invisible crossing',()=>{
  const f=createGuidanceAlignmentFeedback();pulse(f);assert.equal(sample(f,150,1,{usable:false}).active,false);
  assert.equal(sample(f,200,0).active,false);sample(f,300,4,{usable:false});sample(f,400,1,{usable:false});
  assert.equal(sample(f,1100,1).active,false);assert.equal(f.snapshot().serial,1);
  sample(f,1150,4);assert.equal(sample(f,1200,1).serial,2);
});

test('target, course and camera changes never trigger from old arming or an active pulse',()=>{
  for(const changed of [{targetId:'light-2'},{courseId:'normal'},{camera:'cockpit'}]){
    const f=createGuidanceAlignmentFeedback();sample(f,0,0);sample(f,10,4);
    assert.equal(sample(f,20,1,changed).active,false);
    sample(f,30,4,changed);assert.equal(sample(f,40,1,changed).active,true);
    assert.equal(sample(f,50,1).active,false);assert.equal(f.snapshot().serial,1);
  }
});

test('pause/resume and explicit display reset are quiet and preserve cooldown',()=>{
  const f=createGuidanceAlignmentFeedback();pulse(f);assert.equal(sample(f,150,0,{phase:'paused'}).active,false);
  assert.equal(sample(f,200,0).active,false);sample(f,210,3);assert.equal(sample(f,220,1).serial,1);
  f.reset();assert.equal(sample(f,1200,1).active,false);sample(f,1210,3);assert.equal(sample(f,1220,1).serial,2);
});

test('nonfinite or backwards clocks discard old pulses and snapshots stay finite',()=>{
  for(const invalid of [NaN,Infinity,-Infinity,50]){
    const f=createGuidanceAlignmentFeedback();pulse(f);
    assert.equal(sample(f,invalid,1).active,false);assert.equal(sample(f,200,1).active,false);
    const snapshot=f.snapshot();assert.equal(snapshot.serial,1);
    for(const key of ['remainingMs','progress','serial'])assert.ok(Number.isFinite(snapshot[key]));
    assert.ok(snapshot.lastPulseAt===null||Number.isFinite(snapshot.lastPulseAt));
    sample(f,220,3);assert.equal(sample(f,230,1).serial,1);assert.equal(sample(f,1200,1).active,false);
  }
});

test('returned diagnostics cannot mutate the next arming decision',()=>{
  const f=createGuidanceAlignmentFeedback();const first=sample(f,0,0);first.armed=true;first.serial=99;
  assert.equal(sample(f,1000,0).serial,0);assert.equal(sample(f,1000,0).active,false);
  sample(f,1100,3);const entered=sample(f,1200,2);assert.equal(entered.serial,1);
});
