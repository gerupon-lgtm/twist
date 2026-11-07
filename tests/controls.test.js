import assert from 'node:assert/strict';
import test from 'node:test';
import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import {
  CONTROL_LIMITS, advanceSpeed, compensationQuaternion, composeDevicePose, controlRates, deviceTiltAngles, flightRates, orientationQuaternion,
  projectedTiltAngles, relativeAngles,
} from '../src/controls.js';

const rad = MathUtils.degToRad;
// Historical response cases retain their explicit pre-v0.1.16 input angles; new defaults are tested below.
const tiltFlightRates = (angles, sensitivity = 1) => flightRates(angles, sensitivity, 'tilt', {maxSteerTilt:25,maxSteerTwist:32});
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
  const middle = controlRates({ pitch: -7.5, steer: -14, twist: 18.5 });
  near(middle.pitchRate, 0.325);
  near(middle.yawRate, -0.4);
  near(middle.acceleration, 1.75);
  near(middle.brake, 0);
  near(controlRates({ pitch: 7.5 }).brake, 3.25);
  near(controlRates({ pitch: 7.5 }).acceleration, 0);
  near(controlRates({ twist: -18.5 }).pitchRate, -0.325);
  const max = controlRates({ pitch: -90, steer: -90, twist: 90 });
  near(max.pitchRate, 0.65);
  near(max.yawRate, -0.8);
  near(max.acceleration, 3.5);
  near(controlRates({ pitch: 90 }).brake, 6.5);
  assert.equal(controlRates({ twist: 5 }).pitchRate, 0);
  assert.ok(controlRates({ twist: 5.001 }).pitchRate > 0);
  assert.ok(controlRates({ pitch: -3.001 }).acceleration > 0);
  const sensitive = controlRates({ pitch: -7.5, steer: 14, twist: 18.5 }, 2);
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
  const accelerating = controlRates({ pitch: -12 });
  const braking = controlRates({ pitch: 12 });
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

const controlProjection = (craftReference, current, neutralReference = craftReference) => projectedTiltAngles(
  compensationQuaternion(craftReference, current), compensationQuaternion(neutralReference, current),
);
const visibleNose = (craftReference, current) => {
  const nose = new Vector3(0, 1, 0).applyQuaternion(compensationQuaternion(craftReference, current));
  return nose.set(nose.x, nose.y, 0).normalize();
};

for (const [name, reference] of [
  ['flat start', new Quaternion()],
  ['slanted start', axisRotation(1, 0, 0, 60).multiply(axisRotation(0, 1, 0, 25))],
  ['arbitrary start', axisRotation(2, -3, 4, 137)],
]) {
  test(`${name}: visible nose, tail, and sides control tilt after rotated-screen poses`, () => {
    for (const twist of [0, -45, 45, -90, 90, 180, 360]) {
      const current = reference.clone().multiply(axisRotation(0, 0, 1, twist));
      const nose = visibleNose(reference, current);
      for (const angle of [-15, 15]) {
        // Lower the nose by rotating the phone about the perpendicular tangent.
        // This physical axis is read from the rendered geometry, not sensor angles.
        const noseLowered = current.clone().multiply(axisRotation(-nose.y, nose.x, 0, angle));
        const foreAft = controlProjection(reference, noseLowered);
        assert.equal(foreAft.valid, true);
        near(foreAft.pitch, -angle);
        near(foreAft.steer, 0);
        // Rotating about the nose lowers the screen-perpendicular right edge.
        const rightLowered = current.clone().multiply(axisRotation(nose.x, nose.y, 0, angle));
        const sides = controlProjection(reference, rightLowered);
        assert.equal(sides.valid, true);
        near(sides.pitch, 0);
        near(sides.steer, angle);
      }
    }
  });

  test(`${name}: lowering the visible nose another 10 degrees changes pitch by exactly 10`, () => {
    for (const twist of [0, -45, 45, -90, 90, 180, 360]) {
      // Retain the old decomposition discrepancy as an explicit combined-pose
      // regression: rotation vector (-15,20) differs from projected (-14.689,21.089).
      const current = reference.clone().multiply(axisRotation(-3, 4, 0, 25))
        .multiply(axisRotation(0, 0, 1, twist));
      const before = controlProjection(reference, current);
      assert.equal(before.valid, true);
      near(before.pitch, -14.689, 0.001);
      near(before.steer, 21.089, 0.001);
      const nose = visibleNose(reference, current);
      const next = current.clone().multiply(axisRotation(-nose.y, nose.x, 0, 10));
      const after = controlProjection(reference, next);
      assert.equal(after.valid, true);
      near(after.pitch, before.pitch - 10);
      // The new 12-degree throttle range is already saturated in both poses.
      near(controlRates(before).acceleration, 3.5);
      near(controlRates(after).acceleration, 3.5);
    }
  });
}

test('separate neutral reference re-centers controls without rotating the visible craft', () => {
  const craftReference = axisRotation(1, 2, 3, 78);
  const neutralReference = craftReference.clone().multiply(axisRotation(-2, 1, 0, 30))
    .multiply(axisRotation(0, 0, 1, 83));
  const current = neutralReference.clone();
  const fixedCraft = compensationQuaternion(craftReference, current);
  const centered = controlProjection(craftReference, current, neutralReference);
  assert.equal(centered.valid, true);
  near(centered.pitch, 0);
  near(centered.steer, 0);
  const nose = visibleNose(craftReference, current);
  const lowered = current.clone().multiply(axisRotation(-nose.y, nose.x, 0, 10));
  const input = controlProjection(craftReference, lowered, neutralReference);
  assert.equal(input.valid, true);
  near(input.pitch, -10);
  near(input.steer, 0);
  // The drawing still reconstructs the original physical pose, not the new neutral.
  near(current.clone().multiply(fixedCraft).dot(craftReference), 1);
  assert.ok(Math.abs(fixedCraft.w) < 0.9);
});

test('screen-angle-only changes preserve projected controls when both compensations use current screen axes', () => {
  const reference = axisRotation(1, 2, 3, 78);
  const current = reference.clone().multiply(axisRotation(-3, 4, 0, 25));
  const before = controlProjection(reference, current);
  for (const screenAngle of [-90, 90, 180, 360]) {
    // Changing display axes multiplies world-from-display on the right.
    const changedDisplay = current.clone().multiply(axisRotation(0, 0, 1, -screenAngle));
    const after = controlProjection(reference, changedDisplay);
    assert.equal(after.valid, true);
    near(after.pitch, before.pitch);
    near(after.steer, before.steer);
  }
});

test('projected tilt returns safe finite neutral for invalid, edge-on, and back-facing poses', () => {
  const identity = new Quaternion();
  const invalid = { pitch: 0, steer: 0, valid: false };
  for (const q of [null, {}, { x: NaN, y: 0, z: 0, w: 1 },
    { x: Infinity, y: 0, z: 0, w: 1 }, { x: 0, y: 0, z: 0, w: 0 }]) {
    assert.deepEqual(projectedTiltAngles(q), invalid);
    assert.deepEqual(projectedTiltAngles(identity, q), invalid);
  }
  for (const angle of [90, -90, 100, 180, 270]) {
    const result = projectedTiltAngles(axisRotation(1, 0, 0, angle));
    assert.deepEqual(result, invalid);
    assert.ok(Number.isFinite(result.pitch) && Number.isFinite(result.steer));
  }
  // Exercise the nose and normal guards independently, including their vicinity.
  assert.deepEqual(projectedTiltAngles(axisRotation(1, 0, 0, 90), identity), invalid);
  assert.deepEqual(projectedTiltAngles(identity, axisRotation(1, 0, 0, 90)), invalid);
  assert.deepEqual(projectedTiltAngles(axisRotation(1, 0, 0, 89.999), identity), invalid);
  assert.equal(projectedTiltAngles(axisRotation(1, 0, 0, 89.99), identity).valid, true);
  const justUsable = axisRotation(1, 0, 0, MathUtils.radToDeg(Math.acos(0.081)));
  const justUnusable = axisRotation(1, 0, 0, MathUtils.radToDeg(Math.acos(0.079)));
  assert.equal(projectedTiltAngles(identity, justUsable).valid, true);
  assert.deepEqual(projectedTiltAngles(identity, justUnusable), invalid);
  // A genuinely vertical world start is usable: guards concern relative pose.
  const verticalReference = axisRotation(1, 0, 0, 90);
  const relativeTilt = verticalReference.clone().multiply(axisRotation(1, 0, 0, -15));
  const usable = controlProjection(verticalReference, relativeTilt);
  assert.equal(usable.valid, true);
  near(usable.pitch, -15);
});

test('practice pose turns first and then tilts about device axes with physical signs', () => {
  const turned = composeDevicePose({ twist: 90 });
  nearVector(new Vector3(0, 1, 0).applyQuaternion(turned), [1, 0, 0]);
  const noseLowered = composeDevicePose({ pitch: -20, twist: 90 });
  nearVector(new Vector3(0, 1, 0).applyQuaternion(noseLowered), [Math.cos(rad(20)), 0, -Math.sin(rad(20))]);
  const rightLowered = composeDevicePose({ steer: 20, twist: 90 });
  nearVector(new Vector3(1, 0, 0).applyQuaternion(rightLowered), [0, -Math.cos(rad(20)), -Math.sin(rad(20))]);
  const identity = new Quaternion();
  // With the craft nose at screen-left, lowering the phone's left edge accelerates.
  const leftSideLowered = composeDevicePose({ steer: -15, twist: 90 });
  const leftNoseInput = controlProjection(identity, leftSideLowered);
  assert.equal(leftNoseInput.valid, true);
  near(leftNoseInput.pitch, -15);
  near(leftNoseInput.steer, 0);
  const rightSideLowered = composeDevicePose({ steer: 15, twist: -90 });
  near(controlProjection(identity, rightSideLowered).pitch, -15);
  // Simultaneous practice tilts are a rotation vector, not ordered Euler turns.
  const diagonal = composeDevicePose({ pitch: -15, steer: 20, twist: 0 });
  nearAngles(relativeAngles(identity, diagonal), -15, 20, 0);
});

test('practice pose neutralizes invalid components and keeps extreme finite values finite', () => {
  for (const input of [undefined, null, {}, { pitch: NaN, steer: Infinity, twist: -Infinity }]) {
    assert.deepEqual(composeDevicePose(input).toArray(), [0, 0, 0, 1]);
  }
  const partlyValid = composeDevicePose({ pitch: -15, steer: NaN, twist: Infinity });
  nearAngles(relativeAngles(new Quaternion(), partlyValid), -15, 0, 0);
  const huge = composeDevicePose({ pitch: Number.MAX_VALUE, steer: Number.MAX_VALUE, twist: Number.MAX_VALUE });
  assert.ok(huge.toArray().every(Number.isFinite));
  near(huge.length(), 1);
});

test('twist response preserves small-angle sensitivity and returns continuously to half/full-turn neutral', () => {
  for (const twist of [-90, -32, -18.5, 0, 18.5, 32, 90]) {
    const expected = Math.sign(twist) * Math.min(1, Math.max(0, (Math.abs(twist) - 5) / 27)) * 0.65;
    near(controlRates({ twist }).pitchRate, expected);
  }
  for (const center of [-360, -180, 0, 180, 360]) {
    for (const epsilon of [-0.0001, 0, 0.0001]) near(controlRates({ twist: center + epsilon }).pitchRate, 0);
  }
  near(controlRates({ twist: 179 }).pitchRate, 0);
  near(controlRates({ twist: 181 }).pitchRate, 0);
  near(controlRates({ twist: 170 }).pitchRate, controlRates({ twist: 10 }).pitchRate);
  near(controlRates({ twist: 190 }).pitchRate, controlRates({ twist: -10 }).pitchRate);
  near(controlRates({ twist: 350 }).pitchRate, controlRates({ twist: -10 }).pitchRate);
  near(controlRates({ twist: 370 }).pitchRate, controlRates({ twist: 10 }).pitchRate);
});

test('flight tilt steering maps pitch and bank independently while twist cannot change output', () => {
  for (const value of Object.values(tiltFlightRates({ pitch: 0, steer: 0, twist: 0 }))) near(value, 0);
  const climb = tiltFlightRates({ pitch: 25 });
  near(climb.pitchRate, 0.65);
  near(climb.bankAngle, 0);
  near(climb.acceleration, 0);
  near(climb.brake, 0);
  near(tiltFlightRates({ pitch: -25 }).pitchRate, -0.65);
  near(tiltFlightRates({ steer: 25 }).bankAngle, rad(40));
  near(tiltFlightRates({ steer: -25 }).bankAngle, rad(-40));
  near(tiltFlightRates({ twist: 12 }).acceleration, 0);
  near(tiltFlightRates({ twist: 12 }).brake, 0);
  near(tiltFlightRates({ twist: -12 }).acceleration, 0);
  near(tiltFlightRates({ twist: -12 }).brake, 0);
});

test('flight tilt steering combines climb and bank without a simultaneous twist changing output', () => {
  const climbingRight = tiltFlightRates({ pitch: 14, steer: 14, twist: 8.5 });
  near(climbingRight.pitchRate, 0.325);
  near(climbingRight.bankAngle, rad(20));
  near(climbingRight.acceleration, 0);
  near(climbingRight.brake, 0);
  const descendingLeft = tiltFlightRates({ pitch: -14, steer: -14, twist: -8.5 });
  near(descendingLeft.pitchRate, -0.325);
  near(descendingLeft.bankAngle, rad(-20));
  near(descendingLeft.acceleration, 0);
  near(descendingLeft.brake, 0);
});

test('flight tilt steering keeps deadzones and fixed maxima while sensitivity scales the response', () => {
  for (const value of Object.values(tiltFlightRates({ pitch: 3, steer: -3, twist: 5 }))) near(value, 0);
  assert.ok(tiltFlightRates({ pitch: 3.001 }).pitchRate > 0);
  assert.ok(tiltFlightRates({ steer: -3.001 }).bankAngle < 0);
  near(tiltFlightRates({ twist: 5.001 }).acceleration, 0);
  const sensitive = tiltFlightRates({ pitch: 14, steer: 14, twist: 8.5 }, 2);
  near(sensitive.pitchRate, 0.65);
  near(sensitive.bankAngle, rad(40));
  near(sensitive.acceleration, 0);
  const gentle = tiltFlightRates({ pitch: 14, steer: 14, twist: -8.5 }, 0.5);
  near(gentle.pitchRate, 0.1625);
  near(gentle.bankAngle, rad(10));
  near(gentle.brake, 0);
  for (const gain of [0, -1]) {
    for (const value of Object.values(tiltFlightRates({ pitch: 25, steer: 25, twist: 32 }, gain))) near(value, 0);
  }
  for (const gain of [1, 2, Number.MAX_VALUE]) {
    const saturated = tiltFlightRates({ pitch: 100, steer: -100, twist: 90 }, gain);
    near(saturated.pitchRate, 0.65);
    near(saturated.bankAngle, rad(-40));
    near(saturated.acceleration, 0);
  }
});

test('flight tilt steering ignores twist at small angles, half turns, and full turns', () => {
  for (const center of [-360, -180, 0, 180, 360]) {
    for (const epsilon of [-0.0001, 0, 0.0001]) {
      const rate = tiltFlightRates({ twist: center + epsilon });
      near(rate.acceleration, 0);
      near(rate.brake, 0);
    }
  }
  near(tiltFlightRates({ twist: 10 }).acceleration, 0);
  near(tiltFlightRates({ twist: -10 }).brake, 0);
  for (const [equivalent, original] of [[170, 10], [190, -10], [350, -10], [370, 10]]) {
    near(tiltFlightRates({ twist: equivalent }).acceleration, tiltFlightRates({ twist: original }).acceleration);
    near(tiltFlightRates({ twist: equivalent }).brake, tiltFlightRates({ twist: original }).brake);
  }
  for (const twist of [179, 181]) {
    near(tiltFlightRates({ twist }).acceleration, 0);
    near(tiltFlightRates({ twist }).brake, 0);
  }
});

test('flight rate commands leave speed integration to the engine and physical model', () => {
  const accelerating = tiltFlightRates({ twist: 8.5 });
  const braking = tiltFlightRates({ twist: -8.5 });
  near(advanceSpeed(6, 1, accelerating), 6);
  near(advanceSpeed(7.75, 10, tiltFlightRates({ pitch: 25, steer: 25, twist: 0 })), 7.75);
  near(advanceSpeed(7.75, 1, braking), 7.75);
  near(advanceSpeed(9, 1, accelerating), 9);
  near(advanceSpeed(1, 1, braking), 1);
  near(advanceSpeed(0, 1, braking), 0);
});

test('flight input handles invalid components and sensitivity with finite independent fallback values', () => {
  for (const input of [undefined, null, {}, { pitch: NaN, steer: Infinity, twist: -Infinity }]) {
    const rate = tiltFlightRates(input);
    assert.ok(Object.values(rate).every(Number.isFinite));
    for (const value of Object.values(rate)) near(value, 0);
  }
  const partial = tiltFlightRates({ pitch: NaN, steer: 14, twist: 8.5 });
  near(partial.pitchRate, 0);
  near(partial.bankAngle, rad(20));
  near(partial.acceleration, 0);
  for (const gain of [NaN, Infinity, -Infinity]) {
    near(tiltFlightRates({ pitch: 14 }, gain).pitchRate, 0.325);
  }
  assert.ok(Object.values(tiltFlightRates({ pitch: Number.MAX_VALUE, steer: -Number.MAX_VALUE,
    twist: Number.MAX_VALUE })).every(Number.isFinite));
});

test('exploration throttle reaches both maxima at 12 degrees with graded response above 3-degree neutral', () => {
  near(controlRates({ pitch: -12 }).acceleration, 3.5);
  near(controlRates({ pitch: 12 }).brake, 6.5);
  for (const [angle, fraction] of [[3, 0], [5.25, 0.25], [7.5, 0.5], [9.75, 0.75], [12, 1]]) {
    const accelerating = controlRates({ pitch: -angle });
    const braking = controlRates({ pitch: angle });
    near(accelerating.acceleration, 3.5 * fraction);
    near(accelerating.brake, 0);
    near(braking.acceleration, 0);
    near(braking.brake, 6.5 * fraction);
  }
  for (const angle of [-3, -2, 0, 2, 3]) {
    near(controlRates({ pitch: angle }).acceleration, 0);
    near(controlRates({ pitch: angle }).brake, 0);
  }
  near(controlRates({ pitch: -30 }).acceleration, 3.5);
  near(controlRates({ pitch: 30 }).brake, 6.5);
});

test('flight tilt steering leaves engine output unchanged across the former twist throttle range', () => {
  near(tiltFlightRates({ twist: 12 }).acceleration, 0);
  near(tiltFlightRates({ twist: -12 }).brake, 0);
  for (const [angle, fraction] of [[5, 0], [6.75, 0.25], [8.5, 0.5], [10.25, 0.75], [12, 1]]) {
    const accelerating = tiltFlightRates({ twist: angle });
    const braking = tiltFlightRates({ twist: -angle });
    near(accelerating.acceleration, 0);
    near(accelerating.brake, 0);
    near(braking.acceleration, 0);
    near(braking.brake, 0);
  }
  for (const angle of [-5, -4, 0, 4, 5]) {
    near(tiltFlightRates({ twist: angle }).acceleration, 0);
    near(tiltFlightRates({ twist: angle }).brake, 0);
  }
  near(tiltFlightRates({ twist: 30 }).acceleration, 0);
  near(tiltFlightRates({ twist: -30 }).brake, 0);
});

test('exploration returning from maximum throttle to neutral preserves speed until the opposite deadzone is crossed', () => {
  for (const mode of [
    { rates: (angle) => controlRates({ pitch: angle }), returnPath: [-12, -9, -6, -3, 0, 2, 3], reverse: 4 },
  ]) {
    let speed = 2;
    for (const angle of mode.returnPath) {
      const rate = mode.rates(angle);
      near(rate.brake, 0);
      const nextSpeed = advanceSpeed(speed, 0.05, rate);
      assert.ok(nextSpeed >= speed, `${angle} degrees must not slow the craft while returning to neutral`);
      speed = nextSpeed;
    }
    near(advanceSpeed(speed, 1, mode.rates(0)), speed);
    const braking = mode.rates(mode.reverse);
    assert.ok(braking.brake > 0);
    assert.ok(advanceSpeed(speed, 0.05, braking) < speed);
  }
});

test('shorter throttle range does not change exploration steering or flight pitch and bank ranges', () => {
  const explore = controlRates({ pitch: -7.5, steer: 14, twist: 18.5 });
  near(explore.acceleration, 1.75);
  near(explore.yawRate, 0.4);
  near(explore.pitchRate, 0.325);
  const flight = tiltFlightRates({ pitch: 14, steer: 14, twist: 8.5 });
  near(flight.acceleration, 0);
  near(flight.pitchRate, 0.325);
  near(flight.bankAngle, rad(20));
  near(controlRates({ steer: 25 }).yawRate, 0.8);
  near(controlRates({ twist: 32 }).pitchRate, 0.65);
  near(tiltFlightRates({ pitch: 25 }).pitchRate, 0.65);
  near(tiltFlightRates({ steer: 25 }).bankAngle, rad(40));
  assert.ok(controlRates({ steer: 12 }).yawRate < 0.8);
  assert.ok(controlRates({ twist: 12 }).pitchRate < 0.65);
  assert.ok(tiltFlightRates({ pitch: 12 }).pitchRate < 0.65);
  assert.ok(tiltFlightRates({ steer: 12 }).bankAngle < rad(40));
});

test('device input keeps phone-top pitch after a quarter turn where craft-based input becomes steer', () => {
  const reference = new Quaternion();
  const current = composeDevicePose({ pitch: 20, twist: 90 });
  const oldCraftBased = projectedTiltAngles(compensationQuaternion(reference, current));
  near(oldCraftBased.pitch, 0);
  near(oldCraftBased.steer, -20);
  const device = deviceTiltAngles(reference, current);
  assert.equal(device.valid, true);
  nearAngles(device, 20, 0, 90);
});

for (const [name, reference] of [
  ['flat neutral', new Quaternion()],
  ['arbitrary neutral', axisRotation(2, -3, 4, 137)],
  ['vertical world neutral', axisRotation(1, 0, 0, 90)],
]) {
  test(`${name}: phone edges retain pitch and steer after clockwise and counterclockwise turns`, () => {
    const referenceBefore = reference.toArray();
    for (const twist of [0, 90, -90, 179, -179]) {
      for (const angle of [-20, 20]) {
        const topTilt = reference.clone().multiply(composeDevicePose({ pitch: angle, twist }));
        const topBefore = topTilt.toArray();
        const top = deviceTiltAngles(reference, topTilt);
        assert.equal(top.valid, true);
        nearAngles(top, angle, 0, twist);
        assert.deepEqual(topTilt.toArray(), topBefore);
        const sideTilt = reference.clone().multiply(composeDevicePose({ steer: angle, twist }));
        const side = deviceTiltAngles(reference, sideTilt);
        assert.equal(side.valid, true);
        nearAngles(side, 0, angle, twist);
      }
      // Combined tilts are rotation vectors; their projected edge slopes must
      // stay the same through a turn even though they are not Euler angles.
      const bodyTilt = { pitch: 12, steer: -15 };
      const baseline = deviceTiltAngles(reference,
        reference.clone().multiply(composeDevicePose(bodyTilt)));
      const combined = deviceTiltAngles(reference,
        reference.clone().multiply(composeDevicePose({ ...bodyTilt, twist })));
      assert.equal(combined.valid, true);
      nearAngles(combined, baseline.pitch, baseline.steer, twist);
    }
    assert.deepEqual(reference.toArray(), referenceBefore);
  });
}

test('device input re-centers a nonidentity held pose independently of the original craft reference', () => {
  const craftReference = axisRotation(1, 2, 3, 78);
  const neutralReference = craftReference.clone().multiply(
    composeDevicePose({ pitch: 14, steer: -12, twist: 70 }));
  const oldNeutralInput = deviceTiltAngles(craftReference, neutralReference);
  assert.ok(Math.abs(oldNeutralInput.pitch) > 10);
  const centered = deviceTiltAngles(neutralReference, neutralReference);
  assert.equal(centered.valid, true);
  nearAngles(centered, 0, 0, 0);
  const current = neutralReference.clone().multiply(composeDevicePose({ pitch: 20, twist: -90 }));
  const device = deviceTiltAngles(neutralReference, current);
  assert.equal(device.valid, true);
  nearAngles(device, 20, 0, -90);
  const craftCompensation = compensationQuaternion(craftReference, current);
  assert.ok(Math.abs(craftCompensation.w) < 0.99);
});

test('device input ignores quaternion signs and safely normalizes scaled finite quaternions', () => {
  const reference = axisRotation(1, 2, -3, 143);
  const current = reference.clone().multiply(composeDevicePose({ pitch: 18, steer: -14, twist: 90 }));
  const expected = deviceTiltAngles(reference, current);
  const scaled = (q, scale) => ({ x: q.x * scale, y: q.y * scale, z: q.z * scale, w: q.w * scale });
  for (const referenceScale of [-1, 1, 1e-300, 1e300]) {
    for (const currentScale of [-1, 1, 1e-300, 1e300]) {
      const actual = deviceTiltAngles(scaled(reference, referenceScale), scaled(current, currentScale));
      assert.equal(actual.valid, true);
      nearAngles(actual, expected.pitch, expected.steer, expected.twist);
    }
  }
});

test('device input reports finite invalid neutral for missing, edge-on and back-facing poses', () => {
  const identity = new Quaternion();
  const invalid = { pitch: 0, steer: 0, twist: 0, valid: false };
  for (const q of [undefined, null, {}, { x: NaN, y: 0, z: 0, w: 1 },
    { x: Infinity, y: 0, z: 0, w: 1 }, { x: 0, y: 0, z: 0, w: 0 }]) {
    assert.deepEqual(deviceTiltAngles(identity, q), invalid);
    assert.deepEqual(deviceTiltAngles(q, identity), invalid);
  }
  for (const angle of [90, -90, 100, 180, 270]) {
    assert.deepEqual(deviceTiltAngles(identity, axisRotation(1, 0, 0, angle)), invalid);
    assert.deepEqual(deviceTiltAngles(identity, axisRotation(0, 1, 0, angle)), invalid);
  }
  const usable = axisRotation(1, 0, 0, MathUtils.radToDeg(Math.acos(0.081)));
  const unusable = axisRotation(1, 0, 0, MathUtils.radToDeg(Math.acos(0.079)));
  assert.equal(deviceTiltAngles(identity, usable).valid, true);
  assert.deepEqual(deviceTiltAngles(identity, unusable), invalid);
  // A half turn in the screen plane keeps its front facing the player.
  assert.equal(deviceTiltAngles(identity, composeDevicePose({ twist: 180 })).valid, true);
});

const turnFlightRates = (angles, sensitivity = 1) => flightRates(angles, sensitivity, 'twist', {maxSteerTilt:25,maxSteerTwist:32});

test('default flight steering lowers the hardware side and ignores in-plane rotation', () => {
  for (const steer of [-25, -14, 0, 14, 25]) {
    for (const twist of [-90, 0, 90]) {
      const angles = { pitch: 12, steer, twist };
      assert.deepEqual(flightRates(angles), flightRates(angles, 1, 'tilt'));
      assert.deepEqual(flightRates(angles, 1, 'invalid'), flightRates(angles, 1, 'tilt'));
    }
  }
  near(flightRates({ steer: 25, twist: -32 }).bankAngle, rad(40));
  near(flightRates({ steer: -25, twist: 32 }).bankAngle, rad(-40));
});

test('optional in-plane turning uses clockwise rotation with its own deadzone, response and maximum', () => {
  for (const twist of [-5, -3, 0, 3, 5]) near(turnFlightRates({ twist }).bankAngle, 0);
  assert.ok(turnFlightRates({ twist: 5.001 }).bankAngle > 0);
  assert.ok(turnFlightRates({ twist: -5.001 }).bankAngle < 0);
  near(turnFlightRates({ twist: 18.5 }).bankAngle, rad(20));
  near(turnFlightRates({ twist: -18.5 }).bankAngle, rad(-20));
  for (const twist of [32, 60, 90]) near(turnFlightRates({ twist }).bankAngle, rad(40));
  for (const twist of [-32, -60, -90]) near(turnFlightRates({ twist }).bankAngle, rad(-40));
  near(turnFlightRates({ pitch: 3, twist: 32 }).pitchRate, 0);
  near(turnFlightRates({ pitch: 14, twist: 32 }).pitchRate, 0.325);
  near(turnFlightRates({ pitch: 25, twist: 32 }).pitchRate, 0.65);
  near(turnFlightRates({ pitch: -25, twist: 32 }).pitchRate, -0.65);
});

test('flight twist and tilt steering are exclusive even when the other input commands the opposite side', () => {
  for (const sign of [-1, 1]) {
    const angles = { pitch: 14, steer: -sign * 25, twist: sign * 32 };
    const twist = turnFlightRates(angles);
    const explicitTwist = flightRates(angles, 1, 'twist', {maxSteerTwist:32});
    const tilt = flightRates(angles, 1, 'tilt');
    near(twist.bankAngle, sign * rad(40));
    near(tilt.bankAngle, -sign * rad(40));
    assert.deepEqual(twist, explicitTwist);
    near(twist.pitchRate, tilt.pitchRate);
    near(turnFlightRates({ steer: sign * 25 }).bankAngle, 0);
    near(flightRates({ twist: sign * 32 }, 1, 'tilt').bankAngle, 0);
    for (const rates of [twist, tilt]) {
      near(rates.acceleration, 0);
      near(rates.brake, 0);
      near(advanceSpeed(6, 1, rates), 6);
      assert.equal('throttle' in rates, false);
    }
  }
});

test('flight twist bank folds continuously to neutral at half and full turns', () => {
  for (const center of [-360, -180, 0, 180, 360]) {
    for (const epsilon of [-0.0001, 0, 0.0001]) near(turnFlightRates({ twist: center + epsilon }).bankAngle, 0);
  }
  for (const twist of [179, -179, 181, -181]) near(turnFlightRates({ twist }).bankAngle, 0);
  for (const [equivalent, original] of [[170, 10], [190, -10], [350, -10], [370, 10]]) {
    near(turnFlightRates({ twist: equivalent }).bankAngle, turnFlightRates({ twist: original }).bankAngle);
  }
  const beforeNeutral = turnFlightRates({ twist: 175 - 0.0001 }).bankAngle;
  const insideNeutral = turnFlightRates({ twist: 175 + 0.0001 }).bankAngle;
  assert.ok(beforeNeutral >= 0 && beforeNeutral < rad(0.001));
  near(insideNeutral, 0);
});

test('flight twist steering retains bounded sensitivity and independent finite fallbacks', () => {
  near(turnFlightRates({ twist: 18.5 }, 2).bankAngle, rad(40));
  near(turnFlightRates({ twist: 18.5 }, 0.5).bankAngle, rad(10));
  for (const gain of [0, -1]) {
    for (const rate of Object.values(turnFlightRates({ pitch: 25, steer: -25, twist: 32 }, gain))) near(rate, 0);
  }
  for (const gain of [NaN, Infinity, -Infinity]) near(turnFlightRates({ twist: 18.5 }, gain).bankAngle, rad(20));
  for (const input of [undefined, null, {}, { pitch: NaN, steer: Infinity, twist: -Infinity }]) {
    const rates = turnFlightRates(input);
    assert.ok(Object.values(rates).every(Number.isFinite));
    for (const rate of Object.values(rates)) near(rate, 0);
  }
  near(turnFlightRates({ pitch: 14, steer: -25, twist: NaN }).pitchRate, 0.325);
  near(turnFlightRates({ pitch: 14, steer: -25, twist: NaN }).bankAngle, 0);
  near(turnFlightRates({ pitch: NaN, steer: -25, twist: 18.5 }).pitchRate, 0);
  near(turnFlightRates({ pitch: NaN, steer: -25, twist: 18.5 }).bankAngle, rad(20));
  assert.ok(Object.values(turnFlightRates({ pitch: Number.MAX_VALUE, steer: -Number.MAX_VALUE,
    twist: Number.MAX_VALUE }, Number.MAX_VALUE)).every(Number.isFinite));
});

// v0.1.13: independent input mapping, device settings, and comparison records.
import { flightPitchTarget, followFlightPitch, flightCommands } from '../src/flight-input.js';
import { DEFAULT_FLIGHT_SETTINGS, FLIGHT_SETTING_FIELDS, FLIGHT_SETTINGS_KEY, normalizeFlightSettings, loadFlightSettings, saveFlightSettings } from '../src/flight-settings.js';
import { createFlightSession, flightReport, copyableFlightReport } from '../src/flight-session.js';

test('angle pitch maps the physical deadzone, both signs and saturation linearly', () => {
  for (const angle of [-3, 0, 3, NaN, Infinity, undefined]) near(flightPitchTarget(angle), 0);
  near(flightPitchTarget(14), 7.5 * Math.PI / 180);
  near(flightPitchTarget(-14), -7.5 * Math.PI / 180);
  near(flightPitchTarget(25), 15 * Math.PI / 180);
  near(flightPitchTarget(-100), -15 * Math.PI / 180);
  near(flightPitchTarget(10, { deadzone: 0, maxTilt: 10, maxPitch: 35 }), 35 * Math.PI / 180);
});

test('angle following converges without overshoot or exceeding the former rotation limit', () => {
  for (const dt of [.001, 1/60, .05, 1]) for (const sign of [-1, 1]) {
    let current = -sign * .8, target = sign * .25;
    for (let i=0;i<500;i++) {
      const before = Math.abs(target-current);
      const rate = followFlightPitch(current, target, dt, .3);
      assert.ok(Math.abs(rate) <= CONTROL_LIMITS.pitchRate);
      current += rate*dt;
      assert.ok(Math.abs(target-current) <= before+1e-10);
    }
  }
  for(const value of [-1,0,NaN,Infinity]) near(followFlightPitch(0,.2,value),0);
  near(followFlightPitch(NaN,0,.02),0);
  // Returning from the old mode's inverted pitch uses the shortest rotation.
  assert.ok(followFlightPitch(3,0,.05)<0);
  assert.ok(followFlightPitch(-3,0,.05)>0);
});

test('angle following time constant controls the measured response', () => {
  const dt=.01, target=.1;
  let current=0;
  for(let i=0;i<30;i++) current+=followFlightPitch(current,target,dt,.3)*dt;
  near(current, target*(1-Math.exp(-1)));
  assert.ok(followFlightPitch(0,target,dt,.1)>followFlightPitch(0,target,dt,1));
});

test('rate comparison with default settings matches all former flight rates exactly', () => {
  for (const steering of ['tilt','twist']) for(const pitch of [-100,-25,-14,-3,0,3,14,25,100,NaN]) {
    const angles={pitch,steer:14,twist:-18};
    assert.deepEqual(flightCommands(angles,{pitchMode:'rate',steering}),flightRates(angles,1,steering));
  }
  const angled=flightCommands({pitch:25,steer:25},{dt:.05});
  assert.ok(angled.pitchTarget>0 && angled.pitchRate>0);
  near(flightCommands({pitch:0},{dt:.05,currentPitch:.2}).pitchTarget,0);
  assert.ok(flightCommands({pitch:0},{dt:.05,currentPitch:.2}).pitchRate<0);
});

test('settings normalize unknown, corrupt, and out-of-range input without impossible deadzones', () => {
  for(const value of [null,undefined,[],{},'bad',{deadzone:NaN,maxTilt:Infinity}]) assert.deepEqual(normalizeFlightSettings(value),DEFAULT_FLIGHT_SETTINGS);
  for(const key of Object.keys(FLIGHT_SETTING_FIELDS)) {
    const field=FLIGHT_SETTING_FIELDS[key];
    if(typeof field.initial==='boolean'){assert.equal(normalizeFlightSettings({[key]:false})[key],false);assert.equal(normalizeFlightSettings({[key]:123})[key],true);continue;}
    near(normalizeFlightSettings({[key]:-100})[key],field.min);
    near(normalizeFlightSettings({[key]:field.max+100})[key],field.max);
  }
  assert.ok(normalizeFlightSettings({deadzone:100,maxTilt:-1}).deadzone < normalizeFlightSettings({deadzone:100,maxTilt:-1}).maxTilt);
  const commands=flightCommands({pitch:10,steer:10},{settings:{deadzone:0,maxTilt:10,maxSteerTilt:10,steerTiltDeadzone:0,maxBank:20},dt:.05});
  near(commands.bankAngle,20*Math.PI/180);
});

test('settings save and reload locally with defaults after denied or corrupt storage', () => {
  let stored=null;
  const storage={getItem:key=>{assert.equal(key,FLIGHT_SETTINGS_KEY);return stored;},setItem:(key,value)=>{assert.equal(key,FLIGHT_SETTINGS_KEY);stored=value;}};
  assert.deepEqual(loadFlightSettings(storage),DEFAULT_FLIGHT_SETTINGS);
  assert.equal(saveFlightSettings(storage,{maxPitch:25}),true);
  near(loadFlightSettings(storage).maxPitch,25);
  stored='{broken'; assert.deepEqual(loadFlightSettings(storage),DEFAULT_FLIGHT_SETTINGS);
  const denied={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}};
  assert.deepEqual(loadFlightSettings(denied),DEFAULT_FLIGHT_SETTINGS);
  assert.equal(saveFlightSettings(denied,DEFAULT_FLIGHT_SETTINGS),false);
  assert.deepEqual(loadFlightSettings(undefined),DEFAULT_FLIGHT_SETTINGS);
});

test('flight records retain contacts across legs, ignore invalid time and can start a new challenge', () => {
  const session=createFlightSession();
  session.advance(.05,{recoveryAssist:.2,grounded:false});
  session.advance(.05,{recoveryAssist:0,grounded:true});
  session.advance(.05,{recoveryAssist:0,grounded:true});
  for(const dt of [0,-1,NaN,Infinity]) session.advance(dt,{grounded:true});
  near(session.snapshot().elapsedSeconds,.15);
  assert.equal(session.snapshot().groundContacts,1); near(session.snapshot().recoverySeconds,.05);
  session.restartLeg(); session.advance(.05,{grounded:true});
  assert.equal(session.snapshot().groundContacts,2);
  session.reset(); assert.deepEqual(session.snapshot(),{elapsedSeconds:0,groundContacts:0,recoverySeconds:0,legs:0});
});

test('settings and result reports share a single-line format and snapshot their values', () => {
  const settings={...DEFAULT_FLIGHT_SETTINGS},stats={elapsedSeconds:1,groundContacts:2,recoverySeconds:.5};
  const result=flightReport({version:'0.1.13',pitch:'angle',steer:'tilt',settings,stats});
  const text=copyableFlightReport(result);
  assert.equal(text.includes('\n'),false);
  assert.deepEqual(JSON.parse(text),result);
  settings.maxPitch=30;stats.groundContacts=100;
  assert.equal(result.settings.maxPitch,15);assert.equal(result.stats.groundContacts,2);
  const config=flightReport({version:'0.1.13',pitch:'rate',steer:'twist',settings});
  assert.equal('stats' in config,false);
});


test('flight record counts weak active assistance even below the HUD label threshold', () => {
  const session=createFlightSession();
  session.advance(.02,{recoveryAssist:.001,grounded:false});
  near(session.snapshot().recoverySeconds,.02);
  session.advance(.02,{recoveryAssist:0,grounded:false});
  near(session.snapshot().recoverySeconds,.02);
});

test('comparison reports identify outcome, display and rate-only inactive settings',()=>{
  const mid=flightReport({version:'0.1.14',pitch:'rate',steer:'twist',display:'fixed'});
  assert.equal('result' in mid,false);assert.equal(mid.display,'fixed');
  assert.deepEqual(mid.inactiveSettings,['maxPitch','timeConstant','chaseTimeConstant','maxSteerTilt','steerTiltDeadzone','ladderRange','cockpitFov']);
  for(const result of ['clear','grounded']) {
    const report=flightReport({version:'0.1.14',pitch:'angle',steer:'tilt',display:'bank',result});
    assert.equal(report.result,result);assert.equal(JSON.parse(copyableFlightReport(report)).display,'bank');
    assert.deepEqual(report.inactiveSettings,['displayTimeConstant','chaseTimeConstant','maxSteerTwist','steerTwistDeadzone','ladderRange','cockpitFov']);
  }
});

test('last leg separates crash/retry/clear while pauses keep the same leg and total',()=>{
 const session=createFlightSession();session.start();session.advance(2,{recoveryAssist:.1,grounded:true});
 assert.deepEqual(session.snapshot(),{elapsedSeconds:2,groundContacts:1,recoverySeconds:2,legs:1});
 const crash=session.lastLegSnapshot();session.start();assert.deepEqual(session.lastLegSnapshot(),crash);
 session.restartLeg();session.start();session.advance(3,{recoveryAssist:0,grounded:false});
 assert.deepEqual(session.snapshot(),{elapsedSeconds:5,groundContacts:1,recoverySeconds:2,legs:2});
 assert.deepEqual(session.lastLegSnapshot(),{elapsedSeconds:3,groundContacts:0,recoverySeconds:0});
 const report=flightReport({version:'0.1.15',pitch:'angle',steer:'tilt',stats:session.snapshot(),lastLeg:session.lastLegSnapshot(),result:'clear'});
 session.advance(1,{recoveryAssist:0,grounded:false});assert.equal(report.lastLeg.elapsedSeconds,3);
 session.reset();assert.equal(session.snapshot().legs,0);
});

test('steering maxima are independent of pitch and curve one retains a linear demand',()=>{
 for(const sign of [-1,1]){
  const input={pitch:sign*15,steer:sign*15,twist:sign*20};
  near(flightCommands(input,{settings:{maxSteerTilt:15},pitchMode:'rate'}).bankAngle,sign*rad(40));
  near(flightPitchTarget(sign*15),sign*rad(15)*(15-3)/(25-3));
  near(flightRates({twist:sign*12},1,'twist',{maxSteerTwist:12}).bankAngle,sign*rad(40));
 }
 for(const steering of ['tilt','twist']){
  const deadzone=steering==='tilt'?3:5,maximum=steering==='tilt'?15:20,key=steering==='tilt'?'steer':'twist';
  for(const amount of [0,.1,.5,1]){
   const input={[key]:deadzone+(maximum-deadzone)*amount};
   near(flightRates(input,1,steering,{steerCurve:1}).bankAngle,rad(40)*amount);
   near(flightRates(input,1,steering,{steerCurve:2}).bankAngle,rad(40)*amount**2);
  }
 }
 const old=loadFlightSettings({getItem:()=>JSON.stringify({deadzone:2,maxTilt:27,maxPitch:19})});
 near(old.maxTilt,27);near(old.maxSteerTilt,15);near(old.maxSteerTwist,20);near(old.steerCurve,1);near(old.steerTiltDeadzone,3);near(old.steerTwistDeadzone,5);
 for(const steering of ['tilt','twist']){
  const r=flightReport({pitch:'angle',steer:steering});
  assert.ok(r.inactiveSettings.includes(steering==='tilt'?'maxSteerTwist':'maxSteerTilt'));
  assert.ok(!r.inactiveSettings.includes(steering==='tilt'?'maxSteerTilt':'maxSteerTwist'));
 }
 const limited=normalizeFlightSettings({maxSteerTilt:5,steerTiltDeadzone:8,maxSteerTwist:8,steerTwistDeadzone:8});
 assert.ok(limited.steerTiltDeadzone<limited.maxSteerTilt&&limited.steerTwistDeadzone<limited.maxSteerTwist);
});
