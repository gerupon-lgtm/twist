import {test,expect} from '@playwright/test';
for(const camera of ['cockpit','chase','overlay'])for(const size of [[390,844],[360,640],[844,390]])test(`displayed guidance follows real course ${camera} ${size}`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:size[0],height:size[1]});await page.clock.install();await page.goto(`/?mode=flight&camera=${camera}`);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(100);
 await page.screenshot({path:`test-results/v0125-guidance-${camera}-${size[0]}x${size[1]}.png`});
 const slider=async(id,value)=>page.locator('#'+id).evaluate((e,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);
 let ready=0,unready=0,turn=0,lastHeading=0;const trace=[];const notices=new Set(),reasonCounts={};
 for(let i=0;i<800;i++){
  const s=await page.locator('#app').evaluate(e=>({phase:e.dataset.phase,ready:e.dataset.guidanceReady==='true',d:e.dataset.guidanceDirection?JSON.parse(e.dataset.guidanceDirection):null,v:JSON.parse(e.dataset.velocity),pitch:+e.dataset.flightPitch,heading:+e.dataset.heading,speed:+e.dataset.speed,pos:JSON.parse(e.dataset.position),count:+document.getElementById('collection-count').textContent,notice:!document.getElementById('guidance-next-notice').hidden,mode:document.getElementById('guidance-panel').dataset.mode,noticeText:document.getElementById('guidance-notice-target').textContent,reason:document.getElementById('guidance-status').textContent}));
  if(s.phase!=='running'){expect(s.phase,JSON.stringify({s,ready,unready,turn,reasonCounts,trace})).toBe('complete');break;}
  if(i%10===0)trace.push({...s,i});
  if(s.notice)notices.add(s.noticeText);
  turn+=Math.abs(Math.atan2(Math.sin(s.heading-lastHeading),Math.cos(s.heading-lastHeading)));lastHeading=s.heading;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  if(s.ready){
   ready++;const yaw=Math.atan2(s.d.x,-s.d.z),error=Math.atan2(Math.sin(yaw-Math.atan2(s.v.x,-s.v.z)),Math.cos(yaw-Math.atan2(s.v.x,-s.v.z)));
   const climb=Math.atan2(s.d.y,Math.hypot(s.d.x,s.d.z)),actualClimb=Math.atan2(s.v.y,Math.hypot(s.v.x,s.v.z));
   const nose=clamp(s.pitch+(climb-actualClimb)*1.5,-15*Math.PI/180,15*Math.PI/180);
   await slider('practice-pitch',Math.sign(nose)*(3+Math.abs(nose)/(15*Math.PI/180)*22));
   const bank=clamp(error*5,-40*Math.PI/180,40*Math.PI/180)/(40*Math.PI/180);
   await slider('practice-steer',Math.sign(bank)*(3+Math.abs(bank)*12));
  }else{unready++;reasonCounts[s.reason]=(reasonCounts[s.reason]??0)+1;await slider('practice-steer',0);await slider('practice-pitch',0);}
  await slider('throttle-input',Math.round(clamp(.5+(10-s.speed)*.3+s.pitch*.8,.15,1)*100));await page.clock.runFor(100);
 }
 await expect(page.locator('#app'),JSON.stringify({ready,unready,turn,reasonCounts})).toHaveAttribute('data-phase','complete');expect(ready).toBeGreaterThan(20);expect(turn,JSON.stringify(trace)).toBeLessThan(Math.PI);expect([...notices].sort()).toEqual(['NEXT EXIT','NEXT TGT 2','NEXT TGT 3']);
 const report=JSON.parse(await page.locator('#app').getAttribute('data-target-views'));expect(report).toHaveLength(4);expect(report.every(t=>Number.isFinite(t.firstVisibleSeconds))).toBe(true);
});
