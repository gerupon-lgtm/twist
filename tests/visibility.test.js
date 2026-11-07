import assert from 'node:assert/strict';
import test from 'node:test';
import { computeFieldOfView, projectEdgeTarget } from '../src/visibility.js';

const near = (actual, expected, tolerance = 1e-8) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be ${expected}`);
};
const defaults = { width: 400, height: 800, verticalFov: 90,
  bounds: { left: 40, top: 100, right: 360, bottom: 650 } };
const project = (target, overrides = {}) => projectEdgeTarget({ ...defaults, ...overrides, target });
const finite = (result) => {
  for (const key of ['x', 'y', 'rotation']) assert.ok(Number.isFinite(result[key]), `${key} must be finite`);
  for (const key of ['visible', 'behind', 'inView']) assert.equal(typeof result[key], 'boolean');
};
const onEdge = (point, bounds) => {
  assert.ok(point.x >= bounds.left - 1e-8 && point.x <= bounds.right + 1e-8);
  assert.ok(point.y >= bounds.top - 1e-8 && point.y <= bounds.bottom + 1e-8);
  assert.ok([point.x - bounds.left, point.x - bounds.right, point.y - bounds.top,
    point.y - bounds.bottom].some((value) => Math.abs(value) < 1e-8));
};

test('assisted portrait gives 45-degree horizontal coverage while classic keeps vertical 64', () => {
  const assisted = computeFieldOfView(390, 844);
  const classic = computeFieldOfView(390, 844, 'classic');
  near(assisted.horizontal, 45);
  assert.ok(assisted.vertical > 64 && assisted.vertical < 100);
  near(classic.vertical, 64);
  assert.ok(classic.horizontal > 31 && classic.horizontal < 33);
  // A horizontal extent of ±tan(22.5°)*10m is a 45° camera frustum.
  const halfWidthAtTen = Math.tan(assisted.horizontal * Math.PI / 360) * 10;
  near(halfWidthAtTen, 4.14213562373095);
});

test('landscape keeps the previous camera and extremely narrow screens respect the 100-degree cap', () => {
  assert.deepEqual(computeFieldOfView(844, 390), computeFieldOfView(844, 390, 'classic'));
  near(computeFieldOfView(844, 390).vertical, 64);
  const narrow = computeFieldOfView(1, 1000);
  near(narrow.vertical, 100);
  assert.ok(narrow.horizontal < 45 && narrow.horizontal > 0);
});

test('invalid and extreme field-of-view dimensions always give finite angles', () => {
  for (const [width, height] of [[0, 0], [-1, 800], [390, NaN], [Infinity, 800],
    [undefined, undefined], [Number.MAX_VALUE, Number.MIN_VALUE], [Number.MIN_VALUE, Number.MAX_VALUE]]) {
    const fov = computeFieldOfView(width, height);
    assert.ok(Number.isFinite(fov.vertical) && Number.isFinite(fov.horizontal));
    assert.ok(fov.vertical >= 64 && fov.vertical <= 100);
    assert.ok(fov.horizontal >= 0 && fov.horizontal <= 180);
  }
});

test('front targets inside the allowed rectangle hide the edge marker and report in-view', () => {
  for (const [target, x, y] of [[{ x: 0, y: 0, z: -10 }, 200, 400],
    [{ x: 1, y: 1, z: -10 }, 240, 360], [{ x: 4, y: 0, z: -10 }, 360, 400]]) {
    const point = project(target);
    finite(point);
    assert.equal(point.visible, false);
    assert.equal(point.inView, true);
    assert.equal(point.behind, false);
    near(point.x, x);
    near(point.y, y);
  }
});

test('front right/left/up/down point at the correct allowed edge from actual screen center', () => {
  for (const [target, x, y, rotation] of [
    [{ x: 10, y: 0, z: -10 }, 360, 400, 90],
    [{ x: -10, y: 0, z: -10 }, 40, 400, 270],
    [{ x: 0, y: 10, z: -10 }, 200, 100, 0],
    [{ x: 0, y: -10, z: -10 }, 200, 650, 180],
  ]) {
    const point = project(target);
    assert.equal(point.visible, true);
    assert.equal(point.inView, false);
    assert.equal(point.behind, false);
    near(point.x, x);
    near(point.y, y);
    near(point.rotation, rotation);
  }
});

test('diagonal edge marker preserves the projected target ray rather than rectangle-center direction', () => {
  const diagonal = project({ x: 20, y: 10, z: -10 });
  near(diagonal.x, 360);
  near(diagonal.y, 320);
  near(diagonal.rotation, 63.43494882292201);
  onEdge(diagonal, defaults.bounds);
});

test('behind targets retain their physical left/right and elevation instead of mirroring', () => {
  const right = project({ x: 1, y: 0, z: 1 });
  const left = project({ x: -1, y: 0, z: 1 });
  near(right.x, 360);
  near(right.rotation, 90);
  near(left.x, 40);
  near(left.rotation, 270);
  for (const point of [right, left]) {
    assert.equal(point.behind, true);
    assert.equal(point.visible, true);
    assert.equal(point.inView, false);
  }
  const raised = project({ x: 1, y: 1, z: 1 });
  const lowered = project({ x: 1, y: -1, z: 1 });
  assert.ok(raised.y < 400 && raised.rotation < 90);
  assert.ok(lowered.y > 400 && lowered.rotation > 90);
});

test('exactly behind and tiny changes around it keep a stable right marker', () => {
  for (const x of [-0.01, -0, 0, 0.01]) {
    const point = project({ x, y: 0, z: 1 });
    near(point.x, 360);
    near(point.y, 400);
    near(point.rotation, 90);
    assert.equal(point.behind, true);
  }
});

test('quarter-roll camera coordinates rotate the marker with the visible target', () => {
  near(project({ x: 10, y: 0, z: -10 }).rotation, 90);
  near(project({ x: 0, y: 10, z: -10 }).rotation, 0);
  near(project({ x: -10, y: 0, z: -10 }).rotation, 270);
  near(project({ x: 0, y: -10, z: -10 }).rotation, 180);
});

test('resizing the viewport can return the same physical target to view and clear the marker', () => {
  const target = { x: 7, y: 0, z: -10 };
  const portraitInput = { width: 390, height: 844, verticalFov: computeFieldOfView(390, 844).vertical,
    bounds: { left: 20, top: 20, right: 370, bottom: 824 } };
  const landscapeInput = { width: 844, height: 390, verticalFov: computeFieldOfView(844, 390).vertical,
    bounds: { left: 20, top: 20, right: 824, bottom: 370 } };
  const portrait = project(target, portraitInput);
  const landscape = project(target, landscapeInput);
  assert.equal(portrait.visible, true);
  assert.equal(landscape.visible, false);
  assert.equal(landscape.inView, true);
  assert.deepEqual(project(target, portraitInput), portrait);
  assert.equal(project({ x: 0, y: 0, z: -10 }, portraitInput).visible, false);
});

test('a craft-overlapping candidate moves to the nearest clear corner without changing the arrow', () => {
  const avoid = { left: 340, top: 370, right: 380, bottom: 430 };
  const ordinary = project({ x: 10, y: 0, z: -10 });
  const avoided = project({ x: 10, y: 0, z: -10 }, { avoid });
  near(avoided.x, 360);
  near(avoided.y, 650);
  near(avoided.rotation, ordinary.rotation);
  assert.equal(avoided.visible, true);
  onEdge(avoided, defaults.bounds);
  assert.deepEqual(project({ x: -10, y: 0, z: -10 }, { avoid }), project({ x: -10, y: 0, z: -10 }));
});

test('bounds outside the screen center still produce finite internal edge points', () => {
  const bounds = { left: 260, top: 100, right: 380, bottom: 300 };
  for (const target of [{ x: 10, y: 10, z: -10 }, { x: 10, y: 0, z: -10 },
    { x: 0, y: 10, z: -10 }, { x: 0, y: 0, z: -10 }, { x: -1, y: 0, z: 1 }]) {
    const point = project(target, { bounds });
    finite(point);
    assert.equal(point.visible, true);
    onEdge(point, bounds);
  }
  const entering = project({ x: 10, y: 10, z: -10 }, { bounds });
  near(entering.x, 300);
  near(entering.y, 300);
});

test('tiny viewports and rectangles completely covered by the craft fail to finite non-visible output', () => {
  const point = project({ x: 10, y: 0, z: -10 }, { width: 120, height: 120,
    bounds: { left: 55, top: 55, right: 65, bottom: 65 },
    avoid: { left: 50, top: 50, right: 70, bottom: 70 } });
  finite(point);
  assert.equal(point.visible, false);
  assert.equal(point.inView, false);
  const tiny = project({ x: 1, y: 0, z: -1 }, { width: 1, height: 1,
    bounds: { left: 0.1, top: 0.1, right: 0.9, bottom: 0.9 } });
  finite(tiny);
  assert.equal(tiny.visible, true);
});

test('invalid target, viewport, projection, or bounds return finite hidden results', () => {
  const invalidCalls = [undefined, {}, { ...defaults, target: null },
    { ...defaults, target: { x: 0, y: 0, z: 0 } },
    { ...defaults, target: { x: NaN, y: 0, z: -1 } },
    { ...defaults, target: { x: 0, y: Infinity, z: -1 } },
    ...[0, -1, NaN, Infinity].map((width) => ({ ...defaults, width, target: { x: 1, y: 0, z: -1 } })),
    ...[0, 180, NaN, Infinity].map((verticalFov) => ({ ...defaults, verticalFov, target: { x: 1, y: 0, z: -1 } })),
    ...[{ left: 40, top: 100, right: 30, bottom: 650 }, { left: 40, top: 100, right: 360, bottom: 100 },
      { left: NaN, top: 0, right: 360, bottom: 650 }].map((bounds) => ({ ...defaults, bounds, target: { x: 1, y: 0, z: -1 } }))];
  for (const input of invalidCalls) {
    const point = projectEdgeTarget(input);
    finite(point);
    assert.equal(point.visible, false);
    assert.equal(point.inView, false);
  }
});

test('very distant and nearly side-on finite targets remain directional and never emit infinity', () => {
  for (const target of [{ x: Number.MAX_VALUE, y: 0, z: -1 }, { x: 1, y: 1, z: -Number.MIN_VALUE },
    { x: -1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }]) {
    const point = project(target);
    finite(point);
    assert.equal(point.visible, true);
    onEdge(point, defaults.bounds);
  }
  const input = Object.freeze({ ...defaults, target: Object.freeze({ x: 10, y: 0, z: -10 }),
    bounds: Object.freeze({ ...defaults.bounds }) });
  finite(projectEdgeTarget(input));
  assert.deepEqual(input.target, { x: 10, y: 0, z: -10 });
});

import { projectRadarTarget, placeRadar, rectanglesOverlap } from '../src/radar.js';
import { normalizeVisibility } from '../src/visibility.js';

test('radar is heading-up, clamps distant goals to its rim and reports vertical differences',()=>{
 const position={x:0,y:7,z:0},target={x:0,y:10,z:-30};
 const north=projectRadarTarget({position,target,range:60});assert.equal(north.x,0);assert.equal(north.y,-.5);assert.equal(north.elevation,'above');
 const right=projectRadarTarget({position,target,heading:Math.PI/2,range:60});assert.ok(Math.abs(right.x+.5)<1e-10);assert.ok(Math.abs(right.y)<1e-10);
 const far=projectRadarTarget({position,target:{x:300,y:2,z:400},range:60});assert.ok(far.outside);assert.ok(Math.abs(Math.hypot(far.x,far.y)-1)<1e-10);assert.equal(far.elevation,'below');
 assert.equal(projectRadarTarget({position,target:{x:0,y:7.5,z:0}}).elevation,'level');
 assert.equal(projectRadarTarget({position:{x:NaN,y:0,z:0},target}),null);
 assert.equal(normalizeVisibility('legacy'),'classic');assert.equal(computeFieldOfView(390,844,'legacy').vertical,64);
});

test('radar placement avoids reserved HUD regions on phone layouts',()=>{
 for(const [width,height] of [[390,844],[360,640],[844,390]]){
  const obstacles=[{left:0,right:width,top:0,bottom:60},{left:124,right:width-12,top:80,bottom:150},{left:width>600?width-350:16,right:width-16,top:height-270,bottom:height-16}];
  const r=placeRadar({width,height,obstacles});assert.ok(r);assert.equal(r.right-r.left,100);assert.ok(!obstacles.some(o=>rectanglesOverlap(r,o)));
 }
});
