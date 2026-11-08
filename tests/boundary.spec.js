import {test,expect} from '@playwright/test';

// Draft integration cases for root to run after adding the snippet/main call.
// These are DOM-layout fixtures, not evidence that the aircraft crossed an edge.
for(const camera of ['cockpit','chase','overlay'])for(const size of [[390,844],[360,640],[844,390]]){
 test(`storm warning fixture stays clear of controls and guidance ${camera} ${size}`,async({page})=>{
  await page.setViewportSize({width:size[0],height:size[1]});await page.clock.install();
  await page.goto(`/?mode=flight&course=easy&camera=${camera}`);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(150);
  const before=await page.locator('#app').getAttribute('data-position');
  const result=await page.evaluate(async()=>{
   const {updateBoundaryPanel}=await import('/src/boundary-panel.js');
   return updateBoundaryPanel({mode:'flight',position:{x:335,y:10,z:0},heading:Math.PI/2,speed:10},
    {phase:'running',settings:{hudLanguage:'en',turnGravity:9.8,maxBank:40}});
  });
  expect(result?.visible,result?.reason).toBe(true);await expect(page.locator('#stage-boundary-warning')).toBeVisible();
  await expect(page.locator('#boundary-title')).toHaveText('STORM');
  expect(await page.locator('#boundary-return-arrow').evaluate(e=>e.style.transform)).toBe('rotate(180deg)');
  const panel=await page.locator('#stage-boundary-warning').boundingBox();expect(panel.x).toBeGreaterThanOrEqual(0);expect(panel.y).toBeGreaterThanOrEqual(0);
  expect(panel.x+panel.width).toBeLessThanOrEqual(size[0]);expect(panel.y+panel.height).toBeLessThanOrEqual(size[1]);
  for(const selector of ['.navigation','#flight-essential-speed','#flight-essential-altitude','#radar','#bottom-panel','#practice-panel','#guidance-director','#guidance-flight-path','#guidance-heading']){
   const element=page.locator(selector);if(!await element.isVisible())continue;const r=await element.boundingBox();
   expect(panel.x<r.x+r.width&&panel.x+panel.width>r.x&&panel.y<r.y+r.height&&panel.y+panel.height>r.y,selector).toBe(false);
  }
  await page.evaluate(async()=>{
   const {updateBoundaryPanel}=await import('/src/boundary-panel.js');
   updateBoundaryPanel({position:{x:362,y:10,z:0},heading:Math.PI/2,speed:10},{settings:{hudLanguage:'ja'}});
  });
  await expect(page.locator('#stage-boundary-warning')).toHaveAttribute('data-level','outside');
  await expect(page.locator('#boundary-title')).toHaveText('内側へ戻る');
  expect(await page.locator('#app').getAttribute('data-position')).toBe(before);
  await page.evaluate(async()=>{const {updateBoundaryPanel}=await import('/src/boundary-panel.js');updateBoundaryPanel({position:{x:335,z:0},speed:10},{phase:'paused'});});
  await expect(page.locator('#stage-boundary-warning')).toBeHidden();
 });
}

test('unmodified low cockpit scene renders the ground and visible storm together',async({page})=>{
 test.setTimeout(60000);
 await page.goto('/?mode=flight&course=legacy&camera=cockpit');
 const result=await page.evaluate(async()=>{
  const threeUrl=performance.getEntriesByType('resource').map(entry=>entry.name)
   .find(url=>new URL(url).pathname.endsWith('/node_modules/.vite/deps/three.js'))
   ??'/node_modules/.vite/deps/three.js';
  const [THREE,{createStage},{getCourse}]=await Promise.all([
   import(threeUrl),import('/src/stage.js'),import('/src/course.js'),
  ]);
  const canvas=document.createElement('canvas');
  canvas.id='ground-storm-production-preview';
  Object.assign(canvas.style,{position:'fixed',inset:'0',zIndex:'30',width:'390px',height:'844px'});
  document.body.append(canvas);
  const prototype=THREE.Scene.prototype,beforeRender=prototype.onBeforeRender;
  const hadOwnHook=Object.hasOwn(prototype,'onBeforeRender');
  let stage,captured=null;
  prototype.onBeforeRender=function(renderer,scene,camera,...rest){
   if(renderer.domElement===canvas&&scene.getObjectByName('stage-storm-boundary'))captured={renderer,scene,camera};
   return beforeRender.call(this,renderer,scene,camera,...rest);
  };
  try{
   stage=createStage(canvas,{course:getCourse('legacy'),cameraMode:'cockpit',display:'fixed'});
   stage.resize(390,844,1);stage.launchFlight();
   const initial=stage.getStatus();let state=initial,frames=0;
   // Only ordinary pitch/throttle inputs advance the real simulation. Each
   // .1s update still uses the stage's normal internal force substeps.
   for(;frames<180&&state.groundClearance>3;frames++){
    stage.update(.1,{mode:'flight',pitchRate:frames<4?-.2:0,bankAngle:0,throttle:.3});
    state=stage.getStatus();
    if(state.grounded)throw new Error('The descent reached the ground before the combined render sample');
   }
   if(!captured)throw new Error('The production world renderer was not observed');
   const {renderer,scene,camera}=captured,storm=scene.getObjectByName('stage-storm-boundary');
   const mesh=storm?.getObjectByName('storm-perimeter-puffs');
   const floor=scene.getObjectByName('ground-outer-surface');
   if(!mesh?.isInstancedMesh||!storm.visible||!mesh.visible||!floor?.visible)
    throw new Error('The unmodified storm or floor is not enabled in the real scene');
   const gl=renderer.getContext(),width=gl.drawingBufferWidth,height=gl.drawingBufferHeight;
   const read=()=>{
    const pixels=new Uint8Array(width*height*4);
    gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;
   };
   const draw=()=>{renderer.clear();renderer.render(scene,camera);};
   // First capture is the actual production scene: no route/geometry/material
   // patch and no hidden storm. The paired capture is attribution only.
   draw();const actual=read();let withoutStorm;
   try{mesh.visible=false;draw();withoutStorm=read();}
   finally{mesh.visible=true;draw();}
   let groundPixels=0,unchangedGroundPixels=0,groundRegionPixels=0,stormAffectedPixels=0;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const index=((height-1-y)*width+x)*4;
    const r=actual[index],g=actual[index+1],b=actual[index+2];
    const difference=Math.abs(r-withoutStorm[index])+Math.abs(g-withoutStorm[index+1])+Math.abs(b-withoutStorm[index+2]);
    if(difference>=20)stormAffectedPixels++;
    // A broad lower region avoids requiring a particular landmark or a single
    // horizon pixel to remain unobscured by the legitimate cloud wall.
    if(y>=height*.65&&y<height*.95&&x>=width*.05&&x<width*.95){
     groundRegionPixels++;
     if(r>60&&r>g*1.15&&r>b*1.15){groundPixels++;if(difference<3)unchangedGroundPixels++;}
    }
   }
   return {initialPosition:initial.position,position:state.position,clearance:state.groundClearance,
    verticalSpeed:state.verticalSpeed,cameraMode:state.cameraMode,course:state.course.id,grounded:state.grounded,
    simulatedSeconds:frames*.1,stormInstances:mesh.count,stormVisible:storm.visible&&mesh.visible,
    width,height,groundPixels,unchangedGroundPixels,groundRegionPixels,stormAffectedPixels};
  }finally{
   try{stage?.dispose();}finally{
    if(hadOwnHook)prototype.onBeforeRender=beforeRender;else delete prototype.onBeforeRender;
    canvas.remove();
   }
  }
 });
 expect(result.course).toBe('legacy');expect(result.cameraMode).toBe('cockpit');
 expect(result.initialPosition).toEqual({x:0,y:14,z:26});
 expect(result.position.z).toBeLessThan(result.initialPosition.z);
 expect(result.clearance).toBeGreaterThan(2);expect(result.clearance).toBeLessThanOrEqual(3);
 expect(result.verticalSpeed).toBeLessThan(0);expect(result.grounded).toBe(false);
 expect(result.stormInstances).toBe(64);expect(result.stormVisible).toBe(true);
 expect(result.groundPixels).toBeGreaterThan(result.groundRegionPixels*.2);
 expect(result.unchangedGroundPixels).toBeGreaterThan(result.groundRegionPixels*.15);
 expect(result.stormAffectedPixels).toBeGreaterThan(500);
 console.log(JSON.stringify({combinedProductionGroundStorm:result}));
});
