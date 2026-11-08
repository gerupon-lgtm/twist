import {useLegacyCourse} from './helpers/legacy-course.js';
import {test,expect} from './helpers/legacy-ui.js';
const music=page=>page.locator('#feedback-diagnostics').getAttribute('data-music').then(JSON.parse);
const preview=page=>page.locator('.music-preview-controls').getAttribute('data-music').then(JSON.parse);
const slider=(page,id,value)=>page.locator('#'+id).evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);
test('fine flight, collection and stall issue distinct rhythms, and classic can be selected and saved',async({page})=>{
 await page.addInitScript(()=>{
  window.vibrations=[];Object.defineProperty(navigator,'vibrate',{value:p=>{window.vibrations.push(p);return true;},configurable:true});
 });
 await page.clock.install({time:new Date('2026-11-07T12:00:00Z')});await page.goto('/?mode=flight&pitch=rate');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(100);
 expect((await page.evaluate(()=>window.vibrations)).some(p=>JSON.stringify(p)==='[11,49,11,49,11,49,11,49]')).toBe(true);
 await page.clock.runFor(4400);expect((await page.evaluate(()=>window.vibrations)).some(p=>JSON.stringify(p)==='[30,80,70]')).toBe(true);
 await slider(page,'practice-pitch',25);await page.clock.runFor(3000);
 expect((await page.evaluate(()=>window.vibrations)).some(p=>Array.isArray(p)&&p.length===6&&p[0]>=135&&p[2]>=90&&p[4]>=195)).toBe(true);
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await page.locator('#feedback-flightVibration').selectOption('classic');
 await page.reload();await page.locator('#practice-button').click();await page.clock.runFor(100);expect((await page.evaluate(()=>window.vibrations)).some(p=>JSON.stringify(p)==='[3,397]')).toBe(true);
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await expect(page.locator('#feedback-flightVibration')).toHaveValue('classic');
});
test('an old-song link selects its individual preview while adopted flight selection persists in copies',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copied=text},configurable:true}));
 await page.goto('/?mode=explore&music=brave');await page.locator('#practice-button').click();await expect.poll(async()=>(await music(page)).trackId).toBe('rock');
 await expect.poll(async()=>JSON.parse(await page.locator('#feedback-diagnostics').getAttribute('data-audio')).peak).toBeGreaterThan(0);
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await page.locator('#feedback-musicSet').selectOption('current');
 await page.locator('#settings-copy').click();expect(await page.evaluate(()=>JSON.parse(window.copied).feedback.settings.musicSet)).toBe('current');
 await expect(page.locator('#music-preview-track')).toHaveValue('brave');await page.locator('#music-preview-start').click();await expect.poll(async()=>(await preview(page)).trackId).toBe('brave');await expect.poll(async()=>JSON.parse(await page.locator('.music-preview-controls').getAttribute('data-audio')).peak).toBeGreaterThan(0);
 expect((await music(page)).playedTracks).toEqual(['黒曜の翼']);
 await page.locator('#start-button').click();await expect.poll(async()=>(await music(page)).trackId).toBe('rock');
 await page.reload();await page.locator('#practice-button').click();await expect.poll(async()=>(await music(page)).trackId).toBe('rock');
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await page.locator('#feedback-musicSet').selectOption('steel');await page.locator('#settings-copy').click();expect(await page.evaluate(()=>JSON.parse(window.copied).feedback.settings.musicSet)).toBe('steel');await page.locator('#start-button').click();await expect.poll(async()=>(await music(page)).trackId).toBe('steel');
 expect((await music(page)).playedTracks).toEqual(['黒曜の翼','鋼翼の鼓動']);
});
test('the complete brave composition loops at 67.764672 seconds in individual preview without restarting gameplay',async({page})=>{
 test.setTimeout(85000);await page.goto('/?mode=explore&music=brave');await page.locator('#practice-button').click();await expect.poll(async()=>(await music(page)).trackId).toBe('rock');
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await expect(page.locator('#music-preview-track')).toHaveValue('brave');
 const session=await page.locator('#app').getAttribute('data-session');await page.locator('#music-preview-start').click();
 await expect.poll(async()=>(await preview(page)).trackId).toBe('brave');await expect.poll(async()=>(await preview(page)).loopCount,{timeout:75000,intervals:[500]}).toBeGreaterThanOrEqual(1);
 await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');expect((await preview(page)).playing).toBe(true);expect((await music(page)).playing).toBe(false);expect(await page.locator('#app').getAttribute('data-session')).toBe(session);
});

useLegacyCourse(test);
