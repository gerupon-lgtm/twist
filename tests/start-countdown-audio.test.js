import test from 'node:test';
import assert from 'node:assert/strict';
import { createStartFlowController } from '../src/start-flow-controller.js';
import { createStartPreferences, createStartRecord } from '../src/start-flow-state.js';
import { createBriefingPreferences } from '../src/briefing-preferences.js';
import { getCourse } from '../src/course.js';

function fixture(t, { prepare, paint, autoRunning = true, launchResult = true, fullscreen = false } = {}) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const beforeDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const document = { hidden: false };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
  t.after(() => { if (beforeDocument) Object.defineProperty(globalThis, 'document', beforeDocument); else delete globalThis.document; });
  const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const preferences = createStartPreferences(storage); preferences.markTutorialSeen(); preferences.setInputMethod('practice');
  const briefingPreferences = createBriefingPreferences(storage); briefingPreferences.setMode('off');
  const record = createStartRecord(), shown = [], audio = [], launches = [], cancelled = [], preparations = [];
  const state = { phase: 'intro', input: null, mode: 'flight', camera: 'overlay', steering: 'tilt', course: getCourse('easy'), state: { grounded: false }, canResume: true };
  let clock = 100, controller;
  const pwa = {
    requestFullscreen: async () => fullscreen,
    report: () => ({ fullscreenRequested: fullscreen, fullscreenSucceeded: fullscreen, fullscreenSource: fullscreen ? 'title' : 'other', fullscreenRequestedAt: fullscreen ? 100 : 0, fullscreenSucceededAt: fullscreen ? 100 : 0 }),
    begin: () => state.canResume, canResume: () => state.canResume, lockCurrentOrientation: async () => {}, showOrientationNotice() {},
  };
  const actions = {
    countdownPaint:paint,
    courseCards: () => [], selectCourse: id => { state.course = getCourse(id); }, setCamera() {}, selectMode() {},
    prepareFresh: options => { preparations.push(options); state.phase = 'intro'; state.input = null; return true; },
    ready: () => { state.phase = 'ready'; }, hold() {},
    countdownAudio: signal => { audio.push({ ...signal, at: clock }); return signal.type === 'prepare' ? prepare?.(signal) : undefined; },
    launch: (mode, reason) => {
      launches.push({ mode, reason, at: clock });
      if (launchResult === false) return false;
      state.phase = 'running'; state.input = mode;
      if (autoRunning) controller.onRunning();
      return true;
    },
    cancelPending: fresh => { cancelled.push(fresh); state.phase = fresh ? 'intro' : 'paused'; },
    openSettings() {}, closeSettings() {}, endFlight() {}, copyResult() {}, unlock() {},
  };
  controller = createStartFlowController({ ui: { setSettings() {}, setCourses() {}, show: (step, data) => shown.push({ step, data: structuredClone(data), at: clock }), hide() {} },
    map: { open() {}, dispose() {} }, pwa, preferences, briefingPreferences, record, actions, read: () => state, now: () => clock });
  const advance = milliseconds => { clock += milliseconds; t.mock.timers.tick(milliseconds); };
  const sounded = () => audio.filter(event => event.type === 'tick' || event.type === 'go').map(event => event.type === 'tick' ? event.number : 'go');
  return { controller, state, document, record, shown, audio, launches, cancelled, preparations, advance, sounded };
}
async function fresh(f) {
  await f.controller.action('start'); await f.controller.action('course-start');
  assert.equal(f.controller.snapshot().step, 'pose');
}
const threeSeconds = f => { f.advance(1000); f.advance(1000); f.advance(1000); };
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

test('sound waits for the digit rendering opportunity and cancelled or overtaken beats are discarded',async t=>{
  const paints=[];const f=fixture(t,{paint:()=>new Promise(resolve=>paints.push(resolve))});await fresh(f);
  f.controller.poseReady('practice','held');f.advance(500);
  assert.equal(f.shown.at(-1).data.number,3);assert.deepEqual(f.sounded(),[]);
  f.advance(1000);paints.shift()();await settle();assert.deepEqual(f.sounded(),[]);
  paints.shift()();await settle();assert.deepEqual(f.sounded(),[2]);
  f.advance(1000);await f.controller.action('countdown-cancel');paints.shift()();await settle();assert.deepEqual(f.sounded(),[2]);
});

test('3/2/1 follow displayed numbers and GO waits for the actual onRunning boundary, exactly once', async t => {
  const f = fixture(t, { autoRunning: false }); await fresh(f);
  f.controller.poseReady('practice', 'held');
  assert.equal(f.shown.at(-1).data.number, '…'); assert.deepEqual(f.sounded(), []);
  f.advance(499); assert.deepEqual(f.sounded(), []); assert.equal(f.launches.length, 0); assert.equal(f.record.snapshot().flightStartedAt, null);
  f.advance(1);
  assert.deepEqual(f.sounded(), [3]); assert.equal(f.launches.length, 0);
  assert.equal(f.record.snapshot().countdownSeconds, 3); assert.equal(f.record.snapshot().startWaitSeconds, .5);
  f.advance(999); assert.deepEqual(f.sounded(), [3]);
  f.advance(1); assert.deepEqual(f.sounded(), [3, 2]);
  f.advance(1000); assert.deepEqual(f.sounded(), [3, 2, 1]);
  f.advance(999); assert.equal(f.launches.length, 0);
  f.advance(1); assert.equal(f.launches.length, 1); assert.deepEqual(f.sounded(), [3, 2, 1]);
  const ticks = f.audio.filter(event => event.type === 'tick');
  assert.deepEqual(ticks.map(event => event.at), [600, 1600, 2600]);
  assert.deepEqual(f.shown.filter(item => item.step === 'countdown' && Number.isInteger(item.data.number)).map(item => item.data.number), [3, 2, 1]);
  for(const cue of ticks)assert.equal(f.shown.find(item => item.step === 'countdown' && item.data.number === cue.number).at, cue.at);
  f.controller.onRunning(); f.controller.onRunning(); f.advance(10000);
  assert.deepEqual(f.sounded(), [3, 2, 1, 'go']);
  assert.equal(new Set(f.audio.filter(event => event.type !== 'cancel').map(event => event.session)).size, 1);
});

test('a fresh=false resume launches directly without preparation, countdown ticks or another GO', async t => {
  const f = fixture(t); await fresh(f); f.controller.poseReady('practice', 'first'); f.advance(500); threeSeconds(f);
  assert.deepEqual(f.sounded(), [3, 2, 1, 'go']);
  f.state.phase = 'paused'; f.controller.paused('pause');
  const before = f.audio.length; f.state.phase = 'ready'; f.controller.poseReady('practice', 'resume');
  assert.equal(f.launches.length, 2); assert.equal(f.launches[1].reason, 'resume');
  assert.equal(f.audio.length, before); assert.equal(f.controller.snapshot().fresh, false);
});

test('fullscreen lead-in is silent and the three cues still occupy the final three seconds', async t => {
  const f = fixture(t, { fullscreen: true }); await fresh(f); f.controller.poseReady('practice', 'held');
  assert.equal(f.shown.at(-1).data.number, '…'); assert.deepEqual(f.sounded(), []);
  f.advance(1000); f.advance(1000); f.advance(999); assert.deepEqual(f.sounded(), []);
  f.advance(1); assert.deepEqual(f.sounded(), [3]); threeSeconds(f);
  assert.deepEqual(f.sounded(), [3, 2, 1, 'go']); assert.equal(f.launches[0].at, 6100);
});

test('explicit cancellation stops future cues and repeated cancellation does not cancel a session twice', async t => {
  const f = fixture(t); await fresh(f); f.controller.poseReady('practice', 'held'); f.advance(500); f.advance(1000);
  await f.controller.action('countdown-cancel'); f.controller.cancel(); f.advance(10000);
  assert.deepEqual(f.sounded(), [3, 2]); assert.equal(f.launches.length, 0);
  assert.equal(f.audio.filter(event => event.type === 'cancel').length, 1); assert.deepEqual(f.cancelled, [true]);
});

test('a hidden countdown cancels at the next tick and does not resume sound when visible again', async t => {
  const f = fixture(t); await fresh(f); f.controller.poseReady('practice', 'held'); f.advance(500);
  f.document.hidden = true; f.advance(1000); f.document.hidden = false; f.advance(10000);
  assert.deepEqual(f.sounded(), [3]); assert.equal(f.launches.length, 0);
  assert.equal(f.audio.filter(event => event.type === 'cancel').length, 1);
});

test('orientation refusal at the launch boundary cancels without GO or a later automatic launch', async t => {
  const f = fixture(t); await fresh(f); f.controller.poseReady('practice', 'held'); f.advance(500);
  f.advance(1000); f.advance(1000); f.state.canResume = false; f.advance(1000);
  assert.equal(f.controller.snapshot().step, 'pose'); assert.deepEqual(f.sounded(), [3, 2, 1]); assert.equal(f.launches.length, 0);
  f.state.canResume = true; f.advance(10000); assert.equal(f.launches.length, 0);
  assert.equal(f.audio.filter(event => event.type === 'cancel').length, 1);
});

test('a refused launch never emits GO and returns to a usable pose', async t => {
  const f = fixture(t, { launchResult: false }); await fresh(f); f.controller.poseReady('practice', 'held'); f.advance(500); threeSeconds(f);
  assert.equal(f.launches.length, 1); assert.deepEqual(f.sounded(), [3, 2, 1]);
  assert.equal(f.controller.snapshot().step, 'pose'); assert.equal(f.audio.filter(event => event.type === 'cancel').length, 1);
});

test('settings cancels the countdown and its core preparation without further sound', async t => {
  const f = fixture(t); await fresh(f); f.controller.poseReady('practice', 'held'); f.advance(500); f.advance(1000);
  await f.controller.action('settings'); f.advance(10000);
  assert.equal(f.controller.snapshot().step, 'settings'); assert.deepEqual(f.sounded(), [3, 2]);
  assert.deepEqual(f.cancelled, [true]); assert.equal(f.launches.length, 0);
  assert.equal(f.audio.filter(event => event.type === 'cancel').length, 1);
});

test('an old late preparation cannot start ticks or replace a newer countdown preparation', async t => {
  const pending = [];
  const f = fixture(t, { prepare: () => new Promise(resolve => pending.push(resolve)) }); await fresh(f);
  f.controller.poseReady('practice', 'old'); const oldSession = f.audio.at(-1).session;
  await f.controller.action('countdown-cancel'); f.controller.poseReady('practice', 'new');
  const newSession = f.audio.at(-1).session; assert.notEqual(newSession, oldSession);
  pending[0]({ ready: true, marker: 'old' }); await settle();
  assert.deepEqual(f.sounded(), []); assert.equal(f.controller.snapshot().countdownAudio, null);
  pending[1]({ ready: true, marker: 'new' }); await settle();
  assert.deepEqual(f.sounded(), []); assert.equal(f.controller.snapshot().countdownAudio.marker, 'new'); f.advance(500); assert.deepEqual(f.sounded(), [3]); threeSeconds(f);
  assert.deepEqual(f.sounded(), [3, 2, 1, 'go']); assert.equal(f.launches.length, 1); assert.equal(f.launches[0].reason, 'new');
  assert.ok(f.audio.filter(event => event.type === 'tick' || event.type === 'go').every(event => event.session === newSession));
});

test('settings entered while audio preparation is pending suppresses its late resolution', async t => {
  let resolve;
  const f = fixture(t, { prepare: () => new Promise(done => { resolve = done; }) }); await fresh(f);
  f.controller.poseReady('practice', 'held'); await f.controller.action('settings');
  resolve({ ready: true }); await settle(); f.advance(10000);
  assert.equal(f.controller.snapshot().step, 'settings'); assert.deepEqual(f.sounded(), []); assert.equal(f.launches.length, 0);
  assert.equal(f.audio.filter(event => event.type === 'cancel').length, 1);
});

test('hidden pending preparation cancels before its first tick', async t => {
  let resolve;
  const f = fixture(t, { prepare: () => new Promise(done => { resolve = done; }) }); await fresh(f);
  f.controller.poseReady('practice', 'held'); f.document.hidden = true; resolve({ ready: true }); await settle();
  f.document.hidden = false; f.advance(10000);
  assert.deepEqual(f.sounded(), []); assert.equal(f.launches.length, 0); assert.equal(f.audio.filter(event => event.type === 'cancel').length, 1);
});

test('audio preparation rejection continues the same silent-capable countdown without replaying cues', async t => {
  const f = fixture(t, { prepare: () => Promise.reject(new Error('audio unavailable')) }); await fresh(f);
  f.controller.poseReady('practice', 'held'); await settle();
  assert.deepEqual(f.sounded(), []); f.advance(500); assert.deepEqual(f.sounded(), [3]); threeSeconds(f); assert.deepEqual(f.sounded(), [3, 2, 1, 'go']);
  assert.equal(f.launches.length, 1); assert.equal(f.audio.filter(event => event.type === 'prepare').length, 1);
});

test('duplicate poseReady during preparation/countdown or after running cannot restart cues or flight', async t => {
  let resolve;
  const f = fixture(t, { prepare: () => new Promise(done => { resolve = done; }) }); await fresh(f);
  f.controller.poseReady('practice', 'first'); f.controller.poseReady('practice', 'duplicate-pending');
  assert.equal(f.audio.filter(event => event.type === 'prepare').length, 1);
  resolve({ ready: true }); await settle(); f.advance(250); f.controller.poseReady('practice', 'duplicate-settling'); assert.deepEqual(f.sounded(), []); f.advance(250); f.advance(1000); f.controller.poseReady('practice', 'duplicate-ticking');
  assert.deepEqual(f.sounded(), [3, 2]); f.advance(1000); f.advance(1000);
  assert.equal(f.launches.length, 1); assert.deepEqual(f.sounded(), [3, 2, 1, 'go']);
  f.controller.poseReady('practice', 'duplicate-running'); f.controller.onRunning(); f.advance(10000);
  assert.equal(f.launches.length, 1); assert.deepEqual(f.sounded(), [3, 2, 1, 'go']);
});

test('disposal cancels prepared countdown timers and no later tick or GO survives', async t => {
  const f = fixture(t); await fresh(f); f.controller.poseReady('practice', 'held'); f.advance(500); f.controller.dispose(); f.advance(10000);
  assert.deepEqual(f.sounded(), [3]); assert.equal(f.launches.length, 0); assert.equal(f.audio.filter(event => event.type === 'cancel').length, 1);
});

test('result details survive settings and cannot leak into the next attempt result', async t => {
  const f = fixture(t); await fresh(f); f.controller.poseReady('practice', 'held'); f.advance(500); threeSeconds(f);
  const details = { title: '海面に接触しました', description: '中心高度0.48m、機体最下部0m。' };
  f.state.phase = 'paused'; f.state.state.grounded = true; f.controller.result(details);
  assert.deepEqual(f.shown.at(-1).data, details);
  await f.controller.action('settings'); await f.controller.action('settings-close');
  assert.equal(f.controller.snapshot().step, 'result'); assert.deepEqual(f.shown.at(-1).data, details);
  await f.controller.action('retry'); assert.equal(f.controller.snapshot().step, 'pose');
  assert.equal(f.shown.at(-1).data.title, '構える'); assert.deepEqual(f.preparations.at(-1), { preserveSession: true });
  f.state.state.grounded = false; f.controller.poseReady('practice', 'retry'); f.advance(500); threeSeconds(f);
  f.state.phase = 'complete'; f.controller.result(); await f.controller.action('settings'); await f.controller.action('settings-close');
  assert.equal(f.controller.snapshot().step, 'result'); assert.deepEqual(f.shown.at(-1).data, {});
  assert.equal(f.launches.length, 2); assert.deepEqual(f.sounded(), [3, 2, 1, 'go', 3, 2, 1, 'go']);
});

test('slow preparation finishes before the full silent settle and never consumes any of the three displayed seconds', async t => {
  let resolve;const f=fixture(t,{prepare:()=>new Promise(done=>{resolve=done;})});await fresh(f);
  f.controller.poseReady('practice','held');f.advance(700);assert.deepEqual(f.sounded(),[]);assert.equal(f.record.snapshot().flightStartedAt,null);
  resolve({ready:true,waitMilliseconds:700});await settle();f.advance(499);assert.deepEqual(f.sounded(),[]);assert.equal(f.launches.length,0);
  f.advance(1);assert.deepEqual(f.sounded(),[3]);threeSeconds(f);
  assert.deepEqual(f.sounded(),[3,2,1,'go']);assert.equal(f.launches[0].at,4300);assert.equal(f.record.snapshot().countdownSeconds,3);assert.equal(f.record.snapshot().startWaitSeconds,.5);assert.equal(f.record.snapshot().entryToFlightSeconds,4.2);
});

for(const cause of ['cancel','hidden','settings','dispose'])test(`cancelling the initial silent settle via ${cause} leaves no tick, GO or late launch`,async t=>{
  const f=fixture(t);await fresh(f);f.controller.poseReady('practice','held');f.advance(250);assert.deepEqual(f.sounded(),[]);
  if(cause==='cancel')await f.controller.action('countdown-cancel');
  else if(cause==='settings')await f.controller.action('settings');
  else if(cause==='dispose')f.controller.dispose();
  else f.document.hidden=true;
  f.advance(250);f.document.hidden=false;f.advance(10000);
  assert.deepEqual(f.sounded(),[]);assert.equal(f.launches.length,0);assert.equal(f.record.snapshot().flightStartedAt,null);assert.equal(f.audio.filter(event=>event.type==='cancel').length,1);
});
