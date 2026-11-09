const point = (x, y, z) => Object.freeze({ x, y, z });
const gates = Object.freeze([12000, 6000, 0, -6000, -12000, -18000].map((z, index) => Object.freeze({
  id: index === 5 ? 'supersonic-exit' : `supersonic-gate-${index + 1}`, index, number: index + 1,
  kind: index === 5 ? 'exit' : 'gate', center: point(0, 1500, z), radius: 80,
  normal: point(0, 0, 1), right: point(1, 0, 0), up: point(0, 1, 0),
})));
export const SUPERSONIC_COURSE = Object.freeze({
  id: 'supersonic', profile: 'supersonic', name: '高速空域（試作）', targetCount: 5,
  start: point(0, 1500, 18000), startHeading: 0,
  arena: Object.freeze({ id: 'supersonic', halfExtent: 20000, width: 40000, depth: 40000, seaLevel: 0, maxAltitude: 6000,
    minHeight: 0, maxHeight: 6000, bounds: Object.freeze({ minX: -20000, maxX: 20000, minZ: -20000, maxZ: 20000 }),
    landmarks: Object.freeze([
      Object.freeze({ id: 'island-west', label: 'W ISLAND', kind: 'island', position: point(-16000, 450, -11000), height: 900 }),
      Object.freeze({ id: 'island-east', label: 'E ISLAND', kind: 'island', position: point(16000, 600, -5000), height: 1200 }),
      Object.freeze({ id: 'island-southwest', label: 'SW ISLAND', kind: 'island', position: point(-13000, 350, 12000), height: 700 }),
      Object.freeze({ id: 'island-southeast', label: 'SE ISLAND', kind: 'island', position: point(14000, 450, 14000), height: 900 }),
    ]) }),
  gates, lights: Object.freeze(gates.slice(0, 5).map(gate => gate.center)), exit: gates[5].center,
  abStraights: Object.freeze([Object.freeze({ id: 'supersonic-straight', from: point(0, 1500, 17000), to: point(0, 1500, -16000), width: 400, heightTolerance: 160 })]),
});
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const validPoint = p => p && ['x', 'y', 'z'].every(key => Number.isFinite(p[key]));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function supersonicTurnRadius(speed, maxG = 9, gravity = 9.8) {
  return Number.isFinite(speed) && speed >= 0 && Number.isFinite(maxG) && maxG > 1 && Number.isFinite(gravity) && gravity > 0
    ? speed * speed / (gravity * Math.sqrt(maxG * maxG - 1)) : null;
}
/** Geometry feasibility only; actual 3D input flights remain a separate acceptance check. */
export function validateSupersonicCourse(course, profile = {}) {
  const errors = [];
  const result = { valid: false, errors, geometry: { length: 0, segments: [], turns: [] }, checks: { turnRadii: {}, abLength: 0 } };
  if (!validPoint(course?.start) || !Array.isArray(course?.gates) || course.gates.length < 2) {
    errors.push('course requires a finite start and ordered gates'); return result;
  }
  const maxG = profile.maxG ?? 9, gravity = profile.gravity ?? 9.8;
  const speeds=profile.validationSpeeds??[200,340,680],maximumValidationSpeed=speeds.at(-1);
  for (const speed of speeds) {
    result.checks.turnRadii[speed] = supersonicTurnRadius(speed, maxG, gravity);
    if (result.checks.turnRadii[speed] === null) errors.push('invalid turn authority');
  }
  let previous = course.start;
  const ids = new Set();
  for (const [index, gate] of course.gates.entries()) {
    if (typeof gate?.id !== 'string' || ids.has(gate.id)) errors.push(`gate ${index} needs a unique id`);
    ids.add(gate?.id);
    if (gate?.kind !== (index === course.gates.length - 1 ? 'exit' : 'gate')) errors.push(`gate ${index} has invalid kind/order`);
    if (![gate.center, gate.normal, gate.right, gate.up].every(validPoint) || !(Number.isFinite(gate.radius) && gate.radius > 0)) {
      errors.push(`gate ${index} has invalid geometry`); continue;
    }
    const { normal: n, right: r, up: u } = gate;
    if ([n, r, u].some(v => Math.abs(dot(v, v) - 1) > 1e-8) || [dot(n, r), dot(n, u), dot(r, u)].some(v => Math.abs(v) > 1e-8)
      || Math.abs((r.y * u.z - r.z * u.y) * n.x + (r.z * u.x - r.x * u.z) * n.y + (r.x * u.y - r.y * u.x) * n.z - 1) > 1e-8) errors.push(`gate ${index} basis must be right-handed orthonormal`);
    const length = distance(previous, gate.center);
    if (!(length > 0)) errors.push(`gate ${index} has zero spacing`);
    result.geometry.segments.push(length); result.geometry.length += length;
    if (Math.abs(gate.center.x) > (course.arena?.halfExtent ?? 20000) || Math.abs(gate.center.z) > (course.arena?.halfExtent ?? 20000)
      || gate.center.y <= (course.arena?.seaLevel ?? 0) || gate.center.y > (course.arena?.maxAltitude ?? 6000)) errors.push(`gate ${index} is outside airspace`);
    if (index < course.gates.length - 1 && validPoint(course.gates[index + 1]?.center)) {
      const a = previous, b = gate.center, c = course.gates[index + 1].center;
      const incoming = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }, outgoing = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
      const l1 = distance(a, b), l2 = distance(b, c);
      const turn = Math.acos(Math.max(-1, Math.min(1, dot(incoming, outgoing) / (l1 * l2))));
      const radius = turn < 1e-8 ? null : distance(a, c) / (2 * Math.sin(turn));
      result.geometry.turns.push({ index, radians: turn, radius });
      if (turn > Math.PI - 1e-8 || (radius !== null && radius < result.checks.turnRadii[maximumValidationSpeed])) errors.push(`gate ${index} turn is infeasible at ${maximumValidationSpeed}m/s and configured G`);
    }
    previous = gate.center;
  }
  for (const lane of course.abStraights ?? []) {
    if (validPoint(lane.from) && validPoint(lane.to)) result.checks.abLength = Math.max(result.checks.abLength, distance(lane.from, lane.to));
  }
  if (!(result.checks.abLength > 0)) errors.push('course requires an AB straight');
  result.valid = errors.length === 0;
  return result;
}
