import {test,expect} from '@playwright/test';import {writeFile} from 'node:fs/promises';
import {APP_VERSION} from '../src/version.js';import {waitForCountdownThree} from './helpers/countdown.js';
import {chooseFlightCamera} from './helpers/flight-camera-choice.js';
const intersects=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
const evidencePrefix=`.cache/v${APP_VERSION.replaceAll('.','')}${process.env.TWIST_EVIDENCE_STAGE?'-'+process.env.TWIST_EVIDENCE_STAGE:''}-hud`;
const cases=[...['practice','sensor'].flatMap(input=>[{width:390,height:844},{width:360,height:640},{width:844,height:390}].map(size=>({input,size,course:'supersonic'}))),...['easy','sierra10'].flatMap(course=>['practice','sensor'].map(input=>({input,course,size:{width:390,height:844}}))),{input:'practice',course:'easy',mode:'explore',size:{width:390,height:844}}];
async function geometry(page){return page.evaluate(()=>{
 const root=document.getElementById('flight-instruments'),visible=e=>e&&!e.hidden&&e.getClientRects().length&&getComputedStyle(e).display!=='none'&&!e.closest('[hidden]');
 const rect=e=>{if(!visible(e))return null;const r=e.getBoundingClientRect();return r.width&&r.height?{id:e.id,left:r.left,right:r.right,top:r.top,bottom:r.bottom}:null;};
 const bad=[],surfaces=[];
 for(const slot of root.querySelectorAll('.instrument-slot')){if(!visible(slot))continue;const b=slot.getBoundingClientRect(),walk=document.createTreeWalker(slot,NodeFilter.SHOW_TEXT);
  for(let t=walk.nextNode();t;t=walk.nextNode()){if(!t.textContent.trim()||!visible(t.parentElement))continue;const r=document.createRange();r.selectNodeContents(t);for(const q of r.getClientRects())if(q.width&&q.height&&(q.left<b.left-1||q.right>b.right+1||q.top<b.top-1||q.bottom>b.bottom+1))bad.push({slot:slot.id,text:t.textContent.trim(),box:{left:b.left,right:b.right,top:b.top,bottom:b.bottom},textBox:{left:q.left,right:q.right,top:q.top,bottom:q.bottom}});}
 }
 for(const e of root.querySelectorAll('.instrument-reading'))if(visible(e)){const color=root.dataset.layout==='c'?getComputedStyle(e.querySelector('circle')).fill:getComputedStyle(e,'::before').backgroundColor;const alpha=Number(/,\s*([\d.]+)\)$/.exec(color)?.[1]??1);surfaces.push({id:e.id,color,alpha});}
 const rgb=s=>{const c=s.match(/[\d.]+/g).map(Number);return[c[0],c[1],c[2],c[3]??1];},blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
 const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
 const scenes={white:[255,255,255],sky:[220,235,241],ground:[160,76,38],sea:[20,90,130],black:[0,0,0]},contrast=[];
 for(const card of [root,...['cockpit-heading','cockpit-target-height','cockpit-power','cockpit-exit-notice','flight-essential-details','flight-essential-alert'].map(id=>document.getElementById(id))].filter(visible)){
  const walk=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
  for(let t=walk.nextNode();t;t=walk.nextNode()){if(!t.textContent.trim()||!visible(t.parentElement))continue;const style=getComputedStyle(t.parentElement),ink=rgb(style.color),outlined=parseFloat(style.webkitTextStrokeWidth)>0;
   // The adopted design uses a dark outline on values and an uninterrupted
   // dark strip behind labels. Measure the actual adjoining dark treatment.
   const layers=[];for(let e=t.parentElement;e;e=e.parentElement){const c=rgb(getComputedStyle(e).backgroundColor);if(c[3]>0)layers.unshift(c);if(e===card)break;}
   for(const [scene,backdrop]of Object.entries(scenes)){let back=backdrop;for(const layer of layers)back=blend(layer,back);if(outlined)back=blend(rgb(style.webkitTextStrokeColor),back);const front=blend(ink,back),a=lum(front),b=lum(back);contrast.push({id:card.id,text:t.textContent.trim(),scene,outlined,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});}
  }
 }
 const occluded=[],pointer=root.style.pointerEvents;root.style.pointerEvents='auto';
 for(const e of [...root.querySelectorAll('.instrument-label,.instrument-number,.instrument-tick')].filter(visible)){const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(!e.contains(hit))occluded.push({text:e.textContent,cover:hit?.tagName});}root.style.pointerEvents=pointer;
 const plates=[...root.querySelectorAll('.instrument-number')].filter(visible).map(e=>{const r=document.createRange();r.selectNodeContents(e);return {text:e.textContent,width:e.getBoundingClientRect().width,textWidth:r.getBoundingClientRect().width};});
 const g=JSON.parse(root.dataset.geometry),readings=[...root.querySelectorAll('.instrument-reading,.instrument-secondary')].filter(visible).map(e=>({id:e.id,text:e.innerText}));
 return {layout:root.dataset.layout,g,bad,surfaces,contrast,occluded,plates,readings,controls:['radar','bottom-panel','practice-panel','start-flow-view-button','cockpit-power'].map(id=>rect(document.getElementById(id))).filter(Boolean),markers:['guidance-director','guidance-flight-path'].map(id=>rect(document.getElementById(id))).filter(Boolean),viewport:{width:innerWidth,height:innerHeight},scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]};
});}
for(const {input,size,course,mode='flight'}of cases)test(`three translucent HUD layouts ${course} ${mode} ${input} ${size.width}x${size.height}`,async({page})=>{
 test.setTimeout(120000);await page.setViewportSize(size);await page.clock.install();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({input,wide})=>{
  localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:input,camera:'overlay'}));localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,vibration:false}));
  Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true});
  if(input==='sensor'){class Orientation extends Event{static requestPermission(){return Promise.resolve('granted');}}Object.defineProperty(window,'DeviceOrientationEvent',{value:Orientation,configurable:true});Object.defineProperty(screen.orientation,'angle',{get:()=>wide?90:0,configurable:true});setInterval(()=>window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta:45,gamma:0})),40);}
 },{input,wide:size.width>size.height});
 await page.goto('/?course='+course+(mode==='explore'?'&dev=1&mode=explore':''));await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 await page.locator('#start-flow-start').click();await page.locator('#start-flow-course-start').click();await page.locator('#start-flow-hold').click();await page.clock.runFor(120);await waitForCountdownThree(page);await page.clock.runFor(3500);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
 const evidence=[];
 for(const layout of ['a','b','c']){
  if(layout!=='a'){
   await page.locator('#pause-button').click();await page.locator('#start-flow-pause-settings').click();const before=await page.locator('#app').getAttribute('data-position');
   await page.locator('#setting-hudLayout').selectOption(layout);expect(await page.locator('#app').getAttribute('data-position')).toBe(before);
   expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('twist.flight-settings.v1')).hudLayout)).toBe(layout);
   await page.locator('#start-flow-settings-close').click();await page.locator('#start-flow-resume').click();await page.clock.runFor(180);
  }
  for(const camera of mode==='explore'?['overlay']:['overlay','chase','cockpit']){
   if(mode==='flight')await chooseFlightCamera(page,camera);
   await expect(page.locator('#flight-instruments')).toHaveAttribute('data-layout',layout);await expect(page.locator('#app')).toHaveAttribute('data-camera',camera);if(mode==='flight')await expect(page.locator('#app')).toHaveAttribute('data-guidance-ready','true');
   const g=await geometry(page);expect(g.bad.slice(0,8),`${layout} ${camera} text`).toEqual([]);expect(g.surfaces.length).toBeGreaterThanOrEqual(2);for(const s of g.surfaces)expect(s.alpha,s.color).toBeCloseTo(.5,3);
   for(const p of g.plates)expect(p.width,`${p.text} backing hugs its text`).toBeLessThanOrEqual(p.textWidth+1);
   expect(g.contrast.length).toBeGreaterThan(0);expect(g.contrast.filter(c=>c.ratio<4.5).slice(0,8),`${layout} ${camera} contrast`).toEqual([]);
   expect(g.occluded,`${layout} ${camera} text paint order`).toEqual([]);
   for(const r of g.g.groups){expect(r.left).toBeGreaterThanOrEqual(0);expect(r.top).toBeGreaterThanOrEqual(0);expect(r.right).toBeLessThanOrEqual(size.width);expect(r.bottom).toBeLessThanOrEqual(size.height);for(const c of g.controls)expect(intersects(r,c),`${layout} ${camera} overlaps ${c.id}`).toBe(false);for(const m of g.markers)expect(intersects(r,m),`${layout} ${camera} overlaps ${m.id}`).toBe(false);}
   expect(g.scroll[0]).toBeLessThanOrEqual(size.width+1);expect(g.scroll[1]).toBeLessThanOrEqual(size.height+1);evidence.push({layout,camera,...g});
   await page.screenshot({path:`${evidencePrefix}-${course}-${mode}-${input}-${layout}-${camera}-${size.width}x${size.height}.png`});
  }
 }
 await writeFile(`${evidencePrefix}-${course}-${mode}-${input}-${size.width}x${size.height}.json`,JSON.stringify({evidence,errors},null,2));expect(errors).toEqual([]);
 await page.reload();await expect(page.locator('#setting-hudLayout')).toHaveValue('c');
});
