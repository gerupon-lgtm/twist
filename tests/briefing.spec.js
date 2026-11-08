import {test,expect} from '@playwright/test';

async function fixture(page){
 await page.addInitScript(()=>{
  window.briefingSoundCalls=0;window.briefingVibrationCalls=0;
  Object.defineProperty(navigator,'vibrate',{configurable:true,value:()=>{window.briefingVibrationCalls++;return true;}});
  for(const key of ['AudioContext','webkitAudioContext'])if(window[key]){const Original=window[key];window[key]=new Proxy(Original,{construct(target,args){window.briefingSoundCalls++;return Reflect.construct(target,args);}});}
 });
 await page.route('**/__briefing_fixture.html',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/src/style.css"></head><body><main id="app" class="app" data-phase="paused" data-play-mode="flight"></main></body></html>'}));
 await page.goto('/__briefing_fixture.html');
 await page.evaluate(async()=>{
  const {createBriefingPanel}=await import('/src/briefing-panel.js'),{COURSES}=await import('/src/course.js');
  window.briefingClosed=[];window.briefingCourses=COURSES;
  window.briefingPanel=createBriefingPanel({onClose:record=>window.briefingClosed.push(record)});
 });
}
/** A real panel callback may finish its SVG write just before the draw deadline.
 * Keep that small monotonic clock advance deterministic instead of waiting for
 * a native frame to happen to land within 0.2 ms of the 3.6 second boundary. */
async function boundaryClockFixture(page){
 await page.addInitScript(()=>{
  const clock={time:0,armed:false,crossings:0,inFrame:false,nextFrame:0,frames:new Map()};
  window.briefingBoundaryClock=clock;
  Object.defineProperty(performance,'now',{configurable:true,value:()=>clock.time});
  window.requestAnimationFrame=callback=>{const id=++clock.nextFrame;clock.frames.set(id,callback);return id;};
  window.cancelAnimationFrame=id=>clock.frames.delete(id);
  // Resize is covered by the layout cases; it must not supply a second render
  // that would conceal a lost final animation frame in this isolated clock case.
  window.ResizeObserver=class{observe(){}disconnect(){}};
  const setAttribute=SVGElement.prototype.setAttribute;
  SVGElement.prototype.setAttribute=function(name,value){
   const result=setAttribute.call(this,name,value);
   if(clock.armed&&clock.inFrame&&name==='stroke-dashoffset'&&this.classList.contains('briefing-route')&&Number(value)>0&&Number(value)<.001){
    clock.armed=false;clock.crossings++;clock.time=3600.1;
   }
   return result;
  };
  window.stepBriefingBoundaryFrame=()=>{
   const entry=clock.frames.entries().next().value;if(!entry)return false;
   const [id,callback]=entry;clock.frames.delete(id);clock.inFrame=true;
   try{callback(clock.time);}finally{clock.inFrame=false;}
   return true;
  };
  window.briefingFixtureHidden=false;
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.briefingFixtureHidden});
 });
 await fixture(page);
 await page.evaluate(()=>{
  window.briefingPanel.open({course:window.briefingCourses.easy,origin:'start'});
  Object.assign(window.briefingBoundaryClock,{time:3599.9,armed:true});
  if(!window.stepBriefingBoundaryFrame())throw new Error('The real briefing animation callback was not queued');
 });
 expect(await page.evaluate(()=>window.briefingBoundaryClock.crossings)).toBe(1);
}
async function expectCompletedBoundaryMap(page){
 await expect(page.locator('#briefing-panel')).toHaveAttribute('data-progress','1');
 await expect(page.locator('#briefing-panel')).toHaveAttribute('data-draw-complete','true');
 await expect(page.locator('#briefing-map .briefing-route')).toHaveAttribute('stroke-dashoffset','0');
 await expect(page.locator('#briefing-map .briefing-trace-tip')).toHaveAttribute('visibility','hidden');
 await expect(page.locator('#briefing-skip')).toHaveText('CONTINUE');
 // The fixture owns rAF, so activate the real button handler without waiting
 // for Playwright's separate animation-frame actionability poll.
 await page.locator('#briefing-skip').evaluate(button=>button.click());
 expect(await page.evaluate(()=>window.briefingClosed)).toHaveLength(1);
 expect(await page.evaluate(()=>window.briefingClosed[0])).toMatchObject({origin:'start',skipped:false,closeMethod:'continue'});
 expect(await page.evaluate(()=>window.briefingPanel.close())).toBeNull();
 expect(await page.evaluate(()=>window.briefingClosed)).toHaveLength(1);
 await page.evaluate(()=>window.briefingPanel.dispose());
}
async function bounds(page){
 return page.evaluate(()=>{
  const map=document.getElementById('briefing-map').getBoundingClientRect(),overview=document.getElementById('briefing-overview').getBoundingClientRect(),panel=document.getElementById('briefing-panel').getBoundingClientRect();
  const leaves=[...document.querySelectorAll('#briefing-map text,#briefing-overview text,.briefing-map-reference text,#briefing-overview-scale text,.briefing-points b,.briefing-points li>span,#briefing-title,.briefing-course-intro,.briefing-route-facts,#briefing-skip,.briefing-footer-copy>span,.briefing-key>span,.briefing-context figcaption')]
   .filter(element=>element.getClientRects().length).map(element=>({text:element.textContent.trim(),limit:element.closest('svg')?.getBoundingClientRect().toJSON()??null,box:element.getBoundingClientRect().toJSON()}));
  const shapeBounds=(selector,limit)=>[...document.querySelectorAll(selector)].map(element=>({text:element.getAttribute('data-map-point')??element.getAttribute('data-landmark')??element.getAttribute('class'),limit:limit.toJSON(),box:element.getBoundingClientRect().toJSON()}));
  const mainShapes=shapeBounds('#briefing-map [data-map-point],#briefing-map .briefing-route-base,#briefing-map .briefing-ab-lane',map);
  const contextShapes=shapeBounds('#briefing-overview .briefing-boundary,#briefing-overview .briefing-overview-route,#briefing-overview [data-landmark],#briefing-overview .briefing-context-current',overview);
  const overlaps=[];for(const row of document.querySelectorAll('.briefing-points li')){const a=row.children[0].getBoundingClientRect(),b=row.children[1].getBoundingClientRect();if(a.right>b.left-1)overlaps.push(row.textContent);}
  const point=document.querySelector('#briefing-map [data-map-point="current"]');
  return {map:map.toJSON(),panel:panel.toJSON(),leaves:[...leaves,...mainShapes,...contextShapes],overlaps,current:point?.getBoundingClientRect().toJSON(),currentHeading:point?.getAttribute('data-heading'),collected:document.querySelectorAll('#briefing-map .briefing-target[data-collected="true"]').length,width:innerWidth,height:innerHeight};
 });
}
function fits(result){
 expect(result.overlaps).toEqual([]);
 for(const leaf of result.leaves){const limit=leaf.limit??{left:0,top:0,right:result.width,bottom:result.height};
  expect(leaf.box.left,leaf.text).toBeGreaterThanOrEqual(limit.left-1);expect(leaf.box.top,leaf.text).toBeGreaterThanOrEqual(limit.top-1);
  expect(leaf.box.right,leaf.text).toBeLessThanOrEqual(limit.right+1);expect(leaf.box.bottom,leaf.text).toBeLessThanOrEqual(limit.bottom+1);
 }
}

for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}])test(`full briefing labels and paused outside position fit${size.width}x${size.height}`,async({page})=>{
 await page.setViewportSize(size);await fixture(page);
 await page.evaluate(()=>window.briefingPanel.open({course:window.briefingCourses.hard,origin:'start'}));
 await expect(page.locator('#briefing-panel')).toBeVisible();await expect(page.locator('.briefing-points [data-briefing-point^="tgt-"]')).toHaveCount(8);await expect(page.locator('#briefing-map [data-map-point^="tgt-"]')).toHaveCount(8);
 await expect(page.locator('#briefing-map .briefing-route')).toHaveCount(1);await expect(page.locator('#briefing-overview .briefing-boundary')).toHaveCount(1);await expect(page.locator('#briefing-overview [data-landmark]')).toHaveCount(5);
 await expect(page.locator('.briefing-map-reference .briefing-north text')).toHaveText('N');await expect(page.locator('.briefing-map-reference .briefing-scale')).toHaveCount(1);await expect(page.locator('#briefing-overview-scale .briefing-context-scale-label')).toHaveCount(1);
 fits(await bounds(page));await page.screenshot({path:`.cache/v0137-briefing-${size.width}x${size.height}.png`});
 await page.evaluate(()=>{window.briefingPanel.close();window.briefingPanel.open({course:window.briefingCourses.hard,origin:'pause',state:{position:{x:2200,y:31,z:-1700},heading:Math.PI/2,collected:4}});});
 const paused=await bounds(page);fits(paused);expect(paused.collected).toBe(4);expect(Number(paused.currentHeading)).toBeCloseTo(Math.PI/2,9);
 expect(await page.evaluate(()=>window.briefingPanel.snapshot())).toMatchObject({origin:'pause',progress:1,drawSeconds:0});await expect(page.locator('#briefing-skip')).toHaveText('CONTINUE');await expect(page.locator('#briefing-map .briefing-route')).toHaveAttribute('stroke-dashoffset','0');
 expect(paused.current.left).toBeGreaterThanOrEqual(paused.map.left);expect(paused.current.right).toBeLessThanOrEqual(paused.map.right);expect(paused.current.top).toBeGreaterThanOrEqual(paused.map.top);expect(paused.current.bottom).toBeLessThanOrEqual(paused.map.bottom);
 await expect(page.locator('.briefing-you-key')).toBeVisible();await page.evaluate(()=>window.briefingPanel.dispose());
 expect(await page.evaluate(()=>[window.briefingSoundCalls,window.briefingVibrationCalls])).toEqual([0,0]);
});

test('map draws silently, stays after3.6seconds, and closes immediately by tap or SKIP',async({page})=>{
 await page.clock.install();await fixture(page);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 await page.evaluate(()=>window.briefingPanel.open({course:window.briefingCourses.easy,origin:'start'}));
 await page.clock.runFor(1800);expect((await page.evaluate(()=>window.briefingPanel.snapshot())).progress).toBeCloseTo(.5,1);
 await page.clock.runFor(2000);await expect(page.locator('#briefing-skip')).toHaveText('CONTINUE');await expect(page.locator('#briefing-map .briefing-route')).toHaveAttribute('stroke-dashoffset','0');await page.screenshot({path:'.cache/v0137-briefing-ready.png'});await page.clock.runFor(4000);await expect(page.locator('#briefing-panel')).toBeVisible();
 await page.locator('#briefing-skip').click();let record=await page.evaluate(()=>window.briefingClosed.at(-1));expect(record).toMatchObject({origin:'start',skipped:false,closeMethod:'continue'});expect(record.seconds).toBeGreaterThan(7);
 await page.evaluate(()=>window.briefingPanel.open({course:window.briefingCourses.normal,origin:'start'}));await page.locator('#briefing-skip').click();record=await page.evaluate(()=>window.briefingClosed.at(-1));expect(record).toMatchObject({skipped:true,closeMethod:'skip'});
 await page.evaluate(()=>window.briefingPanel.open({course:window.briefingCourses.hard,origin:'pause'}));expect(await page.evaluate(()=>window.briefingPanel.snapshot())).toMatchObject({progress:1,drawSeconds:0});await expect(page.locator('#briefing-skip')).toHaveText('CONTINUE');await page.locator('.briefing-course-name').click();record=await page.evaluate(()=>window.briefingClosed.at(-1));expect(record).toMatchObject({origin:'pause',skipped:false,closeMethod:'tap'});
 expect(await page.evaluate(()=>[window.briefingSoundCalls,window.briefingVibrationCalls])).toEqual([0,0]);await page.evaluate(()=>window.briefingPanel.dispose());
});

test('briefing completes when its SVG write crosses the final animation deadline',async({page})=>{
 await boundaryClockFixture(page);
 await page.evaluate(()=>{for(let i=0;i<3;i++)if(!window.stepBriefingBoundaryFrame())break;});
 await expectCompletedBoundaryMap(page);
});

test('briefing resumes a completed boundary frame without counting hidden time',async({page})=>{
 await boundaryClockFixture(page);
 const record=await page.evaluate(()=>{
  window.briefingFixtureHidden=true;document.dispatchEvent(new Event('visibilitychange'));
  const before=window.briefingPanel.snapshot();window.briefingBoundaryClock.time+=5000;
  const hidden=window.briefingPanel.snapshot();
  window.briefingFixtureHidden=false;document.dispatchEvent(new Event('visibilitychange'));
  return {before,hidden,resumed:window.briefingPanel.snapshot(),queuedFrames:window.briefingBoundaryClock.frames.size};
 });
 expect(record.before.seconds).toBeCloseTo(3.6001,8);
 expect(record.hidden.seconds).toBeCloseTo(record.before.seconds,8);
 expect(record.resumed.seconds).toBeCloseTo(record.before.seconds,8);
 expect(record.resumed.progress).toBe(1);
 expect(record.queuedFrames).toBe(0);
 await expectCompletedBoundaryMap(page);
});

test('future40km map uses the same panel and a real km scale, while preview SVG is safe and bounded',async({page})=>{
 await fixture(page);await page.evaluate(async()=>{
  const {createCoursePreviewSVG}=await import('/src/briefing-model.js');
  const course={id:'future-fixture',name:'40km fixture only',startHeading:Math.PI/2,arena:{bounds:{minX:-20000,maxX:20000,minZ:-20000,maxZ:20000}},start:{x:-18000,y:1500,z:0},lights:[{x:-12000,y:1500,z:0},{x:-6000,y:1800,z:0},{x:0,y:2000,z:0},{x:6000,y:1800,z:0},{x:12000,y:1500,z:0}],exit:{x:18000,y:1500,z:0},abStraights:[{id:'fixture-ab',from:{x:-17000,y:1500,z:0},to:{x:16000,y:1500,z:0},width:400}]};
  window.briefingPanel.open({course});const preview=document.createElement('div');preview.id='briefing-fixture-preview';preview.innerHTML=createCoursePreviewSVG(course);document.getElementById('app').append(preview);
 });
 fits(await bounds(page));await expect(page.locator('.briefing-map-reference .briefing-scale text')).toHaveText(/km/);await expect(page.locator('#briefing-overview-scale .briefing-context-scale-label')).toHaveText(/km/);await expect(page.locator('.briefing-map-reference .briefing-north text')).toHaveText('N');await expect(page.locator('.briefing-points [data-briefing-point="tgt-3"]')).toContainText('▲2000m');
 await expect(page.locator('#briefing-fixture-preview svg')).toHaveAttribute('viewBox','0 0 160 92');await page.evaluate(()=>window.briefingPanel.dispose());
});

test('hidden time never advances the visible3.6second start route',async({page})=>{
 await page.clock.install();await fixture(page);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 await page.evaluate(()=>{window.briefingFixtureHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.briefingFixtureHidden});window.briefingPanel.open({course:window.briefingCourses.easy,origin:'start'});});
 await page.clock.runFor(900);const before=await page.evaluate(()=>{window.briefingFixtureHidden=true;document.dispatchEvent(new Event('visibilitychange'));return window.briefingPanel.snapshot();});expect(before.progress).toBeCloseTo(.25,1);expect(before.drawSeconds).toBe(3.6);
 await page.clock.runFor(5000);const hidden=await page.evaluate(()=>window.briefingPanel.snapshot());expect(hidden.seconds).toBeCloseTo(before.seconds,8);expect(hidden.progress).toBeCloseTo(before.progress,8);await expect(page.locator('#briefing-skip')).toHaveText('SKIP');
 await page.evaluate(()=>{window.briefingFixtureHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(2800);await expect(page.locator('#briefing-skip')).toHaveText('CONTINUE');await expect(page.locator('#briefing-panel')).toBeVisible();
 const resumed=await page.evaluate(()=>window.briefingPanel.snapshot());expect(resumed.seconds).toBeGreaterThanOrEqual(3.6);expect(resumed.seconds).toBeLessThan(4);expect(resumed.progress).toBe(1);
 expect(await page.evaluate(()=>[window.briefingSoundCalls,window.briefingVibrationCalls])).toEqual([0,0]);await page.evaluate(()=>window.briefingPanel.dispose());
});

test('reduced motion opens the completed start map immediately without a hidden draw timeline',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await fixture(page);await page.evaluate(()=>window.briefingPanel.open({course:window.briefingCourses.hard,origin:'start'}));
 expect(await page.evaluate(()=>window.briefingPanel.snapshot())).toMatchObject({origin:'start',progress:1,drawSeconds:0});await expect(page.locator('#briefing-skip')).toHaveText('CONTINUE');await expect(page.locator('#briefing-map .briefing-route')).toHaveAttribute('stroke-dashoffset','0');await expect(page.locator('#briefing-map .briefing-trace-tip')).toHaveAttribute('visibility','hidden');
 await page.locator('#briefing-skip').click();expect(await page.evaluate(()=>window.briefingClosed.at(-1))).toMatchObject({origin:'start',skipped:false,closeMethod:'continue'});expect(await page.evaluate(()=>[window.briefingSoundCalls,window.briefingVibrationCalls])).toEqual([0,0]);await page.evaluate(()=>window.briefingPanel.dispose());
});
