import {test,expect} from '@playwright/test';import {writeFile} from 'node:fs/promises';import {APP_VERSION} from '../src/version.js';
test('GPU long wind traces cover more moving edge pixels than v47 without entering the central HUD',async({page})=>{
 await page.goto('/tests/fixtures/supersonic-renderer.html');
 const rows=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js'),{createSupersonicWind}=await import('/src/supersonic-wind.js'),{createSupersonicWind:oldWind}=await import('/tests/fixtures/supersonic-wind-v0147.js'),rows=[];
  for(const [w,h]of [[390,844],[844,390]]){
   const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:false});renderer.setSize(w,h,false);
   const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(64,w/h,2,100),target=new THREE.WebGLRenderTarget(w,h);scene.background=new THREE.Color(0x204e68);scene.add(camera);
   const old=oldWind(),now=createSupersonicWind();camera.add(old.mesh,now.mesh);
   const draw=()=>{renderer.setRenderTarget(target);renderer.render(scene,camera);const p=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(target,0,0,w,h,p);return p;};
   try{old.mesh.visible=now.mesh.visible=false;const blank=draw();
    for(const speed of [200,340,680]){const images=[];
     for(const fx of [old,now]){old.mesh.visible=now.mesh.visible=false;fx.update({speed,timeSeconds:.27,aspect:w/h});images.push(draw());}
     let previous=0,current=0,central=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,changed=(p)=>p[i]!==blank[i]||p[i+1]!==blank[i+1]||p[i+2]!==blank[i+2];if(changed(images[0]))previous++;if(changed(images[1])){current++;if(Math.abs((x+.5)/w*2-1)<.77&&Math.abs((y+.5)/h*2-1)<.77)central++;}}
     rows.push({w,h,speed,previous,current,central,...now.snapshot()});
    }
   }finally{old.dispose();now.dispose();target.dispose();renderer.dispose();}
  }return rows;
 });
 await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-wind-comparison.json`,JSON.stringify(rows,null,2));for(const r of rows){expect(r.central).toBe(0);expect(r.current).toBeGreaterThan(r.previous*1.5);}
});
test('native speed SE is audible, responds to airspeed, and mixes safely with maximum SCC/FM plus sonic impact',async({page})=>{
 test.setTimeout(90000);await page.goto('/tests/fixtures/music-offline.html');await page.waitForFunction(()=>window.fixtureReady);const rows=[];
 for(const rate of [44100,48000])for(const engine of ['scc','fm'])for(const id of ['ignition','overdrive']){
  const row=await page.evaluate(o=>window.renderWholeTrack(o),{id,engine,rate,volume:100,bgmVolume:100,sonic:true,speedSound:true,speed:680,durationSeconds:2.2});rows.push(row);
  expect(row.invalid).toBe(0);expect(row.metrics.speedSound.enabled).toBe(true);expect(row.metrics.speedSound.hz).toBeGreaterThan(500);for(const c of row.channels){expect(c.fullScale).toBe(0);expect(c.peak).toBeLessThan(1);}
 }
 await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-speed-SE-native-mix.json`,JSON.stringify(rows,null,2));
});
test('native speed SE changes actual PCM separately from wind, follows speed, and vanishes under a warning',async({page})=>{
 await page.goto('/tests/fixtures/music-offline.html');await page.waitForFunction(()=>window.fixtureReady);const rows=[];
 for(const rate of [44100,48000]){
  const render=options=>page.evaluate(o=>window.renderWholeTrack(o),{id:'ignition',engine:'scc',rate,volume:100,bgmVolume:0,flight:true,durationSeconds:1.2,...options});
  const off=await render({speed:200,speedSound:false}),slow=await render({speed:200,speedSound:true}),fast=await render({speed:680,speedSound:true});
  const warningOff=await render({speed:340,ground:true,speedSound:false}),warningOn=await render({speed:340,ground:true,speedSound:true});
  expect(slow.channels[0].sha256).not.toBe(off.channels[0].sha256);expect(slow.channels[0].rms).toBeGreaterThan(.001);expect(fast.metrics.speedSound.hz).toBeGreaterThan(slow.metrics.speedSound.hz+150);
  expect(warningOn.channels[0].sha256).toBe(warningOff.channels[0].sha256);expect(warningOn.metrics.speedSound.enabled).toBe(false);rows.push({rate,off,slow,fast,warningOff,warningOn});
 }
 await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-speed-SE-native-PCM.json`,JSON.stringify(rows,null,2));
});
test('actual flight couples acceleration SE, one large crossing vibration, BGM and pause',async({page})=>{
 test.setTimeout(35000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera:'cockpit'}));localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
  localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:true,sfx:true,speedSound:true,bgm:true,musicEngine:'scc',musicSet:'ignition',volume:25,vibration:true,vibrationScale:1}));
  Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,configurable:true});window.speedVibrations=[];Object.defineProperty(navigator,'vibrate',{value:p=>{speedVibrations.push({p,at:performance.now()});return true;},configurable:true});
 });
 await page.goto('/?course=supersonic');await page.locator('#start-flow-start').click();await page.locator('#start-flow-course-start').click();await page.locator('#start-flow-hold').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:10000});
 const audio=()=>page.locator('#feedback-diagnostics').evaluate(e=>JSON.parse(e.dataset.audio));await expect.poll(async()=>(await audio()).speedSound?.enabled).toBe(true);const initial=await audio();
 await page.locator('#throttle-input').press('End');await expect.poll(async()=>{const a=await audio();return Boolean(a.speedSound?.enabled&&a.speedSound.acceleration>.05);},{timeout:6000,intervals:[100]}).toBe(true);const accelerating=await audio();
 expect(accelerating.speedSound.hz).toBeGreaterThan(initial.speedSound.hz+10);
 await expect.poll(()=>page.evaluate(()=>speedVibrations.filter(v=>Array.isArray(v.p)&&v.p.join(',')==='280,45,200').length),{timeout:15000,intervals:[100]}).toBe(1);
 const vibrations=await page.evaluate(()=>speedVibrations);await page.locator('#pause-button').click();await expect.poll(async()=>(await audio()).contextState).toBe('suspended');expect(errors).toEqual([]);
 await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-real-acceleration-impact.json`,JSON.stringify({initial,accelerating,vibrations,errors,hardware:'Browser request observation; Pixel 9a motor strength remains a device check'},null,2));
});
