import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {getCourse} from '../src/course-catalog.js';
import {APP_VERSION} from '../src/version.js';
const evidenceVersion=APP_VERSION.replaceAll('.','');

// Real Context/Worklet/PCM and product flow. Platform notifications in the two
// named lifecycle fixtures are emulated; no physical-phone acceptance is inferred.
const step=(page,value)=>expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step',value);
const map=page=>page.locator('#briefing-panel');
const read=page=>page.evaluate(()=>{const app=document.getElementById('app'),d=app.dataset,diag=document.getElementById('feedback-diagnostics');
  const json=value=>{try{return JSON.parse(value);}catch{return null;}};
  return {phase:d.phase,position:json(d.position),session:json(d.session),audio:json(diag.dataset.audio),music:json(diag.dataset.music)};});
async function boot(page,{course='easy',settings={},rate=48000,moduleDelay=0,reduced=false}={}){
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  if(reduced)await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(options=>{
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'overlay'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'every',seen:[]}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:true,sfx:true,volume:25,bgm:true,vario:false,vibration:true,...options.settings}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
    const probe={contexts:[],posts:[],received:[],vibrations:[]};window.briefingNative=probe;
    Object.defineProperty(navigator,'vibrate',{configurable:true,value:pattern=>{probe.vibrations.push({pattern,at:performance.now()});return true;}});
    const Audio=window.AudioContext;window.AudioContext=class extends Audio{
      constructor(...args){super({...args[0],sampleRate:options.rate});probe.contexts.push(this);
        if(options.moduleDelay){const add=this.audioWorklet.addModule.bind(this.audioWorklet);this.audioWorklet.addModule=async(...values)=>{await add(...values);await new Promise(resolve=>setTimeout(resolve,options.moduleDelay));};}}
    };
    const Node=window.AudioWorkletNode;window.AudioWorkletNode=class extends Node{
      constructor(...args){super(...args);const post=this.port.postMessage.bind(this.port);
        this.port.postMessage=(message,...rest)=>{if(['briefingBegin','briefingTone','briefingCancel','briefingVisualEnd','countdownTone','musicReg','stop'].includes(message.type)){
          const panel=document.getElementById('briefing-panel');probe.posts.push({type:message.type,session:message.session,sequence:message.sequence,kind:message.kind,index:message.index,total:message.total,cue:message.cue,
            at:performance.now(),audioTime:probe.contexts[0]?.currentTime,visibleSeconds:Number(panel?.dataset.progress??0)*3.6,phase:document.getElementById('app')?.dataset.phase});}
          return post(message,...rest);};
        this.port.addEventListener('message',({data})=>{if(data.briefing||data.countdown||data.type==='metrics')probe.received.push({at:performance.now(),...data});});
      }
    };
  },{settings,rate,moduleDelay});
  await page.goto('/?course='+course);await step(page,'title');expect(await page.evaluate(()=>briefingNative.contexts.length)).toBe(0);
  await page.locator('#start-flow-start').click();await step(page,'courses');return errors;
}
const waitWarm=page=>expect.poll(async()=>(await read(page)).audio?.workletReady??false,{timeout:4000,intervals:[16]}).toBe(true);
async function openMap(page){await page.locator('#start-flow-course-start').click();await expect(map(page)).toBeVisible();}
const introHistory=page=>page.evaluate(()=>briefingNative.received.findLast(row=>row.briefing)?.briefing.history??[]);
async function evidence(page,name,errors){await mkdir('.cache',{recursive:true});
  const value=await page.evaluate(()=>({posts:briefingNative.posts,received:briefingNative.received,vibrations:briefingNative.vibrations,
    contexts:briefingNative.contexts.map(context=>({state:context.state,time:context.currentTime,rate:context.sampleRate})),map:{progress:document.getElementById('briefing-panel')?.dataset.progress,complete:document.getElementById('briefing-panel')?.dataset.drawComplete}}));
  await writeFile(`.cache/v${evidenceVersion}-briefing-native-${name}.json`,JSON.stringify({...value,state:await read(page),errors},null,2));expect(errors).toEqual([]);
}
// Compare audio with the actual visible route, whose angled projection now
// includes height. Pure coordinate correctness is tested separately.
async function milestones(page){return page.locator('#briefing-map').evaluate(svg=>{
 const points=[...svg.querySelectorAll('[data-map-point]:not([data-map-point="current"])')].map(node=>{const m=node.transform.baseVal.consolidate().matrix;return {x:m.e,y:m.f};});
 let total=0;const lengths=[0];for(let i=1;i<points.length;i++){total+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);lengths.push(total);}
 return lengths.slice(1).map(value=>value/total*3.6);
});}
const nonzeroVibrations=page=>page.evaluate(()=>briefingNative.vibrations.filter(({pattern})=>Array.isArray(pattern)?pattern.some(value=>value>0):pattern>0).length);

for(const [id,rate]of [['easy',44100],['normal',48000],['hard',48000],['supersonic',48000]])test(`native ready ${id} intro follows its real route with one ${rate}Hz Context and no flight/BGM/haptics`,async({page})=>{
  test.setTimeout(20000);const errors=await boot(page,{course:id,rate}),name=id+'-'+Date.now();
  try{await waitWarm(page);expect(await introHistory(page)).toEqual([]);await openMap(page);const before=await read(page);
    await expect(map(page)).toHaveAttribute('data-draw-complete','true',{timeout:5000});
    await expect.poll(async()=>(await read(page)).audio?.briefing?.acknowledged?.reason,{timeout:2500}).toBe('finished');
    const history=await introHistory(page),count=getCourse(id).lights.length;
    expect(history.map(row=>row.kind)).toEqual(['opening',...Array(count).fill('point'),'complete']);
    expect(history.filter(row=>row.kind==='point').map(row=>row.index)).toEqual(Array.from({length:count},(_,index)=>index));
    const posts=await page.evaluate(()=>briefingNative.posts),dues=await milestones(page);
    expect(posts.filter(row=>row.type==='musicReg')).toEqual([]);
    for(const post of posts.filter(row=>row.type==='briefingTone')){const due=post.kind==='opening'?0:post.kind==='complete'?3.6:dues[post.index];
      expect(post.visibleSeconds-due).toBeGreaterThanOrEqual(-.000001);expect(post.visibleSeconds-due).toBeLessThanOrEqual(.100001);}
    const after=await read(page);expect(after.position).toEqual(before.position);expect(after.session.elapsedSeconds).toBe(0);expect(after.music.playing).toBe(false);
    expect(after.audio.contextState).toBe('suspended');expect(await page.evaluate(()=>briefingNative.contexts.length)).toBe(1);expect(await nonzeroVibrations(page)).toBe(0);
    expect(await page.evaluate(()=>briefingNative.received.filter(row=>row.type==='metrics').some(row=>row.peak>0))).toBe(true);
    await page.waitForTimeout(150);await expect(map(page)).toBeVisible();await expect(page.locator('#briefing-skip')).toHaveText('CONTINUE');
    await page.locator('#briefing-skip').click();await step(page,'pose');await evidence(page,name,errors);
  }finally{await evidence(page,name+'-diagnostic',errors);}
});

for(const [name,settings]of [['sound-off',{sound:false}],['sfx-off',{sfx:false}],['volume-zero',{volume:0}]])test(`native ${name} intro draws normally without constructing audio or delayed cues`,async({page})=>{
  test.setTimeout(15000);const errors=await boot(page,{settings}),id=name+'-'+Date.now();
  try{await openMap(page);await expect(map(page)).toHaveAttribute('data-draw-complete','true',{timeout:5000});
    expect(await introHistory(page)).toEqual([]);expect(await page.evaluate(()=>briefingNative.contexts.length)).toBe(0);expect(await nonzeroVibrations(page)).toBe(0);
    await page.locator('#briefing-skip').click();await step(page,'pose');await evidence(page,id,errors);
  }finally{await evidence(page,id+'-diagnostic',errors);}
});
test('native BGM-off still permits the independently enabled intro SFX',async({page})=>{
  test.setTimeout(15000);const errors=await boot(page,{settings:{bgm:false}}),id='bgm-off-'+Date.now();
  try{await waitWarm(page);await openMap(page);await expect(map(page)).toHaveAttribute('data-draw-complete','true',{timeout:5000});
    await expect.poll(async()=>(await introHistory(page)).at(-1)?.kind).toBe('complete');expect((await introHistory(page)).length).toBe(5);
    expect(await page.evaluate(()=>briefingNative.posts.some(row=>row.type==='musicReg'))).toBe(false);await page.locator('#briefing-skip').click();await evidence(page,id,errors);
  }finally{await evidence(page,id+'-diagnostic',errors);}
});
test('native reduced motion is instantly complete with one static closing cue and no target burst',async({page})=>{
  test.setTimeout(12000);const errors=await boot(page,{reduced:true}),id='reduce-'+Date.now();
  try{await waitWarm(page);await openMap(page);await expect(map(page)).toHaveAttribute('data-progress','1');
    await expect.poll(async()=>(await introHistory(page)).map(row=>row.kind),{timeout:1000,intervals:[16]}).toEqual(['complete']);
    await page.waitForTimeout(500);expect((await introHistory(page)).map(row=>row.kind)).toEqual(['complete']);
    await page.locator('#briefing-skip').click();await step(page,'pose');await evidence(page,id,errors);
  }finally{await evidence(page,id+'-diagnostic',errors);}
});
test('native hidden notification cancels this map audio permanently while the visible route later resumes',async({page})=>{
  test.setTimeout(16000);const errors=await boot(page),id='hidden-'+Date.now();
  try{await waitWarm(page);await openMap(page);await expect.poll(async()=>(await introHistory(page)).length).toBeGreaterThan(0);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
    const at=await map(page).getAttribute('data-progress');await page.waitForTimeout(300);expect(await map(page).getAttribute('data-progress')).toBe(at);
    const accepted=(await introHistory(page)).length;
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
    await expect(map(page)).toHaveAttribute('data-draw-complete','true',{timeout:5000});expect((await introHistory(page)).length).toBe(accepted);
    expect((await read(page)).audio.contextState).toBe('suspended');await page.locator('#briefing-skip').click();await evidence(page,id,errors);
  }finally{await evidence(page,id+'-diagnostic',errors);}
});
test('native late module preparation consumes past targets and never replays the opening',async({page})=>{
  test.setTimeout(16000);const errors=await boot(page,{moduleDelay:700}),id='late-'+Date.now();
  try{await openMap(page);await expect(map(page)).toHaveAttribute('data-draw-complete','true',{timeout:5000});
    await expect.poll(async()=>(await introHistory(page)).at(-1)?.kind,{timeout:2000}).toBe('complete');
    const history=await introHistory(page),posts=await page.evaluate(()=>briefingNative.posts),begin=posts.find(row=>row.type==='briefingBegin'),dues=await milestones(page);
    expect(begin.visibleSeconds).toBeGreaterThan(.1);expect(history.some(row=>row.kind==='opening')).toBe(false);
    for(const post of posts.filter(row=>row.type==='briefingTone')){const due=post.kind==='complete'?3.6:dues[post.index];expect(post.visibleSeconds-due).toBeLessThanOrEqual(.100001);}
    await page.locator('#briefing-skip').click();await evidence(page,id,errors);
  }finally{await evidence(page,id+'-diagnostic',errors);}
});
test('native skip cancels the old intro and preserves one countdown GO plus its delayed BGM',async({page})=>{
  test.setTimeout(22000);const errors=await boot(page),id='skip-to-go-'+Date.now();
  try{await waitWarm(page);await openMap(page);await expect.poll(async()=>(await introHistory(page)).length).toBeGreaterThan(0);
    await page.locator('#briefing-skip').click();await step(page,'pose');const introCount=(await introHistory(page)).length;
    await page.locator('#start-flow-hold').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:7000});
    await expect.poll(()=>page.evaluate(()=>briefingNative.received.findLast(row=>row.countdown)?.countdown.history.map(row=>row.cue)??[])).toEqual([3,2,1,'go']);
    await expect.poll(()=>page.evaluate(()=>briefingNative.posts.some(row=>row.type==='musicReg')),{timeout:4000}).toBe(true);
    const result=await page.evaluate(()=>({go:briefingNative.received.findLast(row=>row.countdown)?.countdown.history.find(row=>row.cue==='go'),music:briefingNative.posts.find(row=>row.type==='musicReg'),contexts:briefingNative.contexts.length}));
    expect(result.music.audioTime-result.go.at).toBeGreaterThanOrEqual(1.5);expect(result.contexts).toBe(1);expect((await introHistory(page)).length).toBe(introCount);
    await page.locator('#pause-button').click();await step(page,'pause');await evidence(page,id,errors);
  }finally{await evidence(page,id+'-diagnostic',errors);}
});
test('native paused MAP is informational and cannot resume intro, BGM or vibration',async({page})=>{
  test.setTimeout(22000);const errors=await boot(page),id='paused-map-'+Date.now();
  try{await waitWarm(page);await openMap(page);await page.locator('#briefing-skip').click();await step(page,'pose');
    await page.locator('#start-flow-hold').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:7000});
    await page.locator('#pause-button').click();await step(page,'pause');const before=await read(page),cues=(await introHistory(page)).length,vibes=await nonzeroVibrations(page);
    const musicPosts=await page.evaluate(()=>briefingNative.posts.filter(row=>row.type==='musicReg').length);
    await page.locator('#start-flow-map').click();await expect(map(page)).toHaveAttribute('data-origin','pause');
    await expect(map(page)).toHaveAttribute('data-draw-complete','true',{timeout:5000});
    expect((await introHistory(page)).length).toBe(cues);expect(await nonzeroVibrations(page)).toBe(vibes);
    expect(await page.evaluate(()=>briefingNative.posts.filter(row=>row.type==='musicReg').length)).toBe(musicPosts);
    // v47 permits the MAP button's short UI click. The static map must then
    // return to idle without restarting intro sounds, music or the flight.
    await expect.poll(async()=>(await read(page)).audio.contextState).toBe('suspended');
    const after=await read(page);expect(after.position).toEqual(before.position);expect(after.session.elapsedSeconds).toBe(before.session.elapsedSeconds);expect(after.audio.contextState).toBe('suspended');
    await page.locator('#briefing-skip').click();await step(page,'pause');await evidence(page,id,errors);
  }finally{await evidence(page,id+'-diagnostic',errors);}
});
