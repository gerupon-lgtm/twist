import test from 'node:test';
import assert from 'node:assert/strict';
import {Quaternion,Vector3} from 'three';
import {createGuidanceProjection,placeGuidanceCenter,guidanceDirectionAllowed,guidanceSafeDirections} from '../src/guidance-layout.js';
const identity={x:0,y:0,z:0,w:1};
const state={worldQuaternion:identity,cameraQuaternion:identity,fieldOfView:{vertical:90},targetLocal:{x:0,y:0,z:-10},cameraClipping:{near:.1,far:250}};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('direction projection uses actual vertical FOV and inverse camera times world root',()=>{
  const root=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),.25);
  const camera=new Quaternion().setFromAxisAngle(new Vector3(0,0,1),-.3);
  const p=createGuidanceProjection({...state,worldQuaternion:root,cameraQuaternion:camera},390,844);
  assert.ok(p);
  const direction={x:.1,y:.2,z:-1},point=p.projectDirection(direction);
  const local=new Vector3(.1,.2,-1).applyQuaternion(camera.clone().invert().multiply(root));
  near(point.x,195+422*local.x/-local.z);near(point.y,422-422*local.y/-local.z);
});

test('a displayed pixel reconstructs the exact world ray after a camera clamp',()=>{
  const root=new Quaternion().setFromAxisAngle(new Vector3(1,0,0),.4);
  const p=createGuidanceProjection({...state,worldQuaternion:root},844,390);
  assert.ok(p);
  const ray=p.rayFromPixel(300,100),pixel=p.projectDirection(ray);
  near(pixel.x,300);near(pixel.y,100);near(Math.hypot(ray.x,ray.y,ray.z),1);
});

test('target visibility uses the actual viewport instead of the narrower cockpit clear area',()=>{
  const p=createGuidanceProjection({...state,targetLocal:{x:-4.4,y:0,z:-10}},390,844);
  assert.ok(p);const target=p.target();
  assert.equal(target.visible,true);assert.equal(target.inViewport,true);assert.ok(target.x<24);
  assert.equal(createGuidanceProjection({...state,targetLocal:{x:-5,y:0,z:-10}},390,844).target().inViewport,false);
});

test('rear and clipped targets are not visible and invalid projection inputs fail closed',()=>{
  for(const targetLocal of [{x:0,y:0,z:10},{x:0,y:0,z:-.01},{x:0,y:0,z:-300}]){
    const p=createGuidanceProjection({...state,targetLocal},390,844);assert.ok(p);assert.equal(p.target().visible,false);
  }
  for(const s of [null,{...state,fieldOfView:{vertical:0}},{...state,worldQuaternion:{x:0,y:0,z:0,w:0}}])assert.equal(createGuidanceProjection(s,390,844),null);
});

test('director placement moves above an open control panel while staying inside the viewport',()=>{
  const point=placeGuidanceCenter({x:195,y:500},{left:0,right:390,top:0,bottom:640},[{left:20,right:370,top:420,bottom:640}],{width:48,height:48});
  assert.ok(point);assert.ok(point.y+24<=415);assert.ok(point.x>=24&&point.x<=366);
});

test('placement preserves a free projected point and reports a fully blocked view',()=>{
  const bounds={left:0,right:390,top:0,bottom:640};
  assert.deepEqual(placeGuidanceCenter({x:100,y:200},bounds,[],{width:48,height:48}),{x:100,y:200});
  assert.equal(placeGuidanceCenter({x:100,y:200},bounds,[bounds],{width:48,height:48}),null);
});

const direction=(yaw,climb)=>({x:Math.sin(yaw*Math.PI/180)*Math.cos(climb*Math.PI/180),
  y:Math.sin(climb*Math.PI/180),z:-Math.cos(yaw*Math.PI/180)*Math.cos(climb*Math.PI/180)});
const advice={mode:'target',commandedYawDegrees:15,yawErrorDegrees:15,commandedClimbDegrees:8,climbErrorDegrees:8,minClimbDegrees:-10,maxClimbDegrees:10};
test('displayed rays obey increment/global limits and never reverse the advised motion',()=>{
  assert.equal(guidanceDirectionAllowed(direction(15,8),advice),true);
  assert.equal(guidanceDirectionAllowed(direction(7,4),advice),true);
  for(const ray of [direction(16,4),direction(-1,4),direction(7,11),direction(7,-1),direction(7,9)])assert.equal(guidanceDirectionAllowed(ray,advice),false);
});
test('recover may retain only the documented out-of-range step without adding yaw',()=>{
  const recovering={mode:'recover',commandedYawDegrees:20,yawErrorDegrees:0,commandedClimbDegrees:20,climbErrorDegrees:-10,minClimbDegrees:-10,maxClimbDegrees:10};
  assert.equal(guidanceDirectionAllowed(direction(20,20),recovering),true);
  for(const ray of [direction(21,20),direction(20,25),direction(20,9),direction(20,30)])assert.equal(guidanceDirectionAllowed(ray,recovering),false);
  assert.ok(guidanceSafeDirections(recovering).every(ray=>guidanceDirectionAllowed(ray,recovering)));
});
test('narrow landscape clamp filters a closer wrong-turn point and preserves a safe ray',()=>{
  const p=createGuidanceProjection(state,844,390),flat={...advice,commandedClimbDegrees:0,climbErrorDegrees:0};
  const raw=p.projectDirection(direction(15,0)),bounds={left:12,right:832,top:12,bottom:378};
  const accept=point=>guidanceDirectionAllowed(p.rayFromPixel(point.x,point.y),flat);
  const point=placeGuidanceCenter(raw,bounds,[{left:460,right:520,top:150,bottom:240}],{width:62,height:62,accept,
    candidates:guidanceSafeDirections(flat).map(ray=>p.projectDirection(ray))});
  assert.ok(point);assert.ok(point.x>=422);assert.equal(accept(point),true);
});
test('narrow landscape does not invent climb or an opposite turn when all safe rays are blocked',()=>{
  const p=createGuidanceProjection(state,844,390),flat={...advice,commandedClimbDegrees:0,climbErrorDegrees:0};
  const point=placeGuidanceCenter(p.projectDirection(direction(15,0)),{left:12,right:832,top:12,bottom:378},
    [{left:450,right:520,top:150,bottom:240}],{width:62,height:62,
      accept:point=>guidanceDirectionAllowed(p.rayFromPixel(point.x,point.y),flat),
      candidates:guidanceSafeDirections(flat).map(ray=>p.projectDirection(ray))});
  assert.equal(point,null);
});
test('a steep camera attitude cannot push a level command upward to fit a ring',()=>{
  const q=new Quaternion().setFromAxisAngle(new Vector3(1,0,0),40*Math.PI/180);
  const p=createGuidanceProjection({...state,worldQuaternion:q},844,390);
  const level={...advice,commandedYawDegrees:0,yawErrorDegrees:0,commandedClimbDegrees:0,climbErrorDegrees:0};
  assert.equal(placeGuidanceCenter(p.projectDirection(direction(0,0)),{left:12,right:832,top:12,bottom:378},[],
    {width:62,height:62,accept:point=>guidanceDirectionAllowed(p.rayFromPixel(point.x,point.y),level)}),null);
});
