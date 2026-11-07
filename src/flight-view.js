import { MathUtils, Quaternion, Vector3 } from 'three';

const clamp = MathUtils.clamp;
const smooth = (value, low, high) => MathUtils.smoothstep(value, low, high);
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const Y = new Vector3(0, 1, 0), X = new Vector3(1, 0, 0), Z = new Vector3(0, 0, 1);

/** Visual assistance only: the vehicle attitude and velocity are never changed. */
export function computeFlightView({ orientation, altitude, velocity, bank } = {}) {
  const body = new Quaternion();
  if (orientation && [orientation.x, orientation.y, orientation.z, orientation.w].every(Number.isFinite)) {
    const scale = Math.max(Math.abs(orientation.x), Math.abs(orientation.y), Math.abs(orientation.z), Math.abs(orientation.w));
    if (scale > 0) body.set(orientation.x / scale, orientation.y / scale,
      orientation.z / scale, orientation.w / scale).normalize();
  }
  const height = Math.max(0, finite(altitude));
  const v = new Vector3(finite(velocity?.x), finite(velocity?.y), finite(velocity?.z));
  const low = 1 - smooth(height, 5, 12);
  const falling = smooth(-v.y, .1, .8);
  const assistance = Math.max(low, falling);
  // The bank-free right axis keeps a stable heading through vertical pitch.
  const base = body.clone().multiply(new Quaternion().setFromAxisAngle(Z, finite(bank)));
  const right = new Vector3(1, 0, 0).applyQuaternion(base);
  const bodyHeading = Math.atan2(right.z, right.x);
  const travelHeading = Math.atan2(v.x, -v.z);
  const difference = Math.atan2(Math.sin(travelHeading - bodyHeading), Math.cos(travelHeading - bodyHeading));
  const heading = bodyHeading + difference * smooth(Math.hypot(v.x, v.z), .1, 1);
  const groundPitch = -MathUtils.degToRad(MathUtils.lerp(12, 18, 1 - clamp(height / 5, 0, 1)));
  const travelPitch = Math.atan2(v.y, Math.hypot(v.x, v.z));
  const descentPitch = Math.min(groundPitch,
    clamp(travelPitch, -MathUtils.degToRad(35), -MathUtils.degToRad(10)));
  const pitch = falling > 0 ? MathUtils.lerp(descentPitch, groundPitch, low) : groundPitch;
  const target = new Quaternion().setFromAxisAngle(Y, -heading)
    .multiply(new Quaternion().setFromAxisAngle(X, pitch))
    .multiply(new Quaternion().setFromAxisAngle(Z, -clamp(finite(bank), -Math.PI / 12, Math.PI / 12)));
  const view = body.clone().slerp(target, assistance).normalize();
  const direction = new Vector3(0, 0, -1).applyQuaternion(view);
  return {
    orientation: view,
    assistance,
    pitch: Math.atan2(direction.y, Math.hypot(direction.x, direction.z)),
    // Looking from slightly behind/above keeps the ground visible at contact.
    // The renderer's camera and the craft pivot still remain fixed on screen.
    offset: new Vector3(-Math.sin(heading) * 6, 1.8, Math.cos(heading) * 6).multiplyScalar(assistance),
  };
}
