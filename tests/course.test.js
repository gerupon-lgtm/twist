import assert from 'node:assert/strict';
import test from 'node:test';
import { COURSE, validateCourse } from '../src/course.js';

const near = (actual, expected, tolerance = 1e-8) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be ${expected} +/- ${tolerance}`);
};
const copy = () => structuredClone(COURSE);
const oldCourse = {
  start: { x: 0, y: 7, z: 26 },
  lights: [{ x: 0, y: 10, z: 0 }, { x: 16, y: 18, z: -24 }, { x: -14, y: 12, z: -44 }],
  exit: { x: 0, y: 7, z: -62 },
};

test('shared route keeps the horizontal launch and first light, raises the exit, and gently reverses its turns', () => {
  assert.deepEqual(COURSE.start, { x: 0, y: 10, z: 26 });
  assert.deepEqual(COURSE.lights[0], { x: 0, y: 10, z: 0 });
  assert.ok(COURSE.exit.y >= 10);
  assert.ok(Object.isFrozen(COURSE) && Object.isFrozen(COURSE.lights));
  for (const point of [COURSE.start, ...COURSE.lights, COURSE.exit]) assert.ok(Object.isFrozen(point));
  const result = validateCourse(COURSE);
  assert.equal(result.valid, true, result.errors.join('; '));
  assert.equal(result.segments.length, 4);
  assert.equal(result.turns.length, 3);
  near(result.initialHeadingChangeDegrees, 0);
  near(result.turnRadius, 64 / (3 * Math.tan(Math.PI / 6)));
  assert.deepEqual(result.turns.map(turn => Math.sign(turn.signedTurnDegrees)), [1, -1, 1]);
  for (const turn of result.turns) {
    assert.ok(turn.turnDegrees < 27);
    assert.ok(turn.closestApproach < 1.1, 'leave over 2 m inside the unchanged 3.2 m radius');
    assert.equal(turn.valid, true);
  }
  for (const segment of result.segments) {
    assert.equal(segment.valid, true);
    assert.ok(Math.abs(segment.heightChange) <= 4);
    assert.ok(segment.straightMargin > 16, 'leave room beyond the 2.4 m travelled during 0.3 s response');
    near(segment.requiredDistance, segment.entryTangentDistance + segment.exitTangentDistance);
  }
});

test('old layout fails, including the light3-to-exit leg and its 95-degree corner', () => {
  const result = validateCourse(oldCourse);
  assert.equal(result.valid, false);
  const lastTurn = result.turns.at(-1);
  assert.ok(lastTurn.turnDegrees > 90);
  assert.ok(lastTurn.tangentDistance > 39);
  assert.equal(lastTurn.collectable, false);
  const lastSegment = result.segments.at(-1);
  assert.deepEqual([lastSegment.from, lastSegment.to], ['light3', 'exit']);
  assert.equal(lastSegment.distanceValid, false);
  assert.equal(lastSegment.valid, false);
  assert.ok(lastSegment.straightMargin < 0);
});

test('two individually fitting turns cannot spend the same shared line twice', () => {
  const radians = 20 * Math.PI / 180;
  const course = {
    start: { x: 0, y: 10, z: 30 },
    lights: [{ x: 0, y: 10, z: 0 },
      { x: 10 * Math.sin(radians), y: 10, z: -10 * Math.cos(radians) },
      { x: 10 * Math.sin(radians), y: 10, z: -10 * Math.cos(radians) - 30 }],
    exit: { x: 10 * Math.sin(radians), y: 10, z: -10 * Math.cos(radians) - 60 },
  };
  const result = validateCourse(course);
  const shared = result.segments[1];
  assert.ok(shared.entryTangentDistance < shared.horizontalDistance);
  assert.ok(shared.exitTangentDistance < shared.horizontalDistance);
  assert.ok(result.turns.every(turn => turn.collectable));
  assert.ok(shared.requiredDistance > shared.horizontalDistance);
  assert.equal(shared.distanceValid, false);
  assert.equal(result.valid, false);
});

test('a rounded corner must collect its light even if its adjoining lines are long enough', () => {
  const course = {
    start: { x: 0, y: 10, z: 80 },
    lights: [{ x: 0, y: 10, z: 0 }, { x: 80, y: 10, z: 0 }, { x: 100, y: 10, z: 0 }],
    exit: { x: 110, y: 10, z: 0 },
  };
  const result = validateCourse(course);
  assert.ok(result.segments.every(segment => segment.distanceValid));
  assert.equal(result.turns[0].collectable, false);
  assert.equal(result.valid, false);
});

test('radius follows the low-speed denominator and the existing maximum yaw rate', () => {
  near(validateCourse(COURSE, { speed: 4 }).turnRadius, 4 * 6 / (3 * Math.tan(Math.PI / 6)));
  near(validateCourse(COURSE, { speed: 8, bankDegrees: 89 }).turnRadius, 8 / 0.8);
  assert.ok(validateCourse(COURSE, { speed: 12 }).turnRadius > validateCourse(COURSE).turnRadius);
});

test('height, stage bounds, and initial north heading are checked instead of silently ignored', () => {
  const steep = copy();
  steep.lights[1].y = steep.lights[0].y + 10.01;
  const steepResult = validateCourse(steep);
  assert.equal(steepResult.valid, false);
  assert.equal(steepResult.segments[1].heightValid, false);
  for (const [axis, value] of [['x', 110.01], ['z', -110.01], ['y', 1.99], ['y', 45.01]]) {
    const course = copy();
    course.exit[axis] = value;
    assert.equal(validateCourse(course).valid, false, `${axis}=${value}`);
  }
  const wrongHeading = copy();
  wrongHeading.start.x = -1;
  const result = validateCourse(wrongHeading);
  assert.equal(result.valid, false);
  assert.ok(result.initialHeadingChangeDegrees > 0);
  assert.equal(result.segments[0].valid, false);
});

test('malformed courses and nonfinite point coordinates never pass', () => {
  for (const course of [undefined, null, {}, [], { ...COURSE, lights: [] },
    { ...COURSE, lights: [...COURSE.lights, COURSE.exit] }, { ...COURSE, start: null },
    { ...COURSE, exit: { x: '12', y: 16, z: -96 } }]) {
    const result = validateCourse(course);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  }
  for (const index of ['start', 'exit', 0, 1, 2]) {
    for (const axis of ['x', 'y', 'z']) for (const value of [NaN, Infinity, -Infinity, undefined]) {
      const course = copy();
      (typeof index === 'number' ? course.lights[index] : course[index])[axis] = value;
      assert.equal(validateCourse(course).valid, false);
    }
  }
});

test('coincident, nearly coincident, vertical-only, repeated, and reversed routes fail', () => {
  for (const point of [{ ...COURSE.lights[0] }, { ...COURSE.lights[0], y: 18 },
    { ...COURSE.lights[0], x: 1e-12 }]) {
    const course = copy();
    course.lights[1] = point;
    assert.equal(validateCourse(course).valid, false);
  }
  const repeated = copy();
  repeated.exit = { ...repeated.start };
  assert.equal(validateCourse(repeated).valid, false);
  const reversed = {
    start: { x: 0, y: 10, z: 26 },
    lights: [{ x: 0, y: 10, z: 0 }, { x: 0, y: 10, z: 10 }, { x: 0, y: 10, z: 20 }],
    exit: { x: 0, y: 10, z: 30 },
  };
  const result = validateCourse(reversed);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.includes('reverses direction')));
});

test('invalid flight conditions cannot create a zero, negative, or nonfinite passing radius', () => {
  for (const options of [null, [], 8, '30']) assert.equal(validateCourse(COURSE, options).valid, false);
  for (const speed of [0, -1, NaN, Infinity, -Infinity, '8']) {
    assert.equal(validateCourse(COURSE, { speed }).valid, false);
  }
  for (const bankDegrees of [0, -30, 90, 180, NaN, Infinity, '30', Number.MIN_VALUE]) {
    assert.equal(validateCourse(COURSE, { bankDegrees }).valid, false);
  }
  for (const gravity of [0, -3, NaN, Infinity, '3', Number.MIN_VALUE]) {
    assert.equal(validateCourse(COURSE, { gravity }).valid, false);
  }
});

test('validation does not mutate the caller course or conditions', () => {
  const course = copy();
  const before = structuredClone(course);
  const conditions = Object.freeze({ speed: 8, bankDegrees: 30, gravity: 3 });
  assert.equal(validateCourse(course, conditions).valid, true);
  assert.deepEqual(course, before);
  assert.deepEqual(conditions, { speed: 8, bankDegrees: 30, gravity: 3 });
});
