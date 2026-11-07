import {useLegacyCourse} from './helpers/legacy-course.js';
import {test,expect} from '@playwright/test';

const sizes=[{width:390,height:844},{width:360,height:640},{width:844,height:390}];
const japanese=/[\u3040-\u30ff\u3400-\u9fff]/;
const slider=(page,id,value)=>page.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
const run=page=>page.clock.runFor(120);
async function launch(page,query='mode=flight&camera=cockpit'){
  await page.clock.install({time:new Date('2026-11-08T00:00:00Z')});
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__hudCopied=text;}},configurable:true}));
  await page.goto('/?'+query);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  await expect(page.locator('#dialog-description')).toContainText('光を3つ');
  await expect(page.locator('#start-button')).toContainText('スマホ');
  await page.locator('#practice-button').click();await run(page);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
}
async function settings(page){
  await page.locator('#pause-button').click();await run(page);
  const panel=page.locator('#flight-adjustments');
  if(!await panel.evaluate(el=>el.open))await page.locator('#flight-adjustments > summary').click();
  await expect(page.locator('#flight-adjustments > summary')).toHaveText('調整');
  await expect(page.locator('label[for=setting-hudLanguage] > span')).toHaveText('HUDの表記');
}
async function copied(page){await page.locator('#settings-copy').click();return page.evaluate(()=>JSON.parse(window.__hudCopied));}
async function englishCockpit(page){
  await expect(page.locator('#target-label')).toHaveText('TGT 1');
  await expect(page.locator('#target-direction')).toHaveText(/^[▲▼]?$/);
  await expect(page.locator('#cockpit-speed')).toContainText('SPD m/s');
  await expect(page.locator('#cockpit-altitude')).toContainText('ALT m');
  await expect(page.locator('#cockpit-heading')).toContainText('HDG');
  await expect(page.locator('#cockpit-vario')).toContainText('V/S');
  await expect(page.locator('#cockpit-target-height')).toContainText('TGT ALT');
  await expect(page.locator('#cockpit-target-height')).toContainText('ALT OK');
  await expect(page.locator('#radar .radar-heading')).toHaveText('TRK');
  await expect(page.locator('.throttle-heading > label')).toHaveText('THR');
  for(const selector of ['.navigation','#cockpit-hud','#radar'])expect(await page.locator(selector).innerText(),selector).not.toMatch(japanese);
  await expect(page.locator('#pause-button')).toHaveText('一時停止');
  await expect(page.locator('#recenter-button')).toHaveText('スマホの傾きに切替');
}
async function readable(page,size){
  const boxes=await page.evaluate(()=>{
    const ids=['cockpit-heading','cockpit-target-height','cockpit-speed','cockpit-altitude','cockpit-vario'];
    return ids.map(id=>{const el=document.getElementById(id),rect=el.getBoundingClientRect();return{id,x:rect.x,y:rect.y,width:rect.width,height:rect.height,scroll:el.scrollWidth,client:el.clientWidth};});
  });
  for(const b of boxes){
    expect(b.x,b.id).toBeGreaterThanOrEqual(0);expect(b.y,b.id).toBeGreaterThanOrEqual(0);
    expect(b.x+b.width,b.id).toBeLessThanOrEqual(size.width);expect(b.y+b.height,b.id).toBeLessThanOrEqual(size.height);
    // The vario value deliberately extends sideways from its narrow SVG axis.
    if(b.id!=='cockpit-vario')expect(b.scroll,b.id+' text width').toBeLessThanOrEqual(b.client+2);
  }
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const a=boxes[i],b=boxes[j];expect(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y,a.id+'/'+b.id).toBe(false);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}

for(const size of sizes)test(`HUD EN/JA and Japanese controls persist at ${size.width}x${size.height}`,async({page})=>{
  await page.setViewportSize(size);await launch(page);await englishCockpit(page);await readable(page,size);
  await page.screenshot({path:`test-results/v0125-locale-${size.width}x${size.height}-en.png`});
  const labels=await page.locator('#app').getAttribute('data-navigation-targets').then(JSON.parse);
  expect(labels[0].label).toBe('光 1');
  await settings(page);await expect(page.locator('#target-label')).toHaveText('光 1');
  await expect(page.locator('#setting-hudLanguage')).toHaveValue('en');const before=await copied(page);
  expect(before.segments.map(s=>s.label)).toEqual(['開始→光1','光1→光2','光2→光3','光3→出口']);
  await page.locator('#setting-hudLanguage').selectOption('ja');
  await expect(page.locator('#settings-status')).toContainText('保存しました');
  const after=await copied(page);expect(after.settings.hudLanguage).toBe('ja');
  expect(after.segments).toEqual(before.segments);expect(after.targetViews).toEqual(before.targetViews);expect(after.input).toEqual(before.input);
  await page.getByText('HUDの略語と記号',{exact:true}).click();
  await expect(page.locator('#flight-adjustments')).toContainText('FPM＝実際に進んでいる方向の印');
  await expect(page.locator('#flight-adjustments')).toContainText('V/S＝昇降速度');
  await page.locator('#start-button').click();await run(page);
  await expect(page.locator('#target-label')).toHaveText('光 1');
  await expect(page.locator('#cockpit-speed')).toContainText('速度 m/s');
  await expect(page.locator('#cockpit-altitude')).toContainText('現在高度 m');
  await expect(page.locator('#cockpit-target-height')).toContainText('高さOK');
  await expect(page.locator('#radar .radar-heading')).toHaveText('進行方向');
  await expect(page.locator('.throttle-heading > label')).toHaveText('エンジン出力');
  await readable(page,size);await page.screenshot({path:`test-results/v0125-locale-${size.width}x${size.height}-ja.png`});
  await page.reload();await page.locator('#practice-button').click();await run(page);
  await expect(page.locator('#cockpit-speed')).toContainText('速度 m/s');
  await settings(page);await expect(page.locator('#setting-hudLanguage')).toHaveValue('ja');
  await page.locator('[data-checkbox-reset=hudLanguage]').click();await expect(page.locator('#setting-hudLanguage')).toHaveValue('en');
  await page.locator('#start-button').click();await run(page);await englishCockpit(page);
});

test('legacy cockpit objective fallback also uses English names and arrow-only direction',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('twist.flight-settings.v1',JSON.stringify({edgeGuidance:false})));
  await launch(page,'mode=flight&camera=cockpit&display=fixed');
  await expect(page.locator('#cockpit-objective-label')).toContainText('TGT 1');
  await slider(page,'practice-steer',25);await page.clock.runFor(1900);
  await expect(page.locator('#cockpit-objective')).toHaveAttribute('data-kind','edge');
  const label=await page.locator('#cockpit-objective').getAttribute('aria-label');
  expect(label).toContain('TGT 1');expect(label).not.toMatch(japanese);expect(label).not.toContain('GATE');
  await settings(page);await page.locator('#setting-hudLanguage').selectOption('ja');
  await page.locator('#start-button').click();await run(page);
  await expect(page.locator('#cockpit-objective')).toHaveAttribute('aria-label',/光 1/);
});

test('exploration shares English passive labels and preserves Japanese operation text',async({page})=>{
  await launch(page,'mode=explore');
  await expect(page.locator('#target-label')).toHaveText('TGT 1');
  await expect(page.locator('#radar .radar-heading')).toHaveText('TRK');
  await expect(page.locator('#speed-value').locator('..')).toContainText('SPD');
  await expect(page.locator('#ground-clearance')).toHaveText('ALT');
  await expect(page.locator('#target-height-inline')).toContainText('TGT ALT');
  await expect(page.locator('#pause-button')).toHaveText('一時停止');
  await settings(page);await expect(page.locator('#setting-hudLanguage')).toBeVisible();
  await page.locator('#setting-hudLanguage').selectOption('ja');await page.locator('#start-button').click();await run(page);
  await expect(page.locator('#target-label')).toHaveText('光 1');
  await expect(page.locator('#ground-clearance')).toHaveText('高さ');
  await expect(page.locator('#radar .radar-heading')).toHaveText('進行方向');
});
test('five guidance switches save individually, restore the old display and appear in copies',async({page})=>{
 await launch(page);await settings(page);
 const keys=['flightDirector','targetHeadingCue','edgeGuidance','nextTargetNotice','audioGuidance'];
 for(const key of keys){await expect(page.locator('#setting-'+key)).toBeChecked();await page.locator('#setting-'+key).uncheck();}
 const report=await copied(page);for(const key of keys)expect(report.settings[key]).toBe(false);
 await page.locator('#start-button').click();await run(page);await expect(page.locator('#guidance-panel')).toBeHidden();await expect(page.locator('#cockpit-objective')).toBeVisible();
 await page.reload();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await run(page);await settings(page);
 for(const key of keys)await expect(page.locator('#setting-'+key)).not.toBeChecked();
 await page.locator('[data-checkbox-reset=flightDirector]').click();await expect(page.locator('#setting-flightDirector')).toBeChecked();
 for(const key of keys.slice(1))await expect(page.locator('#setting-'+key)).not.toBeChecked();
});

useLegacyCourse(test);
