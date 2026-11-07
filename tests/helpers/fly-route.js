export const setSlider=(page,id,value)=>page.locator('#'+id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
/** Actual controls and stage collision/collection are used; no position or collection hooks. */
export async function flyRoute(page,onExit) {
 const targets=[{x:0,y:10,z:0},{x:16,y:18,z:-24},{x:-14,y:12,z:-44},{x:0,y:7,z:-62}];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),tilt=n=>Math.sign(n)*(3+Math.abs(n)*22);
 const read=()=>page.locator('#app').evaluate(el=>({phase:el.dataset.phase,position:JSON.parse(el.dataset.position),pitch:Number(el.dataset.flightPitch),heading:Number(el.dataset.heading),speed:Number(el.dataset.speed)}));
 let heading=0,previous=null,sawExit=false;
 for(let i=0;i<1000;i++) {
  let state=await read();if(state.phase!=='running')break;
  const collected=Number(await page.locator('#collection-count').textContent());
  if(collected===3&&!sawExit){sawExit=true;if(onExit)await onExit();state=await read();previous=null;heading=state.heading;}
  const p=state.position,target=targets[collected];
  if(previous&&Math.hypot(p.x-previous.x,p.z-previous.z)>.001)heading=Math.atan2(p.x-previous.x,-(p.z-previous.z));previous=p;
  const dx=target.x-p.x,dy=target.y-p.y,dz=target.z-p.z;
  const bearing=Math.atan2(Math.sin(Math.atan2(dx,-dz)-heading),Math.cos(Math.atan2(dx,-dz)-heading)),desired=clamp(Math.atan2(dy,Math.hypot(dx,dz)),-.25,.25);
  await setSlider(page,'practice-pitch',tilt(desired/(15*Math.PI/180)));
  const bank=clamp(bearing*1.4,-40*Math.PI/180,40*Math.PI/180)/(40*Math.PI/180);
  await setSlider(page,'practice-steer',Math.sign(bank)*(3+Math.abs(bank)*12));
  await setSlider(page,'throttle-input',Math.round(clamp(.5+(6-state.speed)*.3+state.pitch*.8,.15,1)*100));
  await page.clock.runFor(100);
 }
 return sawExit;
}
