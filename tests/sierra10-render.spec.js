import {test,expect} from '@playwright/test';import {mkdir,writeFile} from 'node:fs/promises';
test('low-land GPU projection and ground pixels remain stable across origins and all views',async({page})=>{
 test.setTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});await page.setViewportSize({width:390,height:844});
 // Warm the real entry's dependencies before the module-free GPU fixture.
 // Vite's first dependency optimisation otherwise reloads a dynamic import.
 await page.goto('/');await expect(page.locator('#app')).toHaveAttribute('data-phase',/./);await page.goto('/tests/fixtures/supersonic-renderer.html');
 const result=await page.evaluate(async()=>{
  const {createSupersonicRenderer}=await import('/src/supersonic/renderer.js'),{createSupersonicProfile}=await import('/src/supersonic/profile.js'),{createSupersonicState,supersonicOrientation}=await import('/src/supersonic/physics.js'),{SIERRA10_COURSE}=await import('/src/courses/sierra10.js'),{rotateVector}=await import('/src/supersonic/gate-crossing.js');
  const r=createSupersonicRenderer(document.getElementById('fixture'),{course:SIERRA10_COURSE});r.resize(390,844,1);const results=[];
  try{for(const camera of ['overlay','chase','cockpit'])for(const p of [SIERRA10_COURSE.start,SIERRA10_COURSE.lights[5]]){
   r.setCameraMode(camera);const state={...createSupersonicState(createSupersonicProfile(null,SIERRA10_COURSE),SIERRA10_COURSE),position:{...p},orientation:supersonicOrientation(.22,0,.1),heading:.22,pitch:0,bank:.1,speed:250,mach:250/340};
   const offset=rotateVector({x:2,y:1,z:-150},state.orientation),target={x:p.x+offset.x,y:p.y+offset.y,z:p.z+offset.z},origin={x:Math.floor(p.x/1024)*1024,y:0,z:Math.floor(p.z/1024)*1024},next={x:origin.x+1024,y:0,z:origin.z-1024};
   r.sync(state,{},0,{origin,phase:'running'});const a=r.drawMarkerDiagnostic(target,{radiusMetres:1}),frameA=r.readFrameDiagnostic();
   r.sync(state,{},0,{origin:next,phase:'running'});const b=r.drawMarkerDiagnostic(target,{radiusMetres:1}),frameB=r.readFrameDiagnostic();let changed=0,total=0;for(let i=0;i<frameA.pixels.length;i+=4){let d=0;for(let c=0;c<3;c++)d+=Math.abs(frameA.pixels[i+c]-frameB.pixels[i+c]);if(d>15)changed++;total+=d;}
   results.push({camera,position:p,a,b,changedFraction:changed/(390*844),meanDifference:total/(390*844*3),snapshot:r.snapshot()});
  }}finally{r.dispose();}return results;
 });
 await mkdir('.cache',{recursive:true});await writeFile('.cache/v0142-sierra10-gpu-origin.json',JSON.stringify({result,errors},null,2));
 for(const row of result){expect(row.a.pixels).toBeGreaterThan(0);expect(row.b.pixels).toBeGreaterThan(0);expect(Math.hypot(row.a.centroid.x-row.b.centroid.x,row.a.centroid.y-row.b.centroid.y)).toBeLessThan(1);expect(row.changedFraction).toBeLessThan(.015);expect(row.meanDifference).toBeLessThan(.5);expect(row.snapshot.world.ground.kind).toBe('land');expect(row.snapshot.gpu.calls).toBeGreaterThan(0);}
 expect(errors).toEqual([]);
});
