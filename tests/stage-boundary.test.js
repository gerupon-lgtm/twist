import test from 'node:test';import assert from 'node:assert/strict';import {Matrix4,Vector3} from 'three';
import {createStageBoundary} from '../src/stage-boundary.js';
test('storm perimeter uses one static batch of 64 visible puffs at the arena edges',()=>{
 const boundary=createStageBoundary();assert.ok(boundary?.group);const mesh=boundary.group.children.find(child=>child.isInstancedMesh);assert.ok(mesh);assert.equal(mesh.count,64);
 const matrix=new Matrix4(),position=new Vector3();for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);assert.equal(Math.max(Math.abs(position.x),Math.abs(position.z)),350);}
 const details=boundary.snapshot();assert.equal(details.collisions,false);assert.equal(details.batches,1);assert.equal(details.halfExtent,350);assert.equal(mesh.material.fog,false);
});
test('storm update changes only bounded material appearance, not instance geometry',()=>{
 const boundary=createStageBoundary({halfExtent:400});assert.ok(boundary?.group);const mesh=boundary.group.children[0],before=mesh.instanceMatrix.array.slice();boundary.update(12);
 assert.equal(before.findIndex((value,i)=>value!==mesh.instanceMatrix.array[i]),-1);assert.ok(mesh.material.opacity>=.7&&mesh.material.opacity<=.95);assert.equal(boundary.snapshot().halfExtent,400);
 const opacity=mesh.material.opacity;boundary.update(NaN);assert.equal(mesh.material.opacity,opacity);
 const snapshot=boundary.snapshot();snapshot.halfExtent=1;assert.equal(boundary.snapshot().halfExtent,400);
});
