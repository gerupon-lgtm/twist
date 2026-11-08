import test from 'node:test';
import assert from 'node:assert/strict';
import {COURSES,LEGACY_COURSE} from '../src/course.js';
import {courseBestKey} from '../src/course-bests.js';
import {STAGE_HALF_EXTENT} from '../src/boundary.js';
import {STANDARD_ARENA,CENTRAL_TOWER,DIRECTION_LANDMARKS,getCourseArena} from '../src/arena.js';
import {createBriefingModel,fitBriefingMap,createCoursePreviewSVG,briefingProgress,BRIEFING_DRAW_SECONDS} from '../src/briefing-model.js';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} vs ${expected}`);
const inside=(point,map)=>assert.ok(point.x>=map.padding-1e-7&&point.x<=map.width-map.padding+1e-7
  &&point.y>=map.padding-1e-7&&point.y<=map.height-map.padding+1e-7,JSON.stringify({point,width:map.width,height:map.height}));
const futureCourse={id:'future-fixture',name:'40km fixture only',startHeading:Math.PI/2,
  arena:{id:'future-fixture',bounds:{minX:-20000,maxX:20000,minZ:-20000,maxZ:20000},minHeight:0,maxHeight:6000,
    landmarks:[{id:'island',kind:'island',label:'ISLAND',position:{x:15000,y:300,z:15000}}]},
  start:{x:-18000,y:1500,z:0},lights:[{x:-12000,y:1500,z:0},{x:-6000,y:1800,z:0},{x:0,y:2000,z:0},{x:6000,y:1800,z:0},{x:12000,y:1500,z:0}],exit:{x:18000,y:1500,z:0},
  abStraights:[{id:'future-final',from:{x:-17000,y:1500,z:0},to:{x:16000,y:1500,z:0},width:400,heightTolerance:200}]};

test('shared arena metadata preserves actual bounds and every existing landmark coordinate',()=>{
  assert.equal(STANDARD_ARENA.bounds.maxX,STAGE_HALF_EXTENT);assert.equal(STANDARD_ARENA.bounds.minZ,-STAGE_HALF_EXTENT);
  assert.deepEqual(CENTRAL_TOWER.position,{x:-36,y:28,z:-18});assert.equal(CENTRAL_TOWER.height,116);
  assert.deepEqual(DIRECTION_LANDMARKS.map(mark=>[mark.id,mark.position.x,mark.position.z]),[['north',0,-315],['east',295,0],['south',0,315],['west',-295,0]]);
  assert.ok(Object.isFrozen(STANDARD_ARENA)&&Object.isFrozen(STANDARD_ARENA.bounds)&&Object.isFrozen(STANDARD_ARENA.landmarks));
  assert.equal(getCourseArena(COURSES.easy),STANDARD_ARENA);
});
test('model does not mutate course coordinates, caller state or existing PB identity',()=>{
  for(const course of [LEGACY_COURSE,...Object.values(COURSES)]){
    const before=structuredClone(course),key=courseBestKey(course),state={position:{x:500,y:29,z:0},heading:1,collected:1};
    const stateBefore=structuredClone(state),model=createBriefingModel(course,{state});fitBriefingMap(model,{width:320,height:280});
    assert.deepEqual(course,before);assert.deepEqual(state,stateBefore);assert.equal(courseBestKey(course),key);
    assert.ok(Object.isFrozen(model)&&Object.isFrozen(model.targets)&&Object.isFrozen(model.current.position));
    assert.equal(model.targets[0].completed,true);assert.equal(model.targets[1].completed,false);
    assert.deepEqual(model.targets.map(target=>target.height),course.lights.map(target=>target.y));
    assert.equal(model.route.length,course.lights.length+2);assert.equal(model.route.at(-1).label,'EXIT');
  }
});
test('all course objects fit a common full-map scale for three display shapes, including the future40km fixture',()=>{
  for(const course of [LEGACY_COURSE,...Object.values(COURSES),futureCourse])for(const [width,height]of [[320,280],[350,480],[530,250]]){
    const model=createBriefingModel(course),map=fitBriefingMap(model,{width,height});
    for(const position of [...map.route,...map.boundary,...map.landmarks,...map.abStraights.flatMap(lane=>lane.corners)])inside(position,map);
    near(map.scale.pixels,map.scale.metres*map.metresToPixels);assert.ok(map.scale.pixels>0&&map.scale.pixels<=Math.min(100,width*.25));
    assert.equal(map.targets.length,course.lights.length);assert.ok(map.path.startsWith('M'));
  }
  assert.match(fitBriefingMap(createBriefingModel(futureCourse),{width:320,height:280}).scale.label,/km$/);
});
test('starting direction stays up and north indicator rotates, without per-target radar clamping',()=>{
  const model=createBriefingModel(futureCourse),map=fitBriefingMap(model,{width:400,height:300});
  const start=map.project(futureCourse.start),east=map.project({x:futureCourse.start.x+1000,y:1500,z:0}),north=map.project({x:futureCourse.start.x,y:1500,z:-1000});
  near(start.x,east.x);assert.ok(east.y<start.y);near(north.y,start.y);assert.ok(north.x<start.x);
  near(model.north.x,-1);near(model.north.y,0);near(map.north.rotationDegrees,-90);
  const twice=map.project({x:futureCourse.start.x+2000,y:1500,z:0});near(start.y-twice.y,2*(start.y-east.y));
});
test('paused aircraft outside arena remains visible and uses its own heading and collected state',()=>{
  const course={...COURSES.hard,startHeading:.4},state={position:{x:2200,y:31,z:-1700},heading:1.2,collected:4,complete:false};
  const model=createBriefingModel(course,{state}),map=fitBriefingMap(model,{width:320,height:260});
  inside(map.current,map);for(const boundary of map.boundary)inside(boundary,map);
  assert.equal(model.targets.filter(target=>target.completed).length,4);near(model.current.rotationDegrees,.8*180/Math.PI);
  assert.equal(model.heading,.4);assert.equal(model.exit.completed,false);
  assert.equal(createBriefingModel(course,{state:{...state,collected:8,complete:true}}).exit.completed,true);
});
test('thumbnail fits only the real route/AB shape, while safely escaping card text',()=>{
  for(const course of [...Object.values(COURSES),futureCourse]){
    const model=createBriefingModel(course),map=fitBriefingMap(model,{width:160,height:92,padding:11,thumbnail:true});
    for(const point of [...map.route,...map.abStraights.flatMap(lane=>lane.corners)])inside(point,map);
    assert.match(createCoursePreviewSVG(course),/^<svg /);
  }
  const svg=createCoursePreviewSVG({...COURSES.easy,name:'<script>"bad"</script>'});
  assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;'));assert.ok(!/\b(?:href|onload|onclick)=/.test(svg));
});
test('route drawing takes3.6seconds and remains complete without forcing the map closed',()=>{
  assert.equal(BRIEFING_DRAW_SECONDS,3.6);assert.equal(briefingProgress(0),0);near(briefingProgress(1.8),.5);
  assert.ok(briefingProgress(3.59)<1);assert.equal(briefingProgress(3.6),1);assert.equal(briefingProgress(100),1);
  for(const value of [-2,NaN,Infinity,undefined])assert.equal(briefingProgress(value),0);
});
test('malformed coordinates, arena extents and map dimensions cannot produce an invalid drawing',()=>{
  assert.throws(()=>createBriefingModel({...COURSES.easy,start:{x:NaN,y:22,z:200}}),TypeError);
  assert.throws(()=>getCourseArena({arena:{bounds:{minX:5,maxX:5,minZ:0,maxZ:1}}}),TypeError);
  assert.throws(()=>createBriefingModel({...COURSES.easy,abStraights:[{from:COURSES.easy.start,to:COURSES.easy.start,width:24}]}),TypeError);
  for(const options of [{width:0,height:200},{width:200,height:20},{width:NaN,height:200}])assert.throws(()=>fitBriefingMap(createBriefingModel(COURSES.easy),options),TypeError);
});
