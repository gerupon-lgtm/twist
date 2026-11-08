import test from 'node:test';
import assert from 'node:assert/strict';
import {COURSES} from '../src/course.js';
import {BRIEFING_STORAGE_KEY,createBriefingPreferences} from '../src/briefing-preferences.js';
const storage=()=>{const data=new Map(),writes=[];return {getItem:key=>data.get(key)??null,setItem:(key,value)=>{writes.push(key);data.set(key,String(value));},data,writes};};

test('first use defaults to every and never changes existing flight settings or PB',()=>{
  const data=storage();data.setItem('twist.flight-settings.v1','{"maxBank":25}');data.setItem('twist.course-bests.v1','{"untouched":true}');data.writes.length=0;
  const prefs=createBriefingPreferences(data);assert.equal(prefs.getMode(),'every');assert.equal(data.writes.length,0);
  assert.equal(prefs.shouldShow(COURSES.easy),true);prefs.markShown(COURSES.easy);assert.equal(prefs.shouldShow(COURSES.easy),true);
  assert.deepEqual(data.writes,[BRIEFING_STORAGE_KEY]);assert.equal(data.getItem('twist.flight-settings.v1'),'{"maxBank":25}');assert.equal(data.getItem('twist.course-bests.v1'),'{"untouched":true}');
});
test('first mode remembers each layout across reload, while off suppresses automatic maps',()=>{
  const data=storage(),prefs=createBriefingPreferences(data);assert.equal(prefs.setMode('first'),true);
  assert.equal(prefs.shouldShow(COURSES.easy),true);prefs.markShown(COURSES.easy);assert.equal(prefs.shouldShow(COURSES.easy),false);assert.equal(prefs.shouldShow(COURSES.normal),true);
  const restored=createBriefingPreferences(data);assert.equal(restored.getMode(),'first');assert.equal(restored.shouldShow(COURSES.easy),false);
  const changed=structuredClone(COURSES.easy);changed.exit.x+=1;assert.equal(restored.shouldShow(changed),true);
  assert.equal(restored.shouldShow({...COURSES.easy,name:'Only a new label'}),false);
  restored.setMode('off');assert.equal(restored.shouldShow(COURSES.hard),false);assert.equal(createBriefingPreferences(data).getMode(),'off');
  restored.setMode('every');assert.equal(restored.shouldShow(COURSES.easy),true);
});
test('corrupt or unavailable dedicated storage falls back without destroying saved data',()=>{
  for(const raw of ['broken','null','[]','{"version":99,"mode":"off"}','{"version":1,"mode":"bad","seen":[null,3,"bad"]}']){
    const data=storage();data.setItem(BRIEFING_STORAGE_KEY,raw);const prefs=createBriefingPreferences(data);
    assert.equal(prefs.getMode(),'every');assert.equal(prefs.shouldShow(COURSES.easy),true);assert.equal(data.getItem(BRIEFING_STORAGE_KEY),raw);
  }
  const prefs=createBriefingPreferences({getItem(){throw Error('Unavailable');},setItem(){throw Error('Unavailable');}});
  prefs.setMode('first');prefs.markShown(COURSES.easy);assert.equal(prefs.shouldShow(COURSES.easy),false);
  const memoryOnly=createBriefingPreferences();memoryOnly.setMode('off');assert.equal(memoryOnly.getMode(),'off');
});
test('invalid mode or course never rewrites preferences and layout-key ordering is stable',()=>{
  const data=storage(),prefs=createBriefingPreferences(data);
  for(const value of [null,undefined,'once','always',1])assert.equal(prefs.setMode(value),false);
  for(const course of [null,{}, {...COURSES.easy,id:'invalid id'}, {...COURSES.easy,start:null}]){assert.equal(prefs.shouldShow(course),false);assert.equal(prefs.markShown(course),false);}
  assert.equal(data.writes.length,0);prefs.setMode('first');prefs.markShown(COURSES.easy);
  const rearranged={...COURSES.easy,start:{z:COURSES.easy.start.z,y:COURSES.easy.start.y,x:COURSES.easy.start.x}};
  assert.equal(prefs.shouldShow(rearranged),false);
  assert.equal(prefs.shouldShow({...COURSES.easy,arena:{bounds:{maxZ:350,minZ:-350,maxX:350,minX:-350}}}),false);
});
