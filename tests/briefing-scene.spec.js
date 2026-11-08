import {test,expect} from '@playwright/test';
import {APP_VERSION} from '../src/version.js';
import {PLAYABLE_COURSE_IDS,getCourse} from '../src/course-catalog.js';
import {mkdir} from 'node:fs/promises';
const version=APP_VERSION.replaceAll('.','');
async function boot(page,size,reduced=false){
 await page.setViewportSize(size);await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await page.clock.install();
 await page.addInitScript(()=>{
  localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'overlay'}));
  localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'every',seen:[]}));
  localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,bgm:false,vibration:false}));
  Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true});
 });
 await page.goto('/');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.clock.runFor(100);
 await page.locator('#start-flow-start').click();
}
async function fit(page){
 const result=await page.evaluate(()=>({scroll:document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1,
  outside:[...document.querySelectorAll('#start-flow-course-start,#start-flow-course-camera,#start-flow-selected-course-name,#start-flow-selected-course-detail,#start-flow-selected-course-best,#start-flow-course-cards button,#briefing-title,#briefing-skip')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')).map(e=>({id:e.id||e.dataset.courseId,r:e.getBoundingClientRect().toJSON()})).filter(({r})=>r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)}));
 expect(result).toEqual({scroll:false,outside:[]});
}
for(const size of [{width:360,height:640},{width:390,height:844},{width:844,height:390}])test(`product angled selection without aircraft and traversing briefing ${size.width}x${size.height}`,async({page})=>{
 test.setTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await boot(page,size);await mkdir('.cache',{recursive:true});
 for(const id of PLAYABLE_COURSE_IDS){
  await page.locator(`#start-flow-course-cards [data-course-id="${id}"]`).click();const preview=page.locator('#start-flow-course-preview');
  await expect(preview).toHaveAttribute('data-preview-mode','factory');await expect(preview.locator('svg')).toHaveAttribute('data-map-view','oblique');
  await expect(preview.locator('[data-aircraft],.briefing-aircraft,.briefing-trace-tip')).toHaveCount(0);
  await expect(preview.locator('.briefing-preview-number')).toHaveCount(getCourse(id).lights.length);await expect(preview.locator('.briefing-height-stem')).toHaveCount(getCourse(id).lights.length+2);await fit(page);
  await page.screenshot({path:`.cache/v${version}-selection-${id}-${size.width}x${size.height}.png`});
  await page.locator('#start-flow-course-start').click();await expect(page.locator('#briefing-panel')).toHaveAttribute('data-map-view','oblique');await fit(page);
  await expect(page.locator('.briefing-aircraft')).toHaveAttribute('visibility','visible');await page.clock.runFor(1800);
  const alignment=await page.locator('#briefing-map').evaluate(svg=>{
   const plane=svg.querySelector('.briefing-aircraft'),route=svg.querySelector('.briefing-route'),fraction=Number(document.getElementById('briefing-panel').dataset.progress),expected=route.getPointAtLength(route.getTotalLength()*fraction),matrix=plane.transform.baseVal.consolidate().matrix;
   return {distance:Math.hypot(expected.x-matrix.e,expected.y-matrix.f),fraction,next:plane.dataset.nextPoint,passed:svg.querySelectorAll('[data-passed=true]').length};
  });
  expect(alignment.fraction).toBeGreaterThan(.45);expect(alignment.fraction).toBeLessThan(.6);expect(alignment.distance).toBeLessThan(.1);expect(alignment.next).toBeTruthy();
  await page.screenshot({path:`.cache/v${version}-briefing-${id}-${size.width}x${size.height}.png`});
  await page.clock.runFor(2000);await expect(page.locator('#briefing-panel')).toHaveAttribute('data-draw-complete','true');
  await expect(page.locator('#briefing-map [data-passed=true]')).toHaveCount(getCourse(id).lights.length);await expect(page.locator('.briefing-aircraft')).toHaveAttribute('visibility','hidden');
  expect(await page.locator('#app').evaluate(e=>JSON.parse(e.dataset.session).elapsedSeconds)).toBe(0);
  await page.locator('#briefing-skip').click();await page.locator('#start-flow-pose-back').click();
 }
 expect(errors).toEqual([]);
});
test('reduced-motion product briefing remains a full static map and can immediately continue',async({page})=>{
 await boot(page,{width:390,height:844},true);await page.locator('#start-flow-course-start').click();
 await expect(page.locator('#briefing-panel')).toHaveAttribute('data-draw-complete','true');await expect(page.locator('.briefing-aircraft')).toHaveAttribute('visibility','hidden');
 await expect(page.locator('#briefing-map [data-passed=true]')).toHaveCount(0);await page.locator('#briefing-skip').click();await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');
});
