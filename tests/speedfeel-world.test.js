import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {COURSES,COURSE_CRITERIA,LEGACY_COURSE,validateCourse} from '../src/course.js';
import {GROUND_PATTERN,groundPatternPixel,createGroundPattern} from '../src/ground-pattern.js';
import {abLaneStatus} from '../src/ab-straight.js';
import {createScenery} from '../src/scenery.js';

test('all three routes have a bounded long final AB lane after a genuine lining-up margin',()=>{
  for(const course of Object.values(COURSES)){
    const result=validateCourse(course);assert.equal(result.valid,true,result.errors.join('; '));
    assert.ok(Object.isFrozen(course.abStraights)&&Object.isFrozen(course.abStraights[0].from));
    assert.equal(result.abStraightsValid,true);assert.equal(result.abStraights.length,1);
    const lane=result.abStraights[0];assert.ok(lane.length>=COURSE_CRITERIA.abMinimumLengths[course.id]);
    assert.ok(lane.entryMargin>=80&&lane.exitRunout>=35);assert.equal(lane.followingTurnDegrees,0);
    const transition=result.turns.at(-1);assert.equal(transition.lowerBandExempt,true);
    assert.equal(transition.difficultyQualifying,false);assert.equal(transition.upperValid,true);
    assert.equal(result.turns.filter(t=>t.lowerBandExempt).length,1);
    assert.ok(result.qualifyingTurnCount>=result.criteria.minSignificantTurns);
  }
  assert.equal(validateCourse(LEGACY_COURSE).abStraightsValid,true,'comparison route is exempt only from new AB requirement');
});
test('AB validation rejects missing, short, sideways, reversed, badly aligned and unsafe lanes',()=>{
  for(const change of [
    c=>{c.abStraights=[];},
    c=>{c.abStraights[0].to={...c.abStraights[0].from};},
    c=>{c.abStraights[0].from.x+=1;},
    c=>{[c.abStraights[0].from,c.abStraights[0].to]=[c.abStraights[0].to,c.abStraights[0].from];},
    c=>{c.abStraights[0].from={...c.lights.at(-1)};},
    c=>{c.abStraights[0].to={...c.exit};},
    c=>{c.abStraights[0].from.y+=1;},
    c=>{c.abStraights[0].width=0;},
    c=>{c.abStraights[0].from.x=351;},
  ]){
    const c=structuredClone(COURSES.easy);change(c);const result=validateCourse(c);
    assert.equal(result.valid,false);assert.equal(result.abStraightsValid,false);assert.ok(result.errors.some(e=>/AB/.test(e)));
  }
  const sharp=structuredClone(COURSES.hard);sharp.lights[7]={...sharp.lights[6],x:sharp.lights[6].x+1};
  assert.equal(validateCourse(sharp).valid,false,'an AB approach cannot waive upper turn limits');
});
test('AB telemetry uses the true position, full corridor width and height, including outside progress',()=>{
  const lanes=[{id:'test',from:{x:0,y:24,z:0},to:{x:0,y:28,z:-300},width:24,heightTolerance:12}];
  const status=abLaneStatus(lanes,{x:0,y:26,z:-150});assert.equal(status.inside,true);assert.equal(status.progress,.5);assert.equal(status.length,300);assert.equal(status.centerDistance,0);
  assert.equal(abLaneStatus(lanes,{x:12.01,y:26,z:-150}).inside,false);
  assert.equal(abLaneStatus(lanes,{x:0,y:38.01,z:-150}).inside,false);
  assert.equal(abLaneStatus(lanes,{x:0,y:24,z:1}).inside,false);
  assert.ok(abLaneStatus(lanes,{x:0,y:24,z:1}).progress<0);
  assert.ok(abLaneStatus(lanes,{x:0,y:28,z:-301}).progress>1);
  assert.equal(abLaneStatus([],{}),null);
});
test('the repeated coarse and fine image covers outside the old island and both world edges',()=>{
  assert.equal(GROUND_PATTERN.coverageMetres,20000);assert.equal(GROUND_PATTERN.coarseMetres,16);assert.equal(GROUND_PATTERN.fineMetres,4);
  for(const [x,z]of [[125,160],[340,-340],[9990,9990],[-9990,-9990],[720,-900]]){
    const colors=new Set();for(let offset=0;offset<32;offset++)colors.add(groundPatternPixel(x+offset,z+offset*.37).join(','));
    assert.ok(colors.size>=4,`missing multiple pattern scales at ${x}, ${z}`);
    assert.deepEqual(groundPatternPixel(x,z),groundPatternPixel(x+64,z-64));
  }
  assert.deepEqual(groundPatternPixel(8,8,0),[154,80,47]);
});
test('one mipmapped anisotropic texture changes only on setting changes and disposes once',()=>{
  const pattern=createGroundPattern({maxAnisotropy:16});let textureDisposals=0,materialDisposals=0;
  pattern.texture.addEventListener('dispose',()=>textureDisposals++);pattern.material.addEventListener('dispose',()=>materialDisposals++);
  assert.equal(pattern.texture.generateMipmaps,true);assert.equal(pattern.texture.minFilter,THREE.LinearMipmapLinearFilter);assert.equal(pattern.texture.anisotropy,8);
  const before=pattern.texture.version;assert.equal(pattern.setStrength(.8),false);assert.equal(pattern.texture.version,before);
  assert.equal(pattern.setStrength(.3),true);assert.equal(pattern.texture.version,before+1);assert.equal(pattern.snapshot().updates,2);
  assert.equal(pattern.setStrength(NaN),false);assert.equal(pattern.setStrength(9),true);assert.equal(pattern.snapshot().strength,1);
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(20000,20000));plane.position.y=-.08;plane.rotation.x=-Math.PI/2;pattern.applyWorldUV(plane);
  assert.equal(Math.abs(plane.geometry.getAttribute('uv').getX(0)),10000/64);plane.geometry.dispose();plane.material.dispose();
  pattern.dispose();pattern.dispose();assert.equal(textureDisposals,1);assert.equal(materialDisposals,1);
});
test('course-near pillars and open AB gates have bounded frozen audio metadata and no collisions',()=>{
  for(const course of Object.values(COURSES)){
    const scenery=createScenery({coursePoints:[course.start,...course.lights,course.exit],avoidPoints:[course.start,...course.lights,course.exit],abStraights:course.abStraights});
    assert.equal(scenery.details.collisions,false);assert.equal(scenery.details.abGates,2);assert.ok(scenery.details.routePillars>30&&scenery.details.routePillars<100);
    assert.ok(Object.isFrozen(scenery.passObjects));assert.equal(new Set(scenery.passObjects.map(p=>p.id)).size,scenery.passObjects.length);
    for(const p of scenery.passObjects){assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.position));assert.ok(Math.abs(p.position.x)<=350&&Math.abs(p.position.z)<=350&&p.position.y>=2);}
    for(const name of ['course-speed-pillars','course-speed-pillar-caps','ab-straight-gate-pillars','ab-straight-gate-lintels']){const mesh=scenery.group.getObjectByName(name);assert.equal(mesh.isInstancedMesh,true);assert.equal(mesh.userData.collisions,false);}
    const geometries=new Set(),materials=new Set();scenery.group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  }
});
