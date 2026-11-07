import {test,expect} from '@playwright/test';
const slider=(p,id,value)=>p.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
async function launch(page,query=''){
 await page.clock.install();await page.goto('/?mode=flight&camera=cockpit'+query);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(100);
}
for(const size of [{width:390,height:844},{width:360,height:640},{width:844,height:390}])test(`cockpit objective and current/target heights fit ${size.width}x${size.height}`,async({page})=>{
 await page.setViewportSize(size);await launch(page);await expect(page.locator('#cockpit-objective')).toBeVisible();await expect(page.locator('#cockpit-objective')).toHaveAttribute('data-kind','point');await expect(page.locator('#cockpit-objective-label')).toContainText('光 1');
 await expect(page.locator('#cockpit-target-height')).toContainText('現在14.0m');await expect(page.locator('#cockpit-target-height')).toContainText('目標 14m');
 const state=await page.locator('#app').evaluate(el=>({target:JSON.parse(el.dataset.targetLocal),fov:Number(el.dataset.verticalFov)})),mark=await page.locator('#cockpit-objective').evaluate(el=>({x:Number(el.dataset.x),y:Number(el.dataset.y)}));
 const f=size.height/2/Math.tan(state.fov*Math.PI/360);expect(Math.abs(mark.x-(size.width/2+f*state.target.x/-state.target.z))).toBeLessThan(2);expect(Math.abs(mark.y-(size.height/2-f*state.target.y/-state.target.z))).toBeLessThan(2);
 const label=await page.locator('#cockpit-objective-label').boundingBox();for(const id of ['cockpit-heading','cockpit-target-height','cockpit-altitude','cockpit-speed','radar','bottom-panel']){const r=await page.locator('#'+id).boundingBox();expect(label.x<r.x+r.width&&label.x+label.width>r.x&&label.y<r.y+r.height&&label.y+label.height>r.y,id).toBe(false);}
 await page.screenshot({path:`test-results/v0123-hud-${size.width}.png`});
});
test('a goal outside the HUD gets a directional edge mark and legacy keeps its original view',async({page})=>{
 await launch(page,'&display=fixed');await slider(page,'practice-twist',90);await page.clock.runFor(200);await slider(page,'practice-steer',15);await page.clock.runFor(2500);
 await expect(page.locator('#cockpit-objective')).toHaveAttribute('data-kind','edge');await expect(page.locator('#target-edge-marker')).toBeHidden();
 await page.locator('#pause-button').click();await page.locator('#view-classic').click();await page.locator('#start-button').click();await page.clock.runFor(100);await expect(page.locator('#cockpit-objective')).toBeHidden();
});
test('very large hardware tilt holds the previous command and returns without a forced pause',async({page})=>{
 await page.addInitScript(()=>{class O extends Event{static requestPermission(){return Promise.resolve('granted');}}Object.defineProperty(window,'DeviceOrientationEvent',{value:O,configurable:true});});
 await page.goto('/?mode=flight&camera=cockpit');await page.locator('#start-button').click();
 await page.evaluate(()=>{window.pose=setInterval(()=>window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta:0,gamma:0})),50);});await expect(page.locator('#app')).toHaveAttribute('data-phase','ready');await page.locator('#start-button').click();await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
 const pose=beta=>page.evaluate(beta=>{clearInterval(window.pose);window.dispatchEvent(Object.assign(new Event('deviceorientation'),{alpha:0,beta,gamma:0}));},beta);
 await pose(80);await expect.poll(()=>page.locator('#app').getAttribute('data-pitch-target').then(Number)).toBeGreaterThan(.2);await pose(110);await expect(page.locator('#app')).toHaveAttribute('data-input-held','true');await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
 await pose(180);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');await pose(-10);await expect(page.locator('#app')).toHaveAttribute('data-input-held','false');await expect.poll(()=>page.locator('#app').getAttribute('data-pitch-target').then(Number)).toBeLessThan(0);
});
test('an open landscape practice panel cannot cover an objective diamond',async({page})=>{
 await page.setViewportSize({width:844,height:390});await launch(page,'&display=fixed');await page.locator('#practice-summary').click();
 // Move the real expanded panel over the projected point to preserve this occlusion case across courses.
 await page.clock.runFor(100);await page.locator('#practice-panel').evaluate(el=>{const r=el.getBoundingClientRect(),m=document.getElementById('cockpit-objective');el.style.transform=`translate(${Number(m.dataset.x)-r.left-r.width/2}px,${Number(m.dataset.y)-r.top-r.height/2}px)`;});await page.clock.runFor(150);
 await expect(page.locator('#cockpit-objective')).toHaveAttribute('data-kind','edge');await expect(page.locator('#cockpit-objective')).toHaveAttribute('data-occluded','true');
 const r=await page.locator('#practice-panel').boundingBox(),p=await page.locator('#cockpit-objective').evaluate(e=>({x:Number(e.dataset.x),y:Number(e.dataset.y)}));expect(p.x+16>r.x&&p.x-16<r.x+r.width&&p.y+16>r.y&&p.y-16<r.y+r.height).toBe(false);
});
