import {test,expect} from '@playwright/test';
import {getCourse,validateCourse} from '../src/course.js';
import {FEEDBACK_SETTINGS_KEY} from '../src/feedback/settings.js';
import {mkdir,writeFile} from 'node:fs/promises';

for(const id of ['easy','normal','hard'])test(`displayed director completes ${id} with actual flight and thirty-degree bank`,async({page})=>{
 test.setTimeout(120000);
 await page.addInitScript(key=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.courseFlightCopy=JSON.parse(text);}},configurable:true});localStorage.setItem('twist.flight-settings.v1',JSON.stringify({maxBank:30,turnGravity:9.8}));localStorage.setItem(key,JSON.stringify({sound:false,vibration:false}));},FEEDBACK_SETTINGS_KEY);
 await page.clock.install();await page.goto(`/?mode=flight&course=${id}&camera=cockpit`);await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.locator('#practice-button').click();await page.clock.runFor(120);
 let previous=null,turn=0,ready=0,unready=0,maxBank=0,maxPosition=0;const legTurns=[],trace=[];
 for(let i=0;i<1800;i++){
  const s=await page.evaluate(()=>{
   const e=document.getElementById('app'),d=e.dataset,velocity=JSON.parse(d.velocity),position=JSON.parse(d.position),direction=d.guidanceDirection?JSON.parse(d.guidanceDirection):null;
   const s={phase:d.phase,velocity,position,direction,speed:+d.speed,pitch:+d.flightPitch,bank:+d.bank,gravity:+d.turnGravity,ready:d.guidanceReady==='true',count:+document.getElementById('collection-count').textContent,reason:document.getElementById('guidance-status').textContent};
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
 // Bounded test-only report; the application has no trace hook or frame cost.
 await mkdir(new URL('../.cache/',import.meta.url),{recursive:true});
 await writeFile(new URL(`../.cache/v0129-gui-course-${id}.json`,import.meta.url),JSON.stringify({id,legTurns,ready,unready,trace},null,2)+'\n');
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

test('assisted ground is rendered outside the central island and profile changes preserve real flight',async({page})=>{
 test.setTimeout(60000);await page.goto('/?mode=flight&course=legacy');
 for(const id of ['easy','normal','hard']){
  const result=await page.evaluate(async id=>{
   const {createStage}=await import('/src/stage.js'),{getCourse}=await import('/src/course.js');
   const canvas=document.createElement('canvas');canvas.id='speedfeel-world-canvas';Object.assign(canvas.style,{position:'fixed',inset:'0',width:'390px',height:'844px',zIndex:'99999'});document.body.append(canvas);
   const stage=createStage(canvas,{course:getCourse(id),cameraMode:'cockpit'});stage.resize(390,844,1);stage.launchFlight();
   stage.update(.1,{mode:'flight',throttle:.5,bankAngle:0,pitchRate:0});window.speedfeelWorldStage=stage;
   const status=stage.getStatus(),pass=stage.getPassObjects(),updates=status.groundPattern.updates;
   const snapshot=s=>JSON.stringify([s.position,s.orientation,s.velocity,s.speed,s.throttle]);
   const before=snapshot(status);stage.setGroundPatternStrength(.8);const unchanged=stage.getStatus().groundPattern.updates===updates;
   stage.setVisibility('legacy');const legacy=stage.getStatus(),hiddenPass=stage.getPassObjects().length===0;
   stage.setVisibility('assisted');const restored=stage.getStatus();
   return {status,legacy:legacy.groundPattern,restored:restored.groundPattern,unchanged,hiddenPass,stableMetadata:pass===stage.getPassObjects(),frozen:Object.isFrozen(pass)&&pass.every(p=>Object.isFrozen(p)&&Object.isFrozen(p.position)),sameFlight:before===snapshot(legacy)&&before===snapshot(restored)};
  },id);
  expect(Math.hypot(result.status.position.x,result.status.position.z+24)).toBeGreaterThan(80);
  expect(result.status.mode).toBe('flight');expect(result.status.groundPattern).toMatchObject({visible:true,coarseMetres:16,fineMetres:4,coverageMetres:20000,mipmaps:true,centralPavingVisible:false,strength:.8});
  expect(result.status.abLane).toMatchObject({id:`${id}-final`,inside:false,length:expect.any(Number)});
  expect(result.legacy).toMatchObject({visible:false,centralPavingVisible:true});expect(result.restored.visible).toBe(true);
  expect(result.unchanged&&result.hiddenPass&&result.stableMetadata&&result.frozen&&result.sameFlight).toBe(true);
  await page.evaluate(()=>window.speedfeelWorldStage.setGroundPatternStrength(0));
  const plain=await page.locator('#speedfeel-world-canvas').screenshot();
  await page.evaluate(()=>window.speedfeelWorldStage.setGroundPatternStrength(.8));
  const patterned=await page.locator('#speedfeel-world-canvas').screenshot({path:`.cache/v0129-ground-${id}.png`});
  expect(patterned.equals(plain),'ground texture visibly changes the actual rendered flight image outside old 80m island').toBe(false);
  await page.evaluate(()=>{window.speedfeelWorldStage.dispose();document.getElementById('speedfeel-world-canvas').remove();delete window.speedfeelWorldStage;});
 }
});

test('earned AB fuel shortens every final approach with real flight and unchanged capture radii',async({page})=>{
 test.setTimeout(180000);await page.goto('/?mode=flight&course=legacy');
 const results=await page.evaluate(async()=>{
  const {createStage}=await import('/src/stage.js'),{getCourse}=await import('/src/course.js'),{flightCommands}=await import('/src/flight-input.js'),{createStraightRecords}=await import('/src/straight-records.js');
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),dt=.1,rows=[];
  for(const id of ['easy','normal','hard'])for(const useAB of [false,true]){
   const stage=createStage(document.createElement('canvas'),{course:getCourse(id),cameraMode:'cockpit'});stage.resize(390,844,1);stage.launchFlight();
   let s=stage.getStatus(),elapsed=0,insidePaid=0,maxLaneDistance=0,maxSpeed=0,firstEntry=null,earnedAtEntry=null,lastTurnSeconds=null,burnEnd=null;
   const recorded=createStraightRecords(getCourse(id).abStraights);recorded.advance(s);
   for(let steps=0;steps<2200&&!s.complete&&!s.grounded;steps++){
    const dx=s.targetPosition.x-s.position.x,dy=s.targetPosition.y-s.position.y,dz=s.targetPosition.z-s.position.z;
    const yaw=Math.atan2(dx,-dz),track=Math.atan2(s.velocity.x,-s.velocity.z),error=wrap(yaw-track);
    const climb=Math.atan2(dy,Math.hypot(dx,dz)),actualClimb=Math.atan2(s.velocity.y,Math.hypot(s.velocity.x,s.velocity.z));
    const nose=clamp(s.controlPitch+1.5*(climb-actualClimb),-Math.PI/12,Math.PI/12),bank=clamp(Math.atan(error*1.5*Math.max(s.speed,6)/s.turnGravity),-Math.PI/6,Math.PI/6);
    const angles={pitch:Math.sign(nose)*(3+Math.abs(nose)/(Math.PI/12)*22),steer:Math.sign(bank)*(3+Math.abs(bank)/(Math.PI/6)*12),twist:0};
    const inside=s.collected===s.total&&s.abLane?.inside===true;
    if(inside&&firstEntry===null){firstEntry={seconds:elapsed,bankDegrees:s.bank*180/Math.PI,headingErrorDegrees:error*180/Math.PI,centerDistance:s.abLane.centerDistance};earnedAtEntry=s.afterburner.fuel;}
    const request=useAB&&inside&&s.afterburner.fuel>0;
    const before=s;stage.update(dt,{...flightCommands(angles,{settings:{maxBank:30,turnGravity:9.8},currentPitch:s.controlPitch,dt}),mode:'flight',turnGravity:9.8,
     manualAfterburner:request,throttle:request?1:clamp(.5+(10-s.speed)*.3+s.controlPitch*.8,.15,1)});
    s=stage.getStatus();elapsed+=dt;recorded.advance(s);
    if(request&&before.afterburner.fuel>0&&s.afterburner.fuel===0){
     const endpoint=s.afterburnerMotion.at(-1)?.to;
     if(endpoint){const exit=getCourse(id).exit;burnEnd={seconds:before.afterburner.timeSeconds+s.afterburner.seconds-before.afterburner.seconds,
      position:endpoint,exitDistance:Math.hypot(exit.x-endpoint.x,exit.y-endpoint.y,exit.z-endpoint.z)};}
    }
    if(before.collected<s.total&&s.collected===s.total)lastTurnSeconds=elapsed;
    if(inside){insidePaid+=s.afterburner.seconds-before.afterburner.seconds;maxLaneDistance=Math.max(maxLaneDistance,s.abLane.centerDistance);}
    maxSpeed=Math.max(maxSpeed,s.speed);
   }
   rows.push({id,useAB,complete:s.complete,grounded:s.grounded,collected:s.collected,total:s.total,elapsed,actualSeconds:s.afterburner.timeSeconds,firstEntry,earnedAtEntry,lastTurnSeconds,burnEnd,
    coastingSeconds:burnEnd?s.afterburner.timeSeconds-burnEnd.seconds:null,
    lineUpSeconds:firstEntry&&lastTurnSeconds!==null?firstEntry.seconds-lastTurnSeconds:null,insidePaid,maxLaneDistance,maxSpeed,afterburner:s.afterburner,
    targetRadius:s.targetRadius,position:s.position,straightRecords:recorded.snapshot()});stage.dispose();
  }
  return rows;
 });
 for(const id of ['easy','normal','hard']){
  const plain=results.find(r=>r.id===id&&!r.useAB),ab=results.find(r=>r.id===id&&r.useAB);
  for(const row of [plain,ab]){expect(row.complete,JSON.stringify(row)).toBe(true);expect(row.grounded).toBe(false);expect(row.collected).toBe(getCourse(id).lights.length);expect(row.targetRadius).toBe(4);expect(row.firstEntry,JSON.stringify(row)).not.toBeNull();expect(row.lineUpSeconds).toBeGreaterThan(5);expect(Math.abs(row.firstEntry.headingErrorDegrees)).toBeLessThan(3);expect(Math.abs(row.firstEntry.bankDegrees)).toBeLessThan(3);}
  expect(ab.earnedAtEntry).toBeGreaterThanOrEqual(75);expect(ab.insidePaid).toBeGreaterThan(4);expect(ab.afterburner.uses).toBe(1);expect(ab.maxSpeed).toBeGreaterThan(40);expect(ab.actualSeconds).toBeLessThan(plain.actualSeconds-10);expect(ab.maxLaneDistance).toBeLessThan(12);
  expect(ab.burnEnd.exitDistance).toBeGreaterThan(35);expect(ab.coastingSeconds).toBeGreaterThan(.3);
  expect(plain.straightRecords[0].usedAfterburner).toBe(false);expect(ab.straightRecords[0].usedAfterburner).toBe(true);expect(ab.straightRecords[0].afterburnerSeconds).toBeCloseTo(ab.afterburner.seconds,8);
 }
 await mkdir(new URL('../.cache/',import.meta.url),{recursive:true});
 await writeFile(new URL('../.cache/v0129-world-ab-comparison.json',import.meta.url),JSON.stringify({stepSeconds:.1,results},null,2)+'\n');
 console.log(JSON.stringify({actualABCourseComparison:results}));
});

test('AB motion observation reports paid substep prefixes and clears without changing flight',async({page})=>{
 await page.goto('/?mode=flight&course=legacy');
 const result=await page.evaluate(async()=>{
  const {createStage}=await import('/src/stage.js');
  const stage=createStage(document.createElement('canvas'),{cameraMode:'cockpit'});stage.resize(390,844,1);stage.launchFlight();
  for(let i=0;i<27;i++)stage.update(.1,{mode:'flight',throttle:.5,pitchRate:0,bankAngle:0});
  const earned=stage.getStatus().afterburner.fuel,dt=.13,step=dt/Math.ceil(dt*60);
  let partial=false,allFrozen=true,totalPaid=0,deltaError=0,steps=0;
  for(;steps<24;steps++){
   const before=stage.getStatus();stage.update(dt,{mode:'flight',throttle:1,manualAfterburner:true,pitchRate:0,bankAngle:0});
   const state=stage.getStatus(),motion=state.afterburnerMotion,sum=motion.reduce((s,m)=>s+m.seconds,0);
   allFrozen&&=Object.isFrozen(motion)&&motion.every(m=>Object.isFrozen(m)&&Object.isFrozen(m.from)&&Object.isFrozen(m.to));
   deltaError=Math.max(deltaError,Math.abs(sum-(state.afterburner.seconds-before.afterburner.seconds)));totalPaid+=sum;
   partial||=motion.some(m=>m.seconds<step-1e-10);
   if(state.afterburner.fuel===0)break;
  }
  const before=stage.getStatus();stage.update(0,{mode:'flight'});const cleared=stage.getStatus();
  const out={earned,totalPaid,partial,allFrozen,deltaError,steps,cleared:cleared.afterburnerMotion.length,
   samePosition:JSON.stringify(before.position)===JSON.stringify(cleared.position),samePaid:before.afterburner.seconds===cleared.afterburner.seconds};
  stage.dispose();return out;
 });
 expect(result.earned).toBe(25);expect(result.totalPaid).toBeCloseTo(25/12,8);expect(result.partial&&result.allFrozen).toBe(true);expect(result.deltaError).toBeLessThan(1e-10);expect(result.cleared).toBe(0);expect(result.samePosition&&result.samePaid).toBe(true);
});
