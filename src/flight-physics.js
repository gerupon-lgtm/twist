import {FLIGHT_MODEL,resolveFlightProfile} from './course-flight-profile.js';
export {FLIGHT_MODEL} from './course-flight-profile.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value) => Number.isFinite(value) ? value : 0;
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cleanVector = (v) => ({ x: finite(v?.x), y: finite(v?.y), z: finite(v?.z) });
const EPSILON = 1e-10;
const smooth = (value, low, high) => {
  const t = clamp((value - low) / (high - low), 0, 1);
  return t * t * (3 - 2 * t);
};

function normalized(v) {
  const scale = Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
  if (scale === 0) return null;
  const x = v.x / scale;
  const y = v.y / scale;
  const z = v.z / scale;
  const length = Math.hypot(x, y, z);
  return { x: x / length, y: y / length, z: z / length };
}

function boundedVelocity(v, maxSpeed = FLIGHT_MODEL.maxSpeed) {
  const scale = Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
  if (scale === 0) return v;
  const unitLength = Math.hypot(v.x / scale, v.y / scale, v.z / scale);
  if (scale <= maxSpeed / unitLength) return v;
  const factor = maxSpeed / unitLength;
  return { x: v.x / scale * factor, y: v.y / scale * factor, z: v.z / scale * factor };
}

function flightBasis(input) {
  const forward = normalized(cleanVector(input?.forward)) ?? { x: 0, y: 0, z: -1 };
  const suppliedUp = normalized(cleanVector(input?.up)) ?? { x: 0, y: 1, z: 0 };
  const removeForward = (up) => {
    const along = dot(up, forward);
    return { x: up.x - forward.x * along, y: up.y - forward.y * along, z: up.z - forward.z * along };
  };
  let perpendicular = removeForward(suppliedUp);
  if (Math.hypot(perpendicular.x, perpendicular.y, perpendicular.z) < EPSILON) {
    perpendicular = removeForward(Math.abs(forward.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 });
  }
  return { forward, up: normalized(perpendicular) };
}

function forces(velocity, forward, up, throttle, extraThrust = 0, model=FLIGHT_MODEL) {
  const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
  const direction = speed > EPSILON
    ? { x: velocity.x / speed, y: velocity.y / speed, z: velocity.z / speed }
    : { x: 0, y: 0, z: 0 };
  const angleOfAttack = speed > EPSILON ? Math.atan2(-dot(velocity, up), dot(velocity, forward)) : 0;
  const alongUp = dot(up, direction);
  const projectedUp = { x: up.x - direction.x * alongUp, y: up.y - direction.y * alongUp,
    z: up.z - direction.z * alongUp };
  const projectionLength = Math.hypot(projectedUp.x, projectedUp.y, projectedUp.z);
  const liftDirection = projectionLength > EPSILON ? normalized(projectedUp) : null;
  const speedRatioSquared = (speed / model.cruiseSpeed) ** 2;
  const stallProgress = clamp((Math.abs(angleOfAttack) - model.stallStart)
    / (model.stallEnd - model.stallStart), 0, 1);
  const stallFactor = 1 - stallProgress ** 2 * (3 - 2 * stallProgress);
  // A signed coefficient permits inverted lift; at large incidence it fades
  // smoothly instead of retaining impossible support in a vertical stall.
  const lift = liftDirection && speed > EPSILON
    ? clamp(model.gravity * speedRatioSquared * (1 + 4.5 * angleOfAttack),
      -model.maxLift, model.maxLift) * stallFactor
    : 0;
  const drag = model.cruiseDrag * speedRatioSquared;
  // Powered recovery is available only after the nose/wings return upright
  // and near level. Cruise keeps its original thrust/drag balance.
  const recoveryPosture = (1 - smooth(Math.abs(forward.y), Math.sin(Math.PI / 12), Math.sin(Math.PI / 4)))
    * smooth(up.y, .3, .8);
  const lowForwardSpeed = 1 - smooth(dot(velocity, forward), 1, 4.5);
  const stalled = smooth(angleOfAttack, model.stallStart, model.stallEnd);
  const recoveryAssist = throttle * recoveryPosture * Math.max(lowForwardSpeed, stalled);
  const thrust = throttle * (model.maxThrust + model.recoveryThrust * recoveryPosture * lowForwardSpeed)
    + extraThrust;
  const alongForward = dot(forward, direction);
  const redirect = { x: forward.x - direction.x * alongForward,
    y: forward.y - direction.y * alongForward, z: forward.z - direction.z * alongForward };
  const redirectLength = Math.hypot(redirect.x, redirect.y, redirect.z);
  const recoveryDirection = redirectLength > EPSILON ? normalized(redirect) : null;
  const recoveryAcceleration = recoveryDirection ? Math.min(model.maxRecoveryAcceleration,
    speed * model.recoveryTurnRate * throttle * recoveryPosture * stalled)
    * Math.min(1, redirectLength / .1) : 0;
  // This correction is perpendicular to velocity: it redirects existing
  // momentum continuously, rather than replacing velocity or adding lift at rest.
  return {
    x: forward.x * thrust - direction.x * drag + (liftDirection?.x ?? 0) * lift + (recoveryDirection?.x ?? 0) * recoveryAcceleration,
    y: forward.y * thrust - direction.y * drag + (liftDirection?.y ?? 0) * lift - model.gravity + (recoveryDirection?.y ?? 0) * recoveryAcceleration,
    z: forward.z * thrust - direction.z * drag + (liftDirection?.z ?? 0) * lift + (recoveryDirection?.z ?? 0) * recoveryAcceleration,
    angleOfAttack,
    lift,
    thrust,
    recoveryAssist,
    recoveryAcceleration,
  };
}

/**
 * Pure velocity step. World Y is height; inputs and outputs are plain xyz.
 * Lift is perpendicular to velocity, so it redirects motion without adding work.
 * Midpoint substeps limit spurious energy from numerical integration. Large dt
 * is capped at .05 s; invalid/negative dt advances no time. Missing/invalid
 * throttle is zero; explicit start/restart uses FLIGHT_MODEL.defaultThrottle.
 * AB adds only thrust and a temporary cap. After release, preserveOverspeed
 * permits existing momentum to decay under the same forces without a 30m/s cut.
 */
export function stepFlightVelocity(velocity, dt, input) {
  const profile=resolveFlightProfile(input?.profile),model=profile.model;
  const cleaned = cleanVector(velocity);
  const startSpeed = Math.hypot(cleaned.x, cleaned.y, cleaned.z);
  const maxSpeed = input?.afterburner === true ? profile.afterburnerMaxSpeed
    : input?.preserveOverspeed === true && Number.isFinite(startSpeed)
      ? Math.max(model.maxSpeed, startSpeed) : model.maxSpeed;
  const extraThrust = input?.afterburner === true ? profile.afterburnerThrust : 0;
  let state = boundedVelocity(cleaned, maxSpeed);
  const { forward, up } = flightBasis(input);
  const throttle = clamp(finite(input?.throttle), 0, 1);
  const elapsed = clamp(finite(dt), 0, model.maxTimeStep);
  const steps = Math.ceil(elapsed / model.integrationStep);
  const step = steps > 0 ? elapsed / steps : 0;
  for (let i = 0; i < steps; i += 1) {
    const initial = forces(state, forward, up, throttle, extraThrust, model);
    const midpoint = boundedVelocity({ x: state.x + initial.x * step / 2,
      y: state.y + initial.y * step / 2, z: state.z + initial.z * step / 2 }, maxSpeed);
    const middle = forces(midpoint, forward, up, throttle, extraThrust, model);
    state = boundedVelocity({ x: state.x + middle.x * step,
      y: state.y + middle.y * step, z: state.z + middle.z * step }, maxSpeed);
  }
  const final = forces(state, forward, up, throttle, extraThrust, model);
  return {
    velocity: state,
    speed: Math.hypot(state.x, state.y, state.z),
    verticalSpeed: state.y,
    angleOfAttack: final.angleOfAttack,
    lift: final.lift,
    throttle,
    engineThrust: final.thrust,
    recoveryAssist: final.recoveryAssist,
    recoveryAcceleration: final.recoveryAcceleration,
  };
}
