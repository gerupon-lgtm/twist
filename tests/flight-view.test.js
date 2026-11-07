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

import { Vector3 } from 'three';
import { advanceDisplayRoll, flightDisplayPose, withoutViewRoll, wrapDisplayAngle } from '../src/flight-display.js';
const r = deg => deg*Math.PI/180;
const sameRotation = (a,b,tolerance=1e-7) => assert.ok(a.angleTo(b)<tolerance,`${a.toArray()} != ${b.toArray()}`);

test('fixed camera cancels full phone turns, while bank only affects scenery',()=>{
  for(const twist of [-180,-120,-30,0,30,120,179]) for(const bank of [-40,0,40]) {
    const p=flightDisplayPose({display:'fixed',phoneRoll:r(twist),bank:r(bank)});
    const physicalPhone=new Quaternion().setFromAxisAngle(new Vector3(0,0,1),-r(twist));
    const screenCraft=p.camera.clone().invert().multiply(p.craft);
    sameRotation(physicalPhone.clone().multiply(screenCraft),new Quaternion());
    sameRotation(p.craft,new Quaternion());
    const screenWorld=p.camera.clone().invert().multiply(p.worldBank);
    sameRotation(physicalPhone.clone().multiply(screenWorld),new Quaternion().setFromAxisAngle(new Vector3(0,0,1),r(bank)));
  }
});

test('fixed layout compensation keeps the calibrated physical direction through screen rotations',()=>{
  const axis=new Vector3(0,0,1);
  for(const initial of [0,90,270]) for(const screen of [0,90,180,270]) {
    const p=flightDisplayPose({display:'fixed',phoneRoll:r(30),screenOffset:r(screen-initial)});
    const physical=new Quaternion().setFromAxisAngle(axis,-r(30)).multiply(new Quaternion().setFromAxisAngle(axis,-r(screen)));
    sameRotation(physical.multiply(p.camera.clone().invert()).multiply(p.craft),new Quaternion().setFromAxisAngle(axis,-r(initial)));
  }
});

test('bank display retains the former craft bank and ignores phone/display-only inputs',()=>{
  for(const bank of [-.7,0,.7]) {
    const p=flightDisplayPose({bank,phoneRoll:2,screenOffset:1});
    sameRotation(p.camera,new Quaternion());sameRotation(p.worldBank,new Quaternion());
    sameRotation(p.craft,new Quaternion().setFromAxisAngle(new Vector3(0,0,1),-bank));
    assert.equal(p.roll,0);
  }
});

test('display smoothing crosses half turns by the shortest path and has a zero-delay option',()=>{
  const next=advanceDisplayRoll(r(179),r(-179),.016,.05);
  assert.ok(wrapDisplayAngle(next-r(179))>0 && wrapDisplayAngle(next-r(179))<r(2));
  assert.ok(Math.abs(advanceDisplayRoll(0,r(30),.01,0)-r(30))<1e-12);
  const a=advanceDisplayRoll(0,r(30),.05,.05);
  const b=advanceDisplayRoll(advanceDisplayRoll(0,r(30),.025,.05),r(30),.025,.05);
  assert.ok(Math.abs(a-b)<1e-12);
  assert.ok(Math.abs(a-r(30)*(1-Math.exp(-1)))<1e-12);
  for(const dt of [0,-1,NaN,Infinity]) assert.ok(Math.abs(advanceDisplayRoll(.1,.2,dt,.05)-.1)<1e-12);
});

test('fixed view assistance removes roll so all visible horizon bank comes from the actual wings',()=>{
  for(const pitch of [-.6,0,.3]) for(const yaw of [-2,0,1]) {
    const view=withoutViewRoll({orientation:pose(pitch,yaw,.2),offset:new Vector3()});
    for(const bank of [-.7,.7]) {
      const p=flightDisplayPose({display:'fixed',bank,phoneRoll:.4});
      const world=view.orientation.clone().invert().premultiply(p.worldBank);
      const vertical=new Vector3(0,1,0).applyQuaternion(world).applyQuaternion(p.camera.clone().invert());
      assert.ok(Math.abs(wrapDisplayAngle(Math.atan2(-vertical.x,vertical.y)-bank-.4))<1e-10);
    }
  }
});

test('display math is finite for invalid, very large, vertical and inverted values',()=>{
  for(const value of [undefined,NaN,Infinity,-Infinity,Number.MAX_VALUE]) {
    const p=flightDisplayPose({display:'fixed',bank:value,phoneRoll:value,screenOffset:value});
    assert.ok([p.roll,...p.camera.toArray(),...p.craft.toArray(),...p.worldBank.toArray()].every(Number.isFinite));
    assert.ok(Number.isFinite(advanceDisplayRoll(value,value,value,value)));
  }
  for(const orientation of [null,{x:NaN},pose(Math.PI/2),pose(Math.PI),{x:1e308,y:1e308,z:1e308,w:1e308}]) {
    const view=withoutViewRoll({orientation});assert.ok(view.orientation.toArray().every(Number.isFinite));
  }
  assert.ok(withoutViewRoll().orientation.toArray().every(Number.isFinite));
});

test('fixed roll removal preserves forward direction and inverted rate pitch beyond ninety degrees',()=>{
 for(const degrees of [-270,-180,-120,-90,90,120,179,180,270])for(const yaw of [-2,0,1.5]){
  const source=pose(r(degrees),yaw,0), result=withoutViewRoll({orientation:source});
  sameRotation(result.orientation,source);
 }
 for(const degrees of [-120,10,120,180])for(const roll of [-.4,.4]){
  const source=pose(r(degrees),.7,roll),result=withoutViewRoll({orientation:source});
  const a=new Vector3(0,0,-1).applyQuaternion(source),b=new Vector3(0,0,-1).applyQuaternion(result.orientation);
  assert.ok(a.distanceTo(b)<1e-10);
 }
});

import { advanceChaseAngles, chaseView } from '../src/flight-camera.js';
import { cockpitReadings, cockpitProjection, horizonSegment } from '../src/cockpit-projection.js';
import { createAircraft } from '../src/aircraft.js';
import { flightReport } from '../src/flight-session.js';

test('chase lag is immediate at zero and converges monotonically by the short angular path',()=>{
 const goal={heading:1,pitch:.5};
 assert.deepEqual(advanceChaseAngles({heading:0,pitch:0},goal,0,0),goal);
 let current={heading:0,pitch:0};
 for(let i=0;i<100;i++) {const next=advanceChaseAngles(current,goal,.02,.15);for(const k of ['heading','pitch'])assert.ok(next[k]>=current[k]&&next[k]<=goal[k]);current=next;}
 assert.ok(Math.abs(current.heading-1)<.00001);
 const short=advanceChaseAngles({heading:179*Math.PI/180,pitch:0},{heading:-179*Math.PI/180,pitch:0},.05,.15);
 assert.ok(Math.abs(short.heading)>179*Math.PI/180);
 const view=chaseView({heading:.3,pitch:1},0,1); assert.ok(view.offset.y>=1.2);
 const center=view.offset.clone().negate().applyQuaternion(view.orientation.clone().invert());
 assert.ok(Math.abs(center.x)<1e-10&&Math.abs(center.y)<1e-10&&center.z<0);
});

test('cockpit readings use physical speed, ground clearance, heading and full pitch',()=>{
 assert.deepEqual(cockpitReadings({speed:12.3,groundClearance:7.2,heading:-Math.PI/2,controlPitch:2*Math.PI/3,verticalSpeed:-2,throttle:.53}),
 {speed:12.3,altitude:7.2,heading:270,pitch:119.99999999999999,verticalSpeed:-2,power:53});
});

test('cockpit horizon and five-degree ladder use the rendered perspective and scene rotation',()=>{
 const width=390,height=844,fov=90;
 for(const pitch of [0,Math.PI/12,-Math.PI/6])for(const roll of [0,.6,Math.PI/2]) {
  const eye=pose(pitch), phone=new Quaternion().setFromAxisAngle(new Vector3(0,0,1),-roll);
  const state={fieldOfView:{vertical:fov},cameraQuaternion:phone,worldQuaternion:eye.clone().invert(),orientation:eye,heading:0,controlPitch:pitch,velocity:{x:0,y:0,z:-6}};
  const projection=cockpitProjection(state,width,height);
  // Any horizontal world ray lies on the HUD horizon after the same camera transform.
  for(const az of [-.6,0,.6]){const p=cockpitProjection(state,width,height).q;const direction=new Vector3(Math.sin(az),0,-Math.cos(az)).applyQuaternion(p);if(direction.z>=0)continue;
   const x=width/2+projection.f*direction.x/-direction.z,y=height/2-projection.f*direction.y/-direction.z;
   assert.ok(Math.abs(projection.horizon.a*(x-width/2)+projection.horizon.b*(y-height/2)+projection.horizon.c)<1e-8);
  }
  assert.ok([0,2].includes(horizonSegment(projection.horizon,width,height).length));
  assert.ok(projection.lines.length>0);assert.ok(projection.lines.every(l=>Math.abs(l.degrees-pitch*180/Math.PI)<=10+1e-8));
  if(!roll){const segment=horizonSegment(projection.horizon,width,height);assert.ok(Math.abs(segment[0].y-(height/2+projection.f*Math.tan(pitch)))<1e-8);}
 }
 const state={fieldOfView:{vertical:90},cameraQuaternion:new Quaternion(),worldQuaternion:new Quaternion(),orientation:new Quaternion(),heading:0,velocity:{x:0,y:-3,z:-6}};
 const p=cockpitProjection(state,390,844);assert.ok(p.flightPath.y>p.nose.y+100);
 const up5=p.lines.find(l=>l.degrees===5&&l.side===1).points[0];
 assert.ok(Math.abs(up5.y-(422-422*Math.tan(5*Math.PI/180)/Math.cos(2*Math.PI/180)))<1e-8);
});

test('shared jet has two engines with power-dependent exhaust and no light at zero',()=>{
 const jet=createAircraft();
 const values=[0,.3,1].map(p=>{jet.setPower(p);return jet.diagnostics();});
 assert.equal(values[0].engines,2);assert.equal(values[0].exhaustVisible,false);assert.equal(values[0].exhaustLength,0);
 assert.ok(values[2].exhaustLength>values[1].exhaustLength&&values[2].exhaustOpacity>values[1].exhaustOpacity);
 jet.setPower(0);assert.equal(jet.diagnostics().exhaustVisible,false);
});

test('reports identify the camera and mark camera lag unused in other views and exploration',()=>{
 for(const camera of ['overlay','chase','cockpit'])for(const mode of ['flight','explore']) {
  const report=flightReport({version:'0.1.16',pitch:'angle',steer:'tilt',camera,mode});
  assert.equal(report.camera,mode==='flight'?camera:'overlay');
  assert.equal(report.inactiveSettings.includes('chaseTimeConstant'),mode!=='flight'||camera!=='chase');
 }
});
