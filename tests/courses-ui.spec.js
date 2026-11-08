import {test,expect} from './helpers/legacy-ui.js';
import {COURSES,getCourse} from '../src/course.js';
import {COURSE_STORAGE_KEY} from '../src/course-choice.js';
import {APP_VERSION} from '../src/version.js';

const sizes=[{width:390,height:844},{width:360,height:640},{width:844,height:390}];
const courseIds=['easy','normal','hard'];
const advance=page=>page.clock.runFor(160);
const dataset=(page,name)=>page.locator('#app').getAttribute('data-'+name).then(JSON.parse);
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;

async function prepare(page,query='mode=flight&camera=cockpit'){
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install({time:new Date('2026-11-08T09:00:00Z')});
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{
    value:{writeText:async text=>{window.__courseUiCopy=text;}},configurable:true,
  }));
  await page.goto('/?'+query);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  await expect(page.locator('#app')).toHaveAttribute('data-phase','intro');
  return errors;
}
async function navigate(page,query){await page.goto('/?'+query);await advance(page);}
async function start(page){await page.locator('#practice-button').click();await advance(page);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');}
async function pause(page){await page.locator('#pause-button').click();await advance(page);await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');}
async function selectCourse(page,id){await page.locator('#course-select').selectOption(id);await advance(page);}
async function copySettings(page){
  const panel=page.locator('#flight-adjustments');
  if(!await panel.evaluate(element=>element.open))await page.locator('#flight-adjustments > summary').click();
  await page.locator('#settings-copy').click();return page.evaluate(()=>JSON.parse(window.__courseUiCopy));
}
async function primaryOptions(page){
  // A legacy deep-link may have a hidden selected label, but never a fourth primary choice.
  expect(await page.locator('#course-select option:not([hidden])').evaluateAll(options=>options.map(option=>option.value))).toEqual(courseIds);
}
async function initialCourseState(page,id){
  const course=getCourse(id),count=course.lights.length;
  expect(await dataset(page,'course')).toEqual({id:course.id,name:course.name,targetCount:count});
  expect(await dataset(page,'stage-size')).toEqual({halfExtent:350,width:700,depth:700});
  expect(Number(await page.locator('#app').getAttribute('data-turn-gravity'))).toBe(9.8);
  expect(await dataset(page,'position')).toEqual(course.start);
  await expect(page.locator('#collection-count')).toHaveText('0');
  await expect(page.locator('#collection-total')).toContainText(String(count));
  const segments=await dataset(page,'segments'),views=await dataset(page,'target-views');
  expect(segments).toHaveLength(count+1);expect(views).toHaveLength(count+1);
  expect(segments[0]).toMatchObject({id:'start-light1',label:'開始→光1',seconds:null});
  expect(segments.at(-1)).toMatchObject({id:`light${count}-exit`,label:`光${count}→出口`,seconds:null});
  expect(views.at(-1)).toEqual({id:`light${count}-exit`,firstVisibleSeconds:null});
  expect(await dataset(page,'exit-discovery')).toEqual({opened:false,firstVisibleSeconds:null});
}

for(const size of sizes)for(const id of courseIds)test(`${id} course selection, N-target HUD and copied timing fit ${size.width}x${size.height}`,async({page})=>{
  const course=COURSES[id],count=course.lights.length;
  await page.setViewportSize(size);const errors=await prepare(page,`mode=flight&camera=cockpit&course=${id}`);
  await primaryOptions(page);await expect(page.locator('#course-select')).toHaveValue(id);await expect(page.locator('#course-select')).toBeEnabled();
  await initialCourseState(page,id);
  const picker=await page.locator('#course-select').boundingBox();
  expect(picker.x).toBeGreaterThanOrEqual(0);expect(picker.x+picker.width).toBeLessThanOrEqual(size.width);
  expect(picker.height).toBeGreaterThanOrEqual(32);
  const wholePicker=await page.locator('#course-picker').boundingBox();
  for(const selector of ['.mode-picker','.view-picker','#flight-steering-picker','#flight-pitch-picker']){
    const other=await page.locator(selector).boundingBox();expect(overlap(wholePicker,other),'course choice / '+selector).toBe(false);
  }
  await expect(page.locator('#start-button')).toBeInViewport();await expect(page.locator('#practice-button')).toBeInViewport();
  if(id==='easy')await page.screenshot({path:`test-results/v0126-intro-${size.width}x${size.height}.png`});

  await start(page);await expect(page.locator('#course-select')).toBeDisabled();
  await expect(page.locator('#target-label')).toHaveText('TGT 1');
  await expect(page.locator('#collection-total')).toContainText(String(count));
  await expect(page.locator('#objective')).toHaveText(`TGT 0/${count} → EXIT`);
  await expect(page.locator('#cockpit-target-height')).toContainText(`TGT ALT ${course.lights[0].y}m`);
  await expect(page.locator('#radar')).toBeVisible();
  await expect(page.locator('.radar-target[data-id^="light-"]')).toHaveCount(count);
  await expect(page.locator('.radar-next')).toHaveAttribute('data-id','light-1');
  if(count>3)for(const label of await page.locator('.radar-target:not(.radar-next) text').allTextContents())expect(label).toMatch(/^[2-8]$/);
  await expect(page.locator(`.radar-target[data-id="light-${count}"] title`)).toContainText(`TGT ${count}`);
  await expect(page.locator('.radar-exit')).toHaveCount(0);
  const sourceTargets=await dataset(page,'navigation-targets');
  expect(sourceTargets.at(-1).label).toBe(`光 ${count}`);
  const views=await dataset(page,'target-views');expect(views).toHaveLength(count+1);expect(views[0].firstVisibleSeconds).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const hud=await page.locator('#cockpit-target-height').boundingBox();
  for(const selector of ['#cockpit-heading','#cockpit-speed','#cockpit-altitude','#radar','.navigation','#bottom-panel']){
    const other=await page.locator(selector).boundingBox();expect(overlap(hud,other),'height guide / '+selector).toBe(false);
  }
  await page.screenshot({path:`test-results/v0126-courses-${id}-${size.width}x${size.height}.png`});
  await pause(page);await expect(page.locator('#course-select')).toBeEnabled();
  const report=await copySettings(page);
  expect(report.version).toBe(APP_VERSION);
  expect(report.course).toEqual({id:course.id,name:course.name,targetCount:count});
  expect(report.stageSize).toEqual({halfExtent:350,width:700,depth:700});expect(report.settings.turnGravity).toBe(9.8);
  expect(report.segments).toHaveLength(count+1);expect(report.targetViews).toHaveLength(count+1);
  expect(report.segments.at(-1).label).toBe(`光${count}→出口`);
  expect(report.targetViews.at(-1).id).toBe(`light${count}-exit`);
  expect(report.exitDiscovery).toEqual({opened:false,firstVisibleSeconds:null});
  expect(errors).toEqual([]);
});

test('intro course choice persists without starting; valid URL overrides storage and invalid URL falls back to it',async({page})=>{
  const errors=await prepare(page);await expect(page.locator('#course-select')).toHaveValue('easy');
  await selectCourse(page,'normal');await expect(page.locator('#app')).toHaveAttribute('data-phase','intro');
  await initialCourseState(page,'normal');
  expect(await page.evaluate(key=>localStorage.getItem(key),COURSE_STORAGE_KEY)).toBe('normal');
  // Removing the course query proves that the saved preference, rather than the URL, restores selection.
  await navigate(page,'mode=flight&camera=cockpit');await expect(page.locator('#course-select')).toHaveValue('normal');
  await initialCourseState(page,'normal');
  await navigate(page,'mode=flight&camera=cockpit&course=hard');await expect(page.locator('#course-select')).toHaveValue('hard');
  await initialCourseState(page,'hard');
  // A storage fixture, not a position/collection hook, makes the invalid-URL fallback explicit.
  await page.evaluate(key=>localStorage.setItem(key,'normal'),COURSE_STORAGE_KEY);
  await navigate(page,'mode=flight&camera=cockpit&course=unknown');await expect(page.locator('#course-select')).toHaveValue('normal');
  await initialCourseState(page,'normal');expect(errors).toEqual([]);
});

test('changing a paused course resets route/session measurements, stays stopped, and copies the new count',async({page})=>{
  const errors=await prepare(page,'mode=flight&camera=cockpit&course=normal');await start(page);await page.clock.runFor(1200);
  expect((await dataset(page,'session')).elapsedSeconds).toBeGreaterThan(1);
  await pause(page);await selectCourse(page,'hard');
  await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');await initialCourseState(page,'hard');
  const stopped=await dataset(page,'position');await page.clock.runFor(2000);expect(await dataset(page,'position')).toEqual(stopped);
  expect(await dataset(page,'session')).toMatchObject({elapsedSeconds:0,groundContacts:0,recoverySeconds:0,legs:0});
  expect((await dataset(page,'segments')).every(segment=>segment.seconds===null)).toBe(true);
  expect((await dataset(page,'target-views')).every(segment=>segment.firstVisibleSeconds===null)).toBe(true);
  await expect(page.locator('#dialog-description')).toContainText('最初');
  const report=await copySettings(page);expect(report.course.id).toBe('hard');expect(report.course.targetCount).toBe(8);
  expect(report.segments).toHaveLength(9);expect(report.targetViews).toHaveLength(9);
  expect(report.segments.at(-1).label).toBe('光8→出口');
  expect(await page.evaluate(key=>localStorage.getItem(key),COURSE_STORAGE_KEY)).toBe('hard');
  await page.locator('#start-button').click();await advance(page);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await expect(page.locator('#target-label')).toHaveText('TGT 1');
  await expect(page.locator('#collection-total')).toContainText('8');
  expect((await dataset(page,'target-views'))[0].firstVisibleSeconds).toBe(0);expect(errors).toEqual([]);
});

test('legacy comparison deep-link retains only the three primary choices and can switch back to a standard course',async({page})=>{
  const errors=await prepare(page,'mode=flight&camera=cockpit&course=legacy');
  await primaryOptions(page);await initialCourseState(page,'legacy');
  await expect(page.locator('#course-note')).toHaveText(/比較|従来|旧/);
  await selectCourse(page,'easy');await expect(page.locator('#app')).toHaveAttribute('data-phase','intro');
  await expect(page.locator('#course-select')).toHaveValue('easy');await initialCourseState(page,'easy');
  expect(await page.evaluate(key=>localStorage.getItem(key),COURSE_STORAGE_KEY)).toBe('easy');expect(errors).toEqual([]);
});

test('a failed renderer recreation offers a working reload and the saved course can start afterwards',async({page})=>{
  const errors=await prepare(page);await initialCourseState(page,'easy');
  await page.evaluate(()=>{
    const original=HTMLCanvasElement.prototype.getContext;window.courseRendererFailures=0;
    // Fail only a subsequent stage renderer. A real page reload restores the API.
    HTMLCanvasElement.prototype.getContext=function(type,...args){
      if(this.id==='world'&&/^webgl/.test(type)){window.courseRendererFailures++;return null;}
      return original.call(this,type,...args);
    };
  });
  await selectCourse(page,'hard');
  await expect(page.locator('#app')).toHaveAttribute('data-phase','error');
  await expect(page.locator('#dialog-title')).toHaveText('コースを開けませんでした');
  await expect(page.locator('#start-button')).toHaveText('再読み込みする');
  expect(await page.evaluate(()=>window.courseRendererFailures)).toBeGreaterThan(0);
  const reloaded=page.waitForEvent('framenavigated',{predicate:frame=>frame===page.mainFrame()});
  await page.locator('#start-button').click();await reloaded;await page.waitForLoadState('domcontentloaded');await advance(page);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','intro');await initialCourseState(page,'hard');
  await start(page);await expect(page.locator('#collection-total')).toContainText('8');expect(errors).toEqual([]);
});
