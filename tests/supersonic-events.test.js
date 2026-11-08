import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupersonicProfile } from '../src/supersonic/profile.js';
import { SUPERSONIC_COURSE } from '../src/supersonic/course.js';
import { createSupersonicState, advanceSupersonic } from '../src/supersonic/physics.js';
import { seaClearance } from '../src/supersonic/gate-crossing.js';
const near = (a, b, eps = 1e-7) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);
const abInput = { throttle: 1, afterburnerRequested: true };
function simulate(profile, seconds, input, initial, course = SUPERSONIC_COURSE) {
  let state = initial ?? createSupersonicState(profile, course), events = [];
  for (let t = 0; t < seconds && !state.complete && !state.grounded; t += 1) {
    const result = advanceSupersonic(state, input, Math.min(1, seconds - t), profile, course);
    state = result.state; events.push(...result.events);
  }
  return { state, events };
}
test('real 3D force steps complete all six gates in unlimited AND gauge with exact segment records', t => {
  for (const fuelMode of ['unlimited', 'gauge']) {
    const profile = createSupersonicProfile({ fuelMode });
    const { state, events } = simulate(profile, 90, abInput);
    assert.equal(state.complete, true); assert.equal(state.grounded, false); assert.equal(state.collected, 5); assert.equal(state.activeGateIndex, 6);
    assert.equal(state.gateResults.length, 6); assert.ok(state.gateResults.every(row => row.passedAtSeconds !== null && row.missCount === 0 && row.minimumCenterDistance < 1e-6));
    near(state.gateResults.reduce((sum, row) => sum + row.segmentSeconds, 0), state.simulationSeconds);
    near(state.position.z, -18000); near(state.position.y, 1500); near(state.speed, 680);
    assert.ok(state.metrics.firstMach2Seconds < state.simulationSeconds);
    assert.equal(events.filter(e => ['gate-pass', 'exit-pass'].includes(e.type)).length, 6);
    assert.ok(events.every((e, i) => i === 0 || e.atSeconds >= events[i - 1].atSeconds && e.serial === events[i - 1].serial + 1));
    assert.equal(events.filter(e => e.type === 'sonic-transition').length, 1);
    assert.doesNotMatch(JSON.stringify(state), /Infinity|NaN/);
    t.diagnostic(`${fuelMode}: complete=${state.simulationSeconds.toFixed(6)}s M1=${state.metrics.firstMach1Seconds.toFixed(6)}s M2=${state.metrics.firstMach2Seconds.toFixed(6)}s fuel=${state.afterburner.fuel.toFixed(6)}`);
  }
});
test('one long call crosses multiple active gate planes, stopping at EXIT without terminal remainder time', () => {
  const profile = createSupersonicProfile(), course = structuredClone(SUPERSONIC_COURSE);
  course.start.z = 20; course.gates.forEach((g, i) => { g.center.z = 14 - 6 * i; });
  const start = createSupersonicState(profile, course), result = advanceSupersonic(start, abInput, 10, profile, course);
  assert.equal(result.state.complete, true); assert.equal(result.events.filter(e => /^(gate|exit)-pass$/.test(e.type)).length, 6);
  assert.ok(result.timing.advancedSeconds < .2); assert.ok(result.timing.remainingSeconds > 9.8);
  assert.equal(result.segments.at(-1).t1, result.state.terminal.atSeconds);
  assert.equal(advanceSupersonic(result.state, abInput, 1, profile, course).events.length, 0);
});
test('sea impact prevents later gate events; an earlier gate remains counted', () => {
  for (const firstGateZ of [19, 18]) {
    const profile = createSupersonicProfile(), course = structuredClone(SUPERSONIC_COURSE);
    course.start = { x: 0, y: 1, z: 20 };
    course.gates.forEach((gate, i) => { gate.center = { x: 0, y: 1, z: firstGateZ - 6 * i }; });
    const start = createSupersonicState(profile, course); start.velocity = { x: 0, y: -100, z: -200 }; start.speed = Math.hypot(100, 200);
    const r = advanceSupersonic(start, { throttle: 0 }, .1, profile, course);
    assert.equal(r.state.grounded, true); assert.ok(r.state.position.y > 0);
    near(r.state.terminal.contactPoint.y, 0); near(r.state.groundClearance, 0);
    const impact = r.events.find(e => e.type === 'sea-contact'); assert.ok(impact);
    assert.ok(r.events.every(e => e.atSeconds <= impact.atSeconds));
    assert.equal(r.state.collected, firstGateZ === 19 ? 1 : 0);
    assert.ok(r.timing.remainingSeconds > 0);
  }
});
test('misses count plane crossings once and later reverse passage can collect the same active gate', () => {
  const profile = createSupersonicProfile(), start = createSupersonicState(profile, SUPERSONIC_COURSE);
  // Explicit trajectory fixture, not a real-input completion claim.
  start.position = { x: 100, y: 1500, z: 12001 };
  const missed = advanceSupersonic(start, { throttle: 1 }, .05, profile, SUPERSONIC_COURSE);
  assert.equal(missed.state.activeGateIndex, 0); assert.equal(missed.state.gateResults[0].missCount, 1);
  const next = advanceSupersonic(missed.state, { throttle: 1 }, .05, profile, SUPERSONIC_COURSE);
  assert.equal(next.state.gateResults[0].missCount, 1);
  const back = { ...next.state, position: { x: 0, y: 1500, z: 11999 }, velocity: { x: 0, y: 0, z: 200 }, speed: 200, heading: Math.PI };
  const passed = advanceSupersonic(back, { throttle: 1 }, .05, profile, SUPERSONIC_COURSE);
  assert.equal(passed.state.collected, 1); assert.equal(passed.state.gateResults[0].missCount, 1);
  assert.equal(passed.events.find(e => e.type === 'gate-pass').direction, 'reverse');
});
test('precise M1 recording is separate from one-shot hysteretic sonic up/down transitions', () => {
  const profile = createSupersonicProfile(), start = createSupersonicState(profile, SUPERSONIC_COURSE);
  // Offset fixture misses the route so deceleration is observable past the nominal EXIT.
  start.position.x = 1000;
  const up = simulate(profile, 60, abInput, start);
  const down = simulate(profile, 100, { throttle: 1, afterburnerRequested: false }, up.state);
  const sonic = [...up.events, ...down.events].filter(e => e.type === 'sonic-transition');
  assert.deepEqual(sonic.map(e => [e.direction, e.mach]), [['up', 1.01], ['down', .99]]);
  near(up.state.metrics.firstMach1Seconds, 5.283, .01); near(up.state.metrics.firstMach2Seconds, 54.879, .02);
  assert.ok(sonic[0].atSeconds > up.state.metrics.firstMach1Seconds);
  assert.ok(down.state.speed < 340); assert.equal(down.state.crossingState.sonicSide, 'subsonic');
  assert.ok(sonic.every(e => e.id === e.serial));
});
test('sea wins a coincident gate crossing, including a positive terminal centre altitude', () => {
  const base = createSupersonicProfile(), profile = { ...base, gravity: 1e-8, dryThrust: 0, afterburnerThrust: 0, drag: { ...base.drag, quadraticAtMach1: 0, wavePeak: 0 } };
  const course = structuredClone(SUPERSONIC_COURSE); course.start = { x: 0, y: 1, z: 20 };
  // The original mesh's lowest float vertex is approximately -.48, not exactly -.48.
  const sameContactZ = 20 - 2 * seaClearance(course.start);
  course.gates.forEach((gate, i) => { gate.center = { x: 0, y: 1, z: sameContactZ - 6 * i }; });
  const start = createSupersonicState(profile, course); start.velocity = { x: 0, y: -100, z: -200 }; start.speed = Math.hypot(100, 200);
  const r = advanceSupersonic(start, { throttle: 0 }, .1, profile, course);
  assert.equal(r.state.grounded, true); assert.equal(r.state.collected, 0);
  assert.equal(r.events.filter(e => e.type === 'gate-pass').length, 0);
  assert.ok(r.state.terminal.centerPosition.y > 0); near(r.state.terminal.contactPoint.y, 0);
});
