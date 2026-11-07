import { test, expect } from '@playwright/test';
for(const base of ['/','/twist/']) test(`${base} loads manifest, icons, 3D and network-only worker from relative paths`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}?mode=flight&v=0.1.20`);
  await expect(page.locator('#intro-version')).toContainText('v0.1.20');
  const info=await page.evaluate(async()=>{
    const manifestURL=document.querySelector('link[rel=manifest]').href;
    const response=await fetch(manifestURL,{cache:'no-store'}),manifest=await response.json();
    const icons=[];
    for(const icon of manifest.icons) {
      const url=new URL(icon.src,manifestURL).href, response=await fetch(url),bitmap=await createImageBitmap(await response.blob());
      icons.push({url,status:response.status,type:response.headers.get('content-type'),width:bitmap.width,height:bitmap.height,purpose:icon.purpose});bitmap.close();
    }
    const apple=await createImageBitmap(await (await fetch(document.querySelector('link[rel=apple-touch-icon]').href)).blob());
    const appleSize=[apple.width,apple.height];apple.close();
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller) await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
    const reg=await navigator.serviceWorker.getRegistration();
    return {manifestURL,manifest,icons,appleSize,scope:reg.scope,scriptURL:reg.active.scriptURL,caches:await caches.keys()};
  });
  expect(new URL(info.manifestURL).pathname).toBe(`${base}manifest.webmanifest`);
  expect(info.manifest).toMatchObject({name:'twist',short_name:'twist',display:'fullscreen',orientation:'any',scope:'./',theme_color:'#dcebf1',background_color:'#dcebf1'});
  const start=new URL(info.manifest.start_url,info.manifestURL);
  expect(start.pathname).toBe(base);expect(Object.fromEntries(start.searchParams)).toMatchObject({mode:'flight',view:'assisted',pitch:'angle',steer:'tilt',v:'0.1.20'});
  expect(info.icons.map(x=>[x.width,x.height,x.purpose])).toEqual([[192,192,'any'],[512,512,'any'],[512,512,'maskable']]);
  for(const icon of info.icons){expect(icon.status).toBe(200);expect(icon.type).toContain('image/png');expect(new URL(icon.url).pathname.startsWith(`${base}icons/`)).toBe(true);}
  expect(info.appleSize).toEqual([180,180]);expect(new URL(info.scope).pathname).toBe(base);
  expect(new URL(info.scriptURL).pathname).toBe(`${base}sw.js`);expect(new URL(info.scriptURL).searchParams.get('v')).toBe('0.1.20');expect(info.caches).toEqual([]);
  await page.reload();await page.locator('#practice-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  expect(errors).toEqual([]);
});
test('a previous worker yields to current network-only worker and refreshed page shows the latest version',async({page})=>{
  await page.goto('/twist/?mode=flight');
  await page.evaluate(async()=>{
    await navigator.serviceWorker.register('/twist/legacy-test-sw.js',{scope:'/twist/',updateViaCache:'none'});
    await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  });
  await page.reload();await expect(page.locator('h1')).toHaveText('twist v0.1.18 fixture');
  await page.evaluate(async()=>{
    await navigator.serviceWorker.register('/twist/sw.js?v=0.1.20',{scope:'/twist/',updateViaCache:'none'});
    await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  });
  await page.reload();await expect(page.locator('#intro-version')).toContainText('v0.1.20');
});
test('network-only worker never serves a saved offline response',async({page,context})=>{
  await page.goto('/?mode=flight');await page.evaluate(()=>navigator.serviceWorker.ready);
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  expect(await page.evaluate(()=>fetch('./version.json?offline-test',{cache:'no-store'}).then(()=>true,()=>false))).toBe(false);
  await context.setOffline(false);
  expect(await page.evaluate(()=>fetch('./version.json?online-test',{cache:'no-store'}).then(r=>r.json()))).toEqual({version:'0.1.20'});
});
test('resumed old client detects newer version, stops, and updates only on button while keeping chosen modes',async({page})=>{
  await page.addInitScript(()=>{
    const original=window.fetch;
    window.fetch=(input,init)=>String(input).includes('version.json')&&window.publishedVersion
      ? Promise.resolve(new Response(JSON.stringify({version:window.publishedVersion}),{headers:{'content-type':'application/json'}}))
      : original(input,init);
  });
  await page.goto('/?mode=flight&display=fixed&camera=chase&v=0.1.20');await page.locator('#practice-button').click();
  await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  await page.evaluate(()=>{window.publishedVersion='0.1.21';document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.locator('#app')).toHaveAttribute('data-phase','paused');
  await expect(page.locator('#throttle-value')).toHaveText('0%');await expect(page.locator('#update-notice')).toContainText('v0.1.21');
  await expect(page.locator('#start-button')).toBeDisabled();await expect(page.locator('#practice-button')).toBeDisabled();
  await expect(page).toHaveURL(/v=0.1.20/);await page.locator('#update-button').click();
  await expect(page).toHaveURL(/display=fixed&camera=chase&v=0.1.21/);
});
