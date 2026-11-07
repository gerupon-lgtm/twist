import * as THREE from 'three';

/** Original, procedural twin-engine jet. Nose -Z, right +X, top +Y; no external assets. */
export function createAircraft() {
  const group = new THREE.Group(); group.name = 'original-twin-jet';
  const pale = new THREE.MeshStandardMaterial({ color: 0xe4e8e9, roughness: .55, metalness: .2 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x263d50, roughness: .65, metalness: .3 });
  const canopy = new THREE.MeshStandardMaterial({ color: 0x305869, roughness: .2, metalness: .55 });
  const nozzle = new THREE.MeshStandardMaterial({ color: 0x101f2b, roughness: .6, metalness: .6 });
  const flame = new THREE.MeshBasicMaterial({ color: 0x93e5ff, transparent: true, opacity: .8, depthWrite: false });
  const mesh = (geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const item = new THREE.Mesh(geometry, material); item.position.set(x, y, z); item.scale.set(sx, sy, sz);
    group.add(item); return item;
  };
  mesh(new THREE.SphereGeometry(1, 12, 8), pale, 0, 0, -.15, .38, .3, 2.05);
  const nose = mesh(new THREE.ConeGeometry(.26, 1.5, 12), dark, 0, -.015, -2.15);
  nose.rotation.x = -Math.PI / 2;
  mesh(new THREE.SphereGeometry(1, 12, 8), canopy, 0, .31, -1.05, .23, .23, .66);
  function plate(points, material, y = 0) {
    const shape = new THREE.Shape(points.map(([x,z]) => new THREE.Vector2(x,-z)));
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: .075, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2); geometry.translate(0, y, 0);
    group.add(new THREE.Mesh(geometry, material));
  }
  for (const side of [-1,1]) {
    plate([[side*.2,-1.8],[side*.65,-.75],[side*.82,.65],[side*.25,.8]], pale, .02);
    plate([[side*.35,-.7],[side*2.05,.85],[side*1.9,1.3],[side*.45,.9]], pale);
    plate([[side*.35,1.15],[side*1.25,1.85],[side*1.05,2.1],[side*.32,1.85]], dark, .1);
    const engine = mesh(new THREE.CylinderGeometry(.29,.32,2.6,12), pale, side*.42,-.16,.62);
    engine.rotation.x = Math.PI / 2;
    const port = mesh(new THREE.CylinderGeometry(.24,.29,.38,12,1,true), nozzle, side*.42,-.16,2.05);
    port.rotation.x = Math.PI / 2;
    const finShape = new THREE.Shape([new THREE.Vector2(-.75,0),new THREE.Vector2(-1.3,.95),
      new THREE.Vector2(-1.7,1.1),new THREE.Vector2(-2.05,.05)]);
    const fin = mesh(new THREE.ExtrudeGeometry(finShape,{depth:.07,bevelEnabled:false}),dark,side*.43,.05,0);
    fin.rotation.y = Math.PI / 2; fin.rotateX(side * .18);
  }
  const exhaust = [-1,1].map(side => {
    const item = mesh(new THREE.ConeGeometry(.2,1,10),flame,side*.42,-.16,2.25);
    item.rotation.x = Math.PI / 2; return item;
  });
  let power = 0;
  function setPower(value) {
    power = THREE.MathUtils.clamp(Number.isFinite(value) ? value : 0,0,1);
    flame.opacity = .3 + .65 * power;
    exhaust.forEach(item => { item.visible = power > 0; item.scale.y = .15 + 1.35*power;
      item.position.z = 2.2 + item.scale.y / 2; });
  }
  setPower(0);
  return { group, setPower, diagnostics: () => ({ engines: 2, power, exhaustVisible: power > 0,
    exhaustLength: power > 0 ? .15+1.35*power : 0, exhaustOpacity: power > 0 ? flame.opacity : 0 }) };
}
