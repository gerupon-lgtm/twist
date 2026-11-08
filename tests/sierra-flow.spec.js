import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {waitForCountdownThree} from './helpers/countdown.js';
const rad=Math.PI/180,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=v=>Math.atan2(Math.sin(v),Math.cos(v));
const artifacts='.cache/v0137-sierra-flow';
async function state(page){return page.locator('#app').evaluate(app=>{const d=app.dataset,j=k=>JSON.parse(d[k]??'null');return {phase:d.phase,position:j('position'),velocity:j('velocity'),direction:j('guidanceDirection'),ready:d.guidanceReady==='true',speed:+d.speed,pitch:+d.flightPitch,bank:+d.bank,gravity:+d.turnGravity,course:j('course'),stageSize:j('stageSize'),boundary:j('boundary'),burn:j('afterburner'),lane:j('abLane'),segments:j('segments'),session:j('session'),radar:j('courseRadar'),collected:+document.getElementById('collection-count').textContent,label:document.getElementById('target-label').textContent};});}
async function launch(page,camera,{map='off'}={}){
 await page.clock.install();await page.addInitScript(({camera,map})=>{
  localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera}));localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:map,seen:[]}));
  localStorage.setItem('twist.flight-settings.v1',JSON.stringify({maxBank:30,turnGravity:9.8,autoAfterburner:false,radarRange:180}));localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,vibration:false}));
  Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.sierraCopy=JSON.parse(value);}},configurable:true});
 },{camera,map});
 await page.goto(`/?dev=1&course=sierra50&camera=${camera}&mode=flight&view=assisted&steer=tilt&pitch=angle&display=bank`);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.clock.runFor(100);
 await page.locator('#start-flow-start').click();await expect(page.locator('.flow-course-card')).toHaveCount(5);await expect(page.locator('[data-course-id=sierra50]')).toHaveAttribute('aria-pressed','true');await page.locator('#start-flow-course-start').click();
 if(map!=='off'){await expect(page.locator('#briefing-panel')).toBeVisible();await expect(page.locator('[data-briefing-point=tgt-1]')).toContainText('A');await expect(page.locator('[data-briefing-point=exit]')).toContainText('G');await page.locator('#briefing-skip').click();}
 await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');await page.locator('#start-flow-hold').click();await waitForCountdownThree(page);await page.clock.runFor(3040);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
 const settings=await page.evaluate(()=>Object.fromEntries(['deadzone','maxTilt','maxPitch','maxBank','steerTiltDeadzone','maxSteerTilt','steerCurve'].map(k=>[k,Number(document.getElementById('setting-'+k).value)])));return settings;
}
function controls(s,settings){
 const angle=(v,max,deadzone,extent,curve=1)=>!v?0:Math.sign(v)*(deadzone+(extent-deadzone)*clamp(Math.abs(v)/max,0,1)**(1/curve));
 if(!s.ready||!s.direction)return {pitch:0,steer:0,twist:0,throttle:50};
 const desiredTrack=Math.atan2(s.direction.x,-s.direction.z),track=Math.atan2(s.velocity.x,-s.velocity.z),desiredClimb=Math.atan2(s.direction.y,Math.hypot(s.direction.x,s.direction.z)),climb=Math.atan2(s.velocity.y,Math.hypot(s.velocity.x,s.velocity.z));
 const nose=clamp(s.pitch+1.5*(desiredClimb-climb),-settings.maxPitch*rad,settings.maxPitch*rad),bank=clamp(Math.atan(wrap(desiredTrack-track)*1.5*Math.max(s.speed,6)/s.gravity),-30*rad,30*rad);
 return {pitch:angle(nose,settings.maxPitch*rad,settings.deadzone,settings.maxTilt),steer:angle(bank,settings.maxBank*rad,settings.steerTiltDeadzone,settings.maxSteerTilt,settings.steerCurve),twist:0,throttle:100*clamp(.5+(10-s.speed)*.3+s.pitch*.8,.15,1)};
}
async function fly(page,settings,{useAB=false}={}){
 const trace=[],labels=[],errors=[],start=await state(page);let maximumBank=0,abRequested=false,previousTrack=null,totalTurn=0,last=start;
 page.on('pageerror',error=>errors.push(error.message));
 for(let i=0;i<7000;i++){
  const s=await state(page);last=s;if(i%20===0)trace.push({i,...s});if(labels.at(-1)!==s.label)labels.push(s.label);
  if(s.phase!=='running')break;
  maximumBank=Math.max(maximumBank,Math.abs(s.bank));const track=Math.atan2(s.velocity.x,-s.velocity.z);if(previousTrack!==null)totalTurn+=Math.abs(wrap(track-previousTrack));previousTrack=track;
  // Only a real paid final lane may enable AB, after the F turn has aligned.
  const wanted=useAB&&s.collected===6&&s.lane?.inside&&Math.abs(s.bank)<5*rad&&s.burn.fuel>0;
  if(Boolean(wanted)!==abRequested){await page.locator('#throttle-input').focus();await page.keyboard.press(wanted?'End':'Home');abRequested=Boolean(wanted);}
  const input=controls(s,settings);await page.evaluate(({input,abRequested})=>{const values=[['practice-pitch',input.pitch],['practice-steer',input.steer],['practice-twist',input.twist]];if(!abRequested)values.push(['throttle-input',input.throttle]);for(const [id,value]of values){const e=document.getElementById(id);e.value=String(value);e.dispatchEvent(new Event('input',{bubbles:true}));}},{input,abRequested});await page.clock.runFor(100);
 }
 return {start,last,trace,labels,maximumBank,totalTurn,errors};
}
for(const camera of ['overlay','chase','cockpit'])test(`actual Sierra FD-only pilot completes all A..G in ${camera}`,async({page})=>{
 test.setTimeout(300000);await page.setViewportSize({width:390,height:844});const settings=await launch(page,camera);let evidence=null;
 try{
  evidence=await fly(page,settings);expect(evidence.errors).toEqual([]);expect(evidence.last.phase,JSON.stringify(evidence.trace.slice(-5))).toBe('complete');expect(evidence.last.collected).toBe(6);expect(evidence.maximumBank).toBeLessThanOrEqual(30*rad+.001);
  expect(evidence.last.stageSize).toMatchObject({halfExtent:1850,maxHeight:70,width:3700,depth:3700});expect(evidence.last.radar).toMatchObject({effectiveRange:1000,source:'course-profile'});
  for(const name of ['A','B','C','D','E','F','G'])expect(evidence.labels.some(label=>label.includes(' · '+name)),name).toBe(true);
  expect(evidence.trace.every(row=>row.position.y>=0&&row.position.y<=70&&!row.boundary.outside)).toBe(true);await page.locator('#result-copy').click();const report=await page.evaluate(()=>window.sierraCopy);
  expect(report.course).toMatchObject({id:'sierra50',targetCount:6,geography:{estimatedGeography:true,surface:'flat',pointNames:['A','B','C','D','E','F','G']}});expect(report.segments.map(row=>row.label)).toEqual(['開始→A','A→B','B→C','C→D','D→E','E→F','F→G']);expect(report.segments.every(row=>Number.isFinite(row.seconds))).toBe(true);expect(report.segments.reduce((sum,row)=>sum+row.seconds,0)).toBeCloseTo(report.courseTime.seconds,5);
  expect(report.courseTime).toMatchObject({newBest:true,saved:true,mode:'flight'});expect(report.courseTime.courseKey).toMatch(/^flight:sierra50:/);const persisted=await page.evaluate(key=>JSON.parse(localStorage.getItem('twist.course-bests.v1')).records[key].seconds,report.courseTime.courseKey);expect(persisted).toBe(report.courseTime.seconds);
  await mkdir(artifacts,{recursive:true});await page.screenshot({path:`${artifacts}/${camera}-${Date.now()}-clear.png`});await page.reload();await page.clock.runFor(100);await expect.poll(async()=>{await page.clock.runFor(100);return page.locator('#app').evaluate(app=>JSON.parse(app.dataset.courseTime??'null')?.bestSeconds);}).toBe(report.courseTime.seconds);await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','title');
 }finally{await mkdir(artifacts,{recursive:true});await writeFile(`${artifacts}/${camera}-${Date.now()}.json`,JSON.stringify(evidence,null,2));await page.screenshot({path:`${artifacts}/${camera}-${Date.now()}.png`});}
});
for(const useAB of [false,true])test(`Sierra final lane uses actual earned fuel AB${useAB?'on':'off'}`,async({page})=>{
 test.setTimeout(300000);await page.setViewportSize({width:390,height:844});const settings=await launch(page,'cockpit');let evidence=null;
 try{evidence=await fly(page,settings,{useAB});expect(evidence.last.phase).toBe('complete');await page.locator('#result-copy').click();const report=await page.evaluate(()=>window.sierraCopy);const final=report.abStraights.find(row=>row.id==='sierra50-final');expect(final).toBeTruthy();expect(final.usedAfterburner).toBe(useAB);if(useAB)expect(final.afterburnerSeconds).toBeGreaterThan(0);else expect(final.afterburnerSeconds).toBe(0);expect(evidence.errors).toEqual([]);
 }finally{await mkdir(artifacts,{recursive:true});await writeFile(`${artifacts}/ab-${useAB}-${Date.now()}.json`,JSON.stringify(evidence,null,2));}
});
