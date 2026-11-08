import {useLegacyCourse} from './helpers/legacy-course.js';
import {test,expect} from '@playwright/test';
async function open(page,camera='cockpit'){
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copied=text},configurable:true}));await page.goto('/?mode=flight&camera='+camera);await page.locator('#practice-button').click();await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();
}
test('descriptions, problem lookup, changed flags and single-field defaults are visible and copied',async({page})=>{
 await open(page);await expect(page.locator('#setting-help-maxTilt')).toContainText('上げると');await page.locator('#settings-troubles > summary').click();await page.locator('[data-jump-setting=maxTilt]').first().click();await expect(page.locator('label[for=setting-maxTilt]')).toHaveClass(/setting-highlight/);await expect(page.locator('#setting-maxTilt')).toBeInViewport();
 await page.locator('#setting-maxTilt').evaluate(el=>{el.value='15';el.dispatchEvent(new Event('input',{bubbles:true}));});await expect(page.locator('#setting-initial-maxTilt')).toHaveText('● 初期値 25°');await page.locator('#settings-copy').click();expect(await page.evaluate(()=>JSON.parse(window.copied).changedSettings)).toContain('maxTilt');
 await page.locator('[data-range-reset=setting-maxTilt]').click();await expect(page.locator('#setting-initial-maxTilt')).toBeHidden();await page.locator('#settings-copy').click();expect(await page.evaluate(()=>JSON.parse(window.copied).changedSettings)).not.toContain('maxTilt');
});
for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}])test(`settings explanations and packaged guide are readable at ${size.width}x${size.height}`,async({page})=>{
 await page.setViewportSize(size);await open(page);await page.locator('#setting-help-maxPitch').scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('#setting-help-maxPitch')).toBeVisible();await page.screenshot({path:`test-results/v0123-settings-${size.width}.png`});
 await page.goto('/settings-guide.html?v=0.1.29');await expect(page.locator('header')).toContainText('v0.1.29');await expect(page.locator('h1')).toContainText('早見表');await expect(page.locator('table')).toHaveCount(9);
 await expect(page.getByRole('heading',{name:'モードとHUDの読み方',exact:true})).toBeVisible();const modeTable=page.locator('table').first();await expect(modeTable.locator('tr')).toHaveCount(4);await expect(modeTable).toContainText('飛行機・従来視点／追尾3D');await expect(modeTable).toContainText('飛行機・操縦席');await expect(modeTable).toContainText('探索');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('problem lookup follows pitch/display/visibility changes made while adjustments stay open',async({page})=>{
 await open(page);await page.locator('#settings-troubles > summary').click();await expect(page.locator('[data-jump-setting=timeConstant]')).toHaveCount(2);
 await page.locator('#pitch-rate').click();await expect(page.locator('[data-jump-setting=timeConstant]')).toHaveCount(0);await page.locator('#pitch-angle').click();await expect(page.locator('[data-jump-setting=timeConstant]')).toHaveCount(2);
 await page.locator('#display-fixed').click();await expect(page.locator('[data-jump-setting=displayTimeConstant]')).toHaveCount(2);await page.locator('#display-bank').click();await expect(page.locator('[data-jump-setting=displayTimeConstant]')).toHaveCount(0);
 await page.locator('#view-classic').click();await expect(page.locator('[data-jump-setting=radarRange]')).toHaveCount(0);await page.locator('#view-assisted').click();await expect(page.locator('[data-jump-setting=radarRange]')).toHaveCount(2);
});

useLegacyCourse(test);
