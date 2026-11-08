import {test,expect} from './helpers/legacy-ui.js';

const songs=[['steel','鋼翼の鼓動'],['horizon','黎明の航跡'],['storm','嵐を越えて']];
const music=page=>page.locator('#feedback-diagnostics').getAttribute('data-music').then(JSON.parse);
const audio=page=>page.locator('#feedback-diagnostics').getAttribute('data-audio').then(JSON.parse);
async function crashAndRetry(page){
  for(const [id,value]of [['throttle-input',100],['practice-pitch',-25]])await page.locator('#'+id).evaluate((element,value)=>{element.value=String(value);element.dispatchEvent(new Event('input',{bubbles:true}));},value);
  await expect(page.locator('#app')).toHaveAttribute('data-grounded','true',{timeout:15000});
  await expect.poll(async()=>(await music(page)).playing).toBe(false);
  await page.locator('#start-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
}

for(const [id,title]of songs)test(`new guitar score ${id} plays, pauses and remains selectable after reload`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copied=JSON.parse(text)},configurable:true}));
  await page.goto(`/?mode=explore&music=${id}`);
  expect((await music(page)).playing).toBe(false);
  await page.locator('#practice-button').click();
  await expect.poll(async()=>(await music(page)).trackId).toBe(id);
  await expect.poll(async()=>(await audio(page)).peak).toBeGreaterThan(0);
  await page.locator('#pause-button').click();
  await expect.poll(async()=>(await music(page)).playing).toBe(false);
  await page.locator('#flight-adjustments > summary').click();
  await expect(page.locator('#feedback-musicSet')).toHaveValue(id);
  // Select explicitly: a launch URL alone must not overwrite a saved preference.
  await page.locator('#feedback-musicSet').selectOption('current');
  await page.locator('#feedback-musicSet').selectOption(id);
  await page.locator('#settings-copy').click();
  const report=await page.evaluate(()=>window.copied);
  expect(report.feedback.settings.musicSet).toBe(id);
  expect(report.feedback.music.playedTracks).toContain(title);
  await page.goto('/?mode=explore');
  await page.locator('#practice-button').click();
  await expect.poll(async()=>(await music(page)).trackId).toBe(id);
  expect(errors).toEqual([]);
});

test('the new trilogy advances on retry and keeps the same score on pause/resume',async({page})=>{
  test.setTimeout(90000);
  await page.goto('/?mode=flight&course=legacy&music=newrock');await page.locator('#practice-button').click();
  await expect.poll(async()=>(await music(page)).flightTracks).toEqual(songs.map(([,title])=>title));
  for(const [index,id]of ['steel','horizon','storm','steel'].entries()){
    await expect.poll(async()=>(await music(page)).trackId).toBe(id);
    await page.locator('#pause-button').click();await page.locator('#start-button').click();
    await expect.poll(async()=>(await music(page)).trackId).toBe(id);
    if(index<3)await crashAndRetry(page);
  }
  await page.locator('#pause-button').click();await page.locator('#reset-button').click();
  await expect.poll(async()=>(await music(page)).trackId).toBe('steel');
});

test('a missing new track falls back without silencing the other two or existing songs',async({page})=>{
  await page.route('**/music/horizon.mid?*',route=>route.fulfill({status:404,body:''}));
  await page.goto('/?mode=flight&course=legacy&music=newrock');await page.locator('#practice-button').click();
  await expect.poll(async()=>(await music(page)).flightTracks).toEqual(['鋼翼の鼓動','嵐を越えて']);
  await crashAndRetry(page);
  await expect.poll(async()=>(await music(page)).trackId).toBe('storm');
  await page.goto('/?mode=explore&music=horizon');await page.locator('#practice-button').click();
  await expect.poll(async()=>(await music(page)).trackId).toBe('flight');
});
