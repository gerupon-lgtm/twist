import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {state,launch} from './helpers/sierra-flight.js';
test('Sierra50 AB stays available for60seconds and releases without a speed cut',async({page})=>{
 test.setTimeout(90000);await launch(page,'cockpit');let s=await state(page);expect(s.speed).toBeCloseTo(25,2);expect(s.profile).toMatchObject({id:'sierra50-fast-v1',drySpeedLimit:60,afterburnerSpeedLimit:75});
 await expect(page.locator('#afterburner-hud output')).toHaveText('∞');
 await page.locator('#throttle-input').focus();await page.keyboard.press('End');await page.clock.runFor(60000);s=await state(page);
 expect(s.phase).toBe('running');expect(s.burn).toMatchObject({active:true,unlimited:true,fuel:100});expect(s.burn.seconds).toBeGreaterThan(59.9);expect(s.speed).toBeGreaterThan(74);expect(s.speed).toBeLessThanOrEqual(75.0001);
 const releaseSteps=Number(await page.locator('#throttle-input').getAttribute('max'))-100;
 for(let i=0;i<releaseSteps;i++)await page.locator('#throttle-input').press('ArrowLeft');await expect(page.locator('#throttle-input')).toHaveValue('100');await page.clock.runFor(250);s=await state(page);expect(s.burn.active).toBe(false);expect(s.speed).toBeGreaterThan(60);expect(s.burn.fuel).toBe(100);
 await page.locator('#pause-button').click();await page.locator('#start-flow-pause-settings').click();await expect(page.locator('[data-setting-key=turnGravity]')).toBeHidden();await page.locator('#settings-copy').click();
 const report=await page.evaluate(()=>window.sierraCopy);expect(report.course.flightProfile.unlimitedAfterburner).toBe(true);expect(report.afterburner.remainingFuel).toBe(100);expect(report.settings.turnGravity).toBe(9.8);
 await mkdir('.cache',{recursive:true});await writeFile('.cache/v0143-sierra50-constant-ab.json',JSON.stringify({state:s,report},null,2));
});
