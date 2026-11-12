import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {APP_VERSION} from '../src/version.js';

for(const camera of ['chase','cockpit'])test(`supersonic quiet mix keeps music and delivers stronger approach haptics in ${camera}`,async({page})=>{
 test.setTimeout(45000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(camera=>{
  localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera}));
  localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
  localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:true,bgm:true,sfx:true,speedSound:true,vibration:true,engineVibration:true,musicEngine:'scc'}));
  Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
  window.quietVibrations=[];Object.defineProperty(navigator,'vibrate',{value:pattern=>{quietVibrations.push(pattern);return true;},configurable:true});
 },camera);
 await page.goto(`/?course=supersonic&camera=${camera}&v=${APP_VERSION}`);
 await expect(page.locator('.version b')).toHaveText('v'+APP_VERSION);
 await page.locator('#start-flow-start').click();await page.locator('#start-flow-course-start').click();await page.locator('#start-flow-hold').click();
 await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:15000});
 const audio=()=>page.locator('#feedback-diagnostics').evaluate(el=>JSON.parse(el.dataset.audio??'null'));
 await page.locator('#throttle-input').press('End');
 await expect.poll(async()=>Boolean((await audio())?.sonic?.accepted>=1),{timeout:18000}).toBe(true);
 await expect.poll(async()=>(await audio())?.speedSound?.reason,{timeout:10000}).toBe('supersonic');
 await expect.poll(async()=>(await audio())?.musicActive).toBe(true);
 const vibrations=await page.evaluate(()=>quietVibrations),result=await audio();
 expect(vibrations.some(p=>Array.isArray(p)&&p.length===8&&p.reduce((sum,n,i)=>sum+(i%2===0?n:0),0)>=160)).toBe(true);
 expect(vibrations.some(p=>Array.isArray(p)&&p.join(',')==='280,45,200')).toBe(true);
 expect(result.speedSound.enabled).toBe(false);expect(result.sonic.accepted).toBe(1);
 await page.locator('#pause-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
 await expect.poll(async()=>(await audio())?.contextState).toBe('suspended');expect(await page.evaluate(()=>quietVibrations.at(-1))).toBe(0);
 expect(errors).toEqual([]);
 await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-${process.env.TWIST_EVIDENCE_STAGE??'built'}-quiet-flight-${camera}.json`,JSON.stringify({camera,result,vibrations,errors},null,2));
});
