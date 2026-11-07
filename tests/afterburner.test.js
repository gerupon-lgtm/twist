import assert from 'node:assert/strict';
import test from 'node:test';
import { createAfterburnerState, advanceAfterburner, awardAfterburner, stopAfterburner,
  observeAfterburnerSpeed } from '../src/afterburner.js';

const flying = { running: true, flight: true, groundClearance: 20, speed: 10 };
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should be ${expected}`);

test('a collected target funds a manual burst and only actual burn time is charged', () => {
  const empty = Object.freeze(createAfterburnerState());
  assert.equal(empty.fuel, 0);
  const funded = Object.freeze(awardAfterburner(empty, { targets: 1 }));
  assert.equal(funded.fuel, 25); assert.equal(funded.earned, 25);
  const first = advanceAfterburner(funded, 1, { ...flying, manualRequest: true });
  assert.equal(first.ignited, true); assert.equal(first.ended, false);
  assert.equal(first.state.active, true); assert.equal(first.state.uses, 1);
  near(first.activeSeconds, 1); near(first.state.fuel, 13);
  const last = advanceAfterburner(first.state, 2, { ...flying, manualRequest: true });
  near(last.activeSeconds, 13 / 12); near(last.state.seconds, 25 / 12);
  assert.equal(last.state.fuel, 0); assert.equal(last.state.active, false);
  assert.equal(last.state.needsRelease, true); assert.equal(last.ended, true);
  assert.equal(last.ignited, false); assert.equal(funded.fuel, 25);
});

test('an initially empty held request cannot ignite on a later target reward until released', () => {
  const held = advanceAfterburner(createAfterburnerState(), .1, { ...flying, manualRequest: true });
  assert.equal(held.state.needsRelease, true); assert.equal(held.state.uses, 0);
  const refilled = awardAfterburner(held.state, { targets: 1 });
  const stillHeld = advanceAfterburner(refilled, .1, { ...flying, manualRequest: true });
  assert.equal(stillHeld.state.active, false); assert.equal(stillHeld.state.fuel, 25);
  const released = advanceAfterburner(stillHeld.state, .1, flying);
  assert.equal(released.state.needsRelease, false);
  const pressed = advanceAfterburner(released.state, .1, { ...flying, manualRequest: true });
  assert.equal(pressed.ignited, true); near(pressed.state.fuel, 23.8);
});

test('low flight earns linearly with clearance, but not at rest, grounded, paused, or while burning', () => {
  for (const [height, earned] of [[.01, 3.9966666666666666], [3, 3], [6, 2], [12, 0], [15, 0], [0, 0], [-1, 0]]) {
    const result = advanceAfterburner(createAfterburnerState(), 1, { ...flying, groundClearance: height, speed: 6 });
    near(result.state.fuel, earned); near(result.state.earned, earned);
  }
  for (const overrides of [{ speed: 5.99 }, { grounded: true }, { running: false }, { flight: false },
    { groundClearance: NaN }, { speed: Infinity }]) {
    const result = advanceAfterburner(createAfterburnerState(), 1, { ...flying, groundClearance: 3, ...overrides });
    assert.equal(result.state.fuel, 0);
  }
  const funded = awardAfterburner(createAfterburnerState(), { targets: 1 });
  const burning = advanceAfterburner(funded, 1, { ...flying, groundClearance: 3, manualRequest: true });
  assert.equal(burning.state.fuel, 13); assert.equal(burning.state.earned, 25);
  const ending = advanceAfterburner(burning.state, 2, { ...flying, groundClearance: 3, manualRequest: true });
  assert.equal(ending.state.fuel, 0); assert.equal(ending.state.earned, 25);
});

test('target chains include the ten-second boundary, cap their bonus, and count actual stored rewards', () => {
  let state = awardAfterburner(createAfterburnerState(), { targets: 1 });
  state = { ...state, fuel: 0 };
  state = advanceAfterburner(state, 10, flying).state;
  state = awardAfterburner(state, { targets: 1 });
  assert.equal(state.fuel, 30); assert.equal(state.combo, 2);
  state = awardAfterburner({ ...state, fuel: 0 }, { targets: 1 });
  assert.equal(state.fuel, 35);
  state = awardAfterburner({ ...state, fuel: 0 }, { targets: 2 });
  assert.equal(state.fuel, 80); assert.equal(state.combo, 5);
  state = advanceAfterburner({ ...state, fuel: 0 }, 10.001, flying).state;
  state = awardAfterburner(state, { targets: 1 });
  assert.equal(state.fuel, 25); assert.equal(state.combo, 1);
  const capped = awardAfterburner({ ...createAfterburnerState(), fuel: 90 }, { targets: 8, exit: true });
  assert.equal(capped.fuel, 100); assert.equal(capped.earned, 10);
  const exit = awardAfterburner(createAfterburnerState(), { exit: true });
  assert.equal(exit.fuel, 40); assert.equal(exit.earned, 40); assert.equal(exit.combo, 0);
});

test('pause stops a burst without losing fuel, target time, or statistics and requires a new release', () => {
  const funded = awardAfterburner(createAfterburnerState(), { targets: 1 });
  const burning = advanceAfterburner(funded, .5, { ...flying, manualRequest: true }).state;
  const stopped = stopAfterburner(Object.freeze(burning));
  assert.equal(stopped.active, false); assert.equal(stopped.needsRelease, true);
  for (const key of ['fuel', 'uses', 'seconds', 'earned', 'burstSeconds', 'timeSeconds', 'combo', 'lastTargetSeconds'])
    assert.equal(stopped[key], burning[key], key);
  const paused = advanceAfterburner(stopped, 20, { ...flying, running: false });
  assert.equal(paused.state.timeSeconds, .5); assert.equal(paused.activeSeconds, 0);
  const resumedHeld = advanceAfterburner(paused.state, .1, { ...flying, manualRequest: true });
  assert.equal(resumedHeld.ignited, false);
  const seen = observeAfterburnerSpeed(stopped, 42.25);
  assert.equal(seen.maxSpeed, 42.25);
  assert.equal(observeAfterburnerSpeed(seen, NaN).maxSpeed, 42.25);
  assert.equal(observeAfterburnerSpeed(seen, 12).maxSpeed, 42.25);
});

test('automatic nose-down demand is off by default and needs a 180ms hold with five-degree release hysteresis', () => {
  const funded = awardAfterburner(createAfterburnerState(), { targets: 1 });
  const noseDown = { ...flying, pitchInputDegrees: -35 };
  assert.equal(advanceAfterburner(funded, 1, noseDown).state.active, false);
  let result = advanceAfterburner(funded, .17, { ...noseDown, autoEnabled: true });
  assert.equal(result.ignited, false); near(result.state.fuel, 25);
  result = advanceAfterburner(result.state, .02, { ...noseDown, autoEnabled: true });
  assert.equal(result.ignited, true); near(result.activeSeconds, .01); near(result.state.fuel, 24.88);
  const held = advanceAfterburner(result.state, .1, { ...noseDown, autoEnabled: true, pitchInputDegrees: -31 });
  assert.equal(held.state.active, true); assert.equal(held.ignited, false);
  const released = advanceAfterburner(held.state, .1, { ...noseDown, autoEnabled: true, pitchInputDegrees: -30 });
  assert.equal(released.ended, true); assert.equal(released.state.active, false);
  const resetHold = advanceAfterburner(funded, .17, { ...noseDown, autoEnabled: true });
  const interrupted = advanceAfterburner(resetHold.state, .02, { ...noseDown, autoEnabled: true, pitchInputDegrees: -34 });
  assert.equal(interrupted.state.autoHoldSeconds, 0);
  const newHold = advanceAfterburner(interrupted.state, .1, { ...noseDown, autoEnabled: true });
  assert.equal(newHold.ignited, false);
});

test('automatic angles are adjustable, manual activation is immediate, and empty automatic demand also latches release', () => {
  const funded = awardAfterburner(createAfterburnerState(), { targets: 1 });
  const auto = { ...flying, autoEnabled: true, autoAngle: 50, pitchInputDegrees: -49 };
  assert.equal(advanceAfterburner(funded, 1, auto).state.active, false);
  const triggered = advanceAfterburner(funded, .2, { ...auto, pitchInputDegrees: -50 });
  assert.equal(triggered.ignited, true); near(triggered.activeSeconds, .02);
  const manual = advanceAfterburner(funded, .1, { ...auto, manualRequest: true });
  near(manual.activeSeconds, .1); assert.equal(manual.ignited, true);
  const emptyDemand = advanceAfterburner(createAfterburnerState(), .2, { ...auto, pitchInputDegrees: -50 });
  assert.equal(emptyDemand.state.needsRelease, true);
  const refilled = awardAfterburner(emptyDemand.state, { targets: 1 });
  assert.equal(advanceAfterburner(refilled, .2, { ...auto, pitchInputDegrees: -50 }).state.active, false);
  const neutral = advanceAfterburner(refilled, .1, { ...auto, pitchInputDegrees: -45 });
  assert.equal(neutral.state.needsRelease, false);
  const rearmed = advanceAfterburner(neutral.state, .2, { ...auto, pitchInputDegrees: -50 });
  assert.equal(rearmed.ignited, true);
});

test('zero or invalid time never spends fuel, advances the target clock, or creates ignition statistics', () => {
  const funded = Object.freeze(awardAfterburner(createAfterburnerState(), { targets: 1 }));
  for (const dt of [0, -1, NaN, Infinity, -Infinity, undefined]) {
    const result = advanceAfterburner(funded, dt, { ...flying, manualRequest: true });
    assert.equal(result.activeSeconds, 0); assert.equal(result.ignited, false);
    assert.equal(result.state.fuel, 25); assert.equal(result.state.uses, 0);
    assert.equal(result.state.timeSeconds, 0); assert.equal(result.state.earned, 25);
  }
  for (const overrides of [{ running: false }, { flight: false }, { grounded: true }]) {
    const active = advanceAfterburner(funded, .1, { ...flying, manualRequest: true }).state;
    const stopped = advanceAfterburner(active, 10, { ...flying, manualRequest: true, ...overrides });
    assert.equal(stopped.ended, true); assert.equal(stopped.state.active, false);
    near(stopped.state.fuel, 23.8); near(stopped.state.seconds, .1); near(stopped.state.timeSeconds, .1);
  }
});

test('neutral malformed inputs remain finite and do not mutate the supplied gauge', () => {
  for (const input of [undefined, null, {}, { running: true, flight: true, autoEnabled: true,
    pitchInputDegrees: NaN, autoAngle: Infinity, groundClearance: NaN, speed: Infinity }]) {
    const result = advanceAfterburner(Object.freeze(createAfterburnerState()), NaN, input);
    for (const value of Object.values(result.state)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
    assert.equal(result.state.fuel, 0); assert.equal(result.ignited, false);
  }
  const funded = Object.freeze(awardAfterburner(createAfterburnerState(), { targets: 1 }));
  for (const reward of [null, {}, { targets: NaN }, { targets: Infinity }, { targets: -1 }]) {
    const result = awardAfterburner(funded, reward);
    assert.equal(result.fuel, 25); assert.equal(result.earned, 25);
  }
  assert.equal(funded.fuel, 25);
});

test('an empty held request can earn low-altitude fuel without a surprise ignition', () => {
  const input = { ...flying, manualRequest: true, groundClearance: 6 };
  const first = advanceAfterburner(createAfterburnerState(), 1, input);
  assert.equal(first.state.fuel, 2); assert.equal(first.state.needsRelease, true);
  const held = advanceAfterburner(first.state, 1, input);
  assert.equal(held.state.fuel, 4); assert.equal(held.state.active, false); assert.equal(held.state.uses, 0);
  const released = advanceAfterburner(held.state, .1, { ...flying, manualRequest: false });
  const pressed = advanceAfterburner(released.state, .1, input);
  assert.equal(pressed.ignited, true); near(pressed.state.fuel, 2.8);
});

test('an initially empty auto demand latches before its hold completes and low flight refills it', () => {
  const input = { ...flying, autoEnabled: true, pitchInputDegrees: -40, groundClearance: 6 };
  let state = createAfterburnerState();
  for (let i = 0; i < 30; i += 1) {
    const result = advanceAfterburner(state, 1 / 60, input);
    assert.equal(result.ignited, false); assert.equal(result.state.needsRelease, true);
    state = result.state;
  }
  near(state.fuel, 1); assert.equal(state.uses, 0);
  state = advanceAfterburner(state, .1, { ...input, pitchInputDegrees: 0, groundClearance: 20 }).state;
  const pressed = advanceAfterburner(state, .2, { ...input, groundClearance: 20 });
  assert.equal(pressed.ignited, true); near(pressed.activeSeconds, .02);
});

test('auto dwell and paid duration agree between a long update and several short updates', () => {
  const funded = awardAfterburner(createAfterburnerState(), { targets: 1 });
  const input = { ...flying, autoEnabled: true, pitchInputDegrees: -40 };
  const single = advanceAfterburner(funded, 1, input).state;
  let split = funded;
  for (let i = 0; i < 60; i += 1) split = advanceAfterburner(split, 1 / 60, input).state;
  near(single.seconds, .82); near(split.seconds, .82);
  near(single.fuel, 15.16); near(split.fuel, 15.16);
  assert.equal(single.uses, 1); assert.equal(split.uses, 1);
});
