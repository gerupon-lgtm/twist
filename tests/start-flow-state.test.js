import test from 'node:test';
import assert from 'node:assert/strict';
import {START_PREFERENCES_KEY,createStartPreferences,nextCameraMode,startCountdownPlan,createStartRecord} from '../src/start-flow-state.js';

test('pre-countdown settles for half a second even when fullscreen needs no extra wait',()=>{
  assert.equal(startCountdownPlan({now:6000,fullscreenSucceededAt:0,fullscreenSucceeded:true}).waitMilliseconds,500);
  assert.equal(startCountdownPlan({now:6000,fullscreenSucceeded:false}).totalMilliseconds,3500);
});

test('first-help, camera and method persist in a dedicated key without startup writes',()=>{
  const values=new Map([['twist.flight-settings.v1','{"maxPitch":21}']]),writes=[];
  const storage={getItem:key=>values.get(key),setItem:(key,value)=>{writes.push(key);values.set(key,value);}};
  const prefs=createStartPreferences(storage);assert.equal(prefs.get().tutorialSeen,false);assert.deepEqual(writes,[]);
  prefs.markTutorialSeen();prefs.setCamera('cockpit');prefs.setInputMethod('practice');
  assert.deepEqual(createStartPreferences(storage).get(),{tutorialSeen:true,camera:'cockpit',inputMethod:'practice'});
  assert.equal(values.get('twist.flight-settings.v1'),'{"maxPitch":21}');assert(writes.every(key=>key===START_PREFERENCES_KEY));
});
test('storage denial and invalid values still allow local preference changes',()=>{
  const prefs=createStartPreferences({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});prefs.markTutorialSeen();prefs.setCamera('invalid');assert.equal(prefs.get().tutorialSeen,true);assert.equal(prefs.get().camera,'overlay');assert.equal(prefs.saved(),false);
});
test('in-flight view cycling alternates rear and cockpit while outside stays independent',()=>{
  assert.equal(nextCameraMode('overlay'),'overlay');assert.equal(nextCameraMode('invalid'),'overlay');
  let current='chase';
  for(const expected of ['cockpit','chase','cockpit']){current=nextCameraMode(current);assert.equal(current,expected);}
});
test('quick fullscreen entry leaves six seconds before flight; slow reading uses up the wait',()=>{
  assert.deepEqual(startCountdownPlan({now:1000,fullscreenSucceededAt:0,fullscreenSucceeded:true}),{waitMilliseconds:2000,countdownSeconds:3,totalMilliseconds:5000});
  assert.equal(startCountdownPlan({now:6000,fullscreenSucceededAt:0,fullscreenSucceeded:true}).waitMilliseconds,500);
  assert.equal(startCountdownPlan({now:0,fullscreenSucceeded:false}).totalMilliseconds,3500);
});
test('startup time stays separate and is frozen at the first flight start',()=>{
  const record=createStartRecord();record.begin(100,{tutorialShown:true,firstTime:true});record.fullscreen({fullscreenSucceeded:true,fullscreenSucceededAt:200,fullscreenSource:'title'});record.countdown(startCountdownPlan({now:3200,fullscreenSucceededAt:200,fullscreenSucceeded:true}));
  assert.equal(record.snapshot().flightStartedAt,null);const first=record.start(6200);assert.equal(first.titleToFlightSeconds,6.1);assert.equal(first.fullscreenToFlightSeconds,6);assert.equal(first.countdown,true);assert.deepEqual(record.start(20000),first);
});
