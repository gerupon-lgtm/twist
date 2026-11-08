import assert from 'node:assert/strict';
import test from 'node:test';
import { SUPERSONIC_COURSE } from '../src/supersonic/course.js';
import { gateCrossing, seaClearance, seaContact, sweepSea, slerpQuaternion, normalizeQuaternion } from '../src/supersonic/gate-crossing.js';
const near = (a, b, eps = 1e-8) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);
const qz = angle => ({ x: 0, y: 0, z: Math.sin(angle / 2), w: Math.cos(angle / 2) });

test('plane disc accepts inside, edge, reverse and endpoint, rejects parallel and repeated start', () => {
  const gate = SUPERSONIC_COURSE.gates[2], a = { x: 0, y: 1500, z: 7000 }, b = { ...a, z: -7000 };
  near(gateCrossing(a, b, gate).fraction, .5); assert.equal(gateCrossing(a, b, gate).inside, true);
  assert.equal(gateCrossing(b, a, gate).direction, 'reverse');
  assert.equal(gateCrossing({ ...a, x: 80 }, { ...b, x: 80 }, gate).inside, true);
  assert.equal(gateCrossing({ ...a, x: 80.001 }, { ...b, x: 80.001 }, gate).inside, false);
  assert.equal(gateCrossing(a, { ...a, x: 100 }, gate), null);
  assert.equal(gateCrossing(a, { ...a, z: 0 }, gate).fraction, 1);
  assert.equal(gateCrossing({ ...a, z: 0 }, b, gate), null);
  const crossings = SUPERSONIC_COURSE.gates.map(g => gateCrossing({ ...a, z: 18000 }, { ...a, z: -19000 }, g));
  assert.equal(crossings.filter(Boolean).length, 6);
  assert.ok(crossings.every((hit, i) => i === 0 || hit.fraction > crossings[i - 1].fraction));
});
test('physical hull clearance differs from centre altitude and changes with bank', () => {
  const p = { x: 0, y: 10, z: 0 };
  near(seaClearance(p), 9.52);
  near(seaClearance(p, qz(Math.PI / 6)), 10 - 1.025, .001);
  near(seaClearance(p, qz(Math.atan(Math.sqrt(80)))), 10 - 2.0373, .001);
  const hit = seaContact(p, { ...p, y: -10 });
  near(hit.centerPosition.y, .48); near(hit.contactPoint.y, 0);
  assert.ok(hit.hullVertexId >= 0);
});
test('SLERP sweep finds first contact although both endpoint clearances are positive', () => {
  const hull = [{ x: 1, y: 0, z: 0 }], p = { x: 0, y: .5, z: 0 };
  const options = { hull, fromOrientation: qz(0), toOrientation: qz(-Math.PI) };
  near(seaClearance(p, options.fromOrientation, hull), .5);
  near(seaClearance(p, options.toOrientation, hull), .5);
  const result = sweepSea(p, p, 0, options);
  near(result.contact.fraction, 1 / 6); near(result.minimumClearance, -.5);
  near(result.contact.contactPoint.y, 0);
  // Tangency is contact, not a positive-endpoint miss.
  near(seaContact({ ...p, y: 1 }, { ...p, y: 1 }, 0, options).fraction, .5);
});
test('sea/gate chronological fractions preserve which event happened first', () => {
  const gate = { ...SUPERSONIC_COURSE.gates[2], center: { x: 0, y: 1, z: 0 } };
  const from = { x: 0, y: 1, z: 1 }, to = { x: 0, y: -.1, z: -1 };
  assert.ok(seaContact(from, to).fraction < gateCrossing(from, to, gate).fraction);
  const higher = { ...from, y: 2 };
  assert.ok(seaContact(higher, to).fraction > gateCrossing(higher, to, gate).fraction);
});
test('analytic hull sweep agrees with an independent dense time sampling across arbitrary poses', () => {
  let seed = 9173;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const randomQuaternion = () => normalizeQuaternion({ x: random() - .5, y: random() - .5, z: random() - .5, w: random() - .5 });
  for (let fixture = 0; fixture < 24; fixture++) {
    const q0 = randomQuaternion(), q1 = randomQuaternion();
    const from = { x: 10, y: .5 + random() * 4, z: -20 }, to = { x: -40, y: .5 + random() * 4, z: 70 };
    const analytic = sweepSea(from, to, 0, { fromOrientation: q0, toOrientation: q1 });
    let minimum = Infinity, first = null;
    for (let i = 0; i <= 512; i++) {
      const t = i / 512, position = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, z: from.z + (to.z - from.z) * t };
      const clearance = seaClearance(position, slerpQuaternion(q0, q1, t));
      minimum = Math.min(minimum, clearance); if (first === null && clearance <= 0) first = t;
    }
    assert.ok(analytic.minimumClearance <= minimum + 1e-8);
    assert.ok(minimum - analytic.minimumClearance < .001);
    if (first !== null) { assert.ok(analytic.contact); assert.ok(analytic.contact.fraction <= first + 1e-8); assert.ok(first - analytic.contact.fraction < 1 / 512 + 1e-8); }
    else if (analytic.minimumClearance > 1e-8) assert.equal(analytic.contact, null);
  }
  near(normalizeQuaternion({ x: 1e308, y: 1e308, z: 1e308, w: 1e308 }).w, .5);
  assert.throws(() => normalizeQuaternion({ x: 0, y: 0, z: 0, w: 0 }), /nonzero/);
});
