import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {waitForCountdownThree} from './helpers/countdown.js';

// This suite uses the default application flow. No legacy helper or game-state
// override is used; the course is flown through its actual input controls.
const sizes=[{width:390,height:844},{width:360,height:640},{width:844,height:390}];
const step=(page,value)=>expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step',value);
const tick=(page,ms=160)=>page.clock.runFor(ms);
async function read(page){return page.locator('#app').evaluate(app=>{const d=app.dataset,j=key=>JSON.parse(d[key]??'null');return {phase:d.phase,mode:d.playMode,camera:d.camera,input:d.input,position:j('position'),velocity:j('velocity'),pitch:+d.flightPitch,speed:+d.speed,gravity:+d.turnGravity,heading:+d.heading,session:j('session'),segments:j('segments'),startup:j('startup'),briefing:j('briefing'),courseTime:j('courseTime'),ready:d.guidanceReady==='true',direction:j('guidanceDirection')};});}
async function boot(page,{size=sizes[0],query='',tutorialSeen=true,inputMethod='practice',map='off',audio=false}={}){
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(size);await page.clock.install();
  await page.addInitScript(options=>{
    if(!/^https?:$/.test(location.protocol))return;
    if(!localStorage.getItem('twist.start-flow.v1'))localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:options.tutorialSeen,inputMethod:options.inputMethod,camera:'overlay'}));
    if(!localStorage.getItem('twist.briefing.v1'))localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:options.map,seen:[]}));
    if(!localStorage.getItem('twist.flight-settings.v1'))localStorage.setItem('twist.flight-settings.v1',JSON.stringify({maxBank:30,deadzone:4,radarRange:180}));
    if(!localStorage.getItem('twist.feedback-settings.v1'))localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:options.audio,bgm:false,vibration:true}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.flowCopied=JSON.parse(text);}},configurable:true});
    window.flowVibrations=[];Object.defineProperty(navigator,'vibrate',{value:pattern=>{flowVibrations.push(pattern);return true;},configurable:true});
    window.flowPermissionCalls=0;
    class Orientation extends Event{static requestPermission(){window.flowPermissionCalls++;return Promise.resolve('granted');}}
    Object.defineProperty(window,'DeviceOrientationEvent',{value:Orientation,configurable:true});
    window.flowAudioContexts=[];const NativeAudio=window.AudioContext;
    if(NativeAudio)window.AudioContext=class extends NativeAudio{constructor(...args){super(...args);window.flowAudioContexts.push(this);}};
  },{tutorialSeen,inputMethod,map,audio});
  await page.goto('/?'+query);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await tick(page);
  await expect(page.locator('#app')).toHaveAttribute('data-start-flow','on');await step(page,'title');
  return errors;
}
async function startToCourses(page,{first=false}={}){
  await page.locator('#start-flow-start').click();
  if(first){await step(page,'tutorial');await page.locator('#start-flow-tutorial-next').click();await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-slide','1');await page.locator('#start-flow-tutorial-back').click();await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-slide','0');for(let i=0;i<3;i++)await page.locator('#start-flow-tutorial-next').click();}
  await step(page,'courses');
}
async function toPose(page,{map=false,mapWait=0}={}){
  await page.locator('#start-flow-course-start').click();
  if(map){await expect(page.locator('#briefing-panel')).toBeVisible();if(mapWait)await tick(page,mapWait);await page.locator('#briefing-skip').click();}
  await step(page,'pose');
}
async function waitForThree(page){
  const before=await read(page);await expect(page.locator('#start-flow-countdown')).not.toHaveText('3');
  await tick(page,499);await expect(page.locator('#start-flow-countdown')).not.toHaveText('3');
  expect((await read(page)).position).toEqual(before.position);expect((await read(page)).session).toEqual(before.session);
  await tick(page,1);await waitForCountdownThree(page,{maxPrepareMilliseconds:1500});
}
async function launch(page){
  await page.locator('#start-flow-hold').click();await step(page,'countdown');
  const before=await read(page);expect(before.session.elapsedSeconds).toBe(0);
  await waitForThree(page);
  await tick(page,2900);expect((await read(page)).phase).not.toBe('running');expect((await read(page)).session.elapsedSeconds).toBe(0);
  await tick(page,120);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await step(page,'play');
  expect((await read(page)).session.elapsedSeconds).toBeLessThan(.08);
}
async function quickFlight(page,options={}){const errors=await boot(page,options);await startToCourses(page);await toPose(page,{map:options.map==='every'});await launch(page);return errors;}
async function inside(page,selector){const rect=await page.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();return {visible:!e.hidden&&!!e.getClientRects().length,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight};});expect(rect.visible,selector).toBe(true);expect(rect.left,selector).toBeGreaterThanOrEqual(-.5);expect(rect.top,selector).toBeGreaterThanOrEqual(-.5);expect(rect.right,selector).toBeLessThanOrEqual(rect.width+.5);expect(rect.bottom,selector).toBeLessThanOrEqual(rect.height+.5);}
async function noScroll(page){
  const rows=await page.evaluate(()=>[document.documentElement,document.body,document.getElementById('app')].map(e=>({name:e.id||e.tagName,scrollWidth:e.scrollWidth,scrollHeight:e.scrollHeight,width:innerWidth,height:innerHeight})));
  const okay=rows.every(e=>e.scrollWidth<=e.width+1&&e.scrollHeight<=e.height+1);
  if(!okay){const diagnosis=await page.evaluate(()=>{
    const describe=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {id:e.id||e.className,rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,display:s.display,flex:s.flex,flexShrink:s.flexShrink,flexBasis:s.flexBasis,minWidth:s.minWidth,width:s.width,padding:s.padding,overflowX:s.overflowX,overflowY:s.overflowY};};
    const relevant=['#app','.bottom-panel','.flow-play-actions','.toolbar','.practice-footer','#practice-panel',...['pause-button','recenter-button','help-button','practice-neutral','practice-brake'].map(id=>'#'+id)].map(selector=>document.querySelector(selector)).filter(Boolean).map(describe);
    const outside=[...document.querySelectorAll('#app *')].filter(e=>!e.hidden&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(describe).filter(e=>e.rect.width&&e.rect.height&&(e.rect.left<-.5||e.rect.top<-.5||e.rect.right>innerWidth+.5||e.rect.bottom>innerHeight+.5));
    return {camera:document.getElementById('app').dataset.camera,viewport:{width:innerWidth,height:innerHeight},relevant,outside};
  });await writeFile('.cache/v0130-start-flow-overflow.json',JSON.stringify({rows,...diagnosis},null,2));}
  expect(okay,JSON.stringify(rows)).toBe(true);
}
async function flyEasy(page){
  for(let i=0;i<1400;i++){
    const state=await page.evaluate(()=>{
      const d=document.getElementById('app').dataset;if(d.phase!=='running')return d.phase;
      const v=JSON.parse(d.velocity),g=JSON.parse(d.guidanceDirection??'null'),pitch=+d.flightPitch,speed=+d.speed,gravity=+d.turnGravity;
      const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));let inputPitch=0,steer=0;
      if(d.guidanceReady==='true'&&g){const yaw=Math.atan2(g.x,-g.z),track=Math.atan2(v.x,-v.z),error=Math.atan2(Math.sin(yaw-track),Math.cos(yaw-track));const climb=Math.atan2(g.y,Math.hypot(g.x,g.z)),actual=Math.atan2(v.y,Math.hypot(v.x,v.z));const nose=clamp(pitch+1.5*(climb-actual),-Math.PI/12,Math.PI/12),bank=clamp(Math.atan(error*1.5*Math.max(speed,6)/gravity),-Math.PI/6,Math.PI/6);inputPitch=Math.sign(nose)*(4+Math.abs(nose)/(Math.PI/12)*21);steer=Math.sign(bank)*(3+Math.abs(bank)/(Math.PI/6)*12);}
      for(const [id,value]of [['practice-pitch',inputPitch],['practice-steer',steer],['throttle-input',100*clamp(.5+(10-speed)*.3+pitch*.8,.15,1)]]){const input=document.getElementById(id);input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));}
      return d.phase;
    });
    if(state!=='running'){expect(state).toBe('complete');return;}
    await tick(page,100);
  }
  throw Error('The normal easy course did not finish through actual controls');
}

test('real first start, tutorial, map, countdown, easy success and retry keep startup time out of records',async({page})=>{
  test.setTimeout(120000);const errors=await boot(page,{tutorialSeen:false,inputMethod:'sensor',map:'every'});
  const saved=await page.evaluate(()=>({flight:localStorage.getItem('twist.flight-settings.v1'),audio:localStorage.getItem('twist.feedback-settings.v1')}));
  await expect(page.locator('#mode-explore')).toBeHidden();await expect(page.locator('#practice-button')).toBeHidden();
  await page.locator('#start-flow-title-settings').click();await step(page,'settings');await expect(page.locator('#start-flow-input-method')).toHaveValue('sensor');await page.locator('#start-flow-input-method').selectOption('practice');await page.locator('#start-flow-settings-close').click();await step(page,'title');
  expect(await page.evaluate(()=>({flight:localStorage.getItem('twist.flight-settings.v1'),audio:localStorage.getItem('twist.feedback-settings.v1')}))).toEqual(saved);
  await startToCourses(page,{first:true});await expect(page.locator('[data-course-id]')).toHaveCount(5);for(const id of ['easy','normal','hard','supersonic','sierra50'])await expect(page.locator(`[data-course-id="${id}"]`)).toBeVisible();await page.locator('[data-course-id=easy]').click();
  await page.locator('#start-flow-course-start').click();await expect(page.locator('#briefing-panel')).toBeVisible();
  const beforeMap=await read(page);await tick(page,5000);const afterMap=await read(page);expect(afterMap.position).toEqual(beforeMap.position);expect(afterMap.session.elapsedSeconds).toBe(0);await expect(page.locator('#briefing-panel')).toHaveAttribute('data-draw-complete','true');
  expect(await page.evaluate(()=>({contexts:flowAudioContexts.length,vibrations:flowVibrations.length}))).toEqual({contexts:0,vibrations:0});
  await page.locator('#briefing-skip').click();await step(page,'pose');await launch(page);await flyEasy(page);
  await step(page,'result');await expect(page.locator('#result-outcome')).toHaveText('クリア');await page.locator('#result-copy').click();const report=await page.evaluate(()=>flowCopied);
  expect(report.course.id).toBe('easy');expect(report.result).toBe('clear');expect(report.startup).toMatchObject({tutorialShown:true,firstTime:true,countdown:true,countdownSeconds:3});expect(report.startup.titleToFlightSeconds).toBeGreaterThanOrEqual(8);expect(report.briefing).toMatchObject({shown:true,skipped:false});expect(report.briefing.seconds).toBeGreaterThanOrEqual(5);
  const seconds=report.segments.reduce((sum,row)=>sum+row.seconds,0);expect(report.courseTime.seconds).toBeCloseTo(seconds,6);expect(report.lastLeg.elapsedSeconds).toBeCloseTo(seconds,5);expect(report.courseTime.newBest).toBe(true);
  await page.screenshot({path:'test-results/v0130-real-easy-result.png'});
  await page.locator('#start-flow-retry').click();await expect(page.locator('#briefing-panel')).toBeVisible();expect((await read(page)).session.elapsedSeconds).toBe(0);await page.locator('#briefing-skip').click();await step(page,'pose');
  await page.reload();await tick(page);await step(page,'title');await page.locator('#start-flow-title-help').click();await step(page,'tutorial');await page.locator('#start-flow-tutorial-skip').click();await step(page,'title');await startToCourses(page);expect(errors).toEqual([]);
});

test('real pause map, view, settings, help, recenter and course-exit actions keep a stopped flight stopped',async({page})=>{
  const errors=await quickFlight(page);await tick(page,1200);await page.locator('#pause-button').click();await step(page,'pause');const frozen=await read(page);await tick(page,5000);expect((await read(page)).segments).toEqual(frozen.segments);expect((await read(page)).session).toEqual(frozen.session);expect((await read(page)).position).toEqual(frozen.position);
  await page.locator('#start-flow-map').click();await expect(page.locator('#briefing-panel')).toHaveAttribute('data-origin','pause');await expect(page.locator('[data-map-point=current]')).toHaveCount(1);await tick(page,2000);expect((await read(page)).session).toEqual(frozen.session);await page.locator('#briefing-map').click();await step(page,'pause');
  for(const camera of ['chase','cockpit','overlay']){await page.locator(`#start-flow-pause-camera [data-flow-value=${camera}]`).click();await expect(page.locator('#app')).toHaveAttribute('data-camera',camera);expect((await read(page)).position).toEqual(frozen.position);}
  await page.locator('#start-flow-pause-settings').click();await step(page,'settings');await page.locator('#start-flow-settings-close').click();await step(page,'pause');await page.locator('#start-flow-resume').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  await page.locator('#help-button').click();await step(page,'tutorial');await page.locator('#start-flow-tutorial-skip').click();await step(page,'pause');
  await page.locator('#start-flow-recenter').click();await step(page,'pose');await page.locator('#start-flow-hold').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await expect(page.locator('#app')).toHaveAttribute('data-input','practice');expect(await page.evaluate(()=>flowPermissionCalls)).toBe(0);
  await page.locator('#recenter-button').click();await step(page,'pose');await page.locator('#start-flow-hold').click();await expect(page.locator('#app')).toHaveAttribute('data-input','practice');expect(await page.evaluate(()=>flowPermissionCalls)).toBe(0);
  expect(await page.locator('#recenter-button').evaluate(e=>getComputedStyle(e,'::after').content)).toContain('準備');
  await page.locator('#pause-button').click();await page.locator('#start-flow-course-exit').click();await step(page,'confirm-exit');await page.locator('#start-flow-confirm-cancel').click();await step(page,'pause');await page.locator('#start-flow-course-exit').click();await page.locator('#start-flow-confirm-exit').click();await step(page,'courses');expect((await read(page)).phase).toBe('intro');expect((await read(page)).session.elapsedSeconds).toBe(0);expect(errors).toEqual([]);
});

for(const size of sizes)test(`normal title and actual play fit every view without vertical scrolling ${size.width}x${size.height}`,async({page})=>{
  const errors=await boot(page,{size});await noScroll(page);for(const id of ['start-flow-start','start-flow-title-settings','start-flow-title-help'])await inside(page,'#'+id);await page.screenshot({path:`test-results/v0130-real-title-${size.width}x${size.height}.png`});await startToCourses(page);await toPose(page);await launch(page);await tick(page,1000);
  for(const camera of ['overlay','chase','cockpit']){
    if(camera!=='overlay'){const before=await read(page);await page.locator('#start-flow-view-button').click();const unchanged=await read(page);expect(unchanged.position).toEqual(before.position);expect(unchanged.velocity).toEqual(before.velocity);expect(unchanged.session).toEqual(before.session);await tick(page);const after=await read(page);expect(after.session.elapsedSeconds-before.session.elapsedSeconds).toBeGreaterThan(.1);expect(after.session.elapsedSeconds-before.session.elapsedSeconds).toBeLessThan(.22);expect(Math.hypot(after.position.x-before.position.x,after.position.y-before.position.y,after.position.z-before.position.z)).toBeLessThan(3);}
    await expect(page.locator('#app')).toHaveAttribute('data-camera',camera);await noScroll(page);
    for(const id of ['start-flow-view-button','throttle-input','practice-pitch','practice-steer','practice-twist','pause-button','recenter-button','help-button','practice-neutral','practice-brake'])await inside(page,'#'+id);
    expect(await page.locator('#practice-panel').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
    const geometry=await page.evaluate(()=>{
      const rect=id=>{const e=document.getElementById(id);if(!e||e.hidden||!e.getClientRects().length||getComputedStyle(e).display==='none')return null;const r=e.getBoundingClientRect();return r.width&&r.height?{id,left:r.left,right:r.right,top:r.top,bottom:r.bottom}:null;};
      const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
      const view=rect('start-flow-view-button'),cards=['flight-essential-speed','flight-essential-altitude','cockpit-speed','cockpit-altitude','cockpit-vario','cockpit-heading','cockpit-target-height'].map(rect).filter(Boolean);
      const hud=document.getElementById('flight-essential-hud');if(hud.hidden)for(let index=cards.length-1;index>=0;index--)if(cards[index].id.startsWith('flight-essential-'))cards.splice(index,1);
      const cockpit=document.getElementById('cockpit-hud');if(cockpit.hidden)for(let index=cards.length-1;index>=0;index--)if(cards[index].id.startsWith('cockpit-'))cards.splice(index,1);
      const objects=['radar','bottom-panel','practice-panel','guidance-director','guidance-flight-path'].map(rect).filter(Boolean),bad=[];
      for(const obstacle of [...cards,...objects])if(overlap(view,obstacle))bad.push(`view/${obstacle.id}`);
      for(const card of cards)for(const other of objects.filter(item=>['radar','bottom-panel','practice-panel'].includes(item.id)))if(overlap(card,other))bad.push(`${card.id}/${other.id}`);
      const nav=document.querySelector('.navigation').getBoundingClientRect();if(overlap(view,nav))bad.push('view/navigation');
      const speed=document.getElementById('cockpit-speed'),speedBounds=speed.getBoundingClientRect();
      const speedChildrenOutside=cockpit.hidden?[]:[...speed.children].filter(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none').filter(e=>{const r=e.getBoundingClientRect();return r.left<speedBounds.left-.5||r.right>speedBounds.right+.5||r.top<speedBounds.top-.5||r.bottom>speedBounds.bottom+.5||e.scrollWidth>e.clientWidth+1;}).map(e=>e.textContent.trim());
      return {bad,speedChildrenOutside,ready:document.getElementById('app').dataset.guidanceReady,fd:!!rect('guidance-director'),fpm:!!rect('guidance-flight-path')};
    });
    expect(geometry,`${camera} ${size.width}x${size.height}`).toEqual({bad:[],speedChildrenOutside:[],ready:'true',fd:true,fpm:true});
    await page.screenshot({path:`test-results/v0130-real-play-${camera}-${size.width}x${size.height}.png`});
  }
  for(const id of ['practice-pitch','practice-steer','practice-twist']){const previous=+await page.locator('#'+id).inputValue();await page.locator('#'+id).press('ArrowRight');expect(+await page.locator('#'+id).inputValue()).toBe(previous+1);await page.locator('#'+id).press('ArrowLeft');}
  expect(errors).toEqual([]);
});

test('normal flow hides development modes while explicit dev exploration keeps actual controls and no flight VIEW',async({page})=>{
  const errors=await boot(page,{query:'mode=explore'});await expect(page.locator('#app')).toHaveAttribute('data-play-mode','flight');await page.locator('#start-flow-title-settings').click();await expect(page.locator('#mode-explore')).toBeHidden();await expect(page.locator('#practice-button')).toBeHidden();
  for(const id of ['steering-twist','steering-tilt']){await page.locator('#'+id).click();await step(page,'settings');await expect(page.locator('#flight-adjustments')).toBeVisible();await expect(page.locator('#flight-adjustments')).toHaveAttribute('open','');}
  await page.locator('summary').filter({hasText:'② 詳しい設定'}).click();
  for(const id of ['camera-chase','display-fixed','display-bank','camera-overlay']){await page.locator('#'+id).click();await step(page,'settings');await expect(page.locator('#flight-adjustments')).toBeVisible();await expect(page.locator('#flight-adjustments')).toHaveAttribute('open','');await expect(page.locator('#'+id)).toHaveAttribute('aria-pressed','true');}
  await page.goto('/?dev=1&mode=explore');await tick(page);await expect(page.locator('#app')).toHaveAttribute('data-play-mode','explore');await page.locator('#start-flow-title-settings').click();await page.locator('summary').filter({hasText:'④ 検証用'}).click();await expect(page.locator('#mode-explore')).toBeVisible();await page.locator('#start-flow-settings-close').click();await startToCourses(page);
  const explorationCards=page.locator('#start-flow-course-cards [data-course-id]');
  expect(await explorationCards.evaluateAll(elements=>elements.map(element=>element.dataset.courseId))).toEqual(['easy','normal','hard','sierra50']);
  for(const id of ['easy','normal','hard','sierra50'])await inside(page,`#start-flow-course-cards [data-course-id="${id}"]`);
  await page.locator('#start-flow-course-cards [data-course-id=sierra50]').click();await expect(page.locator('#start-flow-selected-course')).toHaveAttribute('data-selected-course-id','sierra50');await noScroll(page);
  const pendingSelection=await read(page);await tick(page);
  const selectedStart=await read(page),{getCourse}=await import('../src/course-catalog.js');
  expect(selectedStart).toMatchObject({phase:'intro',position:getCourse('sierra50').start,velocity:{x:0,y:0,z:0},speed:0,session:{elapsedSeconds:0}});
  console.log(JSON.stringify({explorationSelectionFrame:{before:{position:pendingSelection.position,phase:pendingSelection.phase},settled:{position:selectedStart.position,velocity:selectedStart.velocity,phase:selectedStart.phase,elapsedSeconds:selectedStart.session.elapsedSeconds}}}));
  await toPose(page);await launch(page);expect(await page.locator('#app').getAttribute('data-course').then(JSON.parse)).toMatchObject({id:'sierra50',targetCount:6});await expect(page.locator('#app')).toHaveAttribute('data-play-mode','explore');await expect(page.locator('#start-flow-view-button')).toBeHidden();await expect(page.locator('#throttle-input')).toBeHidden();for(const id of ['practice-pitch','practice-steer','practice-twist'])await inside(page,'#'+id);await noScroll(page);expect(errors).toEqual([]);
});

test('title and map keep explicit preview separate while countdown cues do not start music or flight',async({page})=>{
  const errors=await boot(page,{audio:true,map:'every'});expect(await page.evaluate(()=>flowAudioContexts.length)).toBe(0);await tick(page,3000);expect(await page.evaluate(()=>flowVibrations.length)).toBe(0);
  await page.locator('#start-flow-title-settings').click();await page.locator('summary').filter({hasText:'③ 音と振動'}).click();await page.locator('#music-preview-track').selectOption('ignition');const saved=await page.evaluate(()=>localStorage.getItem('twist.feedback-settings.v1'));await page.locator('#music-preview-start').click();
  await expect.poll(async()=>{await tick(page);return page.locator('.music-preview-controls').getAttribute('data-playing');}).toBe('true');
  const preview=await page.locator('.music-preview-controls').evaluate(e=>({audio:JSON.parse(e.dataset.audio),music:JSON.parse(e.dataset.music)}));expect(preview.audio.workletReady).toBe(true);expect(preview.audio.contextState).toBe('running');expect(preview.music.track).toBe('Ignition Sky');expect((await read(page)).session.elapsedSeconds).toBe(0);expect(await page.evaluate(()=>flowVibrations.length)).toBe(0);
  await page.locator('#start-flow-settings-close').click();await step(page,'title');await expect.poll(()=>page.evaluate(()=>flowAudioContexts.filter(context=>context.state==='running').length)).toBe(0);expect(await page.evaluate(()=>localStorage.getItem('twist.feedback-settings.v1'))).toBe(saved);
  await startToCourses(page);await toPose(page,{map:true,mapWait:2000});expect(await page.evaluate(()=>flowAudioContexts.filter(context=>context.state==='running').length)).toBe(0);expect(await page.evaluate(()=>flowVibrations.length)).toBe(0);expect((await read(page)).session.elapsedSeconds).toBe(0);expect(errors).toEqual([]);
  await page.locator('#start-flow-hold').click();await step(page,'countdown');
  await waitForThree(page);
  await tick(page,2900);
  const waitingAudio=await page.locator('#feedback-diagnostics').getAttribute('data-audio').then(JSON.parse);expect(waitingAudio.musicActive).toBe(false);expect(waitingAudio.varioActive).toBe(false);
  expect(await page.evaluate(()=>flowVibrations.filter(pattern=>Array.isArray(pattern)?pattern.some((duration,index)=>index%2===0&&duration>0):pattern>0))).toEqual([]);
  expect((await read(page)).session.elapsedSeconds).toBe(0);await tick(page,120);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  await expect.poll(async()=>{await tick(page,160);return page.locator('#feedback-diagnostics').getAttribute('data-audio').then(value=>JSON.parse(value).peak??0);}).toBeGreaterThan(0);
  await page.locator('#pause-button').click();expect(errors).toEqual([]);
});
