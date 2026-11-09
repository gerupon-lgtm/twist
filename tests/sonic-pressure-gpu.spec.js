import {test,expect} from '@playwright/test';import {writeFile} from 'node:fs/promises';import {APP_VERSION} from '../src/version.js';
test('before the sonic crossing, side haze is faint and feathered with no rectangular inner edge',async({page})=>{
 await page.goto('/tests/fixtures/supersonic-renderer.html');
 const result=await page.evaluate(async()=>{
  const THREE=await import('/node_modules/three/build/three.module.js'),{createSupersonicEffects}=await import('/src/supersonic-effects.js');
  const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:false});renderer.setSize(390,844,false);
  const camera=new THREE.PerspectiveCamera(64,390/844,2,100),scene=new THREE.Scene();scene.background=new THREE.Color(0x204e68);scene.add(camera);
  const fx=createSupersonicEffects();camera.add(fx.cameraGroup);const target=new THREE.WebGLRenderTarget(390,844),draw=()=>{renderer.setRenderTarget(target);renderer.render(scene,camera);const p=new Uint8Array(390*844*4);renderer.readRenderTargetPixels(target,0,0,390,844,p);return p;};
  try{const blank=draw();fx.update({state:{speed:339,supersonic:{mach:.999,attemptId:1,events:[]}},phase:'running',camera:'cockpit',aspect:390/844,verticalFov:64,timeSeconds:9,settings:{speedLines:0}});const active=draw();
   const delta=x=>active[(422*390+x)*4]-blank[(422*390+x)*4];return{outer:delta(1),mid:delta(22),inner:delta(43),centre:delta(195),...fx.snapshot()};
  }finally{fx.dispose();target.dispose();renderer.dispose();}
 });
 expect(result.hazeOpacity).toBeLessThan(.06);expect(result.outer).toBeGreaterThan(0);expect(result.outer).toBeLessThan(15);expect(result.mid).toBeLessThan(result.outer);expect(result.inner).toBe(0);expect(result.centre).toBe(0);
 await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-pre-sonic-haze-gpu.json`,JSON.stringify(result,null,2));
});
test('GPU cockpit pressure mist is broad, leaves the central sight clear, and honours reduced motion',async({page})=>{
 await page.goto('/tests/fixtures/supersonic-renderer.html');const rows=await page.evaluate(async()=>{
 const THREE=await import('/node_modules/three/build/three.module.js'),{createSupersonicEffects}=await import('/src/supersonic-effects.js');const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:false});renderer.setSize(390,844,false);const camera=new THREE.PerspectiveCamera(64,390/844,2,100),scene=new THREE.Scene();scene.background=new THREE.Color(0x204e68);scene.add(camera);const fx=createSupersonicEffects();camera.add(fx.cameraGroup);const target=new THREE.WebGLRenderTarget(390,844),draw=()=>{renderer.setRenderTarget(target);renderer.render(scene,camera);const p=new Uint8Array(390*844*4);renderer.readRenderTargetPixels(target,0,0,390,844,p);return p;};
 const frame=(t,reducedMotion)=>({state:{speed:350,supersonic:{mach:1.03,attemptId:1,events:[{type:'sonic-transition',attemptId:1,serial:1,id:1,direction:'up',atSeconds:10,mach:1.01}]}},timeSeconds:t,phase:'running',camera:'cockpit',verticalFov:64,aspect:390/844,settings:{reducedMotion,speedLines:0}});const rows=[];
 try{fx.update(frame(9,false));const before=draw();for(const [t,reduced]of [[10.15,false],[10.45,false],[10.15,true],[11.1,false]]){fx.update(frame(t,reduced));const after=draw();let changed=0,centre=0;for(let y=0;y<844;y++)for(let x=0;x<390;x++){const i=(y*390+x)*4;if(after[i]===before[i]&&after[i+1]===before[i+1]&&after[i+2]===before[i+2])continue;changed++;if(Math.abs(x-195)<20&&Math.abs(y-422)<20)centre++;}rows.push({t,reduced,changed,centre,...fx.snapshot()});}return rows;}finally{fx.dispose();target.dispose();renderer.dispose();}
 });expect(rows[0].changed).toBeGreaterThan(90000);expect(rows[0].centre).toBe(0);expect(rows[0].echoVisible).toBe(true);expect(rows[2].mistOpacity).toBeLessThan(rows[0].mistOpacity);expect(rows[2].echoVisible).toBe(false);expect(rows[3].shockVisible).toBe(false);await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-pressure-gpu.json`,JSON.stringify(rows,null,2));
});

