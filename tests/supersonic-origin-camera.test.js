import test from 'node:test';
import assert from 'node:assert/strict';
import {Euler,Group,PerspectiveCamera,Quaternion,Vector3} from 'three';
import {chooseRenderOrigin,relativeToOrigin,surfacePhase,positiveModulo} from '../src/supersonic/origin.js';
import {supersonicCameraFrame,renderRootTranslation,cameraLocalPosition,projectCameraPoint} from '../src/supersonic/camera.js';
import {createGuidanceProjection} from '../src/guidance-layout.js';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);
test('origin has stable grid boundaries and subtracts before float upload',()=>{
  const original={x:0,y:0,z:0};assert.equal(chooseRenderOrigin({x:512,y:0,z:-512},original),original);
  assert.deepEqual(chooseRenderOrigin({x:512.001,y:0,z:-512.001},original),{x:1024,y:0,z:-1024});
  const position={x:20000.001,y:1500,z:-19999.999},origin=chooseRenderOrigin(position),copy={...position};
  const relative=relativeToOrigin(position,origin),packed=new Float32Array([relative.x,relative.y,relative.z]);
  const halfUlp=value=>2**(Math.floor(Math.log2(Math.abs(value)))-24);
  near(packed[0],relative.x,halfUlp(relative.x));near(packed[2],relative.z,halfUlp(relative.z));assert.deepEqual(position,copy);
  assert.ok(Math.abs((Math.fround(position.x)-origin.x)-relative.x)>1e-4);
});
test('sea phases remain world anchored across positive and negative rebases',()=>{
  const point={x:20000.25,y:0,z:-20000.5},time=371.25,wind={x:.7,z:.2};
  for(const period of [8,128,127]){
    const observed=[];
    for(const origin of [{x:19456,y:1024,z:-20480},{x:20480,y:2048,z:-19456}]){
      const local=relativeToOrigin(point,origin),phase=surfacePhase(origin,period,time,wind);
      observed.push([positiveModulo(local.x/period+phase.x,1),positiveModulo(local.z/period+phase.z,1)]);
    }
    near(observed[0][0],observed[1][0]);near(observed[0][1],observed[1][1]);
  }
});
test('all three real scene transforms agree with guidance and analytic projection across origins',()=>{
  const state={position:{x:19968.125,y:1500,z:-19968.25},orientation:new Quaternion().setFromEuler(new Euler(.13,-.37,-.6,'YXZ')),bank:.6};
  const target={x:20015,y:1560,z:-21000};
  for(const cameraMode of ['overlay','chase','cockpit'])for(const display of ['bank','fixed']){
    const frame=supersonicCameraFrame(state,{cameraMode,display,phoneRoll:.2,shake:{x:.001,y:-.002,z:.0003}});
    const local=cameraLocalPosition(target,frame),perspective=new PerspectiveCamera(64,390/844,2,64000);
    perspective.quaternion.copy(frame.cameraQuaternion);perspective.updateMatrixWorld(true);
    for(const origin of [{x:19456,y:1024,z:-20480},{x:20480,y:2048,z:-19456}]){
      const world=new Group(),point=new Group();world.quaternion.copy(frame.worldQuaternion);world.position.copy(renderRootTranslation(origin,frame));
      point.position.copy(relativeToOrigin(target,origin));world.add(point);world.updateMatrixWorld(true);
      const actual=point.getWorldPosition(new Vector3()).applyMatrix4(perspective.matrixWorldInverse);
      near(actual.x,local.x);near(actual.y,local.y);near(actual.z,local.z);
    }
    const projection=createGuidanceProjection({worldQuaternion:frame.worldQuaternion,cameraQuaternion:frame.cameraQuaternion,targetLocal:local,fieldOfView:{vertical:64},cameraClipping:{near:2,far:64000}},390,844);
    const projected=projection.target(),expected=projectCameraPoint(local,390,844,64);
    near(projected.x,expected.x);near(projected.y,expected.y);
  }
});
