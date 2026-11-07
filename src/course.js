/** One route is shared by exploration, flight, and the legacy drawing. */
export const COURSE = Object.freeze({
  start: Object.freeze({ x: 0, y: 14, z: 26 }),
  lights: Object.freeze([
    Object.freeze({ x: 0, y: 14, z: 0 }),
    Object.freeze({ x: 4, y: 16, z: -34 }),
    Object.freeze({ x: 4, y: 18, z: -68 }),
  ]),
  exit: Object.freeze({ x: 8, y: 20, z: -96 }),
});

const LIMITS = Object.freeze({ horizontal: 110, minHeight: 2, maxHeight: 45, heightChange: 10 });
const COLLECT_RADIUS = 3.2;
const EPSILON = 1e-9;
const degrees = radians => radians * 180 / Math.PI;
const isPoint = point => point !== null && typeof point === 'object' && !Array.isArray(point)
  && ['x', 'y', 'z'].every(axis => Number.isFinite(point[axis]));

/**
 * Certifies a horizontal, constant-radius rounding of the waypoint lines.
 * R = v * max(v, 6) / (g * tan(bank)), with stage.js's 0.8 rad/s yaw cap.
 * At a corner of angle a, each adjoining line needs R * tan(|a| / 2).
 * Both corners spend distance on their shared line; checking either alone
 * would accept some impossible layouts. The rounded corner must also pass
 * inside the unchanged 3.2 m light sphere, assuming its target height there.
 *
 * This model requires the first line to agree with the initial north heading.
 * It checks route geometry, not bank response, lift, pitch, or pilot behavior;
 * actual flight and exploration still need separate simulation/browser checks.
 */
export function validateCourse(course, options = {}) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    return { valid: false, turnRadius: null, initialHeadingChangeDegrees: null, segments: [], turns: [],
      errors: ['flight conditions must be an object'] };
  }
  const { speed = 8, bankDegrees = 30, gravity = 3 } = options;
  const errors = [];
  const result = { valid: false, speed, bankDegrees, gravity, turnRadius: null,
    initialHeadingChangeDegrees: null, segments: [], turns: [], errors };
  if (!Number.isFinite(speed) || speed <= 0) errors.push('speed must be finite and greater than zero');
  if (!Number.isFinite(bankDegrees) || bankDegrees <= 0 || bankDegrees >= 90) {
    errors.push('bankDegrees must be finite and between zero and 90');
  }
  if (!Number.isFinite(gravity) || gravity <= 0) errors.push('gravity must be finite and greater than zero');
  if (errors.length) return result;

  const yawRate = Math.min(0.8, gravity * Math.tan(bankDegrees * Math.PI / 180) / Math.max(speed, 6));
  const turnRadius = speed / yawRate;
  if (!Number.isFinite(turnRadius) || turnRadius <= 0) {
    errors.push('flight conditions must produce a finite positive turn radius');
    return result;
  }
  result.turnRadius = turnRadius;

  if (!course || typeof course !== 'object' || !Array.isArray(course.lights) || course.lights.length !== 3) {
    errors.push('course must contain start, exactly three lights, and exit');
    return result;
  }
  const points = [course.start, ...course.lights, course.exit];
  const names = ['start', 'light1', 'light2', 'light3', 'exit'];
  points.forEach((point, index) => {
    if (!isPoint(point)) {
      errors.push(`${names[index]} must have finite numeric x, y, and z`);
    } else if (Math.abs(point.x) > LIMITS.horizontal || Math.abs(point.z) > LIMITS.horizontal
      || point.y < LIMITS.minHeight || point.y > LIMITS.maxHeight) {
      errors.push(`${names[index]} is outside the shared exploration/flight stage bounds`);
    }
  });
  if (errors.length) return result;

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      if (Math.hypot(points[j].x - points[i].x, points[j].z - points[i].z) <= EPSILON) {
        errors.push(`${names[i]} and ${names[j]} must have distinct horizontal positions`);
      }
    }
  }
  if (errors.length) return result;

  const lines = points.slice(1).map((point, index) => {
    const dx = point.x - points[index].x;
    const dz = point.z - points[index].z;
    const horizontalDistance = Math.hypot(dx, dz);
    return { dx: dx / horizontalDistance, dz: dz / horizontalDistance, horizontalDistance };
  });
  result.initialHeadingChangeDegrees = degrees(Math.atan2(lines[0].dx, -lines[0].dz));
  const initialHeadingValid = Math.abs(result.initialHeadingChangeDegrees) <= EPSILON;
  if (!initialHeadingValid) errors.push('the first line must follow the initial north (-z) heading');

  result.turns = lines.slice(1).map((outgoing, index) => {
    const incoming = lines[index];
    // Positive means right of north, matching stage.js's heading convention.
    const signedAngle = Math.atan2(incoming.dx * outgoing.dz - incoming.dz * outgoing.dx,
      incoming.dx * outgoing.dx + incoming.dz * outgoing.dz);
    const angle = Math.abs(signedAngle);
    const reverses = Math.PI - angle <= EPSILON;
    const tangentDistance = reverses ? Infinity : turnRadius * Math.tan(angle / 2);
    const closestApproach = reverses ? Infinity : turnRadius * (1 / Math.cos(angle / 2) - 1);
    const collectable = Number.isFinite(closestApproach) && closestApproach <= COLLECT_RADIUS + EPSILON;
    const valid = !reverses && collectable;
    if (reverses) errors.push(`${names[index + 1]} reverses direction instead of rounding a corner`);
    else if (!collectable) errors.push(`${names[index + 1]} rounded turn misses the unchanged light radius`);
    return { at: names[index + 1], signedTurnDegrees: degrees(signedAngle), turnDegrees: degrees(angle),
      tangentDistance, closestApproach, collectable, valid };
  });

  result.segments = lines.map((line, index) => {
    const entryTangentDistance = result.turns[index - 1]?.tangentDistance ?? 0;
    const exitTangentDistance = result.turns[index]?.tangentDistance ?? 0;
    const requiredDistance = entryTangentDistance + exitTangentDistance;
    const straightMargin = line.horizontalDistance - requiredDistance;
    const heightChange = points[index + 1].y - points[index].y;
    const distanceValid = Number.isFinite(straightMargin) && straightMargin >= -EPSILON;
    const heightValid = Math.abs(heightChange) <= LIMITS.heightChange;
    const cornerValid = (result.turns[index - 1]?.valid ?? true) && (result.turns[index]?.valid ?? true);
    const headingValid = index !== 0 || initialHeadingValid;
    const valid = distanceValid && heightValid && cornerValid && headingValid;
    if (!distanceValid) errors.push(`${names[index]} -> ${names[index + 1]} is too short for its adjacent turns`);
    if (!heightValid) errors.push(`${names[index]} -> ${names[index + 1]} changes height by more than 10 m`);
    return { from: names[index], to: names[index + 1], horizontalDistance: line.horizontalDistance,
      distance: Math.hypot(line.horizontalDistance, heightChange), heightChange,
      entryTangentDistance, exitTangentDistance, requiredDistance, straightMargin,
      distanceValid, heightValid, valid };
  });
  result.valid = errors.length === 0 && result.segments.every(segment => segment.valid);
  return result;
}
