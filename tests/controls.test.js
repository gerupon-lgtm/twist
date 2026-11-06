import assert from 'node:assert/strict';
import test from 'node:test';
import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import { controlRates, orientationQuaternion, relativeAngles } from '../src/controls.js';

const rad = MathUtils.degToRad;
const axisRotation = (x, y, z, degrees) => new Quaternion().setFromAxisAngle(
  new Vector3(x, y, z).normalize(), rad(degrees),
);
const near = (actual, expected, tolerance = 1e-8) => {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} should be ${expected}`);
};
const nearVector = (actual, expected) => {
  near(actual.x, expected[0]);
  near(actual.y, expected[1]);
  near(actual.z, expected[2]);
};
const nearAngles = (actual, pitch, steer, twist) => {
  near(actual.pitch, pitch);
  near(actual.steer, steer);
  near(actual.twist, twist);
};

test('sensor requires all three finite numeric axes', () => {
  for (const sample of [null, {}, { alpha: 0, beta: 0 },
    { alpha: null, beta: 0, gamma: 0 }, { alpha: '0', beta: 0, gamma: 0 },
    { alpha: 0, beta: NaN, gamma: 0 }, { alpha: 0, beta: 0, gamma: Infinity }]) {
    assert.equal(orientationQuaternion(sample), null);
  }
  assert.equal(orientationQuaternion({ alpha: 0, beta: 0, gamma: 0 }, NaN), null);
  assert.ok(orientationQuaternion({ alpha: 0, beta: 0, gamma: 0 }) instanceof Quaternion);
});

test('sensor rotation follows physical intrinsic Z-X-Y axis order', () => {
  const rotation = orientationQuaternion({ alpha: 90, beta: 90, gamma: 90 });
  // Rotate each device basis successively: Y first, then X, then world Z.
  nearVector(new Vector3(1, 0, 0).applyQuaternion(rotation), [-1, 0, 0]);
  nearVector(new Vector3(0, 1, 0).applyQuaternion(rotation), [0, 0, 1]);
  nearVector(new Vector3(0, 0, 1).applyQuaternion(rotation), [0, 1, 0]);
});

test('neutral and heading wrap use the shortest physical motion', () => {
  const reference = orientationQuaternion({ alpha: 359, beta: 0, gamma: 0 });
  nearAngles(relativeAngles(reference, reference), 0, 0, 0);
  nearAngles(relativeAngles(reference,
    orientationQuaternion({ alpha: 1, beta: 0, gamma: 0 })), 0, 0, -2);
  nearAngles(relativeAngles(
    orientationQuaternion({ alpha: 1, beta: 0, gamma: 0 }), reference), 0, 0, 2);
});

for (const [name, reference] of [
  ['flat', new Quaternion()],
  ['arbitrary held pose', new Quaternion().setFromEuler(new Euler(rad(61), rad(-37), rad(143), 'ZYX'))],
  ['near vertical held pose', orientationQuaternion({ alpha: 283, beta: 89.99999, gamma: 42 })],
]) {
  test(`${name}: each calibrated axis remains independent`, () => {
    for (const degrees of [-24, -11, 11, 24]) {
      nearAngles(relativeAngles(reference,
        reference.clone().multiply(axisRotation(1, 0, 0, degrees))), degrees, 0, 0);
      nearAngles(relativeAngles(reference,
        reference.clone().multiply(axisRotation(0, 1, 0, degrees))), 0, degrees, 0);
      nearAngles(relativeAngles(reference,
        reference.clone().multiply(axisRotation(0, 0, 1, -degrees))), 0, 0, degrees);
    }
  });

  test(`${name}: diagonal tilt retains clockwise throttle`, () => {
    // A known 25-degree turn around the screen-plane direction (3/5, 4/5).
    // Its independent physical rotation vector is (15, 20, 0) degrees.
    const tilt = axisRotation(3, 4, 0, 25);
    const current = reference.clone().multiply(tilt).multiply(axisRotation(0, 0, 1, -23));
    const angles = relativeAngles(reference, current);
    nearAngles(angles, 15, 20, 23);
    near(controlRates(angles).speed, controlRates({ twist: 23 }).speed);
    // Untwisting while retaining the same tilt must stop in this very sample.
    nearAngles(relativeAngles(reference, reference.clone().multiply(tilt)), 15, 20, 0);
    assert.equal(controlRates(relativeAngles(reference, reference.clone().multiply(tilt))).speed, 0);
  });
}

test('screen angle rotates the calibrated horizontal and vertical axes', () => {
  const neutralSample = { alpha: 0, beta: 0, gamma: 0 };
  const betaTilt = { alpha: 0, beta: 20, gamma: 0 };
  nearAngles(relativeAngles(orientationQuaternion(neutralSample), orientationQuaternion(betaTilt)), 20, 0, 0);
  nearAngles(relativeAngles(orientationQuaternion(neutralSample, 90),
    orientationQuaternion(betaTilt, 90)), 0, 20, 0);
  nearAngles(relativeAngles(orientationQuaternion(neutralSample, -90),
    orientationQuaternion(betaTilt, -90)), 0, -20, 0);
  nearAngles(relativeAngles(orientationQuaternion(neutralSample, 180),
    orientationQuaternion(betaTilt, 180)), -20, 0, 0);
  nearVector(new Vector3(1, 0, 0).applyQuaternion(
    orientationQuaternion({ alpha: 90, beta: 0, gamma: 0 }, 90)), [1, 0, 0]);
});

test('equivalent quaternion signs and normalized input cannot change controls', () => {
  const reference = axisRotation(1, 2, 3, 128);
  const current = reference.clone().multiply(axisRotation(1, 0, 0, 17))
    .multiply(axisRotation(0, 0, 1, -20));
  const negative = new Quaternion(-current.x, -current.y, -current.z, -current.w);
  nearAngles(relativeAngles(reference, negative), 17, 0, 20);
  const scaled = new Quaternion(current.x * 2, current.y * 2, current.z * 2, current.w * 2);
  nearAngles(relativeAngles(reference, scaled), 17, 0, 20);
});

test('rates have a physical deadzone, bounded continuous response, and no reverse throttle', () => {
  assert.deepEqual(controlRates({ pitch: 3, steer: -3, twist: 5 }), { pitchRate: 0, yawRate: -0, speed: 0 });
  const middle = controlRates({ pitch: 14, steer: -14, twist: 18.5 });
  near(middle.pitchRate, 0.325);
  near(middle.yawRate, -0.4);
  near(middle.speed, 5);
  const max = controlRates({ pitch: 90, steer: -90, twist: 180 });
  near(max.pitchRate, 0.65);
  near(max.yawRate, -0.8);
  near(max.speed, 10);
  assert.equal(controlRates({ twist: -32 }).speed, 0);
  assert.equal(controlRates({ twist: 5 }).speed, 0);
  assert.ok(controlRates({ twist: 5.001 }).speed > 0);
  near(controlRates({ pitch: 14, steer: 14, twist: 18.5 }, 2).pitchRate, 0.65);
  near(controlRates({ pitch: 14, steer: 14, twist: 18.5 }, 2).speed, 5);
});

test('invalid math inputs and a screen flip fail to finite stopped controls', () => {
  for (const angles of [undefined, {}, { pitch: NaN, steer: Infinity, twist: NaN }]) {
    const rates = controlRates(angles);
    assert.ok(Object.values(rates).every(Number.isFinite));
    assert.equal(rates.speed, 0);
  }
  nearAngles(relativeAngles(null, new Quaternion()), 0, 0, 0);
  nearAngles(relativeAngles(new Quaternion(), axisRotation(1, 0, 0, 180)), 0, 0, 0);
});
