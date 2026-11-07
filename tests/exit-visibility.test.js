import test from 'node:test';
import assert from 'node:assert/strict';
import {exitCenterVisible} from '../src/exit-visibility.js';

const base={width:400,height:800,verticalFov:90,bounds:{left:0,right:400,top:0,bottom:800}};
const visible=(target,overrides={})=>exitCenterVisible({...base,...overrides,target});
const atPixel=(x,y,depth=10,input=base)=>{
 const focal=input.height/2/Math.tan(input.verticalFov*Math.PI/360);
 return {x:(x-input.width/2)*depth/focal,y:(input.height/2-y)*depth/focal,z:-depth};
};

test('a front-facing center within the camera depth and screen is visible',()=>{
 assert.equal(visible({x:0,y:0,z:-10}),true);
 assert.equal(visible({x:0,y:0,z:-.1}),true);
 assert.equal(visible({x:0,y:0,z:-250}),true);
});

test('rear, camera-plane, near-clipped and far-clipped centers are hidden',()=>{
 for(const z of [10,0,-.099,-250.001])assert.equal(visible({x:0,y:0,z}),false);
});

test('supplied camera depth limits replace the default limits',()=>{
 for(const depth of [1,1800])assert.equal(visible({x:0,y:0,z:-depth},{near:1,far:1800}),true);
 for(const depth of [.5,1800.1])assert.equal(visible({x:0,y:0,z:-depth},{near:1,far:1800}),false);
 assert.equal(visible({x:0,y:0,z:-1000}),false);
});

test('the projected center must be in the actual playable CSS rectangle',()=>{
 const bounds={left:40,right:360,top:140,bottom:660};
 assert.equal(visible(atPixel(200,400),{bounds}),true);
 for(const [x,y] of [[39,400],[361,400],[200,139],[200,661]]) {
  assert.equal(visible(atPixel(x,y),{bounds}),false);
 }
 for(const [x,y] of [[40,400],[360,400],[200,140],[200,660]]) {
  assert.equal(visible(atPixel(x,y),{bounds}),true);
 }
});

test('bounds do not expand visibility beyond the rendered screen',()=>{
 const bounds={left:-1000,right:1000,top:-1000,bottom:2000};
 for(const [x,y] of [[-1,400],[401,400],[200,-1],[200,801]]) {
  assert.equal(visible(atPixel(x,y),{bounds}),false);
 }
});

test('projection uses vertical FOV in degrees and CSS width and height',()=>{
 const target={x:4,y:0,z:-10};
 assert.equal(visible(target),true);
 assert.equal(visible(target,{verticalFov:60}),false);
 assert.equal(visible(target,{width:800,height:400,bounds:{left:0,right:800,top:0,bottom:400}}),true);
 assert.equal(visible({x:0,y:8,z:-10}),true);
 assert.equal(visible({x:0,y:8,z:-10},{verticalFov:60}),false);
});

test('only the center is tested, without extending visibility for a halo',()=>{
 assert.equal(visible(atPixel(402,400)),false);
 assert.equal(visible(atPixel(399,400)),true);
});

test('invalid targets, viewport, FOV, bounds, or depth limits return false',()=>{
 const input={...base,target:{x:0,y:0,z:-10}};
 const invalid=[
  undefined,null,{},
  ...[null,{}, {x:NaN,y:0,z:-10},{x:0,y:Infinity,z:-10},{x:0,y:0,z:-Infinity}].map(target=>({...input,target})),
  ...[0,-1,NaN,Infinity,'400'].map(width=>({...input,width})),
  ...[0,-1,NaN,Infinity].map(height=>({...input,height})),
  ...[0,-1,180,NaN,Infinity,'90'].map(verticalFov=>({...input,verticalFov})),
  ...[null,{}, {left:0,right:0,top:0,bottom:800},{left:400,right:0,top:0,bottom:800},
   {left:0,right:400,top:800,bottom:0},{left:0,right:400,top:0,bottom:Infinity},
   {left:'0',right:400,top:0,bottom:800}].map(bounds=>({...input,bounds})),
  ...[0,-1,NaN,Infinity].map(near=>({...input,near})),
  ...[0,-1,NaN,Infinity,.05,.1].map(far=>({...input,far})),
 ];
 for(const sample of invalid)assert.equal(exitCenterVisible(sample),false);
});

test('finite inputs that overflow the perspective projection remain hidden',()=>{
 assert.equal(visible({x:Number.MAX_VALUE,y:0,z:-.1}),false);
 assert.equal(visible({x:0,y:Number.MAX_VALUE,z:-.1}),false);
 assert.equal(visible({x:0,y:0,z:-10},{verticalFov:Number.MIN_VALUE}),false);
});

test('visibility calculation does not mutate the supplied target or rectangle',()=>{
 const target=Object.freeze({x:0,y:0,z:-10});const bounds=Object.freeze({...base.bounds});
 const input=Object.freeze({...base,target,bounds});
 assert.equal(exitCenterVisible(input),true);
 assert.deepEqual(target,{x:0,y:0,z:-10});assert.deepEqual(bounds,base.bounds);
});
