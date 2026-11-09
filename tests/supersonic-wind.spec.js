import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';import {APP_VERSION} from '../src/version.js';
for(const course of ['supersonic','sierra10'])for(const camera of ['overlay','chase','cockpit'])test(`actual wind flow runs in ${course} ${camera}`,async({page})=>{
  test.setTimeout(45000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(camera=>{
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,bgm:false,vibration:false}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
  },camera);
  await page.goto(`/?course=${course}&camera=${camera}&v=${APP_VERSION}`);
  await page.locator('#start-flow-start').click();await page.locator('#start-flow-course-start').click();await page.locator('#start-flow-hold').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:12000});
  const status=()=>page.locator('#app').evaluate(el=>JSON.parse(el.dataset.supersonic));
  await expect.poll(async()=>(await status()).renderDiagnostics.speedEffects.windCount).toBeGreaterThan(0);
  const first=await status();expect(first.renderDiagnostics.speedEffects.windVisible).toBe(true);
  await page.waitForTimeout(450);const later=await status();expect(later.simulationSeconds).toBeGreaterThan(first.simulationSeconds);
  if(course==='sierra10'){expect(later.mach).toBeLessThan(1);expect(later.renderDiagnostics.speedEffects.shockVisible).toBe(false);expect(later.renderDiagnostics.aircraft.sonicExhaust).toBe(false);}
  await page.screenshot({path:`.cache/v${APP_VERSION.replaceAll('.','')}-wind-${course}-${camera}.png`});
  await page.locator('#pause-button').click();expect((await status()).renderDiagnostics.speedEffects.windVisible).toBe(false);
  expect(errors).toEqual([]);await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-wind-${course}-${camera}.json`,JSON.stringify({first,later,errors},null,2));
});
test('GPU wind changes the periphery and keeps central terrain pixels identical in both high-speed worlds',async({page})=>{
  test.setTimeout(90000);await page.goto('/tests/fixtures/supersonic-renderer.html');
  const rows=await page.evaluate(async()=>{
    const {createSupersonicRenderer}=await import('/src/supersonic/renderer.js');
    const {createSupersonicState}=await import('/src/supersonic/physics.js');
    const {createSupersonicProfile}=await import('/src/supersonic/profile.js');
    const {SUPERSONIC_COURSE}=await import('/src/supersonic/course.js');
    const {SIERRA10_COURSE}=await import('/src/courses/sierra10.js');const rows=[];
    for(const course of [SUPERSONIC_COURSE,SIERRA10_COURSE])for(const camera of ['chase','cockpit']){
      const renderer=createSupersonicRenderer(document.querySelector('canvas'),{course,cameraMode:camera});renderer.resize(390,844,1);
      try{
        const state={...createSupersonicState(createSupersonicProfile(undefined,course),course),simulationSeconds:2.17,speed:course.id==='sierra10'?280:500,mach:course.id==='sierra10'?.82:1.47};
        const input={highSpeedShake:false,speedFov:0,streakAmount:0};
        renderer.sync(state,input,0,{phase:'running'});const off=renderer.readFrameDiagnostic();
        renderer.sync(state,{...input,streakAmount:1},0,{phase:'running'});const on=renderer.readFrameDiagnostic();
        let centralChanges=0,peripheralChanges=0;
        for(let y=0;y<844;y++)for(let x=0;x<390;x++){
          const i=(y*390+x)*4;if(on.pixels[i]===off.pixels[i]&&on.pixels[i+1]===off.pixels[i+1]&&on.pixels[i+2]===off.pixels[i+2])continue;
          if(Math.abs((x+.5)/390*2-1)<.77&&Math.abs((y+.5)/844*2-1)<.77)centralChanges++;else peripheralChanges++;
        }
        rows.push({course:course.id,camera,centralChanges,peripheralChanges,...renderer.snapshot().speedEffects});
      }finally{renderer.dispose();}
    }return rows;
  });
  for(const row of rows){expect(row.windCount).toBeGreaterThan(0);expect(row.centralChanges).toBe(0);expect(row.peripheralChanges).toBeGreaterThan(300);}
  await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-wind-gpu.json`,JSON.stringify(rows,null,2));
});
test('isolated ribbon draw survives the production near plane and fades to transparency without darkening',async({page})=>{
  await page.goto('/tests/fixtures/supersonic-renderer.html');
  const result=await page.evaluate(async()=>{
    const THREE=await import('/node_modules/three/build/three.module.js');
    const {createSupersonicWind}=await import('/src/supersonic-wind.js');
    const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:false});renderer.setSize(390,844,false);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x204e68);
    // Same near plane as the production high-speed renderer; no existing speed lines.
    const camera=new THREE.PerspectiveCamera(64,390/844,2,100);scene.add(camera);
    const wind=createSupersonicWind();camera.add(wind.mesh);
    const target=new THREE.WebGLRenderTarget(390,844),render=()=>{renderer.setRenderTarget(target);renderer.render(scene,camera);const out=new Uint8Array(390*844*4);renderer.readRenderTargetPixels(target,0,0,390,844,out);return out;};
    try{
      wind.mesh.visible=false;const blank=render();
      wind.update({speed:500,timeSeconds:1.7,aspect:390/844,verticalFov:64});const active=render();
      const attribute=wind.mesh.geometry.attributes.color;
      for(let i=0;i<attribute.count;i++){if(attribute.itemSize===4)attribute.array[i*4+3]=0;else{attribute.array[i*3]=attribute.array[i*3+1]=attribute.array[i*3+2]=0;}}
      attribute.needsUpdate=true;const faded=render();let changed=0,darkened=0,central=0,fadeChanges=0;
      for(let y=0;y<844;y++)for(let x=0;x<390;x++){
        const i=(y*390+x)*4;
        if(active[i]!==blank[i]||active[i+1]!==blank[i+1]||active[i+2]!==blank[i+2]){changed++;if(Math.abs((x+.5)/390*2-1)<.77&&Math.abs((y+.5)/844*2-1)<.77)central++;}
        if(active[i]<blank[i]||active[i+1]<blank[i+1]||active[i+2]<blank[i+2])darkened++;
        if(faded[i]!==blank[i]||faded[i+1]!==blank[i+1]||faded[i+2]!==blank[i+2])fadeChanges++;
      }return{changed,darkened,central,fadeChanges,near:camera.near};
    }finally{wind.dispose();target.dispose();renderer.dispose();}
  });
  await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-wind-isolated-gpu.json`,JSON.stringify(result,null,2));
  expect(result.changed).toBeGreaterThan(800);expect(result.darkened).toBe(0);expect(result.central).toBe(0);expect(result.fadeChanges).toBe(0);
});
