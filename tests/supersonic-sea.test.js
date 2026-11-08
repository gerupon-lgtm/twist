import test from 'node:test';
import assert from 'node:assert/strict';
import {Matrix4} from 'three';
import {createSupersonicSea,seaPatternPixel} from '../src/supersonic/sea.js';
test('sea image repeats in absolute metres at both wave scales',()=>{
  for(const [x,z]of [[0,0],[7.25,-19.5],[20000.125,-19999.8]]){
    assert.deepEqual(seaPatternPixel(x,z),seaPatternPixel(x+128,z));
    assert.deepEqual(seaPatternPixel(x,z),seaPatternPixel(x,z+256));
  }
  assert.notDeepEqual(seaPatternPixel(1,2),seaPatternPixel(3,2));
});
test('bounded sea rebases before float matrices and keeps texture/geometry resources stable',()=>{
  const sea=createSupersonicSea({maxAnisotropy:32}),texture=sea.texture,geometry=sea.tiles.geometry;
  sea.sync({x:19456,y:1024,z:-20480},123);const before=sea.snapshot(),matrix=new Matrix4();sea.tiles.getMatrixAt(40,matrix);
  assert.equal(matrix.elements[12],16384-19456);assert.equal(matrix.elements[13],-1024);
  sea.sync({x:20480,y:2048,z:-19456},123);const after=sea.snapshot();
  assert.deepEqual(after.phase,before.phase);assert.equal(after.tileCount,81);assert.equal(after.textureCount,1);assert.equal(after.anisotropy,8);assert.equal(after.mipmaps,true);
  assert.equal(sea.texture,texture);assert.equal(sea.tiles.geometry,geometry);assert.equal(after.updates,1);
  sea.setStrength(.8);assert.equal(sea.snapshot().updates,1);sea.setStrength(.3);assert.equal(sea.snapshot().updates,2);
  let disposed=0;texture.addEventListener('dispose',()=>disposed++);geometry.addEventListener('dispose',()=>disposed++);sea.material.addEventListener('dispose',()=>disposed++);
  sea.dispose();sea.dispose();assert.equal(disposed,3);assert.equal(sea.snapshot().textureCount,0);assert.equal(sea.snapshot().tileCount,0);
});
