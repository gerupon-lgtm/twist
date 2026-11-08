import test from 'node:test';
import assert from 'node:assert/strict';
import {COURSES} from '../src/course.js';
import {createBriefingModel,fitBriefingMap,createCoursePreviewSVG,briefingGridPath} from '../src/briefing-model.js';

for(const [width,height] of [[320,180],[320,400],[530,220]])test(`angled route and floor fit all courses at ${width}x${height}`,()=>{
 for(const course of Object.values(COURSES)){
  const original=JSON.stringify(course),model=createBriefingModel(course),map=fitBriefingMap(model,{width,height,padding:30,thumbnail:true,oblique:true});
  for(const item of map.route)for(const point of [item,map.projectGround(item.position)]){
   assert.ok(point.x>=30-1e-6&&point.x<=width-30+1e-6,`${course.id}: x`);
   assert.ok(point.y>=30-1e-6&&point.y<=height-30+1e-6,`${course.id}: y`);
  }
  for(const item of map.route){const ground=map.projectGround(item.position);assert.ok(Math.abs(ground.y-item.y-item.height*.65*map.metresToPixels)<1e-6);}
  assert.ok(!/NaN|Infinity/.test(briefingGridPath(model,map)));assert.ok(briefingGridPath(model,map).length<5000);
  assert.equal(JSON.stringify(course),original);
 }
});
test('selected-course image has an angled ground grid, numbered targets and no aircraft or direction triangle',()=>{
 for(const course of Object.values(COURSES)){
  const svg=createCoursePreviewSVG(course,{width:320,height:280,featured:true});
  assert.match(svg,/data-map-view="oblique"/);assert.match(svg,/briefing-ground-grid/);assert.match(svg,/briefing-height-stem/);
  assert.equal((svg.match(/<circle /g)??[]).length,course.lights.length);
  assert.equal((svg.match(/briefing-preview-number/g)??[]).length,course.lights.length);
  assert.ok(!/aircraft|plane|jet|l4 8-4-2/.test(svg));assert.match(svg,/>START<\/text>/);assert.match(svg,/>EXIT/);
 }
});
test('angled projection uses the real heading and height while the overview stays top down',()=>{
 const model=createBriefingModel({...COURSES.easy,startHeading:Math.PI/2}),map=fitBriefingMap(model,{width:420,height:320,thumbnail:true,oblique:true});
 const start=map.project(model.start.position),forward=map.project({...model.start.position,x:model.start.position.x+10});
 assert.ok(forward.x<start.x&&forward.y<start.y);
 const high=map.project({...model.start.position,y:model.start.height+10});assert.equal(high.x,start.x);assert.ok(high.y<start.y);
 const top=fitBriefingMap(model,{width:420,height:320,thumbnail:true});assert.equal(top.oblique,false);
 assert.equal(top.project({...model.start.position,y:100}).y,top.start.y);
});
