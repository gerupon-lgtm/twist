import test from 'node:test';import assert from 'node:assert/strict';import {Quaternion,Vector3,Euler} from 'three';import {deviceTiltAngles} from '../src/controls.js';
const rad=d=>d*Math.PI/180;
for(const angle of [0,90,180,270,450])test(`screen axes map compound tilt at ${angle} degrees`,()=>{
 const reference=new Quaternion().setFromEuler(new Euler(.3,-.2,.7));const screen=new Quaternion().setFromAxisAngle(new Vector3(0,0,1),-rad(angle));
 const tilt=new Quaternion().setFromAxisAngle(new Vector3(1,0,0),rad(12)).multiply(new Quaternion().setFromAxisAngle(new Vector3(0,1,0),rad(-7)));
 const current=reference.clone().multiply(screen).multiply(tilt).multiply(screen.clone().invert());const a=deviceTiltAngles(reference,current,angle),b=deviceTiltAngles(new Quaternion(),tilt,0);
 assert.ok(a.valid);assert.ok(Math.abs(a.pitch-b.pitch)<1e-8);assert.ok(Math.abs(a.steer-b.steer)<1e-8);
});
test('a display rotation does not add twist or erase neutral',()=>{const q=new Quaternion().setFromEuler(new Euler(.4,.2,-.8));for(const angle of [0,90,180,270]){const a=deviceTiltAngles(q,q,angle);assert.ok(a.valid);assert.ok(Math.abs(a.pitch)+Math.abs(a.steer)+Math.abs(a.twist)<1e-8);}});
test('invalid display angles fail closed',()=>{for(const angle of [NaN,Infinity,null])assert.equal(deviceTiltAngles(new Quaternion(),new Quaternion(),angle).valid,false);});
