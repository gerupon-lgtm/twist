import {COURSE} from '../src/course.js';
import {test,expect} from '@playwright/test';
// This fixture retains the Japanese/legacy display comparison. Default English guidance is covered in guidance/hud-language.spec.js.
test.beforeEach(async({page})=>{await page.addInitScript(value=>{if(!localStorage.getItem('twist.flight-settings.v1'))localStorage.setItem('twist.flight-settings.v1',JSON.stringify(value));},{"hudLanguage": "ja", "flightDirector": false, "edgeGuidance": false, "targetHeadingCue": false, "nextTargetNotice": false});});
import {flyRoute} from './helpers/fly-route.js';
test('exit opening is visible in all cameras, legacy is preserved and all four route times are copied',async({page})=>{
 test.setTimeout(90000);await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copied=text},configurable:true}));
 await page.clock.install();await page.goto('/?mode=flight');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(100);
 let sawApproach=false;const saw=await flyRoute(page,async()=>{
  expect(JSON.parse(await page.locator('#app').getAttribute('data-exit-appearance'))).toMatchObject({assisted:true,open:true,rings:3,minPixels:68,column:true,position:COURSE.exit,radius:4,stoneFrame:false});
  await expect.poll(async()=>{await page.clock.runFor(50);return JSON.parse(await page.locator('#feedback-diagnostics').getAttribute('data-audio')).lastEvent;}).toBe('exitOpen');await expect(page.locator('#toast')).toContainText('出口が開きました');
  for(const camera of ['chase','cockpit','overlay']){
   await page.locator('#pause-button').click();await page.locator('#camera-'+camera).click();await page.locator('#start-button').click();await page.clock.runFor(100);
   expect(JSON.parse(await page.locator('#app').getAttribute('data-exit-appearance'))).toMatchObject({open:true,rings:3});
   if(camera==='cockpit'){await expect(page.locator('#cockpit-exit-notice')).toBeVisible();await expect(page.locator('#cockpit-objective')).toHaveAttribute('data-target','exit');}
   await page.screenshot({path:`test-results/v0123-exit-${camera}.png`});
  }
  await page.locator('#pause-button').click();const before=await page.locator('#app').getAttribute('data-segments');await page.clock.runFor(5000);expect(await page.locator('#app').getAttribute('data-segments')).toBe(before);
  await page.locator('#view-classic').click();await page.clock.runFor(100);expect(JSON.parse(await page.locator('#app').getAttribute('data-exit-appearance'))).toMatchObject({assisted:false,rings:1,column:false,minPixels:0,stoneFrame:true});
  await page.locator('#view-assisted').click();await page.locator('#start-button').click();await page.clock.runFor(100);
 },async()=>{
  sawApproach=true;
  for(const camera of ['chase','cockpit','overlay']){
   await page.locator('#pause-button').click();await page.locator('#camera-'+camera).click();await page.locator('#start-button').click();await page.clock.runFor(100);
   const local=JSON.parse(await page.locator('#app').getAttribute('data-target-local'));expect(local.z,camera).toBeLessThan(0);
   await page.screenshot({path:`test-results/v0123-exit-approach-${camera}.png`});
  }
 });
 expect(saw).toBe(true);expect(sawApproach).toBe(true);await expect(page.locator('#dialog-title')).toHaveText('出口に到着しました');await page.locator('#result-copy').click();
 const report=await page.evaluate(()=>JSON.parse(window.copied));expect(report.segments.map(s=>s.id)).toEqual(['start-light1','light1-light2','light2-light3','light3-exit']);expect(report.segments.every(s=>s.seconds>0)).toBe(true);
 expect(report.exitDiscovery).toMatchObject({opened:true,firstVisibleSeconds:expect.any(Number)});expect(report.exitDiscovery.firstVisibleSeconds).toBeGreaterThanOrEqual(0);await expect(page.locator('#result-exit-discovery')).toContainText('秒');
 expect(report.segments.reduce((sum,s)=>sum+s.seconds,0)).toBeCloseTo(report.lastLeg.elapsedSeconds,5);await expect(page.locator('#result-segments > div')).toHaveCount(4);await expect(page.locator('#result-segments')).not.toContainText('未完了');
});
test('exit beacon renders from the side, diagonally and far away with a real minimum-size ring',async({page})=>{
 await page.goto('/?mode=flight');const readings=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js'),{createExitBeacon}=await import('/src/exit-beacon.js');
  const renderer=new THREE.WebGLRenderer({antialias:false});renderer.setSize(256,256);const scene=new THREE.Scene();scene.background=new THREE.Color(0xdcebf1);const beacon=createExitBeacon();scene.add(beacon.group);
  const camera=new THREE.PerspectiveCamera(84,1,.1,3000),out=[],pixels=new Uint8Array(256*256*4);
  for(const [name,x,y,z]of [['front',0,0,50],['side',50,0,0],['diagonal',40,15,40],['far',0,0,1000]]){
   camera.position.set(x,y,z);camera.lookAt(0,0,0);beacon.update({visible:true,unlocked:true,fov:84,height:256,time:0});renderer.render(scene,camera);renderer.getContext().readPixels(0,0,256,256,renderer.getContext().RGBA,renderer.getContext().UNSIGNED_BYTE,pixels);
   let count=0,min=256,max=0;for(let i=0;i<256*256;i++)if(pixels[i*4]>200&&pixels[i*4+1]>140&&pixels[i*4+2]<190){count++;min=Math.min(min,i%256);max=Math.max(max,i%256);}
   out.push({name,count,width:max-min+1});
  }
  beacon.update({visible:false,unlocked:true});out.push({hidden:!beacon.group.visible});beacon.dispose();renderer.dispose();return out;
 });
 for(const r of readings.slice(0,4)){expect(r.count,r.name).toBeGreaterThan(80);expect(r.width,r.name).toBeGreaterThanOrEqual(60);}expect(readings[4].hidden).toBe(true);
});
