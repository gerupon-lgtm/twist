import assert from 'node:assert/strict';
import test from 'node:test';
import { FLIGHT_MODEL, stepFlightVelocity } from '../src/flight-physics.js';

const near = (actual, expected, tolerance = 1e-8) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be ${expected} ± ${tolerance}`);
};
const rad = (angle) => angle * Math.PI / 180;
const pose = (pitch = 0, bank = 0) => {
  const p = rad(pitch);
  const b = rad(bank);
  return {
    forward: { x: 0, y: Math.sin(p), z: -Math.cos(p) },
    up: { x: Math.sin(b), y: Math.cos(p) * Math.cos(b), z: Math.sin(p) * Math.cos(b) },
  };
};
const length = (v) => Math.hypot(v.x, v.y, v.z);
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const finiteResult = (result) => {
  assert.ok(Object.values(result.velocity).every(Number.isFinite));
  for (const key of ['speed', 'verticalSpeed', 'angleOfAttack', 'lift', 'throttle', 'engineThrust', 'recoveryAssist', 'recoveryAcceleration']) {
    assert.ok(Number.isFinite(result[key]), `${key} must remain finite`);
  }
  near(result.speed, length(result.velocity));
  near(result.verticalSpeed, result.velocity.y);
  assert.ok(result.speed <= FLIGHT_MODEL.maxSpeed + 1e-10);
};
const cruiseVelocity = () => ({ x: 0, y: 0, z: -FLIGHT_MODEL.cruiseSpeed });
function simulate(seconds, dt, input, initial = cruiseVelocity()) {
  let velocity = { ...initial };
  const position = { x: 0, y: 0, z: 0 };
  let result;
  const frames = Math.round(seconds / dt);
  for (let i = 0; i < frames; i += 1) {
    result = stepFlightVelocity(velocity, dt, input);
    for (const key of ['x', 'y', 'z']) position[key] += (velocity[key] + result.velocity[key]) * 0.5 * dt;
    velocity = result.velocity;
  }
  return { ...result, position };
}

test('50-percent level cruise balances thrust, drag, lift, and gravity at 8 m/s', () => {
  near(FLIGHT_MODEL.cruiseSpeed, 8);
  near(FLIGHT_MODEL.defaultThrottle, 0.5);
  near(FLIGHT_MODEL.gravity, 3);
  near(FLIGHT_MODEL.maxThrust, 1.8);
  near(FLIGHT_MODEL.cruiseDrag, 0.9);
  near(FLIGHT_MODEL.maxSpeed, 24);
  const result = simulate(10, 1 / 60, { ...pose(), throttle: 0.5 });
  near(result.speed, 8);
  near(result.velocity.y, 0);
  near(result.position.y, 0);
  near(result.angleOfAttack, 0);
  near(result.lift, 3);
});

test('the 24 m/s speed cap preserves direction and bounds accelerated steps', () => {
  const limited = stepFlightVelocity({ x: 30, y: 40, z: 0 }, 0, { ...pose(), throttle: 1 });
  near(limited.speed, 24);
  near(limited.velocity.x, 24 * .6);
  near(limited.velocity.y, 24 * .8);
  near(limited.velocity.z, 0);
  const accelerated = stepFlightVelocity({ x: 0, y: 0, z: -24 }, .05,
    { ...pose(-30), throttle: 1 });
  finiteResult(accelerated);
});

test('the same engine setting climbs and slows with a 10-degree nose raise, descends and speeds up with a lower nose', () => {
  const climb = simulate(2, 1 / 60, { ...pose(10), throttle: 0.5 });
  const descent = simulate(2, 1 / 60, { ...pose(-10), throttle: 0.5 });
  assert.ok(climb.position.y > 0.25, `climb height ${climb.position.y}`);
  assert.ok(climb.verticalSpeed > 0);
  assert.ok(climb.speed < FLIGHT_MODEL.cruiseSpeed - 0.05, `climb speed ${climb.speed}`);
  assert.ok(descent.position.y < -0.25, `descent height ${descent.position.y}`);
  assert.ok(descent.verticalSpeed < 0);
  assert.ok(descent.speed > FLIGHT_MODEL.cruiseSpeed + 0.05, `descent speed ${descent.speed}`);
});

test('screen throttle changes thrust and zero output gradually sinks instead of holding speed', () => {
  const low = simulate(4, 1 / 60, { ...pose(), throttle: 0 });
  const high = simulate(1, 1 / 60, { ...pose(), throttle: 1 });
  assert.ok(low.position.y < -0.1);
  assert.ok(low.verticalSpeed < 0);
  assert.ok(low.speed < FLIGHT_MODEL.cruiseSpeed);
  assert.ok(high.speed > FLIGHT_MODEL.cruiseSpeed);
  const initial = stepFlightVelocity(cruiseVelocity(), 0.05, { ...pose(), throttle: 0 });
  assert.ok(initial.speed < FLIGHT_MODEL.cruiseSpeed && initial.speed > FLIGHT_MODEL.cruiseSpeed - 0.1,
    'power off slows gradually');
});

test('zero-speed aircraft falls under gravity and has no static lift', () => {
  const result = stepFlightVelocity({ x: 0, y: 0, z: 0 }, 0.05, { ...pose(), throttle: 0 });
  near(result.velocity.x, 0);
  near(result.velocity.z, 0);
  near(result.velocity.y, -0.15, 0.0001);
  near(result.lift, 0);
  assert.ok(result.speed > 0);
});

test('banked lift curves velocity toward the lowered wing and loses vertical support', () => {
  for (const bank of [-30, 30]) {
    const result = stepFlightVelocity(cruiseVelocity(), 0.01, { ...pose(0, bank), throttle: 0.5 });
    assert.ok(result.velocity.x * bank > 0);
    assert.ok(result.verticalSpeed < 0);
    near(result.velocity.x / 0.01, Math.sign(bank) * 1.5, 0.02);
  }
});

test('lift preserves mechanical energy except for independently measured engine and drag work', () => {
  const input = { ...pose(10, 25), throttle: 0.5 };
  const dt = 1 / 240;
  let velocity = { x: 0, y: 0, z: -6 };
  let altitude = 0;
  let work = 0;
  const power = (v) => 1.8 * 0.5 * dot(v, input.forward)
    - 0.9 * (length(v) / FLIGHT_MODEL.cruiseSpeed) ** 2 * length(v);
  for (let i = 0; i < 720; i += 1) {
    const next = stepFlightVelocity(velocity, dt, input).velocity;
    work += (power(velocity) + power(next)) * 0.5 * dt;
    altitude += (velocity.y + next.y) * 0.5 * dt;
    velocity = next;
  }
  const energyChange = 0.5 * length(velocity) ** 2 + 3 * altitude - 18;
  near(energyChange, work, 0.001);
});

test('angle of attack affects lift, with bounded continuous stall reduction through steep and reversed flight', () => {
  const level = stepFlightVelocity(cruiseVelocity(), 0, { ...pose(), throttle: 0.5 });
  const raised = stepFlightVelocity(cruiseVelocity(), 0, { ...pose(10), throttle: 0.5 });
  near(raised.angleOfAttack, rad(10));
  near(raised.lift, 3 * (1 + 4.5 * rad(10)));
  assert.ok(raised.lift > level.lift);
  for (const center of [20, 70, -20, -70]) {
    const left = stepFlightVelocity(cruiseVelocity(), 0, { ...pose(center - 0.00001), throttle: 0.5 });
    const right = stepFlightVelocity(cruiseVelocity(), 0, { ...pose(center + 0.00001), throttle: 0.5 });
    near(left.lift, right.lift, 0.0001);
  }
  for (const angle of [-180, -100, -90, -70, 70, 90, 100, 180]) {
    const result = stepFlightVelocity(cruiseVelocity(), 0, { ...pose(angle), throttle: 0.5 });
    near(result.lift, 0);
    finiteResult(result);
  }
  for (const angle of [-179, -45, 0, 30, 45, 179]) {
    const result = simulate(2, 1 / 60, { ...pose(angle), throttle: 1 }, { x: 0, y: 0, z: -0.1 });
    finiteResult(result);
    assert.ok(Math.abs(result.lift) <= 9);
  }
});

test('bounded integration gives similar flight for different update intervals', () => {
  const input = { ...pose(10, 20), throttle: 0.6 };
  const coarse = simulate(4, 0.05, input);
  const fine = simulate(4, 0.01, input);
  near(coarse.speed, fine.speed, 0.005);
  for (const key of ['x', 'y', 'z']) {
    near(coarse.velocity[key], fine.velocity[key], 0.005);
    near(coarse.position[key], fine.position[key], 0.02);
  }
  const velocity = { x: 0, y: 0, z: -6 };
  assert.deepEqual(stepFlightVelocity(velocity, 10, input), stepFlightVelocity(velocity, 0.05, input));
  for (const dt of [0, -1, NaN, Infinity, -Infinity]) {
    assert.deepEqual(stepFlightVelocity(velocity, dt, input).velocity, velocity);
  }
});

test('invalid state, directions, and output stay finite without mutating caller input', () => {
  const invalidInputs = [undefined, {}, { forward: { x: NaN }, up: null, throttle: Infinity },
    { forward: { x: 0, y: 1, z: 0 }, up: { x: 0, y: 10, z: 0 }, throttle: -5 },
    { forward: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 0 }, throttle: 5 }];
  for (const input of invalidInputs) {
    for (const velocity of [undefined, {}, { x: NaN, y: Infinity, z: -Infinity },
      { x: Number.MAX_VALUE, y: -Number.MAX_VALUE, z: Number.MAX_VALUE }]) {
      const result = stepFlightVelocity(velocity, 0.05, input);
      finiteResult(result);
      assert.ok(result.throttle >= 0 && result.throttle <= 1);
    }
  }
  const velocity = Object.freeze({ x: 1, y: 2, z: -4 });
  const input = Object.freeze({ forward: Object.freeze({ x: 0, y: 0, z: -2 }),
    up: Object.freeze({ x: 0, y: 10, z: 0 }), throttle: 0.7 });
  finiteResult(stepFlightVelocity(velocity, 0.05, input));
  assert.deepEqual(velocity, { x: 1, y: 2, z: -4 });
  near(stepFlightVelocity(velocity, 0, { ...pose(), throttle: -1 }).throttle, 0);
  near(stepFlightVelocity(velocity, 0, { ...pose(), throttle: 2 }).throttle, 1);
});

test('powered level recovery regains forward flight within eight seconds and game-scale altitude', () => {
  // Cruise is now 8 rather than 6 m/s, while all acceleration formulas remain
  // unchanged. Allow the same proportional 6 * (8 / 6) seconds to build speed.
  const recoverySeconds = 8;
  // With the new speed normalization, the measured worst loss is 6.705 m.
  // A 7 m drop budget reserves more than 3 m above the 10 m course start.
  const maxRecoveryDrop = 7;
  for (const down of [0, 3, 6]) for (const throttle of [.5, 1]) {
    let velocity = { x: 0, y: -down, z: 0 }, height = 0, minimum = 0;
    for (let i = 0; i < recoverySeconds * 60; i++) {
      const next = stepFlightVelocity(velocity, 1 / 60, { ...pose(), throttle });
      height += (velocity.y + next.velocity.y) / 120;
      minimum = Math.min(minimum, height);
      velocity = next.velocity;
    }
    assert.ok(-velocity.z > 4.5, `down=${down}, power=${throttle}: forward ${-velocity.z}`);
    assert.ok(velocity.y > -.15, `down=${down}, power=${throttle}: descent ${velocity.y}`);
    assert.ok(minimum > -maxRecoveryDrop, `down=${down}, power=${throttle}: height loss ${-minimum}`);
  }
});

test('momentum remains continuous when the nose changes and a powered zero-speed aircraft accelerates', () => {
  const initial = { x: 1, y: 2, z: -3 };
  for (const pitch of [-30, 0, 30, 80]) {
    const next = stepFlightVelocity(initial, .01, { ...pose(pitch), throttle: 1 });
    assert.ok(next.velocity.x > .9);
    assert.ok(next.velocity.z < -2.8);
    assert.ok(Math.abs(next.velocity.y - initial.y) < .25);
  }
  const powered = stepFlightVelocity({ x: 0, y: 0, z: 0 }, .05, { ...pose(), throttle: .5 });
  assert.ok(powered.velocity.z < 0);
  assert.ok(powered.velocity.y < 0, 'zero airspeed still has no static wing support');
});

test('recovery requires power and restored posture, and cannot hold a stationary aircraft in the air', () => {
  const falling = { x: 0, y: -6, z: 0 };
  for (const input of [{ ...pose(), throttle: 0 }, { ...pose(80), throttle: 1 },
    { forward: { x: 0, y: 0, z: -1 }, up: { x: 0, y: -1, z: 0 }, throttle: 1 }]) {
    const result = stepFlightVelocity(falling, .01, input);
    near(result.recoveryAssist, 0);
    near(result.recoveryAcceleration, 0);
  }
  const stationary = stepFlightVelocity({ x: 0, y: 0, z: 0 }, 0, { ...pose(), throttle: 1 });
  near(stationary.lift, 0);
  near(stationary.recoveryAcceleration, 0);
  const vertical = stepFlightVelocity({ x: 0, y: 0, z: 0 }, .05, { ...pose(90), throttle: 1 });
  assert.ok(vertical.velocity.y < 0);
});

test('recovery redirects momentum without adding energy beyond engine work', () => {
  const input = { ...pose(), throttle: .5 };
  const dt = 1 / 240;
  let velocity = { x: 0, y: -3, z: 0 }, altitude = 0, work = 0;
  const power = v => stepFlightVelocity(v, 0, input).engineThrust * dot(v, input.forward)
    - FLIGHT_MODEL.cruiseDrag * (length(v) / FLIGHT_MODEL.cruiseSpeed) ** 2 * length(v);
  for (let i = 0; i < 720; i++) {
    const next = stepFlightVelocity(velocity, dt, input);
    work += (power(velocity) + power(next.velocity)) * .5 * dt;
    altitude += (velocity.y + next.velocity.y) * .5 * dt;
    velocity = next.velocity;
  }
  near(.5 * length(velocity) ** 2 + FLIGHT_MODEL.gravity * altitude - 4.5, work, .01);
});

test('recovery force is bounded and smoothly fades at speed and posture boundaries', () => {
  for (const speed of [1, 4.5]) {
    const a = stepFlightVelocity({ x: 0, y: -3, z: -speed + 1e-5 }, 0, { ...pose(), throttle: 1 });
    const b = stepFlightVelocity({ x: 0, y: -3, z: -speed - 1e-5 }, 0, { ...pose(), throttle: 1 });
    near(a.engineThrust, b.engineThrust, .001);
  }
  for (const pitch of [15, 45]) {
    const a = stepFlightVelocity({ x: 0, y: -3, z: -1 }, 0, { ...pose(pitch - 1e-5), throttle: 1 });
    const b = stepFlightVelocity({ x: 0, y: -3, z: -1 }, 0, { ...pose(pitch + 1e-5), throttle: 1 });
    near(a.engineThrust, b.engineThrust, .001);
    near(a.recoveryAcceleration, b.recoveryAcceleration, .001);
  }
  const result = stepFlightVelocity({ x: 0, y: -18, z: -1 }, .05, { ...pose(), throttle: 1 });
  assert.ok(result.recoveryAcceleration <= FLIGHT_MODEL.maxRecoveryAcceleration);
  assert.ok(result.recoveryAssist >= 0 && result.recoveryAssist <= 1);
});
