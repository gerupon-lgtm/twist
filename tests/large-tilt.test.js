import test from 'node:test';import assert from 'node:assert/strict';
import {preserveTiltInput} from '../src/controls.js';
test('unreadable large tilts keep the previous bounded input and recover on the next usable pose',()=>{
 const previous={pitch:80,steer:10,twist:0,valid:true};assert.deepEqual(preserveTiltInput(previous,{pitch:0,steer:0,valid:false}),{...previous,held:true});
 assert.deepEqual(preserveTiltInput(previous,{pitch:5,steer:-2,twist:0,valid:true}),{pitch:5,steer:-2,twist:0,valid:true,held:false});
 const empty=preserveTiltInput(null,null);assert.equal(empty.pitch,0);assert.equal(empty.steer,0);assert.equal(empty.held,true);
});
