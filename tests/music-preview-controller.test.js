import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createMusicCatalog} from '../src/music/catalog.js';
import {FEEDBACK_SETTINGS_KEY,MUSIC_PREVIEW_SETTINGS_KEY} from '../src/feedback/settings.js';

// Public controller/DOM interaction with audio and range I/O replaced. Native
// permission, real samples and context counts are covered by browser cases.
const controllerUrl=new URL('../src/feedback/controller.js',import.meta.url);
let source=await readFile(controllerUrl,'utf8');
for(const name of ['createGameAudio','createMusicPlayer','createRangeEditor'])source=source.replace(new RegExp('^import[^\\n]*\\b'+name+'\\b[^\\n]*$','m'),`const ${name}=(...args)=>globalThis.__feedbackUnit.${name}(...args);`);
source=source.replace(/from\s+(['"])(\.[^'"]+)\1/g,(_all,_quote,relative)=>`from '${new URL(relative,controllerUrl).href}'`);
const {createFeedbackController}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8')),catalog=createMusicCatalog(config);
const settle=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
const camel=name=>name.replace(/-([a-z])/g,(_m,letter)=>letter.toUpperCase());
class Target{
  constructor(){this.listeners={};}
  addEventListener(name,callback){(this.listeners[name]??=[]).push(callback);}
  emit(name){for(const callback of this.listeners[name]??[])callback({type:name,target:this});}
}
class Element extends Target{
  constructor(tag,map){super();this.tagName=tag.toUpperCase();this.map=map;this.children=[];this.dataset={};this.attributes={};this.type=tag==='select'?'select-one':'';this.value='';this.hidden=false;this.open=false;this.textContent='';}
  set id(value){this.name=value;if(value)this.map.set(value,this);}get id(){return this.name;}
  append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
  add(node){this.append(node);}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  after(node){const siblings=this.parentElement.children;node.parentElement=this.parentElement;siblings.splice(siblings.indexOf(this)+1,0,node);}
  setAttribute(name,value){this.attributes[name]=String(value);}
  closest(selector){for(let node=this;node;node=node.parentElement)if(node.tagName.toLowerCase()===selector)return node;return null;}
  querySelector(selector){
    const matches=node=>selector.startsWith('[')?(()=>{const [,key,value]=/^\[data-([^=]+)="([^"]+)"\]$/.exec(selector)??[];return key&&node.dataset[camel(key)]===value;})():node.tagName.toLowerCase()===selector;
    for(const child of this.children){if(matches(child))return child;const found=child.querySelector(selector);if(found)return found;}return null;
  }
}
function environment({query='brave',musicSet='proposals',unlockGate=null,closeGate=null,catalogGate=null,allowGameSelection=false,savedSettings=true,feedbackSettings={},storedPreview=null,goEnd=null,countdownReady=true}={}){
  const globals=['document','window','localStorage','navigator','location','history','Option','__feedbackUnit'],saved=new Map(globals.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  const map=new Map(),document=new Target();document.hidden=false;document.createElement=tag=>new Element(tag,map);document.getElementById=id=>map.get(id)??null;
  for(const id of ['feedback-settings-fields','vibration-support','feedback-save-status','feedback-diagnostics','feedback-audio-status','flight-adjustments','home-link']){const e=document.createElement(id==='flight-adjustments'?'details':'div');e.id=id;}
  map.get('flight-adjustments').open=true;map.get('home-link').href='https://example.test/?music=proposals';
  const raw=JSON.stringify({musicSet,bgm:false,sfx:false,sound:true,volume:37,bgmVolume:35,...feedbackSettings}),storageData=new Map(savedSettings?[[FEEDBACK_SETTINGS_KEY,raw]]:[]),writes=[],vibrations=[],plays=[],audios=[],players=[];
  if(storedPreview!==null)storageData.set(MUSIC_PREVIEW_SETTINGS_KEY,JSON.stringify({trackId:storedPreview}));
  const storage={getItem:key=>storageData.get(key)??null,setItem:(key,value)=>{writes.push({key,value});storageData.set(key,value);}};
  const unit={createRangeEditor:()=>({sync(){}}),createGameAudio:()=>{
    const audio={state:'none',ready:false,unlocks:0,resumes:0,configure(){},start(){this.state='running';},stop(){if(this.state!=='none')this.state='suspended';},musicReady(){return this.ready;},
      intro:[],introSession:null,warmBriefing(){this.ready=true;this.state='suspended';},beginBriefing(session){this.introSession=session;this.ready=true;this.state='running';return Promise.resolve(true);},briefingReady(session){return this.introSession===session&&this.ready;},
      briefingCue(session,cue){this.intro.push({session,...cue});return true;},finishBriefing(){},cancelBriefing(session){if(this.introSession===session){this.introSession=null;this.state='suspended';}},
      prepareCountdown:session=>({session,ready:countdownReady}),countdownTone:(_session,_cue,value)=>Boolean(countdownReady&&value.sound&&value.sfx&&value.volume>0),cancelCountdown(){},waitForCountdownEnd:()=>goEnd??Promise.resolve({reason:'finished'}),
      unlock(){this.unlocks++;this.ready=true;this.state='running';return unlockGate??Promise.resolve();},resume(){this.resumes++;this.state='running';return Promise.resolve();},dispose(){return (closeGate??Promise.resolve()).then(()=>{this.state='closed';});},snapshot(){return {contextState:this.state,workletReady:this.ready};},resetMetrics(){}};audios.push(audio);return audio;
  },createMusicPlayer:audio=>{
    let settings={},playing=false,last=null;const player={loadCatalog:async()=>{if(catalogGate)await catalogGate;return catalog;},preload:async()=>catalog,warmup:async()=>catalog,setSettings:value=>{settings={...value};},setFlightNumber(){},setAfterburner(){},
      play:async id=>{plays.push({id,logical:true,settings:{...settings}});return 'played';},playTrack:async(id,options)=>{playing=true;last=id;plays.push({id,options,settings:{...settings},audio});return 'played';},stop(){playing=false;},reset(){},
      finish(){playing=false;audio.state='suspended';},snapshot:()=>({status:playing?'playing':'ready',playing,track:last?catalog.byId[last].title:null,trackId:last,playedTracks:[],flightNumber:1,current:playing?'preview':null})};players.push(player);return player;
  }};
  const values={document,window:new Target(),localStorage:storage,navigator:{userAgent:'unit desktop',vibrate:pattern=>vibrations.push(pattern)},location:{href:'https://example.test/'+(query===null?'':'?music='+query)},history:{replaceState(_state,_title,url){if(!allowGameSelection)throw Error('Loading/preview must not change URL');values.location.href=String(url);}},Option:class extends Element{constructor(text,value){super('option',map);this.textContent=text;this.value=value;}},__feedbackUnit:unit};
  for(const [key,value]of Object.entries(values))Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  const controller=createFeedbackController();
  return {controller,map,writes,plays,audios,players,raw,storageData,vibrations,document,window:values.window,cleanup(){controller.stop();for(const [key,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}};
}

test('exploration with remembered wrist keeps the real pitch and body-steering jitter without a wrist reading',async()=>{
  const f=environment({query:null,feedbackSettings:{bgm:false,sfx:false,vibration:false}});try{
    await settle();f.audios[0].update=()=>{};
    const state={mode:'explore',speed:10,throttle:.5,groundClearance:100,verticalSpeed:0,angleOfAttack:0,afterburner:{active:false}};
    for(const staleWrist of [undefined,90]){
      f.controller.reset();f.controller.start();
      for(const [now,pitch,steer]of [[0,2,-5],[500,5,9],[1000,8,10]])f.controller.update(state,{pitch,steer,twist:120,...(staleWrist===undefined?{}:{wrist:staleWrist})},'sensor','wrist',now);
      const jitter=f.controller.report().sensorJitter;
      assert.equal(jitter.windows,1);assert.ok(Math.abs(jitter.window.pitch-6)<1e-9);assert.ok(Math.abs(jitter.window.steer-15)<1e-9);
      assert.ok(Math.abs(jitter.maxPitchRange-6)<1e-9);assert.ok(Math.abs(jitter.maxSteerRange-15)<1e-9);
    }
  }finally{f.cleanup();}
});

test('normal and Sonic flights record the selected wrist angle rather than legacy decoy axes',async()=>{
  const f=environment({query:null,feedbackSettings:{bgm:false,sfx:false,vibration:false}});try{
    await settle();f.audios[0].update=()=>{};
    for(const sonic of [false,true]){
      f.controller.reset();f.controller.start();
      const state={mode:'flight',speed:sonic?200:10,throttle:.5,groundClearance:100,verticalSpeed:0,angleOfAttack:0,afterburner:{active:false},...(sonic?{supersonic:{attemptId:1,mach:200/340,events:[]}}:{})};
      for(const [now,pitch,wrist,steer,twist]of [[0,2,-10,-120,110],[500,5,0,120,-110],[1000,8,15,0,0]])f.controller.update(state,{pitch,wrist,steer,twist},'sensor','wrist',now);
      const jitter=f.controller.report().sensorJitter;
      assert.equal(jitter.windows,1);assert.ok(Math.abs(jitter.window.pitch-6)<1e-9);assert.ok(Math.abs(jitter.window.steer-25)<1e-9);assert.ok(Math.abs(jitter.maxSteerRange-25)<1e-9);
    }
  }finally{f.cleanup();}
});

test('sixteen exact preview options and a preview-only URL leave the saved game request and audio untouched',async()=>{
  const f=environment();try{
    await settle();const select=f.map.get('music-preview-track');assert.ok(select,'Separate individual preview selector is missing');
    assert.deepEqual(select.children.map(option=>option.value),catalog.previewIds);assert.equal(select.value,'brave');
    assert.equal(f.controller.report().settings.musicSet,'proposals');assert.equal(f.audios[0].unlocks,0);assert.equal(f.plays.length,0);assert.deepEqual(f.writes,[]);
    select.value='clear-advance';select.emit('input');await settle();
    assert.equal(f.storageData.get(FEEDBACK_SETTINGS_KEY),f.raw);assert.deepEqual(f.writes.map(row=>row.key),[MUSIC_PREVIEW_SETTINGS_KEY]);assert.equal(f.vibrations.length,0);assert.equal(f.plays.length,0);
  }finally{f.cleanup();}
});

test('fresh audio defaults select Ignition and the individual Overdrive clear preview without saving',async()=>{
  const f=environment({query:null,savedSettings:false});try{
    await settle();const settings=f.controller.report().settings;
    assert.equal(settings.musicSet,'ignition');assert.equal(settings.musicEngine,'scc');assert.equal(settings.clearTrackId,'clear');
    assert.equal(settings.abMusic,true);assert.equal(settings.passbySound,true);
    assert.equal(f.map.get('music-preview-track').value,'clear-overdrive');assert.deepEqual(f.writes,[]);assert.equal(f.plays.length,0);
  }finally{f.cleanup();}
});
test('map cues use the main audio owner without music, haptics or saved-setting writes',async()=>{
  const f=environment({query:null,feedbackSettings:{sfx:true,bgm:false}});try{
    await settle();f.controller.briefingAudio({type:'arm'});
    const open={type:'open',session:1,origin:'start',courseId:'fixture',visibleSeconds:0,progress:0,drawSeconds:3.6,reducedMotion:false,visible:true,
      points:[{id:'tgt-1',kind:'target',progress:.5},{id:'exit',kind:'exit',progress:1}]};
    f.controller.briefingAudio(open);f.controller.briefingAudio({...open,type:'progress',visibleSeconds:1.8,progress:.5});
    f.controller.briefingAudio({...open,type:'progress',visibleSeconds:3.6,progress:1});
    assert.deepEqual(f.audios[0].intro.map(cue=>cue.kind),['opening','point','complete']);assert.equal(f.audios.length,1);
    assert.deepEqual(f.plays,[]);assert.deepEqual(f.writes,[]);assert.deepEqual(f.vibrations,[]);
    f.controller.briefingAudio({...open,type:'close'});
  }finally{f.cleanup();}
});
test('a setting input cancels the current map and re-enabling SFX cannot replay its next point',async()=>{
  const f=environment({query:null,feedbackSettings:{sfx:true,bgm:true}});try{
    await settle();const open={type:'open',session:1,origin:'start',courseId:'fixture',visibleSeconds:0,progress:0,drawSeconds:3.6,reducedMotion:false,visible:true,
      points:[{id:'tgt-1',kind:'target',progress:.5},{id:'exit',kind:'exit',progress:1}]};
    f.controller.briefingAudio(open);const input=f.map.get('feedback-sfx');input.checked=false;input.emit('input');input.checked=true;input.emit('input');
    f.controller.briefingAudio({...open,type:'progress',visibleSeconds:1.8,progress:.5});assert.equal(f.audios[0].intro.length,1);assert.equal(f.audios[0].introSession,null);assert.deepEqual(f.plays,[]);
  }finally{f.cleanup();}
});

test('valid URL and saved preview or legacy song choices take precedence over the fresh preview fallback',async()=>{
  for(const entry of [
    {query:'brave',storedPreview:'clear-advance',musicSet:'steel',preview:'brave',flight:'steel'},
    {query:'rock',storedPreview:'clear-advance',musicSet:'steel',preview:'rock',flight:'rock'},
    {query:null,storedPreview:'clear-advance',musicSet:'brave',preview:'clear-advance',flight:'brave'},
    {query:null,storedPreview:'not-a-track',musicSet:'flight2',preview:'flight2',flight:'flight2'},
    {query:null,storedPreview:null,musicSet:'not-a-track',preview:'clear-overdrive',flight:'ignition'},
  ]){
    const f=environment(entry);try{
      await settle();assert.equal(f.map.get('music-preview-track').value,entry.preview,JSON.stringify(entry));
      assert.equal(f.controller.report().settings.musicSet,entry.flight);assert.deepEqual(f.writes,[]);
      assert.equal(f.storageData.get(FEEDBACK_SETTINGS_KEY),f.raw);
    }finally{f.cleanup();}
  }
});

test('fresh flight starts immediately while BGM waits for the actual GO completion',async()=>{
  const end=deferred(),f=environment({query:null,feedbackSettings:{sfx:true,bgm:true},goEnd:end.promise});try{
    await settle();await f.controller.countdownAudio({type:'prepare',session:1});f.controller.start({flightNumber:1});
    assert.equal(f.audios[0].state,'running');assert.equal(f.plays.length,0,'GO has not yet reached its audio bus');
    f.controller.countdownAudio({type:'go',session:1});await settle();assert.equal(f.plays.length,0,'GO is still audible');
    end.resolve({reason:'finished'});await settle();assert.equal(f.plays.length,1);assert.equal(f.plays[0].id,'flight');
    assert.equal(f.plays[0].settings.musicSet,'proposals');
  }finally{end.resolve();f.cleanup();}
});

test('muted SFX and unavailable countdowns do not add a GO-tail delay to BGM',async()=>{
  for(const config of [{feedbackSettings:{sfx:false,bgm:true}},{countdownReady:false,feedbackSettings:{sfx:true,bgm:true}}]){
    const end=deferred(),f=environment({query:null,...config,goEnd:end.promise});try{
      await settle();await f.controller.countdownAudio({type:'prepare',session:1});f.controller.start();f.controller.countdownAudio({type:'go',session:1});
      await settle();assert.equal(f.plays.length,1,'No audible GO means no tail to await');
    }finally{end.resolve();f.cleanup();}
  }
});

test('stop, hidden and sound/BGM-off cancel pending GO music without a stale restart',async()=>{
  for(const cause of ['stop','hidden','sound','bgm']){
    const end=deferred(),f=environment({query:null,feedbackSettings:{sfx:true,bgm:true},goEnd:end.promise});try{
      await settle();await f.controller.countdownAudio({type:'prepare',session:1});f.controller.start();f.controller.countdownAudio({type:'go',session:1});
      if(cause==='stop')f.controller.stop();else if(cause==='hidden'){f.document.hidden=true;f.document.emit('visibilitychange');}
      else {const input=f.map.get('feedback-'+cause);input.checked=false;input.emit('input');}
      end.resolve({reason:'finished'});await settle();assert.equal(f.plays.length,0,cause);
    }finally{end.resolve();f.cleanup();}
  }
});

test('engine, song and late URL catalog changes keep only the latest BGM request behind GO',async()=>{
  const end=deferred(),library=deferred(),f=environment({query:'rock',catalogGate:library.promise,feedbackSettings:{sfx:true,bgm:true},goEnd:end.promise,allowGameSelection:true});try{
    await f.controller.countdownAudio({type:'prepare',session:1});f.controller.start();f.controller.countdownAudio({type:'go',session:1});
    library.resolve();await settle();assert.equal(f.plays.length,0,'Late query resolution must obey the same cue barrier');
    const engine=f.map.get('feedback-musicEngine');engine.value='fm';engine.emit('input');
    const song=f.map.get('feedback-musicSet');song.value='advance';song.emit('input');await settle();assert.equal(f.plays.length,0);
    end.resolve({reason:'finished'});await settle();assert.equal(f.plays.length,1);assert.equal(f.plays[0].settings.musicEngine,'fm');assert.equal(f.plays[0].settings.musicSet,'advance');
  }finally{end.resolve();library.resolve();f.cleanup();}
});

test('late catalog completion cannot replace a game song explicitly selected after opening a URL',async()=>{
  let release;const catalogGate=new Promise(resolve=>{release=resolve;});
  const f=environment({query:'rock',catalogGate,allowGameSelection:true});
  try{
    const select=f.map.get('feedback-musicSet');select.value='advance';select.emit('input');
    release();await settle();
    assert.equal(f.controller.report().settings.musicSet,'advance');
    assert.equal(new URL(location.href).searchParams.get('music'),'advance');
    assert.equal(JSON.parse(f.storageData.get(FEEDBACK_SETTINGS_KEY)).musicSet,'advance');
    assert.equal(f.plays.length,0);
  }finally{release();f.cleanup();}
});

test('explicit preview uses BGM permission and independent selection, engine restart and natural finish',async()=>{
  const f=environment();try{
    await settle();const selected=f.map.get('music-preview-track'),mainBefore=f.controller.report().music;
    f.map.get('music-preview-start').emit('click');await settle();assert.equal(f.plays.length,1);
    assert.equal(f.plays[0].id,'brave');assert.deepEqual(f.plays[0].options,{purpose:'preview'});assert.equal(f.plays[0].settings.bgm,true);assert.equal(f.plays[0].settings.sfx,false);assert.equal(f.plays[0].settings.bgmVolume,35);
    selected.value='clear-advance';selected.emit('input');await settle();assert.equal(f.plays.at(-1).id,'clear-advance');
    const engine=f.map.get('feedback-musicEngine');engine.value='fm';engine.emit('input');await settle();assert.equal(f.plays.at(-1).id,'clear-advance');assert.equal(f.plays.at(-1).settings.musicEngine,'fm');
    assert.deepEqual(f.controller.report().music,mainBefore);assert.equal(f.controller.report().settings.bgm,false);assert.equal(f.controller.report().settings.musicSet,'proposals');
    f.players[1].finish();f.controller.updateDiagnostics();assert.equal(f.map.get('music-preview-stop').disabled,true);assert.match(f.map.get('music-preview-status').textContent,/終わりました/);assert.equal(f.audios[1].state,'suspended');
    const count=f.plays.length;selected.value='comparison';selected.emit('input');await settle();assert.equal(f.plays.length,count,'Changing an ended preview must not autoplay');
    f.map.get('music-preview-start').emit('click');await settle();assert.equal(f.plays.at(-1).id,'comparison');
    f.map.get('feedback-sound').checked=false;f.map.get('feedback-sound').emit('input');await settle();assert.equal(f.audios[1].state,'closed');assert.equal(f.map.get('music-preview-start').disabled,true);
  }finally{f.cleanup();}
});

test('hidden settings invalidate a pending unlock before any exact song is started',async()=>{
  let release;const gate=new Promise(resolve=>{release=resolve;});const f=environment({unlockGate:gate});try{
    await settle();f.map.get('music-preview-start').emit('click');await settle();assert.equal(f.audios.length,2);assert.equal(f.plays.length,0);
    f.document.hidden=true;f.document.emit('visibilitychange');release();await settle();assert.equal(f.plays.length,0);assert.equal(f.audios[1].state,'closed');
    assert.equal(f.storageData.get(FEEDBACK_SETTINGS_KEY),f.raw);
  }finally{f.cleanup();}
});

test('rapid stop, start and song changes wait for the old preview context to close',async()=>{
  let release;const gate=new Promise(resolve=>{release=resolve;});const f=environment({closeGate:gate});try{
    await settle();f.map.get('music-preview-start').emit('click');await settle();assert.equal(f.plays.length,1);
    f.map.get('music-preview-stop').emit('click');f.map.get('music-preview-start').emit('click');
    const selected=f.map.get('music-preview-track');selected.value='overdrive';selected.emit('input');await settle();assert.equal(f.audios.length,2);assert.equal(f.plays.length,1);
    release();await settle();assert.equal(f.audios[1].state,'closed');assert.equal(f.audios.length,3);assert.equal(f.plays.length,2);assert.equal(f.plays.at(-1).id,'overdrive');
    f.map.get('flight-adjustments').open=false;f.map.get('flight-adjustments').emit('toggle');await settle();assert.equal(f.audios[2].state,'closed');
  }finally{release();f.cleanup();}
});
