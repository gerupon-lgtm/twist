import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Euler,Quaternion,Vector3} from 'three';
import {ConvexHull} from 'three/addons/math/ConvexHull.js';
import {createAircraft} from '../src/aircraft.js';
import {SUPERSONIC_AIRCRAFT_HULL as points,SUPERSONIC_AIRCRAFT_HULL_ID as id,SUPERSONIC_AIRCRAFT_HULL_SCALE as scale} from '../src/supersonic/aircraft-hull.js';

function solidVertices(){
  const aircraft=createAircraft();aircraft.setPower(1,true);aircraft.group.updateMatrixWorld(true);
  const vertices=[];
  aircraft.group.traverse(mesh=>{
    if(!mesh.isMesh||mesh.material?.transparent===true)return;
    const source=mesh.geometry.getAttribute('position');
    for(let i=0;i<source.count;i++)vertices.push(new Vector3().fromBufferAttribute(source,i).applyMatrix4(mesh.matrixWorld));
  });
  aircraft.group.traverse(mesh=>{mesh.geometry?.dispose();mesh.material?.dispose();});
  return vertices;
}
const near=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
test('supersonic hull is immutable body-space geometry at one metre per unit',()=>{
  assert.equal(id,'twist-original-twin-jet-solid-hull-v1');assert.equal(scale,1);assert.equal(points.length,44);
  assert.ok(Object.isFrozen(points)&&points.every(p=>Object.isFrozen(p)&&[p.x,p.y,p.z].every(Number.isFinite)));
  const box=new Box3().setFromPoints(points.map(p=>new Vector3(p.x,p.y,p.z)));
  near(box.min.x,-2.05);near(box.max.x,2.05);near(box.min.z,-2.9);near(box.max.z,2.24);
  near(box.min.y,-.48);near(box.max.y,1.1447601557167577);
});
test('all rendered solid aircraft vertices are inside the shared convex hull, excluding powered exhaust',()=>{
  const solid=solidVertices(),hull=new ConvexHull().setFromPoints(points.map(p=>new Vector3(p.x,p.y,p.z)));
  assert.equal(solid.length,777);
  let outside=0,worst=0;
  for(const vertex of solid)for(const face of hull.faces){const distance=face.distanceToPoint(vertex);worst=Math.max(worst,distance);if(distance>1e-7)outside++;}
  assert.equal(outside,0,`solid vertices outside hull: ${outside}, greatest separation ${worst}`);
});
test('hull sea support equals rendered solid geometry through upright, banked and inverted poses',()=>{
  const solid=solidVertices(),hull=points.map(p=>new Vector3(p.x,p.y,p.z));
  for(let i=0;i<128;i++){
    const q=new Quaternion().setFromEuler(new Euler(i*.217,i*.371,i*.593,'YXZ'));
    const minimum=list=>Math.min(...list.map(p=>p.clone().applyQuaternion(q).y));
    near(minimum(hull),minimum(solid));
  }
  const roll=new Quaternion().setFromAxisAngle(new Vector3(0,0,-1),Math.acos(1/9));
  near(Math.min(...hull.map(p=>p.clone().applyQuaternion(roll).y)),-2.0373063321113505);
});
