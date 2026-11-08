import {test,expect} from '@playwright/test';
import {waitForCountdownThree} from './helpers/countdown.js';
const sizes=[{width:390,height:844},{width:360,height:640},{width:844,height:390}];
test('a fresh Sierra URL boots before panel settings exist and keeps saved course and radar settings intact',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
  const initial={'twist.course.v1':'hard','twist.flight-settings.v1':JSON.stringify({radarRange:180,maxBank:30,turnGravity:9.8}),'twist.feedback-settings.v1':JSON.stringify({sound:false,vibration:false})};
  for(const [key,value]of Object.entries(initial))localStorage.setItem(key,value);
  localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'overlay'}));
  window.sierraStartupStorage={initial,writes:[]};const set=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){if(Object.hasOwn(initial,key))window.sierraStartupStorage.writes.push({key,value});return set.call(this,key,value);};
 });
 // Normal published entry path, not a stage fixture or a teleported pose.
 await page.goto('/?course=sierra50');
 await expect.poll(async()=>({booted:await page.evaluate(()=>document.getElementById('start-flow-panel')?.dataset.step??null),errors})).toEqual({booted:'title',errors:[]});
 await expect.poll(()=>page.locator('#app').evaluate(app=>JSON.parse(app.dataset.course??'null')?.id)).toBe('sierra50');
 const actual=await page.evaluate(()=>({phase:document.getElementById('app').dataset.phase,radar:JSON.parse(document.getElementById('app').dataset.courseRadar??'null'),saved:Object.fromEntries(Object.keys(window.sierraStartupStorage.initial).map(key=>[key,localStorage.getItem(key)])),...window.sierraStartupStorage}));
 expect(actual.phase).toBe('intro');expect(actual.radar).toEqual({effectiveRange:1000,savedRange:180,source:'course-profile'});expect(actual.saved).toEqual(actual.initial);expect(actual.writes).toEqual([]);expect(errors).toEqual([]);
});
for(const size of sizes)for(const camera of ['overlay','chase','cockpit'])test(`Sierra A..G UI and real controls fit ${camera} ${size.width}x${size.height}`,async({page})=>{
 await page.setViewportSize(size);await page.clock.install();await page.addInitScript(camera=>{
  localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera}));localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'every',seen:[]}));localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,vibration:false}));Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true});
 },camera);await page.goto(`/?dev=1&course=sierra50&camera=${camera}&mode=flight`);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.clock.runFor(100);
 const inside=async selector=>{const r=await page.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight};});expect(r.left,selector).toBeGreaterThanOrEqual(-.5);expect(r.top,selector).toBeGreaterThanOrEqual(-.5);expect(r.right,selector).toBeLessThanOrEqual(r.w+.5);expect(r.bottom,selector).toBeLessThanOrEqual(r.h+.5);};
 await page.locator('#start-flow-start').click();await expect(page.locator('.flow-course-card')).toHaveCount(5);for(const id of ['easy','normal','hard','supersonic','sierra50'])await inside(`[data-course-id=${id}]`);await inside('#start-flow-course-start');
 const preview=page.locator('#start-flow-course-preview');for(const name of 'ABCDEFG')await expect(preview.locator('text').filter({hasText:new RegExp('^'+name+'$')})).toHaveCount(1);
 await page.locator('#start-flow-course-start').click();await expect(page.locator('#briefing-panel')).toBeVisible();for(let i=1;i<=6;i++)await expect(page.locator(`[data-briefing-point=tgt-${i}]`)).toContainText('ABCDEFG'[i-1]);await expect(page.locator('[data-briefing-point=exit]')).toContainText('G');await inside('#briefing-skip');
 for(const name of 'ABCDEFG')await expect(page.locator('#briefing-map text').filter({hasText:name==='G'?/^EXIT · G$/:new RegExp('^'+name+'$')})).toHaveCount(1);
 const frozen=await page.locator('#app').getAttribute('data-position');await page.clock.runFor(3800);expect(await page.locator('#app').getAttribute('data-position')).toBe(frozen);await expect(page.locator('#briefing-panel')).toHaveAttribute('data-draw-complete','true');await page.locator('#briefing-skip').click();await page.locator('#start-flow-hold').click();await waitForCountdownThree(page);await page.clock.runFor(3040);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await expect(page.locator('#target-label')).toContainText('A');
 const geometry=await page.evaluate(()=>{
  const elements=['start-flow-view-button','radar','flight-essential-speed','flight-essential-altitude','cockpit-speed','cockpit-altitude','bottom-panel','practice-panel'].map(id=>document.getElementById(id)).filter(e=>e&&!e.hidden&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');const collisions=[];
  for(let i=0;i<elements.length;i++)for(let j=i+1;j<elements.length;j++){const a=elements[i],b=elements[j];if(a.contains(b)||b.contains(a))continue;const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();if(x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top)collisions.push([a.id,b.id]);}
  return {collisions,documentHeight:document.documentElement.scrollHeight,viewportHeight:innerHeight,bodyHeight:document.body.scrollHeight};
 });expect(geometry.collisions).toEqual([]);expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.viewportHeight+1);expect(geometry.bodyHeight).toBeLessThanOrEqual(geometry.viewportHeight+1);
 for(const id of ['practice-pitch','practice-steer','practice-twist','throttle-input','pause-button','recenter-button','start-flow-view-button']){await expect(page.locator('#'+id)).toBeVisible();await expect(page.locator('#'+id)).toBeEnabled();await inside('#'+id);}
 await expect(page.locator('#app')).toHaveAttribute('data-guidance-ready','true');await expect(page.locator('#guidance-director')).toBeVisible();await expect(page.locator('#guidance-flight-path')).toBeVisible();
});
