import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupersonicEffects} from '../src/supersonic-effects.js';
import {createAircraft} from '../src/aircraft.js';
import {sonicBoomSample,sonicBoomDucking,SONIC_BOOM_SECONDS} from '../src/feedback/sonic-boom.js';

const crossing={type:'sonic-transition',attemptId:1,serial:1,id:1,direction:'up',atSeconds:10,mach:1.01};
const frame=(t,camera='chase',extra={})=>({state:{speed:360,supersonic:{mach:1.06,attemptId:1,events:[crossing]}},timeSeconds:t,phase:'running',camera,...extra});
test('one real crossing makes a broad pressure wave in all views and never replays on pause, view change or resize',()=>{
  for(const camera of ['overlay','chase','cockpit']){
    const fx=createSupersonicEffects();
    try{
      fx.update(frame(10.1,camera));const first=fx.snapshot();
      assert.ok(first.sonicBurst>.7);assert.ok(first.shockVisible);assert.equal(first.wakeVisible,camera==='chase');
      fx.update(frame(10.6,camera));assert.ok(fx.snapshot().shockRadius>first.shockRadius);
      fx.update(frame(11.1,camera));assert.equal(fx.snapshot().shockVisible,false);
      fx.update(frame(11.2,'cockpit'));assert.equal(fx.snapshot().shockVisible,false);
      const second={...crossing,serial:2,id:2,atSeconds:12};
      fx.update({...frame(12.1,camera),state:{speed:360,supersonic:{mach:1.06,attemptId:1,events:[second]}},phase:'paused'});
      fx.update(frame(12.2,camera));assert.equal(fx.snapshot().shockVisible,false);
      fx.update(frame(12.3,camera));
      fx.update({...frame(10.2,camera),state:{speed:360,supersonic:{mach:1.06,attemptId:2,events:[]}}});
      assert.equal(fx.snapshot().shockVisible,false,'a new flight never inherits the previous pressure wave');
    }finally{fx.dispose();}
  }
});
test('reduced motion keeps a static peripheral cue; terminal and ordinary flight have no shock',()=>{
  const fx=createSupersonicEffects();try{
    fx.update(frame(10.1,'cockpit',{settings:{reducedMotion:true}}));const first=fx.snapshot();
    fx.update(frame(10.5,'cockpit',{settings:{reducedMotion:true}}));assert.equal(fx.snapshot().shockRadius,first.shockRadius);
    fx.update(frame(10.6,'cockpit',{phase:'terminal'}));assert.equal(fx.cameraGroup.visible,false);
    fx.update({state:{speed:10},phase:'running'});assert.equal(fx.snapshot().shockVisible,false);
  }finally{fx.dispose();}
});
test('powered supersonic plumes have blue-white cores, amber outer flame, greater length and a finite off state',()=>{
  const jet=createAircraft();jet.setPower(1,true);const regular=jet.diagnostics();
  assert.equal(regular.sonicExhaust,false);
  jet.setPower(1,true,{mach:1.2,timeSeconds:10});const sonic=jet.diagnostics();
  assert.equal(sonic.sonicExhaust,true);assert.ok(sonic.sonicExhaustLength>regular.exhaustLength*1.8);
  assert.deepEqual(sonic.sonicExhaustColors,{core:0xd8f0ff,outer:0xff9e45,blue:0x688fff});
  jet.setPower(0,true,{mach:1.5});assert.equal(jet.diagnostics().sonicExhaust,false);
  jet.setPower(1,false,{mach:.99});assert.equal(jet.diagnostics().sonicExhaust,false);
  jet.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
});
test('double crack has a longer audible tail, finite samples and a quieter downward crossing',()=>{
  let energy=0,tail=0,peak=0;
  for(let i=0;i<48000;i++){
    const t=i/48000,v=sonicBoomSample(t);assert.ok(Number.isFinite(v));energy+=v*v;if(t>.275)tail+=v*v;peak=Math.max(peak,Math.abs(v));
    assert.ok(sonicBoomDucking(t)>0&&sonicBoomDucking(t)<=1);
  }
  assert.ok(energy>100);assert.ok(tail>1);assert.ok(peak>1&&peak<3);let down=0;for(let i=0;i<48000;i++)down+=sonicBoomSample(i/48000,'down')**2;assert.ok(energy>down*3);assert.ok(sonicBoomDucking(.06)<.5);assert.equal(sonicBoomDucking(.06,'down'),1);
  for(const t of [-1,NaN,Infinity,SONIC_BOOM_SECONDS,2])assert.equal(sonicBoomSample(t),0);
});
test('production worklet keeps the explosion tail, then cancels immediately on mute and never queues it',async()=>{
  let Processor;globalThis.AudioWorkletProcessor=class{constructor(){this.port={postMessage(){},onmessage:null};}};
  globalThis.sampleRate=48000;globalThis.currentTime=10;globalThis.registerProcessor=(_name,C)=>{Processor=C;};
  try{
    const {flightFeedback}=await import('../src/feedback/model.js');
    await import('../src/feedback/audio-worklet.js?sonic-impact');
    const p=new Processor(),send=data=>p.port.onmessage({data});
    const settings={sound:true,sfx:true,volume:50},model=flightFeedback({mode:'flight',speed:350,altitude:1500,groundClearance:1499,throttle:1,supersonic:{mach:1.03}},settings);
    send({type:'state',model,settings});send({type:'sonic',event:crossing});
    globalThis.currentTime=10.4;const out=new Float32Array(128);p.process([],[[out]]);
    assert.ok(p.sonicSnapshot().active);assert.ok(p.sonicBuffer.some(v=>Math.abs(v)>.001));
    send({type:'settings',settings:{...settings,sfx:false}});p.process([],[[out]]);
    assert.equal(p.sonicSnapshot().active,false);
    send({type:'settings',settings});send({type:'sonic',event:crossing});assert.equal(p.sonicSnapshot().reason,'duplicate');
    send({type:'stop'});p.process([],[[out]]);assert.ok(out.every(v=>v===0));
  }finally{delete globalThis.AudioWorkletProcessor;delete globalThis.sampleRate;delete globalThis.currentTime;delete globalThis.registerProcessor;}
});
