import assert from 'node:assert/strict';
import test from 'node:test';
import { getGroundProximity } from '../src/ground-proximity.js';

const near = (actual, expected, tolerance = 1e-10) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be ${expected}`);
};
const proximity = (altitude, verticalSpeed = 0, grounded = false) => getGroundProximity({ altitude, verticalSpeed, grounded });
const finiteResult = result => {
  assert.ok(Number.isFinite(result.clearance) && result.clearance >= 0);
  assert.ok(Number.isFinite(result.ratio) && result.ratio >= 0 && result.ratio <= 1);
  assert.ok(result.secondsToStop === null || (Number.isFinite(result.secondsToStop) && result.secondsToStop >= 0));
};

test('initial level flight is clear and the bar measures actual ground clearance over 12 m', () => {
  const initial = proximity(7);
  assert.equal(initial.clearance, 7);
  assert.equal(initial.level, 'clear');
  near(initial.ratio, 7 / 12);
  assert.equal(initial.known, true);
  assert.equal(initial.descentKnown, true);
  assert.equal(initial.descending, false);
  assert.equal(initial.secondsToStop, null);
  near(proximity(12).ratio, 1);
  near(proximity(30).ratio, 1);
  near(proximity(0).ratio, 0);
});

test('height warning boundaries are inclusive and persist while ascending', () => {
  for (const verticalSpeed of [0, 3]) {
    for (const [altitude, level] of [[5.000001, 'clear'], [5, 'low'],
      [3.500001, 'low'], [3.5, 'danger'], [2, 'danger'], [0, 'danger']]) {
      const result = proximity(altitude, verticalSpeed);
      assert.equal(result.level, level, `${altitude} m at ${verticalSpeed} m/s`);
      assert.equal(result.secondsToStop, null);
    }
  }
  // Finite positions below ground are shown at zero clearance, not as safe.
  assert.equal(proximity(-4, 2).clearance, 0);
  assert.equal(proximity(-4, 2).level, 'danger');
});

test('descending time forecasts use the 2 m stop height with inclusive 3 s and 1.5 s boundaries', () => {
  for (const [seconds, level] of [[3.000001, 'clear'], [3, 'low'],
    [1.500001, 'low'], [1.5, 'danger']]) {
    const result = proximity(8, -6 / seconds);
    near(result.secondsToStop, seconds);
    assert.equal(result.clearance, 8);
    assert.equal(result.level, level);
    assert.equal(result.descending, true);
    // A predictive warning does not pretend that the plane is physically lower.
    near(result.ratio, 8 / 12);
  }
});

test('rapid descent warns above the low-height band and the stronger warning wins', () => {
  const rapid = proximity(20, -20);
  assert.equal(rapid.level, 'danger');
  near(rapid.secondsToStop, .9);
  assert.equal(rapid.clearance, 20);
  near(rapid.ratio, 1);
  assert.equal(proximity(5, -.01).level, 'low');
  assert.equal(proximity(3.5, -.01).level, 'danger');
  assert.equal(proximity(5, -10).level, 'danger');
  near(proximity(2, -1).secondsToStop, 0);
});

test('the explicit ground-stop flag takes priority without inferring a stop from altitude alone', () => {
  const stopped = proximity(2, 0, true);
  assert.equal(stopped.level, 'stopped');
  assert.equal(stopped.clearance, 2);
  near(stopped.ratio, 2 / 12);
  assert.equal(stopped.secondsToStop, null);
  assert.equal(proximity(2, 0, false).level, 'danger');
  assert.equal(proximity(20, -1, true).level, 'stopped');
  const unknownStop = getGroundProximity({ altitude: NaN, verticalSpeed: NaN, grounded: true });
  assert.equal(unknownStop.level, 'stopped');
  assert.equal(unknownStop.known, false);
  finiteResult(unknownStop);
});

test('warning clears after climbing away or arresting a predicted rapid descent, without stored state', () => {
  assert.equal(proximity(8, -4).level, 'danger');
  assert.equal(proximity(8, -2).level, 'low');
  assert.equal(proximity(8, 0).level, 'clear');
  assert.equal(proximity(4, 2).level, 'low');
  assert.equal(proximity(6, 2).level, 'clear');
  const input = Object.freeze({ altitude: 7, verticalSpeed: -.5, grounded: false });
  const before = { ...input };
  assert.deepEqual(getGroundProximity(input), getGroundProximity(input));
  assert.deepEqual(input, before);
});

test('unknown height is explicit and invalid vertical speed does not erase known low-height warnings', () => {
  for (const input of [undefined, null, {}, { altitude: NaN }, { altitude: Infinity },
    { altitude: -Infinity }, { altitude: '7', verticalSpeed: -2 }]) {
    const result = getGroundProximity(input);
    assert.equal(result.level, 'unknown');
    assert.equal(result.known, false);
    assert.equal(result.clearance, 0);
    assert.equal(result.ratio, 0);
    assert.equal(result.secondsToStop, null);
    finiteResult(result);
  }
  for (const verticalSpeed of [undefined, NaN, Infinity, -Infinity, '-4']) {
    for (const [altitude, level] of [[3, 'danger'], [4, 'low'], [7, 'clear']]) {
      const result = getGroundProximity({ altitude, verticalSpeed });
      assert.equal(result.known, true);
      assert.equal(result.descentKnown, false);
      assert.equal(result.descending, false);
      assert.equal(result.secondsToStop, null);
      assert.equal(result.level, level);
      finiteResult(result);
    }
  }
});

test('extremely large heights and very small descent rates retain finite output', () => {
  for (const input of [
    { altitude: Number.MAX_VALUE, verticalSpeed: -Number.MIN_VALUE },
    { altitude: Number.MAX_VALUE, verticalSpeed: -Number.MAX_VALUE },
    { altitude: 7, verticalSpeed: -Number.MIN_VALUE },
    { altitude: -Number.MAX_VALUE, verticalSpeed: -Number.MAX_VALUE },
  ]) finiteResult(getGroundProximity(input));
  const slow = proximity(7, -Number.MIN_VALUE);
  assert.equal(slow.level, 'clear');
  assert.equal(slow.secondsToStop, Number.MAX_VALUE);
  const rapid = proximity(Number.MAX_VALUE, -Number.MAX_VALUE);
  assert.equal(rapid.level, 'danger');
  near(rapid.secondsToStop, 1);
});
