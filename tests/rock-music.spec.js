import {useLegacyCourse} from './helpers/legacy-course.js';
import {test,expect} from '@playwright/test';
const music=p=>p.locator('#feedback-diagnostics').getAttribute('data-music').then(JSON.parse);
test('rock lead can be selected, stored and recorded without replacing preceding songs',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copied=text},configurable:true}));
 await page.goto('/?mode=explore&music=rock');await page.locator('#practice-button').click();await expect.poll(async()=>(await music(page)).track).toBe('黒曜の翼');
 await expect.poll(()=>page.locator('#feedback-diagnostics').getAttribute('data-audio').then(s=>JSON.parse(s).peak)).toBeGreaterThan(0);
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await page.locator('#feedback-musicSet').selectOption('all');await page.locator('#settings-copy').click();expect(await page.evaluate(()=>JSON.parse(window.copied).feedback.changedSettings)).toContain('musicSet');
 await page.locator('#start-button').click();await expect.poll(async()=>(await music(page)).flightTracks).toEqual(['蒼穹突破','遺跡の閃光','勇進の航路','黒曜の翼','鋼翼の鼓動','黎明の航跡','嵐を越えて']);
 await page.reload();await page.locator('#practice-button').click();await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await expect(page.locator('#feedback-musicSet')).toHaveValue('all');
});
test('the full rock song loops after 73.84608 seconds without a restart',async({page})=>{
 test.setTimeout(90000);await page.goto('/?mode=explore&music=rock');await page.locator('#practice-button').click();await expect.poll(async()=>(await music(page)).trackId).toBe('rock');
 await expect.poll(async()=>(await music(page)).loopCount,{timeout:82000,intervals:[500]}).toBeGreaterThanOrEqual(1);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
});

useLegacyCourse(test);
