import { Euler, MathUtils, Quaternion, Vector3 } from 'three';

export const CONTROL_LIMITS = Object.freeze({
  tiltDeadzone: 3,
  tiltMaximum: 25,
  twistDeadzone: 5,
  twistMaximum: 32,
  pitchRate: 0.65,
  yawRate: 0.8,
  speed: 10,
});

const Z_AXIS = new Vector3(0, 0, 1);
const EPSILON = 1e-12;
const neutral = () => ({ pitch: 0, steer: 0, twist: 0 });
const isFiniteQuaternion = (q) => q && [q.x, q.y, q.z, q.w].every(Number.isFinite)
  && q.lengthSq() > EPSILON;

/**
 * World-from-display rotation. DeviceOrientation uses intrinsic Z-X'-Y'';
 * its values must never be subtracted directly to obtain calibrated motion.
 * Screen angle is the browser's screen.orientation.angle in degrees.
 */
export function orientationQuaternion(sample, screenAngle = 0) {
  if (!sample || ![sample.alpha, sample.beta, sample.gamma, screenAngle].every(Number.isFinite)) {
    return null;
  }
  const device = new Quaternion().setFromEuler(new Euler(
    MathUtils.degToRad(sample.beta),
    MathUtils.degToRad(sample.gamma),
    MathUtils.degToRad(sample.alpha),
    'ZXY',
  ));
  return device.multiply(new Quaternion().setFromAxisAngle(
    Z_AXIS, -MathUtils.degToRad(screenAngle),
  )).normalize();
}

/**
 * Motion in the calibrated display's coordinates, independent of start pose.
 * Decompose relative = tilt * twist. Twist is about the initial screen normal;
 * tilt has an axis in the initial screen plane. Its rotation-vector x/y values
 * give pitch/steer. Thus adding tilt to a held twist retains the throttle.
 * Clockwise twist as seen by the player is negative right-hand rotation.
 *
 * Rotations do not commute, so this is a deliberate decomposition convention,
 * not three independent Euler differences. A 180-degree screen flip makes
 * twist undefined; return neutral there. Normal control is within 25 degrees.
 */
export function relativeAngles(referenceQuaternion, currentQuaternion) {
  if (!isFiniteQuaternion(referenceQuaternion) || !isFiniteQuaternion(currentQuaternion)) {
    return neutral();
  }
  const relative = referenceQuaternion.clone().normalize().invert()
    .multiply(currentQuaternion.clone().normalize()).normalize();
  // q and -q describe the same pose. Use the shortest representation.
  if (relative.w < 0) {
    relative.set(-relative.x, -relative.y, -relative.z, -relative.w);
  }
  const twistLength = Math.hypot(relative.z, relative.w);
  if (twistLength < EPSILON) return neutral();
  const twist = new Quaternion(0, 0, relative.z / twistLength, relative.w / twistLength);
  const tilt = relative.clone().multiply(twist.clone().invert()).normalize();
  const planarLength = Math.hypot(tilt.x, tilt.y);
  const tiltScale = planarLength > EPSILON
    ? 2 * Math.atan2(planarLength, Math.max(0, tilt.w)) / planarLength
    : 0;
  return {
    pitch: MathUtils.radToDeg(tilt.x * tiltScale),
    steer: MathUtils.radToDeg(tilt.y * tiltScale),
    twist: -MathUtils.radToDeg(2 * Math.atan2(twist.z, twist.w)),
  };
}

function tiltDemand(angle, sensitivity) {
  if (!Number.isFinite(angle)) return 0;
  const magnitude = MathUtils.clamp(
    (Math.abs(angle) - CONTROL_LIMITS.tiltDeadzone)
      / (CONTROL_LIMITS.tiltMaximum - CONTROL_LIMITS.tiltDeadzone) * sensitivity,
    0, 1,
  );
  return Math.sign(angle) * magnitude;
}

/** Tilt sensitivity scales response after the physical deadzone; speed is fixed. */
export function controlRates(angles, sensitivity = 1) {
  const gain = Number.isFinite(sensitivity) ? Math.max(0, sensitivity) : 1;
  const twist = Number.isFinite(angles?.twist) ? angles.twist : 0;
  return {
    pitchRate: tiltDemand(angles?.pitch, gain) * CONTROL_LIMITS.pitchRate,
    yawRate: tiltDemand(angles?.steer, gain) * CONTROL_LIMITS.yawRate,
    speed: MathUtils.clamp(
      (twist - CONTROL_LIMITS.twistDeadzone)
        / (CONTROL_LIMITS.twistMaximum - CONTROL_LIMITS.twistDeadzone),
      0, 1,
    ) * CONTROL_LIMITS.speed,
  };
}
