import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createExitBeacon } from '../src/exit-beacon.js';

function makeBeacon(options) {
  const previous = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      width: 0, height: 0,
      getContext: () => ({ beginPath() {}, arc() {}, stroke() {} }),
    }),
  };
  try {
    return createExitBeacon(options);
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
}

test('the dedicated exit stays subdued until open and hides completely in legacy view', () => {
  const beacon = makeBeacon();
  beacon.update({ visible: true, unlocked: false });
  assert.deepEqual(beacon.snapshot(), {
    assisted: true, open: false, rings: 3, color: '#827a56',
    minPixels: 0, column: false, columnTop: 50,
  });
  assert.equal(beacon.group.getObjectByName('exit-column').visible, false);
  assert.equal(beacon.group.getObjectByName('exit-screen-halo').visible, false);
  beacon.update({ visible: true, unlocked: true });
  assert.equal(beacon.snapshot().minPixels, 68);
  assert.equal(beacon.group.getObjectByName('exit-column').visible, true);
  beacon.update({ visible: false, unlocked: true });
  assert.equal(beacon.group.visible, false);
  assert.equal(beacon.snapshot().rings, 1);
  assert.equal(beacon.snapshot().minPixels, 0);
});

test('the beam reaches from ground to well above the portal at different altitudes', () => {
  for (const altitude of [10, 14, 35]) {
    const beacon = makeBeacon({ altitude });
    const column = beacon.group.getObjectByName('exit-column');
    const columnHeight = column.children[0].geometry.parameters.height;
    assert.equal(altitude + column.position.y - columnHeight / 2, 0);
    assert.equal(altitude + column.position.y + columnHeight / 2, beacon.snapshot().columnTop);
    assert.ok(beacon.snapshot().columnTop >= 45);
    assert.ok(beacon.snapshot().columnTop > altitude);
  }
});

test('the whole portal pulses, keeps a minimum screen size and ignores scenery depth', () => {
  const beacon = makeBeacon();
  const halo = beacon.group.getObjectByName('exit-screen-halo');
  const ring = beacon.group.children[0];
  const column = beacon.group.getObjectByName('exit-column');
  const projection = 2 * Math.tan(THREE.MathUtils.degToRad(84) / 2) / 256;
  beacon.update({ visible: true, unlocked: true, time: 3 * Math.PI / 8, fov: 84, height: 256 });
  assert.ok(Math.abs(halo.scale.x / projection - 84) < 1e-10);
  assert.equal(halo.material.opacity, 1);
  const faintColumn = column.children[0].material.opacity;
  beacon.update({ visible: true, unlocked: true, time: Math.PI / 8, fov: 84, height: 256 });
  assert.ok(ring.scale.x > 1);
  assert.ok(halo.scale.x / projection >= 84);
  assert.ok(column.children[0].material.opacity > faintColumn);
  beacon.group.traverse((object) => {
    if (!object.material) return;
    assert.equal(object.material.depthTest, false);
    assert.equal(object.material.depthWrite, false);
  });
});

test('factory disposal releases its texture once and leaves shared resources to the stage', () => {
  const beacon = makeBeacon();
  const halo = beacon.group.getObjectByName('exit-screen-halo');
  const ring = beacon.group.children[0].children[0];
  let textures = 0;
  let geometries = 0;
  let materials = 0;
  halo.material.map.addEventListener('dispose', () => textures++);
  ring.geometry.addEventListener('dispose', () => geometries++);
  ring.material.addEventListener('dispose', () => materials++);
  beacon.dispose();
  beacon.dispose();
  assert.equal(textures, 1);
  assert.equal(geometries, 0);
  assert.equal(materials, 0);
});
