import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const sizes=[{width:390,height:844},{width:360,height:640},{width:844,height:390}];
async function boot(page,camera,size,{inject=true}={}){
  await page.setViewportSize(size);
  await page.addInitScript(({camera,inject})=>{
    if(!/^https?:$/.test(location.protocol))return;
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,camera,inputMethod:'practice'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,bgm:false,vibration:false}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
    const nativeFrame=window.requestAnimationFrame.bind(window);
    const read=()=>{
      const d=document.getElementById('app').dataset;
      const hidden=id=>{const element=document.getElementById(id);return !element||element.hidden||!element.getClientRects().length||getComputedStyle(element).visibility==='hidden'||Number(getComputedStyle(element).opacity)===0;};
      return {phase:d.phase,speed:Number(d.speed),position:JSON.parse(d.position||'null'),session:JSON.parse(d.session||'null'),startup:JSON.parse(d.startup||'null'),guidanceReady:d.guidanceReady==='true',fdHidden:hidden('guidance-director'),fpmHidden:hidden('guidance-flight-path')};
    };
    let observed=false,injectNext=inject,runAt=null,lastPhase=null,armedSnapshot=null,sampleTimer=null;
    new MutationObserver(()=>{
      const phase=document.getElementById('app')?.dataset.phase;
      if(phase==='running'&&lastPhase!=='running')runAt=performance.now();
      lastPhase=phase;
    }).observe(document,{subtree:true,attributes:true,attributeFilter:['data-phase']});
    window.armStartFrameSample=({inject=true}={})=>{
      clearTimeout(sampleTimer);observed=false;injectNext=inject;runAt=null;lastPhase=document.getElementById('app')?.dataset.phase;
      armedSnapshot=read();window.startFrameSample=null;
    };
    window.requestAnimationFrame=callback=>nativeFrame(frameAt=>{
      const app=document.getElementById('app');
      if(!observed&&app?.dataset.phase==='running'){
        observed=true;
        const initial=armedSnapshot??read(),delivered=injectNext?0:frameAt;
        callback(delivered);
        const first=read();
        sampleTimer=setTimeout(()=>{window.startFrameSample={nativeFrameAt:frameAt,deliveredFrameAt:delivered,injected:injectNext,runAt,initial,first,after:read(),sampleAt:performance.now()};},200);
      }else callback(frameAt);
    });
  },{camera,inject});
  await page.goto(`/?course=easy&camera=${camera}`);
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','title');
  await page.locator('#start-flow-start').click();await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','courses');
  await page.locator('#start-flow-course-start').click();await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');
  await page.locator('#start-flow-hold').click();await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','countdown');
  await expect.poll(()=>page.evaluate(()=>Boolean(window.startFrameSample)),{timeout:15000}).toBe(true);
  return page.evaluate(()=>window.startFrameSample);
}
async function verify(page,camera,size,inject){
  const sample=await boot(page,camera,size,{inject}),id=`${inject?'negative':'native'}-${camera}-${size.width}x${size.height}`;
  await mkdir('.cache/director-v0131',{recursive:true});
  await writeFile(`.cache/director-v0131/start-frame-${id}.json`,JSON.stringify(sample,null,2));
  await page.screenshot({path:`.cache/director-v0131/start-frame-${id}.png`});
  console.log(JSON.stringify({id,...sample}));
  expect(sample.after.phase).toBe('running');
  if(inject){expect(sample.deliveredFrameAt).toBe(0);expect(sample.first.startup.flightStartedAt).toBeGreaterThan(0);}
  expect(sample.after.speed).toBeGreaterThanOrEqual(9.9);
  expect(Math.abs(sample.after.position.y-sample.initial.position.y)).toBeLessThanOrEqual(.05);
  expect(sample.after.guidanceReady).toBe(true);expect(sample.after.fdHidden).toBe(false);expect(sample.after.fpmHidden).toBe(false);
  const activeSeconds=(sample.sampleAt-sample.after.startup.flightStartedAt)/1000;
  expect(sample.after.session.elapsedSeconds).toBeLessThanOrEqual(activeSeconds+.05);
  expect(sample.after.session.elapsedSeconds).toBeGreaterThanOrEqual(0);
}

for(const camera of ['overlay','chase','cockpit'])for(const size of sizes)test(`native startup retains launch speed after one queued negative frame ${camera} ${size.width}x${size.height}`,async({page})=>{
  await verify(page,camera,size,true);
});
for(const camera of ['overlay','chase','cockpit'])test(`unmodified native startup retains launch speed ${camera}`,async({page})=>{
  await verify(page,camera,sizes[0],false);
  await page.locator('#pause-button').click();await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pause');
  await page.evaluate(()=>window.armStartFrameSample({inject:true}));
  await page.locator('#start-flow-resume').click();
  await expect.poll(()=>page.evaluate(()=>Boolean(window.startFrameSample)),{timeout:15000}).toBe(true);
  const resumed=await page.evaluate(()=>window.startFrameSample);
  await writeFile(`.cache/director-v0131/start-frame-resume-${camera}.json`,JSON.stringify(resumed,null,2));
  await page.screenshot({path:`.cache/director-v0131/start-frame-resume-${camera}.png`});
  const elapsedDelta=resumed.after.session.elapsedSeconds-resumed.initial.session.elapsedSeconds;
  const actualResumeSeconds=(resumed.sampleAt-resumed.runAt)/1000;
  console.log(JSON.stringify({camera,resumed,elapsedDelta,actualResumeSeconds}));
  expect(resumed.deliveredFrameAt).toBe(0);expect(resumed.after.phase).toBe('running');
  expect(resumed.after.speed).toBeGreaterThanOrEqual(9.9);expect(resumed.after.position.y).toBeCloseTo(22,2);
  expect(resumed.after.guidanceReady).toBe(true);expect(resumed.after.fdHidden).toBe(false);expect(resumed.after.fpmHidden).toBe(false);
  expect(Number.isFinite(resumed.runAt)).toBe(true);
  expect(resumed.first.session.elapsedSeconds).toBeCloseTo(resumed.initial.session.elapsedSeconds,6);
  expect(resumed.after.session.elapsedSeconds).toBeGreaterThanOrEqual(resumed.first.session.elapsedSeconds);
  expect(elapsedDelta).toBeLessThanOrEqual(actualResumeSeconds+.05);expect(elapsedDelta).toBeGreaterThanOrEqual(0);
});
