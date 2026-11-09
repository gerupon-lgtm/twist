import test from 'node:test';
import assert from 'node:assert/strict';
import {formatSupersonicAltitude,vaporConeIntensity,supersonicSpeedPresentation} from '../src/supersonic-presentation.js';
import {createSupersonicEffects} from '../src/supersonic-effects.js';

test('altitude rounding keeps readable kilometre magnitudes without changing the source value',()=>{
  for(const [metres,text]of [[22,'22.0'],[999,'999.0'],[1000,'1.0k'],[2400,'2.4k'],[6000,'6.0k'],[-4,'-4.0'],[NaN,'—'],[Infinity,'—']])assert.equal(formatSupersonicAltitude(metres),text);
});
test('the cone has a bounded transonic envelope in both crossing directions',()=>{
  for(const m of [0,.94,.95,1.05,1.1,2,NaN,Infinity])assert.equal(vaporConeIntensity(m),0);
  assert.equal(vaporConeIntensity(1),1);
  assert.ok(Math.abs(vaporConeIntensity(.975)-.5)<1e-10);
  assert.ok(Math.abs(vaporConeIntensity(.975)-vaporConeIntensity(1.025))<1e-10);
});
test('sonic visual speed keeps changing from 200 through 680 while preserving settings and tiny camera shake',()=>{
  const settings={speedFov:10},before=JSON.stringify(settings);
  const values=[0,200,340,680].map(v=>supersonicSpeedPresentation(v,settings,{},1));
  assert.ok(values.every((v,i)=>!i||v.extraFov>values[i-1].extraFov));
  assert.equal(values.at(-1).extraFov,10);assert.equal(JSON.stringify(settings),before);
  for(const camera of ['overlay','chase','cockpit'])for(let i=0;i<50;i++){
    const result=supersonicSpeedPresentation(680,{},true,i*.137,camera),limit=(camera==='cockpit'?.025:.1)*Math.PI/180;
    assert.ok(Object.values(result.shake).every(value=>Number.isFinite(value)&&Math.abs(value)<=limit));
  }
  assert.deepEqual(supersonicSpeedPresentation(680,{highSpeedShake:false},true,2).shake,{x:0,y:0,z:0});
  assert.equal(supersonicSpeedPresentation(680,{speedFov:0},true).extraFov,0);
  assert.deepEqual(supersonicSpeedPresentation(NaN).shake,{x:0,y:0,z:0});
});
test('cosmetic cone and cockpit haze are isolated to sonic running state, with shared bounded geometry',()=>{
  const fx=createSupersonicEffects(),state={speed:340,supersonic:{mach:1}};
  try{
    fx.update({state,phase:'running',camera:'overlay'});assert.equal(fx.snapshot().coneVisible,true);assert.equal(fx.snapshot().hazeVisible,true);
    fx.update({state,phase:'running',camera:'cockpit'});assert.equal(fx.snapshot().coneVisible,false);assert.equal(fx.snapshot().hazeVisible,true);
    const positions=fx.cameraGroup.children[1].geometry.attributes.position.array;
    for(const [width,height]of [[390,844],[360,640],[844,390]])for(const fov of [64,100]){
      fx.update({state:{speed:680,supersonic:{mach:2}},phase:'running',camera:'cockpit',aspect:width/height,verticalFov:fov,timeSeconds:.37,settings:{speedLines:2}});
      const snapshot=fx.snapshot(),halfH=Math.tan(fov*Math.PI/360)*snapshot.effectDepth;
      assert.equal(snapshot.lineCount,snapshot.capacity);assert.equal(fx.cameraGroup.children[1].geometry.attributes.position.array,positions);
      for(let i=0;i<snapshot.lineCount*2;i++)assert.ok(Math.max(Math.abs(positions[i*3]/(halfH*width/height)),Math.abs(positions[i*3+1]/halfH))>=snapshot.centralClear-1e-6);
    }
    fx.update({state,phase:'paused',camera:'cockpit'});assert.equal(fx.craftGroup.visible,false);assert.equal(fx.cameraGroup.visible,false);assert.equal(fx.snapshot().lineCount,0);
    fx.update({state:{speed:340},phase:'running'});assert.equal(fx.cameraGroup.visible,false);
  }finally{fx.dispose();fx.dispose();}
  assert.equal(fx.snapshot().disposed,true);
});
