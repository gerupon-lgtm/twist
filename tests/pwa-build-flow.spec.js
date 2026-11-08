import {test,expect} from '@playwright/test';
import {APP_VERSION} from '../src/version.js';

for(const [base,size] of [['/',{width:390,height:844}],['/twist/',{width:844,height:390}]])test(`${base} built default flow starts through the real relative-path service worker`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(size);
  await page.addInitScript(()=>{
    if(!/^https?:$/.test(location.protocol))return;
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,camera:'cockpit',inputMethod:'practice'}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
  });
  await page.goto(`${base}?course=easy&camera=cockpit&v=${APP_VERSION}`);
  await expect(page.locator('#app')).toHaveAttribute('data-start-flow','on');
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','title');
  await expect(page.locator('#start-flow-version')).toContainText(`v${APP_VERSION}`);
  const worker=await page.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
    const registration=await navigator.serviceWorker.getRegistration();
    return {scope:registration.scope,script:registration.active.scriptURL,caches:await caches.keys(),manifest:document.querySelector('link[rel=manifest]').href};
  });
  expect(new URL(worker.scope).pathname).toBe(base);
  expect(new URL(worker.script).pathname).toBe(`${base}sw.js`);
  expect(new URL(worker.script).searchParams.get('v')).toBe(APP_VERSION);
  expect(new URL(worker.manifest).pathname).toBe(`${base}manifest.webmanifest`);
  expect(worker.caches).toEqual([]);
  expect(new URL(page.url()).searchParams.has('flow')).toBe(false);
  expect(new URL(page.url()).searchParams.has('dev')).toBe(false);
  await page.locator('#start-flow-start').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','courses');
  await page.locator('#start-flow-course-start').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','pose');
  await page.locator('#start-flow-hold').click();
  await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','countdown');
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running',{timeout:12000});
  await expect(page.locator('#app')).toHaveAttribute('data-input','practice');
  await expect(page.locator('#app')).toHaveAttribute('data-camera','cockpit');
  await expect(page.locator('#app')).toHaveAttribute('data-position',/"x":/);
  const geometry=await page.evaluate(()=>({
    width:innerWidth,height:innerHeight,
    roots:[document.documentElement,document.body,document.getElementById('app')].map(element=>({id:element.id||element.tagName,scrollWidth:element.scrollWidth,scrollHeight:element.scrollHeight})),
    controls:['practice-pitch','practice-steer','practice-twist','throttle-input','pause-button','recenter-button','help-button','practice-neutral','practice-brake','start-flow-view-button'].map(id=>{
      const element=document.getElementById(id),r=element.getBoundingClientRect();
      return {id,visible:!element.hidden&&!!element.getClientRects().length,left:r.left,right:r.right,top:r.top,bottom:r.bottom};
    }),
    speedTape:(()=>{
      const element=document.getElementById('cockpit-speed'),r=element.getBoundingClientRect();
      return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,children:[...element.children].map(child=>{
        const box=child.getBoundingClientRect();return {text:child.textContent,left:box.left,right:box.right,top:box.top,bottom:box.bottom};
      })};
    })(),
  }));
  for(const root of geometry.roots){expect(root.scrollWidth,root.id).toBeLessThanOrEqual(geometry.width+1);expect(root.scrollHeight,root.id).toBeLessThanOrEqual(geometry.height+1);}
  for(const control of geometry.controls){expect(control.visible,control.id).toBe(true);expect(control.left,control.id).toBeGreaterThanOrEqual(-.5);expect(control.top,control.id).toBeGreaterThanOrEqual(-.5);expect(control.right,control.id).toBeLessThanOrEqual(geometry.width+.5);expect(control.bottom,control.id).toBeLessThanOrEqual(geometry.height+.5);}
  for(const child of geometry.speedTape.children){expect(child.left,child.text).toBeGreaterThanOrEqual(geometry.speedTape.left-.5);expect(child.right,child.text).toBeLessThanOrEqual(geometry.speedTape.right+.5);expect(child.top,child.text).toBeGreaterThanOrEqual(geometry.speedTape.top-.5);expect(child.bottom,child.text).toBeLessThanOrEqual(geometry.speedTape.bottom+.5);}
  const throttleRect=()=>page.locator('#throttle-input').evaluate(element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  const cockpitThrottle=await throttleRect();
  for(const camera of ['overlay','chase','cockpit']){
    await page.locator('#start-flow-view-button').click();await expect(page.locator('#app')).toHaveAttribute('data-camera',camera);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const current=await throttleRect();
    for(const key of ['x','y','width','height'])expect(Math.abs(current[key]-cockpitThrottle[key]),`${camera} throttle ${key}`).toBeLessThanOrEqual(.5);
    await page.screenshot({path:`.cache/director-v0130/pwa-built-${base==='/'?'root':'subpath'}-${camera}.png`});
  }
  await page.reload();await expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step','title');
  expect(errors).toEqual([]);
});
