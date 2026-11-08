import {useLegacyCourse} from './helpers/legacy-course.js';
import { test,expect } from './helpers/legacy-ui.js';
const slider=(p,id,value)=>p.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
const audio=p=>p.locator('#feedback-diagnostics').getAttribute('data-audio').then(s=>JSON.parse(s||'{}'));
async function observe(page,supported=true){
 await page.addInitScript(supported=>{
  window.vibrations=[];window.audioConstructions=0;
  Object.defineProperty(navigator,'vibrate',{value:supported?pattern=>{window.vibrations.push(pattern);return true;}:undefined,configurable:true});
  const Native=window.AudioContext;
  if(Native)window.AudioContext=function(...args){window.audioConstructions++;return new Native(...args);};
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copied=text;}},configurable:true});
 },supported);
}
test('audio and vibration stay silent before start, run after a gesture, and pause cancels both',async({page})=>{
 await observe(page);await page.goto('/?mode=flight');
 expect(await page.evaluate(()=>window.audioConstructions)).toBe(0);expect(await page.evaluate(()=>window.vibrations)).toEqual([]);
 await page.locator('#practice-button').click();
 await expect.poll(async()=>(await audio(page)).workletReady).toBe(true);
 await expect.poll(async()=>(await audio(page)).peak,{timeout:8000}).toBeGreaterThan(0);
 expect((await page.evaluate(()=>window.vibrations)).some(Array.isArray)).toBe(true);
 await page.locator('.feedback-metrics summary').click();await expect(page.locator('#feedback-diagnostics')).toContainText('音源');
 await page.screenshot({path:'test-results/v0117-audio-metrics.png'});
 await page.locator('.feedback-metrics summary').click();await page.locator('#pause-button').click();
 await expect.poll(async()=>(await audio(page)).contextState).toBe('suspended');
 expect((await page.evaluate(()=>window.vibrations)).at(-1)).toBe(0);
});
test('unsupported vibration is explained and does not prevent flight',async({page})=>{
 await observe(page,false);await page.goto('/?mode=flight');await page.locator('#practice-button').click();await page.locator('#pause-button').click();
 await page.locator('#flight-adjustments > summary').click();await expect(page.locator('#vibration-support')).toContainText('利用できません');
 await expect(page.locator('#feedback-vibration')).toBeHidden();
 await page.locator('#start-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
});
test('feedback switches and volume persist, and copies include feedback settings and jitter/load measurements',async({page})=>{
 await observe(page);await page.goto('/?mode=flight');await page.locator('#practice-button').click();await page.locator('#pause-button').click();
 await page.locator('#flight-adjustments > summary').click();
 await slider(page,'feedback-volume',10);await page.locator('#feedback-sfx').uncheck();await page.locator('#feedback-vibration').uncheck();await page.locator('#feedback-engineVibration').uncheck();
 await page.locator('#settings-copy').click();let report=await page.evaluate(()=>JSON.parse(window.copied));
 expect(report.feedback.settings).toMatchObject({volume:10,sfx:false,vibration:false,engineVibration:false});
 expect(report.feedback.sensorJitter).toHaveProperty('meanPitchRange');expect(report.feedback.audio).toHaveProperty('maxLoad');
 await page.reload();await page.locator('#practice-button').click();await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();
 await expect(page.locator('#feedback-volume')).toHaveValue('10');await expect(page.locator('#feedback-sfx')).not.toBeChecked();await expect(page.locator('#feedback-vibration')).not.toBeChecked();
 await page.locator('#feedback-settings-fields').scrollIntoViewIfNeeded();
 await page.screenshot({path:'test-results/v0117-feedback-settings.png'});
});
test('real crash notification interrupts the flight pulse and hidden pages cancel its tail',async({page})=>{
 await observe(page);await page.clock.install({time:new Date('2026-11-07T09:00:00Z')});await page.goto('/?mode=flight');
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(100);
 await slider(page,'throttle-input',0);await slider(page,'practice-pitch',-25);
 for(let i=0;i<150&&await page.locator('#app').getAttribute('data-phase')==='running';i++)await page.clock.runFor(100);
 await expect(page.locator('#app')).toHaveAttribute('data-grounded','true');
 await page.clock.runFor(50);expect(JSON.parse(await page.locator('#feedback-diagnostics').getAttribute('data-music')).playing).toBe(false);
 expect((await page.evaluate(()=>window.vibrations)).some(p=>Array.isArray(p)&&p.length===1&&p[0]===320)).toBe(true);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 expect((await page.evaluate(()=>window.vibrations)).at(-1)).toBe(0);
});

useLegacyCourse(test);
