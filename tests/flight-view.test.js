import assert from 'node:assert/strict';
import test from 'node:test';
import { Euler, Quaternion } from 'three';
import { computeFlightView, advanceFlightView } from '../src/flight-view.js';

const pose = (pitch, yaw = 0, roll = 0) => new Quaternion().setFromEuler(new Euler(pitch, yaw, roll, 'YXZ'));
const down = { x: 1, y: -5.8, z: -3 };

test('low flight and nose-up descent look down without changing the physical inputs', () => {
  for (const height of [0, .01, 1, 2, 5]) {
    for (const body of [pose(.98, .4, -.54), pose(1.57), pose(2.4, -1, Math.PI)]) {
      for (const velocity of [down, { x: 0, y: 0, z: -6 }, { x: 0, y: 2, z: -5 }]) {
        const before = body.toArray();
        const vBefore = { ...velocity };
        const result = computeFlightView({ orientation: body, altitude: height, velocity, bank: .54 });
        assert.equal(result.assistance, 1);
        assert.ok(result.pitch < 0);
        assert.ok(result.offset.y > 0);
        assert.deepEqual(body.toArray(), before);
        assert.deepEqual(velocity, vBefore);
      }
    }
  }
  const highDescent = computeFlightView({ orientation: pose(1), altitude: 30, velocity: down });
  assert.equal(highDescent.assistance, 1);
  assert.ok(highDescent.pitch < 0);
});

test('high level flight retains its normal view and assistance blends continuously', () => {
  const body = pose(.4, -.8, -.3);
  const result = computeFlightView({ orientation: body, altitude: 20, velocity: { x: 0, y: 1, z: -6 } });
  assert.equal(result.assistance, 0);
  assert.ok(Math.abs(result.orientation.dot(body)) > 1 - 1e-10);
  assert.equal(result.offset.length(), 0);
  for (const height of [5, 12]) {
    const before = computeFlightView({ orientation: body, altitude: height - 1e-5 });
    const after = computeFlightView({ orientation: body, altitude: height + 1e-5 });
    assert.ok(Math.abs(before.orientation.dot(after.orientation)) > 1 - 1e-9);
  }
});

test('view math remains finite through vertical/inverted headings, unknown data and scaled quaternions', () => {
  for (const input of [undefined, {}, { orientation: { x: NaN, y: 0, z: 0, w: 1 }, altitude: Infinity },
    { orientation: pose(Math.PI), altitude: 0, velocity: { x: 0, y: 0, z: 0 } },
    { orientation: { x: 1e300, y: 1e300, z: 0, w: 1e300 }, altitude: 3, velocity: { x: Infinity, y: -1, z: NaN } }]) {
    const result = computeFlightView(input);
    assert.ok([...result.orientation.toArray(), ...result.offset.toArray(), result.pitch, result.assistance].every(Number.isFinite));
    assert.ok(Math.abs(result.orientation.length() - 1) < 1e-10);
  }
});

test('slow movement and vertical pitch cannot suddenly flip the assisted heading', () => {
  for (const speed of [.1, 1]) {
    const before = computeFlightView({ orientation: pose(.8), altitude: 1, velocity: { x: speed - 1e-5, y: -1, z: 0 } });
    const after = computeFlightView({ orientation: pose(.8), altitude: 1, velocity: { x: speed + 1e-5, y: -1, z: 0 } });
    assert.ok(Math.abs(before.orientation.dot(after.orientation)) > 1 - 1e-9);
  }
  const before = computeFlightView({ orientation: pose(Math.PI / 2 - 1e-5), altitude: 1 });
  const after = computeFlightView({ orientation: pose(Math.PI / 2 + 1e-5), altitude: 1 });
  assert.ok(Math.abs(before.orientation.dot(after.orientation)) > 1 - 1e-9);
});

test('descent assistance starts and finishes continuously at its rate thresholds', () => {
  for (const speed of [.1, .8]) {
    const args = { orientation: pose(1), altitude: 20 };
    const before = computeFlightView({ ...args, velocity: { x: 0, y: -speed + 1e-5, z: -6 } });
    const after = computeFlightView({ ...args, velocity: { x: 0, y: -speed - 1e-5, z: -6 } });
    assert.ok(Math.abs(before.orientation.dot(after.orientation)) > 1 - 1e-9);
  }
});

test('assisted view rotation and offset have independent per-second movement limits', () => {
  const current = computeFlightView({orientation:pose(1),altitude:25,velocity:{x:0,y:1,z:-6}});
  const target = computeFlightView({orientation:pose(1),altitude:25,velocity:down});
  const beforeQ=current.orientation.toArray(), beforeOffset=current.offset.toArray();
  for (const dt of [1/120,1/60,.05,.5]) {
    const next=advanceFlightView(current,target,dt);
    assert.ok(current.orientation.angleTo(next.orientation)<=Math.PI/6*dt+1e-9);
    assert.ok(current.offset.distanceTo(next.offset)<=3*dt+1e-9);
    assert.ok(next.orientation.angleTo(target.orientation)<current.orientation.angleTo(target.orientation));
  }
  assert.deepEqual(current.orientation.toArray(),beforeQ);
  assert.deepEqual(current.offset.toArray(),beforeOffset);
});

test('view initialization snaps only at initialization and invalid time never advances it', () => {
  const target=computeFlightView({altitude:0,velocity:down});
  const initial=advanceFlightView(null,target,0);
  assert.ok(initial.orientation.angleTo(target.orientation)<1e-9);
  assert.notEqual(initial.orientation,target.orientation);
  const current=computeFlightView({altitude:20,orientation:pose(1)});
  for(const dt of [0,-1,NaN,Infinity]) {
    const next=advanceFlightView(current,target,dt);
    assert.ok(next.orientation.angleTo(current.orientation)<1e-9);
    assert.equal(next.offset.distanceTo(current.offset),0);
  }
});
