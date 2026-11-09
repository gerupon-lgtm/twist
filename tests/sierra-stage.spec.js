import {test,expect} from '@playwright/test';
import {APP_VERSION} from '../src/version.js';
import {mkdir,writeFile} from 'node:fs/promises';
for(const cameraMode of ['overlay','chase','cockpit'])test(`Sierra stage uses true heading, flat contact and course profile in ${cameraMode}`,async({page})=>{
 await page.goto('/?dev=1&flow=legacy');const result=await page.evaluate(async cameraMode=>{
  const {createStage}=await import('/src/stage.js'),{getCourse}=await import('/src/course-catalog.js'),{createCourseSurface}=await import('/src/course-surface.js');
  const course=getCourse('sierra50'),surface=createCourseSurface(course),stage=createStage(document.createElement('canvas'),{course,cameraMode,turnGravity:9.8});const samples=[];
  try{
   for(const [width,height]of [[390,844],[360,640],[844,390]]){stage.resize(width,height,1);const s=stage.getStatus();samples.push({width,height,position:s.position,heading:s.heading,targetRadius:s.targetRadius,stageSize:s.stageSize,clipping:s.cameraClipping,targetGroundHeight:s.targetGroundHeight,targetHeightAboveGround:s.targetHeightAboveGround});}
   stage.launchFlight();let s=stage.getStatus();for(let i=0;i<400&&!s.grounded;i++){stage.update(.1,{mode:'flight',pitchRate:-.05,bankAngle:0,throttle:0});s=stage.getStatus();}
   const contact=s;stage.update(1,{mode:'flight',throttle:1,pitchRate:0,bankAngle:0});const after=stage.getStatus();
   return {samples,contact:{grounded:contact.grounded,altitude:contact.altitude,groundClearance:contact.groundClearance,position:contact.position,speed:contact.speed,collected:contact.collected},after:{position:after.position,collected:after.collected},surface:surface.heightAt(contact.position.x,contact.position.z)};
  }finally{stage.dispose();}
 },cameraMode);
 for(const sample of result.samples){expect(sample.stageSize).toMatchObject({halfExtent:1850,width:3700,depth:3700,maxHeight:70});expect(sample.clipping).toMatchObject({near:.1,far:5000});expect(sample.targetRadius).toBe(3.2);expect(sample.heading).toBeCloseTo(-.17572759573761992,8);expect(sample.targetGroundHeight).toBe(0);expect(sample.targetHeightAboveGround).toBe(10);}
 expect(result.contact).toMatchObject({grounded:true,altitude:0,groundClearance:0,speed:0});expect(result.contact.position.y).toBe(result.surface);expect(result.after.position).toEqual(result.contact.position);expect(result.after.collected).toBe(result.contact.collected);
});

test('real Sierra level flight ignores the old350m boundary, warns before1850m at its new speed and returns through actual bank input',async({page})=>{
 test.setTimeout(180000);await page.goto('/?dev=1&flow=legacy');
 const result=await page.evaluate(async()=>{
  const {createStage}=await import('/src/stage.js'),{getCourse}=await import('/src/course-catalog.js');
  const stage=createStage(document.createElement('canvas'),{course:getCourse('sierra50'),cameraMode:'cockpit',turnGravity:9.8});stage.resize(390,844,1);stage.launchFlight();
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=r=>Math.atan2(Math.sin(r),Math.cos(r));
  const sample=(s,seconds)=>({seconds,position:s.position,velocity:s.velocity,speed:s.speed,pitch:s.pitch,heading:s.heading,bank:s.bank,grounded:s.grounded,complete:s.complete,boundary:s.boundary,stageSize:s.stageSize});
  let s=stage.getStatus(),seconds=0,oldNorthCrossing=null,firstWarning=null,outside=null,recovered=null;const initial=sample(s,0),trace=[],earlyWarnings=[];
  try{
   // A150m lead-in already has z~1684. Assert the old ±350 square is not used,
   // then cross its NORTH edge while continuing on the real initial heading.
   for(let i=0;i<1800;i++){
    stage.update(.25,{mode:'flight',pitchRate:0,bankAngle:0,throttle:.5});seconds+=.25;s=stage.getStatus();
    if(i%40===0)trace.push(sample(s,seconds));
    if(!oldNorthCrossing&&s.position.z< -350)oldNorthCrossing=sample(s,seconds);
    if(Math.abs(s.position.x)<1600&&Math.abs(s.position.z)<1600&&s.boundary.near)earlyWarnings.push(sample(s,seconds));
    if(!firstWarning&&s.boundary.near)firstWarning=sample(s,seconds);
    if(s.boundary.outside){outside=sample(s,seconds);break;}
    if(s.grounded||s.complete)break;
   }
   if(outside){
    // Real controls follow the boundary's return heading; pitch-rate feedback
    // keeps the original10m height. No position, orientation or velocity write.
    for(let i=0;i<1200;i++){
     const error=wrap(s.boundary.returnHeading-s.heading),bank=clamp(Math.atan(error*1.5*Math.max(s.speed,6)/s.boundary.turnGravity),-Math.PI/6,Math.PI/6);
     const desiredVerticalSpeed=clamp((10-s.position.y)*.5,-1.5,1.5),actualClimb=Math.atan2(s.velocity.y,Math.hypot(s.velocity.x,s.velocity.z)),desiredClimb=Math.atan2(desiredVerticalSpeed,Math.hypot(s.velocity.x,s.velocity.z));
     const pitchRate=clamp(2*(desiredClimb-actualClimb),-.2,.2);
     stage.update(.1,{mode:'flight',pitchRate,bankAngle:bank,throttle:.65});seconds+=.1;s=stage.getStatus();if(i%10===0)trace.push(sample(s,seconds));
     if(!s.boundary.near&&!s.boundary.outside&&s.boundary.clearance>s.boundary.warningDistance+20){recovered=sample(s,seconds);break;}
     if(s.grounded||s.complete)break;
    }
   }
   return {initial,oldNorthCrossing,firstWarning,outside,recovered,earlyWarnings,trace,last:sample(s,seconds)};
  }finally{stage.dispose();}
 });
 await mkdir('.cache',{recursive:true});await writeFile(`.cache/v${APP_VERSION.replaceAll('.','')}-sierra-boundary-real-${Date.now()}.json`,JSON.stringify(result,null,2));
 expect(result.initial.speed).toBeCloseTo(25,8);expect(result.initial.boundary.turnGravity).toBe(15);
 expect(result.initial.position.z).toBeGreaterThan(350);expect(result.initial.boundary).toMatchObject({halfExtent:1850,near:false,outside:false});expect(result.earlyWarnings).toEqual([]);
 expect(result.oldNorthCrossing,'real flight must pass old north350 without an early warning').not.toBeNull();expect(result.oldNorthCrossing.boundary.near).toBe(false);
 const warning=1.3*25**2/(15*Math.tan(40*Math.PI/180))+2*25,warningZ=-(1850-warning);
 expect(result.firstWarning,'must warn before actually leaving the Sierra airspace').not.toBeNull();expect(result.firstWarning.boundary.outside).toBe(false);expect(result.firstWarning.boundary.nearestEdge).toBe('north');expect(result.firstWarning.boundary.warningDistance).toBeCloseTo(warning,6);expect(result.firstWarning.position.z).toBeLessThanOrEqual(warningZ);expect(result.firstWarning.position.z).toBeGreaterThan(warningZ-25*.25-1e-6);
 expect(result.outside,'the warning is visual and must not stop or clamp travel').not.toBeNull();expect(result.outside.position.z).toBeLessThan(-1850);expect(result.outside.speed).toBeGreaterThan(24);expect(result.outside.grounded).toBe(false);expect(result.outside.complete).toBe(false);
 expect(result.recovered,JSON.stringify(result.trace.slice(-8))).not.toBeNull();expect(result.recovered.boundary).toMatchObject({halfExtent:1850,near:false,outside:false});expect(result.recovered.grounded).toBe(false);expect(result.recovered.complete).toBe(false);expect(result.trace.every(s=>s.stageSize.halfExtent===1850)).toBe(true);
 console.log(JSON.stringify({sierraBoundaryRealFlight:{oldNorthSeconds:result.oldNorthCrossing.seconds,warningSeconds:result.firstWarning.seconds,outsideSeconds:result.outside.seconds,recoveredSeconds:result.recovered.seconds}}));
});
