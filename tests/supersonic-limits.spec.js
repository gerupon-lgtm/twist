import {test,expect} from '@playwright/test';
import {waitForCountdownThree} from './helpers/countdown.js';
import {writeFile} from 'node:fs/promises';
import {Quaternion,Vector3} from 'three';
import {SUPERSONIC_AIRCRAFT_HULL} from '../src/supersonic/aircraft-hull.js';

// Integrated main/start-flow tests. Only saved preferences, real UI inputs and
// the browser clock are controlled; positions/velocities/stage state are never injected.
const step=(page,name)=>expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step',name);
const read=page=>page.locator('#app').evaluate(app=>({phase:app.dataset.phase,position:JSON.parse(app.dataset.position),speed:Number(app.dataset.speed),
  sonic:JSON.parse(app.dataset.supersonic),boundary:app.dataset.boundaryWarning,courseTime:JSON.parse(app.dataset.courseTime)}));
const compact=s=>({phase:s.phase,position:s.position,speed:s.speed,mach:s.sonic.mach,pitch:s.sonic.controlPitch,
  verticalSpeed:s.sonic.verticalSpeed,groundClearance:s.sonic.groundClearance,simulationSeconds:s.sonic.simulationSeconds,
  complete:s.sonic.complete,grounded:s.sonic.grounded,boundary:s.boundary});

async function start(page){
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:390,height:844});await page.clock.install();
  await page.addInitScript(()=>{
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'overlay'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    localStorage.setItem('twist.flight-settings.v1',JSON.stringify({hudLanguage:'en',speedUnit:'m/s',autoAfterburner:false}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,bgm:false,vibration:false}));
    localStorage.setItem('twist.supersonic-settings.v1',JSON.stringify({maxG:9,fuelMode:'unlimited',pitchGain:.35,radarRange:10000}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.sonicLimitCopied=value;}},configurable:true});
  });
  await page.goto('/?course=supersonic&camera=overlay');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  await step(page,'title');await page.locator('#start-flow-start').click();await step(page,'courses');
  // Use the exposed setting, before the new attempt, to reach the two altitude
  // limits with a 15-degree command while staying inside the 40km airspace.
  await page.locator('#start-flow-course-settings').click();await step(page,'settings');
  await page.locator('#supersonic-pitchGain').press('End');await expect(page.locator('#supersonic-pitchGain')).toHaveValue('1');
  await page.locator('#start-flow-settings-close').click();await step(page,'courses');
  await page.locator('#start-flow-course-start').click();await step(page,'pose');await page.locator('#start-flow-hold').click();
  await waitForCountdownThree(page);await page.clock.runFor(3100);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  expect((await read(page)).sonic.effectiveSettings).toMatchObject({maxG:9,fuelMode:'unlimited',pitchGain:1});
  return errors;
}
async function evidence(page,kind,value){
  await writeFile(`.cache/v0136-limits-${kind}.json`,JSON.stringify(value,null,2));
  await page.screenshot({path:`.cache/v0136-limits-${kind}.png`});
}

test('actual AB climb crosses the advisory 6000m ceiling without stopping and pilot input returns below it',async({page})=>{
  test.setTimeout(90000);const errors=await start(page),samples=[];
  await page.locator('#throttle-input').press('End');await page.locator('#practice-pitch').press('End');
  await expect(page.locator('#throttle-input')).toHaveValue('120');await expect(page.locator('#practice-pitch')).toHaveValue('30');
  let state=await read(page);
  for(let i=0;i<130&&state.position.y<=6050&&state.phase==='running';i++){
    await page.clock.runFor(1000);state=await read(page);samples.push(compact(state));
  }
  await evidence(page,'ceiling-first-crossing',{state,samples,errors});
  expect(state.phase).toBe('running');expect(state.position.y).toBeGreaterThan(6000);
  expect(state.sonic.grounded).toBe(false);expect(state.sonic.complete).toBe(false);
  expect(state.sonic.afterburner.active).toBe(true);expect(state.sonic.verticalSpeed).toBeGreaterThan(0);
  // This climb's horizontal displacement is about 4.5km/tan(15deg), so the
  // independent lateral warning must not substitute for the ceiling warning.
  expect(Math.max(Math.abs(state.position.x),Math.abs(state.position.z))).toBeLessThan(14000);
  await expect(page.locator('#stage-boundary-warning')).toBeVisible();
  await expect(page.locator('#boundary-title')).toHaveText('CEILING');
  await expect(page.locator('#boundary-detail')).toContainText('DESCEND');
  await expect(page.locator('#stage-boundary-warning')).toHaveAttribute('aria-label',/CEILING\. DESCEND\./);
  const above=state;
  await page.clock.runFor(3000);state=await read(page);
  expect(state.phase).toBe('running');expect(state.position.y).toBeGreaterThan(above.position.y+10);
  expect(state.sonic.simulationSeconds).toBeGreaterThan(above.sonic.simulationSeconds);
  expect(state.sonic.controlPitch).toBeGreaterThan(0);await expect(page.locator('#practice-pitch')).toHaveValue('30');
  await page.locator('#practice-pitch').press('Home');await expect(page.locator('#practice-pitch')).toHaveValue('-30');
  for(let i=0;i<45&&(state.position.y>=5700||state.sonic.verticalSpeed>=0)&&state.phase==='running';i++){
    await page.clock.runFor(1000);state=await read(page);samples.push(compact(state));
  }
  await evidence(page,'ceiling-return',{above,returned:state,samples,errors});
  expect(state.phase).toBe('running');expect(state.position.y).toBeLessThan(6000);expect(state.sonic.verticalSpeed).toBeLessThan(0);
  expect(state.sonic.controlPitch).toBeLessThan(0);expect(state.sonic.grounded).toBe(false);expect(errors).toEqual([]);
});

test('actual descent stops on the solid hull sea contact and visible result/copy retain the correct centre and clearance',async({page})=>{
  test.setTimeout(60000);const errors=await start(page),samples=[];
  await page.locator('#throttle-input').press('End');await page.locator('#practice-pitch').press('Home');
  let state=await read(page);
  for(let i=0;i<70&&state.phase==='running';i++){
    await page.clock.runFor(1000);state=await read(page);samples.push(compact(state));
  }
  await step(page,'result');const impact=await read(page),s=impact.sonic,contact=s.terminal;
  await evidence(page,'sea-contact',{impact,samples,errors});
  expect(impact.phase).toBe('paused');expect(s.grounded).toBe(true);expect(s.complete).toBe(false);expect(contact.type).toBe('sea');
  expect(impact.position.y).toBeGreaterThan(0);expect(s.groundClearance).toBe(0);expect(contact.contactPoint.y).toBe(0);
  expect(contact.centerPosition).toEqual(impact.position);expect(contact.atSeconds).toBeCloseTo(s.simulationSeconds,8);
  expect(Number.isInteger(contact.hullVertexId)).toBe(true);expect(contact.hullVertexId).toBeGreaterThanOrEqual(0);expect(contact.hullVertexId).toBeLessThan(SUPERSONIC_AIRCRAFT_HULL.length);
  const q=new Quaternion(contact.orientation.x,contact.orientation.y,contact.orientation.z,contact.orientation.w);
  const points=SUPERSONIC_AIRCRAFT_HULL.map(v=>new Vector3(v.x,v.y,v.z).applyQuaternion(q).add(new Vector3(impact.position.x,impact.position.y,impact.position.z)));
  const lowest=points[contact.hullVertexId];
  expect(Math.min(...points.map(p=>p.y))).toBeCloseTo(0,6);
  for(const axis of ['x','y','z'])expect(lowest[axis]).toBeCloseTo(contact.contactPoint[axis],6);
  expect(s.afterburner.active).toBe(false);
  for(const gate of s.gateResults)if(gate.passedAtSeconds!==null)expect(gate.passedAtSeconds).toBeLessThanOrEqual(contact.atSeconds);
  await page.clock.runFor(5000);const held=await read(page);
  expect(held.phase).toBe('paused');expect(held.position).toEqual(impact.position);expect(held.sonic.simulationSeconds).toBe(s.simulationSeconds);
  expect(held.sonic.collected).toBe(s.collected);expect(held.sonic.gateResults).toEqual(s.gateResults);expect(held.sonic.complete).toBe(false);
  // Assert the actual visible result, not the old hidden veil/dialog text.
  await expect(page.locator('#start-flow-result-title')).toBeVisible();await expect(page.locator('#start-flow-result-title')).toContainText('海面');
  await expect(page.locator('#start-flow-result-description')).toContainText(`中心高度${impact.position.y.toFixed(2)}m`);
  await expect(page.locator('#start-flow-result-description')).toContainText('最下部の海面からの高さ0.00m');
  await expect(page.locator('#result-course-time')).toHaveText('未完了');await page.locator('#result-copy').click();
  const copied=await page.evaluate(()=>JSON.parse(window.sonicLimitCopied));
  await evidence(page,'sea-result-copy',{impact,held,copied,samples,errors});
  expect(copied.result).toBe('grounded');expect(copied.supersonic.grounded).toBe(true);expect(copied.supersonic.complete).toBe(false);
  expect(copied.supersonic.minimumSeaAltitude).toBeCloseTo(impact.position.y,7);expect(copied.supersonic.minimumSeaAltitude).toBeGreaterThan(0);
  expect(copied.supersonic.minimumSeaClearance).toBe(0);expect(copied.supersonic.simulationSeconds).toBe(s.simulationSeconds);
  expect(copied.supersonic.gateResults).toEqual(s.gateResults);expect(copied.courseTime.seconds).toBeNull();expect(copied.courseTime.newBest).toBe(false);
  expect(errors).toEqual([]);
});
