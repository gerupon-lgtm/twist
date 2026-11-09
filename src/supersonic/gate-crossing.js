import { SUPERSONIC_AIRCRAFT_HULL } from './aircraft-hull.js';

const EPS = 1e-9;
const identity = Object.freeze({ x: 0, y: 0, z: 0, w: 1 });
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a, b) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const mix = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
function assertPoint(value) { if (!value || !['x', 'y', 'z'].every(key => Number.isFinite(value[key]))) throw new TypeError('finite XYZ required'); }
export function normalizeQuaternion(q) {
  if (!q || !['x', 'y', 'z', 'w'].every(key => Number.isFinite(q[key]))) throw new TypeError('finite quaternion required');
  const scale = Math.max(Math.abs(q.x), Math.abs(q.y), Math.abs(q.z), Math.abs(q.w));
  if (!(scale > 0)) throw new RangeError('nonzero quaternion required');
  const length = Math.hypot(q.x / scale, q.y / scale, q.z / scale, q.w / scale);
  return { x: q.x / scale / length, y: q.y / scale / length, z: q.z / scale / length, w: q.w / scale / length };
}
export function rotateVector(v, q) {
  const t = cross(q, v), u = cross(q, t);
  return { x: v.x + 2 * (q.w * t.x + u.x), y: v.y + 2 * (q.w * t.y + u.y), z: v.z + 2 * (q.w * t.z + u.z) };
}
export function slerpQuaternion(a, b, t) {
  a = normalizeQuaternion(a); b = normalizeQuaternion(b);
  let d = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  if (d < 0) { b = { x: -b.x, y: -b.y, z: -b.z, w: -b.w }; d = -d; }
  if (d > 1 - 1e-12) return normalizeQuaternion({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, w: a.w + (b.w - a.w) * t });
  const theta = Math.acos(Math.min(1, d)), sine = Math.sin(theta);
  const u = Math.sin((1 - t) * theta) / sine, v = Math.sin(t * theta) / sine;
  return { x: a.x * u + b.x * v, y: a.y * u + b.y * v, z: a.z * u + b.z * v, w: a.w * u + b.w * v };
}
/** Both directions count; a segment starting on the plane never repeats a crossing. */
export function gateCrossing(from, to, gate) {
  assertPoint(from); assertPoint(to); assertPoint(gate?.center); assertPoint(gate?.normal); assertPoint(gate?.right); assertPoint(gate?.up);
  if (!(Number.isFinite(gate.radius) && gate.radius > 0)) throw new RangeError('positive gate radius required');
  const a = { x: from.x - gate.center.x, y: from.y - gate.center.y, z: from.z - gate.center.z };
  const b = { x: to.x - gate.center.x, y: to.y - gate.center.y, z: to.z - gate.center.z };
  const d0 = dot(a, gate.normal), d1 = dot(b, gate.normal);
  if (Math.abs(d0) <= EPS || Math.abs(d1 - d0) <= EPS || (d0 * d1 > 0 && Math.abs(d1) > EPS)) return null;
  // Arrival can round a fraction of a nanometre short of the plane. Count that
  // endpoint once; the start-on-plane guard above prevents the next-step repeat.
  const fraction = Math.min(1, d0 / (d0 - d1));
  if (fraction < 0 || fraction > 1) return null;
  const position = mix(from, to, fraction);
  const r = { x: position.x - gate.center.x, y: position.y - gate.center.y, z: position.z - gate.center.z };
  const radialDistance = Math.hypot(dot(r, gate.right), dot(r, gate.up));
  return { fraction, position, radialDistance, inside: radialDistance <= gate.radius + EPS, direction: d1 < d0 ? 'forward' : 'reverse' };
}
export function seaClearance(position, orientation = identity, hull = SUPERSONIC_AIRCRAFT_HULL, seaLevel = 0) {
  assertPoint(position); const q = normalizeQuaternion(orientation);
  if (!Array.isArray(hull) || !hull.length || !Number.isFinite(seaLevel)) throw new TypeError('finite sea and nonempty hull required');
  let minimum = Infinity;
  for (const point of hull) { assertPoint(point); minimum = Math.min(minimum, position.y + rotateVector(point, q).y - seaLevel); }
  return minimum;
}
/** Exact within the chosen centre segment + shortest body SLERP, including interior grazing. */
export function sweepSea(from, to, seaLevel = 0, options = {}) {
  assertPoint(from); assertPoint(to);
  const q0 = normalizeQuaternion(options.fromOrientation ?? identity);
  let q1 = normalizeQuaternion(options.toOrientation ?? q0);
  const hull = options.hull ?? SUPERSONIC_AIRCRAFT_HULL;
  if (!Number.isFinite(seaLevel) || !Array.isArray(hull) || !hull.length) throw new TypeError('finite sea and nonempty hull required');
  if (q0.x * q1.x + q0.y * q1.y + q0.z * q1.z + q0.w * q1.w < 0) q1 = { x: -q1.x, y: -q1.y, z: -q1.z, w: -q1.w };
  // delta = q1 * conjugate(q0), in world coordinates.
  const delta = {
    x: -q1.w * q0.x + q1.x * q0.w - q1.y * q0.z + q1.z * q0.y,
    y: -q1.w * q0.y + q1.x * q0.z + q1.y * q0.w - q1.z * q0.x,
    z: -q1.w * q0.z - q1.x * q0.y + q1.y * q0.x + q1.z * q0.w,
    w: q1.w * q0.w + q1.x * q0.x + q1.y * q0.y + q1.z * q0.z,
  };
  const sine = Math.hypot(delta.x, delta.y, delta.z), theta = 2 * Math.atan2(sine, Math.max(0, delta.w));
  const axis = sine > 1e-14 ? { x: delta.x / sine, y: delta.y / sine, z: delta.z / sine } : { x: 0, y: 1, z: 0 };
  const dy = to.y - from.y;
  let contact = null, minimumClearance = Infinity, minimumFraction = 0;
  for (let hullVertexId = 0; hullVertexId < hull.length; hullVertexId++) {
    const point = hull[hullVertexId]; assertPoint(point);
    const start = rotateVector(point, q0), parallel = axis.y * dot(axis, start);
    const A = start.y - parallel, B = cross(axis, start).y, C = parallel;
    const f = t => from.y - seaLevel + dy * t + C + A * Math.cos(theta * t) + B * Math.sin(theta * t);
    const knots = [0, 1], amplitude = theta * Math.hypot(A, B);
    if (amplitude > 1e-14 && Math.abs(dy / amplitude) <= 1) {
      const phi = Math.atan2(A, B), angle = Math.acos(-dy / amplitude);
      for (let n = -2; n <= 2; n++) for (const sign of [-1, 1]) {
        const t = (sign * angle + 2 * Math.PI * n - phi) / theta;
        if (t > 0 && t < 1) knots.push(t);
      }
    }
    knots.sort((a, b) => a - b);
    let first = null;
    for (let i = 0; i < knots.length; i++) {
      const end = knots[i], value = f(end);
      if (value < minimumClearance) { minimumClearance = value; minimumFraction = end; }
      if (first !== null || value > EPS) continue;
      if (i === 0) first = 0;
      else {
        let low = knots[i - 1], high = end;
        for (let j = 0; j < 48; j++) { const mid = (low + high) / 2; if (f(mid) <= 0) high = mid; else low = mid; }
        // A tangent minimum can be positive only by rounding; retain the extremum itself.
        first = value > 0 ? end : high;
      }
    }
    if (first !== null && (!contact || first < contact.fraction)) {
      const orientation = slerpQuaternion(q0, q1, first), centerPosition = mix(from, to, first);
      const rotated = rotateVector(point, orientation);
      const contactPoint = { x: centerPosition.x + rotated.x, y: seaLevel, z: centerPosition.z + rotated.z };
      contact = { fraction: first, position: centerPosition, centerPosition, contactPoint, hullVertexId, orientation };
    }
  }
  return { contact, minimumClearance, minimumFraction };
}
export function seaContact(from, to, seaLevel = 0, options = {}) { return sweepSea(from, to, seaLevel, options).contact; }
