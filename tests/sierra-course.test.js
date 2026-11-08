import test from 'node:test';import assert from 'node:assert/strict';
import {SIERRA_COURSE,SIERRA_SOURCE_POINTS,SIERRA_PROJECTION,SIERRA_WORLD_PROFILE,projectSierraCoordinates,
 getSierraWorldProfile,sierraGroundHeightAt,sierraPointMetadata,sierraRouteEdges,withSierraSegmentLabels} from '../src/courses/sierra50.js';
import {validateSierraGeometry,SIERRA_GEOMETRY_CRITERIA} from '../src/sierra-validation.js';
import {COURSES,LEGACY_COURSE,COURSE_CRITERIA,validateCourse} from '../src/course.js';
import {SUPERSONIC_COURSE} from '../src/supersonic/course.js';
import {FLIGHT_MODEL} from '../src/flight-physics.js';
import {createRouteTiming} from '../src/route-timing.js';
import {courseBestKey} from '../src/course-bests.js';
import {targetHeightGuide} from '../src/target-height.js';
import {createBriefingModel,fitBriefingMap} from '../src/briefing-model.js';
const near=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} vs ${b}`);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const clone=()=>structuredClone(SIERRA_COURSE);

test('provided estimated geographic points reproduce the independent 0.1 m table without rotating the route',()=>{
 const expected=[[-776.1,10,1536.4],[-866.3,24.8,1028.4],[-123.4,23.6,672.6],[168.4,22.4,13],[315.8,27.2,-595],[866.3,41.6,-1098.9],[613.6,14.8,-1536.4]];
 assert.equal(SIERRA_PROJECTION.parameters.earthRadius,6371000);assert.equal(SIERRA_PROJECTION.parameters.horizontalDivisor,50);assert.equal(SIERRA_PROJECTION.parameters.verticalExaggeration,2);assert.equal(SIERRA_PROJECTION.parameters.heightDatum,790);
 SIERRA_PROJECTION.points.forEach((row,i)=>{assert.deepEqual([row.position.x,row.position.y,row.position.z],expected[i]);for(const key of ['x','y','z'])assert.ok(Math.abs(row.rawPosition[key]-row.position[key])<=.05+1e-9);assert.ok(distance(row.rawPosition,row.position)<.1);});
 const [A,B]=SIERRA_PROJECTION.points;assert.ok(B.position.x<A.position.x,'west is -x');assert.ok(B.position.z<A.position.z,'north is -z');
 assert.equal(SIERRA_PROJECTION.parameters.sourceKind,'user-provided-estimates-unverified');assert.equal(SIERRA_SOURCE_POINTS[5].estimatedElevation,1580);
});
test('projection scales and invalid values are explicit rather than silently changing the input',()=>{
 const twice=projectSierraCoordinates(SIERRA_SOURCE_POINTS,{horizontalDivisor:25,roundDecimals:6});
 SIERRA_PROJECTION.points.forEach((row,i)=>{near(twice.points[i].rawPosition.x,row.rawPosition.x*2);near(twice.points[i].rawPosition.z,row.rawPosition.z*2);near(twice.points[i].rawPosition.y,(row.rawPosition.y-10)*2+10);});
 for(const options of [{earthRadius:0},{horizontalDivisor:NaN},{verticalExaggeration:-1},{roundDecimals:8},null])assert.throws(()=>projectSierraCoordinates(SIERRA_SOURCE_POINTS,options),TypeError);
 const bad=structuredClone(SIERRA_SOURCE_POINTS);bad[1].latitude=NaN;assert.throws(()=>projectSierraCoordinates(bad),TypeError);
 assert.throws(()=>{SIERRA_SOURCE_POINTS[0].latitude=0;},TypeError);
});
test('A..F are exactly six lights and G is an open EXIT, with a 150 m real-heading lead-in',()=>{
 const c=SIERRA_COURSE,A=c.lights[0],B=c.lights[1];assert.equal(c.id,'sierra50');assert.equal(c.lights.length,6);assert.deepEqual(c.exit,SIERRA_PROJECTION.points[6].position);assert.deepEqual(c.pointNames,['A','B','C','D','E','F','G']);
 near(distance(c.start,A),150);near(c.start.y,10);near(c.startHeading,Math.atan2(B.x-A.x,-(B.z-A.z)));near((c.startHeading*180/Math.PI+360)%360,349.931550,.00001);
 const edges=sierraRouteEdges();assert.equal(edges.length,7);assert.deepEqual(edges.map(e=>e.fromName+'→'+e.toName),['START→A','A→B','B→C','C→D','D→E','E→F','F→G']);assert.ok(!edges.some(e=>e.fromName==='G'));
 for(const p of [c.start,...c.lights,c.exit])assert.deepEqual(Object.keys(p).sort(),['x','y','z']);
});
test('Sierra-only profile has no force, speed, collection-radius or settings-save override',()=>{
 const p=SIERRA_WORLD_PROFILE;assert.equal(getSierraWorldProfile(SIERRA_COURSE),p);assert.equal(p.halfExtent,1850);assert.deepEqual(p.bounds,{minX:-1850,maxX:1850,minZ:-1850,maxZ:1850});assert.equal(p.maxHeight,70);assert.equal(p.camera.far,5000);assert.equal(p.camera.near,.1);assert.equal(p.radar.writeSavedValue,false);
 for(const c of [LEGACY_COURSE,...Object.values(COURSES),SUPERSONIC_COURSE,null])assert.equal(getSierraWorldProfile(c),null);
 for(const key of ['maxSpeed','cruiseSpeed','gravity','turnGravity','collectRadius','exitRadius'])assert.equal(p[key],undefined);
 assert.equal(FLIGHT_MODEL.cruiseSpeed,10);assert.equal(FLIGHT_MODEL.maxSpeed,30);assert.equal(FLIGHT_MODEL.gravity,3);assert.equal(COURSE_CRITERIA.turnGravity,9.8);
});
test('separate geometry criteria certify only bounded turns and long straights, not real flight',()=>{
 const r=validateSierraGeometry(SIERRA_COURSE);assert.equal(r.valid,true,r.errors.join('; '));assert.equal(r.geometryOnly,true);assert.equal(r.flightVerified,false);assert.equal(r.segments.length,7);assert.equal(r.turns.length,6);assert.equal(r.hasLongStraight,true);near(r.routeLength,3939.147,.02);near(r.totalLength-r.routeLength,150);
 assert.deepEqual(SIERRA_GEOMETRY_CRITERIA.speeds,[10,20,45]);for(const t of r.turns)for(const u of Object.values(t.utilizations))assert.ok(u<=1);
 const ab=r.abStraights[0];assert.equal(ab.valid,true);assert.ok(ab.length>=300);near(ab.entryMargin,120);near(ab.exitRunout,80);
 assert.ok(r.segments.some(s=>s.heightChange>10));assert.ok(r.segments.some(s=>s.heightChange< -10));assert.ok(r.segments.every(s=>Math.abs(s.slopeDegrees)<5));
});
test('bad heading, height, bounds, duplicates, closed route and backwards AB lane cannot pass',()=>{
 for(const mutate of [c=>{c.startHeading=0;},c=>{c.exit.y=70.01;},c=>{c.exit.z=-1850.01;},c=>{c.lights[1]={...c.lights[0]};},c=>{c.lights.push(c.exit);c.exit={...c.lights[0]};},c=>{[c.abStraights[0].from,c.abStraights[0].to]=[c.abStraights[0].to,c.abStraights[0].from];}]){const c=clone();mutate(c);assert.equal(validateSierraGeometry(c).valid,false);}
 assert.equal(validateSierraGeometry(SIERRA_COURSE,{turnGravity:3}).valid,false,'weaker turn cannot automatically certify the 45 m/s geometry');
 for(const options of [null,{bankDegrees:0},{turnGravity:15.01}])assert.equal(validateSierraGeometry(SIERRA_COURSE,options).valid,false);
});
test('ordinary difficulty validators and old course coordinates remain their existing authority',()=>{
 assert.equal(COURSE_CRITERIA.limits.horizontal,350);assert.equal(COURSE_CRITERIA.limits.maxHeight,45);assert.equal(COURSE_CRITERIA.limits.heightChange,10);
 for(const c of Object.values(COURSES))assert.equal(validateCourse(c).valid,true);assert.equal(validateCourse(SIERRA_COURSE).valid,false,'do not weaken old validator to admit a geographic route');
 assert.deepEqual(COURSES.easy.start,{x:-150,y:22,z:200});assert.deepEqual(LEGACY_COURSE.start,{x:0,y:14,z:26});assert.equal(SUPERSONIC_COURSE.id,'supersonic');
});
test('flat surface does not interpret estimated elevation as physical terrain or change target ALT',()=>{
 for(const [x,z]of [[0,0],[-1850,1850],[1850,-1850],[-776.1,1536.4]])assert.equal(sierraGroundHeightAt(x,z),0);
 assert.throws(()=>sierraGroundHeightAt(NaN,0),TypeError);
 const target=SIERRA_COURSE.lights[5],position={x:target.x,y:10,z:target.z+100},guide=targetHeightGuide({position,targetPosition:target,targetRadius:3.2,velocity:{x:0,y:0,z:-10}});
 near(guide.target,41.6);near(guide.delta,31.6);assert.equal(guide.direction,'up');assert.equal(position.y-sierraGroundHeightAt(position.x,position.z),10);
 // Integration still must prove stage collision/status/marker actually call
 // the sampler. This pure test intentionally does not claim that wiring exists.
});
test('one metadata source decorates labels and all seven timing rows without changing clocks or PB identity',()=>{
 for(let i=0;i<7;i++){const m=sierraPointMetadata(SIERRA_COURSE,i);assert.equal(m.pointName,'ABCDEFG'[i]);assert.equal(m.label,i===6?'EXIT · G':`TGT ${i+1} · ${'ABCDEFG'[i]}`);}
 assert.equal(sierraPointMetadata(COURSES.easy,0),null);assert.equal(sierraPointMetadata(SIERRA_COURSE,7),null);
 const timer=createRouteTiming(6);for(let i=1;i<=6;i++)timer.advance(1,{total:6,collected:i});timer.advance(1,{total:6,collected:6,complete:true});
 const original=timer.snapshot(),named=withSierraSegmentLabels(original);assert.deepEqual(named.map(r=>r.id),original.map(r=>r.id));assert.deepEqual(named.map(r=>r.seconds),original.map(r=>r.seconds));assert.equal(named.reduce((n,r)=>n+r.seconds,0),7);assert.deepEqual(named.map(r=>r.label),['開始→A','A→B','B→C','C→D','D→E','E→F','F→G']);
 assert.ok(withSierraSegmentLabels(createRouteTiming(6).snapshot()).every(r=>r.seconds===null));
 const c=clone(),key=courseBestKey(c);delete c.sourcePoints;delete c.pointNames;delete c.coordinateTransform;assert.equal(courseBestKey(c),key);assert.notEqual(key,courseBestKey(COURSES.easy));
});
test('existing projection can fit the open route at all three sizes without radar-style clamping',()=>{
 const model=createBriefingModel(SIERRA_COURSE);assert.equal(model.route.length,8);assert.equal(model.targets.length,6);assert.equal(model.exit.height,14.8);
 for(const [width,height]of [[390,844],[360,640],[844,390]]){const fit=fitBriefingMap(model,{width,height,padding:36});for(const p of fit.route){assert.ok(p.x>=36-1e-7&&p.x<=width-36+1e-7);assert.ok(p.y>=36-1e-7&&p.y<=height-36+1e-7);}assert.ok(fit.metresToPixels>0);assert.ok(fit.path.startsWith('M'));}
 // UI/card text bounds and A..G rendering need later source patches and native
 // geometry tests; route-fit alone cannot certify their readability.
});
