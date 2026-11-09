import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {state,launch,fly} from './helpers/sierra-flight.js';
const rad=Math.PI/180,artifacts='.cache/v0143-sierra-flow';
for(const camera of ['overlay','chase','cockpit'])test(`actual Sierra FD-only pilot completes all A..G in ${camera}`,async({page})=>{
 test.setTimeout(300000);await page.setViewportSize({width:390,height:844});const settings=await launch(page,camera);let evidence=null;
 try{
  evidence=await fly(page,settings);expect(evidence.errors).toEqual([]);expect(evidence.last.phase,JSON.stringify(evidence.trace.slice(-5))).toBe('complete');expect(evidence.last.collected).toBe(6);expect(evidence.maximumBank).toBeLessThanOrEqual(30*rad+.001);
  expect(evidence.last.stageSize).toMatchObject({halfExtent:1850,maxHeight:70,width:3700,depth:3700});expect(evidence.last.radar).toMatchObject({effectiveRange:1000,source:'course-profile'});
  for(const name of ['A','B','C','D','E','F','G'])expect(evidence.labels.some(label=>label.includes(' · '+name)),name).toBe(true);
  expect(evidence.trace.every(row=>row.position.y>=0&&row.position.y<=70&&!row.boundary.outside)).toBe(true);await page.locator('#result-copy').click();const report=await page.evaluate(()=>window.sierraCopy);
  expect(evidence.start.speed).toBeCloseTo(25,2);expect(evidence.start.burn).toMatchObject({unlimited:true,fuel:100});expect(report.course.flightProfile).toMatchObject({id:'sierra50-fast-v1',startSpeed:25,drySpeedLimit:60,afterburnerSpeedLimit:75,unlimitedAfterburner:true,turnGravity:15});expect(report.inactiveSettings).toContain('turnGravity');
  expect(report.course).toMatchObject({id:'sierra50',targetCount:6,geography:{estimatedGeography:true,surface:'flat',pointNames:['A','B','C','D','E','F','G']}});expect(report.segments.map(row=>row.label)).toEqual(['開始→A','A→B','B→C','C→D','D→E','E→F','F→G']);expect(report.segments.every(row=>Number.isFinite(row.seconds))).toBe(true);expect(report.segments.reduce((sum,row)=>sum+row.seconds,0)).toBeCloseTo(report.courseTime.seconds,5);
  expect(report.courseTime).toMatchObject({newBest:true,saved:true,mode:'flight'});expect(report.courseTime.courseKey).toMatch(/^flight:sierra50:/);const persisted=await page.evaluate(key=>JSON.parse(localStorage.getItem('twist.course-bests.v1')).records[key].seconds,report.courseTime.courseKey);expect(persisted).toBe(report.courseTime.seconds);
  await mkdir(artifacts,{recursive:true});await page.screenshot({path:`${artifacts}/${camera}-${Date.now()}-clear.png`});await page.reload();await page.clock.runFor(100);await expect.poll(async()=>{await page.clock.runFor(100);return page.locator('#app').evaluate(app=>JSON.parse(app.dataset.courseTime??'null')?.bestSeconds);}).toBe(report.courseTime.seconds);await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','title');
 }finally{await mkdir(artifacts,{recursive:true});await writeFile(`${artifacts}/${camera}-${Date.now()}.json`,JSON.stringify(evidence,null,2));await page.screenshot({path:`${artifacts}/${camera}-${Date.now()}.png`});}
});
for(const useAB of [false,true])test(`Sierra final lane records unlimited AB${useAB?'on':'off'}`,async({page})=>{
 test.setTimeout(300000);await page.setViewportSize({width:390,height:844});const settings=await launch(page,'cockpit');let evidence=null;
 try{evidence=await fly(page,settings,{useAB,finalApproachSpeed:20});expect(evidence.last.phase).toBe('complete');await page.locator('#result-copy').click();const report=await page.evaluate(()=>window.sierraCopy);const final=report.abStraights.find(row=>row.id==='sierra50-final');expect(final).toBeTruthy();expect(final.usedAfterburner).toBe(useAB);if(useAB)expect(final.afterburnerSeconds).toBeGreaterThan(0);else expect(final.afterburnerSeconds).toBe(0);expect(evidence.errors).toEqual([]);
 }finally{await mkdir(artifacts,{recursive:true});await writeFile(`${artifacts}/ab-${useAB}-${Date.now()}.json`,JSON.stringify(evidence,null,2));}
});
