import { test,expect } from '@playwright/test';
import { Quaternion,Vector3,Euler } from 'three';
const rad=d=>d*Math.PI/180;
const attr=(p,k)=>p.locator('#app').getAttribute('data-'+k);
const number=async(p,k)=>Number(await attr(p,k));
const parsed=async(p,k)=>JSON.parse(await attr(p,k));
const slider=(p,id,value)=>p.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
async function launch(page,camera='cockpit',extra='') {
 await page.clock.install({time:new Date('2026-11-07T08:00:00Z')});await page.goto('/?mode=flight&camera='+camera+extra);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(100);
}
const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;

test('camera choices fit three phone layouts and exploration keeps its existing view',async({page})=>{
 for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}]){
  await page.setViewportSize(size);await page.goto('/?mode=flight');
  await expect(page.locator('#app')).toHaveAttribute('data-camera','overlay');
  for(const id of ['intro-version','camera-overlay','camera-chase','camera-cockpit','start-button'])await expect(page.locator('#'+id)).toBeInViewport();
  await page.locator('#camera-chase').click();await expect(page).toHaveURL(/camera=chase/);
  expect(new URL(await page.locator('#home-link').getAttribute('href'),'https://example.test').searchParams.get('camera')).toBe('chase');
  await page.screenshot({path:`test-results/v0116-intro-${size.width}.png`});
 }
 await page.goto('/?mode=explore&camera=cockpit');await expect(page.locator('#app')).toHaveAttribute('data-camera','overlay');await expect(page.locator('#flight-camera-picker')).toBeHidden();
});

test('camera switches preserve every physical state and all cameras produce identical flight traces',async({page})=>{
 await page.goto('/?mode=flight');
 const result=await page.evaluate(async()=>{
  const {createStage}=await import('/src/stage.js');const traces=[];
  for(const cameraMode of ['overlay','chase','cockpit'])for(const display of ['bank','fixed']){
   const stage=createStage(document.createElement('canvas'),{cameraMode,display});stage.resize(390,844,1);stage.launchFlight();
   for(let i=0;i<90;i++)stage.update(1/60,{mode:'flight',pitchRate:.1,bankAngle:.3,throttle:.7,displayTwist:30});
   const before=stage.getStatus(),switched=[];
   for(const mode of ['chase','cockpit','overlay']){stage.setCameraMode(mode);switched.push(stage.getStatus());}
   traces.push({before,switched});stage.dispose();
  }return traces;
 });
 const keys=['position','orientation','velocity','speed','throttle','bank','pitch','grounded','collected','complete'];
 for(const row of result)for(const state of [row.before,...row.switched])for(const k of keys)expect(state[k]).toEqual(result[0].before[k]);
});

test('chase lags heading to expose the left side in a right turn and honors both bank displays',async({page})=>{
 await page.goto('/?mode=flight');
 const rows=await page.evaluate(async()=>{
  const {createStage}=await import('/src/stage.js');const rows=[];
  for(const display of ['bank','fixed']){
   const stage=createStage(document.createElement('canvas'),{cameraMode:'chase',display});stage.resize(390,844,1);stage.launchFlight();
   for(let i=0;i<60;i++)stage.update(1/60,{mode:'flight',pitchRate:.2,bankAngle:.4,throttle:.7,displayTwist:30});
   rows.push(stage.getStatus());stage.dispose();
  }return rows;
 });
 for(const s of rows){expect(s.chaseAngles.heading).toBeLessThan(s.heading);expect(s.chaseAngles.pitch).toBeLessThan(s.controlPitch);
  const side=new Vector3(s.viewPosition.x-s.position.x,s.viewPosition.y-s.position.y,s.viewPosition.z-s.position.z).applyQuaternion(new Quaternion(...Object.values(s.orientation)).invert());
  expect(side.x).toBeLessThan(0);expect(s.craftVisible).toBe(true);
 }
 expect(rows[0].worldCraftQuaternion).toEqual(Object.values(rows[0].orientation));
 const fixed=rows[1],screen=new Quaternion().fromArray(fixed.worldCraftScreenQuaternion);
 const upright=new Quaternion().setFromAxisAngle(new Vector3(0,0,1),-fixed.displayRoll).multiply(screen);
 // Camera-relative right axis has no vertical component after phone compensation.
 expect(Math.abs(new Vector3(1,0,0).applyQuaternion(upright).y)).toBeLessThan(1e-6);
});

test('cockpit hides both craft scenes, disables ground assistance and reports actual HUD values',async({page})=>{
 await launch(page);await slider(page,'practice-pitch',15);await page.clock.runFor(400);
 await expect(page.locator('#cockpit-hud')).toBeVisible();await expect(page.locator('#app')).toHaveAttribute('data-craft-visible','false');
 expect(await number(page,'view-assistance')).toBe(0);
 const readings=JSON.parse(await page.locator('#cockpit-hud').getAttribute('data-readings'));
 expect(readings.speed).toBeCloseTo(await number(page,'speed'),2);expect(readings.altitude).toBeCloseTo(await number(page,'ground-clearance'),4);
 await expect(page.locator('#cockpit-altitude')).toContainText('地面まで');await expect(page.locator('#cockpit-speed')).toContainText('m/s');
 const nose=await page.locator('[data-boresight]').getAttribute('transform'),track=await page.locator('[data-flight-path]').getAttribute('transform');expect(nose).not.toEqual(track);
 await page.screenshot({path:'test-results/v0116-cockpit-climb.png'});
});

test('cockpit horizon follows the actual camera plane and fixed phone roll while tapes remain stationary',async({page})=>{
 await launch(page,'cockpit','&display=fixed');const boxes=await page.locator('#cockpit-heading').boundingBox();
 await slider(page,'practice-twist',30);await slider(page,'practice-steer',20);await page.clock.runFor(500);
 const camera=await parsed(page,'camera-quaternion'),world=await parsed(page,'world-quaternion');
 const q=new Quaternion(camera.x,camera.y,camera.z,camera.w).invert().multiply(new Quaternion(world.x,world.y,world.z,world.w));
 const normal=new Vector3(0,1,0).applyQuaternion(q),horizon=JSON.parse(await page.locator('#cockpit-hud').getAttribute('data-horizon'));
 const f=844/(2*Math.tan(rad(await number(page,'vertical-fov'))/2));
 expect(horizon.a).toBeCloseTo(normal.x,8);expect(horizon.b).toBeCloseTo(-normal.y,8);expect(horizon.c).toBeCloseTo(-f*normal.z,8);
 expect(Math.abs(horizon.a)).toBeGreaterThan(.1);
 const glyph=await page.locator('[data-flight-path]').getAttribute('transform');
 expect(Number(glyph.match(/rotate\(([-\d.]+)\)/)[1])).toBeCloseTo(Math.atan2(horizon.a,-horizon.b)*180/Math.PI,7);
 expect(await page.locator('#cockpit-heading').boundingBox()).toEqual(boxes);
 for(const id of ['cockpit-speed','cockpit-altitude','cockpit-heading','cockpit-power','radar','bottom-panel'])expect(await page.locator('#'+id).evaluate(el=>{const m=new DOMMatrix(getComputedStyle(el).transform);return[m.a,m.b,m.c,m.d];})).toEqual([1,0,0,1]);
 await page.screenshot({path:'test-results/v0116-cockpit-fixed-roll.png'});
});

for(const camera of ['overlay','chase'])test(`${camera} engine power changes twin exhaust and switching in the pause menu retains position`,async({page})=>{
 await launch(page,camera);const strengths=[];
 for(const power of [0,30,100]){await slider(page,'throttle-input',power);await page.clock.runFor(100);strengths.push(await parsed(page,'aircraft'));}
 expect(strengths[0].exhaustVisible).toBe(false);expect(strengths[2].exhaustLength).toBeGreaterThan(strengths[1].exhaustLength);expect(strengths[2].exhaustOpacity).toBeGreaterThan(strengths[1].exhaustOpacity);
 await page.screenshot({path:'test-results/v0116-aircraft-'+camera+'.png'});
 await page.locator('#pause-button').click();await page.clock.runFor(100);const position=await attr(page,'position'),orientation=await attr(page,'orientation');
 for(const choice of ['overlay','chase','cockpit']){await page.locator('#camera-'+choice).click();await page.clock.runFor(100);expect(await attr(page,'position')).toBe(position);expect(await attr(page,'orientation')).toBe(orientation);}
 await page.locator('#flight-adjustments > summary').click();await expect(page.locator('#setting-chaseTimeConstant')).toBeDisabled();
 await page.locator('#camera-chase').click();await expect(page.locator('#setting-chaseTimeConstant')).toBeEnabled();await slider(page,'setting-chaseTimeConstant',0);
 await page.locator('#settings-copy').click();
 const report=await page.locator('#settings-copy-text').inputValue();if(report)expect(JSON.parse(report)).toMatchObject({camera:'chase',settings:{chaseTimeConstant:0}});
});

for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}])test(`cockpit stationary HUD, radar and buttons stay separate at ${size.width}x${size.height}`,async({page})=>{
 await page.setViewportSize(size);await launch(page,'cockpit','&display=fixed');await slider(page,'practice-twist',30);await page.clock.runFor(300);
 const rectangles=await page.evaluate(()=>{
  const ids=['cockpit-speed','cockpit-altitude','cockpit-heading','cockpit-power','radar','bottom-panel'];
  return ids.map(id=>{const el=document.getElementById(id),r=el.getBoundingClientRect();return{id,left:r.left,right:r.right,top:r.top,bottom:r.bottom,visible:!el.hidden};});
 });
 for(const r of rectangles){expect(r.visible).toBe(true);expect(r.left).toBeGreaterThanOrEqual(0);expect(r.right).toBeLessThanOrEqual(size.width);expect(r.top).toBeGreaterThanOrEqual(0);expect(r.bottom).toBeLessThanOrEqual(size.height);}
 for(let i=0;i<rectangles.length;i++)for(let j=i+1;j<rectangles.length;j++)expect(overlap(rectangles[i],rectangles[j]),`${rectangles[i].id}/${rectangles[j].id}`).toBe(false);
 await expect(page.locator('#pause-button')).toBeInViewport();await expect(page.locator('#throttle-input')).toBeInViewport();await page.screenshot({path:`test-results/v0116-cockpit-${size.width}.png`});
});

test('rendered cockpit ground horizon meets the conformal HUD horizon in actual WebGL pixels',async({page})=>{
 await page.goto('/?mode=flight');
 const result=await page.evaluate(async()=>{
  const {createStage}=await import('/src/stage.js');const {cockpitProjection}=await import('/src/cockpit-projection.js');
  const canvas=document.createElement('canvas'),stage=createStage(canvas,{cameraMode:'cockpit',display:'fixed'});stage.resize(390,844,1);stage.launchFlight();
  const rows=[];
  for(const twist of [0,30,-30]){
   for(let i=0;i<30;i++)stage.update(1/60,{mode:'flight',throttle:.5,displayTwist:twist,displayTimeConstant:0});
   const state=stage.getStatus(),projection=cockpitProjection(state,390,844),n=projection.horizon,x=5;
   const y=422-(n.a*(x-195)+n.c)/n.b,gl=canvas.getContext('webgl2');
   const read=screenY=>{const rgba=new Uint8Array(4);gl.readPixels(x,844-Math.round(screenY)-1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,rgba);return [...rgba];};
   rows.push({above:read(y-3),below:read(y+3)});
  }stage.dispose();return rows;
 });
 for(const row of result){expect(row.above[1]).toBeGreaterThan(row.above[0]);expect(row.below[0]).toBeGreaterThan(row.below[1]*1.2);}
});

test('cockpit clipping never adds visible islands outside the central HUD window',async({page})=>{
 await launch(page);
 const result=await page.evaluate(async()=>{
  const {createStage}=await import('/src/stage.js');const {updateCockpitHud}=await import('/src/cockpit-hud.js');
  const stage=createStage(document.createElement('canvas'),{cameraMode:'cockpit'});stage.resize(390,844,1);stage.launchFlight();
  const marker=document.getElementById('target-edge-marker');marker.hidden=false;marker.style.left='35px';marker.style.top='220px';
  updateCockpitHud(stage.getStatus(),true);
  const path=new Path2D(document.querySelector('#cockpit-clip path').getAttribute('d'));
  const ctx=document.createElement('canvas').getContext('2d');
  const results=[ctx.isPointInPath(path,35,220,'evenodd'),ctx.isPointInPath(path,200,350,'evenodd')];stage.dispose();return results;
 });expect(result).toEqual([false,true]);
});

test('chase UI exposes a side in a right climb and fixed display keeps its visible wings upright',async({page})=>{
 await launch(page,'chase');await slider(page,'practice-steer',15);await slider(page,'practice-pitch',15);await page.clock.runFor(900);
 const position=await parsed(page,'position'),view=await parsed(page,'view-position'),body=await parsed(page,'orientation');
 const side=new Vector3(view.x-position.x,view.y-position.y,view.z-position.z).applyQuaternion(new Quaternion(body.x,body.y,body.z,body.w).invert());
 expect(side.x).toBeLessThan(-.01);await expect(page.locator('#app')).toHaveAttribute('data-craft-visible','true');
 await page.screenshot({path:'test-results/v0116-chase-turn-bank.png'});
 await page.locator('#pause-button').click();await page.locator('#display-fixed').click();await page.clock.runFor(100);
 const screen=new Quaternion().fromArray(await parsed(page,'world-craft-screen-quaternion'));
 expect(Math.abs(new Vector3(1,0,0).applyQuaternion(screen).y)).toBeLessThan(1e-6);
 await page.screenshot({path:'test-results/v0116-chase-turn-fixed.png'});
});
