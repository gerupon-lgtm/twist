import {test,expect} from '@playwright/test';

// Isolated component/layout evidence. The real start flow, permission, clocks
// and persistence are covered separately by start-flow.spec and pwa-flow.spec.
async function setup(page,size){
  await page.setViewportSize(size);await page.clock.install();
  await page.addInitScript(()=>localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,vibration:false})));
  await page.goto('/?dev=1&flow=legacy&mode=flight&camera=overlay&course=easy');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  await page.locator('#practice-button').click();await page.clock.runFor(100);await page.locator('#pause-button').click();
  return page.evaluate(async()=>{
    const {createStartFlowPanel}=await import('/src/start-flow-panel.js');
    const {COURSES}=await import('/src/course.js');
    const {createCoursePreviewSVG}=await import('/src/briefing-model.js');
    const adjustments=document.getElementById('flight-adjustments'),pitch=document.getElementById('practice-pitch');
    const before=document.getElementById('app').innerHTML;
    const inert=createStartFlowPanel({enabled:false});inert.show('title');
    const inertUnchanged=before===document.getElementById('app').innerHTML;
    window.uiActions=[];window.flowUi=createStartFlowPanel({enabled:true,onAction:(action,value)=>uiActions.push({action,value})});
    flowUi.setCourses(Object.values(COURSES).filter(course=>['easy','normal','hard'].includes(course.id)).map(course=>({id:course.id,name:course.name,targetCount:course.lights.length,timeHint:'目安 60〜180秒',bestLabel:'自己ベスト 1分24.3秒',previewSvg:createCoursePreviewSVG(course)})));
    flowUi.setSettings({camera:'overlay',inputMethod:'practice',briefingMode:'every',selectedCourseId:'easy'});
    return {inertUnchanged,sameAdjustments:adjustments===document.getElementById('flight-adjustments'),samePitch:pitch===document.getElementById('practice-pitch')};
  });
}
async function show(page,step,data={}){await page.evaluate(({step,data})=>flowUi.show(step,data),{step,data});}
async function contained(page,selector){
  const result=await page.locator(selector).evaluate(element=>{const r=element.getBoundingClientRect();return {shown:!element.hidden&&!!element.getClientRects().length,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth+.5&&r.bottom<=innerHeight+.5,horizontal:element.scrollWidth<=element.clientWidth+1};});
  expect(result,selector).toMatchObject({shown:true,inside:true,horizontal:true});
}

for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}])test(`start screen component and all actual play inputs fit without scrolling ${size.width}x${size.height}`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  expect(await setup(page,size)).toEqual({inertUnchanged:true,sameAdjustments:true,samePitch:true});
  await show(page,'title',{version:'0.1.34'});await contained(page,'#start-flow-start');await contained(page,'#start-flow-title-settings');await contained(page,'#start-flow-title-help');
  await expect(page.locator('#start-flow-version')).toContainText('0.1.34');
  expect(await page.locator('#start-flow-panel').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
  await page.screenshot({path:`test-results/v0130-component-title-${size.width}x${size.height}.png`});
  for(let slide=0;slide<3;slide++){await show(page,'tutorial',{slide});await contained(page,'#start-flow-tutorial-next');await contained(page,'#start-flow-tutorial-skip');await contained(page,'#start-flow-tutorial-text');}
  await show(page,'courses',{selectedCourseId:'easy',camera:'chase'});await expect(page.locator('[data-course-id]')).toHaveCount(3);
  for(const id of ['easy','normal','hard'])await contained(page,`[data-course-id="${id}"]`);
  await contained(page,'#start-flow-course-start');await contained(page,'#start-flow-course-camera');
  await page.screenshot({path:`test-results/v0130-component-courses-${size.width}x${size.height}.png`});
  await show(page,'pose',{inputMethod:'sensor',note:'この持ち方を操作の中立にします。'});
  await page.evaluate(()=>{const notice=document.getElementById('orientation-notice');notice.hidden=false;notice.querySelector('[data-notice-title]').textContent='画面の向きを確認してください';notice.querySelector('[data-notice-copy]').textContent='この端末では、向きを変えたあとに持ち方を合わせ直してから再開してください。';});
  for(const selector of ['#orientation-notice','#start-flow-hold','#start-flow-pose-settings','#start-flow-pose-back'])await contained(page,selector);
  expect(await page.evaluate(()=>{const a=document.getElementById('orientation-notice').getBoundingClientRect(),b=document.getElementById('start-flow-hold').getBoundingClientRect();return a.bottom<=b.top;})).toBe(true);
  await page.evaluate(()=>document.getElementById('orientation-notice').hidden=true);await show(page,'countdown',{number:3});await contained(page,'#start-flow-countdown');
  await show(page,'pause');for(const id of ['start-flow-resume','start-flow-recenter','start-flow-map','start-flow-pause-settings','start-flow-course-exit'])await contained(page,'#'+id);
  await show(page,'settings');await contained(page,'#start-flow-settings-close');await expect(page.locator('#start-flow-input-method')).toHaveValue('sensor');
  await page.locator('#start-flow-input-method').selectOption('practice');await expect.poll(()=>page.evaluate(()=>uiActions.at(-1))).toEqual({action:'input-method',value:'practice'});
  await page.evaluate(()=>{document.getElementById('result-course-time').textContent='1分24.3秒';document.getElementById('result-best-time').textContent='1分24.3秒';document.getElementById('result-best-status').textContent='自己ベスト更新';});
  await show(page,'result');await contained(page,'#result-course-time');await contained(page,'#result-best-time');await contained(page,'#result-copy');
  await page.evaluate(()=>document.getElementById('result-copy-text').hidden=false);await contained(page,'#result-copy-text');await page.evaluate(()=>document.getElementById('result-copy-text').hidden=true);
  await page.evaluate(()=>{const app=document.getElementById('app');app.dataset.phase='running';flowUi.setSettings({inputMethod:'practice',camera:'overlay'});for(const id of ['practice-pitch','practice-steer','practice-twist','throttle-input','pause-button','recenter-button'])document.getElementById(id).disabled=false;document.getElementById('practice-panel').hidden=false;document.getElementById('flight-throttle').hidden=false;flowUi.show('play');});
  await contained(page,'#start-flow-view-button');
  for(const id of ['practice-pitch','practice-steer','practice-twist','throttle-input','pause-button','recenter-button','help-button','practice-neutral','practice-brake'])await contained(page,'#'+id);
  expect(await page.locator('#practice-panel').evaluate(e=>e.scrollHeight<=e.clientHeight+1)).toBe(true);
  for(const id of ['practice-pitch','practice-steer','practice-twist']){const before=await page.locator('#'+id).inputValue();await page.locator('#'+id).press('ArrowRight');expect(+await page.locator('#'+id).inputValue()).toBe(+before+1);await page.locator('#'+id).press('ArrowLeft');await expect(page.locator('#'+id)).toHaveValue(before);}
  await page.screenshot({path:`test-results/v0130-component-play-${size.width}x${size.height}.png`});
  expect(errors).toEqual([]);
});
