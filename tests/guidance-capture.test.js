import test from 'node:test';
import assert from 'node:assert/strict';
import {computeDirectionGuidance} from '../src/guidance.js';
const state={mode:'flight',position:{x:6,y:18,z:-64},targetPosition:{x:4,y:18,z:-68},velocity:{x:0,y:0,z:-10},heading:0,throttle:.5};
test('guidance continues toward a reachable unchanged collection sphere rather than escaping at its center',()=>{
 assert.equal(computeDirectionGuidance(state).mode,'go-around');
 assert.equal(computeDirectionGuidance({...state,targetRadius:3.2}).mode,'target');
});
test('vertical separation reduces the existing sphere available to a horizontal approach',()=>{
 const advice=computeDirectionGuidance({...state,targetPosition:{x:4,y:25,z:-68},targetRadius:3.2});assert.equal(advice.mode,'go-around');
});
test('the near side of the two-root tangent interval remains reachable',()=>{
 const advice=computeDirectionGuidance({...state,position:{x:6.5,y:18,z:-65},targetRadius:3.2});assert.equal(advice.mode,'target');assert.equal(advice.turnCircleRatio,null);
});
