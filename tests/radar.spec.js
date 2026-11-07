import { test,expect } from '@playwright/test';
const data=(p,k)=>p.locator('#app').getAttribute('data-'+k).then(Number);
const slider=(p,id,value)=>p.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
async function launch(page,mode='flight',extra=''){
 await page.clock.install({time:new Date('2026-11-07T08:00:00Z')});await page.goto('/?mode='+mode+extra);
 await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(100);
}
const appearance=p=>p.locator('#app').getAttribute('data-beacon-appearance').then(JSON.parse);
const stats=p=>p.locator('#app').getAttribute('data-session').then(JSON.parse);

for(const mode of ['flight','explore'])test(`${mode} assisted radar and pink/white lights switch to unchanged golden classic/legacy`,async({page})=>{
 await launch(page,mode);await expect(page.locator('#radar')).toBeVisible();
 expect(await appearance(page)).toMatchObject({core:'#f02b9b',ring:'#fffaff',minPixels:22,columnTarget:1});
 await page.locator('#pause-button').click();await page.locator('#view-classic').click();await page.clock.runFor(100);
 await page.locator('#start-button').click();await page.clock.runFor(100);await expect(page.locator('#radar')).toBeHidden();
 expect(await appearance(page)).toMatchObject({ring:'#e3a139',core:'#fff4c0',minPixels:0});
 await page.goto('/?mode='+mode+'&view=legacy');await expect(page.locator('#app')).toHaveAttribute('data-visibility','classic');await expect(page.locator('#dialog-description')).toContainText('金色');
 await page.locator('#practice-button').click();await page.clock.runFor(100);await expect(page.locator('#radar')).toBeHidden();
});

for(const mode of ['flight','explore'])test(`${mode} radar uses actual heading and stays clear of all HUD on phone sizes`,async({page})=>{
 await launch(page,mode);await slider(page,'practice-steer',25);await page.clock.runFor(mode==='explore'?1800:2500);
 for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}]){
  await page.setViewportSize(size);await page.clock.runFor(100);await expect(page.locator('#radar')).toBeVisible();
  const layout=await page.evaluate(()=>{
   const r=document.getElementById('radar').getBoundingClientRect();
   const intersects=b=>r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top;
   const ids=['bottom-panel','toast','practice-panel','target-edge-marker'];
   const obstacles=ids.map(id=>document.getElementById(id)).filter(el=>!el.hidden&&el.getClientRects().length).map(el=>el.getBoundingClientRect());
   obstacles.push(document.querySelector('.navigation').getBoundingClientRect(),document.querySelector('.topbar').getBoundingClientRect(),{left:innerWidth/2-32,right:innerWidth/2+32,top:innerHeight/2-26,bottom:innerHeight/2+26});
   return {clear:!obstacles.some(intersects),inside:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,size:r.width};
  });expect(layout).toEqual({clear:true,inside:true,size:100});
  await page.screenshot({path:`test-results/v0115-radar-${mode}-${size.width}.png`});
 }
 expect(Math.abs(Number(await page.locator('#radar').getAttribute('data-heading')))).toBeGreaterThan(.1);
 const targets=await page.locator('#app').getAttribute('data-navigation-targets').then(JSON.parse);
 const pos=await page.locator('#app').getAttribute('data-position').then(JSON.parse);
 const h=Number(await page.locator('#radar').getAttribute('data-heading')),t=targets[0].position,dx=t.x-pos.x,dz=t.z-pos.z;
 const expected=(dx*Math.cos(h)+dz*Math.sin(h))/Math.max(60,Math.hypot(dx,dz))*36;
 expect(Number(await page.locator('.radar-next').getAttribute('data-x'))).toBeCloseTo(expected,5);
});

test('fixed phone roll leaves radar aligned with the screen and navigation direction',async({page})=>{
 await launch(page,'flight','&display=fixed');await slider(page,'practice-twist',120);await page.clock.runFor(500);
 await expect(page.locator('#radar')).toBeVisible();expect(await data(page,'display-roll')).toBeCloseTo(120*Math.PI/180,2);
 expect(await page.locator('#radar').evaluate(el=>{const m=new DOMMatrix(getComputedStyle(el).transform);return[m.a,m.b,m.c,m.d];})).toEqual([1,0,0,1]);
 expect(Math.abs(Number(await page.locator('.radar-next').getAttribute('data-x')))).toBeLessThan(.001);
});

test('collecting a light removes it from the radar and highlights the following target',async({page})=>{
 await launch(page,'explore');await slider(page,'practice-pitch',-25);
 for(let i=0;i<100&&await page.locator('#collection-count').textContent()==='0';i++)await page.clock.runFor(100);
 await expect(page.locator('#collection-count')).toHaveText('1');await expect(page.locator('.radar-target[data-id="light-1"]')).toHaveCount(0);
 await expect(page.locator('.radar-next')).toHaveAttribute('data-id','light-2');
 const a=await appearance(page);expect(a.columnTarget).toBe(2);
});

test('radar range saves in exploration without exposing flight control settings',async({page})=>{
 await launch(page,'explore');await page.locator('#pause-button').click();await page.locator('#flight-adjustments>summary').click();
 await expect(page.locator('label[for=setting-maxPitch]')).toBeHidden();await slider(page,'setting-radarRange',20);
 await page.locator('#start-button').click();await page.clock.runFor(100);await expect(page.locator('#radar')).toHaveAttribute('data-range','20');
 await expect(page.locator('[data-id="light-3"]')).toHaveAttribute('data-outside','true');
 const x=Number(await page.locator('[data-id="light-3"]').getAttribute('data-x')),y=Number(await page.locator('[data-id="light-3"]').getAttribute('data-y'));expect(Math.hypot(x,y)).toBeCloseTo(36,5);
 await page.reload();await page.locator('#practice-button').click();await page.clock.runFor(100);await expect(page.locator('#radar')).toHaveAttribute('data-range','20');
});

test('pause and resume do not start a new leg or erase the current leg time',async({page})=>{
 await launch(page);await page.clock.runFor(1000);const before=await stats(page);expect(before.legs).toBe(1);
 await page.locator('#pause-button').click();await page.clock.runFor(100);const paused=await stats(page);await page.clock.runFor(2000);expect(await stats(page)).toEqual(paused);
 await page.locator('#start-button').click();await page.clock.runFor(1000);const after=await stats(page);expect(after.legs).toBe(1);expect(after.elapsedSeconds).toBeGreaterThan(before.elapsedSeconds+.9);
});

test('resetting exploration radar preserves saved flight tuning',async({page})=>{
 await launch(page,'flight');await page.locator('#pause-button').click();await page.locator('#flight-adjustments>summary').click();
 await slider(page,'setting-maxPitch',25);await page.locator('#mode-explore').click();await page.locator('#start-button').click();await page.clock.runFor(100);
 await page.locator('#pause-button').click();await page.locator('#flight-adjustments>summary').click();await slider(page,'setting-radarRange',20);
 await expect(page.locator('#settings-reset')).toHaveText('目印をすべて初期値へ');await page.locator('#settings-reset').click();
 await expect(page.locator('#setting-radarRange')).toHaveValue('60');await expect(page.locator('#setting-maxPitch')).toHaveValue('25');
 await page.locator('#mode-flight').click();await expect(page.locator('#setting-maxPitch')).toHaveValue('25');
});
