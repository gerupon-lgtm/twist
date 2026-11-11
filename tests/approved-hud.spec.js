import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {waitForCountdownThree} from './helpers/countdown.js';
import {APP_VERSION} from '../src/version.js';
const cases=[
 {width:390,height:844,input:'sensor',course:'easy'},
 {width:390,height:844,input:'sensor',course:'supersonic'},
 {width:390,height:844,input:'sensor',course:'sierra10'},
 {width:390,height:844,input:'sensor',course:'sierra50'},
 {width:390,height:844,input:'practice',course:'easy'},
 {width:360,height:640,input:'sensor',course:'easy'},
 {width:360,height:640,input:'practice',course:'supersonic'},
 {width:360,height:640,input:'practice',course:'sierra50'},
 {width:844,height:390,input:'sensor',course:'easy'},
 {width:844,height:390,input:'practice',course:'supersonic'},
];
const overlap=(a,b)=>a.left<b.right-.5&&a.right>b.left+.5&&a.top<b.bottom-.5&&a.bottom>b.top+.5;
async function boot(page,c,camera='chase'){
 await page.setViewportSize({width:c.width,height:c.height});await page.clock.install();
 await page.addInitScript(({input,wide,camera})=>{
  localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:input,camera}));
  localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
  localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,vibration:false}));
  Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true});
  if(input==='sensor'){class Orientation extends Event{static requestPermission(){return Promise.resolve('granted');}}Object.defineProperty(window,'DeviceOrientationEvent',{value:Orientation,configurable:true});Object.defineProperty(screen.orientation,'angle',{get:()=>wide?90:0,configurable:true});setInterval(()=>window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta:45,gamma:0})),40);}
 },{input:c.input,wide:c.width>c.height,camera});
 await page.goto(`/?course=${c.course}&camera=${camera}`);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 await page.locator('#start-flow-start').click();await expect(page.locator('#start-flow-course-camera [data-flow-value=overlay]')).toBeVisible();
 await page.locator('#start-flow-course-start').click();await page.locator('#start-flow-hold').click();await page.clock.runFor(120);await waitForCountdownThree(page);await page.clock.runFor(3500);
 await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
}
async function measure(page){return page.evaluate(()=>{
 const rect=e=>{if(!e||!e.getClientRects().length)return null;const r=e.getBoundingClientRect();return r.width&&r.height?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,centerX:r.left+r.width/2,centerY:r.top+r.height/2}:null;};
 const camera=document.getElementById('app').dataset.camera,root=document.getElementById('flight-instruments');
 const text=[];for(const e of root.querySelectorAll('.instrument-number,.instrument-tick,.instrument-label')){const r=rect(e);if(r)text.push({text:e.textContent,box:r,parent:rect(e.closest('.instrument-slot')),stroke:getComputedStyle(e).webkitTextStrokeWidth,color:getComputedStyle(e).color});}
 return {camera,fixed:{heading:rect(document.getElementById('guidance-heading')),target:rect(document.getElementById(camera==='cockpit'?'cockpit-target-height':'flight-essential-details')),radar:rect(document.getElementById('radar')),speed:rect(document.getElementById('instrument-speed-slot')),altitude:rect(document.getElementById('instrument-altitude-slot')),mach:rect(document.getElementById('instrument-mach-slot')),vario:rect(document.getElementById('instrument-vario-slot')),controls:rect(document.getElementById('bottom-panel')),view:rect(document.getElementById('start-flow-view-button'))},
  groups:JSON.parse(root.dataset.geometry).groups,text,craft:{x:parseFloat(document.getElementById('app').style.getPropertyValue('--craft-screen-x')),y:parseFloat(document.getElementById('app').style.getPropertyValue('--craft-screen-y'))},buttons:['pause-button','recenter-button','start-flow-view-button','help-button','practice-neutral','practice-brake','throttle-input','practice-pitch','practice-steer','practice-twist'].map(id=>({id,box:rect(document.getElementById(id))})),scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]};
});}
for(const c of cases)test(`approved shared HUD ${c.course} ${c.input} ${c.width}x${c.height}`,async({page})=>{
 test.setTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await boot(page,c);const rows=[];
 for(const layout of ['a','b','c']){
  if(layout!=='a'){await page.locator('#pause-button').click();await page.locator('#start-flow-pause-settings').click();await page.locator('#setting-hudLayout').selectOption(layout);await page.locator('#start-flow-settings-close').click();await page.locator('#start-flow-resume').click();await page.clock.runFor(180);}
  const pair=[];
  for(const camera of ['chase','cockpit']){
   if((await page.locator('#app').getAttribute('data-camera'))!==camera){await page.locator('#start-flow-view-button').click();await page.clock.runFor(180);}
   const g=await measure(page);expect(g.camera).toBe(camera);await expect(page.locator('#app')).toHaveAttribute('data-guidance-ready','true');expect(g.fixed.heading.centerX).toBeCloseTo(c.width/2,1);expect(g.fixed.target.centerX).toBeCloseTo(c.width/2,1);expect(g.fixed.radar.width).toBe(100);expect(g.fixed.radar.height).toBe(100);
   expect(overlap(g.fixed.heading,g.fixed.radar)).toBe(false);expect(overlap(g.fixed.target,g.fixed.radar)).toBe(false);
   expect(g.scroll).toEqual([c.width,c.height]);
   for(const item of g.text){expect(item.box.left,item.text).toBeGreaterThanOrEqual(item.parent.left-1);expect(item.box.right,item.text).toBeLessThanOrEqual(item.parent.right+1);}
   const buttons=g.buttons.filter(b=>b.box);for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++)expect(overlap(buttons[i].box,buttons[j].box),buttons[i].id+'/'+buttons[j].id).toBe(false);
   for(const frame of g.groups)for(const obstacle of [g.fixed.radar,g.fixed.controls,g.fixed.view])expect(overlap(frame,obstacle),'HUD overlaps controls/radar').toBe(false);
   if(camera==='chase'){expect(g.craft.y).toBeGreaterThan(c.height*.55);expect(Math.abs(g.craft.x-c.width/2)).toBeLessThan(1);}
   pair.push(g);rows.push({layout,...g});await page.screenshot({path:`.cache/v${APP_VERSION.replaceAll('.','')}-approved-${c.course}-${c.input}-${layout}-${camera}-${c.width}x${c.height}.png`});
  }
  for(const key of Object.keys(pair[0].fixed)){if(!pair[0].fixed[key]||!pair[1].fixed[key]){expect(pair[1].fixed[key],layout+' '+key).toEqual(pair[0].fixed[key]);continue;}for(const dimension of ['left','top','width','height'])expect(pair[1].fixed[key][dimension],layout+' '+key).toBeCloseTo(pair[0].fixed[key][dimension],1);}
 }
 expect(errors).toEqual([]);await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-approved-${c.course}-${c.input}-${c.width}x${c.height}.json`,JSON.stringify({rows,errors},null,2));
});
test('outside view is chosen only at course entry and remains isolated during flight',async({page})=>{
 await boot(page,cases[0],'overlay');await expect(page.locator('#start-flow-view-button')).toBeHidden();await page.locator('#pause-button').click();await expect(page.locator('#start-flow-pause-camera')).toBeHidden();
 await page.locator('#start-flow-course-exit').click();await page.locator('#start-flow-confirm-exit').click();await expect(page.locator('#start-flow-course-camera [data-flow-value=overlay]')).toBeVisible();await page.locator('#start-flow-course-camera [data-flow-value=chase]').click();await expect(page.locator('#app')).toHaveAttribute('data-camera','chase');
});

test('disabling the director keeps the shared upper layout unchanged',async({page})=>{
 await boot(page,cases[0]);const before=await measure(page);
 await page.locator('#pause-button').click();await page.locator('#start-flow-pause-settings').click();
 const field=page.locator('#setting-flightDirector');await field.evaluate(e=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await field.uncheck();
 await page.locator('#start-flow-settings-close').click();await page.locator('#start-flow-resume').click();await page.clock.runFor(180);
 await expect(page.locator('#guidance-director')).toBeHidden();
 for(const camera of ['chase','cockpit']){
  if((await page.locator('#app').getAttribute('data-camera'))!==camera){await page.locator('#start-flow-view-button').click();await page.clock.runFor(180);}
  const after=await measure(page);for(const key of ['radar','target'])expect(after.fixed[key]).toEqual(before.fixed[key]);
  const nav=await page.locator('.navigation').boundingBox();expect(nav.y+nav.height).toBe(42);
 }
});
