import assert from 'node:assert/strict';
import test from 'node:test';
import {COURSE,LEGACY_COURSE,COURSES,DEFAULT_COURSE_ID,COURSE_CRITERIA,getCourse,normalizeCourseId,validateCourse} from '../src/course.js';
const near=(actual,expected,tolerance=1e-7)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} vs ${expected}`);
const copy=(id='easy')=>structuredClone(COURSES[id]);
const scale=(course,factor)=>{
  for(const p of [course.start,...course.lights,course.exit]){p.x*=factor;p.z*=factor;}
  for(const lane of course.abStraights??[])for(const p of [lane.from,lane.to]){p.x*=factor;p.z*=factor;}
  return course;
};

test('the released comparison coordinates remain immutable and separate from default easy',()=>{
  assert.equal(COURSE,LEGACY_COURSE);assert.equal(DEFAULT_COURSE_ID,'easy');
  assert.deepEqual(COURSE.start,{x:0,y:14,z:26});assert.deepEqual(COURSE.lights[0],{x:0,y:14,z:0});
  assert.deepEqual(COURSE.exit,{x:8,y:20,z:-96});assert.notEqual(getCourse(),COURSE);
  for(const course of [LEGACY_COURSE,...Object.values(COURSES)]){
    assert.ok(Object.isFrozen(course)&&Object.isFrozen(course.lights));
    for(const p of [course.start,...course.lights,course.exit])assert.ok(Object.isFrozen(p));
    assert.throws(()=>{course.lights[0].x=999;},TypeError);
  }
  assert.ok(Object.isFrozen(COURSES)&&Object.isFrozen(COURSE_CRITERIA.difficulties.easy.utilizationBand));
});
test('course normalization accepts three choices and the explicit comparison, otherwise easy',()=>{
  for(const id of ['easy','normal','hard','legacy']){assert.equal(normalizeCourseId(id),id);assert.equal(getCourse(id).id,id);}
  for(const id of [null,undefined,'','unknown','toString','constructor',2,{},['hard']]){
    assert.equal(normalizeCourseId(id),'easy');assert.equal(getCourse(id),COURSES.easy);
  }
  assert.deepEqual(Object.values(COURSES).map(c=>c.lights.length),[3,5,8]);
});
test('all three candidate courses pass both reference speeds and the 20 m/s difficulty bands',()=>{
  for(const [id,expectedTurns,qualifyingTurns]of [['easy',3,2],['normal',4,3],['hard',7,6]]){
    const result=validateCourse(COURSES[id]);assert.equal(result.valid,true,result.errors.join('; '));
    assert.equal(result.segments.length,COURSES[id].lights.length+1);assert.equal(result.turns.length,COURSES[id].lights.length);
    assert.equal(result.significantTurnCount,expectedTurns);assert.equal(result.qualifyingTurnCount,qualifyingTurns);
    near(result.initialHeadingChangeDegrees,0);near(result.turnRadii[10],17.673987832335484);near(result.turnRadii[20],70.69595132934194);
    assert.ok(result.hasAscent&&result.hasDescent);
    for(const turn of result.turns){
      assert.ok(turn.utilization10<=1&&turn.utilization20<=1);near(turn.utilization20,4*turn.utilization10);
      assert.equal(turn.valid,true);assert.equal(turn.bandValid,true);
    }
    assert.ok(result.segments.every(s=>s.valid&&Math.abs(s.heightChange)<=10));
  }
});
test('long final approach route lengths and earlier turning difficulty match the independent worksheet',()=>{
  for(const [id,time,radius,u20]of [['easy',73.759764103447,174.64249196572982,.4048038397391549],
    ['normal',103.23584428455732,164.46884203398528,.4298440388771848],['hard',120.93275839943234,111.05785201449203,.6365686896241859]]){
    const result=validateCourse(COURSES[id]);near(result.cruiseTimeSeconds,time);
    near(result.turns[1].circumradius,radius,1e-6);near(result.turns[1].utilization20,u20);
    const [low,high]=result.criteria.cruiseTimeRange;assert.ok(result.cruiseTimeSeconds>=low&&result.cruiseTimeSeconds<=high);
  }
  assert.deepEqual(validateCourse(COURSES.normal).turns.map(t=>Math.sign(t.signedTurnDegrees)),[1,1,0,-1,-1]);
});
test('legacy and an otherwise well-timed straight course fail the new minimum-turn condition',()=>{
  const old=validateCourse(LEGACY_COURSE);assert.equal(old.valid,false);assert.equal(old.significantTurnCount,0);
  assert.ok(old.errors.some(e=>e.includes('45-degree')));
  const straight={id:'easy',start:{x:0,y:22,z:160},lights:[{x:0,y:24,z:120},{x:0,y:30,z:0},{x:0,y:24,z:-120}],exit:{x:0,y:28,z:-240}};
  const result=validateCourse(straight);assert.equal(result.valid,false);assert.ok(result.cruiseTimeSeconds>30&&result.cruiseTimeSeconds<45);
  assert.equal(result.significantTurnCount,0);assert.ok(result.errors.some(e=>e.includes('45-degree')));
});
test('impossible utilization fails even when a light center has valid coordinates',()=>{
  const result=validateCourse(scale(copy('hard'),.2));assert.equal(result.valid,false);
  assert.ok(result.turns.some(t=>t.utilization20>1&&!t.upperValid));
  assert.ok(result.errors.some(e=>e.includes('exceeds the turn limit')));
  assert.equal(validateCourse(COURSES.hard,{turnGravity:3}).valid,false,'weak turn strength cannot certify the same hard curve');
});
test('significant corners below or above their difficulty band cannot pass merely by being reachable',()=>{
  const wide=scale(copy(),1.35);
  for(const p of [wide.start,...wide.lights,wide.exit,...wide.abStraights.flatMap(l=>[l.from,l.to])]){p.x-=80;p.z+=75;}
  const tooEasy=validateCourse(wide);assert.equal(tooEasy.valid,false);
  assert.ok(tooEasy.turns.some(t=>t.significant&&t.utilization20<.3&&!t.bandValid));
  const tooHard=validateCourse(scale(copy(),.8));assert.equal(tooHard.valid,false);
  assert.ok(tooHard.turns.some(t=>t.significant&&t.utilization20>.6&&t.utilization20<1&&!t.bandValid));
});
test('course criteria require ascent and descent and reject excessive height changes',()=>{
  const flat=copy();for(const p of [flat.start,...flat.lights,flat.exit])p.y=24;
  const flatResult=validateCourse(flat);assert.equal(flatResult.valid,false);assert.ok(flatResult.errors.some(e=>e.includes('both ascent and descent')));
  const steep=copy();steep.lights[1].y=steep.lights[0].y+10.01;
  const result=validateCourse(steep);assert.equal(result.valid,false);assert.equal(result.segments[1].heightValid,false);
});
test('expanded bounds and the initial north heading are checked explicitly',()=>{
  assert.equal(validateCourse(COURSES.easy).valid,true,'the long final approach intentionally extends beyond the old 110m arena');
  for(const [axis,value]of [['x',350.01],['z',-350.01],['y',1.99],['y',45.01]]){
    const course=copy();course.exit[axis]=value;assert.equal(validateCourse(course).valid,false,`${axis}=${value}`);
  }
  const course=copy();course.start.x-=1;const result=validateCourse(course);
  assert.equal(result.valid,false);assert.ok(result.initialHeadingChangeDegrees>0);assert.equal(result.segments[0].valid,false);
});
test('malformed points, light counts, options and flight conditions cannot be certified',()=>{
  for(const course of [undefined,null,{},[],{...COURSES.easy,lights:[]},{...COURSES.easy,lights:COURSES.easy.lights.slice(0,2)},
    {...COURSES.hard,lights:[...COURSES.hard.lights,COURSES.hard.exit]},{...COURSES.easy,start:null}]){
    const result=validateCourse(course);assert.equal(result.valid,false);assert.ok(result.errors.length>0);
  }
  for(const key of ['start','exit',0,1,2])for(const axis of ['x','y','z'])for(const value of [NaN,Infinity,-Infinity,undefined,'12']){
    const c=copy();(typeof key==='number'?c.lights[key]:c[key])[axis]=value;assert.equal(validateCourse(c).valid,false);
  }
  for(const options of [null,[],8,'30'])assert.equal(validateCourse(COURSES.easy,options).valid,false);
  for(const bankDegrees of [0,-30,90,180,NaN,Infinity,'30',Number.MIN_VALUE])assert.equal(validateCourse(COURSES.easy,{bankDegrees}).valid,false);
  for(const turnGravity of [0,-3,NaN,Infinity,'3',2.9,15.1])assert.equal(validateCourse(COURSES.easy,{turnGravity}).valid,false);
});
test('duplicate, nearly duplicate, vertical-only and reversed routes fail',()=>{
  for(const p of [{...COURSES.easy.lights[0]},{...COURSES.easy.lights[0],y:28},{...COURSES.easy.lights[0],x:COURSES.easy.lights[0].x+1e-12}]){
    const c=copy();c.lights[1]=p;assert.equal(validateCourse(c).valid,false);
  }
  const repeated=copy();repeated.exit={...repeated.start};assert.equal(validateCourse(repeated).valid,false);
  const reversed=copy();reversed.lights[1]={x:reversed.lights[0].x,y:30,z:reversed.lights[0].z+10};
  const result=validateCourse(reversed);assert.equal(result.valid,false);assert.ok(result.errors.some(e=>e.includes('reverses direction')));
});
test('conditions and caller-owned geometry stay unchanged while snapshots remain independent',()=>{
  const c=copy(),before=structuredClone(c),conditions=Object.freeze({bankDegrees:30,turnGravity:9.8});
  const result=validateCourse(c,conditions);assert.equal(result.valid,true);assert.deepEqual(c,before);
  assert.deepEqual(conditions,{bankDegrees:30,turnGravity:9.8});result.turnRadii[10]=999;
  near(validateCourse(c).turnRadii[10],17.673987832335484);
});
