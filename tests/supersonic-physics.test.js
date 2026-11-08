import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupersonicProfile } from '../src/supersonic/profile.js';
import { SUPERSONIC_COURSE } from '../src/supersonic/course.js';
import { createSupersonicState, advanceSupersonic, supersonicDrag, supersonicOrientation } from '../src/supersonic/physics.js';
const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b} ±${tolerance}`);
const level = { bankDemand: 0, pitchDemandRadians: 0, throttle: 1, afterburnerRequested: true };
function run(seconds, input, profile = createSupersonicProfile(), dt = .05, initial) {
  let state = initial ?? createSupersonicState(profile, SUPERSONIC_COURSE), events = [];
  for (let t = 0; t < seconds - 1e-10 && !state.complete && !state.grounded; t += dt) {
    const r = advanceSupersonic(state, input, Math.min(dt, seconds - t), profile, SUPERSONIC_COURSE); state = r.state; events.push(...r.events);
  }
  return { state, events };
}
test('transonic drag rises around M1 and dry thrust stays subsonic while AB reaches actual M2', () => {
  const profile = createSupersonicProfile();
  near(supersonicDrag(340, profile), 12); near(supersonicDrag(680, profile), 32);
  assert.ok(supersonicDrag(340, profile) > supersonicDrag(374, profile));
  const dry = run(60, { ...level, afterburnerRequested: false }).state;
  assert.ok(dry.speed > 300 && dry.speed < 340, `dry speed ${dry.speed}`);
  const { state, events } = run(60, level);
  near(state.speed, 680, 1e-7); near(state.mach, state.speed / 340);
  assert.ok(state.metrics.firstMach1Seconds > 5 && state.metrics.firstMach1Seconds < 6);
  assert.ok(state.metrics.firstMach2Seconds > 50 && state.metrics.firstMach2Seconds < 60);
  assert.equal(events.filter(e => e.type === 'sonic-transition').length, 1);
  const down = run(30, { ...level, afterburnerRequested: false }, profile, .05, state);
  assert.ok(down.state.speed < 680 && down.state.speed > 300);
  near(state.position.y, 1500, 1e-6);
});
test('combined climbing and banked 3D flight uses one configured support budget', () => {
  for (const maxG of [3, 9, 12]) {
    const profile = createSupersonicProfile({ maxG });
    const { state } = run(8, { ...level, bankDemand: 1, pitchDemandRadians: profile.maxPitchRadians }, profile);
    assert.ok(state.position.x > 0); assert.ok(state.position.y > 1500);
    assert.ok(state.metrics.maximumG <= maxG + 1e-10);
    near(Math.hypot(...Object.values(state.supportAcceleration)) / profile.gravity, state.gLoad);
    near(state.speed, Math.hypot(...Object.values(state.velocity)));
    assert.equal(state.grounded, false);
  }
});
test('small-step Heun turns preserve mechanical energy without thrust/drag and converge across frame rates', t => {
  const base = createSupersonicProfile(), profile = { ...base, dryThrust: 0, afterburnerThrust: 0, drag: { ...base.drag, quadraticAtMach1: 0, wavePeak: 0 } };
  const input = { ...level, throttle: 0, afterburnerRequested: false, bankDemand: 1 };
  const result = run(8, input, profile).state;
  const initialEnergy = 200 ** 2 / 2 + 9.8 * 1500, finalEnergy = result.speed ** 2 / 2 + 9.8 * result.position.y;
  assert.ok(Math.abs(finalEnergy - initialEnergy) / initialEnergy < 1e-6, `energy drift ${finalEnergy - initialEnergy}`);
  const a = run(8, level, base, 1 / 30).state, b = run(8, level, base, 1 / 144).state;
  near(a.speed, b.speed, .0001); near(a.position.z, b.position.z, .01);
  t.diagnostic(`energy relative drift=${Math.abs(finalEnergy - initialEnergy) / initialEnergy}; 30/144fps speed difference=${Math.abs(a.speed - b.speed)}m/s position difference=${Math.abs(a.position.z - b.position.z)}m`);
});
test('actual level max-G turn at Mach1 has the intended roughly 1.3km radius', () => {
  const base = createSupersonicProfile(), profile = { ...base, dryThrust: 0, drag: { ...base.drag, quadraticAtMach1: 0, wavePeak: 0 } };
  const state = createSupersonicState(profile, SUPERSONIC_COURSE);
  state.velocity.z = -340; state.speed = 340; state.mach = 1; state.bank = profile.maxBankRadians;
  state.orientation = supersonicOrientation(0, 0, state.bank);
  const result = advanceSupersonic(state, { throttle: 0, bankDemand: 1 }, .01, profile, SUPERSONIC_COURSE).state;
  near(result.gLoad, 9, 1e-7); near(result.speed / result.yawRate, 1318.82, 1);
  near(result.verticalSpeed, 0, .00001);
});
test('separate gravity makes a climb slower and descent faster at the same engine setting', () => {
  const profile = createSupersonicProfile(), input = { throttle: .5, afterburnerRequested: false };
  const levelState = run(5, input, profile).state;
  const climb = run(5, { ...input, pitchDemandRadians: profile.maxPitchRadians }, profile).state;
  const descent = run(5, { ...input, pitchDemandRadians: -profile.maxPitchRadians }, profile).state;
  assert.ok(climb.position.y > 1500 && descent.position.y < 1500);
  assert.ok(climb.speed < levelState.speed && descent.speed > levelState.speed);
  assert.ok(climb.metrics.maximumG <= 9 && descent.metrics.maximumG <= 9);
});
test('low-speed and high-AoA states retain thrust/posture response and recover without static lift', () => {
  const profile = createSupersonicProfile(), initial = createSupersonicState(profile, SUPERSONIC_COURSE);
  initial.velocity = { x: 0, y: 0, z: 0 }; initial.speed = 0; initial.mach = 0;
  const first = advanceSupersonic(initial, level, .05, profile, SUPERSONIC_COURSE).state;
  assert.ok(first.velocity.y < 0); assert.ok(first.velocity.z < 0); assert.ok(first.recoveryAssist > 0);
  const recovered = run(12, level, profile, .05, initial).state;
  assert.ok(recovered.speed > 200); assert.ok(Math.abs(recovered.verticalSpeed) < 1); assert.ok(recovered.recoveryAssist < .01);
  const stalled = createSupersonicState(profile, SUPERSONIC_COURSE);
  stalled.velocity = { x: 0, y: 60, z: -20 }; stalled.speed = Math.hypot(60, 20);
  const early = advanceSupersonic(stalled, level, .05, profile, SUPERSONIC_COURSE).state;
  assert.ok(early.recoveryAssist > .5); assert.ok(early.gLoad < 1);
  assert.ok(run(12, level, profile, .05, stalled).state.speed > 200);
});
