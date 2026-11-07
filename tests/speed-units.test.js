import assert from 'node:assert/strict';
import test from 'node:test';
import { SPEED_UNITS, DEFAULT_SPEED_UNIT, normalizeSpeedUnit, convertSpeed } from '../src/speed-units.js';

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should be ${expected}`);

test('actual metres per second convert honestly to selectable HUD units', () => {
  assert.equal(DEFAULT_SPEED_UNIT, 'km/h');
  assert.deepEqual(SPEED_UNITS, ['m/s', 'km/h', 'kt']); assert.equal(Object.isFrozen(SPEED_UNITS), true);
  for (const [speed, kmh, knots] of [[0, 0, 0], [10, 36, 19.43844492440605],
    [30, 108, 58.31533477321814], [45, 162, 87.47300215982721]]) {
    near(convertSpeed(speed, 'm/s'), speed);
    near(convertSpeed(speed, 'km/h'), kmh);
    near(convertSpeed(speed, 'kt'), knots);
  }
});

test('missing or unsupported units use km/h and invalid speeds cannot display NaN or negative speed', () => {
  for (const unit of SPEED_UNITS) assert.equal(normalizeSpeedUnit(unit), unit);
  for (const unit of [undefined, null, '', 'mph', 'KM/H', 1, {}, '__proto__']) {
    assert.equal(normalizeSpeedUnit(unit), 'km/h'); near(convertSpeed(10, unit), 36);
  }
  for (const speed of [undefined, null, NaN, Infinity, -Infinity, -2, '10'])
    assert.equal(convertSpeed(speed, 'kt'), 0);
});
