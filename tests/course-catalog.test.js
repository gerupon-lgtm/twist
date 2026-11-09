import test from 'node:test';
import assert from 'node:assert/strict';
import {COURSES,LEGACY_COURSE} from '../src/course.js';
import {getCourse,normalizeCourseId,NORMAL_COURSE_IDS,ORDINARY_COURSE_IDS,PLAYABLE_COURSE_IDS} from '../src/course-catalog.js';
import {loadCourseChoice,saveCourseChoice,COURSE_STORAGE_KEY} from '../src/course-choice.js';
import {createBriefingModel} from '../src/briefing-model.js';

test('additional courses preserve the exact three normal and comparison objects and keep Sonic flight-only',()=>{
 for(const [id,course] of Object.entries(COURSES))assert.equal(getCourse(id),course);
 assert.equal(getCourse('legacy'),LEGACY_COURSE);assert.equal(getCourse('__proto__'),COURSES.easy);
 assert.deepEqual(NORMAL_COURSE_IDS,['easy','normal','hard']);
 assert.deepEqual(ORDINARY_COURSE_IDS,['easy','normal','hard','sierra50']);
 assert.deepEqual(PLAYABLE_COURSE_IDS,['easy','normal','hard','supersonic','sierra50','sierra10']);
});
test('high-speed URL selection and persistence use the existing explicit course preference boundary',()=>{
 const values=new Map([[COURSE_STORAGE_KEY,'normal']]);
 const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
 assert.equal(loadCourseChoice(storage,'?course=supersonic'),'supersonic');
 assert.equal(values.get(COURSE_STORAGE_KEY),'normal');
 assert.equal(saveCourseChoice(storage,'supersonic'),true);
 assert.equal(loadCourseChoice(storage,'?course=unknown'),'supersonic');
 assert.equal(normalizeCourseId('supersonic'),'supersonic');
});
test('the high-speed course supplies real metre coordinates to the shared briefing',()=>{
 const course=getCourse('supersonic'),model=createBriefingModel(course);
 assert.equal(model.targets.length,5);assert.equal(model.route.length,7);
 assert.equal(model.start.height,1500);assert.equal(model.arena.bounds.maxX-model.arena.bounds.minX,40000);
 assert.equal(Math.abs(model.route[1].position.z-model.start.position.z),6000);
 assert.equal(model.exit.position.z,-18000);
});
