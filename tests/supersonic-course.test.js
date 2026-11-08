import assert from 'node:assert/strict';
import test from 'node:test';
import { SUPERSONIC_COURSE, validateSupersonicCourse, supersonicTurnRadius } from '../src/supersonic/course.js';
import { createSupersonicProfile } from '../src/supersonic/profile.js';

test('six plane gates preserve flat compatibility points, 6km spacing and 36km route', () => {
  const c = SUPERSONIC_COURSE, result = validateSupersonicCourse(c, createSupersonicProfile());
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.deepEqual(result.geometry.segments, [6000, 6000, 6000, 6000, 6000, 6000]);
  assert.equal(result.geometry.length, 36000); assert.equal(result.checks.abLength, 33000);
  assert.equal(c.lights.length, 5); assert.equal(c.exit, c.gates[5].center);
  assert.equal(c.start.z, 18000); assert.equal(c.lights[0].z, 12000);
  assert.ok(c.gates.every(g => g.radius === 80));
  assert.ok(Math.abs(supersonicTurnRadius(340) - 1318.82) < 1);
});
test('independent validator rejects impossible reversal and malformed bases', () => {
  const c = structuredClone(SUPERSONIC_COURSE);
  c.gates[1].center.z = 17000;
  assert.equal(validateSupersonicCourse(c).valid, false);
  const malformed = structuredClone(SUPERSONIC_COURSE); malformed.gates[0].right.x = 2;
  assert.match(validateSupersonicCourse(malformed).errors.join(' '), /basis/);
});
