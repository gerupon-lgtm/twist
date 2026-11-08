import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceSupersonicGuidanceDirection} from '../src/supersonic-guidance-stability.js';

const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const ray=(heading,climb=0)=>({x:Math.sin(heading)*Math.cos(climb),y:Math.sin(climb),z:-Math.cos(heading)*Math.cos(climb)});
const yaw=v=>Math.atan2(v.x,-v.z),climb=v=>Math.atan2(v.y,Math.hypot(v.x,v.z));
const close=(a,b,tolerance=1e-10)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);

test('Sonic relative smoothing preserves a fifteen-degree lead throughout a real-rate turn',()=>{
  const lead=Math.PI/12,dt=1/60;let previous=null;
  for(let i=0;i<180;i++){
    const track=i*dt*.4,desired=ray(track+lead);
    const next=advanceSupersonicGuidanceDirection(previous,desired,{velocity:{x:Math.sin(track)*200,y:0,z:-Math.cos(track)*200},dt});
    close(wrap(yaw(next.direction)-track),lead);previous=next;
  }
});

test('the previous actually displayed offset, including a HUD reduction, is smoothed without a jump',()=>{
  const previous={direction:ray(.35,.03),track:{heading:.3,climb:.02}},unchanged=structuredClone(previous),dt=.02,blend=1-Math.exp(-dt/.2);
  const desired=ray(.7,.09),track=.5,trackClimb=.04;
  const next=advanceSupersonicGuidanceDirection(previous,desired,{velocity:{x:Math.sin(track)*Math.cos(trackClimb)*200,y:Math.sin(trackClimb)*200,z:-Math.cos(track)*Math.cos(trackClimb)*200},dt});
  close(wrap(yaw(next.direction)-track),.05+(.2-.05)*blend);
  close(climb(next.direction)-trackClimb,.01+(.05-.01)*blend);
  assert.deepEqual(previous,unchanged);
});

test('heading wrap and zero dt keep the stored relative command while the track changes',()=>{
  const previous={direction:ray(-179*Math.PI/180,.03),track:{heading:179*Math.PI/180,climb:.01}};
  const track=-178*Math.PI/180,next=advanceSupersonicGuidanceDirection(previous,ray(track+.2,.1),{velocity:{x:Math.sin(track)*200,y:0,z:-Math.cos(track)*200},dt:0});
  close(wrap(yaw(next.direction)-track),2*Math.PI/180);close(climb(next.direction),.02);
  const idle=advanceSupersonicGuidanceDirection(null,ray(.7,.1),{velocity:{x:0,y:0,z:0},heading:.5,dt:0});
  close(yaw(idle.direction),.7);close(climb(idle.direction),.1);assert.deepEqual(idle.track,{heading:.5,climb:0});
});
