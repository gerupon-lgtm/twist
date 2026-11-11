import {test,expect} from '@playwright/test';
import {waitForCountdownThree} from './helpers/countdown.js';
import {mkdir,writeFile} from 'node:fs/promises';

const step=(page,name)=>expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step',name);
const read=page=>page.locator('#app').evaluate(el=>({phase:el.dataset.phase,speed:Number(el.dataset.speed),position:JSON.parse(el.dataset.position),sonic:JSON.parse(el.dataset.supersonic),effects:JSON.parse(el.dataset.speedEffects??'{}'),time:JSON.parse(el.dataset.courseTime)}));
const normalSaved=JSON.stringify({maxPitch:12,turnGravity:3,maxBank:30,groundPatternStrength:0,radarRange:60,speedUnit:'m/s',flightDirector:true});
async function start(page,{fuel='unlimited',native=false,sound=false}={}){
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  if(!native)await page.clock.install();
  await page.addInitScript(({fuel,sound,normalSaved})=>{
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'chase'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound,bgm:sound,vibration:false}));
    localStorage.setItem('twist.flight-settings.v1',normalSaved);
    localStorage.setItem('twist.supersonic-settings.v1',JSON.stringify({maxG:9,fuelMode:fuel,pitchGain:.35,radarRange:10000}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.sonicCopied=value;}},configurable:true});
  },{fuel,sound,normalSaved});
  await page.goto('/?course=supersonic&camera=chase&music=rock');
  if(!native)await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  await step(page,'title');await page.locator('#start-flow-start').click();await step(page,'courses');
  await page.locator('#start-flow-course-start').click();await step(page,'pose');await page.locator('#start-flow-hold').click();
  if(!native){await waitForCountdownThree(page);await page.clock.runFor(3100);}
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:15000});
  return errors;
}
async function report(page){await step(page,'result');await page.locator('#result-copy').click();return page.evaluate(()=>JSON.parse(window.sonicCopied));}
function validate(result,fuel){
  const s=result.supersonic;expect(result.result).toBe('clear');expect(s.complete).toBe(true);expect(s.grounded).toBe(false);
  expect(s.effectiveSettings).toMatchObject({maxG:9,pitchGain:.35,fuelMode:fuel});
  expect(s.maximumMach).toBeCloseTo(2,8);expect(s.maximumG).toBeLessThanOrEqual(9.000001);
  expect(s.firstMach1Seconds).toBeGreaterThan(5);expect(s.firstMach1Seconds).toBeLessThan(8);
  expect(s.firstMach2Seconds).toBeGreaterThan(54);expect(s.firstMach2Seconds).toBeLessThan(60);
  expect(s.firstMach1ActiveSeconds).toBeCloseTo(s.firstMach1Seconds,5);expect(s.firstMach2ActiveSeconds).toBeCloseTo(s.firstMach2Seconds,5);
  expect(s.interruptedSeconds).toBe(0);expect(s.activeSeconds).toBeCloseTo(s.simulationSeconds,5);
  expect(result.courseTime.seconds).toBeCloseTo(s.simulationSeconds,5);expect(s.simulationSeconds).toBeGreaterThan(60);expect(s.simulationSeconds).toBeLessThan(70);
  expect(s.gateResults).toHaveLength(6);expect(result.segments).toHaveLength(6);
  for(const gate of s.gateResults){expect(gate.passedAtSeconds).toBeGreaterThan(0);expect(gate.segmentSeconds).toBeGreaterThan(0);expect(gate.missCount).toBe(0);expect(gate.lastCrossingRadialDistance).toBeLessThanOrEqual(80);}
  expect(s.gateResults.reduce((sum,g)=>sum+g.segmentSeconds,0)).toBeCloseTo(s.simulationSeconds,5);
  expect(result.segments.reduce((sum,g)=>sum+g.seconds,0)).toBeCloseTo(s.simulationSeconds,5);
  expect(s.renderOrigin).toBeTruthy();for(const axis of ['x','y','z'])expect(s.renderOrigin[axis]%1024).toBeCloseTo(0,8);
  expect(s.renderDiagnostics.gpu.calls).toBeGreaterThan(0);expect(s.renderDiagnostics.world.sea.strength).toBe(.8);
  expect(result.inactiveSettings).toEqual(expect.arrayContaining(['maxPitch','turnGravity','groundPatternStrength','radarRange']));
}
for(const fuel of ['unlimited','gauge'])test(`main flow physically crosses all six gates to M2 and copies separate ${fuel} records`,async({page})=>{
  test.setTimeout(90000);const errors=await start(page,{fuel}),initial=await read(page);
  expect(initial.speed).toBeGreaterThan(199);expect(initial.position.y).toBeCloseTo(1500,5);
  await page.locator('#throttle-input').press('End');let current=await read(page);
  for(let i=0;i<280&&current.phase==='running';i++){await page.clock.runFor(250);current=await read(page);}
  const result=await report(page);validate(result,fuel);
  const stored=await page.evaluate(()=>({normal:localStorage.getItem('twist.flight-settings.v1'),normalPB:localStorage.getItem('twist.course-bests.v1'),sonic:localStorage.getItem('twist.supersonic-bests.v1')}));
  expect(stored.normal).toBe(normalSaved);expect(stored.normalPB).toBeNull();expect(stored.sonic).toContain('supersonic:');
  await writeFile(`.cache/v0137-main-six-gates-${fuel}.json`,JSON.stringify({initial,current,result,stored,errors},null,2));expect(errors).toEqual([]);
});

test('native main clock reaches actual M2 with live audio and visible cone/haze before course completion',async({page})=>{
  test.setTimeout(100000);const errors=await start(page,{native:true,sound:true});
  await mkdir('.cache',{recursive:true});
  const started=Date.now(),samples=[],cameraSamples=[],observationPath=`.cache/v0137-native-main-observation-${started}.json`;
  let cone=null,haze=null,result=null;
  try{
  await page.locator('#throttle-input').press('End');
  await expect.poll(async()=>{const s=await read(page);samples.push({wallSeconds:(Date.now()-started)/1000,...s});return s.sonic.mach;},{timeout:12000,intervals:[100]}).toBeGreaterThan(.98);
  cone=await read(page);expect(cone.effects.coneVisible).toBe(true);await page.screenshot({path:'.cache/v0137-native-M1-cone.png'});
  await page.locator('#start-flow-view-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-camera','cockpit');
  // The view button updates immediately; diagnostic snapshots publish at80ms.
  // Observe the new render mode before judging its effect, without changing
  // native time, forces, the Mach window or the visibility expectation.
  await expect.poll(async()=>{const value=await read(page);const renderMode=value.sonic.renderDiagnostics.cameraMode;
    cameraSamples.push({wallSeconds:(Date.now()-started)/1000,renderMode,mach:value.sonic.mach,hazeVisible:value.effects.hazeVisible});return renderMode;
  },{timeout:2000,intervals:[16]}).toBe('cockpit');
  haze=await read(page);expect(haze.sonic.mach).toBeGreaterThanOrEqual(.95);expect(haze.sonic.mach).toBeLessThanOrEqual(1.05);
  expect(haze.effects.hazeVisible).toBe(true);await page.screenshot({path:'.cache/v0137-native-M1-haze.png'});
  await expect(page.locator('#app')).toHaveAttribute('data-phase','complete',{timeout:80000});
  result=await report(page);validate(result,'unlimited');
  expect((Date.now()-started)/1000).toBeGreaterThan(result.supersonic.simulationSeconds-.5);
  expect(result.feedback.audio.status).toBe('ready');expect(result.feedback.audio.sonic.accepted).toBeGreaterThanOrEqual(1);
  await page.screenshot({path:'.cache/v0137-native-M2-result.png'});
  await writeFile('.cache/v0137-main-native-M2.json',JSON.stringify({cone,haze,samples,cameraSamples,result,wallSeconds:(Date.now()-started)/1000,errors},null,2));expect(errors).toEqual([]);
  }finally{
    const last=await read(page).catch(()=>null);
    await writeFile(observationPath,JSON.stringify({cone,haze,samples,cameraSamples,result,last,wallSeconds:(Date.now()-started)/1000,errors},null,2));
  }
});
