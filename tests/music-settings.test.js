import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFeedbackSettings,loadFeedbackSettings,FEEDBACK_SETTINGS_KEY} from '../src/feedback/settings.js';
import {MUSIC_PREVIEW_SETTINGS_KEY,loadMusicPreviewSettings,saveMusicPreviewSettings,saveFeedbackSettings} from '../src/feedback/settings.js';

test('engine and clear selection have conservative defaults while legacy saved requests are read without writing',()=>{
  const initial=normalizeFeedbackSettings();assert.equal(initial.musicEngine,'scc');assert.equal(initial.clearTrackId,'clear');
  const raw=JSON.stringify({sound:false,bgm:false,volume:37,musicSet:'brave',unknown:'keep raw'}),writes=[];
  const storage={getItem:key=>key===FEEDBACK_SETTINGS_KEY?raw:null,setItem:(...args)=>writes.push(args)};
  const loaded=loadFeedbackSettings(storage);assert.equal(loaded.musicSet,'brave');assert.equal(loaded.volume,37);assert.equal(loaded.bgm,false);assert.equal(loaded.sound,false);
  assert.equal(loaded.musicEngine,'scc');assert.equal(loaded.clearTrackId,'clear');assert.deepEqual(writes,[]);assert.equal(storage.getItem(FEEDBACK_SETTINGS_KEY),raw);
  assert.equal(normalizeFeedbackSettings({musicEngine:'fm',clearTrackId:'clear-advance'}).musicEngine,'fm');
  assert.equal(normalizeFeedbackSettings({musicEngine:'fm',clearTrackId:'clear-advance'}).clearTrackId,'clear-advance');
  assert.equal(normalizeFeedbackSettings({musicEngine:'../x',clearTrackId:'flight'}).musicEngine,'scc');
  assert.equal(normalizeFeedbackSettings({musicEngine:'../x',clearTrackId:'flight'}).clearTrackId,'clear');
});

test('individual preview persistence writes only its own key and rejects collection or unlisted IDs',()=>{
  const raw=JSON.stringify({musicSet:'proposals',bgm:false,volume:37}),data=new Map([[FEEDBACK_SETTINGS_KEY,raw]]),writes=[];
  const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>{writes.push(key);data.set(key,value);}},catalog={previewIds:['flight','rock','clear-advance','afterburner','comparison']};
  assert.deepEqual(loadMusicPreviewSettings(storage),{trackId:null});assert.deepEqual(writes,[]);
  assert.equal(saveMusicPreviewSettings(storage,{trackId:'flight'},catalog),true);assert.deepEqual(loadMusicPreviewSettings(storage),{trackId:'flight'});
  assert.equal(data.get(FEEDBACK_SETTINGS_KEY),raw);assert.deepEqual(writes,[MUSIC_PREVIEW_SETTINGS_KEY]);
  for(const trackId of ['all','current','proposals','../x.mid','__proto__'])assert.equal(saveMusicPreviewSettings(storage,{trackId},catalog),false);
  assert.deepEqual(writes,[MUSIC_PREVIEW_SETTINGS_KEY]);
  assert.deepEqual(loadMusicPreviewSettings({getItem:()=>'{broken'}),{trackId:null});
  assert.equal(saveMusicPreviewSettings({setItem(){throw Error('denied');}},{trackId:'rock'},catalog),false);
});

test('an explicit feedback save retains the old request and independent sound preferences',()=>{
  let value;const storage={getItem:()=>value,setItem:(_key,next)=>{value=next;}};
  assert.equal(saveFeedbackSettings(storage,{musicSet:'flight2',bgm:false,sfx:false,volume:37,musicEngine:'fm',clearTrackId:'clear-overdrive'}),true);
  const result=loadFeedbackSettings(storage);assert.equal(result.musicSet,'flight2');assert.equal(result.bgm,false);assert.equal(result.sfx,false);assert.equal(result.volume,37);assert.equal(result.musicEngine,'fm');assert.equal(result.clearTrackId,'clear-overdrive');
});
