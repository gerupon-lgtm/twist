import test from 'node:test';
import assert from 'node:assert/strict';
import {projectCockpitObjective,placeObjectiveLabel} from '../src/cockpit-objective.js';
const base={width:390,height:844,verticalFov:84,bounds:{left:100,right:280,top:140,bottom:700}};
test('objective point uses the actual camera perspective rather than a bearing-only location',()=>{
 const target={x:1,y:3,z:-26},p=projectCockpitObjective({...base,target});assert.equal(p.kind,'point');
 const f=844/2/Math.tan(84*Math.PI/360);assert.ok(Math.abs(p.x-(195+f/26))<1e-8);assert.ok(Math.abs(p.y-(422-f*3/26))<1e-8);
});
test('outside and rear targets use stable HUD-edge directions and avoid reserved panels',()=>{
 const right=projectCockpitObjective({...base,target:{x:10,y:0,z:-1}});assert.equal(right.kind,'edge');assert.equal(right.rotation,90);
 const rear=projectCockpitObjective({...base,target:{x:0,y:0,z:26}});assert.equal(rear.kind,'edge');assert.equal(rear.behind,true);assert.equal(rear.rotation,90);
 const moved=projectCockpitObjective({...base,target:{x:10,y:0,z:-1},obstacles:[{left:260,right:300,top:400,bottom:445}]});assert.ok(Math.abs(moved.y-422)>20);
 assert.equal(projectCockpitObjective({...base,target:{x:10,y:0,z:-1},obstacles:[{left:0,right:390,top:0,bottom:844}]}),null);
});
test('labels stay inside HUD bounds and separate from both the target symbol and other instruments',()=>{
 const p={x:195,y:370},bounds={left:82,right:288,top:120,bottom:700};
 const label=placeObjectiveLabel(p,{bounds});assert.ok(label);assert.ok(label.x>=82&&label.x+116<=288);assert.ok(label.y+34<350||label.y>390);
 assert.equal(placeObjectiveLabel(p,{bounds,obstacles:[{left:0,right:390,top:0,bottom:844}]}),null);
});
test('invalid projections cannot create nonfinite HUD positions',()=>{
 for(const target of [null,{x:NaN,y:0,z:-1},{x:0,y:0,z:0}])assert.equal(projectCockpitObjective({...base,target}),null);
 assert.equal(projectCockpitObjective({...base,target:{x:1,y:0,z:-10},bounds:{left:10,right:5,top:0,bottom:30}}),null);
});
