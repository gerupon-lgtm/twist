import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

// These tests retain the browser's real AudioContext, AudioWorklet, clock and
// production start flow. The wrappers observe native messages, not synth output
// substitutes. Only the two labelled timing/lifecycle cases delay a promise or
// emulate a platform notification; they are not physical-phone acceptance.
async function boot(page,{course='easy',settings={},moduleDelay=0,resumeGate=false,iphone=false}={}){
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(options=>{
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'overlay'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:true,sfx:true,volume:25,bgm:false,vario:false,vibration:true,...options.settings}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
    window.countdownNative={posts:[],received:[],contexts:[],vibrations:[],released:!options.resumeGate,resumeWaiters:[]};
    const state=countdownNative;
    Object.defineProperty(navigator,'vibrate',{value:pattern=>{state.vibrations.push({pattern,at:performance.now()});return true;},configurable:true});
    if(options.iphone){
      Object.defineProperty(navigator,'userAgent',{get:()=> 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',configurable:true});
      state.orientation='portrait-primary';Object.defineProperty(screen.orientation,'type',{get:()=>state.orientation,configurable:true});
    }
    const NativeAudio=window.AudioContext;
    window.AudioContext=class extends NativeAudio{
      constructor(...args){
        super(...args);state.contexts.push(this);
        if(options.moduleDelay){const add=this.audioWorklet.addModule.bind(this.audioWorklet);this.audioWorklet.addModule=async(...values)=>{await add(...values);await new Promise(resolve=>setTimeout(resolve,options.moduleDelay));};}
      }
      resume(){if(state.released)return super.resume();return new Promise((resolve,reject)=>state.resumeWaiters.push(()=>super.resume().then(resolve,reject)));}
    };
    state.release=()=>{state.released=true;for(const resume of state.resumeWaiters.splice(0))resume();};
    const NativeNode=window.AudioWorkletNode;
    window.AudioWorkletNode=class extends NativeNode{
      constructor(...args){
        super(...args);const send=this.port.postMessage.bind(this.port);
        this.port.postMessage=(message,...rest)=>{
          if(['countdownBegin','countdownCancel','countdownTone','state','stop','musicReg','event'].includes(message.type))state.posts.push({type:message.type,session:message.session,cue:message.cue,launched:message.launched,at:performance.now(),audioTime:state.contexts[0]?.currentTime,phase:document.getElementById('app')?.dataset.phase});
          return send(message,...rest);
        };
        this.port.addEventListener('message',({data})=>{if(data.countdown||data.type==='metrics')state.received.push({at:performance.now(),...data});});
      }
    };
  },{settings,moduleDelay,resumeGate,iphone});
  await page.goto('/?course='+course);await step(page,'title');
  expect(await page.evaluate(()=>countdownNative.contexts.length)).toBe(0);
  await page.locator('#start-flow-start').click();await step(page,'courses');
  await page.locator('#start-flow-course-start').click();await step(page,'pose');
  expect(await page.evaluate(()=>countdownNative.contexts.length)).toBe(0);
  expect(await soundingVibrations(page)).toBe(0);
  return errors;
}
const step=(page,value)=>expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step',value);
const audio=page=>page.locator('#feedback-diagnostics').evaluate(el=>JSON.parse(el.dataset.audio??'null'));
const history=page=>page.evaluate(()=>countdownNative.received.findLast(row=>row.countdown)?.countdown.history??[]);
const cues=async page=>(await history(page)).map(row=>row.cue);
const soundingVibrations=page=>page.evaluate(()=>countdownNative.vibrations.filter(({pattern})=>Array.isArray(pattern)?pattern.some(value=>value>0):pattern>0).length);
async function evidence(page,name,errors){
  const result=await page.evaluate(()=>({posts:countdownNative.posts,received:countdownNative.received,vibrations:countdownNative.vibrations,contexts:countdownNative.contexts.map(context=>({state:context.state,time:context.currentTime})),phase:document.getElementById('app').dataset.phase,startup:JSON.parse(document.getElementById('app').dataset.startup??'null')}));
  await writeFile('.cache/v0137-countdown-'+name+'.json',JSON.stringify({...result,audio:await audio(page),errors},null,2));
  expect(errors).toEqual([]);
}
async function holdAtThree(page){
  await page.locator('#start-flow-hold').click();await step(page,'countdown');
  await expect(page.locator('#start-flow-countdown')).toHaveText('3');
}

test('delayed first cue waits for native sound preparation and a silent settling period before 3',async({page})=>{
  test.setTimeout(20000);const errors=await boot(page,{moduleDelay:700});
  await holdAtThree(page);await expect.poll(()=>cues(page)).toEqual([3]);
  const prepared=(await audio(page)).countdown.preparation;expect(prepared.ready).toBe(true);
  const posts=await page.evaluate(()=>countdownNative.posts);
  const begin=posts.find(row=>row.type==='countdownBegin'),first=posts.find(row=>row.type==='countdownTone'&&row.cue===3);
  expect(begin).toBeTruthy();expect(first.at-begin.at).toBeGreaterThanOrEqual(480);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:6000});
  await expect.poll(()=>cues(page)).toEqual([3,2,1,'go']);
  await page.locator('#pause-button').click();await evidence(page,'delayed-first-cue-v33',errors);
});

for(const course of ['easy','supersonic'])test(`native ${course} countdown plays 3/2/1 together with the display and GO only at actual launch`,async({page},testInfo)=>{
  test.setTimeout(20000);
  const evidenceId=course+'-native-'+Date.now()+'-r'+testInfo.repeatEachIndex;
  // Delay the first real module load enough to cover unlock -> halt -> prepare.
  const errors=await boot(page,{course,moduleDelay:80});await holdAtThree(page);
  try{
  await expect.poll(()=>cues(page)).toEqual([3]);
  const before=await audio(page);expect(before.contextState).toBe('running');expect(before.musicActive).toBe(false);
  expect(await soundingVibrations(page)).toBe(0);
  const preflight=await page.locator('#app').evaluate(el=>({phase:el.dataset.phase,session:JSON.parse(el.dataset.session)}));
  expect(preflight.phase).toBe('ready');expect(preflight.session.elapsedSeconds).toBe(0);
  await expect(page.locator('#start-flow-countdown')).toHaveText('2');await expect.poll(()=>cues(page)).toEqual([3,2]);
  await expect.poll(async()=>(await audio(page))?.peak??0).toBeGreaterThan(0);
  expect((await audio(page)).musicActive).toBe(false);expect(await soundingVibrations(page)).toBe(0);
  await expect(page.locator('#start-flow-countdown')).toHaveText('1');await expect.poll(()=>cues(page)).toEqual([3,2,1]);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await expect.poll(()=>cues(page)).toEqual([3,2,1,'go']);
  const rows=await history(page);expect(rows.map(row=>row.hz)).toEqual([880,880,880,1760]);expect(new Set(rows.map(row=>row.session)).size).toBe(1);
  expect(rows[1].at-rows[0].at).toBeGreaterThan(.8);expect(rows[2].at-rows[1].at).toBeGreaterThan(.8);
  const go=await page.evaluate(()=>countdownNative.posts.filter(row=>row.type==='countdownTone'&&row.cue==='go'));
  expect(go).toHaveLength(1);expect(go[0]).toMatchObject({launched:true,phase:'running'});
  const prepared=(await audio(page)).countdown.preparation;expect(prepared.ready).toBe(true);expect(prepared.waitMilliseconds).toBeGreaterThan(0);
  console.log(JSON.stringify({course,evidenceId,countdownPreparation:prepared}));
  await page.locator('#pause-button').click();await step(page,'pause');await page.locator('#start-flow-resume').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await page.waitForTimeout(250);expect(await cues(page)).toEqual([3,2,1,'go']);
  await page.locator('#pause-button').click();await evidence(page,evidenceId,errors);
  }finally{await evidence(page,evidenceId+'-diagnostic',errors);}
});

test('native GO lasts 1.5 seconds while flying and BGM follows its actual audio-bus end',async({page})=>{
  test.setTimeout(20000);const errors=await boot(page,{settings:{bgm:true}}),id='go-tail-native-'+Date.now();
  try{
    await holdAtThree(page);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
    await expect.poll(()=>cues(page)).toEqual([3,2,1,'go']);
    const go=(await history(page)).at(-1),before=await page.locator('#app').evaluate(el=>({position:JSON.parse(el.dataset.position),session:JSON.parse(el.dataset.session)}));
    await expect.poll(()=>page.evaluate(at=>{
      const latest=countdownNative.received.findLast(row=>row.countdown)?.countdown;
      return latest?.active&&latest.cue==='go'&&countdownNative.contexts[0].currentTime-at>=1.05;
    },go.at),{timeout:2500,intervals:[16]}).toBe(true);
    const during=await page.evaluate(()=>({music:countdownNative.posts.filter(row=>row.type==='musicReg'),phase:document.getElementById('app').dataset.phase,
      position:JSON.parse(document.getElementById('app').dataset.position),session:JSON.parse(document.getElementById('app').dataset.session)}));
    expect(during.phase).toBe('running');expect(during.music).toEqual([]);
    expect(Math.hypot(during.position.x-before.position.x,during.position.y-before.position.y,during.position.z-before.position.z)).toBeGreaterThan(4);
    expect(during.session.elapsedSeconds).toBeGreaterThan(before.session.elapsedSeconds+.7);
    await expect.poll(()=>page.evaluate(()=>countdownNative.received.some(row=>row.countdown?.reason==='finished'&&row.countdown.history.at(-1)?.cue==='go')),{timeout:2500,intervals:[16]}).toBe(true);
    await expect.poll(()=>page.evaluate(()=>countdownNative.posts.filter(row=>row.type==='musicReg').length),{timeout:4000,intervals:[16]}).toBeGreaterThan(0);
    const result=await page.evaluate(()=>({end:countdownNative.received.find(row=>row.countdown?.reason==='finished'&&row.countdown.history.at(-1)?.cue==='go'),
      firstMusic:countdownNative.posts.find(row=>row.type==='musicReg'),contexts:countdownNative.contexts.length}));
    expect(result.end.countdown.atSeconds-go.at).toBeGreaterThanOrEqual(1.5);
    expect(result.firstMusic.audioTime).toBeGreaterThanOrEqual(result.end.countdown.atSeconds);
    expect(result.firstMusic.at).toBeGreaterThanOrEqual(result.end.at);expect(result.contexts).toBe(1);
    await expect.poll(async()=>(await audio(page))?.musicActive??false,{timeout:4000}).toBe(true);
    await page.locator('#pause-button').click();await evidence(page,id,errors);
  }finally{await evidence(page,id+'-diagnostic',errors);}
});

test('native pause during GO cancels its pending BGM and the old completion cannot resume it',async({page})=>{
  test.setTimeout(16000);const errors=await boot(page,{settings:{bgm:true}}),id='go-pause-native-'+Date.now();
  try{
    await holdAtThree(page);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await expect.poll(()=>cues(page)).toEqual([3,2,1,'go']);
    await page.locator('#pause-button').click();await step(page,'pause');await page.waitForTimeout(1800);
    expect(await page.evaluate(()=>countdownNative.posts.filter(row=>row.type==='musicReg'))).toEqual([]);
    expect((await audio(page)).contextState).toBe('suspended');await evidence(page,id,errors);
  }finally{await evidence(page,id+'-diagnostic',errors);}
});

test('native SFX-off launches BGM without the silent 1.5 second GO tail',async({page})=>{
  test.setTimeout(16000);const errors=await boot(page,{settings:{bgm:true,sfx:false}}),id='silent-go-music-native-'+Date.now();
  try{
    await holdAtThree(page);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
    await expect.poll(()=>page.evaluate(()=>countdownNative.posts.some(row=>row.type==='musicReg')),{timeout:1000,intervals:[16]}).toBe(true);
    expect(await cues(page)).toEqual([]);expect(await page.evaluate(()=>countdownNative.contexts.length)).toBe(1);
    await page.locator('#pause-button').click();await evidence(page,id,errors);
  }finally{await evidence(page,id+'-diagnostic',errors);}
});

test('native cancel and pose settings discard the old session, while a deliberate fresh start gets four new cues',async({page})=>{
  test.setTimeout(20000);const errors=await boot(page);await holdAtThree(page);await expect.poll(()=>cues(page)).toEqual([3]);
  await page.locator('#start-flow-countdown-cancel').click();await step(page,'pose');
  await page.locator('#start-flow-pose-settings').click();await step(page,'settings');await page.waitForTimeout(3200);
  expect(await cues(page)).toEqual([3]);expect((await audio(page)).contextState).toBe('suspended');
  await page.locator('#start-flow-settings-close').click();await step(page,'pose');await holdAtThree(page);
  await evidence(page,'cancel-settings-second-three-native',errors);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:6000});
  try{await expect.poll(()=>cues(page)).toEqual([3,3,2,1,'go']);}
  finally{await evidence(page,'cancel-settings-native-diagnostic',errors);}
  const rows=await history(page);expect(rows[0].session).not.toBe(rows[1].session);
  await page.locator('#pause-button').click();await evidence(page,'cancel-settings-native',errors);
});

for(const cause of ['hidden','rotation'])test(`native countdown consumes its old session after ${cause} and never launches itself later`,async({page})=>{
  test.setTimeout(15000);const errors=await boot(page,{iphone:cause==='rotation'});await holdAtThree(page);await expect.poll(()=>cues(page)).toEqual([3]);
  await page.evaluate(reason=>{
    if(reason==='hidden'){Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));}
    else{countdownNative.orientation='landscape-primary';window.dispatchEvent(new Event('orientationchange'));}
  },cause);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
  await page.waitForTimeout(3200);expect(await cues(page)).toEqual([3]);expect((await audio(page)).contextState).toBe('suspended');
  await page.evaluate(reason=>{if(reason==='hidden'){Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));}else{countdownNative.orientation='portrait-primary';window.dispatchEvent(new Event('orientationchange'));}},cause);
  await page.waitForTimeout(250);expect(await cues(page)).toEqual([3]);await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
  await evidence(page,cause+'-native-lifecycle',errors);
});

for(const [name,settings] of [['sound-off',{sound:false}],['sfx-off',{sfx:false}],['volume-zero',{volume:0}]])test(`native ${name} consumes countdown cues and enabling it after launch cannot replay them`,async({page})=>{
  test.setTimeout(15000);const errors=await boot(page,{settings});await holdAtThree(page);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:6000});expect(await cues(page)).toEqual([]);
  expect(await page.evaluate(()=>countdownNative.posts.filter(row=>row.type==='countdownTone').length)).toBe(0);
  await page.locator('#pause-button').click();await step(page,'pause');await page.locator('#start-flow-pause-settings').click();await step(page,'settings');
  const summary=page.getByText('③ 音と振動',{exact:true});if(!await summary.evaluate(el=>el.parentElement.open))await summary.click();
  if(name==='sound-off')await page.locator('#feedback-sound').check();else if(name==='sfx-off')await page.locator('#feedback-sfx').check();else await page.locator('#feedback-volume').press('End');
  await page.locator('#start-flow-settings-close').click();await page.locator('#start-flow-resume').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  await page.waitForTimeout(350);expect(await cues(page)).toEqual([]);
  await page.locator('#pause-button').click();await evidence(page,name+'-native',errors);
});

test('a native resume that outlasts preparation cannot deliver old beats after cancel, then a new gesture can start normally',async({page})=>{
  test.setTimeout(18000);const errors=await boot(page,{resumeGate:true});const heldAt=await page.evaluate(()=>performance.now());
  try{
  await holdAtThree(page);
  await expect.poll(async()=>Boolean((await audio(page))?.countdown?.preparation)).toBe(true);
  await step(page,'countdown');
  const prepared=(await audio(page)).countdown.preparation;
  expect(prepared.ready).toBe(false);expect(prepared.waitMilliseconds).toBeGreaterThanOrEqual(1490);expect(await cues(page)).toEqual([]);
  console.log(JSON.stringify({delayedNativePreparation:prepared,displayedAt:await page.evaluate(()=>performance.now())-heldAt}));
  await page.locator('#start-flow-countdown-cancel').click();await step(page,'pose');await page.evaluate(()=>countdownNative.release());
  await expect.poll(async()=>(await audio(page))?.workletReady).toBe(true);await expect.poll(async()=>(await audio(page))?.contextState).toBe('suspended');
  await page.waitForTimeout(3200);expect(await cues(page)).toEqual([]);
  await holdAtThree(page);await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:6000});await expect.poll(()=>cues(page)).toEqual([3,2,1,'go']);
  await page.locator('#pause-button').click();await evidence(page,'late-native-resume',errors);
  }finally{await evidence(page,'late-native-resume-final-diagnostic',errors);}
});
