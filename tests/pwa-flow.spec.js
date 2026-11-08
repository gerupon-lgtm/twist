import {test,expect} from '@playwright/test';

async function platform(page,{android=false,iphone=false,outcome='resolve'}={}){
  await page.addInitScript(({android,iphone,outcome})=>{
    if(!/^https?:$/.test(location.protocol))return;
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,camera:'overlay',inputMethod:'practice'}));
    Object.defineProperty(navigator,'userAgent',{value:iphone?'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Version/18.7 Mobile/15E148 Safari/604.1':android?'Mozilla/5.0 (Linux; Android 16; Pixel 9a) Chrome/140.0.0.0 Mobile Safari/537.36':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0.0.0 Safari/537.36',configurable:true});
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.pwaCopied=JSON.parse(text);}},configurable:true});
    window.pwaCalls=[];window.pwaOrientation='portrait-primary';
    Object.defineProperty(screen.orientation,'type',{get:()=>window.pwaOrientation,configurable:true});
    let fullscreenElement=null;
    Object.defineProperty(document,'fullscreenElement',{get:()=>fullscreenElement,configurable:true});
    Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,writable:true,value:outcome==='unsupported'?undefined:async function(){
      window.pwaCalls.push({kind:'fullscreen',at:performance.now(),userActivation:navigator.userActivation.isActive});
      if(outcome==='reject')throw Error('fullscreen declined');
      fullscreenElement=document.documentElement;window.pwaOrientation='landscape-secondary';
      document.dispatchEvent(new Event('fullscreenchange'));
    }});
    window.pwaExit=()=>{fullscreenElement=null;document.dispatchEvent(new Event('fullscreenchange'));};
    document.exitFullscreen=async()=>window.pwaExit();
    screen.orientation.lock=async type=>{window.pwaCalls.push({kind:'lock',type,at:performance.now()});};
    screen.orientation.unlock=()=>window.pwaCalls.push({kind:'unlock',at:performance.now()});
  },{android,iphone,outcome});
}

async function titleToPose(page){
  await page.goto('/?mode=flight&course=easy');
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','title');
  await page.locator('#start-flow-start').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','courses');
  await page.locator('#start-flow-course-start').click();
  await expect(page.locator('#briefing-panel')).toBeVisible();
  await page.locator('#briefing-skip').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');
}

async function fly(page){
  await page.locator('#start-flow-hold').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','countdown');
  await page.clock.runFor(6500);
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
}

async function copyPausedReport(page,{alreadyPaused=false}={}){
  if(!alreadyPaused)await page.locator('#pause-button').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pause');
  await page.locator('#start-flow-pause-settings').click();
  await page.locator('#settings-copy').click();
  return page.evaluate(()=>window.pwaCopied);
}

function finiteFullscreenRecord(record){
  for(const key of ['fullscreenRequestedAt','fullscreenSucceededAt','titleToFlightSeconds'])expect(Number.isFinite(record[key]),key).toBe(true);
}

test('Android title requests fullscreen before pose locks the currently held orientation',async({page})=>{
  await platform(page,{android:true});await page.clock.install();
  await titleToPose(page);
  const titleCalls=await page.evaluate(()=>window.pwaCalls);
  expect(titleCalls.map(call=>call.kind)).toEqual(['fullscreen']);
  expect(titleCalls[0].userActivation).toBe(true);
  await page.evaluate(()=>{window.pwaOrientation='landscape-primary';});
  await fly(page);
  expect((await page.evaluate(()=>window.pwaCalls)).filter(call=>call.kind==='lock').map(call=>call.type)).toEqual(['landscape-primary']);
  const {startup}=await copyPausedReport(page);
  expect(startup).toMatchObject({fullscreenRequested:true,fullscreenSucceeded:true,fullscreenSource:'title',countdown:true,countdownSeconds:3,tutorialShown:false,firstTime:false});
  finiteFullscreenRecord(startup);expect(startup.fullscreenToFlightSeconds).toBeGreaterThanOrEqual(6);
});

test('desktop title requests fullscreen and an in-flight exit pauses until explicit resume',async({page})=>{
  await platform(page);await page.clock.install();await titleToPose(page);await fly(page);
  expect((await page.evaluate(()=>window.pwaCalls)).filter(call=>call.kind==='lock')).toEqual([]);
  await page.evaluate(()=>window.pwaExit());
  await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pause');
  await expect(page.locator('#throttle-value')).toHaveText('0%');
  const position=await page.locator('#app').getAttribute('data-position');
  await page.clock.runFor(1000);expect(await page.locator('#app').getAttribute('data-position')).toBe(position);
  await page.locator('#start-flow-resume').click();
  await page.clock.runFor(6500);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  expect((await page.evaluate(()=>window.pwaCalls)).filter(call=>call.kind==='fullscreen')).toHaveLength(2);
});

for(const outcome of ['reject','unsupported'])test(`fullscreen ${outcome} still reaches flight and records the actual request outcome`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await platform(page,{outcome});await page.clock.install();await titleToPose(page);await fly(page);
  const {startup}=await copyPausedReport(page);
  expect(startup).toMatchObject({fullscreenRequested:outcome==='reject',fullscreenSucceeded:false,fullscreenSource:outcome==='reject'?'title':'other',fullscreenSucceededAt:0,countdown:true});
  finiteFullscreenRecord(startup);expect(startup.fullscreenToFlightSeconds).toBeNull();
  expect((await page.evaluate(()=>window.pwaCalls)).filter(call=>call.kind==='fullscreen')).toHaveLength(outcome==='reject'?1:0);
  expect(errors).toEqual([]);
});

test('iPhone orientation advice begins at pose after a long title wait and hides when holding',async({page})=>{
  await platform(page,{iphone:true,outcome:'unsupported'});await page.clock.install();
  await page.goto('/?mode=flight&course=easy');
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','title');
  await page.clock.runFor(15000);await expect(page.locator('#orientation-notice')).toBeHidden();
  await page.locator('#start-flow-start').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','courses');
  await page.locator('#start-flow-course-start').click();
  await expect(page.locator('#briefing-panel')).toBeVisible();await page.locator('#briefing-skip').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');
  await expect(page.locator('#orientation-notice')).toBeVisible();
  await expect(page.locator('#orientation-notice')).toContainText('画面縦向きのロック');
  await page.clock.runFor(9000);await expect(page.locator('#orientation-notice')).toBeVisible();
  await page.locator('#start-flow-hold').click();await expect(page.locator('#orientation-notice')).toBeHidden();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','countdown');
});
