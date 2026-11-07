import {test,expect} from '@playwright/test';
import {getCourse,validateCourse} from '../src/course.js';
import {FEEDBACK_SETTINGS_KEY} from '../src/feedback/settings.js';

for(const id of ['easy','normal','hard'])test(`displayed director completes ${id} with actual flight and thirty-degree bank`,async({page})=>{
 test.setTimeout(120000);
 await page.addInitScript(key=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.courseFlightCopy=JSON.parse(text);}},configurable:true});localStorage.setItem('twist.flight-settings.v1',JSON.stringify({maxBank:30,turnGravity:9.8}));localStorage.setItem(key,JSON.stringify({sound:false,vibration:false}));},FEEDBACK_SETTINGS_KEY);
 await page.clock.install();await page.goto(`/?mode=flight&course=${id}&camera=cockpit`);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(120);
 let previous=null,turn=0,ready=0,unready=0,maxBank=0,maxPosition=0;const legTurns=[],trace=[];
 for(let i=0;i<1800;i++){
  const s=await page.evaluate(()=>{
   const e=document.getElementById('app'),d=e.dataset,velocity=JSON.parse(d.velocity),position=JSON.parse(d.position),direction=d.guidanceDirection?JSON.parse(d.guidanceDirection):null;
   const s={phase:d.phase,velocity,position,speed:+d.speed,pitch:+d.flightPitch,bank:+d.bank,gravity:+d.turnGravity,ready:d.guidanceReady==='true',count:+document.getElementById('collection-count').textContent,reason:document.getElementById('guidance-status').textContent};
   if(s.phase!=='running')return s;
   const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let pitch=0,steer=0;
   if(s.ready&&direction){const yaw=Math.atan2(direction.x,-direction.z),track=Math.atan2(velocity.x,-velocity.z),error=Math.atan2(Math.sin(yaw-track),Math.cos(yaw-track));
    const climb=Math.atan2(direction.y,Math.hypot(direction.x,direction.z)),actualClimb=Math.atan2(velocity.y,Math.hypot(velocity.x,velocity.z));
    const nose=clamp(s.pitch+1.5*(climb-actualClimb),-Math.PI/12,Math.PI/12),bank=clamp(Math.atan(error*1.5*Math.max(s.speed,6)/s.gravity),-Math.PI/6,Math.PI/6);
    pitch=Math.sign(nose)*(3+Math.abs(nose)/(Math.PI/12)*22);steer=Math.sign(bank)*(3+Math.abs(bank)/(Math.PI/6)*12);
   }
   for(const [id,value]of [['practice-pitch',pitch],['practice-steer',steer],['throttle-input',100*clamp(.5+(10-s.speed)*.3+s.pitch*.8,.15,1)]]){const input=document.getElementById(id);input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));}
   return s;
  });
  if(i%20===0)trace.push(s);
  if(s.phase!=='running'){expect(s.phase,JSON.stringify({id,s,ready,unready,trace})).toBe('complete');break;}
  if(s.ready)ready++;else unready++;
  const track=Math.atan2(s.velocity.x,-s.velocity.z);if(previous){const delta=Math.abs(Math.atan2(Math.sin(track-previous.track),Math.cos(track-previous.track)));turn+=delta;legTurns[s.count]=(legTurns[s.count]??0)+delta;}previous={track};
  maxBank=Math.max(maxBank,Math.abs(s.bank));maxPosition=Math.max(maxPosition,Math.abs(s.position.x),Math.abs(s.position.z));await page.clock.runFor(100);
 }
 await expect(page.locator('#app'),JSON.stringify({id,ready,unready,turn,trace})).toHaveAttribute('data-phase','complete');expect(ready).toBeGreaterThan(100);expect(maxBank).toBeLessThanOrEqual(Math.PI/6+.001);expect(maxPosition).toBeLessThan(350);
 expect(Math.max(...legTurns.filter(Number.isFinite)),JSON.stringify({id,legTurns})).toBeLessThan(Math.PI);
 await page.locator('#result-copy').click();const report=await page.evaluate(()=>window.courseFlightCopy),course=getCourse(id);
 expect(report.course).toEqual({id,name:course.name,targetCount:course.lights.length});expect(report.settings.turnGravity).toBe(9.8);expect(report.stageSize.halfExtent).toBe(350);
 expect(report.segments).toHaveLength(course.lights.length+1);expect(report.targetViews).toHaveLength(course.lights.length+1);expect(report.segments.every(s=>Number.isFinite(s.seconds))).toBe(true);expect(report.targetViews.every(s=>Number.isFinite(s.firstVisibleSeconds))).toBe(true);
 expect(report.exitDiscovery).toMatchObject({opened:true,firstVisibleSeconds:expect.any(Number)});expect(report.segments.reduce((sum,s)=>sum+s.seconds,0)).toBeCloseTo(report.lastLeg.elapsedSeconds,5);
 console.log(JSON.stringify({course:id,seconds:report.lastLeg.elapsedSeconds,reference:validateCourse(course).cruiseTimeSeconds,ready,unready,maxBankDegrees:maxBank*180/Math.PI,maxPosition,legTurns,segments:report.segments.map(s=>s.seconds)}));
});

test('actual velocity turns at the stronger rate while strength three retains its reference',async({page})=>{
 await page.goto('/?mode=flight&course=legacy');const result=await page.evaluate(async()=>{
  const {createStage}=await import('/src/stage.js'),{flightYawForBank}=await import('/src/flight-turn.js');const results=[];
  for(const gravity of [3,9.8]){const stage=createStage(document.createElement('canvas'),{turnGravity:gravity});stage.resize(390,844,1);stage.launchFlight();let s=stage.getStatus(),ratios=[],altitude=s.altitude;
   for(let i=0;i<600;i++){const before=s,heading=Math.atan2(s.velocity.x,-s.velocity.z);stage.update(1/60,{mode:'flight',pitchRate:0,bankAngle:35*Math.PI/180,throttle:.5,turnGravity:gravity});s=stage.getStatus();const delta=Math.atan2(Math.sin(Math.atan2(s.velocity.x,-s.velocity.z)-heading),Math.cos(Math.atan2(s.velocity.x,-s.velocity.z)-heading));if(i>=420){const expected=flightYawForBank((before.bank+s.bank)/2,before.speed,gravity);ratios.push(delta/(1/60)/expected);}}
   results.push({gravity,ratio:ratios.reduce((a,b)=>a+b,0)/ratios.length,loss:altitude-s.altitude,speed:s.speed,grounded:s.grounded});stage.dispose();
  }return results;
 });for(const row of result){expect(row.grounded).toBe(false);expect(row.ratio).toBeGreaterThan(.95);expect(row.ratio).toBeLessThan(1.05);}console.log(JSON.stringify({measuredTurns:result}));
});

test('the real flight crosses the visible storm without losing momentum or automatically stopping',async({page})=>{
 test.setTimeout(60000);await page.clock.install();await page.goto('/?mode=flight&course=legacy&camera=cockpit');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(45000);
 await expect(page.locator('#app')).toHaveAttribute('data-phase','running');const d=await page.locator('#app').evaluate(e=>({...e.dataset}));expect(JSON.parse(d.position).z).toBeLessThan(-350);expect(+d.speed).toBeGreaterThan(9.8);expect(JSON.parse(d.boundary)).toMatchObject({near:true,outside:true});
 await expect(page.locator('#stage-boundary-warning')).toBeVisible();await expect(page.locator('#stage-boundary-warning')).toContainText('TURN BACK');
});
for(const id of ['easy','normal','hard'])test(`exploration collects the entire ${id} course`,async({page})=>{
 test.setTimeout(60000);await page.goto('/?mode=explore&course='+id);
 const result=await page.evaluate(async id=>{
  const {createStage}=await import('/src/stage.js'),{getCourse}=await import('/src/course.js'),{Quaternion,Vector3}=await import('/node_modules/.vite/deps/three.js');const course=getCourse(id),stage=createStage(document.createElement('canvas'),{course});stage.resize(390,844,1);let s=stage.getStatus(),steps=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));for(;steps<4000&&!s.complete;steps++){
   const local=new Vector3(s.targetPosition.x-s.position.x,s.targetPosition.y-s.position.y,s.targetPosition.z-s.position.z).applyQuaternion(new Quaternion(s.orientation.x,s.orientation.y,s.orientation.z,s.orientation.w).invert());
   const yaw=Math.atan2(local.x,-local.z),pitch=Math.atan2(local.y,Math.hypot(local.x,local.z));stage.update(.1,{mode:'explore',speed:6,pitchRate:clamp(pitch*2,-.9,.9),yawRate:clamp(yaw*2,-.85,.85)});s=stage.getStatus();
  }
  const out={complete:s.complete,collected:s.collected,total:s.total,steps,position:s.position};stage.dispose();return out;
 },id);expect(result.complete,JSON.stringify(result)).toBe(true);expect(result.collected).toBe(getCourse(id).lights.length);expect(result.total).toBe(result.collected);
});
