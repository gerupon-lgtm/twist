import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {SIERRA10_COURSE} from '../src/courses/sierra10.js';import {createSierra10World} from '../src/supersonic/sierra-world.js';
test('land scenery uses bounded shared resources, static ground phase and disposed resources exactly once',()=>{
 const w=createSierra10World({course:SIERRA10_COURSE});w.sync({x:0,y:0,z:0},0);const before=w.snapshot(),objects=w.getPassObjects();assert.equal(before.gateCount,7);assert.equal(before.ground.tileCount,169);assert.deepEqual(before.ground.patternScales,[320,40,8]);assert.ok(before.mountainCount>=8&&before.poleCount>40);
 for(let i=0;i<100;i++)w.sync({x:i*1024,y:0,z:-i*1024},i,{activeGateIndex:i%7});const after=w.snapshot();assert.equal(after.geometryCount,before.geometryCount);assert.equal(after.materialCount,before.materialCount);assert.equal(after.ground.updates,1);assert.equal(w.getPassObjects(),objects);
 const phase=after.ground.phase;w.sync(after.origin,999);assert.deepEqual(w.snapshot().ground.phase,phase);
 w.setVisibility('classic');assert.equal(w.getPassObjects().length,0);assert.equal(w.group.getObjectByName('sierra-ground').visible,true);w.setVisibility('assisted');assert.equal(w.getPassObjects(),objects);
 w.dispose();w.dispose();assert.equal(w.snapshot().ground.textureCount,0);assert.equal(w.snapshot().geometryCount,0);assert.equal(w.snapshot().materialCount,0);
});
test('land tile phases stay anchored in absolute metres across origin shifts',()=>{
 const w=createSierra10World({course:SIERRA10_COURSE}),tiles=w.group.getObjectByName('sierra-ground-tiles'),m=new THREE.Matrix4();
 const uv=(origin,p)=>{w.sync(origin,0);let best=Infinity,index=0,cx=0,cz=0;for(let i=0;i<tiles.count;i++){tiles.getMatrixAt(i,m);const x=m.elements[12]+origin.x,z=m.elements[14]+origin.z,d=Math.hypot(x-p.x,z-p.z);if(d<best){best=d;index=i;cx=x;cz=z;}}
  const phases=tiles.geometry.getAttribute('groundTilePhase'),offset=tiles.material.map.offset;return [(p.x-cx)/320+phases.getX(index)+offset.x,(p.z-cz)/320+phases.getY(index)+offset.y].map(v=>((v%1)+1)%1);};
 const point={x:1123,z:-2765},a=uv({x:0,y:0,z:0},point),b=uv({x:1024,y:0,z:-2048},point);for(let i=0;i<2;i++)assert.ok(Math.abs(a[i]-b[i])<1e-6);
 const gate=w.group.getObjectByName(SIERRA10_COURSE.gates[0].id);assert.equal(gate.position.x,SIERRA10_COURSE.lights[0].x-1024);w.dispose();
});
