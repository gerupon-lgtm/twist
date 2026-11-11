import { MathUtils, Matrix4, Quaternion, Vector3 } from 'three';

export const normalizeCameraMode = value => ['chase', 'cockpit'].includes(value) ? value : 'overlay';
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
const finite = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;
export const CHASE_FRAMING_DEGREES=10;
/** Apply in camera space after bank, keeping the fixed rear-view pivot below center. */
export function frameFlightCamera(quaternion,mode){return mode==='chase'?quaternion.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),MathUtils.degToRad(CHASE_FRAMING_DEGREES))):quaternion.clone();}

/** Only the two viewing angles are delayed. No aircraft state is changed. */
export function advanceChaseAngles(current, target, dt, timeConstant = .15) {
  const goal = { heading: finite(target?.heading), pitch: finite(target?.pitch) };
  if (!current) return goal;
  const tau = MathUtils.clamp(finite(timeConstant, .15), 0, .5);
  const amount = tau === 0 ? 1 : -Math.expm1(-Math.max(0, finite(dt)) / tau);
  return Object.fromEntries(['heading', 'pitch'].map(key => [key,
    wrap(current[key] + wrap(goal[key] - current[key]) * amount)]));
}

export function bodyViewAngles(orientation) {
  const right = new Vector3(1, 0, 0).applyQuaternion(orientation);
  return { heading: Math.atan2(right.z, right.x),
    pitch: Math.atan2(2 * (orientation.w * orientation.x - orientation.y * orientation.z),
      1 - 2 * (orientation.x ** 2 + orientation.z ** 2)) };
}

/** A body-relative aft/up rig, with a floor solely for the viewing position. */
export function chaseView(angles, altitude, assistance = 0,{wide=false}={}) {
  const rig = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -angles.heading)
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), angles.pitch));
  const offset = new Vector3(0, wide?4+assistance:9+2*assistance, 25).applyQuaternion(rig);
  offset.y = Math.max(offset.y, 1.2 - altitude);
  const up = new Vector3(0, 1, 0).applyQuaternion(rig);
  const orientation = new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(offset, new Vector3(), up));
  const forward = new Vector3(0, 0, -1).applyQuaternion(orientation);
  return { orientation, offset, assistance,
    pitch: Math.atan2(forward.y, Math.hypot(forward.x, forward.z)) };
}
