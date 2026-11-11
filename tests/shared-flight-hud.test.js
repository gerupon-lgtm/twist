import test from 'node:test';import assert from 'node:assert/strict';
import {sharedFlightHudLayout} from '../src/shared-flight-hud.js';
import {supersonicCameraFrame,cameraLocalPosition,projectCameraPoint} from '../src/supersonic/camera.js';
import {Quaternion,Euler} from 'three';
test('the approved portrait HUD centers guidance and retains the full-size radar below it',()=>{
 const g=sharedFlightHudLayout({width:390,height:844,controlsTop:702});
 assert.deepEqual([g.heading.left,g.heading.top,g.heading.width,g.heading.height],[45,52,300,36]);
 assert.deepEqual([g.targetHeight.left,g.targetHeight.top,g.targetHeight.width,g.targetHeight.height],[45,94,300,48]);
 assert.deepEqual([g.exitNotice.width,g.exitNotice.height],[180,24]);
 assert.deepEqual([g.radar.left,g.radar.top,g.radar.width,g.radar.height],[12,154,100,100]);assert.equal(g.focusY,529);
});
test('guidance remains centered and full radar size is retained at phone widths and in landscape',()=>{
 for(const [width,height]of [[390,844],[360,640],[844,390]])for(const layout of ['a','b','c']){
  const g=sharedFlightHudLayout({width,height,layout});assert.equal(g.heading.left+g.heading.width/2,width/2);assert.equal(g.targetHeight.left+g.targetHeight.width/2,width/2);
  assert.equal(g.radar.width,100);assert.equal(g.radar.height,100);assert.ok(g.radar.left>=12);assert.ok(g.radar.bottom<height);
 }
});
test('rear framing holds the aircraft below center through headings, pitches and bank without changing its pose',()=>{
 for(const heading of [0,.9,3.1])for(const pitch of [-.3,0,.3])for(const bank of [-.6,0,.6])for(const display of ['fixed','bank']){
  const q=new Quaternion().setFromEuler(new Euler(pitch,heading,bank,'YXZ'));
  const state={position:{x:100,y:1500,z:200},orientation:{x:q.x,y:q.y,z:q.z,w:q.w},bank};const before=JSON.stringify(state);
  const frame=supersonicCameraFrame(state,{cameraMode:'chase',display,chaseAngles:{heading,pitch}});
  const p=projectCameraPoint(cameraLocalPosition(state.position,frame),390,844,84);
  assert.ok(Math.abs(p.x-195)<1e-8);assert.ok(p.y>480&&p.y<520);assert.equal(JSON.stringify(state),before);
 }
});
