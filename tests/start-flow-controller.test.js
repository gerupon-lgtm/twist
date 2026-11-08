import test from 'node:test';
import assert from 'node:assert/strict';
import {createStartFlowController} from '../src/start-flow-controller.js';
import {createStartPreferences,createStartRecord} from '../src/start-flow-state.js';
import {createBriefingPreferences} from '../src/briefing-preferences.js';
import {getCourse} from '../src/course.js';

function fixture(t,{firstTime=false,inputMethod='sensor',briefingMode='off',request,fullscreenSucceeded=false}={}){
  t.mock.timers.enable({apis:['setTimeout']});
  const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
  const document={hidden:false};Object.defineProperty(globalThis,'document',{value:document,configurable:true});
  t.after(()=>{if(previous)Object.defineProperty(globalThis,'document',previous);else delete globalThis.document;});
  const values=new Map([['twist.flight-settings.v1','{"maxPitch":21}']]);
  const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const preferences=createStartPreferences(storage);if(!firstTime)preferences.markTutorialSeen();preferences.setInputMethod(inputMethod);
  const briefingPreferences=createBriefingPreferences(storage);briefingPreferences.setMode(briefingMode);
  const record=createStartRecord(),shown=[],requests=[],maps=[],prepared=[],holds=[],launches=[],cancellations=[];
  const state={phase:'intro',mode:'flight',camera:'overlay',steering:'tilt',input:null,course:getCourse('easy'),state:{grounded:false,x:5,y:18,z:20,collected:0},pauseReason:'画面から離れたため停止しました。',canResume:true};
  let time=100,disposed=0,hidden=0,controller;
  const fullscreenReport={fullscreenRequested:fullscreenSucceeded,fullscreenSucceeded,fullscreenSource:fullscreenSucceeded?'title':'other',fullscreenRequestedAt:fullscreenSucceeded?100:0,fullscreenSucceededAt:fullscreenSucceeded?100:0};
  const ui={setSettings(){},setCourses(){},show:(step,data)=>shown.push({step,data}),hide:()=>hidden++};
  const pwa={
    requestFullscreen(options){requests.push(options);return request?request(options):Promise.resolve(false);},
    report:()=>({...fullscreenReport}),begin:()=>state.canResume,canResume:()=>state.canResume,
    lockCurrentOrientation:async()=>{},showOrientationNotice(){},
  };
  const actions={
    courseCards:()=>[],selectCourse:id=>{state.course=getCourse(id);},setCamera:value=>{state.camera=value;},selectMode:value=>{state.mode=value;},
    prepareFresh:options=>{prepared.push(options);state.phase='intro';state.input=null;return true;},
    ready:()=>{state.phase='ready';},hold:mode=>holds.push(mode),
    launch:(mode,reason)=>{launches.push({mode,reason});state.input=mode;state.phase='running';controller.onRunning();},
    cancelPending:fresh=>cancellations.push(fresh),openSettings(){},closeSettings(){},endFlight(){},copyResult(){},unlock(){},
  };
  controller=createStartFlowController({ui,pwa,map:{open:options=>maps.push(structuredClone(options)),dispose:()=>disposed++},preferences,briefingPreferences,record,read:()=>state,actions,now:()=>time});
  const advance=milliseconds=>{time+=milliseconds;t.mock.timers.tick(milliseconds);};
  return {controller,state,document,preferences,briefingPreferences,record,shown,requests,maps,prepared,holds,launches,cancellations,values,fullscreenReport,advance,disposed:()=>disposed,hidden:()=>hidden};
}
async function freshPose(f){await f.controller.action('start');await f.controller.action('course-start');assert.equal(f.controller.snapshot().step,'pose');}

test('a cancelled pending title request cannot advance or launch after its late response',async t=>{
  let resolve;const f=fixture(t,{request:()=>new Promise(done=>{resolve=done;})});
  const starting=f.controller.action('start');assert.deepEqual(f.requests,[{source:'title'}]);
  f.controller.cancel();resolve();await starting;
  assert.equal(f.controller.snapshot().step,'title');assert.deepEqual(f.launches,[]);assert.deepEqual(f.prepared,[]);
  assert.equal(f.shown.at(-1).data.loading,false);assert.equal(f.shown.at(-1).data.disabled,false);
});

test('a hidden page cannot advance after a pending title request without a fresh action',async t=>{
  let resolve;const f=fixture(t,{request:()=>new Promise(done=>{resolve=done;})});
  const starting=f.controller.action('start');f.document.hidden=true;resolve();await starting;
  f.document.hidden=false;f.advance(20000);
  assert.equal(f.controller.snapshot().step,'title');assert.deepEqual(f.launches,[]);
});

test('opening help while a title request is pending keeps help visible after the late response',async t=>{
  let resolve;const f=fixture(t,{request:()=>new Promise(done=>{resolve=done;})});
  const starting=f.controller.action('start');await f.controller.action('help');
  assert.equal(f.controller.snapshot().step,'tutorial');resolve();await starting;
  assert.equal(f.controller.snapshot().step,'tutorial');assert.deepEqual(f.launches,[]);
});

test('opening title settings cancels a pending request and closing returns to title',async t=>{
  let resolve;const f=fixture(t,{request:()=>new Promise(done=>{resolve=done;})});
  const starting=f.controller.action('start');await f.controller.action('settings');
  assert.equal(f.controller.snapshot().step,'settings');resolve();await starting;
  assert.equal(f.controller.snapshot().step,'settings');await f.controller.action('settings-close');
  assert.equal(f.controller.snapshot().step,'title');assert.deepEqual(f.launches,[]);
});

test('settings entered from a pending pose cancels core preparation and returns to pose',async t=>{
  const f=fixture(t);await freshPose(f);await f.controller.action('hold');f.state.phase='waiting';
  await f.controller.action('settings');
  assert.equal(f.controller.snapshot().step,'settings');assert.deepEqual(f.cancellations,[true]);
  await f.controller.action('settings-close');
  assert.equal(f.controller.snapshot().step,'pose');assert.deepEqual(f.launches,[]);assert.equal(f.preferences.get().inputMethod,'sensor');
});

test('first help saves completion and pause help returns to pause without a new launch',async t=>{
  const f=fixture(t,{firstTime:true});await f.controller.action('start');
  assert.equal(f.controller.snapshot().step,'tutorial');
  for(let index=0;index<3;index++)await f.controller.action('tutorial-next');
  assert.equal(f.controller.snapshot().step,'courses');assert.equal(f.preferences.get().tutorialSeen,true);
  f.state.phase='paused';f.state.input='sensor';f.controller.paused('停止の理由');
  await f.controller.action('help');await f.controller.action('tutorial-skip');
  assert.equal(f.controller.snapshot().step,'pause');assert.deepEqual(f.launches,[]);assert.equal(f.state.input,'sensor');
  assert.equal(f.values.get('twist.flight-settings.v1'),'{"maxPitch":21}');
});

test('an unsupported fullscreen request still settles silently before all three countdown seconds',async t=>{
  const f=fixture(t);await freshPose(f);await f.controller.action('hold');
  assert.deepEqual(f.holds,['sensor']);assert.deepEqual(f.launches,[]);
  f.controller.poseReady('sensor','held-pose-start');assert.equal(f.controller.snapshot().step,'countdown');
  assert.equal(f.shown.at(-1).data.number,'…');f.advance(499);assert.equal(f.shown.at(-1).data.number,'…');assert.deepEqual(f.launches,[]);assert.equal(f.record.snapshot().flightStartedAt,null);
  f.advance(1);assert.equal(f.shown.at(-1).data.number,3);assert.equal(f.record.snapshot().countdownSeconds,3);assert.equal(f.record.snapshot().startWaitSeconds,.5);
  f.advance(1000);f.advance(1000);f.advance(999);assert.deepEqual(f.launches,[]);assert.equal(f.record.snapshot().flightStartedAt,null);
  f.advance(1);assert.deepEqual(f.launches,[{mode:'sensor',reason:'held-pose-start'}]);
  assert.equal(f.record.snapshot().titleToFlightSeconds,3.5);assert.equal(f.record.snapshot().fullscreenSucceeded,false);
});

test('a fresh fullscreen start keeps the six-second lead without counting menu time as flight',async t=>{
  const f=fixture(t,{fullscreenSucceeded:true});await freshPose(f);f.controller.poseReady('practice','explicit-screen-method');
  assert.equal(f.shown.at(-1).data.number,'…');
  for(let seconds=0;seconds<5;seconds++)f.advance(1000);
  f.advance(999);assert.deepEqual(f.launches,[]);f.advance(1);
  assert.equal(f.launches.length,1);assert.equal(f.record.snapshot().fullscreenToFlightSeconds,6);
});

test('countdown cancellation and a later hidden tick cannot produce an automatic launch',async t=>{
  const f=fixture(t);await freshPose(f);f.controller.poseReady('sensor','held-pose-start');f.advance(1000);
  await f.controller.action('countdown-cancel');f.advance(10000);
  assert.equal(f.controller.snapshot().step,'pose');assert.deepEqual(f.launches,[]);assert.deepEqual(f.cancellations,[true]);
  f.controller.poseReady('sensor','held-pose-start');f.advance(1000);f.document.hidden=true;f.advance(1000);
  f.document.hidden=false;f.advance(10000);assert.deepEqual(f.launches,[]);
});

test('a ready dialog cannot replace an active countdown and an error never chooses practice implicitly',async t=>{
  const f=fixture(t);await freshPose(f);f.controller.poseReady('sensor','held-pose-start');
  f.controller.dialog({title:'構えました',description:'開始できます'});assert.equal(f.controller.snapshot().step,'countdown');
  f.controller.cancel();f.state.phase='error';f.controller.dialog({title:'傾きを使えません',description:'設定で画面操作を選べます。',error:'unsupported'});
  assert.equal(f.controller.snapshot().step,'pose');assert.equal(f.preferences.get().inputMethod,'sensor');assert.deepEqual(f.launches,[]);
  assert.equal(f.shown.at(-1).data.error,'unsupported');
});

test('an orientation hold failure keeps pose available without starting input',async t=>{
  const f=fixture(t);await freshPose(f);f.state.canResume=false;await f.controller.action('hold');
  assert.equal(f.controller.snapshot().step,'pose');assert.deepEqual(f.holds,[]);assert.deepEqual(f.launches,[]);
});

test('a cancelled pending resume cannot hold or launch after fullscreen resolves',async t=>{
  let resolve;const f=fixture(t,{request:()=>new Promise(done=>{resolve=done;})});
  f.state.phase='paused';f.state.input='sensor';f.controller.paused('停止中');
  const resume=f.controller.action('resume');f.controller.cancel();resolve();await resume;
  assert.deepEqual(f.requests,[{source:'resume'}]);assert.equal(f.controller.snapshot().step,'pause');assert.deepEqual(f.holds,[]);assert.deepEqual(f.launches,[]);
});

test('map preference and actual visits remain separate from startup and retain the paused position',async t=>{
  const f=fixture(t,{briefingMode:'first'});await f.controller.action('start');await f.controller.action('course-start');
  assert.equal(f.maps.length,1);assert.equal(f.maps[0].origin,'start');assert.equal(f.maps[0].state,null);
  f.controller.mapClosed({origin:'start',seconds:2.5,skipped:true,closeMethod:'skip'});
  assert.equal(f.controller.snapshot().briefing.shown,true);assert.equal(f.controller.snapshot().briefing.seconds,2.5);
  assert.equal(f.record.snapshot().flightStartedAt,null);
  await f.controller.action('course-start');assert.equal(f.maps.length,1);assert.equal(f.controller.snapshot().step,'pose');
  f.state.phase='paused';f.state.input='sensor';f.controller.paused('停止中');await f.controller.action('map');
  assert.equal(f.maps.at(-1).origin,'pause');assert.deepEqual(f.maps.at(-1).state,f.state.state);
  f.controller.mapClosed({origin:'pause',seconds:1.2,skipped:false,closeMethod:'continue'});
  assert.equal(f.controller.snapshot().step,'pause');assert.equal(f.controller.snapshot().briefing.revisits.length,1);assert.deepEqual(f.launches,[]);
  await f.controller.action('briefing-mode','off');assert.equal(f.briefingPreferences.getMode(),'off');
});

test('selecting a course after a result starts a new entry record without inventing another title click',async t=>{
  const f=fixture(t);await freshPose(f);f.controller.poseReady('sensor','held-pose-start');
  f.advance(500);
  for(let second=0;second<3;second++)f.advance(1000);
  assert.equal(f.record.snapshot().entrySource,'title');assert.equal(f.record.snapshot().titleToFlightSeconds,3.5);
  f.state.phase='complete';f.controller.result();f.advance(5000);
  await f.controller.action('course-exit');await f.controller.action('course-start');
  const next=f.record.snapshot();
  assert.equal(next.entrySource,'course');assert.equal(next.entryAt,8600);assert.equal(next.flightStartedAt,null);
  assert.equal(next.titleAt,null);assert.equal(next.titleToFlightSeconds,null);
  f.controller.poseReady('sensor','held-pose-start');f.advance(500);for(let second=0;second<3;second++)f.advance(1000);
  assert.equal(f.record.snapshot().entryToFlightSeconds,3.5);assert.equal(f.record.snapshot().countdownSeconds,3);assert.equal(f.record.snapshot().startWaitSeconds,.5);assert.equal(f.record.snapshot().titleToFlightSeconds,null);
  assert.equal(f.launches.length,2);
});

for(const grounded of [true,false])test(`retry ${grounded?'after ground contact preserves the current session':'after completion begins a new session'}`,async t=>{
  const f=fixture(t);f.state.state.grounded=grounded;f.state.phase=grounded?'paused':'complete';await f.controller.action('retry');
  assert.deepEqual(f.prepared,[{preserveSession:grounded}]);assert.equal(f.controller.snapshot().fresh,true);assert.equal(f.controller.snapshot().step,'pose');
  assert.equal(f.record.snapshot().firstTime,false);assert.equal(f.record.snapshot().flightStartedAt,null);assert.deepEqual(f.launches,[]);
  assert.equal(f.record.snapshot().entrySource,'retry');assert.equal(f.record.snapshot().entryAt,100);
  assert.equal(f.record.snapshot().titleAt,null);assert.equal(f.record.snapshot().titleToFlightSeconds,null);
  f.controller.poseReady('sensor','held-pose-start');f.advance(500);for(let second=0;second<3;second++)f.advance(1000);
  assert.equal(f.record.snapshot().entryToFlightSeconds,3.5);assert.equal(f.record.snapshot().countdownSeconds,3);assert.equal(f.record.snapshot().titleToFlightSeconds,null);
});

test('disposing an active countdown cancels every later launch and closes both views',async t=>{
  const f=fixture(t);await freshPose(f);f.controller.poseReady('sensor','held-pose-start');f.controller.dispose();f.advance(20000);
  assert.deepEqual(f.launches,[]);assert.equal(f.disposed(),1);assert.equal(f.hidden(),1);
});
test('result details passes the records section and returns to the same result without changing cancellation',async t=>{
  const f=fixture(t);f.state.phase='complete';f.controller.result({title:'今回の結果',newBest:true});
  await f.controller.action('settings','records');assert.equal(f.controller.snapshot().step,'settings');assert.equal(f.shown.at(-1).data.section,'records');
  assert.deepEqual(f.launches,[]);await f.controller.action('settings-close');assert.equal(f.controller.snapshot().step,'result');
  assert.equal(f.shown.at(-1).data.title,'今回の結果');assert.equal(f.shown.at(-1).data.newBest,true);
  await f.controller.action('title');await f.controller.action('settings');assert.equal(f.shown.at(-1).data.section,undefined);
  await f.controller.action('settings-close');assert.equal(f.controller.snapshot().step,'title');
});
test('records settings entered during countdown still cancels future ticks and returns to pose',async t=>{
  const f=fixture(t);await freshPose(f);f.controller.poseReady('sensor','held');f.advance(500);
  await f.controller.action('settings','records');assert.equal(f.shown.at(-1).data.section,'records');assert.deepEqual(f.cancellations,[true]);
  f.advance(10000);assert.deepEqual(f.launches,[]);await f.controller.action('settings-close');assert.equal(f.controller.snapshot().step,'pose');
});
