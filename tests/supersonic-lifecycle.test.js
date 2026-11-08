import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupersonicProfile } from '../src/supersonic/profile.js';
import { SUPERSONIC_COURSE } from '../src/supersonic/course.js';
import { createSupersonicState, advanceSupersonic } from '../src/supersonic/physics.js';
const near = (a, b, eps = 1e-8) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);
const input = { throttle: 1, afterburnerRequested: true };
test('queued negative/zero frame and pause preserve launch/inertia; held AB requires release', () => {
  const p = createSupersonicProfile(), start = createSupersonicState(p, SUPERSONIC_COURSE, { attemptId: 7 });
  for (const dt of [-1, 0, NaN]) {
    const r = advanceSupersonic(start, input, dt, p, SUPERSONIC_COURSE);
    assert.deepEqual(r.state.position, start.position); near(r.state.speed, 200); assert.equal(r.segments.length, 0);
  }
  const moving = advanceSupersonic(start, input, 2, p, SUPERSONIC_COURSE).state;
  const paused = advanceSupersonic(moving, { ...input, paused: true }, 20, p, SUPERSONIC_COURSE);
  assert.deepEqual(paused.state.velocity, moving.velocity); assert.deepEqual(paused.state.position, moving.position);
  near(paused.state.simulationSeconds, 2); assert.equal(paused.events.length, 0); assert.equal(paused.state.afterburner.active, false);
  assert.equal(advanceSupersonic(paused.state, input, .05, p, SUPERSONIC_COURSE).state.afterburner.active, false);
  const release = advanceSupersonic(paused.state, { afterburnerRequested: false }, .05, p, SUPERSONIC_COURSE).state;
  assert.equal(advanceSupersonic(release, input, .05, p, SUPERSONIC_COURSE).state.afterburner.active, true);
  assert.equal(start.eventSerial, 0); assert.equal(start.simulationSeconds, 0);
});
test('all positive raw elapsed is processed without a one-second autopause and JSON remains finite', () => {
  const p = createSupersonicProfile(), start = createSupersonicState(p, SUPERSONIC_COURSE);
  const snapshot = structuredClone(start), r = advanceSupersonic(start, input, 3.125, p, SUPERSONIC_COURSE);
  near(r.timing.advancedSeconds, 3.125); near(r.timing.remainingSeconds, 0); assert.equal(r.timing.reason, null);
  assert.ok(r.segments.every(s => s.seconds <= 1 / 120 + 1e-10)); assert.deepEqual(start, snapshot);
  assert.doesNotMatch(JSON.stringify(r), /NaN|Infinity/);
  const changed = createSupersonicProfile({ maxG: 3 });
  assert.throws(() => advanceSupersonic(start, input, .05, changed, SUPERSONIC_COURSE), /configuration changed/);
});
test('gauge expiry splits the force interval and unlimited fuel never creates Infinity', () => {
  const p = createSupersonicProfile({ fuelMode: 'gauge' }), start = createSupersonicState(p, SUPERSONIC_COURSE);
  start.afterburner.fuel = .015;
  const r = advanceSupersonic(start, input, .02, p, SUPERSONIC_COURSE);
  near(r.state.afterburner.seconds, .01); near(r.state.afterburner.consumed, .015); near(r.state.afterburner.fuel, 0);
  near(r.events.find(e => e.type === 'afterburner-empty').atSeconds, .01);
  assert.equal(r.state.afterburner.needsRelease, true); assert.equal(r.state.afterburner.active, false);
  const u = createSupersonicProfile(), unlimited = advanceSupersonic(createSupersonicState(u, SUPERSONIC_COURSE), input, 1, u, SUPERSONIC_COURSE).state;
  near(unlimited.afterburner.seconds, 1); near(unlimited.afterburner.consumed, 0); near(unlimited.afterburner.fuel, 100);
});
test('auto AB uses original input angle, dwell, release hysteresis, and pause cancellation', () => {
  const p = createSupersonicProfile(), start = createSupersonicState(p, SUPERSONIC_COURSE);
  const auto = { throttle: 1, autoAfterburner: { enabled: true, pitchInputDegrees: -40, angleDegrees: 35 } };
  const r = advanceSupersonic(start, auto, .3, p, SUPERSONIC_COURSE);
  near(r.state.afterburner.seconds, .12); near(r.state.afterburner.autoHoldSeconds, .18);
  const paused = advanceSupersonic(r.state, { ...auto, paused: true }, 0, p, SUPERSONIC_COURSE).state;
  assert.equal(advanceSupersonic(paused, auto, .3, p, SUPERSONIC_COURSE).state.afterburner.active, false);
});
test('invalid state/configuration fails explicitly rather than resetting flight or leaking nonfinite JSON', () => {
  const p = createSupersonicProfile(), state = createSupersonicState(p, SUPERSONIC_COURSE);
  assert.throws(() => advanceSupersonic({ ...state, velocity: { x: 1e308, y: 1e308, z: 1e308 } }, input, .05, p, SUPERSONIC_COURSE), /speed/);
  assert.throws(() => advanceSupersonic({ ...state, metrics: { ...state.metrics, maximumG: NaN } }, input, .05, p, SUPERSONIC_COURSE), /nonfinite/);
  assert.throws(() => advanceSupersonic(state, input, .05, { ...p, gravity: Infinity }, SUPERSONIC_COURSE), /profile/);
  assert.throws(() => createSupersonicState(p, SUPERSONIC_COURSE, { attemptId: NaN }), /attemptId/);
});
test('upper and horizontal limits stay advisory, without position/pitch/velocity teleportation', () => {
  const p = createSupersonicProfile(), start = createSupersonicState(p, SUPERSONIC_COURSE);
  start.position.x = 20100; start.position.y = 6100;
  const r = advanceSupersonic(start, { throttle: 1, pitchDemandRadians: p.maxPitchRadians }, 1, p, SUPERSONIC_COURSE);
  assert.ok(r.state.position.x >= 20100); assert.ok(r.state.position.y > 6100);
  assert.ok(r.state.controlPitch > 0); assert.ok(r.state.velocity.y > 0);
  assert.equal(r.state.grounded, false); near(r.timing.advancedSeconds, 1);
});
test('fuel empty and a simultaneous gate reward still require release before re-ignition', () => {
  const base = createSupersonicProfile({ fuelMode: 'gauge' }), p = { ...base, dryThrust: 0, afterburnerThrust: 0, drag: { ...base.drag, quadraticAtMach1: 0, wavePeak: 0 } };
  const course = structuredClone(SUPERSONIC_COURSE); course.start.z = 20;
  course.gates.forEach((gate, i) => { gate.center.z = 14 - 6 * i; });
  const start = createSupersonicState(p, course); start.afterburner.fuel = .045;
  const r = advanceSupersonic(start, input, .04, p, course);
  near(r.state.afterburner.seconds, .03); near(r.state.afterburner.fuel, 20);
  assert.equal(r.state.afterburner.needsRelease, true); assert.equal(r.state.collected, 1);
  assert.equal(r.events.filter(e => e.type === 'afterburner-empty').length, 1);
  const held = advanceSupersonic(r.state, input, .01, p, course);
  assert.equal(held.state.afterburner.active, false); near(held.state.afterburner.seconds, .03);
});
