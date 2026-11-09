import test from 'node:test';import assert from 'node:assert/strict';
import {createSupersonicWind,windPresentation} from '../src/supersonic-wind.js';
test('wind strengthens through Mach1 and Mach2 while Sierra10 has a quieter cruise envelope',()=>{
  const values=[100,190,300,340,400].map(s=>windPresentation(s).strength);
  assert.ok(values.every((v,i)=>!i||v>values[i-1]));
  assert.ok(windPresentation(300,300).strength>0);assert.ok(windPresentation(300,300).strength<windPresentation(340).strength);
  assert.ok(windPresentation(680).drift>windPresentation(340).drift);
});
test('wind has bounded reusable geometry outside the central HUD in portrait and landscape',()=>{
  const fx=createSupersonicWind(),position=fx.mesh.geometry.attributes.position.array,color=fx.mesh.geometry.attributes.color.array;
  try{
    for(const [w,h]of [[390,844],[844,390]])for(const speed of [190,300,340,680])for(const t of [0,.1,.5,12]){
      fx.update({speed,timeSeconds:t,aspect:w/h,verticalFov:80});
      assert.equal(fx.mesh.geometry.attributes.position.array,position);assert.equal(fx.mesh.geometry.attributes.color.array,color);
      const halfH=Math.tan(80*Math.PI/360)*2.2;
      for(let i=0;i<fx.mesh.geometry.drawRange.count;i++){
        assert.ok(Math.max(Math.abs(position[i*3]/(halfH*w/h)),Math.abs(position[i*3+1]/halfH))>=.78-1e-6);
        assert.ok(Number.isFinite(position[i*3]));assert.equal(color[i*4],1);assert.ok(color[i*4+3]>=0&&color[i*4+3]<=1);
      }
      assert.ok(fx.snapshot().windCount<=32);
    }
    fx.update({speed:680,amount:0});assert.equal(fx.mesh.visible,false);
    fx.update({speed:680,reducedMotion:true});assert.equal(fx.mesh.visible,false);
    fx.update({speed:680,visible:false});assert.equal(fx.mesh.visible,false);
  }finally{fx.dispose();fx.dispose();}
});
