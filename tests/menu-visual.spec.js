import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {APP_VERSION} from '../src/version.js';
import {PLAYABLE_COURSE_IDS,getCourse} from '../src/course-catalog.js';
import {COURSE_BESTS_KEY,courseBestKey,formatCourseTime} from '../src/course-bests.js';
import {waitForCountdownThree} from './helpers/countdown.js';

// Actual default-flow evidence. Preferences and unavailable fullscreen are
// explicit fixtures; no phase, position, course result or physics is injected.
const sizes=[{width:360,height:640},{width:390,height:844},{width:844,height:390}];
const version=APP_VERSION.replaceAll('.','');
const nextVersion=APP_VERSION.split('.').map((value,index)=>index===2?Number(value)+1:value).join('.');
const step=(page,value)=>expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step',value);
const read=page=>page.locator('#app').evaluate(app=>{
  const d=app.dataset,j=key=>JSON.parse(d[key]??'null');
  return {phase:d.phase,camera:d.camera,input:d.input,position:j('position'),velocity:j('velocity'),session:j('session'),startup:j('startup'),courseTime:j('courseTime'),segments:j('segments'),briefing:j('briefing')};
});
async function boot(page,{size,clock=false,oldBest=null,reduced=false,android=false,clipboard='success',map='off'}){
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(size);await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
  if(clock)await page.clock.install();
  const bestRecords=Object.fromEntries(['easy','normal','hard'].map((id,index)=>[courseBestKey(getCourse(id),'flight'),{seconds:oldBest??(80+index*30),completedAt:'2026-11-01T00:00:00.000Z'}]));
  await page.addInitScript(options=>{
    if(!/^https?:$/.test(location.protocol))return;
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'overlay'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:options.map,seen:[]}));
    localStorage.setItem('twist.flight-settings.v1',JSON.stringify({maxBank:30,deadzone:4,radarRange:180}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,bgm:false,vibration:false}));
    if(options.seedBests)localStorage.setItem(options.bestKey,JSON.stringify({version:1,records:options.bestRecords}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
    if(options.android)Object.defineProperty(navigator,'userAgent',{value:'Mozilla/5.0 (Linux; Android 15; Pixel 9a) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',configurable:true});
    window.menuAudioContexts=0;window.menuVibrations=0;window.menuCopyCalls=0;
    for(const key of ['AudioContext','webkitAudioContext'])if(window[key]){const Native=window[key];window[key]=new Proxy(Native,{construct(target,args){window.menuAudioContexts++;return Reflect.construct(target,args);}});}
    Object.defineProperty(navigator,'vibrate',{configurable:true,value:pattern=>{if(Array.isArray(pattern)?pattern.some((value,index)=>index%2===0&&value>0):pattern>0)window.menuVibrations++;return true;}});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.menuCopyCalls++;if(options.clipboard==='reject')throw Error('Explicit clipboard-denied fixture');window.menuCopied=JSON.parse(text);}}});
  },{map,android,clipboard,seedBests:oldBest!==null,bestKey:COURSE_BESTS_KEY,bestRecords});
  await page.goto('/');
  if(clock){await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.clock.runFor(160);}
  await expect(page.locator('#app')).toHaveAttribute('data-start-flow','on');await step(page,'title');return errors;
}
async function fit(page,selector,{minimum=0}={}){
  const r=await page.locator(selector).evaluate(element=>{
    const box=element.getBoundingClientRect(),style=getComputedStyle(element);
    return {shown:!element.hidden&&!!element.getClientRects().length&&style.visibility!=='hidden'&&style.display!=='none',left:box.left,top:box.top,right:box.right,bottom:box.bottom,height:box.height,width:innerWidth,viewportHeight:innerHeight,overflow:element.scrollWidth>element.clientWidth+1};
  });
  expect(r.shown,selector).toBe(true);expect(r.overflow,selector).toBe(false);
  expect(r.left,selector).toBeGreaterThanOrEqual(-.5);expect(r.top,selector).toBeGreaterThanOrEqual(-.5);
  expect(r.right,selector).toBeLessThanOrEqual(r.width+.5);expect(r.bottom,selector).toBeLessThanOrEqual(r.viewportHeight+.5);expect(r.height,selector).toBeGreaterThanOrEqual(minimum);
}
async function noScroll(page){
  const geometry=await page.evaluate(()=>[document.documentElement,document.body,document.getElementById('app')].map(element=>({id:element.id||element.tagName,width:element.scrollWidth,height:element.scrollHeight,viewportWidth:innerWidth,viewportHeight:innerHeight})));
  expect(geometry.filter(row=>row.width>row.viewportWidth+1||row.height>row.viewportHeight+1),JSON.stringify(geometry)).toEqual([]);
}
async function uniqueIds(page){
  expect(await page.evaluate(()=>{const seen=new Set(),duplicates=[];for(const e of document.querySelectorAll('[id]')){if(seen.has(e.id))duplicates.push(e.id);seen.add(e.id);}return duplicates;})).toEqual([]);
}
async function proof(page,name,extra={}){
  await mkdir('.cache',{recursive:true});await page.screenshot({path:`.cache/v${version}-menu-${name}.png`});
  await writeFile(`.cache/v${version}-menu-${name}.json`,JSON.stringify({evidence:'Default-flow rendered UI and explicit fixtures; not physical-device or subjective acceptance',state:await read(page),...extra},null,2));
}
async function startToCourses(page){await page.locator('#start-flow-start').click();await step(page,'courses');}
async function inspectBriefing(page,course,size,reduced){
  await page.locator('#start-flow-course-start').click();await expect(page.locator('#briefing-panel')).toBeVisible();
  if(reduced)await expect(page.locator('#briefing-panel')).toHaveAttribute('data-draw-complete','true',{timeout:500});
  const map=page.locator('#briefing-map');await expect(map.locator('[data-map-point^=tgt-]')).toHaveCount(course.lights.length);
  await expect(map.locator('[data-map-point=start]')).toHaveCount(1);await expect(map.locator('[data-map-point=exit]')).toHaveCount(1);await expect(page.locator('#briefing-overview')).toBeVisible();
  for(const selector of ['#briefing-map','#briefing-overview','#briefing-overview-scale','.briefing-map-reference','#briefing-title','#briefing-skip'])await fit(page,selector);
  expect(Number(await page.locator('#briefing-overview-scale').getAttribute('data-context-scale-metres'))).toBeGreaterThan(0);
  await expect(page.locator('#briefing-panel')).toHaveAttribute('data-draw-complete','true');await expect(map.locator('.briefing-trace-tip')).toHaveAttribute('visibility','hidden');
  await noScroll(page);expect((await read(page)).session.elapsedSeconds).toBe(0);await proof(page,`briefing-${course.id}-${size.width}x${size.height}`,{reduced});
  await page.locator('#briefing-skip').click();await step(page,'pose');await page.locator('#start-flow-pose-back').click();await step(page,'courses');
}

for(const size of sizes)test(`real title, selected five routes and briefing remain readable ${size.width}x${size.height}`,async({page})=>{
  test.setTimeout(60000);const reduced=size.width===390,errors=await boot(page,{size,oldBest:80,map:'every',android:true,reduced});
  await expect(page.locator('.flow-title-copy>p')).toHaveText('Tilt to Play.');
  await expect(page.locator('.flow-author-signature')).toHaveText('SIKUMI LAB');await expect(page.locator('#start-flow-version')).toHaveText('v'+APP_VERSION);
  const image=page.locator('.flow-title-aircraft');await expect(image).toBeVisible();await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  const aircraft=await image.evaluate(img=>{
    // A detached diagnostic 2D canvas measures transparent asset padding; it is
    // not attached to the game and does not introduce another world renderer.
    const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const context=canvas.getContext('2d');context.drawImage(img,0,0);const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
    let minX=canvas.width,minY=canvas.height,maxX=-1,maxY=-1;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>=16){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    const r=img.getBoundingClientRect(),scale=Math.min(r.width/canvas.width,r.height/canvas.height);
    return {width:img.naturalWidth,height:img.naturalHeight,url:img.currentSrc,drawnWidth:(maxX-minX+1)*scale,drawnHeight:(maxY-minY+1)*scale};
  });
  expect(aircraft.width).toBe(768);expect(aircraft.height).toBe(768);expect(new URL(aircraft.url).pathname).toMatch(/\/menu-aircraft\.webp$/);expect(new URL(aircraft.url).searchParams.get('v')).toBe(APP_VERSION);
  const hero=await page.locator('.flow-title-art').boundingBox();expect(hero.height).toBeGreaterThanOrEqual(size.width<600?160:120);expect(Math.max(aircraft.drawnWidth,aircraft.drawnHeight)).toBeGreaterThanOrEqual(Math.min(hero.width,hero.height)*.55);
  for(const selector of ['.flow-title-aircraft','.flow-title-credit','#start-flow-start','#start-flow-title-settings','#start-flow-title-help','#start-flow-version'])await fit(page,selector);
  await expect(page.locator('#installation-advice')).toBeHidden(); // Existing advice is iPhone-only; Android uses its install prompt.
  for(const selector of ['.flow-author-signature','#start-flow-version'])expect(await page.locator(selector).evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(11);
  // Exercise the actual PWA event handler. This is not a real OS installation.
  await page.evaluate(()=>{window.menuInstallPrompts=0;const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{window.menuInstallPrompts++;};event.userChoice=Promise.resolve({outcome:'dismissed'});window.dispatchEvent(event);});
  await expect(page.locator('#install-button')).toBeVisible();await fit(page,'#install-button',{minimum:40});await fit(page,'#start-flow-start');await noScroll(page);
  await page.locator('#install-button').click();expect(await page.evaluate(()=>menuInstallPrompts)).toBe(1);await expect(page.locator('#install-button')).toBeHidden();
  // Supplementary message-layout fixture in the actual title DOM. This does
  // not simulate a successful service-worker update or click its reload action.
  const updateState=await page.evaluate(next=>{const notice=document.getElementById('update-notice'),label=document.getElementById('update-version'),old={hidden:notice.hidden,label:label.textContent};notice.hidden=false;label.textContent='v'+next;return old;},nextVersion);
  for(const selector of ['#update-notice','#update-button','#start-flow-start','#start-flow-title-settings','#start-flow-title-help','.flow-title-credit'])await fit(page,selector);await noScroll(page);
  await proof(page,`pwa-message-${size.width}x${size.height}`,{messageFixture:true,realUpdateAcceptance:false});
  await page.evaluate(old=>{document.getElementById('update-notice').hidden=old.hidden;document.getElementById('update-version').textContent=old.label;},updateState);
  await expect(page.locator('canvas')).toHaveCount(1);await expect(page.locator('canvas#world')).toHaveCount(1);await uniqueIds(page);await proof(page,`title-${size.width}x${size.height}`,{aircraft,reduced});
  await page.locator('#start-flow-title-settings').click();await step(page,'settings');await page.keyboard.press('Escape');await step(page,'title');
  await page.locator('#start-flow-start').focus();await page.keyboard.press('Enter');await step(page,'courses');
  const cards=page.locator('#start-flow-course-cards [data-course-id]');await expect(cards).toHaveCount(5);expect(await cards.evaluateAll(elements=>elements.map(e=>e.dataset.courseId))).toEqual(['easy','normal','hard','supersonic','sierra50']);
  const shapes=new Set();
  for(const id of PLAYABLE_COURSE_IDS){
    const course=getCourse(id),card=page.locator(`#start-flow-course-cards [data-course-id="${id}"]`);await card.click();await expect(card).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#start-flow-course-cards [data-course-id][aria-pressed=true]')).toHaveCount(1);
    await expect(page.locator('#start-flow-selected-course')).toHaveAttribute('data-selected-course-id',id);await expect(page.locator('#start-flow-selected-course-name')).toHaveText(course.name);
    const preview=page.locator('#start-flow-course-preview');await expect(preview).toHaveAttribute('data-preview-mode','factory');
    await expect.poll(()=>preview.evaluate(e=>{const r=e.getBoundingClientRect();return [Number(e.dataset.previewWidth),Number(e.dataset.previewHeight)].join('x')===`${Math.round(r.width)}x${Math.round(r.height)}`;})).toBe(true);
    const svg=preview.locator('svg');await expect(svg).toHaveCount(1);await expect(svg.locator('title')).toHaveText(course.name+' route');await expect(svg.locator('circle')).toHaveCount(course.lights.length);
    const geometry=await preview.evaluate(e=>{const r=e.getBoundingClientRect(),svg=e.querySelector('svg'),line=svg.querySelector('path[fill="none"]'),box=line.getBoundingClientRect();return {width:Math.round(r.width),height:Math.round(r.height),viewBox:svg.getAttribute('viewBox'),path:line.getAttribute('d'),routeWidth:box.width,routeHeight:box.height,diameters:[...svg.querySelectorAll('circle')].map(circle=>Math.min(circle.getBoundingClientRect().width,circle.getBoundingClientRect().height))};});
    expect(geometry.viewBox).toBe(`0 0 ${geometry.width} ${geometry.height}`);expect(geometry.path).toBeTruthy();shapes.add(geometry.path);
    expect(Math.max(geometry.routeWidth,geometry.routeHeight)).toBeGreaterThanOrEqual(Math.max(60,Math.min(geometry.width,geometry.height)*.5));expect(geometry.diameters.every(value=>value>=8)).toBe(true);
    if(['easy','normal','hard'].includes(id))await expect(page.locator('#start-flow-selected-course-best')).toContainText(formatCourseTime(80));
    else await expect(page.locator('#start-flow-selected-course-best')).toHaveText('自己ベスト '+formatCourseTime(null));
    for(const selector of [`#start-flow-course-cards [data-course-id="${id}"]`,'#start-flow-selected-course-name','#start-flow-course-preview','#start-flow-selected-course-detail','#start-flow-selected-course-best','#start-flow-course-camera','#start-flow-course-start'])await fit(page,selector);
    await noScroll(page);const frozen=await read(page);expect(frozen.phase).toBe('intro');expect(frozen.session.elapsedSeconds).toBe(0);expect(frozen.startup.flightStartedAt).toBeNull();await proof(page,`course-${id}-${size.width}x${size.height}`,{geometry});
    await inspectBriefing(page,course,size,reduced);
  }
  expect(shapes.size).toBe(5);const easy=page.locator('#start-flow-course-cards [data-course-id=easy]');await easy.focus();await page.keyboard.press('Space');await expect(easy).toBeFocused();await expect(page.locator('#start-flow-selected-course')).toHaveAttribute('data-selected-course-id','easy');
  if(reduced)expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.evaluate(()=>[menuAudioContexts,menuVibrations])).toEqual([0,0]);await uniqueIds(page);expect(errors).toEqual([]);
});

test.describe('iPhone default title advice',()=>{
  test.use({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  for(const size of sizes)test(`real platform advice and title actions fit ${size.width}x${size.height}`,async({page})=>{
    const errors=await boot(page,{size});
    expect(await page.evaluate(()=>navigator.userAgent)).toContain('iPhone');
    await expect(page.locator('#installation-advice')).toContainText('ホーム画面に追加');await expect(page.locator('#install-button')).toBeHidden();
    await expect(page.locator('.flow-title-aircraft')).toBeVisible();await expect.poll(()=>page.locator('.flow-title-aircraft').evaluate(img=>img.complete&&img.naturalWidth===768&&img.naturalHeight===768)).toBe(true);
    for(const selector of ['#installation-advice','.flow-title-aircraft','#start-flow-start','#start-flow-title-settings','#start-flow-title-help','.flow-title-credit'])await fit(page,selector);
    await noScroll(page);await uniqueIds(page);await proof(page,`iphone-advice-${size.width}x${size.height}`,{actualUserAgentBranch:true,physicalIPhoneAcceptance:false});
    await page.locator('#start-flow-title-settings').click();await step(page,'settings');await page.keyboard.press('Escape');await step(page,'title');await expect(page.locator('#installation-advice')).toBeVisible();
    expect((await read(page)).session.elapsedSeconds).toBe(0);expect(await page.evaluate(()=>[menuAudioContexts,menuVibrations])).toEqual([0,0]);expect(errors).toEqual([]);
  });
});

async function launch(page){
  await page.locator('#start-flow-hold').click();await step(page,'countdown');await waitForCountdownThree(page);await page.clock.runFor(3100);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await step(page,'play');
}
// Same displayed-FD-only controller used by the established start-flow suite.
// It operates actual input events and never reads target coordinates or changes
// capture radii, flight state, speed, force or completion thresholds.
async function flyEasy(page){
  for(let i=0;i<1400;i++){
    const phase=await page.evaluate(()=>{
      const d=document.getElementById('app').dataset;if(d.phase!=='running')return d.phase;
      const v=JSON.parse(d.velocity),g=JSON.parse(d.guidanceDirection??'null'),pitch=+d.flightPitch,speed=+d.speed,gravity=+d.turnGravity,clamp=(value,low,high)=>Math.max(low,Math.min(high,value));let inputPitch=0,steer=0;
      if(d.guidanceReady==='true'&&g){const yaw=Math.atan2(g.x,-g.z),track=Math.atan2(v.x,-v.z),error=Math.atan2(Math.sin(yaw-track),Math.cos(yaw-track)),climb=Math.atan2(g.y,Math.hypot(g.x,g.z)),actual=Math.atan2(v.y,Math.hypot(v.x,v.z)),nose=clamp(pitch+1.5*(climb-actual),-Math.PI/12,Math.PI/12),bank=clamp(Math.atan(error*1.5*Math.max(speed,6)/gravity),-Math.PI/6,Math.PI/6);inputPitch=Math.sign(nose)*(4+Math.abs(nose)/(Math.PI/12)*21);steer=Math.sign(bank)*(3+Math.abs(bank)/(Math.PI/6)*12);}
      for(const [id,value]of [['practice-pitch',inputPitch],['practice-steer',steer],['throttle-input',100*clamp(.5+(10-speed)*.3+pitch*.8,.15,1)]]){const input=document.getElementById(id);input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));}return d.phase;
    });
    if(phase!=='running'){expect(phase).toBe('complete');return;}
    await page.clock.runFor(100);
  }
  throw Error('The real easy course did not complete through its displayed guidance and input controls');
}

for(const size of sizes)test(`actual three views and completed result preserve records and actions ${size.width}x${size.height}`,async({page})=>{
  test.setTimeout(120000);const fresh=size.width===390,errors=await boot(page,{size,clock:true,oldBest:fresh?null:1,clipboard:fresh?'success':'reject'});
  await startToCourses(page);await page.locator('#start-flow-course-cards [data-course-id=easy]').click();await page.locator('#start-flow-course-start').click();await step(page,'pose');await launch(page);
  const throttleBoxes=[];
  for(const camera of ['overlay','chase','cockpit']){
    if(camera!=='overlay'){const before=await read(page);await page.locator('#start-flow-view-button').click();await expect(page.locator('#app')).toHaveAttribute('data-camera',camera);const after=await read(page);expect(after.position).toEqual(before.position);expect(after.velocity).toEqual(before.velocity);expect(after.session).toEqual(before.session);}
    await page.clock.runFor(160);
    await noScroll(page);for(const id of ['start-flow-view-button','throttle-input','practice-pitch','practice-steer','practice-twist','pause-button','recenter-button','help-button','practice-neutral','practice-brake'])await fit(page,'#'+id);
    await expect(page.locator('#app')).toHaveAttribute('data-guidance-ready','true');await expect(page.locator('#guidance-director')).toBeVisible();await expect(page.locator('#guidance-flight-path')).toBeVisible();throttleBoxes.push(await page.locator('#throttle-input').boundingBox());await proof(page,`play-${camera}-${size.width}x${size.height}`);
  }
  for(const box of throttleBoxes.slice(1))for(const key of ['x','y','width','height'])expect(Math.abs(box[key]-throttleBoxes[0][key])).toBeLessThanOrEqual(.5);
  for(const id of ['practice-pitch','practice-steer','practice-twist']){const input=page.locator('#'+id),before=+await input.inputValue();await input.press('ArrowRight');expect(+await input.inputValue()).toBe(before+1);await input.press('ArrowLeft');}
  await flyEasy(page);await step(page,'result');await expect(page.locator('#result-outcome')).toHaveText('クリア');await expect(page.locator('.flow-result')).toHaveAttribute('data-new-best',String(fresh));
  const complete=await read(page),seconds=complete.courseTime.seconds;expect(complete.courseTime.newBest).toBe(fresh);expect(complete.session.groundContacts).toBe(0);
  await expect(page.locator('#result-course-time')).toHaveText(formatCourseTime(seconds));await expect(page.locator('#result-best-time')).toHaveText(formatCourseTime(fresh?seconds:1));
  const type=await page.locator('.flow-result').evaluate(screen=>{const time=document.getElementById('result-course-time'),best=document.getElementById('result-best-time'),probe=document.createElement('span');probe.style.color=getComputedStyle(screen).getPropertyValue('--flow-exit').trim();screen.append(probe);const gold=getComputedStyle(probe).color;probe.remove();return {current:parseFloat(getComputedStyle(time).fontSize),best:parseFloat(getComputedStyle(best).fontSize),color:getComputedStyle(time).color,gold};});
  expect(type.current).toBeGreaterThanOrEqual(44);expect(type.current).toBeGreaterThanOrEqual(type.best*2);if(fresh)expect(type.color).toBe(type.gold);else expect(type.color).not.toBe(type.gold);
  for(const selector of ['#start-flow-result-title','#result-course-time','#result-best-time','#result-best-status','#start-flow-retry','#start-flow-result-courses','#result-copy','#start-flow-result-details'])await fit(page,selector);
  await page.locator('#result-copy').click();let report;
  if(fresh){report=await page.evaluate(()=>menuCopied);await expect(page.locator('#result-copy-text')).toBeHidden();}
  else{await expect(page.locator('#result-copy-text')).toBeVisible();await fit(page,'#result-copy-text');report=JSON.parse(await page.locator('#result-copy-text').inputValue());expect(await page.locator('#result-copy-text').evaluate(e=>e.readOnly&&e.selectionStart===0&&e.selectionEnd===e.value.length)).toBe(true);}
  expect(report.result).toBe('clear');expect(report.course.id).toBe('easy');expect(report.courseTime.seconds).toBeCloseTo(seconds,6);expect(report.lastLeg.elapsedSeconds).toBeCloseTo(report.segments.reduce((sum,row)=>sum+row.seconds,0),5);expect(report.courseTime.newBest).toBe(fresh);expect(await page.evaluate(()=>menuCopyCalls)).toBe(1);
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),COURSE_BESTS_KEY);expect(saved.records[courseBestKey(getCourse('easy'),'flight')].seconds).toBeCloseTo(fresh?seconds:1,6);
  await noScroll(page);await uniqueIds(page);await proof(page,`result-${size.width}x${size.height}`,{report,type,clipboard:fresh?'success':'denied-fallback'});
  await page.locator('#start-flow-result-details').click();await step(page,'settings');await expect(page.locator('#start-flow-record-details')).toHaveAttribute('open','');await page.locator('#result-settings').scrollIntoViewIfNeeded();await expect(page.locator('#result-settings')).toBeVisible();await noScroll(page);await page.keyboard.press('Escape');await step(page,'result');
  await expect(page.locator('.flow-result')).toHaveAttribute('data-new-best',String(fresh));expect((await read(page)).session).toEqual(complete.session);
  if(fresh){await page.locator('#start-flow-result-courses').click();await step(page,'courses');await expect(page.locator('#start-flow-selected-course-best')).toContainText(formatCourseTime(seconds));}
  else{await page.locator('#start-flow-retry').click();await step(page,'pose');expect((await read(page)).session.elapsedSeconds).toBe(0);await page.locator('#start-flow-pose-back').click();await step(page,'courses');await expect(page.locator('#start-flow-selected-course-best')).toContainText(formatCourseTime(1));}
  await noScroll(page);expect(errors).toEqual([]);
});
