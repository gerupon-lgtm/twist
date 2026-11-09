import {test,expect} from '@playwright/test';import {writeFile} from 'node:fs/promises';import {waitForCountdownThree} from './helpers/countdown.js';import {APP_VERSION} from '../src/version.js';
for(const camera of ['overlay','chase','cockpit'])test(`actual offset gate capture keeps displayed director steady in ${camera}`,async({page})=>{
 test.setTimeout(90000);await page.clock.install();await page.addInitScript(camera=>{
 localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera}));localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,bgm:false,vibration:false}));Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true});
 },camera);
 await page.goto('/?course=supersonic&camera='+camera);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#start-flow-start').click();await page.locator('#start-flow-course-start').click();await page.locator('#start-flow-hold').click();await waitForCountdownThree(page);await page.clock.runFor(3100);
 await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
 const input=async value=>page.locator('#practice-steer').evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 await input(5);await page.clock.runFor(300);await input(0);await page.locator('#throttle-input').press('End');
 const trace=[];let passed=false;
 for(let i=0;i<280;i++){await page.clock.runFor(80);const row=await page.locator('#app').evaluate(el=>{const d=el.dataset,a=document.getElementById('guidance-director');const r=a.getBoundingClientRect();return {sonic:JSON.parse(d.supersonic),position:JSON.parse(d.position),direction:JSON.parse(d.guidanceDirection??'null'),ready:d.guidanceReady==='true',pixel:{x:r.x+r.width/2,y:r.y+r.height/2},mode:document.getElementById('guidance-panel').dataset.mode};});trace.push(row);if(row.sonic.activeGateIndex===1){passed=true;break;}}
 expect(passed).toBe(true);expect(trace.at(-1).sonic.gateResults[0].lastCrossingRadialDistance).toBeGreaterThan(1);expect(trace.at(-1).sonic.gateResults[0].missCount).toBe(0);
 const near=trace.filter(r=>Math.abs(r.position.z-12000)<600);expect(near.length).toBeGreaterThan(5);
 for(let i=1;i<near.length;i++){const a=near[i-1],b=near[i];expect(a.ready&&b.ready).toBe(true);const dot=a.direction.x*b.direction.x+a.direction.y*b.direction.y+a.direction.z*b.direction.z;expect(Math.acos(Math.min(1,dot))*180/Math.PI).toBeLessThan(1);expect(Math.hypot(a.pixel.x-b.pixel.x,a.pixel.y-b.pixel.y)).toBeLessThan(30);expect(b.mode).not.toBe('go-around');}
 await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-corridor-${camera}.json`,JSON.stringify({camera,near,final:trace.at(-1)},null,2));
});
