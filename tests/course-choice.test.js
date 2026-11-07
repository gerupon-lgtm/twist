import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCourseChoice,saveCourseChoice,COURSE_STORAGE_KEY} from '../src/course-choice.js';

const storage=(id)=>{const values=new Map(id===undefined?[]:[[COURSE_STORAGE_KEY,id]]);return{values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
test('valid URL selection wins over stored selection; load never rewrites preferences',()=>{
  const saved=storage('normal');
  for(const search of ['?course=hard',new URLSearchParams('course=hard'),new URL('https://example.test/?course=hard')])assert.equal(loadCourseChoice(saved,search),'hard');
  assert.equal(saved.getItem(COURSE_STORAGE_KEY),'normal');
  assert.equal(loadCourseChoice(saved,'?course=legacy'),'legacy');
});
test('invalid URL selection falls back to a valid saved value, then easy',()=>{
  for(const search of ['', '?course=unknown','?course=','?mode=flight',null,{}])assert.equal(loadCourseChoice(storage('normal'),search),'normal');
  for(const id of [undefined,'unknown','',null,'"hard"','__proto__'])assert.equal(loadCourseChoice(storage(id),'?course=unknown'),'easy');
  const failing={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.equal(loadCourseChoice(failing,''),'easy');assert.equal(loadCourseChoice(failing,'?course=hard'),'hard');
  assert.equal(loadCourseChoice(null,''),'easy');
});
test('save accepts the three courses and comparison link, preserves existing values for invalid IDs, and handles storage failure',()=>{
  const saved=storage('easy');
  for(const id of ['easy','normal','hard','legacy']){assert.equal(saveCourseChoice(saved,id),true);assert.equal(saved.getItem(COURSE_STORAGE_KEY),id);}
  for(const id of ['',null,undefined,{},[],NaN,'__proto__','unknown'])assert.equal(saveCourseChoice(saved,id),false);
  assert.equal(saved.getItem(COURSE_STORAGE_KEY),'legacy');assert.equal(saveCourseChoice(null,'easy'),false);
  assert.equal(saveCourseChoice({setItem(){throw Error('blocked');}},'easy'),false);
});
