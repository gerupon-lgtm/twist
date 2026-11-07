import * as THREE from 'three';

const HALO_QUAD_PIXELS = 84;
// The yellow stroke spans 110 of the 128 texture pixels (over 72 CSS pixels).
// Keep this conservative minimum below the antialiased outer edge.
const HALO_RING_MIN_PIXELS = 68;

export function createExitBeacon({ altitude = 14 } = {}) {
  const group = new THREE.Group();
  group.name = 'assisted-exit';
  group.visible = false;
  const materialOptions = {
    transparent: true, depthTest: false, depthWrite: false, fog: false,
  };
  const material = new THREE.MeshBasicMaterial({ ...materialOptions, color: 0xffed7a, opacity: .32 });
  const whiteMaterial = new THREE.MeshBasicMaterial({ ...materialOptions, color: 0xffffff, opacity: .24 });
  const ringGeometry = new THREE.TorusGeometry(3.1, .24, 10, 64);
  const trimGeometry = new THREE.TorusGeometry(2.78, .065, 8, 64);
  const rings = Array.from({ length: 3 }, (_, index) => {
    const ring = new THREE.Group();
    const yellow = new THREE.Mesh(ringGeometry, material);
    const white = new THREE.Mesh(trimGeometry, whiteMaterial);
    yellow.renderOrder = 10;
    white.renderOrder = 11;
    ring.add(yellow, white);
    if (index === 1) ring.rotation.y = Math.PI / 2;
    if (index === 2) ring.rotation.x = Math.PI / 2;
    group.add(ring);
    return ring;
  });

  // The group is placed at the exit altitude by stage.js. Local coordinates
  // therefore put the beam's bottom at ground level and its top above the exit.
  const columnTop = Math.max(50, altitude + 32);
  const column = new THREE.Group();
  column.name = 'exit-column';
  column.position.y = columnTop / 2 - altitude;
  const columnMaterial = new THREE.MeshBasicMaterial({ ...materialOptions, color: 0xffe44f, opacity: .2 });
  const columnCoreMaterial = new THREE.MeshBasicMaterial({ ...materialOptions, color: 0xfff7cb, opacity: .8 });
  const columnGlow = new THREE.Mesh(new THREE.CylinderGeometry(.38, .55, columnTop, 12), columnMaterial);
  const columnCore = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, columnTop, 12), columnCoreMaterial);
  columnGlow.renderOrder = 8;
  columnCore.renderOrder = 9;
  column.add(columnGlow, columnCore);
  column.visible = false;
  group.add(column);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  context.beginPath();
  context.arc(64, 64, 48, 0, Math.PI * 2);
  context.strokeStyle = '#78520c';
  context.lineWidth = 20;
  context.stroke();
  context.strokeStyle = '#ffe44f';
  context.lineWidth = 14;
  context.stroke();
  context.beginPath();
  context.arc(64, 64, 42, 0, Math.PI * 2);
  context.strokeStyle = '#ffffff';
  context.lineWidth = 4;
  context.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    ...materialOptions, map: texture, sizeAttenuation: false,
  }));
  halo.name = 'exit-screen-halo';
  halo.renderOrder = 12;
  halo.visible = false;
  group.add(halo);

  let open = false;
  let assisted = false;
  let disposed = false;
  return {
    group,
    update({ visible, unlocked, time = 0, fov = 64, height = 844 }) {
      assisted = Boolean(visible);
      open = Boolean(unlocked);
      group.visible = assisted;
      column.visible = halo.visible = assisted && open;
      const pulse = (1 + Math.sin(time * 4)) / 2;
      for (const ring of rings) ring.scale.setScalar(open ? 1 + .06 * pulse : 1);
      material.color.setHex(open ? 0xffed7a : 0x827a56);
      whiteMaterial.color.setHex(open ? 0xffffff : 0xa39976);
      material.opacity = open ? .78 + .22 * pulse : .32;
      whiteMaterial.opacity = open ? .75 + .25 * pulse : .24;
      columnMaterial.opacity = .15 + .12 * pulse;
      columnCoreMaterial.opacity = .65 + .25 * pulse;
      // With sizeAttenuation disabled, this projection factor keeps the sprite
      // at least 84 CSS pixels wide at every distance and camera field of view.
      const size = HALO_QUAD_PIXELS * (open ? 1 + .04 * pulse : 1)
        * 2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2) / Math.max(1, height);
      halo.scale.set(size, size, 1);
      halo.material.opacity = 1;
    },
    snapshot: () => ({
      assisted, open, rings: assisted ? 3 : 1,
      color: assisted ? (open ? '#ffed7a' : '#827a56') : null,
      minPixels: assisted && open ? HALO_RING_MIN_PIXELS : 0,
      column: assisted && open, columnTop,
    }),
    // stage.js collects and disposes shared geometries/materials by identity.
    // Texture maps are not covered by that traversal, so this factory owns it.
    dispose() {
      if (disposed) return;
      disposed = true;
      texture.dispose();
    },
  };
}
