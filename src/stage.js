import {createAfterburnerState,advanceAfterburner,awardAfterburner,stopAfterburner,observeAfterburnerSpeed} from './afterburner.js';
import {createSpeedEffects,speedPresentation} from './speed-effects.js';
import * as THREE from 'three';
import { FLIGHT_MODEL, stepFlightVelocity } from './flight-physics.js';
import { computeFieldOfView, normalizeVisibility } from './visibility.js';
import { computeFlightView, advanceFlightView } from './flight-view.js';
import { advanceDisplayRoll, flightDisplayPose, withoutViewRoll } from './flight-display.js';
import { advanceChaseAngles, bodyViewAngles, chaseView, normalizeCameraMode } from './flight-camera.js';
import { createAircraft } from './aircraft.js';
import { createScenery } from './scenery.js';
import { createGroundPattern } from './ground-pattern.js';
import { abLaneStatus } from './ab-straight.js';
import { createExitBeacon } from './exit-beacon.js';
import { COURSE } from './course.js';
import { FLIGHT_TURN, normalizeTurnGravity, flightYawForBank, applyHorizontalTurn } from './flight-turn.js';
import { STAGE_HALF_EXTENT, stageBoundaryStatus } from './boundary.js';
import { createStageBoundary } from './stage-boundary.js';
import { DIRECTION_LANDMARKS } from './arena.js';

const COLLECT_RADIUS = 3.2;
const EXIT_RADIUS = 4;
const SKY = 0xdcebf1;
const MAX_BANK = THREE.MathUtils.degToRad(40);
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;

/** Fixed camera/craft pivot; the world moves, and sensor compensation turns the craft. */
export function createStage(canvas, { visibility = 'assisted', display = 'bank', cameraMode = 'overlay', course = COURSE, turnGravity:initialTurnGravity=FLIGHT_TURN.defaultGravity } = {}) {
  const layout=course&&Array.isArray(course.lights)&&course.lights.length>=3?course:COURSE;
  const START=new THREE.Vector3(layout.start.x,layout.start.y,layout.start.z);
  const BEACONS=layout.lights.map(p=>new THREE.Vector3(p.x,p.y,p.z));
  const EXIT=new THREE.Vector3(layout.exit.x,layout.exit.y,layout.exit.z);
  let turnGravity=normalizeTurnGravity(initialTurnGravity),turnBankLimit=40,arenaTime=0;
  cameraMode = normalizeCameraMode(cameraMode);
  display = display === 'fixed' ? 'fixed' : 'bank';
  visibility = normalizeVisibility(visibility);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
  } catch {
    throw new Error('3D画面を開けませんでした。WebGL 2が使えるブラウザで開き直してください。');
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;
  renderer.setClearColor(SKY, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 220, 1100);
  const camera = new THREE.PerspectiveCamera(64, 1, 0.1, 250);
  // Both cameras remain fixed for the entire simulation.
  const world = new THREE.Group();
  scene.add(world);
  const scenery=createScenery({halfExtent:STAGE_HALF_EXTENT,avoidPoints:[layout.start,...layout.lights,layout.exit],
    coursePoints:[layout.start,...layout.lights,layout.exit],abStraights:layout.abStraights});world.add(scenery.group);
  const airflow=createSpeedEffects();camera.add(airflow.group);scene.add(camera);
  const boundaryVisual=createStageBoundary({halfExtent:STAGE_HALF_EXTENT});world.add(boundaryVisual.group);
  scene.add(new THREE.HemisphereLight(0xf4fcff, 0x7896a2, 2.4));
  const sun = new THREE.DirectionalLight(0xfff8e7, 2.6);
  sun.position.set(-35, 65, 30);
  scene.add(sun);

  const stone = new THREE.MeshStandardMaterial({ color: 0xf4f5f0, roughness: 0.95 });
  const stoneSide = new THREE.MeshStandardMaterial({ color: 0xb8cbd0, roughness: 1 });
  const blueStone = new THREE.MeshStandardMaterial({ color: 0xc7dce1, roughness: 0.9 });
  // Warm earth colors stay distinct from the blue sky, including at distance.
  const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x9a502f, fog: false });
  const groundTileMaterial = new THREE.MeshBasicMaterial({ color: 0xbf7742, fog: false });
  const groundMarkMaterial = new THREE.MeshBasicMaterial({ color: 0xf1c88b, fog: false });
  const gold = new THREE.MeshBasicMaterial({ color: 0xe3a139 });
  const core = new THREE.MeshBasicMaterial({ color: 0xfff4c0 });
  const guide = new THREE.MeshBasicMaterial({ color: 0x117f97 });
  const dimGuide = new THREE.MeshBasicMaterial({ color: 0x8ebfc5 });
  const unitBox = new THREE.BoxGeometry(1, 1, 1);

  function box(parent, x, y, z, width, height, depth, material = stone) {
    const mesh = new THREE.Mesh(unitBox, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(width, height, depth);
    parent.add(mesh);
    return mesh;
  }

  // Stage directions, independent of the phone's compass. Hollow silhouettes
  // and distant placement leave the nearer golden objectives unobstructed.
  // This entire group is hidden in classic, keeping the old composition.
  const directionLandmarks = new THREE.Group();
  directionLandmarks.name = 'assisted-direction-landmarks';
  world.add(directionLandmarks);
  function polygon(points) {
    const shape = new THREE.Shape();
    points.forEach(([x, y], index) => index === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y));
    shape.closePath();
    return shape;
  }
  for (const landmark of DIRECTION_LANDMARKS) {
    let shape;
    let landmarkHeight = 28;
    if (landmark.shape === 'triangle') {
      landmarkHeight = 30;
      shape = polygon([[-5.5, 0], [0, 30], [5.5, 0]]);
      shape.holes.push(polygon([[-3.5, 1.5], [3.5, 1.5], [0, 22.5]]));
    } else if (landmark.shape === 'square') {
      shape = polygon([[-5, 0], [5, 0], [5, 28], [-5, 28]]);
      shape.holes.push(polygon([[-3.4, 1.6], [-3.4, 26.4], [3.4, 26.4], [3.4, 1.6]]));
    } else if (landmark.shape === 'diamond') {
      shape = polygon([[0, 0], [5.5, 14], [0, 28], [-5.5, 14]]);
      shape.holes.push(polygon([[0, 4], [-3.6, 14], [0, 24], [3.6, 14]]));
    } else {
      shape = new THREE.Shape();
      shape.moveTo(-6, 0);
      shape.lineTo(-6, 22);
      shape.absarc(0, 22, 6, Math.PI, 0, true);
      shape.lineTo(6, 0);
      shape.lineTo(4.4, 0);
      shape.lineTo(4.4, 22);
      shape.absarc(0, 22, 4.4, 0, Math.PI, false);
      shape.lineTo(-4.4, 0);
      shape.closePath();
    }
    const group = new THREE.Group();
    group.name = `direction-${landmark.id}`;
    group.position.set(landmark.position.x, landmark.position.y, landmark.position.z);
    // Faces look toward the arena's center; the three-unit extrusion also
    // gives the landmark a silhouette when approached from an oblique angle.
    if (landmark.id === 'east') group.rotation.y = -Math.PI / 2;
    else if (landmark.id === 'south') group.rotation.y = Math.PI;
    else if (landmark.id === 'west') group.rotation.y = Math.PI / 2;
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 3, steps: 1, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12,
      bevelSegments: 1, curveSegments: 16,
    });
    geometry.translate(0, -landmarkHeight / 2, -1.5);
    const material = new THREE.MeshBasicMaterial({ color: landmark.color, fog: false });
    group.add(new THREE.Mesh(geometry, material));
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25),
      new THREE.LineBasicMaterial({ color: 0xeaf4f7, fog: false, transparent: true, opacity: 0.72 }));
    group.add(edges);
    box(group, 0, -landmarkHeight / 2 - 0.6, 0, 12.6, 1, 5, stone);
    directionLandmarks.add(group);
  }

  // A finite floating island, its perimeter, and neighboring islands give height
  // and translation a visible reference without texture downloads.
  const island = new THREE.Mesh(new THREE.CylinderGeometry(84, 77, 6, 64), stoneSide);
  island.position.set(0, -3.1, -24);
  island.scale.z = 1.1;
  world.add(island);
  const islandTop = new THREE.Mesh(new THREE.CircleGeometry(83.8, 64), groundMaterial);
  islandTop.name = 'ground-surface';
  islandTop.rotation.x = -Math.PI / 2;
  islandTop.position.set(0, 0, -24);
  islandTop.scale.y = 1.1;
  world.add(islandTop);

  // The safety floor is conceptually Y=0 throughout the reachable square.
  // This outer sheet sits eight centimeters lower only to avoid coplanar
  // flicker with the existing island. It does not change collision/height math.
  const outerGround = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), groundMaterial);
  outerGround.name = 'ground-outer-surface';
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.08;
  world.add(outerGround);
  const groundPattern=createGroundPattern({maxAnisotropy:renderer.capabilities.getMaxAnisotropy()});
  groundPattern.applyWorldUV(islandTop);groundPattern.applyWorldUV(outerGround);
  // New cameras have a true level horizon beyond the finite stage mesh.
  // Center this background hemisphere on the eye; its equator is world Y=0.
  const horizonBackdrop = new THREE.Mesh(new THREE.SphereGeometry(220,64,16,0,Math.PI*2,Math.PI/2,Math.PI/2),
    new THREE.MeshBasicMaterial({ color: 0x9a502f, side: THREE.BackSide, fog: false, depthWrite: false }));
  horizonBackdrop.renderOrder = -10;
  world.add(horizonBackdrop);
  const outerGridPoints = [];
  for (let offset = -700; offset <= 700; offset += 8) {
    outerGridPoints.push(offset, -0.045, -700, offset, -0.045, 700);
    outerGridPoints.push(-700, -0.045, offset, 700, -0.045, offset);
  }
  const outerGridGeometry = new THREE.BufferGeometry();
  outerGridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(outerGridPoints, 3));
  const outerGrid = new THREE.LineSegments(outerGridGeometry,
    new THREE.LineBasicMaterial({ color: 0x4a2516, transparent: true, opacity: 0.55, fog: false }));
  outerGrid.name = 'ground-outer-grid';
  world.add(outerGrid);

  const gridPoints = [];
  for (let offset = -80; offset <= 80; offset += 8) {
    const extent = Math.sqrt(83 * 83 - offset * offset);
    gridPoints.push(offset, 0.035, -24 - extent * 1.1, offset, 0.035, -24 + extent * 1.1);
    gridPoints.push(-extent, 0.035, -24 + offset * 1.1, extent, 0.035, -24 + offset * 1.1);
  }
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
  const grid = new THREE.LineSegments(gridGeometry,
    new THREE.LineBasicMaterial({ color: 0x4a2516, transparent: true, opacity: 0.7, fog: false }));
  grid.name = 'ground-grid';
  world.add(grid);

  // The broad stripe and cross marks establish forward motion at the start.
  box(world, 0, 0.025, -25, 0.15, 0.05, 106, groundMarkMaterial);
  const floorMarks = new THREE.InstancedMesh(unitBox, groundMarkMaterial, 14);
  const matrix = new THREE.Matrix4();
  const markPosition = new THREE.Vector3();
  const markScale = new THREE.Vector3(3.6, 0.04, 0.16);
  const identity = new THREE.Quaternion();
  for (let i = 0; i < 14; i += 1) {
    markPosition.set(0, 0.04, 28 - i * 8);
    matrix.compose(markPosition, identity, markScale);
    floorMarks.setMatrixAt(i, matrix);
  }
  world.add(floorMarks);

  // Four-unit paving cells give translation and distance a reference even
  // near the floor, where a bright featureless surface hid speed and height.
  // One shared low box and one draw call cover this finite island.
  const groundTilePositions = [];
  for (let tileX = -21; tileX <= 20; tileX += 1) {
    for (let tileZ = -23; tileZ <= 22; tileZ += 1) {
      if ((tileX + tileZ) % 2 !== 0) continue;
      const x = tileX * 4 + 2;
      const z = tileZ * 4 + 2;
      if (x * x + (z / 1.1) ** 2 > 80 ** 2) continue;
      groundTilePositions.push([x, z - 24]);
    }
  }
  const groundTiles = new THREE.InstancedMesh(unitBox, groundTileMaterial, groundTilePositions.length);
  groundTiles.name = 'ground-paving';
  groundTilePositions.forEach(([x, z], index) => {
    matrix.compose(markPosition.set(x, 0.012, z), identity, markScale.set(3.7, 0.02, 3.7));
    groundTiles.setMatrixAt(index, matrix);
  });
  world.add(groundTiles);

  // A world-space ground projection, not a screen-space cursor or a real
  // shadow calculation. It follows the craft's X/Z above the actual floor.
  const groundProjection = new THREE.Group();
  groundProjection.name = 'craft-ground-projection';
  groundProjection.rotation.x = -Math.PI / 2;
  const groundShadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x24170e, transparent: true, opacity: 0.18, depthWrite: false, fog: false,
  });
  const groundOutlineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe2b4, transparent: true, opacity: 0.32, depthWrite: false, fog: false,
  });
  groundProjection.add(new THREE.Mesh(new THREE.CircleGeometry(0.85, 32), groundShadowMaterial));
  groundProjection.add(new THREE.Mesh(new THREE.RingGeometry(0.96, 1.15, 32), groundOutlineMaterial));
  world.add(groundProjection);

  const columnGeometry = new THREE.CylinderGeometry(0.68, 0.85, 1, 10);
  const columnLayout = [
    [-14, 7, 15], [14, 7, 15], [-24, 13, -7], [27, 17, -12],
    [-31, 10, -31], [35, 12, -37], [-28, 17, -56], [25, 9, -70],
    [-52, 22, -18], [56, 25, -45], [-58, 15, 19], [57, 13, 9],
    [-47, 12, -83], [46, 19, -87], [-65, 10, -55], [67, 16, -10],
  ];
  const columns = new THREE.InstancedMesh(columnGeometry, stone, columnLayout.length);
  const capitals = new THREE.InstancedMesh(unitBox, stone, columnLayout.length * 2);
  for (let i = 0; i < columnLayout.length; i += 1) {
    const [x, height, z] = columnLayout[i];
    matrix.compose(markPosition.set(x, height / 2, z), identity, markScale.set(1, height, 1));
    columns.setMatrixAt(i, matrix);
    matrix.compose(markPosition.set(x, 0.35, z), identity, markScale.set(2.25, 0.7, 2.25));
    capitals.setMatrixAt(i * 2, matrix);
    matrix.compose(markPosition.set(x, height, z), identity, markScale.set(1.9, 0.65, 1.9));
    capitals.setMatrixAt(i * 2 + 1, matrix);
  }
  world.add(columns, capitals);
  box(world, -19, 13.4, -7, 12, 1.4, 2.2);
  box(world, 31, 12.5, -37, 10, 1.5, 2.4);

  // Smaller platforms have clear side faces, including two raised landmarks.
  [
    [-36, 4, 5, 13, 17], [36, 8, -18, 14, 15],
    [-34, 12, -48, 14, 12], [87, -1, -34, 17, 24],
    [-88, 1, -64, 17, 19], [54, 3, -100, 20, 12],
  ].forEach(([x, y, z, width, depth]) => {
    box(world, x, y - 1, z, width, 2, depth, stoneSide);
    box(world, x, y + 0.08, z, width + 0.35, 0.25, depth + 0.35);
  });

  // Sparse perimeter posts remain useful when flying away from the route.
  const perimeterGeometry = new THREE.CylinderGeometry(0.3, 0.45, 3, 8);
  const perimeter = new THREE.InstancedMesh(perimeterGeometry, blueStone, 36);
  for (let i = 0; i < 36; i += 1) {
    const angle = i / 36 * Math.PI * 2;
    matrix.compose(markPosition.set(Math.cos(angle) * 81, 1.5, -24 + Math.sin(angle) * 89),
      identity, markScale.set(1, 1, 1));
    perimeter.setMatrixAt(i, matrix);
  }
  world.add(perimeter);

  // Blue hexagons are landmarks, unlike the round, golden collection targets.
  // Three visible height bands continue around the island, including behind
  // the start. Shared geometry keeps these references to just one draw call.
  const landmarkMaterial = new THREE.MeshBasicMaterial({ color: 0x71aaba });
  const aerialRingMaterial = new THREE.MeshBasicMaterial({
    color: 0x92bec9, transparent: true, opacity: 0.32, depthWrite: false,
  });
  const aerialRingGeometry = new THREE.TorusGeometry(1.8, 0.045, 4, 6);
  const aerialRings = new THREE.InstancedMesh(aerialRingGeometry, aerialRingMaterial, 36);
  const landmarkRotation = new THREE.Quaternion();
  const landmarkEuler = new THREE.Euler();
  for (let band = 0; band < 3; band += 1) {
    const radius = 66 + band * 8;
    const altitude = 12 + band * 13;
    for (let index = 0; index < 8; index += 1) {
      // Offset the rings from the starting centerline: no large nearby frame
      // should surround or compete with the first golden objective.
      const angle = index / 8 * Math.PI * 2 + Math.PI / 8 + band * Math.PI / 16;
      landmarkRotation.setFromEuler(landmarkEuler.set(0, -angle - Math.PI / 2, 0));
      matrix.compose(markPosition.set(Math.cos(angle) * radius, altitude,
        -24 + Math.sin(angle) * radius), landmarkRotation, markScale.set(1, 1, 1));
      aerialRings.setMatrixAt(band * 8 + index, matrix);
    }
  }
  // Horizontal rings above the flight ceiling are visible when looking up;
  // they are scenery, never destinations the player has to reach.
  landmarkRotation.setFromEuler(landmarkEuler.set(-Math.PI / 2, 0, 0));
  for (let index = 0; index < 12; index += 1) {
    const angle = index / 12 * Math.PI * 2;
    const radius = index % 2 === 0 ? 24 : 46;
    matrix.compose(markPosition.set(Math.cos(angle) * radius, 52,
      -24 + Math.sin(angle) * radius), landmarkRotation, markScale.set(1.2, 1.2, 1.2));
    aerialRings.setMatrixAt(24 + index, matrix);
  }
  world.add(aerialRings);

  // Eight distant height staffs: longer ticks indicate higher levels. The
  // thin blue shafts link sky objects back to the pale stone arena below.
  const heightStaffs = new THREE.InstancedMesh(unitBox, landmarkMaterial, 8);
  const heightTicks = new THREE.InstancedMesh(unitBox, landmarkMaterial, 24);
  const staffCaps = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1.1), stone, 8);
  for (let index = 0; index < 8; index += 1) {
    const angle = index / 8 * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(angle) * 76;
    const z = -24 + Math.sin(angle) * 76;
    landmarkRotation.setFromEuler(landmarkEuler.set(0, -angle - Math.PI / 2, 0));
    matrix.compose(markPosition.set(x, 21, z), identity, markScale.set(0.16, 42, 0.16));
    heightStaffs.setMatrixAt(index, matrix);
    matrix.compose(markPosition.set(x, 43, z), identity, markScale.set(1, 1.6, 1));
    staffCaps.setMatrixAt(index, matrix);
    for (let band = 0; band < 3; band += 1) {
      matrix.compose(markPosition.set(x, 12 + band * 12, z), landmarkRotation,
        markScale.set(2.4 + band, 0.16, 0.16));
      heightTicks.setMatrixAt(index * 3 + band, matrix);
    }
  }
  world.add(heightStaffs, heightTicks, staffCaps);

  // Fixed-size blue points trace the changing height between objectives.
  // Perspective must never enlarge a nearby guide over a golden target/craft.
  const routePoints = [START, ...BEACONS, EXIT];
  const routeGuidePositions = [];
  for (let section = 0; section < routePoints.length - 1; section += 1) {
    for (let index = 0; index < 7; index += 1) {
      markPosition.copy(routePoints[section]).lerp(routePoints[section + 1], (index + 1) / 8);
      routeGuidePositions.push(markPosition.x, markPosition.y, markPosition.z);
    }
  }
  const routeGuideGeometry = new THREE.BufferGeometry();
  routeGuideGeometry.setAttribute('position', new THREE.Float32BufferAttribute(routeGuidePositions, 3));
  const routeGuides = new THREE.Points(routeGuideGeometry, new THREE.PointsMaterial({
    color: 0x318ca5, size: 4, sizeAttenuation: false,
    transparent: true, opacity: 0.65, depthWrite: false,
  }));
  world.add(routeGuides);

  // Pale floating fragments provide nearby parallax above the floor without
  // obscuring the main route or adding collisions to this controls prototype.
  const floatingLayout = [
    [-17, 17, 10], [22, 25, 3], [-24, 31, -16], [9, 38, -14],
    [-8, 29, -37], [31, 34, -51], [-28, 21, -72], [15, 45, -69],
    [-31, 48, 16], [33, 46, 23], [-49, 35, 33], [49, 27, -76],
  ];
  const floatingFragments = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1),
    blueStone, floatingLayout.length);
  floatingLayout.forEach(([x, y, z], index) => {
    landmarkRotation.setFromEuler(landmarkEuler.set(index * 0.3, index * 0.6, 0.2));
    matrix.compose(markPosition.set(x, y, z), landmarkRotation,
      markScale.set(0.7 + index % 3 * 0.2, 1.1, 0.7));
    floatingFragments.setMatrixAt(index, matrix);
  });
  world.add(floatingFragments);

  const ringGeometry = new THREE.TorusGeometry(1.5, 0.075, 6, 40);
  const orbGeometry = new THREE.SphereGeometry(0.43, 16, 12);
  const haloGeometry = new THREE.SphereGeometry(0.85, 16, 12);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd47a, transparent: true, opacity: 0.18, depthWrite: false,
  });
  const brightCore = new THREE.MeshBasicMaterial({ color: 0xf02b9b, fog: false });
  const brightRing = new THREE.MeshBasicMaterial({ color: 0xfffaff, fog: false });
  const brightHalo = new THREE.MeshBasicMaterial({ color: 0xff7bcb, transparent: true, opacity: .22, depthWrite: false, fog: false });
  const brightStem = new THREE.MeshBasicMaterial({ color: 0xfa69c1, transparent: true, opacity: .85, depthWrite: false, fog: false });
  const hintCanvas = document.createElement('canvas'); hintCanvas.width = hintCanvas.height = 64;
  const hintContext = hintCanvas.getContext('2d');
  hintContext.strokeStyle = '#fffaff'; hintContext.lineWidth = 9; hintContext.beginPath(); hintContext.arc(32,32,26,0,Math.PI*2); hintContext.stroke();
  hintContext.strokeStyle = '#eb228f'; hintContext.lineWidth = 3; hintContext.beginPath(); hintContext.arc(32,32,26,0,Math.PI*2); hintContext.stroke();
  const hintTexture = new THREE.CanvasTexture(hintCanvas); hintTexture.colorSpace = THREE.SRGBColorSpace;
  const beaconVisuals = BEACONS.map((position, index) => {
    const group = new THREE.Group();
    group.position.copy(position);
    const ring = new THREE.Mesh(ringGeometry, gold);
    const orb = new THREE.Mesh(orbGeometry, core);
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    group.add(ring, orb, halo);
    const hint = new THREE.Sprite(new THREE.SpriteMaterial({ map: hintTexture, transparent: true,
      depthTest: false, depthWrite: false, sizeAttenuation: false, fog: false }));
    hint.renderOrder = 8; group.add(hint);
    // Distinct tick counts let the three targets be recognized spatially.
    for (let tick = 0; tick <= index; tick += 1) {
      box(group, (tick - index / 2) * 0.42, -2.05, 0, 0.15, 0.4, 0.15, gold);
    }
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, position.y, 5),
      new THREE.MeshBasicMaterial({ color: 0xe3a139, transparent: true, opacity: 0.28 }));
    stem.userData.legacyMaterial = stem.material;
    stem.position.set(position.x, position.y / 2, position.z);
    world.add(stem, group);
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.45, 20), stone);
    pedestal.position.set(position.x, 0.25, position.z);
    world.add(pedestal);
    return { group, stem, ring, orb, halo, hint };
  });

  const exitGroup = new THREE.Group();
  exitGroup.position.copy(EXIT);
  const exitRing = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.15, 8, 48), dimGuide);
  exitGroup.add(exitRing);
  const exitVisual=createExitBeacon({altitude:EXIT.y});exitGroup.add(exitVisual.group);
  world.add(exitGroup);
  // Legacy shape is translated with the shared course, and never surrounds the assisted portal.
  const legacyExitFrame=new THREE.Group();legacyExitFrame.position.copy(EXIT);world.add(legacyExitFrame);
  box(legacyExitFrame,-4.7,-1,0,1.5,12,2);
  box(legacyExitFrame,4.7,-1,0,1.5,12,2);
  box(legacyExitFrame,0,5.7,0,11,1.5,2.2);
  box(legacyExitFrame,0,-6.7,0,12,.6,7,blueStone);

  // Separate orthographic scene: its unit is one CSS pixel. The craft pivot
  // stays centered. Its orientation only follows inverse sensor compensation,
  // independently of simulation turning, travel, and world lighting.
  const craftScene = new THREE.Scene();
  const craftCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
  craftCamera.position.z = 200;
  craftScene.add(new THREE.HemisphereLight(0xffffff, 0x527889, 2.2));
  const craftLight = new THREE.DirectionalLight(0xffffff, 2.1);
  craftLight.position.set(-40, 70, 100);
  craftScene.add(craftLight);
  const craft = new THREE.Group();
  const exploreCraft = new THREE.Group();
  craft.add(exploreCraft);
  const hullShape = new THREE.Shape();
  hullShape.moveTo(0, 24);
  hullShape.lineTo(8, -3);
  hullShape.lineTo(31, -11);
  hullShape.lineTo(30, -17);
  hullShape.lineTo(7, -12);
  hullShape.lineTo(5, -24);
  hullShape.lineTo(-5, -24);
  hullShape.lineTo(-7, -12);
  hullShape.lineTo(-30, -17);
  hullShape.lineTo(-31, -11);
  hullShape.lineTo(-8, -3);
  hullShape.closePath();
  const hullGeometry = new THREE.ExtrudeGeometry(hullShape, {
    depth: 5, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.9, bevelThickness: 0.9,
  });
  const hull = new THREE.Mesh(hullGeometry,
    new THREE.MeshStandardMaterial({ color: 0xf9fcf8, roughness: 0.52, metalness: 0.12 }));
  exploreCraft.add(hull);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(hullGeometry, 25),
    new THREE.LineBasicMaterial({ color: 0x46798b, transparent: true, opacity: 0.6 }));
  exploreCraft.add(edges);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x378ca7, roughness: 0.3, metalness: 0.2 }));
  cockpit.position.set(0, 2.5, 5.3);
  cockpit.scale.set(4, 9, 3);
  exploreCraft.add(cockpit);
  box(exploreCraft, 0, -17, 5.5, 3, 7, 1, guide);
  const overlayJet = createAircraft();
  overlayJet.group.rotation.x = Math.PI / 2;
  overlayJet.group.scale.setScalar(13);
  craft.add(overlayJet.group);
  const worldJet = createAircraft();
  world.add(worldJet.group);
  craftScene.add(craft);

  const position = START.clone();
  const previousPosition = new THREE.Vector3();
  const baseOrientation = new THREE.Quaternion();
  const orientation = new THREE.Quaternion();
  const viewQuaternion = new THREE.Quaternion();
  const viewPosition = START.clone();
  const contactVelocity = new THREE.Vector3();
  const bankRotation = new THREE.Quaternion();
  const bankAxis = new THREE.Vector3(0, 0, 1);
  const halfTurn = new THREE.Quaternion();
  const fullTurn = new THREE.Quaternion();
  const halfFlightYaw = new THREE.Quaternion();
  const fullFlightYaw = new THREE.Quaternion();
  const halfFlightPitch = new THREE.Quaternion();
  const fullFlightPitch = new THREE.Quaternion();
  const worldUpAxis = new THREE.Vector3(0, 1, 0);
  const localPitchAxis = new THREE.Vector3(1, 0, 0);
  const middleOrientation = new THREE.Quaternion();
  const flightOrientation = new THREE.Quaternion();
  const rotationAxis = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const up = new THREE.Vector3();
  const velocity = new THREE.Vector3();
  const previousVelocity = new THREE.Vector3();
  const segment = new THREE.Vector3();
  const relative = new THREE.Vector3();
  const localRelative = new THREE.Vector3();
  const closest = new THREE.Vector3();
  let mode = 'explore';
  let bank = 0;
  let yawRate = 0;
  let speed = 0;
  let throttle = 0;
  let afterburner=createAfterburnerState(),overspeedFromAB=false;
  let afterburnerMotion=Object.freeze([]);
  let speedSettings={streakAmount:0,speedFov:0,highSpeedShake:false,autoAfterburner:false,autoAfterburnerAngle:35};
  let speedExtraFov=0,baseVerticalFov=64;
  const effectShake=new THREE.Quaternion(),effectEuler=new THREE.Euler();
  let recoveryAssist = 0;
  let angleOfAttack = 0;
  let grounded = false;
  let collected = 0;
  let complete = false;
  let width = 1;
  let height = 1;
  let fieldOfView = { vertical: 64, horizontal: 64 };
  let cockpitFov=0;
  let disposed = false;
  let viewAssistance = 0;
  let viewPitch = 0;
  let displayedFlightView = null;
  let displayedFixedFlightView = null;
  let chaseAngles = null, chaseTimeConstant = .15;
  let phoneRoll = 0, displayScreenOffset = 0, displayRoll = 0, visualTime=0;
  const displayCameraInverse = new THREE.Quaternion();

  function syncWorld(dt = 0) {
    visualTime+=Math.max(0,dt);
    const presentation=mode==='flight'?speedPresentation(speed,speedSettings,afterburner,visualTime,cameraMode):{extraFov:0,shake:{x:0,y:0,z:0}};
    if(Math.abs(presentation.extraFov-speedExtraFov)>1e-6){speedExtraFov=presentation.extraFov;updateProjection();}
    orientation.copy(baseOrientation);
    if (mode === 'flight') {
      // Positive bank lowers the craft's right wing; its inverse tilts scenery.
      bankRotation.setFromAxisAngle(bankAxis, -bank);
      orientation.multiply(bankRotation);
      // Flight drawing follows the actual bank, rather than inverse phone motion.
      craft.quaternion.setFromAxisAngle(bankAxis, -bank);
    }
    if (mode === 'flight') {
      const targetView = computeFlightView({ orientation, altitude: position.y,
        velocity: grounded ? contactVelocity : velocity, bank });
      if (!displayedFlightView || dt > 0) displayedFlightView = advanceFlightView(displayedFlightView, targetView, dt);
      let view = displayedFlightView;
      if (display === 'fixed') {
        const fixedTarget = withoutViewRoll(computeFlightView({ orientation: baseOrientation,
          altitude: position.y, velocity: grounded ? contactVelocity : velocity, bank: 0 }));
        if (!displayedFixedFlightView || dt > 0) displayedFixedFlightView = withoutViewRoll(
          advanceFlightView(displayedFixedFlightView, fixedTarget, dt));
        view = displayedFixedFlightView;
      }
      const pose = flightDisplayPose({ display, bank, phoneRoll, screenOffset: displayScreenOffset });
      displayRoll = pose.roll;
      camera.quaternion.copy(pose.camera);
      craftCamera.quaternion.copy(pose.camera);
      craft.quaternion.copy(pose.craft);
      if (cameraMode === 'chase') {
        chaseAngles = advanceChaseAngles(chaseAngles, bodyViewAngles(baseOrientation), dt, chaseTimeConstant);
        view = chaseView(chaseAngles, position.y, targetView.assistance);
        if (display === 'fixed') view = withoutViewRoll(view);
      } else if (cameraMode === 'cockpit') {
        view = { orientation: orientation.clone(), offset: new THREE.Vector3(0,.3,-.8).applyQuaternion(orientation),
          assistance: 0, pitch: bodyViewAngles(baseOrientation).pitch };
      }
      viewQuaternion.copy(view.orientation).invert().premultiply(pose.worldBank);
      // In the cockpit, the physical bank is already part of the eye orientation.
      if (cameraMode === 'cockpit') viewQuaternion.copy(view.orientation).invert();
      viewPosition.copy(position).add(view.offset);
      viewAssistance = view.assistance;
      viewPitch = view.pitch;
      worldJet.group.position.copy(position);
      worldJet.group.quaternion.copy(orientation);
      if (cameraMode === 'chase' && display === 'fixed') {
        const relativePose = view.orientation.clone().invert().multiply(baseOrientation);
        const upright = withoutViewRoll({ orientation: relativePose }).orientation;
        worldJet.group.quaternion.copy(view.orientation).multiply(pose.worldBank.clone().invert()).multiply(upright);
      }
    } else {
      camera.quaternion.identity();
      craftCamera.quaternion.identity();
      displayRoll = 0;
      displayedFlightView = null;
      displayedFixedFlightView = null;
      chaseAngles = null;
      viewQuaternion.copy(orientation).invert();
      viewPosition.copy(position);
      viewAssistance = 0;
      forward.set(0, 0, -1).applyQuaternion(orientation);
      viewPitch = Math.atan2(forward.y, Math.hypot(forward.x, forward.z));
    }
    effectShake.setFromEuler(effectEuler.set(presentation.shake.x,presentation.shake.y,presentation.shake.z));
    camera.quaternion.multiply(effectShake);craftCamera.quaternion.multiply(effectShake);
    displayCameraInverse.copy(camera.quaternion).invert();
    airflow.update({speed,afterburner,amount:speedSettings.streakAmount,timeSeconds:visualTime,verticalFov:camera.fov,aspect:width/height,visible:visibility==='assisted'&&!grounded&&!complete});
    world.quaternion.copy(viewQuaternion);
    world.position.copy(viewPosition).negate().applyQuaternion(viewQuaternion);
    horizonBackdrop.position.copy(viewPosition);
    horizonBackdrop.visible = mode === 'flight' && cameraMode !== 'overlay';
    exploreCraft.visible = mode !== 'flight';
    overlayJet.group.visible = mode === 'flight';
    craft.visible = mode !== 'flight' || cameraMode === 'overlay';
    worldJet.group.visible = mode === 'flight' && cameraMode === 'chase';
    overlayJet.setPower(throttle,afterburner.active); worldJet.setPower(throttle,afterburner.active);
    // This group is a child of world, so it receives the same inverse pose as
    // the floor. Its local location remains the craft's true ground position.
    const overIsland = position.x ** 2 + ((position.z + 24) / 1.1) ** 2 < 83.5 ** 2;
    groundProjection.position.set(position.x, overIsland ? 0.075 : -0.025, position.z);
    groundProjection.scale.setScalar(1.1 + position.y * 0.045);
    groundProjection.visible = true;
    groundShadowMaterial.opacity = THREE.MathUtils.clamp(0.22 - position.y * 0.003, 0.08, 0.22);
    groundOutlineMaterial.opacity = THREE.MathUtils.clamp(0.36 - position.y * 0.004, 0.14, 0.36);
  }

  function stopMotion() {
    afterburner=stopAfterburner(afterburner);overspeedFromAB=false;
    velocity.set(0, 0, 0);
    speed = 0;
    throttle = 0;
    recoveryAssist = 0;
    angleOfAttack = 0;
    yawRate = 0;
  }

  function launchFlight() {
    if (disposed || grounded || complete) return;
    afterburnerMotion=Object.freeze([]);
    if (mode !== 'flight') {
      baseOrientation.copy(orientation);
      bank = 0;
    }
    mode = 'flight';
    updateProjection();
    forward.set(0, 0, -1).applyQuaternion(baseOrientation);
    velocity.copy(forward).multiplyScalar(FLIGHT_MODEL.cruiseSpeed);
    speed = velocity.length();
    throttle = FLIGHT_MODEL.defaultThrottle;
    yawRate = 0;
    syncWorld();
    render();
  }

  function render() {
    if (disposed) return;
    // With sizeAttenuation disabled, this scale gives a 24px quad (the opaque ring spans at least 22px).
    const hintSize = 24 * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / height;
    beaconVisuals.forEach(visual => visual.hint.scale.set(hintSize, hintSize, 1));
    exitVisual.update({visible:visibility==='assisted',unlocked:collected===BEACONS.length,time:visualTime,fov:camera.fov,height});
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(craftScene, craftCamera);
  }

  function refreshTargets() {
    beaconVisuals.forEach((visual, index) => {
      visual.group.visible = index >= collected;
      const assisted = visibility === 'assisted';
      visual.stem.visible = index >= collected && (!assisted || index === collected);
      visual.stem.material = assisted ? brightStem : visual.stem.userData.legacyMaterial;
      visual.stem.scale.set(assisted ? 2 : 1, 1, assisted ? 2 : 1);
      visual.ring.material = assisted ? brightRing : gold;
      visual.orb.material = assisted ? brightCore : core;
      visual.halo.material = assisted ? brightHalo : haloMaterial;
      visual.hint.visible = assisted && index >= collected;
      visual.hint.material.opacity = index === collected ? 1 : .65;
      for (const child of visual.group.children) if (![visual.ring, visual.orb, visual.halo, visual.hint].includes(child)) child.material = assisted ? brightCore : gold;
      visual.ring.scale.setScalar(index === collected ? 1.1 : 1);
      visual.halo.scale.setScalar(index === collected ? 1.25 : 0.85);
    });
    exitRing.material = collected === BEACONS.length ? guide : dimGuide;
    exitRing.visible=visibility!=='assisted';legacyExitFrame.visible=visibility!=='assisted';
  }

  // Check a full movement segment so a target cannot be skipped by a long frame.
  function collectAlongSegment(from, to) {
    segment.subVectors(to, from);
    const lengthSquared = segment.lengthSq();
    let minimumFraction = 0;
    while (!complete) {
      const target = collected < BEACONS.length ? BEACONS[collected] : EXIT;
      const radius = collected < BEACONS.length ? COLLECT_RADIUS : EXIT_RADIUS;
      const fraction = lengthSquared > 0
        ? THREE.MathUtils.clamp(relative.subVectors(target, from).dot(segment) / lengthSquared,
          minimumFraction, 1)
        : 0;
      closest.copy(from).addScaledVector(segment, fraction);
      if (closest.distanceToSquared(target) > radius * radius) break;
      minimumFraction = fraction;
      if (collected < BEACONS.length) collected += 1;
      else complete = true;
      refreshTargets();
    }
  }

  function resize(nextWidth, nextHeight, pixelRatio = 1) {
    if (disposed) return;
    width = Math.max(1, finite(nextWidth, 1));
    height = Math.max(1, finite(nextHeight, 1));
    renderer.setPixelRatio(THREE.MathUtils.clamp(finite(pixelRatio, 1), 0.5, 1.6));
    renderer.setSize(width, height, false);
    updateProjection();
    craftCamera.left = -width / 2;
    craftCamera.right = width / 2;
    craftCamera.top = height / 2;
    craftCamera.bottom = -height / 2;
    craftCamera.updateProjectionMatrix();
    render();
  }

  function updateProjection() {
    fieldOfView = computeFieldOfView(width, height, visibility);
    if(mode==='flight'&&cameraMode==='cockpit'&&cockpitFov>=60) {
      fieldOfView.vertical=Math.min(fieldOfView.vertical,cockpitFov);
      fieldOfView.horizontal=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(fieldOfView.vertical)/2)*width/height));
    }
    baseVerticalFov=fieldOfView.vertical;
    if(speedExtraFov>0){fieldOfView.vertical=Math.min(115,baseVerticalFov+speedExtraFov);fieldOfView.horizontal=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(fieldOfView.vertical)/2)*width/height));}
    camera.aspect = width / height;
    camera.fov = fieldOfView.vertical;
    camera.far=1800;
    camera.updateProjectionMatrix();
    scenery.group.visible=visibility==='assisted';
    islandTop.material=outerGround.material=visibility==='assisted'?groundPattern.material:groundMaterial;
    groundTiles.visible=visibility!=='assisted';
    directionLandmarks.visible = visibility === 'assisted';
    refreshTargets();
  }

  function setDisplay(profile) {
    if (disposed) return;
    const next = profile === 'fixed' ? 'fixed' : 'bank';
    if (display !== next) displayedFixedFlightView = null;
    display = next;
    syncWorld(); render();
  }

  function resetDisplayRotation() {
    phoneRoll = 0; displayScreenOffset = 0;
    syncWorld(); render();
  }

  function setVisibility(profile) {
    if (disposed) return;
    visibility = normalizeVisibility(profile);
    updateProjection();
    render();
  }

  function setGroundPatternStrength(value){
    if(disposed)return;
    if(groundPattern.setStrength(value))render();
  }
  // Stable, frozen metadata is shared with the audio observer without copying
  // every pillar on every animation frame. Hidden legacy scenery makes no sound.
  const noPassObjects=Object.freeze([]);
  function getPassObjects(){return visibility==='assisted'?scenery.passObjects:noPassObjects;}

  function update(dt, input = {}) {
    if (disposed) return;
    afterburnerMotion=[];
    const compensation = input.craftQuaternion;
    if (compensation && [compensation.x, compensation.y, compensation.z, compensation.w]
      .every(Number.isFinite)) {
      const scale = Math.max(Math.abs(compensation.x), Math.abs(compensation.y),
        Math.abs(compensation.z), Math.abs(compensation.w));
      if (scale > 0) {
        // Scaling first also normalizes very large or tiny finite inputs safely.
        craft.quaternion.set(compensation.x / scale, compensation.y / scale,
          compensation.z / scale, compensation.w / scale).normalize();
      } else craft.quaternion.identity();
    } else craft.quaternion.identity();
    const elapsed = Math.max(0, finite(dt));
    if(input.speedSettings&&typeof input.speedSettings==='object')speedSettings={...speedSettings,...input.speedSettings};
    arenaTime+=elapsed;boundaryVisual.update(arenaTime);
    if(Number.isFinite(input.turnGravity))turnGravity=normalizeTurnGravity(input.turnGravity);
    if(Number.isFinite(input.maxBank))turnBankLimit=THREE.MathUtils.clamp(input.maxBank,5,40);
    const nextMode = input.mode === 'flight' ? 'flight' : 'explore';
    if (nextMode !== mode) {
      // The app resets the route when switching. If a caller switches directly,
      // preserve its visible pose and clear previous bank instead of snapping.
      baseOrientation.copy(orientation);
      bank = 0;
      stopMotion();
      grounded = false;
      mode = nextMode;
      updateProjection();
    }
    if (mode === 'flight') {
      if(Number.isFinite(input.cockpitFov)&&input.cockpitFov!==cockpitFov) {
        cockpitFov=input.cockpitFov===0?0:THREE.MathUtils.clamp(input.cockpitFov,60,100);updateProjection();
      }
      if (Number.isFinite(input.chaseTimeConstant)) chaseTimeConstant = THREE.MathUtils.clamp(input.chaseTimeConstant, 0, .5);
      if (Number.isFinite(input.displayTwist)) phoneRoll = advanceDisplayRoll(phoneRoll,
        THREE.MathUtils.degToRad(input.displayTwist), elapsed, input.displayTimeConstant);
      if (Number.isFinite(input.displayScreenOffset)) displayScreenOffset =
        THREE.MathUtils.degToRad(input.displayScreenOffset);
    }
    const pitchRate = finite(input.pitchRate);
    const exploreYawRate = finite(input.yawRate);
    const targetBank = THREE.MathUtils.clamp(finite(input.bankAngle), -MAX_BANK, MAX_BANK);
    const targetThrottle = THREE.MathUtils.clamp(
      finite(input.throttle, FLIGHT_MODEL.defaultThrottle), 0, 1);
    if (elapsed === 0 || (mode === 'flight' && (grounded || complete))) {
      afterburnerMotion=Object.freeze(afterburnerMotion);
      stopMotion();
      syncWorld();
      render();
      return;
    }
    if (mode === 'explore') {
      speed = complete ? 0 : Math.max(0, finite(input.speed));
      throttle = 0;
    }
    // Midpoint integration keeps simultaneous turning and travel smooth. A cap
    // preserves exploration behavior. Flight always subdivides the full frame
    // so its force integrator never receives more than 0.05 seconds.
    const requestedSteps = Math.max(1, Math.ceil(elapsed * 60));
    const steps = mode === 'flight' ? requestedSteps : Math.min(240, requestedSteps);
    const step = elapsed / steps;
    for (let i = 0; i < steps; i += 1) {
      let turnYawRate = exploreYawRate;
      let middleBank = 0;
      if (mode === 'flight') {
        const previousBank = bank;
        bank = THREE.MathUtils.damp(bank, targetBank, 4, step);
        // Use the middle bank for integration, while diagnostics report the
        // instantaneous rate at the final bank. No bank-generated turn at rest.
        middleBank = (previousBank + bank) / 2;
        turnYawRate = flightYawForBank(middleBank, speed, turnGravity);
        yawRate = flightYawForBank(bank, speed, turnGravity);
      } else {
        bank = 0;
        yawRate = exploreYawRate;
      }
      if (mode === 'flight') {
        // World-up yaw followed by local-X pitch keeps the flight base in
        // heading * pitch form. Combined input cannot accumulate another roll;
        // the explicit bank remains the normal source of wing tilt. Pitch is
        // unbounded, so this also stays continuous through a vertical loop.
        halfFlightYaw.setFromAxisAngle(worldUpAxis, -turnYawRate * step / 2);
        fullFlightYaw.setFromAxisAngle(worldUpAxis, -turnYawRate * step);
        halfFlightPitch.setFromAxisAngle(localPitchAxis, pitchRate * step / 2);
        fullFlightPitch.setFromAxisAngle(localPitchAxis, pitchRate * step);
        middleOrientation.copy(baseOrientation).premultiply(halfFlightYaw).multiply(halfFlightPitch);
      } else {
        // Preserve exploration's body-local combined rotation exactly.
        const angularSpeed = rotationAxis.set(pitchRate, -turnYawRate, 0).length();
        if (angularSpeed > 0) rotationAxis.multiplyScalar(1 / angularSpeed);
        halfTurn.setFromAxisAngle(rotationAxis, angularSpeed * step / 2);
        fullTurn.setFromAxisAngle(rotationAxis, angularSpeed * step);
        middleOrientation.copy(baseOrientation).multiply(halfTurn);
      }
      forward.set(0, 0, -1).applyQuaternion(middleOrientation);
      previousPosition.copy(position);
      if (mode === 'flight') {
        bankRotation.setFromAxisAngle(bankAxis, -middleBank);
        flightOrientation.copy(middleOrientation).multiply(bankRotation);
        forward.set(0, 0, -1).applyQuaternion(flightOrientation);
        up.set(0, 1, 0).applyQuaternion(flightOrientation);
        previousVelocity.copy(velocity);
        const burn=advanceAfterburner(afterburner,step,{running:true,flight:true,manualRequest:input.manualAfterburner===true,
          autoEnabled:speedSettings.autoAfterburner===true,pitchInputDegrees:input.pitchInputDegrees,autoAngle:speedSettings.autoAfterburnerAngle,
          groundClearance:position.y,speed,grounded});afterburner=burn.state;
        const paid=Math.max(0,Math.min(step,burn.activeSeconds));
        let next=paid>0?stepFlightVelocity(velocity,paid,{forward,up,throttle:1,afterburner:true}):null;
        if(paid>0)overspeedFromAB=true;
        if(step-paid>1e-12)next=stepFlightVelocity(next?.velocity??velocity,step-paid,{forward,up,throttle:targetThrottle,preserveOverspeed:overspeedFromAB});
        if(next.speed<=FLIGHT_MODEL.maxSpeed+1e-8)overspeedFromAB=false;
        // Keep the natural bank response from the unchanged lift model. Add
        // only the requested increase in horizontal turning, without changing
        // speed or vertical velocity (and with an exact identity at strength 3).
        const extraYaw=turnYawRate-flightYawForBank(middleBank,speed,FLIGHT_MODEL.gravity);
        const turned=extraYaw===0?next.velocity:applyHorizontalTurn(next.velocity,next.velocity,extraYaw,step);
        velocity.set(turned.x, turned.y, turned.z);
        afterburner=observeAfterburnerSpeed(afterburner,velocity.length());
        throttle = next.throttle;
        recoveryAssist = next.recoveryAssist;
        angleOfAttack = next.angleOfAttack;
        position.addScaledVector(previousVelocity, step / 2).addScaledVector(velocity, step / 2);
        if (position.y <= 0 && velocity.y < 0) {
          // Stop at the intersection with the actual ground reference plane.
          const fraction = previousPosition.y / (previousPosition.y - position.y);
          position.lerpVectors(previousPosition, position, THREE.MathUtils.clamp(fraction, 0, 1));
          position.y = 0;
          contactVelocity.copy(velocity);
          grounded = true;
          stopMotion();
        }
        position.y = THREE.MathUtils.clamp(position.y, 0, 45);
        if (position.y >= 45 && velocity.y > 0) velocity.y = 0;
        speed = velocity.length();
        yawRate = grounded ? 0 : flightYawForBank(bank, speed, turnGravity);
        // Observation only: collection already treats this stored movement as
        // a line. Attribute paid AB to the first paid/step part of that line,
        // without changing the force, position, clamp or collection updates.
        if(paid>0){
          const fraction=paid/step;
          afterburnerMotion.push(Object.freeze({
            from:Object.freeze({x:previousPosition.x,y:previousPosition.y,z:previousPosition.z}),
            to:Object.freeze({x:previousPosition.x+(position.x-previousPosition.x)*fraction,
              y:previousPosition.y+(position.y-previousPosition.y)*fraction,
              z:previousPosition.z+(position.z-previousPosition.z)*fraction}),seconds:paid,
          }));
        }
      } else {
        // Exploration remains direct movement at the supplied speed, with no
        // stored momentum or force calculation.
        position.addScaledVector(forward, speed * step);
        position.y = THREE.MathUtils.clamp(position.y, 2, 45);
        velocity.subVectors(position, previousPosition).divideScalar(step);
      }
      if (mode === 'flight') baseOrientation.premultiply(fullFlightYaw).multiply(fullFlightPitch).normalize();
      else baseOrientation.multiply(fullTurn).normalize();
      const beforeCollected=collected,beforeComplete=complete;
      collectAlongSegment(previousPosition, position);
      if(mode==='flight')afterburner=awardAfterburner(afterburner,{targets:collected-beforeCollected,exit:complete&&!beforeComplete});
      if (complete) {
        if (mode === 'flight') stopMotion();
        else { speed = 0; velocity.set(0, 0, 0); }
      }
      if (mode === 'flight' && (grounded || complete)) break;
    }
    afterburnerMotion=Object.freeze(afterburnerMotion);
    syncWorld(elapsed);
    render();
  }

  function getStatus() {
    const target = collected < BEACONS.length ? BEACONS[collected] : EXIT;
    relative.subVectors(target, position);
    localRelative.subVectors(target, viewPosition).applyQuaternion(viewQuaternion).applyQuaternion(displayCameraInverse);
    forward.set(0, 0, -1).applyQuaternion(orientation);
    return {
      collected,
      total: BEACONS.length,
      course:{id:layout.id??'legacy',name:layout.name??'比較用（旧配置）',targetCount:BEACONS.length},
      stageSize:{halfExtent:STAGE_HALF_EXTENT,width:STAGE_HALF_EXTENT*2,depth:STAGE_HALF_EXTENT*2},
      turnGravity,
      boundary:stageBoundaryStatus(position,{heading:Math.atan2(forward.x,-forward.z),velocity,speed,turnGravity,maxBank:turnBankLimit}),
      boundaryAppearance:boundaryVisual.snapshot(),
      afterburner:{...afterburner},
      afterburnerMotion,
      speedEffects:{...airflow.snapshot(),extraFov:speedExtraFov,baseVerticalFov,highSpeedShake:speedSettings.highSpeedShake===true},
      complete,
      radarHeading: Math.hypot(velocity.x, velocity.z) > .1 ? Math.atan2(velocity.x, -velocity.z) : Math.atan2(forward.x, -forward.z),
      navigationTargets: complete ? [] : collected < BEACONS.length ? BEACONS.slice(collected).map((p,i) => ({
        id: `light-${collected+i+1}`, kind: 'light', number: collected+i+1, label: `光 ${collected+i+1}`, next: i === 0,
        position: { x: p.x, y: p.y, z: p.z },
      })) : [{ id: 'exit', kind: 'exit', label: '出口', next: true, position: { x: EXIT.x, y: EXIT.y, z: EXIT.z } }],
      beaconAppearance: { core: `#${(visibility === 'assisted' ? brightCore : core).color.getHexString()}`,
        ring: `#${(visibility === 'assisted' ? brightRing : gold).color.getHexString()}`,
        minPixels: visibility === 'assisted' ? 22 : 0, columnTarget: visibility === 'assisted' && collected < BEACONS.length ? collected + 1 : null },
      targetLabel: collected < BEACONS.length ? `光 ${collected + 1}` : '出口',
      exitAppearance:{...exitVisual.snapshot(),position:{x:EXIT.x,y:EXIT.y,z:EXIT.z},radius:EXIT_RADIUS,stoneFrame:legacyExitFrame.visible},
      distance: relative.length(),
      bearing: Math.atan2(localRelative.x, -localRelative.z),
      elevation: Math.atan2(localRelative.y, Math.hypot(localRelative.x, localRelative.z)),
      altitude: position.y,
      groundClearance: position.y,
      viewAssistance,
      viewPitch,
      viewPosition: { x: viewPosition.x, y: viewPosition.y, z: viewPosition.z },
      display,
      cameraMode: mode === 'flight' ? cameraMode : 'overlay',
      craftVisible: craft.visible || worldJet.group.visible,
      worldCraftQuaternion: worldJet.group.quaternion.toArray(),
      worldCraftScreenQuaternion: displayCameraInverse.clone().multiply(viewQuaternion).multiply(worldJet.group.quaternion).toArray(),
      aircraft: worldJet.diagnostics(),
      chaseAngles: chaseAngles ? { ...chaseAngles } : null,
      displayRoll,
      cameraQuaternion: { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w },
      worldQuaternion: { x: world.quaternion.x, y: world.quaternion.y, z: world.quaternion.z, w: world.quaternion.w },
      craftScreenQuaternion: (() => {
        const q = craftCamera.quaternion.clone().invert().multiply(craft.quaternion);
        return { x: q.x, y: q.y, z: q.z, w: q.w };
      })(),
      speed,
      throttle,
      recoveryAssist,
      angleOfAttack,
      verticalSpeed: velocity.y,
      velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
      grounded,
      mode,
      bank,
      yawRate,
      position: { x: position.x, y: position.y, z: position.z },
      heading: Math.atan2(forward.x, -forward.z),
      pitch: Math.atan2(forward.y, Math.hypot(forward.x, forward.z)),
      // Heading * local pitch remains readable through vertical/inverted flight.
      controlPitch: Math.atan2(2 * (baseOrientation.w * baseOrientation.x - baseOrientation.y * baseOrientation.z),
        1 - 2 * (baseOrientation.x ** 2 + baseOrientation.z ** 2)),
      orientation: { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w },
      craftQuaternion: {
        x: craft.quaternion.x, y: craft.quaternion.y,
        z: craft.quaternion.z, w: craft.quaternion.w,
      },
      craftScreen: { x: width / 2, y: height / 2 },
      cameraPosition: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      targetPosition: { x: target.x, y: target.y, z: target.z },
      targetRadius: collected < BEACONS.length ? COLLECT_RADIUS : EXIT_RADIUS,
      visibility,
      fieldOfView: { ...fieldOfView },
      cameraClipping:{near:camera.near,far:camera.far},
      scenery:{visible:scenery.group.visible,...scenery.details},
      groundPattern:{...groundPattern.snapshot(),visible:visibility==='assisted',centralPavingVisible:groundTiles.visible},
      abLane:abLaneStatus(layout.abStraights,position),
      targetLocal: { x: localRelative.x, y: localRelative.y, z: localRelative.z },
      landmarks: visibility === 'assisted' ? DIRECTION_LANDMARKS.map((landmark) => ({
        ...landmark, position: { ...landmark.position },
      })) : [],
    };
  }

  function reset() {
    afterburner=createAfterburnerState();overspeedFromAB=false;
    afterburnerMotion=Object.freeze([]);
    position.copy(START);
    baseOrientation.identity();
    orientation.identity();
    craft.quaternion.identity();
    bank = 0;
    stopMotion();
    grounded = false;
    contactVelocity.set(0, 0, 0);
    displayedFlightView = null;
    displayedFixedFlightView = null;
    chaseAngles = null;
    phoneRoll = 0; displayScreenOffset = 0;
    collected = 0;
    complete = false;
    refreshTargets();
    syncWorld();
    render();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    const geometries = new Set();
    const materials = new Set([groundMaterial, guide, dimGuide, gold, core, haloMaterial, brightCore, brightRing, brightHalo, brightStem, ...beaconVisuals.map(v => v.stem.userData.legacyMaterial)]);
    [scene, craftScene].forEach((root) => root.traverse((object) => {
      if(object.isInstancedMesh)object.dispose();
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) {
        (Array.isArray(object.material) ? object.material : [object.material])
          .forEach((material) => materials.add(material));
      }
    }));
    geometries.forEach((geometry) => geometry.dispose());
    materials.delete(groundPattern.material);
    materials.forEach((material) => material.dispose());
    groundPattern.dispose();
    hintTexture.dispose();
    exitVisual.dispose();
    renderer.dispose();
  }

  updateProjection();
  reset();
  function setCameraMode(value) { cameraMode = normalizeCameraMode(value); chaseAngles = null; updateProjection(); syncWorld(); render(); }
  return { resize, update, getStatus, reset, launchFlight, setVisibility, setGroundPatternStrength, getPassObjects, setDisplay, setCameraMode, resetDisplayRotation, dispose };
}
