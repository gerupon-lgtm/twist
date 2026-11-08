// Synthetic quaternion expectations are not measurements of an actual wrist.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Quaternion,Vector3} from 'three';
import {deviceTiltAngles,relativeAngles} from '../src/controls.js';
import {createWristReference,readWristAngles,preserveWristInput} from '../src/wrist-controls.js';

const rad=degrees=>degrees*Math.PI/180,deg=radians=>radians*180/Math.PI;
const axis=(x,y,z)=>new Vector3(x,y,z).normalize();
const rotate=(v,degrees)=>new Quaternion().setFromAxisAngle(new Vector3(v.x,v.y,v.z),rad(degrees));
const x=axis(1,0,0),y=axis(0,1,0),up=axis(0,0,1);
const near=(actual,expected,tolerance=1e-6)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} vs ${expected}`);
function physicalReference(hold,screenAngle=0,heading=0){
  const display=rotate(up,heading).multiply(rotate(x,hold));
  const raw=display.clone().multiply(rotate(up,screenAngle));
  return {raw,reference:createWristReference({rawQuaternion:raw,screenAngle})};
}
const current=(reference,worldRotation)=>worldRotation.clone().multiply(reference.raw);
function assertFinite(value){
  if(typeof value==='number')assert.ok(Number.isFinite(value));
  else if(value&&typeof value==='object')for(const item of Object.values(value))assertFinite(item);
}

test('calibration uses sensor Z-up and freezes its horizontal forearm estimate',()=>{
  for(const hold of [0,30,45,60,90])for(const screen of [0,90,-90])for(const heading of [0,90,179]){
    const fixture=physicalReference(hold,screen,heading),r=fixture.reference,expected=axis(0,1,0).applyAxisAngle(up,rad(heading));
    assert.equal(r.valid,true);near(r.axisWorld.z,0);near(r.axisWorld.x,expected.x);near(r.axisWorld.y,expected.y);
    near(r.holdInclinationDegrees,hold);near(r.pitchAxisWorld.z,0);
    near(r.axisWorld.x*r.pitchAxisWorld.x+r.axisWorld.y*r.pitchAxisWorld.y,0);
    assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.axisWorld)&&Object.isFrozen(r.rawQuaternion));assertFinite(r);
  }
});

test('the same physical wrist rotation reads plus/minus fifteen at all five holds and both landscapes',()=>{
  for(const hold of [0,30,45,60,90])for(const screen of [0,90,-90])for(const heading of [0,90,179])for(const amount of [-15,15]){
    const fixture=physicalReference(hold,screen,heading),r=fixture.reference,reading=readWristAngles(r,current(fixture,rotate(r.axisWorld,amount)));
    assert.equal(reading.valid,true);near(reading.wrist,amount);near(reading.wristPitch,0);assertFinite(reading);
  }
});

test('legacy tilt/twist contributions vary with hold while their existing functions remain untouched',()=>{
  const flat=physicalReference(0),upright=physicalReference(90);
  const a=deviceTiltAngles(flat.raw,current(flat,rotate(y,15)),0),b=deviceTiltAngles(upright.raw,current(upright,rotate(y,15)),0);
  near(a.steer,15);near(a.twist,0);near(b.steer,0);near(b.twist,15);
  near(readWristAngles(flat.reference,current(flat,rotate(y,15))).wrist,15);
  near(readWristAngles(upright.reference,current(upright,rotate(y,15))).wrist,15);
});

test('pure world vertical yaw and pure horizontal pitch do not command wrist steering',()=>{
  for(const hold of [0,30,45,60,90])for(const screen of [0,90,-90]){
    const fixture=physicalReference(hold,screen,37),r=fixture.reference;
    for(const amount of [-179,-60,-15,15,60,179]){
      const reading=readWristAngles(r,current(fixture,rotate(up,amount)));
      assert.equal(reading.valid,true);near(reading.wrist,0);near(reading.wristPitch,0);
    }
    for(const amount of [-30,-15,15,30]){
      const reading=readWristAngles(r,current(fixture,rotate(r.pitchAxisWorld,amount)));
      assert.equal(reading.valid,true);near(reading.wrist,0);near(reading.wristPitch,amount);
    }
  }
});

test('wrist-only swing pitch removes isolated steering leakage through the full allowed forty-degree range',()=>{
  for(const hold of [0,30,45,60,90])for(const screen of [0,90,-90])for(const amount of [-40,-25,-15,15,25,40]){
    const fixture=physicalReference(hold,screen),reading=readWristAngles(fixture.reference,current(fixture,rotate(fixture.reference.axisWorld,amount)));
    assert.equal(reading.valid,true);near(reading.wrist,amount);near(reading.wristPitch,0);
  }
  // Analytic regression fixture to execute later: unchanged legacy projection
  // is expected to leak >7deg pitch at hold45/wrist40; this is NOT a test result.
  const fixture=physicalReference(45),raw=current(fixture,rotate(y,40));
  const legacy=deviceTiltAngles(fixture.raw,raw,0);
  assert.ok(Math.abs(legacy.pitch)>7);near(readWristAngles(fixture.reference,raw).wristPitch,0);
});

test('q versus minus q, non-unit scale and arbitrary reference heading retain the same reading',()=>{
  const fixture=physicalReference(60,-90,123),raw=current(fixture,rotate(fixture.reference.axisWorld,-17));
  const scaled=(q,k)=>({x:q.x*k,y:q.y*k,z:q.z*k,w:q.w*k});
  for(const a of [1,-1,1e300,-1e-300])for(const b of [1,-1,1e300,-1e-300]){
    const reference=createWristReference({rawQuaternion:scaled(fixture.raw,a),screenAngle:-90});
    const reading=readWristAngles(reference,scaled(raw,b));assert.equal(reading.valid,true);near(reading.wrist,-17);near(reading.wristPitch,0);
  }
});

test('layout-angle aliases represent the same physical display calibration without adding input',()=>{
  for(const screen of [-450,-270,-90,0,90,180,270,360,450]){
    const fixture=physicalReference(45,screen,22),reference=fixture.reference;
    near(readWristAngles(reference,fixture.raw).wrist,0);
    near(readWristAngles(reference,current(fixture,rotate(reference.axisWorld,15))).wrist,15);
    const before=JSON.stringify(reference);
    // Current layout angles are deliberately absent from the read API. The
    // integration browser test must separately change screen.orientation.angle.
    readWristAngles(reference,fixture.raw);assert.equal(JSON.stringify(reference),before);
  }
});

test('recenter creates a new immutable neutral; pause/resume reads do not integrate drift',()=>{
  const fixture=physicalReference(30,90,70),raw=current(fixture,rotate(fixture.reference.axisWorld,25)),old=JSON.stringify(fixture.reference);
  for(let i=0;i<30;i++)near(readWristAngles(fixture.reference,raw).wrist,25);
  const next=createWristReference({rawQuaternion:raw,screenAngle:90});near(readWristAngles(next,raw).wrist,0);
  const again=rotate(next.axisWorld,-15).multiply(raw);near(readWristAngles(next,again).wrist,-15);
  assert.equal(JSON.stringify(fixture.reference),old);
});

test('opposed horizontal projections use the longer original vector and deterministic back ties',()=>{
  for(const [hold,source,direction]of [[-30,'top',1],[-45,'back',-1],[-60,'back',-1]]){
    const fixture=physicalReference(hold),reference=fixture.reference;
    assert.equal(reference.valid,true);assert.equal(reference.axisSource,source);assert.equal(reference.fallbackReason,'opposed-horizontal-projections');
    near(reference.axisWorld.y,direction);near(reference.axisWorld.z,0);assertFinite(reference);
  }
  assert.equal(physicalReference(0).reference.axisSource,'top');
  assert.equal(physicalReference(90).reference.axisSource,'back');
});

test('corrupt raw samples fail finite and an undefined half-turn swing holds the last usable command',()=>{
  const fixture=physicalReference(45);
  for(const raw of [null,{}, {x:0,y:0,z:0,w:0},{x:NaN,y:0,z:0,w:1},{x:Infinity,y:0,z:0,w:1}]){
    assert.equal(createWristReference({rawQuaternion:raw}).valid,false);
    const reading=readWristAngles(fixture.reference,raw);assert.equal(reading.valid,false);assertFinite(reading);
  }
  assert.equal(createWristReference({rawQuaternion:fixture.raw,screenAngle:NaN}).valid,false);
  const singular=readWristAngles(fixture.reference,current(fixture,rotate(fixture.reference.pitchAxisWorld,180)));
  assert.equal(singular.valid,false);assert.equal(singular.reason,'swing-twist-singularity');
  assert.deepEqual(preserveWristInput({wrist:12,wristPitch:-8},singular),{wrist:12,wristPitch:-8,valid:false,reason:'swing-twist-singularity',held:true});
  assert.equal(preserveWristInput(null,singular).wrist,0);
  const corrupt={...fixture.reference,axisWorld:{x:1e308,y:1e308,z:0}};
  assert.equal(readWristAngles(corrupt,fixture.raw).valid,false);
});

test('combined yaw/pitch is a disclosed noncommutative negative control, not false body-motion cancellation',()=>{
  const fixture=physicalReference(0),yaw=20,pitch=15;
  const forward=readWristAngles(fixture.reference,current(fixture,rotate(up,yaw).multiply(rotate(x,pitch))));
  const reverse=readWristAngles(fixture.reference,current(fixture,rotate(x,pitch).multiply(rotate(up,yaw))));
  const expected=deg(2*Math.atan(Math.tan(rad(yaw)/2)*Math.tan(rad(pitch)/2)));
  near(forward.wrist,expected);near(reverse.wrist,-expected);assert.ok(expected>2);
});

test('compound wrist/pitch follows the declared swing-times-twist order and exposes the reverse-order coupling',()=>{
  const fixture=physicalReference(45),r=fixture.reference,twist=rotate(r.axisWorld,25),pitch=rotate(r.pitchAxisWorld,15);
  const swingFirst=readWristAngles(r,current(fixture,pitch.clone().multiply(twist)));
  const twistFirst=readWristAngles(r,current(fixture,twist.clone().multiply(pitch)));
  near(swingFirst.wrist,25);near(swingFirst.wristPitch,15);
  near(twistFirst.wrist,25);near(twistFirst.wristPitch,15*Math.cos(rad(25)));
});

test('the half-turn shortest-angle seam remains explicit instead of silently inventing folded wrist input',()=>{
  const fixture=physicalReference(0);
  const a=readWristAngles(fixture.reference,current(fixture,rotate(y,179.999))),b=readWristAngles(fixture.reference,current(fixture,rotate(y,180.001)));
  assert.ok(a.wrist>179.99&&b.wrist< -179.99);assert.equal(a.nearHalfTurn,true);assert.equal(b.nearHalfTurn,true);assertFinite(a);assertFinite(b);
});

test('display compensation remains the existing local screen-normal twist, independent of the new wrist angle',()=>{
  const fixture=physicalReference(45),raw=current(fixture,rotate(y,15));
  const legacy=relativeAngles(fixture.raw,raw).twist,reading=readWristAngles(fixture.reference,raw);
  near(reading.wrist,15);assert.ok(Math.abs(legacy-reading.wrist)>1);
  // The main branch must continue to pass this legacy value to
  // stage.displayTwist. The pure helper never substitutes reading.wrist for it.
});

test('mixed yaw/pitch/wrist matrix follows the declared quaternion order and exposes rather than hides coupling',()=>{
  for(const hold of [0,30,45,60,90])for(const screen of [0,90,-90])for(const yaw of [-30,30])for(const pitch of [-15,15])for(const wrist of [-25,25])for(const order of ['yaw-pitch','pitch-yaw']){
    const fixture=physicalReference(hold,screen,37),r=fixture.reference;
    const yawQ=rotate(up,yaw),pitchQ=rotate(r.pitchAxisWorld,pitch),wristQ=rotate(r.axisWorld,wrist);
    const Q=(order==='yaw-pitch'?yawQ.multiply(pitchQ):pitchQ.multiply(yawQ)).multiply(wristQ);
    const raw=current(fixture,Q),reading=readWristAngles(r,raw);
    const leak=deg(2*Math.atan(Math.tan(rad(yaw)/2)*Math.tan(rad(pitch)/2)))*(order==='yaw-pitch'?1:-1);
    assert.equal(reading.valid,true);near(reading.wrist,wrist+leak);assertFinite(reading);
    const recentered=createWristReference({rawQuaternion:raw,screenAngle:screen});near(readWristAngles(recentered,raw).wrist,0);
  }
});
