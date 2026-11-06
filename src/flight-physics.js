/** Game-scale flight approximation; values are accelerations per unit mass. */
export const FLIGHT_MODEL = Object.freeze({
  cruiseSpeed: 6,
  defaultThrottle: 0.5,
  gravity: 3,
  maxThrust: 1.8,
  cruiseDrag: 0.9,
  maxSpeed: 18,
  maxLift: 9,
  stallStart: 20 * Math.PI / 180,
  stallEnd: 70 * Math.PI / 180,
  maxTimeStep: 0.05,
  integrationStep: 1 / 120,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const finite = (value) => Number.isFinite(value) ? value : 0;
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cleanVector = (v) => ({ x: finite(v?.x), y: finite(v?.y), z: finite(v?.z) });
const EPSILON = 1e-10;

function normalized(v) {
  const scale = Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
  if (scale === 0) return null;
  const x = v.x / scale;
  const y = v.y / scale;
  const z = v.z / scale;
  const length = Math.hypot(x, y, z);
  return { x: x / length, y: y / length, z: z / length };
}

function boundedVelocity(v) {
  const scale = Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
  if (scale === 0) return v;
  const unitLength = Math.hypot(v.x / scale, v.y / scale, v.z / scale);
  if (scale <= FLIGHT_MODEL.maxSpeed / unitLength) return v;
  const factor = FLIGHT_MODEL.maxSpeed / unitLength;
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

function forces(velocity, forward, up, throttle) {
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
  const speedRatioSquared = (speed / FLIGHT_MODEL.cruiseSpeed) ** 2;
  const stallProgress = clamp((Math.abs(angleOfAttack) - FLIGHT_MODEL.stallStart)
    / (FLIGHT_MODEL.stallEnd - FLIGHT_MODEL.stallStart), 0, 1);
  const stallFactor = 1 - stallProgress ** 2 * (3 - 2 * stallProgress);
  // A signed coefficient permits inverted lift; at large incidence it fades
  // smoothly instead of retaining impossible support in a vertical stall.
  const lift = liftDirection && speed > EPSILON
    ? clamp(FLIGHT_MODEL.gravity * speedRatioSquared * (1 + 4.5 * angleOfAttack),
      -FLIGHT_MODEL.maxLift, FLIGHT_MODEL.maxLift) * stallFactor
    : 0;
  const drag = FLIGHT_MODEL.cruiseDrag * speedRatioSquared;
  const thrust = FLIGHT_MODEL.maxThrust * throttle;
  return {
    x: forward.x * thrust - direction.x * drag + (liftDirection?.x ?? 0) * lift,
    y: forward.y * thrust - direction.y * drag + (liftDirection?.y ?? 0) * lift - FLIGHT_MODEL.gravity,
    z: forward.z * thrust - direction.z * drag + (liftDirection?.z ?? 0) * lift,
    angleOfAttack,
    lift,
  };
}

/**
 * Pure velocity step. World Y is height; inputs and outputs are plain xyz.
 * Lift is perpendicular to velocity, so it redirects motion without adding work.
 * Midpoint substeps limit spurious energy from numerical integration. Large dt
 * is capped at .05 s; invalid/negative dt advances no time. Missing/invalid
 * throttle is zero; explicit start/restart uses FLIGHT_MODEL.defaultThrottle.
 */
export function stepFlightVelocity(velocity, dt, input) {
  let state = boundedVelocity(cleanVector(velocity));
  const { forward, up } = flightBasis(input);
  const throttle = clamp(finite(input?.throttle), 0, 1);
  const elapsed = clamp(finite(dt), 0, FLIGHT_MODEL.maxTimeStep);
  const steps = Math.ceil(elapsed / FLIGHT_MODEL.integrationStep);
  const step = steps > 0 ? elapsed / steps : 0;
  for (let i = 0; i < steps; i += 1) {
    const initial = forces(state, forward, up, throttle);
    const midpoint = boundedVelocity({ x: state.x + initial.x * step / 2,
      y: state.y + initial.y * step / 2, z: state.z + initial.z * step / 2 });
    const middle = forces(midpoint, forward, up, throttle);
    state = boundedVelocity({ x: state.x + middle.x * step,
      y: state.y + middle.y * step, z: state.z + middle.z * step });
  }
  const final = forces(state, forward, up, throttle);
  return {
    velocity: state,
    speed: Math.hypot(state.x, state.y, state.z),
    verticalSpeed: state.y,
    angleOfAttack: final.angleOfAttack,
    lift: final.lift,
    throttle,
  };
}
