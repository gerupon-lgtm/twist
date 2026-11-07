import { MathUtils, Quaternion, Vector3 } from 'three';
import { pitchLadderAngles } from './cockpit-aids.js';

const finite = n => Number.isFinite(n) ? n : 0;
const vector = v => new Vector3(finite(v?.x), finite(v?.y), finite(v?.z));
const quaternion = q => new Quaternion(finite(q?.x), finite(q?.y), finite(q?.z), Number.isFinite(q?.w) ? q.w : 1).normalize();
export function cockpitReadings(state = {}) {
  return { speed: finite(state.speed), altitude: finite(state.groundClearance),
    heading: ((MathUtils.radToDeg(finite(state.heading)) % 360) + 360) % 360,
    pitch: MathUtils.radToDeg(finite(state.controlPitch)), verticalSpeed: finite(state.verticalSpeed),
    power: Math.round(finite(state.throttle) * 100) };
}

/** Same perspective and inverse pose as the world renderer, in CSS pixels. */
export function cockpitProjection(state, width, height, {ladderRange=10}={}) {
  const q = quaternion(state.cameraQuaternion).invert().multiply(quaternion(state.worldQuaternion));
  const f = height / (2 * Math.tan(MathUtils.degToRad(state.fieldOfView.vertical) / 2));
  function project(direction) {
    const v = vector(direction).applyQuaternion(q);
    return { x: width / 2 + f * v.x / -v.z, y: height / 2 - f * v.y / -v.z,
      inFront: v.z < -1e-6, local: v };
  }
  const up = new Vector3(0,1,0).applyQuaternion(q);
  // n dot (screenX, -screenY, -f) = 0: the infinite level plane's vanishing line.
  const horizon = { a: up.x, b: -up.y, c: -f * up.z };
  const bodyForward = new Vector3(0,0,-1).applyQuaternion(quaternion(state.orientation));
  const nose = project(bodyForward);
  const velocity = vector(state.velocity);
  const flightPath = velocity.length() > .05 ? project(velocity) : null;
  const lines = [];
  for (const degrees of pitchLadderAngles(MathUtils.radToDeg(finite(state.controlPitch)),ladderRange)) {
    const pitch = MathUtils.degToRad(degrees);
    for (const side of [-1,1]) {
      const points = [];
      for (let i = 0; i <= 10; i++) {
        const azimuth = finite(state.heading) + side * MathUtils.degToRad(2 + i*.5);
        const point = project({ x: Math.sin(azimuth)*Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(azimuth)*Math.cos(pitch) });
        if (point.inFront && Number.isFinite(point.x) && Number.isFinite(point.y)) points.push(point);
      }
      if (points.length === 11) lines.push({ degrees, side, points });
    }
  }
  return { f, q, horizon, nose, flightPath, lines };
}

/** Intersect the actual horizon with a viewport rectangle; also handles a vertical horizon. */
export function horizonSegment({ a,b,c }, width, height) {
  const points = [], add = (x,y) => {
    if (Number.isFinite(x) && Number.isFinite(y) && x >= -.01 && x <= width+.01 && y >= -.01 && y <= height+.01
      && !points.some(p => Math.hypot(p.x-x,p.y-y)<.01)) points.push({x,y});
  };
  if (Math.abs(b)>1e-9) for (const x of [0,width]) add(x, height/2 - (a*(x-width/2)+c)/b);
  if (Math.abs(a)>1e-9) for (const y of [0,height]) add(width/2 - (b*(y-height/2)+c)/a,y);
  return points.slice(0,2);
}
