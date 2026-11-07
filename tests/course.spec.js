import {test,expect} from '@playwright/test';
for(const [speed,bank] of [[8,30],[8,40],[11,40]])test(`course clears at ${speed}m/s with ${bank} degree bank without a return loop`,async({page})=>{
 test.setTimeout(60000);await page.goto('/?mode=flight');
 const result=await page.evaluate(async({speed,bank})=>{
  const {createStage}=await import('/src/stage.js'),{flightCommands}=await import('/src/flight-input.js');
  const stage=createStage(document.createElement('canvas'));stage.resize(390,844,1);stage.launchFlight();
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let s=stage.getStatus(),backtrack=0,turn=0,lastHeading=0,steps=0,segments=[],since=0,maxBank=0;
  for(;steps<2000&&!s.complete&&!s.grounded;steps++){
   const dx=s.targetPosition.x-s.position.x,dy=s.targetPosition.y-s.position.y,dz=s.targetPosition.z-s.position.z;
   const heading=Math.atan2(s.velocity.x,-s.velocity.z),error=Math.atan2(Math.sin(Math.atan2(dx,-dz)-heading),Math.cos(Math.atan2(dx,-dz)-heading));
   const pitch=clamp(Math.atan2(dy,Math.hypot(dx,dz)),-.25,.25),demand=clamp(error*1.4,-bank*Math.PI/180,bank*Math.PI/180)/(40*Math.PI/180);
   const angles={pitch:Math.sign(pitch)*(3+Math.abs(pitch)/(15*Math.PI/180)*22),steer:Math.sign(demand)*(3+Math.abs(demand)*12),twist:0};
   const input=flightCommands(angles,{currentPitch:s.controlPitch,dt:.05});
   const prev=s;stage.update(.05,{...input,mode:'flight',throttle:clamp(.5+(speed-s.speed)*.3+s.pitch*.8,.15,1)});s=stage.getStatus();since+=.05;
   backtrack+=Math.max(0,s.position.z-prev.position.z);turn+=Math.abs(Math.atan2(Math.sin(s.heading-lastHeading),Math.cos(s.heading-lastHeading)));lastHeading=s.heading;maxBank=Math.max(maxBank,Math.abs(s.bank)*180/Math.PI);
   if(s.collected!==prev.collected||s.complete){segments.push(since);since=0;}
  }
  const out={complete:s.complete,collected:s.collected,grounded:s.grounded,backtrack,turn,maxBank,segments,steps};stage.dispose();return out;
 },{speed,bank});
 expect(result.complete,JSON.stringify(result)).toBe(true);expect(result.collected).toBe(3);expect(result.grounded).toBe(false);expect(result.backtrack).toBeLessThan(.2);expect(result.turn).toBeLessThan(Math.PI);expect(result.maxBank).toBeLessThanOrEqual(bank+.01);expect(result.segments).toHaveLength(4);expect(Math.max(...result.segments)).toBeLessThan(12);
});
test('exploration can collect the shared course in order',async({page})=>{
 await page.goto('/?mode=explore');const result=await page.evaluate(async()=>{
  const {createStage}=await import('/src/stage.js');const stage=createStage(document.createElement('canvas'));stage.resize(390,844,1);let s=stage.getStatus(),steps=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  for(;steps<2000&&!s.complete;steps++){
   const d={x:s.targetPosition.x-s.position.x,y:s.targetPosition.y-s.position.y,z:s.targetPosition.z-s.position.z};
   const pitch=Math.atan2(d.y,Math.hypot(d.x,d.z)),yaw=Math.atan2(d.x,-d.z);
   stage.update(.05,{mode:'explore',speed:6,pitchRate:clamp(wrap(pitch-s.pitch)*2,-.9,.9),yawRate:clamp(wrap(yaw-s.heading)*2,-.85,.85)});s=stage.getStatus();
  }
  const out={complete:s.complete,collected:s.collected,steps};stage.dispose();return out;
 });expect(result.complete,JSON.stringify(result)).toBe(true);expect(result.collected).toBe(3);
});
