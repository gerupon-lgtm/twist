import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {waitForCountdownThree} from './helpers/countdown.js';
import {APP_VERSION} from '../src/version.js';
for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}])test(`HUD numeric limits remain fully inside their frames ${size.width}x${size.height}`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize(size);await page.clock.install();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'overlay'}));
  localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
  localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,vibration:false}));
  Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true});
 });
 await page.goto('/?course=supersonic');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
 await page.locator('#start-flow-start').click();await page.locator('#start-flow-course-start').click();await page.locator('#start-flow-hold').click();await waitForCountdownThree(page);await page.clock.runFor(3500);
 await expect(page.locator('#app')).toHaveAttribute('data-phase','running');const rows=[];
 for(const camera of ['overlay','chase','cockpit']){
  if(camera!=='overlay'){await page.locator('#start-flow-view-button').click();await page.clock.runFor(100);}
  rows.push(...await page.evaluate(async({camera})=>{
   const [{updateCockpitHud},{updateEssentialHud},{updateTargetHeightPanel},{convertSpeed},{formatSupersonicAltitude},{formatNavigationDistance}]=await Promise.all([import('/src/cockpit-hud.js'),import('/src/essential-hud.js'),import('/src/target-height-panel.js'),import('/src/speed-units.js'),import('/src/supersonic-presentation.js'),import('/src/supersonic-units.js')]);
   const moduleUrl=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/instrument-hud.js')?.name??'/src/instrument-hud.js';
   const {createInstrumentHud}=await import(moduleUrl);const instruments=createInstrumentHud();
   const $=id=>document.getElementById(id),rows=[];
   const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]');
   for(const layout of ['a','b','c'])for(const guided of [true,false])for(const font of ['', 'monospace'])for(const direction of [-1,1])for(const sonic of [false,true])for(const language of ['en','ja'])for(const unit of ['km/h','m/s','kt']){
    $('cockpit-hud').style.fontFamily=font;
    instruments.root.style.fontFamily=font;
    const state={mode:'flight',speed:sonic?680:75,position:{x:0,y:sonic?12500:999.9,z:0},altitude:sonic?12500:999.9,groundClearance:sonic?12500:999.9,
     heading:359*Math.PI/180,controlPitch:0,verticalSpeed:direction*(sonic?680:75),throttle:1,fieldOfView:{vertical:64},targetPosition:{x:0,y:sonic?1500:30,z:-300},targetRadius:sonic?40:4,velocity:{x:0,y:0,z:-1},...(sonic?{supersonic:{mach:2}}:{})};
    const guide=updateTargetHeightPanel(state,{phase:'running',visibility:'assisted',enabled:guided,cockpit:camera==='cockpit',language,inlineParent:$('flight-essential-height')});
    $('speed-value').textContent=convertSpeed(state.speed,unit).toFixed(1);$('speed-unit').textContent=unit;$('altitude-value').textContent=sonic?formatSupersonicAltitude(state.altitude):state.altitude.toFixed(1);
    $('target-distance').textContent=formatNavigationDistance(sonic?56568:999,sonic,{space:true});$('flight-essential-speed-label').textContent=language==='ja'?'速度':'SPD';$('ground-clearance').textContent=language==='ja'?'現在高度':'ALT';
    $('supersonic-mach').textContent='M 2.00';$('supersonic-g').textContent='G 12.0';$('supersonic-mach-g').querySelector('small').textContent='SUPERSONIC';$('afterburner-hud').querySelector('output').textContent=sonic?'∞':'100';$('throttle-value').textContent='120%';
    updateEssentialHud(state,{phase:'running',mode:'flight',camera,language});updateCockpitHud(state,camera==='cockpit',undefined,{speedUnit:unit,hudLanguage:language},guide);
    instruments.update(state,{phase:'running',mode:'flight',camera,settings:{hudLayout:layout,speedUnit:unit},language,heightGuide:guide});
    const frames=['cockpit-speed','cockpit-altitude','cockpit-vario','cockpit-heading','cockpit-target-height','cockpit-exit-notice','cockpit-power','flight-essential-speed','flight-essential-altitude','flight-essential-vario','flight-essential-details','flight-essential-alert','supersonic-mach-g','target-edge-marker','cockpit-objective-label','afterburner-hud','.navigation','.throttle-heading'],bad=[];
    const shown=$(camera==='cockpit'?'cockpit-speed':'flight-essential-speed').querySelector('strong');if(shown.textContent!==convertSpeed(state.speed,unit).toFixed(1))bad.push({id:shown.id,reason:'displayed speed differs from requested fixture'});
    for(const id of frames){const frame=$(id)||document.querySelector(id);if(!frame||!visible(frame))continue;const bounds=frame.getBoundingClientRect(),walker=document.createTreeWalker(frame,NodeFilter.SHOW_TEXT);
     for(let text=walker.nextNode();text;text=walker.nextNode()){if(!text.textContent.trim()||!visible(text.parentElement))continue;const range=document.createRange();range.selectNodeContents(text);
      for(const r of range.getClientRects())if(r.width&&r.height&&(r.left<bounds.left-1||r.right>bounds.right+1||r.top<bounds.top-1||r.bottom>bounds.bottom+1))bad.push({id,text:text.textContent.trim(),bounds:{left:bounds.left,right:bounds.right,top:bounds.top,bottom:bounds.bottom},textRect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom}});
      const value=text.parentElement.closest('.cockpit-tape strong');if(value){const r=value.getBoundingClientRect();if(range.getBoundingClientRect().width>r.width+1)bad.push({id,text:text.textContent.trim(),reason:'value wider than its ruled box'});}
     }
    }
    rows.push({layout,camera,guided,sonic,language,unit,font,direction,speed:state.speed,bad});
   }return rows;
  },{camera}));
  await page.screenshot({path:`.cache/v${APP_VERSION.replaceAll('.','')}-numeric-fit-${camera}-${size.width}x${size.height}.png`});
 }
 await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-numeric-fit-${size.width}x${size.height}.json`,JSON.stringify({size,rows,errors},null,2));
 const bad=rows.flatMap(r=>r.bad.map(b=>({camera:r.camera,sonic:r.sonic,language:r.language,unit:r.unit,...b})));expect(bad.slice(0,12),`${bad.length} overflowing text runs`).toEqual([]);expect(errors).toEqual([]);
});
