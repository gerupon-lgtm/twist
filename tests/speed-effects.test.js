import test from 'node:test';
import assert from 'node:assert/strict';
import {Matrix4,Vector3} from 'three';
import {speedPresentation,createSpeedEffects} from '../src/speed-effects.js';
import {createScenery} from '../src/scenery.js';
import {createAircraft} from '../src/aircraft.js';

const DEG=Math.PI/180;
const near=(actual,expected,epsilon=1e-9)=>assert.ok(Math.abs(actual-expected)<=epsilon,`${actual} != ${expected}`);
function dispose(group){
  const geometries=new Set(),materials=new Set();
  group.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);if(object.isInstancedMesh)object.dispose();});
  for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();
}

test('speed FOV is based on actual speed, bounded settings, and an independently switchable AB extra',()=>{
  near(speedPresentation(10).extraFov,0);near(speedPresentation(20).extraFov,5);near(speedPresentation(30).extraFov,10);
  near(speedPresentation(45,{}, {active:true}).extraFov,13);
  near(speedPresentation(45,{speedFov:15},{active:true}).extraFov,19.5);
  near(speedPresentation(30,{speedFov:100},{active:true}).extraFov,19.5);
  for(const active of [false,true])near(speedPresentation(45,{speedFov:0},{active}).extraFov,0);
  for(const value of [0,-1,NaN,Infinity,undefined,'30']){
    const result=speedPresentation(value,{}, {active:true});near(result.extraFov,0);assert.deepEqual(result.shake,{x:0,y:0,z:0});
  }
  const settings={speedFov:8,highSpeedShake:true},ab={active:true},before=JSON.stringify({settings,ab});
  speedPresentation(45,settings,ab,1);assert.equal(JSON.stringify({settings,ab}),before);
});

test('camera shake is deterministic, tiny, weaker in cockpit, and exactly zero when disabled',()=>{
  for(const camera of ['overlay','chase','cockpit'])for(let index=0;index<100;index++){
    const t=index*.071,maximum=(camera==='cockpit'?.035:.12)*DEG;
    const output=speedPresentation(45,{}, {active:true},t,camera);
    for(const value of Object.values(output.shake))assert.ok(Number.isFinite(value)&&Math.abs(value)<=maximum);
    assert.deepEqual(output,speedPresentation(45,{}, {active:true},t,camera));
    assert.deepEqual(speedPresentation(45,{highSpeedShake:false},{active:true},t,camera).shake,{x:0,y:0,z:0});
  }
  const outside=speedPresentation(45,{},true,1,'chase').shake,cockpit=speedPresentation(45,{},true,1,'cockpit').shake;
  near(cockpit.x/outside.x,.035/.12);near(cockpit.y/outside.y,.035/.12);
  assert.deepEqual(speedPresentation(10,{},true,1).shake,{x:0,y:0,z:0});
  const badTime=speedPresentation(45,{},true,NaN);assert.ok(Object.values(badTime.shake).every(Number.isFinite));
});

test('streak count and length grow with real speed and AB, while amount zero and hidden state stop drawing',()=>{
  const effects=createSpeedEffects();assert.equal(effects.group.visible,false);assert.equal(effects.snapshot().capacity,80);
  effects.update({speed:10,visible:true});const slow=effects.snapshot();
  effects.update({speed:30,visible:true});const fast=effects.snapshot();
  effects.update({speed:30,afterburner:{active:true},visible:true});const ab=effects.snapshot();
  assert.ok(slow.lineCount>0&&fast.lineCount>slow.lineCount&&ab.lineCount>fast.lineCount);
  assert.ok(fast.lineLength>slow.lineLength&&ab.lineLength>fast.lineLength);
  effects.update({speed:45,afterburner:true,amount:2});assert.equal(effects.snapshot().lineCount,80);
  effects.update({speed:45,afterburner:true,amount:0});assert.equal(effects.group.visible,false);assert.equal(effects.snapshot().lineCount,0);
  effects.update({speed:45,afterburner:true,visible:false});assert.equal(effects.group.visible,false);assert.equal(effects.group.children[0].geometry.drawRange.count,0);
  effects.update({speed:0,visible:true});assert.equal(effects.snapshot().visible,false);
  const copy=effects.snapshot();copy.capacity=999;assert.equal(effects.snapshot().capacity,80);dispose(effects.group);
});

test('all streak vertices remain outside the blank center at three aspects and final FOVs',()=>{
  const effects=createSpeedEffects();
  for(const aspect of [390/844,360/640,844/390])for(const fov of [64,100,115]){
    effects.update({speed:45,afterburner:true,amount:2,timeSeconds:.27,verticalFov:fov,aspect,visible:true});
    const mesh=effects.group.children[0],values=mesh.geometry.attributes.position.array,halfHeight=Math.tan(fov*DEG/2)*2;
    assert.equal(mesh.geometry.drawRange.count,160);
    for(let index=0;index<160;index++){
      const x=values[index*3]/(halfHeight*aspect),y=values[index*3+1]/halfHeight;
      assert.ok(Math.max(Math.abs(x),Math.abs(y))>=.72-1e-6,'a line entered the central rectangle');
      near(values[index*3+2],-2);
    }
  }
  dispose(effects.group);
});

test('streak updates reuse one geometry/material/typed-array pool and malformed inputs stay finite',()=>{
  const effects=createSpeedEffects(),mesh=effects.group.children[0],geometry=mesh.geometry,material=mesh.material;
  const positions=geometry.attributes.position.array,colors=geometry.attributes.color.array;
  effects.update({speed:30,timeSeconds:0});const before=positions.slice();
  effects.update({speed:30,timeSeconds:.173});assert.notEqual(before.findIndex((value,i)=>value!==positions[i]),-1);
  for(const input of [{speed:Infinity,aspect:NaN,verticalFov:0,timeSeconds:Infinity},{speed:Number.MAX_VALUE,amount:99,aspect:Infinity,verticalFov:999,timeSeconds:Number.MAX_VALUE},null,{}]){
    effects.update(input);assert.equal(effects.group.children.length,1);assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,material);
    assert.equal(geometry.attributes.position.array,positions);assert.equal(geometry.attributes.color.array,colors);
    assert.ok(positions.every(Number.isFinite));assert.ok(colors.every(Number.isFinite));assert.ok(effects.snapshot().lineCount<=80);
  }
  dispose(effects.group);
});

test('scenery adds a bounded static ground pool and nearby clouds while preserving far islands and tower',()=>{
  const {group,details}=createScenery();assert.equal(details.islands,12);assert.equal(details.towerHeight,116);
  assert.equal(details.groundDetails,640);assert.equal(details.groundBatches,3);assert.equal(details.nearClouds,24);
  assert.equal(details.clouds,36);assert.equal(details.cloudPuffs,108);assert.equal(details.batches,11);assert.equal(group.children.length,11);
  const ground=group.children.filter(object=>object.name.startsWith('speed-ground-'));
  assert.equal(ground.length,3);assert.equal(ground.reduce((sum,mesh)=>sum+mesh.count,0),640);
  assert.ok(ground.every(mesh=>mesh.isInstancedMesh));assert.equal(details.collisions,false);assert.equal(group.userData.collisions,false);
  const matrix=new Matrix4(),position=new Vector3();group.getObjectByName('far-floating-islands').getMatrixAt(0,matrix);position.setFromMatrixPosition(matrix);
  near(position.x,0);near(position.y,32);near(position.z,-560);
  assert.equal(group.getObjectByName('central-tower').count,12);
  group.traverse(object=>{if(object.material)assert.equal(object.material.fog,false);});
  assert.ok(Object.isFrozen(details));dispose(group);
});

test('new ground details and every cloud puff leave goals clear and never change supplied points',()=>{
  const avoidPoints=[{x:0,y:20,z:0},{x:100,y:24,z:100},{x:-175,y:12,z:82.727}],before=JSON.stringify(avoidPoints);
  const {group}=createScenery({halfExtent:350,avoidPoints}),matrix=new Matrix4(),position=new Vector3(),scale=new Vector3();
  for(const mesh of group.children.filter(object=>object.name.startsWith('speed-ground-')||object.name==='noncolliding-cloud-puffs')){
    for(let index=0;index<mesh.count;index++){
      mesh.getMatrixAt(index,matrix);position.setFromMatrixPosition(matrix);scale.setFromMatrixScale(matrix);
      for(const goal of avoidPoints){
        const clearance=mesh.name==='noncolliding-cloud-puffs'?15+Math.max(scale.x,scale.z):17;
        assert.ok(Math.hypot(position.x-goal.x,position.z-goal.z)>=clearance-1e-4,mesh.name+' covered a goal');
      }
    }
  }
  assert.equal(JSON.stringify(avoidPoints),before);dispose(group);
});

test('static detail generation is deterministic without per-frame randomization',()=>{
  const options={halfExtent:350,avoidPoints:[{x:10,z:-20}]},first=createScenery(options),second=createScenery(options);
  for(const mesh of first.group.children.filter(object=>object.isInstancedMesh)){
    const other=second.group.getObjectByName(mesh.name);assert.equal(other.count,mesh.count);
    assert.equal(mesh.instanceMatrix.array.findIndex((value,index)=>value!==other.instanceMatrix.array[index]),-1,mesh.name);
  }
  dispose(first.group);dispose(second.group);
});

test('usual twin exhaust retains its prior appearance, AB enlarges both flames, and zero power stays dark',()=>{
  const jet=createAircraft(),flames=jet.group.children.filter(object=>object.material?.transparent);
  assert.equal(flames.length,2);
  for(const power of [0,.3,1]){
    jet.setPower(power);const output=jet.diagnostics();assert.equal(output.afterburner,false);
    near(output.exhaustLength,power>0?.15+1.35*power:0);near(output.exhaustOpacity,power>0?.3+.65*power:0);
    for(const flame of flames){near(flame.scale.x,1);near(flame.scale.z,1);assert.equal(flame.material.color.getHex(),0x93e5ff);}
  }
  jet.setPower(1);const usual=jet.diagnostics();jet.setPower(1,true);const boosted=jet.diagnostics();
  assert.equal(boosted.afterburner,true);assert.ok(boosted.exhaustLength>usual.exhaustLength&&boosted.exhaustOpacity>usual.exhaustOpacity);
  for(const flame of flames){assert.ok(flame.scale.x>1&&flame.scale.z>1);near(flame.scale.y,boosted.exhaustLength);assert.equal(flame.visible,true);}
  jet.setPower(1,false);near(jet.diagnostics().exhaustLength,usual.exhaustLength);near(jet.diagnostics().exhaustOpacity,usual.exhaustOpacity);
  for(const value of [0,NaN,Infinity]){jet.setPower(value,true);assert.equal(jet.diagnostics().exhaustVisible,false);assert.equal(jet.diagnostics().afterburner,false);}
  dispose(jet.group);
});
