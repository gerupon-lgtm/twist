import assert from 'node:assert/strict';
import test from 'node:test';
import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import {
  advanceSpeed, compensationQuaternion, controlRates, orientationQuaternion, relativeAngles,
} from '../src/controls.js';

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

  test(`${name}: acceleration and yaw retain simultaneous clockwise pitch`, () => {
    // A known 25-degree turn around the screen-plane direction (-3/5, 4/5).
    // Its independent physical rotation vector is (-15, 20, 0) degrees.
    const tilt = axisRotation(-3, 4, 0, 25);
    const current = reference.clone().multiply(tilt).multiply(axisRotation(0, 0, 1, -23));
    const angles = relativeAngles(reference, current);
    nearAngles(angles, -15, 20, 23);
    const rates = controlRates(angles);
    near(rates.pitchRate, controlRates({ twist: 23 }).pitchRate);
    assert.ok(rates.yawRate > 0);
    assert.ok(rates.acceleration > 0);
    assert.equal(rates.brake, 0);
    assert.ok(advanceSpeed(2, 0.05, rates) > 2);
    // Untwisting ends the climb command while the same tilt keeps accelerating.
    const untwisted = relativeAngles(reference, reference.clone().multiply(tilt));
    nearAngles(untwisted, -15, 20, 0);
    near(controlRates(untwisted).pitchRate, 0);
    near(controlRates(untwisted).acceleration, rates.acceleration);
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

test('rates map fore/aft to acceleration/brake and twist to bounded vertical turning', () => {
  const neutral = controlRates({ pitch: 3, steer: -3, twist: 5 });
  for (const value of Object.values(neutral)) near(value, 0);
  const middle = controlRates({ pitch: -14, steer: -14, twist: 18.5 });
  near(middle.pitchRate, 0.325);
  near(middle.yawRate, -0.4);
  near(middle.acceleration, 1.75);
  near(middle.brake, 0);
  near(controlRates({ pitch: 14 }).brake, 3.25);
  near(controlRates({ pitch: 14 }).acceleration, 0);
  near(controlRates({ twist: -18.5 }).pitchRate, -0.325);
  const max = controlRates({ pitch: -90, steer: -90, twist: 180 });
  near(max.pitchRate, 0.65);
  near(max.yawRate, -0.8);
  near(max.acceleration, 3.5);
  near(controlRates({ pitch: 90 }).brake, 6.5);
  assert.equal(controlRates({ twist: 5 }).pitchRate, 0);
  assert.ok(controlRates({ twist: 5.001 }).pitchRate > 0);
  assert.ok(controlRates({ pitch: -3.001 }).acceleration > 0);
  const sensitive = controlRates({ pitch: -14, steer: 14, twist: 18.5 }, 2);
  near(sensitive.pitchRate, 0.65);
  near(sensitive.yawRate, 0.8);
  near(sensitive.acceleration, 3.5);
  for (const value of Object.values(controlRates({ pitch: -25, steer: 25, twist: 32 }, 0))) {
    near(value, 0);
  }
});

test('invalid math inputs and a screen flip fail to finite stopped controls', () => {
  for (const angles of [undefined, {}, { pitch: NaN, steer: Infinity, twist: NaN }]) {
    const rates = controlRates(angles);
    assert.ok(Object.values(rates).every(Number.isFinite));
    for (const value of Object.values(rates)) near(value, 0);
  }
  nearAngles(relativeAngles(null, new Quaternion()), 0, 0, 0);
  nearAngles(relativeAngles(new Quaternion(), axisRotation(1, 0, 0, 180)), 0, 0, 0);
});

test('compensation preserves the physical reference axes for flat, tilted, and combined motion', () => {
  const references = [new Quaternion(), axisRotation(1, 2, 3, 73)];
  const motions = [axisRotation(1, 0, 0, 24), axisRotation(0, 1, 0, -31),
    axisRotation(0, 0, 1, -35),
    axisRotation(-3, 4, 0, 25).multiply(axisRotation(0, 0, 1, -23))];
  for (const reference of references) {
    for (const motion of motions) {
      const current = reference.clone().multiply(motion);
      const beforeReference = reference.toArray();
      const beforeCurrent = current.toArray();
      const compensation = compensationQuaternion(reference, current);
      // Reconstruct what a person sees: phone rotation follows screen-local
      // craft rotation. All three physical craft axes must equal their start.
      for (const basis of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
        const visibleAxis = new Vector3(...basis).applyQuaternion(compensation).applyQuaternion(current);
        nearVector(visibleAxis, new Vector3(...basis).applyQuaternion(reference).toArray());
      }
      near(current.clone().multiply(compensation).dot(reference), 1);
      assert.deepEqual(reference.toArray(), beforeReference);
      assert.deepEqual(current.toArray(), beforeCurrent);
    }
  }
});

test('compensation keeps physical up through portrait and landscape sensor poses', () => {
  for (const screenAngle of [0, 90, 180, 270]) {
    const reference = orientationQuaternion({ alpha: 123, beta: 47, gamma: -22 }, screenAngle);
    const current = orientationQuaternion({ alpha: 172, beta: 69, gamma: 13 }, screenAngle);
    const compensation = compensationQuaternion(reference, current);
    const physicalUp = new Vector3(0, 1, 0).applyQuaternion(compensation).applyQuaternion(current);
    nearVector(physicalUp, new Vector3(0, 1, 0).applyQuaternion(reference).toArray());
    near(current.clone().multiply(compensation).dot(reference), 1);
  }
  // Clockwise phone rotation must visibly rotate the craft counterclockwise.
  const compensation = compensationQuaternion(new Quaternion(), axisRotation(0, 0, 1, -35));
  nearVector(new Vector3(1, 0, 0).applyQuaternion(compensation), [Math.cos(rad(35)), Math.sin(rad(35)), 0]);
});

test('compensation invalid inputs return identity and scaled finite inputs remain valid', () => {
  const valid = axisRotation(1, 2, 0, 60);
  for (const invalid of [null, {}, { x: NaN, y: 0, z: 0, w: 1 },
    { x: Infinity, y: 0, z: 0, w: 1 }, { x: 0, y: 0, z: 0, w: 0 }]) {
    assert.deepEqual(compensationQuaternion(valid, invalid).toArray(), [0, 0, 0, 1]);
    assert.deepEqual(compensationQuaternion(invalid, valid).toArray(), [0, 0, 0, 1]);
  }
  const scaled = { x: valid.x * 2, y: valid.y * 2, z: valid.z * 2, w: valid.w * 2 };
  near(compensationQuaternion(valid, scaled).w, 1);
});

test('speed integrates acceleration, coasts in neutral, brakes to zero, and never reverses', () => {
  const accelerating = controlRates({ pitch: -25 });
  const braking = controlRates({ pitch: 25 });
  near(advanceSpeed(0, 2, accelerating), 7);
  near(advanceSpeed(7, 5, controlRates({ pitch: 0 })), 7);
  near(advanceSpeed(7, 1, braking), 0.5);
  near(advanceSpeed(0.5, 1, braking), 0);
  near(advanceSpeed(0, 1, braking), 0);
  near(advanceSpeed(9, 1, accelerating), 10);
  near(advanceSpeed(10, 1, accelerating), 10);
  near(advanceSpeed(4, 0.5, { acceleration: 2, brake: 1 }), 4.5);
});

test('speed accepts finite seconds and handles invalid state, rates, and time without nonfinite results', () => {
  for (const dt of [NaN, Infinity, -Infinity, -1, 0]) {
    near(advanceSpeed(4, dt, { acceleration: 3.5 }), 4);
  }
  for (const speed of [NaN, Infinity, -Infinity, -1]) near(advanceSpeed(speed, 0, {}), 0);
  near(advanceSpeed(100, 0, {}), 10);
  near(advanceSpeed(4, 1, { acceleration: NaN, brake: Infinity }), 4);
  near(advanceSpeed(4, 1, { acceleration: -5, brake: -5 }), 4);
  near(advanceSpeed(4, 1, { acceleration: 100 }), 7.5);
  near(advanceSpeed(4, 1, { brake: 100 }), 0);
  near(advanceSpeed(4, Number.MAX_VALUE, { acceleration: 3.5 }), 10);
  near(advanceSpeed(4, Number.MAX_VALUE, { brake: 6.5 }), 0);
  near(advanceSpeed(4, Number.MAX_VALUE, {}), 4);
});
