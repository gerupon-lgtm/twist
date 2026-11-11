import test from 'node:test';
import assert from 'node:assert/strict';
import {targetHeightGuide} from '../src/target-height.js';
import {updateTargetHeightPanel} from '../src/target-height-panel.js';
const state={position:{x:0,y:6,z:26},targetPosition:{x:0,y:10,z:0},targetRadius:3.2,velocity:{x:0,y:0,z:-6}};

test('shared upper guidance renders the same current altitude, target and delta in both views',()=>{
  const previous=globalThis.document,make=()=>({dataset:{},hidden:false,innerHTML:'',setAttribute(){}}),inline=make(),badge=make(),app=make();
  const parent={append(el){el.parentElement=this;}};inline.parentElement=parent;
  globalThis.document={getElementById:id=>({'target-height-inline':inline,'cockpit-target-height':badge,app})[id]};
  try{
    for(const cockpit of [false,true]){
      updateTargetHeightPanel({...state,mode:'flight'},{phase:'running',visibility:'assisted',enabled:true,cockpit,inlineParent:parent,shared:true});
      assert.equal(inline.innerHTML,badge.innerHTML);assert.match(inline.innerHTML,/ALT 6\.0m/);assert.match(inline.innerHTML,/TGT ALT 10m/);assert.match(inline.innerHTML,/4\.0m/);assert.ok(!inline.innerHTML.includes('<svg'));
      assert.equal(inline.hidden,cockpit);assert.equal(badge.hidden,!cockpit);
    }
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
test('height band, signed difference and inclusive limits match the existing collection radius',()=>{
  const g=targetHeightGuide(state);assert.equal(g.target,10);assert.equal(g.radius,3.2);assert.equal(g.delta,4);assert.equal(g.lower,6.8);assert.equal(g.upper,13.2);assert.equal(g.direction,'up');
  for(const y of [6.8,10,13.2])assert.equal(targetHeightGuide({...state,position:{...state.position,y}}).inside,true);
  assert.equal(targetHeightGuide({...state,position:{...state.position,y:13.21}}).direction,'down');
  const exit=targetHeightGuide({...state,targetPosition:{x:0,y:7,z:-62},targetRadius:4});assert.equal(exit.lower,3);assert.equal(exit.upper,11);
  assert.equal(targetHeightGuide({...state,targetPosition:{x:0,y:1,z:0}}).lower,0);
});
test('early cue compares arrival at the horizontal radius with time to the nearest height edge',()=>{
  const g=targetHeightGuide(state);assert.ok(g.urgent);assert.ok(Math.abs(g.arrivalSeconds-3.8)<1e-12);assert.equal(g.entrySeconds,null);
  const arrival=g.arrivalSeconds,needed=(g.lower-state.position.y)/arrival;
  assert.equal(targetHeightGuide({...state,velocity:{x:0,y:needed,z:-6}}).urgent,false);
  assert.equal(targetHeightGuide({...state,velocity:{x:0,y:needed*.9,z:-6}}).urgent,true);
  assert.equal(targetHeightGuide({...state,velocity:{x:0,y:-1,z:-6}}).urgent,true);
  assert.equal(targetHeightGuide({...state,velocity:{x:0,y:0,z:6}}).urgent,false);
  assert.equal(targetHeightGuide({...state,velocity:{x:0,y:0,z:0}}).urgent,false);
  assert.equal(targetHeightGuide({...state,position:{x:0,y:6,z:64},velocity:{x:0,y:0,z:-6}}).urgent,false);
  assert.equal(targetHeightGuide({...state,position:{x:0,y:6,z:3}}).arrivalSeconds,0);
  assert.equal(targetHeightGuide({...state,position:{x:0,y:14,z:26},velocity:{x:0,y:-1,z:-6}}).urgent,false);
  assert.equal(targetHeightGuide({...state,position:{x:0,y:10,z:26},velocity:{x:0,y:10,z:-6}}).urgent,false);
});
test('invalid inputs hide the guide or only disable prediction; scale always contains current and target band',()=>{
  for(const bad of [NaN,Infinity,-1]) {
    assert.equal(targetHeightGuide({...state,targetRadius:bad}),null);
    assert.equal(targetHeightGuide({...state,position:{...state.position,y:bad}}),null);
  }
  assert.equal(targetHeightGuide(),null);assert.equal(targetHeightGuide({...state,velocity:null}).urgent,false);
  for(const altitude of [0,7,18,200]){
    const g=targetHeightGuide({...state,position:{...state.position,y:altitude}}),s=g.scale;
    for(const key of ['currentY','targetY','upperY','lowerY'])assert.ok(s[key]>=5&&s[key]<=95,key);
    assert.ok(s.min<=Math.min(g.altitude,g.lower));assert.ok(s.max>=Math.max(g.altitude,g.upper));
  }
});
