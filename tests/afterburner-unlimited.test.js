import assert from 'node:assert/strict';
import test from 'node:test';
import {createAfterburnerState,advanceAfterburner,stopAfterburner} from '../src/afterburner.js';

test('course-owned unlimited AB remains active for60seconds and can release, pause and reignite',()=>{
  let state=createAfterburnerState({unlimited:true});
  for(let i=0;i<600;i++)state=advanceAfterburner(state,.1,{running:true,flight:true,manualRequest:true,speed:75}).state;
  assert.equal(state.active,true);assert.equal(state.unlimited,true);assert.equal(state.fuel,100);
  assert.ok(Math.abs(state.seconds-60)<1e-8);assert.equal(state.uses,1);assert.equal(state.earned,0);
  state=advanceAfterburner(state,.1,{running:true,flight:true,manualRequest:false}).state;
  assert.equal(state.active,false);assert.equal(state.needsRelease,false);
  state=advanceAfterburner(state,.1,{running:true,flight:true,manualRequest:true}).state;
  assert.equal(state.active,true);assert.equal(state.uses,2);
  state=stopAfterburner(state);assert.equal(state.active,false);assert.equal(state.unlimited,true);
  state=advanceAfterburner(state,1,{running:true,flight:true,manualRequest:true}).state;
  assert.equal(state.active,false);assert.equal(state.needsRelease,true);
  state=advanceAfterburner(state,.1,{running:true,flight:true,manualRequest:false}).state;
  state=advanceAfterburner(state,.1,{running:true,flight:true,manualRequest:true}).state;
  assert.equal(state.active,true);assert.equal(state.fuel,100);
});

test('ordinary courses still begin without AB fuel',()=>{
  const result=advanceAfterburner(createAfterburnerState(),1,{running:true,flight:true,manualRequest:true});
  assert.equal(result.state.fuel,0);assert.equal(result.state.active,false);assert.equal(result.activeSeconds,0);
  assert.equal(result.state.unlimited,undefined);
});
