import { Euler, MathUtils, Quaternion, Vector3 } from 'three';

export const CONTROL_LIMITS = Object.freeze({
  tiltDeadzone: 3,
  tiltMaximum: 25,
  twistDeadzone: 5,
  twistMaximum: 32,
  throttleMaximum: 12,
  pitchRate: 0.65,
  yawRate: 0.8,
  speed: 10,
  acceleration: 3.5,
  brake: 6.5,
  flightBankAngle: MathUtils.degToRad(40),
});

const Z_AXIS = new Vector3(0, 0, 1);
const EPSILON = 1e-12;
const neutral = () => ({ pitch: 0, steer: 0, twist: 0 });
function normalizedQuaternion(q) {
  if (!q || ![q.x, q.y, q.z, q.w].every(Number.isFinite)) return null;
  const scale = Math.max(Math.abs(q.x), Math.abs(q.y), Math.abs(q.z), Math.abs(q.w));
  if (scale === 0) return null;
  return new Quaternion(q.x / scale, q.y / scale, q.z / scale, q.w / scale).normalize();
}

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
 * give pitch/steer. Thus adding tilt to a held twist retains the pitch command.
 * Clockwise twist as seen by the player is negative right-hand rotation.
 *
 * Rotations do not commute, so this is a deliberate decomposition convention,
 * not three independent Euler differences. A 180-degree screen flip makes
 * twist undefined; return neutral there. Normal control is within 25 degrees.
 */
export function relativeAngles(referenceQuaternion, currentQuaternion) {
  const reference = normalizedQuaternion(referenceQuaternion);
  const current = normalizedQuaternion(currentQuaternion);
  if (!reference || !current) return neutral();
  const relative = reference.invert().multiply(current).normalize();
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

/** Cancel the phone's rotation: current * compensation = reference. */
export function compensationQuaternion(referenceQuaternion, currentQuaternion) {
  const reference = normalizedQuaternion(referenceQuaternion);
  const current = normalizedQuaternion(currentQuaternion);
  if (!reference || !current) return new Quaternion();
  return current.invert().multiply(reference).normalize();
}

/**
 * Measure the screen plane's slope along the craft's visible nose and right.
 * Drawing and input may have separate references after the user re-centers:
 * craftCompensation locates the nose, neutralCompensation locates neutral up.
 * At edge-on/back-facing poses those directions become ambiguous, so report a
 * finite neutral result; the caller must stop and request a usable holding pose.
 */
export function projectedTiltAngles(craftCompensation, neutralCompensation = craftCompensation) {
  const craft = normalizedQuaternion(craftCompensation);
  const neutralPose = normalizedQuaternion(neutralCompensation);
  const invalid = () => ({ pitch: 0, steer: 0, valid: false });
  if (!craft || !neutralPose) return invalid();
  const nose = new Vector3(0, 1, 0).applyQuaternion(craft);
  const noseLength = Math.hypot(nose.x, nose.y);
  const normal = new Vector3(0, 0, 1).applyQuaternion(neutralPose);
  if (noseLength < 1e-4 || normal.z <= 0.08) return invalid();
  nose.set(nose.x / noseLength, nose.y / noseLength, 0);
  const right = new Vector3(nose.y, -nose.x, 0);
  return {
    pitch: MathUtils.radToDeg(Math.atan2(normal.dot(nose), normal.z)),
    steer: -MathUtils.radToDeg(Math.atan2(normal.dot(right), normal.z)),
    valid: true,
  };
}

/** Practice input: turn clockwise, then tilt around the device's own X/Y axes. */
export function composeDevicePose(angles) {
  const pitch = Number.isFinite(angles?.pitch) ? MathUtils.degToRad(angles.pitch) : 0;
  const steer = Number.isFinite(angles?.steer) ? MathUtils.degToRad(angles.steer) : 0;
  const twist = Number.isFinite(angles?.twist) ? MathUtils.degToRad(angles.twist) : 0;
  const tiltAngle = Math.hypot(pitch, steer);
  const tilt = tiltAngle > 0
    ? new Quaternion().setFromAxisAngle(new Vector3(pitch / tiltAngle, steer / tiltAngle, 0), tiltAngle)
    : new Quaternion();
  return new Quaternion().setFromAxisAngle(Z_AXIS, -twist).multiply(tilt).normalize();
}

function angleDemand(angle, sensitivity, deadzone, maximum) {
  if (!Number.isFinite(angle)) return 0;
  const magnitude = MathUtils.clamp(
    (Math.abs(angle) - deadzone) / (maximum - deadzone) * sensitivity,
    0, 1,
  );
  return Math.sign(angle) * magnitude;
}

function foldedTwist(angle) {
  return Number.isFinite(angle)
    ? MathUtils.radToDeg(Math.asin(Math.sin(MathUtils.degToRad(angle))))
    : 0;
}

/** Sensitivity scales response after each physical deadzone; maxima stay fixed. */
export function controlRates(angles, sensitivity = 1) {
  const gain = Number.isFinite(sensitivity) ? Math.max(0, sensitivity) : 1;
  const foreAft = angleDemand(angles?.pitch, gain,
    CONTROL_LIMITS.tiltDeadzone, CONTROL_LIMITS.throttleMaximum);
  // Folding the angle avoids the shortest-angle sign jump at a half turn.
  // Small twists retain their exact response; half/full turns return neutral.
  const twist = foldedTwist(angles?.twist);
  return {
    pitchRate: angleDemand(twist, gain,
      CONTROL_LIMITS.twistDeadzone, CONTROL_LIMITS.twistMaximum) * CONTROL_LIMITS.pitchRate,
    yawRate: angleDemand(angles?.steer, gain,
      CONTROL_LIMITS.tiltDeadzone, CONTROL_LIMITS.tiltMaximum) * CONTROL_LIMITS.yawRate,
    acceleration: Math.max(0, -foreAft) * CONTROL_LIMITS.acceleration,
    brake: Math.max(0, foreAft) * CONTROL_LIMITS.brake,
  };
}

/** Flight mode: lift the visible nose to climb, lower a wing to bank, twist for speed. */
export function flightRates(angles, sensitivity = 1) {
  const gain = Number.isFinite(sensitivity) ? Math.max(0, sensitivity) : 1;
  const throttle = angleDemand(foldedTwist(angles?.twist), gain,
    CONTROL_LIMITS.twistDeadzone, CONTROL_LIMITS.throttleMaximum);
  return {
    pitchRate: angleDemand(angles?.pitch, gain,
      CONTROL_LIMITS.tiltDeadzone, CONTROL_LIMITS.tiltMaximum) * CONTROL_LIMITS.pitchRate,
    bankAngle: angleDemand(angles?.steer, gain,
      CONTROL_LIMITS.tiltDeadzone, CONTROL_LIMITS.tiltMaximum) * CONTROL_LIMITS.flightBankAngle,
    acceleration: Math.max(0, throttle) * CONTROL_LIMITS.acceleration,
    brake: Math.max(0, -throttle) * CONTROL_LIMITS.brake,
  };
}

function boundedNonnegative(value, maximum) {
  return Number.isFinite(value) ? MathUtils.clamp(value, 0, maximum) : 0;
}

/**
 * Integrate seconds; neutral preserves speed and braking never reverses it.
 * Finite positive dt is used in full, with the result saturated to 0..10 m/s.
 * The animation loop must cap dt at .05 s to avoid jumps after a delayed frame.
 * Nonfinite/negative time is ignored; nonfinite state/rates become zero.
 */
export function advanceSpeed(currentSpeed, dt, rates) {
  const speed = boundedNonnegative(currentSpeed, CONTROL_LIMITS.speed);
  const seconds = Number.isFinite(dt) ? Math.max(0, dt) : 0;
  const acceleration = boundedNonnegative(rates?.acceleration, CONTROL_LIMITS.acceleration);
  const brake = boundedNonnegative(rates?.brake, CONTROL_LIMITS.brake);
  return MathUtils.clamp(speed + (acceleration - brake) * seconds, 0, CONTROL_LIMITS.speed);
}
