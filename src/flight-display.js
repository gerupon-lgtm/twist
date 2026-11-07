import { Quaternion, Vector3 } from 'three';

const Z = new Vector3(0, 0, 1), X = new Vector3(1, 0, 0), Y = new Vector3(0, 1, 0);
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
export const wrapDisplayAngle = value => Math.atan2(Math.sin(finite(value)), Math.cos(finite(value)));

/** Smooth hardware twist only. Layout compensation is applied separately, immediately. */
export function advanceDisplayRoll(current, target, dt, timeConstant = .05) {
  const previous = wrapDisplayAngle(current), goal = wrapDisplayAngle(target);
  const tau = Math.max(0, Math.min(.3, finite(timeConstant, .05)));
  if (tau === 0) return goal;
  if (!Number.isFinite(dt) || dt <= 0) return previous;
  return wrapDisplayAngle(previous + wrapDisplayAngle(goal - previous) * -Math.expm1(-dt / tau));
}

/** Camera rolls clockwise for a clockwise phone turn; its inverse draws the scene CCW. */
export function flightDisplayPose({ display = 'bank', bank, phoneRoll, screenOffset } = {}) {
  const fixed = display === 'fixed';
  const roll = fixed ? wrapDisplayAngle(finite(phoneRoll) + finite(screenOffset)) : 0;
  return {
    roll,
    camera: new Quaternion().setFromAxisAngle(Z, -roll),
    craft: new Quaternion().setFromAxisAngle(Z, fixed ? 0 : -finite(bank)),
    worldBank: new Quaternion().setFromAxisAngle(Z, fixed ? finite(bank) : 0),
  };
}

/** Keep assistance's heading/pitch, but reserve all screen roll for actual bank. */
export function withoutViewRoll(view = {}) {
  const source = view?.orientation;
  const q = source && [source.x, source.y, source.z, source.w].every(Number.isFinite)
    ? new Quaternion(source.x, source.y, source.z, source.w) : new Quaternion();
  const scale = Math.max(Math.abs(q.x), Math.abs(q.y), Math.abs(q.z), Math.abs(q.w));
  if (scale > 0) q.set(q.x / scale, q.y / scale, q.z / scale, q.w / scale).normalize();
  else q.identity();
  const right = X.clone().applyQuaternion(q), forward = new Vector3(0, 0, -1).applyQuaternion(q);
  const horizontal = Math.hypot(forward.x, forward.z);
  let heading = horizontal > 1e-9 ? Math.atan2(forward.x, -forward.z) : Math.atan2(right.z, right.x);
  let signedHorizontal = horizontal;
  // The right axis distinguishes a >90-degree pitch from a 180-degree yaw.
  // Both representations share a forward direction; retain the original side.
  if (horizontal > 1e-9 && right.x * Math.cos(heading) + right.z * Math.sin(heading) < 0) {
    heading = wrapDisplayAngle(heading + Math.PI);
    signedHorizontal = -horizontal;
  }
  const pitch = Math.atan2(forward.y, signedHorizontal);
  return { ...view, pitch, orientation: new Quaternion().setFromAxisAngle(Y, -heading)
    .multiply(new Quaternion().setFromAxisAngle(X, pitch)) };
}
