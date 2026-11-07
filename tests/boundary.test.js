import test from 'node:test';
import assert from 'node:assert/strict';
import {STAGE_HALF_EXTENT,stageBoundaryStatus} from '../src/boundary.js';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);

test('arena center is clear and an exact edge warns without counting as outside',()=>{
 assert.equal(STAGE_HALF_EXTENT,350);
 const center=stageBoundaryStatus({x:0,y:10,z:0},{speed:10});
 assert.ok(center);assert.equal(center.level,'clear');assert.equal(center.clearance,350);assert.equal(center.near,false);assert.equal(center.outside,false);assert.equal(center.returnBearingDeg,null);
 const edge=stageBoundaryStatus({x:350,y:10,z:0},{speed:10});assert.equal(edge.near,true);assert.equal(edge.outside,false);assert.equal(edge.clearance,0);
});
test('near and outside edges point toward an inner safe area relative to current heading',()=>{
 const east=stageBoundaryStatus({x:300,y:10,z:0},{heading:0,speed:10});
 assert.ok(east);assert.equal(east.level,'near');assert.equal(east.clearance,50);assert.equal(east.warningDistance,60);near(east.returnBearingDeg,-90);near(east.returnDirection.x,-1);assert.ok(east.returnPosition.x<290);
 const west=stageBoundaryStatus({x:-360,y:10,z:0},{heading:Math.PI/2,speed:10});assert.equal(west.level,'outside');assert.equal(west.clearance,-10);near(west.returnBearingDeg,0);
 const corner=stageBoundaryStatus({x:340,y:10,z:340},{heading:0,speed:10});near(corner.returnDirection.x,-Math.SQRT1_2);near(corner.returnDirection.z,-Math.SQRT1_2);near(corner.returnBearingDeg,-45);
});
test('higher speed and weaker turning warn earlier with a bounded warning distance',()=>{
 const position={x:200,y:10,z:0};
 const slow=stageBoundaryStatus(position,{speed:10}),fast=stageBoundaryStatus(position,{speed:30});
 assert.ok(slow&&fast);assert.equal(slow.near,false);assert.equal(fast.near,true);assert.ok(fast.warningDistance>150);assert.ok(fast.turnRadius>slow.turnRadius);
 const weak=stageBoundaryStatus(position,{speed:30,turnGravity:3});assert.ok(weak.warningDistance>=fast.warningDistance);assert.ok(weak.warningDistance<=350*.75);
 const noTurn=stageBoundaryStatus(position,{speed:30,maxBank:0});assert.equal(noTurn.turnRadius,null);assert.equal(noTurn.warningDistance,350*.75);
});
test('custom arena extents and far-outside positions remain finite without changing input',()=>{
 const position={x:110,y:17,z:-20},copy={...position};const options={halfExtent:100,speed:10,heading:Math.PI};
 const status=stageBoundaryStatus(position,options);assert.ok(status);assert.equal(status.halfExtent,100);assert.equal(status.outside,true);assert.equal(status.clearance,-10);assert.deepEqual(position,copy);
 const far=stageBoundaryStatus({x:Number.MAX_VALUE,z:Number.MAX_VALUE});assert.ok(Number.isFinite(far.returnBearingDeg));assert.ok(Object.values(far.returnDirection).every(Number.isFinite));
});
test('approach diagnostics distinguish outward, inward and parallel movement without muting proximity',()=>{
 const position={x:300,y:10,z:0};
 const outward=stageBoundaryStatus(position,{heading:Math.PI/2,speed:10});assert.equal(outward.motion,'outward');assert.equal(outward.approaching,true);near(outward.outwardSpeed,10);near(outward.timeToEdge,5);
 const inward=stageBoundaryStatus(position,{heading:-Math.PI/2,speed:10});assert.equal(inward.motion,'inward');assert.equal(inward.returning,true);assert.equal(inward.timeToEdge,null);assert.equal(inward.near,true);
 const actual=stageBoundaryStatus(position,{heading:Math.PI/2,speed:10,velocity:{x:-10,y:0,z:0}});assert.equal(actual.motion,'inward');assert.equal(actual.timeToEdge,null);
 const parallel=stageBoundaryStatus(position,{heading:0,speed:10});assert.equal(parallel.motion,'parallel');assert.equal(parallel.timeToEdge,null);
});
test('invalid geometry fails closed and invalid optional motion values cannot create NaN',()=>{
 for(const position of [null,{}, {x:NaN,z:0},{x:0,z:Infinity}])assert.equal(stageBoundaryStatus(position),null);
 for(const halfExtent of [0,-1,NaN,Infinity])assert.equal(stageBoundaryStatus({x:0,z:0},{halfExtent}),null);
 assert.equal(stageBoundaryStatus({x:0,z:0},null),null);
 const status=stageBoundaryStatus({x:320,z:0},{heading:NaN,speed:Infinity,turnGravity:NaN,maxBank:NaN});assert.ok(status);assert.ok(Number.isFinite(status.warningDistance));assert.ok(Number.isFinite(status.returnBearingDeg));
 assert.ok(Number.isFinite(stageBoundaryStatus({x:320,z:0},{heading:Number.MAX_VALUE}).returnBearingDeg));
});
