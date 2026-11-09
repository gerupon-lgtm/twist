import test from 'node:test';import assert from 'node:assert/strict';
import {getCourse,PLAYABLE_COURSE_IDS,NORMAL_COURSE_IDS,ORDINARY_COURSE_IDS} from '../src/course-catalog.js';
import {loadCourseChoice,saveCourseChoice,COURSE_STORAGE_KEY} from '../src/course-choice.js';
import {resolveCourseWorldProfile,courseRadarRange,courseRecordMetadata} from '../src/course-world-profile.js';
import {createCourseSurface,courseGroundClearance} from '../src/course-surface.js';
import {hudTargetLabel,hudCollectedNotice} from '../src/hud-text.js';
import {createBriefingModel,createCoursePreviewSVG} from '../src/briefing-model.js';
test('catalog adds exactly one ordinary course, preserves old three plus Sonic and reads old storage without writes',()=>{
 assert.deepEqual(NORMAL_COURSE_IDS,['easy','normal','hard']);assert.deepEqual(ORDINARY_COURSE_IDS,['easy','normal','hard','sierra50']);assert.deepEqual(PLAYABLE_COURSE_IDS,['easy','normal','hard','supersonic','sierra50','sierra10']);
 let saved='hard',writes=0;const storage={getItem:key=>key===COURSE_STORAGE_KEY?saved:null,setItem:(key,value)=>{saved=value;writes++;}};
 assert.equal(loadCourseChoice(storage,'?course=sierra50'),'sierra50');assert.equal(writes,0);assert.equal(saved,'hard');assert.equal(saveCourseChoice(storage,'sierra50'),true);assert.equal(saved,'sierra50');assert.equal(loadCourseChoice(storage),'sierra50');assert.equal(writes,1);
});
test('course-only range is explicit while normal and Sonic profiles are not changed',()=>{
 const course=getCourse('sierra50');assert.equal(courseRadarRange(course,180),1000);assert.equal(courseRadarRange(getCourse('easy'),180),180);assert.equal(resolveCourseWorldProfile(getCourse('supersonic')),null);
 const metadata=courseRecordMetadata(course);assert.equal(metadata.estimatedGeography,true);assert.equal(metadata.coordinateTransform.heightDatum,790);assert.equal(metadata.sourcePoints.length,7);assert.equal(metadata.surface,'flat');assert.equal(courseRecordMetadata(getCourse('hard')),null);
 const surface=createCourseSurface(course);assert.equal(courseGroundClearance(surface,{x:866.3,y:41.6,z:-1098.9}),41.6);assert.equal(surface.heightAt(100,200),0);
});
test('one point metadata reaches English/Japanese target, next notice, full map and preview',()=>{
 const course=getCourse('sierra50'),model=createBriefingModel(course);
 assert.equal(hudTargetLabel({collected:1,total:6,targetLabel:'光 2',pointName:'B'},'en'),'TGT 2 · B');assert.equal(hudTargetLabel({collected:1,total:6,targetLabel:'光 2',pointName:'B'},'ja'),'光 2 · B');assert.equal(hudTargetLabel({kind:'exit',label:'出口',pointName:'G'},'en'),'EXIT · G');
 assert.match(hudCollectedNotice({collected:1,total:6,pointNames:course.pointNames},'en'),/A COLLECTED.*B/);assert.match(hudCollectedNotice({collected:6,total:6,pointNames:course.pointNames},'ja'),/F.*出口 G/);
 assert.deepEqual(model.targets.map(p=>p.pointName),['A','B','C','D','E','F']);assert.equal(model.exit.pointName,'G');const preview=createCoursePreviewSVG(course);for(const name of 'ABCDEFG')assert.ok(preview.includes('>'+name+'</text>'));
 // Existing course strings are exact old expectations, not broad regexes.
 assert.equal(hudTargetLabel({collected:1,total:3,targetLabel:'光 2'},'en'),'TGT 2');assert.equal(hudTargetLabel({kind:'exit',label:'出口'},'ja'),'出口');
});
