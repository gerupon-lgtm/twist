import {useLegacyCourse} from './helpers/legacy-course.js';
import { test,expect } from './helpers/legacy-ui.js';
import { readFile } from 'node:fs/promises';
const config=JSON.parse(await readFile('public/music/tracks.json','utf8'));
const music=page=>page.locator('#feedback-diagnostics').getAttribute('data-music').then(s=>JSON.parse(s||'{}'));
const slider=(page,id,value)=>page.locator('#'+id).evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);
async function crash(page){
 await slider(page,'throttle-input',100);await slider(page,'practice-pitch',-25);
 await expect(page.locator('#app')).toHaveAttribute('data-grounded','true',{timeout:15000});
 await expect.poll(async()=>(await music(page)).playing).toBe(false);
 await page.locator('#start-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
}
test('adopted tracks advance only after actual crash/restart, while pause resumes the same song',async({page})=>{
 test.setTimeout(60000); // Two real 15-second crash windows plus native audio preparation and restarts.
 await page.goto('/?mode=flight');await page.locator('#practice-button').click();
 await expect.poll(async()=>(await music(page)).track).toBe(config.rock.title);
 await page.locator('#pause-button').click();await page.locator('#start-button').click();
 await expect.poll(async()=>(await music(page)).track).toBe(config.rock.title);
 await crash(page);await expect.poll(async()=>(await music(page)).track).toBe(config.steel.title);
 await crash(page);await expect.poll(async()=>(await music(page)).track).toBe(config.horizon.title);
 expect((await music(page)).playedTracks).toEqual([config.rock.title,config.steel.title,config.horizon.title]);
});
test('both selected flight tracks repeat at the configured segment boundary',async({page})=>{
 const shortened=structuredClone(config);shortened.rock.loop={start:.4,end:1.8};shortened.steel.loop={start:.2,end:1.6};
 await page.route('**/music/tracks.json*',route=>route.fulfill({json:shortened}));
 await page.goto('/?mode=flight');await page.locator('#practice-button').click();
 await expect.poll(async()=>(await music(page)).loopCount,{timeout:8000}).toBeGreaterThanOrEqual(1);
 await crash(page);await expect.poll(async()=>(await music(page)).track).toBe(config.steel.title);
 await expect.poll(async()=>(await music(page)).loopCount,{timeout:8000}).toBeGreaterThanOrEqual(1);
});
test('the complete original 72-second song remains compatible in an explicit legacy custom catalog',async({page})=>{
 test.setTimeout(90000);
 const legacy=structuredClone(config);delete legacy.catalog;
 await page.route('**/music/tracks.json*',route=>route.fulfill({json:legacy}));
 await page.goto('/?mode=explore');await page.locator('#practice-button').click();
 await expect.poll(async()=>(await music(page)).track).toBe(config.flight.title);
 await expect.poll(async()=>(await music(page)).loopCount,{timeout:80000,intervals:[500]}).toBeGreaterThanOrEqual(1);
 await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
 expect((await music(page)).playing).toBe(true);expect((await music(page)).track).toBe(config.flight.title);
});

useLegacyCourse(test);
