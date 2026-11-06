import assert from 'node:assert/strict';
import test from 'node:test';
import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import {
  advanceSpeed, compensationQuaternion, composeDevicePose, controlRates, flightRates, orientationQuaternion,
  projectedTiltAngles, relativeAngles,
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

test('flight mode maps pitch and bank independently while twist cannot change output', () => {
  for (const value of Object.values(flightRates({ pitch: 0, steer: 0, twist: 0 }))) near(value, 0);
  const climb = flightRates({ pitch: 25 });
  near(climb.pitchRate, 0.65);
  near(climb.bankAngle, 0);
  near(climb.acceleration, 0);
  near(climb.brake, 0);
  near(flightRates({ pitch: -25 }).pitchRate, -0.65);
  near(flightRates({ steer: 25 }).bankAngle, rad(40));
  near(flightRates({ steer: -25 }).bankAngle, rad(-40));
  near(flightRates({ twist: 12 }).acceleration, 0);
  near(flightRates({ twist: 12 }).brake, 0);
  near(flightRates({ twist: -12 }).acceleration, 0);
  near(flightRates({ twist: -12 }).brake, 0);
});

test('flight mode combines climb and bank without a simultaneous twist changing output', () => {
  const climbingRight = flightRates({ pitch: 14, steer: 14, twist: 8.5 });
  near(climbingRight.pitchRate, 0.325);
  near(climbingRight.bankAngle, rad(20));
  near(climbingRight.acceleration, 0);
  near(climbingRight.brake, 0);
  const descendingLeft = flightRates({ pitch: -14, steer: -14, twist: -8.5 });
  near(descendingLeft.pitchRate, -0.325);
  near(descendingLeft.bankAngle, rad(-20));
  near(descendingLeft.acceleration, 0);
  near(descendingLeft.brake, 0);
});

test('flight mode keeps deadzones and fixed maxima while sensitivity scales the response', () => {
  for (const value of Object.values(flightRates({ pitch: 3, steer: -3, twist: 5 }))) near(value, 0);
  assert.ok(flightRates({ pitch: 3.001 }).pitchRate > 0);
  assert.ok(flightRates({ steer: -3.001 }).bankAngle < 0);
  near(flightRates({ twist: 5.001 }).acceleration, 0);
  const sensitive = flightRates({ pitch: 14, steer: 14, twist: 8.5 }, 2);
  near(sensitive.pitchRate, 0.65);
  near(sensitive.bankAngle, rad(40));
  near(sensitive.acceleration, 0);
  const gentle = flightRates({ pitch: 14, steer: 14, twist: -8.5 }, 0.5);
  near(gentle.pitchRate, 0.1625);
  near(gentle.bankAngle, rad(10));
  near(gentle.brake, 0);
  for (const gain of [0, -1]) {
    for (const value of Object.values(flightRates({ pitch: 25, steer: 25, twist: 32 }, gain))) near(value, 0);
  }
  for (const gain of [1, 2, Number.MAX_VALUE]) {
    const saturated = flightRates({ pitch: 100, steer: -100, twist: 90 }, gain);
    near(saturated.pitchRate, 0.65);
    near(saturated.bankAngle, rad(-40));
    near(saturated.acceleration, 0);
  }
});

test('flight twist stays inactive at small angles, half turns, and full turns', () => {
  for (const center of [-360, -180, 0, 180, 360]) {
    for (const epsilon of [-0.0001, 0, 0.0001]) {
      const rate = flightRates({ twist: center + epsilon });
      near(rate.acceleration, 0);
      near(rate.brake, 0);
    }
  }
  near(flightRates({ twist: 10 }).acceleration, 0);
  near(flightRates({ twist: -10 }).brake, 0);
  for (const [equivalent, original] of [[170, 10], [190, -10], [350, -10], [370, 10]]) {
    near(flightRates({ twist: equivalent }).acceleration, flightRates({ twist: original }).acceleration);
    near(flightRates({ twist: equivalent }).brake, flightRates({ twist: original }).brake);
  }
  for (const twist of [179, 181]) {
    near(flightRates({ twist }).acceleration, 0);
    near(flightRates({ twist }).brake, 0);
  }
});

test('flight rate commands leave speed integration to the engine and physical model', () => {
  const accelerating = flightRates({ twist: 8.5 });
  const braking = flightRates({ twist: -8.5 });
  near(advanceSpeed(6, 1, accelerating), 6);
  near(advanceSpeed(7.75, 10, flightRates({ pitch: 25, steer: 25, twist: 0 })), 7.75);
  near(advanceSpeed(7.75, 1, braking), 7.75);
  near(advanceSpeed(9, 1, accelerating), 9);
  near(advanceSpeed(1, 1, braking), 1);
  near(advanceSpeed(0, 1, braking), 0);
});

test('flight input handles invalid components and sensitivity with finite independent fallback values', () => {
  for (const input of [undefined, null, {}, { pitch: NaN, steer: Infinity, twist: -Infinity }]) {
    const rate = flightRates(input);
    assert.ok(Object.values(rate).every(Number.isFinite));
    for (const value of Object.values(rate)) near(value, 0);
  }
  const partial = flightRates({ pitch: NaN, steer: 14, twist: 8.5 });
  near(partial.pitchRate, 0);
  near(partial.bankAngle, rad(20));
  near(partial.acceleration, 0);
  for (const gain of [NaN, Infinity, -Infinity]) {
    near(flightRates({ pitch: 14 }, gain).pitchRate, 0.325);
  }
  assert.ok(Object.values(flightRates({ pitch: Number.MAX_VALUE, steer: -Number.MAX_VALUE,
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

test('flight twist is inactive across the former 12-degree throttle range', () => {
  near(flightRates({ twist: 12 }).acceleration, 0);
  near(flightRates({ twist: -12 }).brake, 0);
  for (const [angle, fraction] of [[5, 0], [6.75, 0.25], [8.5, 0.5], [10.25, 0.75], [12, 1]]) {
    const accelerating = flightRates({ twist: angle });
    const braking = flightRates({ twist: -angle });
    near(accelerating.acceleration, 0);
    near(accelerating.brake, 0);
    near(braking.acceleration, 0);
    near(braking.brake, 0);
  }
  for (const angle of [-5, -4, 0, 4, 5]) {
    near(flightRates({ twist: angle }).acceleration, 0);
    near(flightRates({ twist: angle }).brake, 0);
  }
  near(flightRates({ twist: 30 }).acceleration, 0);
  near(flightRates({ twist: -30 }).brake, 0);
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
  const flight = flightRates({ pitch: 14, steer: 14, twist: 8.5 });
  near(flight.acceleration, 0);
  near(flight.pitchRate, 0.325);
  near(flight.bankAngle, rad(20));
  near(controlRates({ steer: 25 }).yawRate, 0.8);
  near(controlRates({ twist: 32 }).pitchRate, 0.65);
  near(flightRates({ pitch: 25 }).pitchRate, 0.65);
  near(flightRates({ steer: 25 }).bankAngle, rad(40));
  assert.ok(controlRates({ steer: 12 }).yawRate < 0.8);
  assert.ok(controlRates({ twist: 12 }).pitchRate < 0.65);
  assert.ok(flightRates({ pitch: 12 }).pitchRate < 0.65);
  assert.ok(flightRates({ steer: 12 }).bankAngle < rad(40));
});
