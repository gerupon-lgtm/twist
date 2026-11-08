import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupersonicWorld} from '../src/supersonic/world.js';
import {SUPERSONIC_COURSE} from '../src/supersonic/course.js';

test('world keeps bounded objects and absolute cloud wind phase across rebases',()=>{
  const world=createSupersonicWorld({course:SUPERSONIC_COURSE});
  world.sync({x:0,y:1024,z:18432},10,{activeGateIndex:0});
  const initial=world.snapshot(),passes=world.getPassObjects(),cloud=passes[0],position={...cloud.position};
  assert.equal(initial.gateCount,6);assert.equal(initial.cloudCount,128);assert.equal(initial.cloudInstanceCount,384);assert.equal(passes.length,128);
  assert.deepEqual(initial.cloudLayers,[{min:400,max:800},{min:2000,max:2400}]);
  world.sync({x:1024,y:1024,z:18432},10,{activeGateIndex:1});
  assert.equal(world.getPassObjects(),passes);assert.equal(world.getPassObjects()[0],cloud);assert.deepEqual(cloud.position,position);
  world.sync({x:1024,y:1024,z:18432},11,{activeGateIndex:1});
  assert.equal(cloud.position.x,position.x+8);assert.equal(cloud.position.z,position.z+4);assert.equal(cloud.position.y,position.y);
  const geometry=world.snapshot().geometryCount,material=world.snapshot().materialCount;
  for(let i=0;i<150;i++)world.sync({x:i*1024,y:2048,z:-i*1024},11+i/60,{activeGateIndex:2});
  assert.equal(world.snapshot().geometryCount,geometry);assert.equal(world.snapshot().materialCount,material);
  world.setVisibility('legacy');assert.equal(world.getPassObjects().length,0);world.setVisibility('assisted');assert.equal(world.getPassObjects(),passes);
  world.dispose();world.dispose();assert.equal(world.snapshot().geometryCount,0);assert.equal(world.snapshot().materialCount,0);assert.equal(world.snapshot().sea.textureCount,0);
});

test('all static meshes and cloud instance translations use CPU subtraction before Float32',()=>{
  const world=createSupersonicWorld({course:SUPERSONIC_COURSE});
  const origin={x:19456,y:1024,z:-19456};world.sync(origin,0,{activeGateIndex:0});
  const gate=world.group.getObjectByName('supersonic-gate-1');
  assert.equal(gate.position.x,-19456);assert.equal(gate.position.y,476);assert.equal(gate.position.z,31456);
  for(const layer of world.group.children.filter(o=>o.name.startsWith('cloud-layer-'))){
    for(let i=0;i<layer.count;i++){
      const y=layer.instanceMatrix.array[i*16+13]+origin.y;
      assert.ok(layer.name.endsWith('0')?y>=490&&y<=710:y>=2090&&y<=2310);
    }
  }
  world.dispose();
});
