import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { FLIGHT_MODEL, stepFlightVelocity } from '../src/flight-physics.js';
import { advanceAfterburner, createAfterburnerState, awardAfterburner } from '../src/afterburner.js';

const reference = JSON.parse(readFileSync(new URL('./fixtures/flight-v0126-reference.json', import.meta.url), 'utf8'));
const level = { forward: { x: 0, y: 0, z: -1 }, up: { x: 0, y: 1, z: 0 }, throttle: 1 };
const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance,
  `${actual} should be ${expected} ± ${tolerance}`);

test('all 360 frozen v26 force cases keep every result field exactly when AB and overspeed are off', () => {
  assert.equal(reference.version, '0.1.26'); assert.equal(reference.cases.length, 360);
  for (const [index, entry] of reference.cases.entries()) {
    for (const flags of [{}, { afterburner: false, preserveOverspeed: false }]) {
      const actual = stepFlightVelocity(entry.velocity, entry.dt, { ...entry.input, ...flags });
      for (const axis of ['x', 'y', 'z'])
        assert.ok(actual.velocity[axis] === entry.result.velocity[axis], `v26 case ${index} velocity.${axis}`);
      for (const key of Object.keys(entry.result).filter(key => key !== 'velocity'))
        // JSON records both +0 and -0 as 0; all other numbers must match exactly.
        assert.ok(actual[key] === entry.result[key], `v26 case ${index} ${key}`);
    }
  }
  const normal = stepFlightVelocity({ x: 0, y: 0, z: -90 }, 0, level);
  assert.equal(normal.speed, 30);
});

test('AB changes only the extra thrust and cap, without instantaneous acceleration or altered lift/stall', () => {
  for (const pitch of [0, 20, 45, 70, 100]) for (const throttle of [0, .5, 1]) {
    const angle = pitch * Math.PI / 180;
    const input = { forward: { x: 0, y: Math.sin(angle), z: -Math.cos(angle) },
      up: { x: 0, y: Math.cos(angle), z: Math.sin(angle) }, throttle };
    const normal = stepFlightVelocity({ x: 0, y: 0, z: -10 }, 0, input);
    const burning = stepFlightVelocity({ x: 0, y: 0, z: -10 }, 0, { ...input, afterburner: true });
    near(burning.engineThrust - normal.engineThrust, 18);
    for (const key of ['speed', 'verticalSpeed', 'angleOfAttack', 'lift', 'throttle', 'recoveryAssist', 'recoveryAcceleration'])
      assert.equal(burning[key], normal[key], `unchanged ${key}, pitch ${pitch}, throttle ${throttle}`);
  }
  const accelerated = stepFlightVelocity({ x: 0, y: 0, z: -10 }, .05, { ...level, afterburner: true });
  assert.ok(accelerated.speed > 10.8 && accelerated.speed < 11.1);
  const capped = stepFlightVelocity({ x: 0, y: 0, z: -90 }, 0, { ...level, afterburner: true });
  near(capped.speed, 45);
});

test('a full paid burst really accelerates beyond 30 m/s while the temporary cap remains 45', () => {
  let velocity = { x: 0, y: 0, z: -10 }, maximum = 0;
  let state = awardAfterburner(createAfterburnerState(), { targets: 8 });
  for (let frame = 0; frame < 500; frame += 1) {
    const burn = advanceAfterburner(state, 1 / 60, { running: true, flight: true,
      manualRequest: true, speed: Math.hypot(velocity.x, velocity.y, velocity.z), groundClearance: 20 });
    state = burn.state;
    velocity = stepFlightVelocity(velocity, burn.activeSeconds, { ...level, afterburner: true }).velocity;
    const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
    maximum = Math.max(maximum, speed);
    assert.ok(speed <= 45 + 1e-10);
  }
  assert.ok(maximum > 44, `actual maximum ${maximum}`);
  near(state.seconds, 100 / 12, 1e-9); near(state.fuel, 0, 1e-9);
  assert.equal(state.uses, 1);
});

test('release keeps existing high-speed momentum and existing drag slows it rather than cutting to 30', () => {
  const initial = { x: 0, y: 0, z: -45 };
  const stopped = stepFlightVelocity(initial, 0, { ...level, preserveOverspeed: true });
  near(stopped.speed, 45); near(stopped.engineThrust, 1.8);
  let previous = 45, velocity = initial;
  for (let frame = 0; frame < 180; frame += 1) {
    const result = stepFlightVelocity(velocity, 1 / 60, { ...level, preserveOverspeed: true });
    if (frame === 0) assert.ok(result.speed > 44.5);
    assert.ok(result.speed <= Math.max(30, previous) + 1e-10, `no new overspeed ${frame}`);
    velocity = result.velocity; previous = result.speed;
  }
  assert.ok(previous < 30);
  assert.equal(FLIGHT_MODEL.maxSpeed, 30); assert.equal(FLIGHT_MODEL.gravity, 3);
});

test('fuel expiring inside a force frame pays only for its fractional AB interval', () => {
  const flight = { running: true, flight: true, manualRequest: true, speed: 10, groundClearance: 20 };
  const funded = awardAfterburner(createAfterburnerState(), { targets: 1 });
  const almostEmpty = advanceAfterburner(funded, 25 / 12 - .005, flight).state;
  const final = advanceAfterburner(almostEmpty, 1 / 60, flight);
  near(final.activeSeconds, .005); assert.equal(final.ended, true); assert.equal(final.state.fuel, 0);
  const initial = { x: 0, y: 0, z: -10 };
  const paid = stepFlightVelocity(initial, final.activeSeconds, { ...level, afterburner: true });
  const released = stepFlightVelocity(paid.velocity, 1 / 60 - final.activeSeconds,
    { ...level, preserveOverspeed: true });
  const freeWholeFrame = stepFlightVelocity(initial, 1 / 60, { ...level, afterburner: true });
  assert.ok(released.speed > 10.09 && released.speed < 10.12, `paid speed ${released.speed}`);
  assert.ok(freeWholeFrame.speed - released.speed > .2, 'unpaid AB time would visibly over-accelerate');
  near(released.engineThrust, 1.8);
});
