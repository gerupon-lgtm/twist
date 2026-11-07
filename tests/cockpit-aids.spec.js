import { test,expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const baseline=JSON.parse(await readFile('tests/fixtures/ui-v0120.json','utf8'));
const sizes=[{width:390,height:844},{width:360,height:640},{width:844,height:390}];
const slider=(page,id,value)=>page.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
async function launch(page,camera='cockpit') {
 await page.goto('/?mode=flight&camera='+camera);await page.locator('#practice-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
}
async function launchSensors(page) {
 await page.addInitScript(()=>{
  class Orientation extends Event {static requestPermission(){return Promise.resolve('granted');}}
  class Motion extends Event {static requestPermission(){return Promise.resolve('granted');}}
  Object.defineProperty(window,'DeviceOrientationEvent',{value:Orientation,configurable:true});Object.defineProperty(window,'DeviceMotionEvent',{value:Motion,configurable:true});
 });
 await page.goto('/?mode=flight&camera=cockpit');await page.locator('#start-button').click();
 await page.evaluate(()=>{
  const send=()=>{window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta:0,gamma:0}));window.dispatchEvent(Object.assign(new Event('devicemotion'),{rotationRate:{alpha:0,beta:0,gamma:0}}));};send();window.heartbeat=setInterval(send,100);
 });
 await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');await page.locator('#start-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
}
for(const size of sizes)test(`compact cockpit keeps scenery, HUD and touch controls clear at ${size.width}x${size.height}`,async({page})=>{
 await page.setViewportSize(size);await launchSensors(page);
 expect((await page.locator('.navigation').boundingBox()).height).toBeLessThanOrEqual(38);
 expect((await page.locator('.topbar').boundingBox()).height).toBeLessThanOrEqual(36);
 expect((await page.locator('#bottom-panel').boundingBox()).height).toBeLessThan(130);
 for(const id of ['pause-button','recenter-button'])expect((await page.locator('#'+id).boundingBox()).height).toBeGreaterThanOrEqual(40);
 await expect(page.locator('#cockpit-power')).not.toContainText('出力');await expect(page.locator('#throttle-value')).toBeVisible();
 const rects=await page.evaluate(()=>['.brand','.version','.navigation','.feedback-metrics summary','#cockpit-speed','#cockpit-altitude','#cockpit-vario','#cockpit-heading','#cockpit-power','#radar','#bottom-panel'].map(selector=>{
  const e=document.querySelector(selector),r=e.getBoundingClientRect();return{selector,left:r.left,right:r.right,top:r.top,bottom:r.bottom};
 }));
 for(const r of rects){expect(r.left,r.selector).toBeGreaterThanOrEqual(0);expect(r.right,r.selector).toBeLessThanOrEqual(size.width);expect(r.top,r.selector).toBeGreaterThanOrEqual(0);expect(r.bottom,r.selector).toBeLessThanOrEqual(size.height);}
 for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++)expect(overlap(rects[i],rects[j]),`${rects[i].selector}/${rects[j].selector}`).toBe(false);
 await page.screenshot({path:`test-results/v0121-cockpit-${size.width}.png`});
});
test('overlay and chase keep all six previously published panel layouts',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('twist.flight-settings.v1',JSON.stringify({targetHeightGuide:false})));
 for(const sample of baseline){
  await page.setViewportSize({width:sample.width,height:sample.height});await launch(page,sample.camera);
  for(const [selector,wanted]of Object.entries(sample.rects)){
   const actual=await page.locator(selector).boundingBox();for(const key of ['x','y','width','height'])expect(Math.abs(actual[key]-wanted[key]),`${sample.camera}/${sample.width}/${selector}/${key}`).toBeLessThan(.6);
  }
 }
});
test('pitch ladder follows only nearby angles and the displayed range persists',async({page})=>{
 await launch(page);await slider(page,'practice-pitch',20);await page.waitForTimeout(900);
 const angles=await page.locator('[data-pitch-level]').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.pitchLevel)));
 const pitch=await page.locator('#app').getAttribute('data-flight-pitch').then(Number).then(n=>n*180/Math.PI);
 expect(angles.length).toBeGreaterThan(0);expect(angles.every(n=>Math.abs(n-pitch)<=10.5)).toBe(true);
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await slider(page,'setting-ladderRange',5);
 await page.reload();await launch(page);await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await expect(page.locator('#setting-ladderRange')).toHaveValue('5');
});
test('automatic FOV preserves the original projection and manual FOV narrows only cockpit',async({page})=>{
 await launch(page);const initial=Number(await page.locator('#app').getAttribute('data-vertical-fov'));
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await expect(page.locator('#cockpit-fov-auto')).toBeChecked();
 await page.locator('#view-classic').click();await expect(page.locator('#setting-cockpitFov')).toHaveAttribute('max','64');await expect(page.locator('#setting-value-cockpitFov')).toContainText('64.0');
 await page.locator('#view-assisted').click();expect(Number(await page.locator('#setting-cockpitFov').getAttribute('max'))).toBeGreaterThan(64);
 await page.locator('#cockpit-fov-auto').uncheck();await slider(page,'setting-cockpitFov',60);await page.locator('#start-button').click();
 await expect.poll(()=>page.locator('#app').getAttribute('data-vertical-fov').then(Number)).toBe(60);expect(initial).toBeGreaterThan(60);
 await page.locator('#pause-button').click();await page.locator('#camera-overlay').click();
 await expect.poll(()=>page.locator('#app').getAttribute('data-vertical-fov').then(Number)).toBeCloseTo(initial,6);
});
test('vertical bar follows climb and descent, vario can be disabled and remains saved',async({page})=>{
 await page.addInitScript(()=>{if(!localStorage.getItem('twist.feedback-settings.v1'))localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({bgm:false,vario:true}));});
 await launch(page);await slider(page,'throttle-input',100);await slider(page,'practice-pitch',25);
 await expect(page.locator('#cockpit-vario')).toHaveAttribute('data-direction','up');
 await expect.poll(()=>page.locator('#feedback-diagnostics').getAttribute('data-audio').then(s=>JSON.parse(s).varioActive)).toBe(true);
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await page.locator('#feedback-vario').uncheck();
 await page.locator('#start-button').click();await slider(page,'throttle-input',100);await slider(page,'practice-pitch',-25);
 await expect(page.locator('#cockpit-vario')).toHaveAttribute('data-direction','down');
 expect(JSON.parse(await page.locator('#feedback-diagnostics').getAttribute('data-audio')).varioActive).toBe(false);
 await page.reload();await page.locator('#practice-button').click();await page.locator('#pause-button').click();await page.locator('#flight-adjustments > summary').click();await expect(page.locator('#feedback-vario')).not.toBeChecked();
});
test('assisted scenery toggles as a whole while legacy keeps its original world and physical state',async({page})=>{
 await launch(page);await expect.poll(()=>page.locator('#app').getAttribute('data-scenery').then(JSON.parse)).toMatchObject({visible:true,islands:12,towerHeight:116,clouds:12,suns:1,fogless:true,collisions:false});
 await page.locator('#pause-button').click();const position=await page.locator('#app').getAttribute('data-position');
 await page.locator('#view-classic').click();await expect.poll(()=>page.locator('#app').getAttribute('data-scenery').then(JSON.parse)).toMatchObject({visible:false});
 expect(await page.locator('#app').getAttribute('data-position')).toBe(position);
 await page.locator('#view-assisted').click();await expect.poll(()=>page.locator('#app').getAttribute('data-scenery').then(JSON.parse)).toMatchObject({visible:true});
});
test('distant islands and ruins render identically with stage fog present or absent',async({page})=>{
 await page.goto('/?mode=flight');
 const result=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/.vite/deps/three.js'),{createScenery}=await import('/src/scenery.js');
  const canvas=document.createElement('canvas'),renderer=new THREE.WebGLRenderer({canvas,antialias:false});renderer.setSize(390,844);renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xdcebf1);const scenery=createScenery();scenery.group.children.slice(3).forEach(n=>n.visible=false);scene.add(scenery.group);
  const camera=new THREE.PerspectiveCamera(64,390/844,.1,1800);camera.position.set(0,7,26);camera.lookAt(0,30,-600);
  const read=()=>{renderer.render(scene,camera);const a=new Uint8Array(390*844*4);renderer.getContext().readPixels(0,0,390,844,renderer.getContext().RGBA,renderer.getContext().UNSIGNED_BYTE,a);return a;};
  scene.fog=new THREE.Fog(0xdcebf1,48,156);const fog=read();scene.fog=null;const clear=read();let changed=0,drawn=0;
  for(let i=0;i<fog.length;i+=4){if(fog[i]!==clear[i]||fog[i+1]!==clear[i+1]||fog[i+2]!==clear[i+2])changed++;if(clear[i]!==220||clear[i+1]!==235||clear[i+2]!==241)drawn++;}
  renderer.dispose();return{changed,drawn};
 });
 expect(result.changed).toBe(0);expect(result.drawn).toBeGreaterThan(500);
});
