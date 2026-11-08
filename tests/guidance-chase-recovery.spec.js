import {test,expect} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {computeDirectionGuidance} from '../src/guidance.js';
import {APP_VERSION} from '../src/version.js';
import {waitForCountdownThree} from './helpers/countdown.js';

// Real normal-flow controls. Target coordinates may seed/measure the situation,
// but the recovery driver only receives the FINAL DISPLAYED FD ray and current
// movement. No stage/pose/velocity injection and no automatic throttle control.
const rad=Math.PI/180,wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
const seedFile=process.env.TWIST_CHASE_SEED_FILE;
const importedSeed=seedFile?JSON.parse(await readFile(seedFile,'utf8')):null;
let sharedSeedTape=importedSeed?.seedTape??null,sharedSeedState=importedSeed?.start??null;
if(seedFile&&(!Array.isArray(sharedSeedTape)||sharedSeedTape.length===0||!sharedSeedTape.every(row=>['pitch','steer','twist'].every(key=>Number.isFinite(row[key])))||!sharedSeedState||!seedMatches(sharedSeedState)))throw new Error('The reference must contain a real successful near-height seed and its finite input tape');
const artifactRoot=`.cache/v${APP_VERSION.replaceAll('.','')}-chase-recovery`;
const phase=(page,name)=>expect(page.locator('#start-flow-panel')).toHaveAttribute('data-step',name);

function inputAngle(value,maximum,deadzone,extent,curve=1){
  return value===0?0:Math.sign(value)*(deadzone+(extent-deadzone)*(clamp(Math.abs(value)/maximum,0,1)**(1/curve)));
}
function controlAngles(nose,bank,settings){
  return {pitch:inputAngle(nose,settings.maxPitch*rad,settings.deadzone,settings.maxTilt),
    steer:inputAngle(bank,settings.maxBank*rad,settings.steerTiltDeadzone,settings.maxSteerTilt,settings.steerCurve),twist:0};
}
async function controls(page,angles,throttle){
  await page.evaluate(({angles,throttle})=>{
    const values=[['practice-pitch',angles.pitch],['practice-steer',angles.steer],['practice-twist',angles.twist]];
    if(throttle!==undefined)values.push(['throttle-input',throttle]);
    for(const [id,value]of values){const input=document.getElementById(id);input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));}
  },{angles,throttle});
}
async function read(page,settings){
  const state=await page.locator('#app').evaluate(app=>{
    const d=app.dataset,json=key=>JSON.parse(d[key]??'null');
    const center=id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,width:r.width,height:r.height,visible:!e.hidden&&!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden',clamped:e.dataset.clamped};};
    const target=json('navigationTargets')?.find(target=>target.next);
    return {phase:d.phase,camera:d.camera,position:json('position'),velocity:json('velocity'),orientation:json('orientation'),
      pitch:+d.flightPitch,bank:+d.bank,speed:+d.speed,throttle:+d.throttle,verticalSpeed:+d.verticalSpeed,recoveryAssist:+d.recoveryAssist,
      angleOfAttack:Number(d.angleOfAttack),
      heading:+d.heading,turnGravity:+d.turnGravity,ready:d.guidanceReady==='true',direction:json('guidanceDirection'),
      target:target?.position??null,targetId:target?.id,collected:+document.getElementById('collection-count').textContent,
      director:center('guidance-director'),fpm:center('guidance-flight-path'),heldMode:document.getElementById('guidance-panel').dataset.mode,
      status:document.getElementById('guidance-status').textContent,heightText:document.getElementById('target-height-inline').textContent,
      viewPitch:+d.viewPitch,displayRoll:+d.displayRoll,viewPosition:json('viewPosition'),cameraQuaternion:json('cameraQuaternion'),worldQuaternion:json('worldQuaternion'),
      verticalFov:+d.verticalFov,horizontalFov:+d.horizontalFov,afterburner:json('afterburner'),approaches:json('approaches'),session:json('session')};
  });
  if(state.target){
    const dx=state.target.x-state.position.x,dy=state.target.y-state.position.y,dz=state.target.z-state.position.z;
    state.horizontalDistance=Math.hypot(dx,dz);state.heightDelta=dy;state.distance=Math.hypot(dx,dy,dz);
    state.actualClimb=Math.atan2(state.velocity.y,Math.hypot(state.velocity.x,state.velocity.z));
    state.bearing=wrap(Math.atan2(dx,-dz)-Math.atan2(state.velocity.x,-state.velocity.z));
    expect(Number.isFinite(state.angleOfAttack),'Read the real force result, without reconstructing an extra bank rotation').toBe(true);
    const advice=computeDirectionGuidance({...state,targetPosition:state.target,targetRadius:3.2},{maxPitch:settings.maxPitch,maxBank:settings.maxBank,turnGravity:state.turnGravity});
    state.rawAdvice=advice?Object.fromEntries(['mode','rawMode','insideTurnCircle','criticalRecovery','trimDegrees','maxClimbDegrees','commandedClimbDegrees','yawErrorDegrees','climbErrorDegrees'].map(key=>[key,advice[key]])):null;
  }
  if(state.direction){state.displayedClimb=Math.atan2(state.direction.y,Math.hypot(state.direction.x,state.direction.z));state.displayedTrack=Math.atan2(state.direction.x,-state.direction.z);}
  state.pixelError=state.director.visible&&state.fpm.visible?Math.hypot(state.director.x-state.fpm.x,state.director.y-state.fpm.y):null;
  return state;
}
async function launch(page,camera){
  await page.setViewportSize({width:390,height:844});await page.clock.install();
  await page.addInitScript(camera=>{
    localStorage.setItem('twist.start-flow.v1',JSON.stringify({tutorialSeen:true,inputMethod:'practice',camera}));
    localStorage.setItem('twist.briefing.v1',JSON.stringify({version:1,mode:'off',seen:[]}));
    localStorage.removeItem('twist.flight-settings.v1');
    localStorage.setItem('twist.feedback-settings.v1',JSON.stringify({sound:false,bgm:false,vibration:false}));
    Object.defineProperty(Element.prototype,'requestFullscreen',{value:undefined,writable:true,configurable:true});
  },camera);
  await page.goto(`/?course=easy&camera=${camera}&mode=flight&view=assisted&steer=tilt&pitch=angle&display=bank`);
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));await page.clock.runFor(100);await phase(page,'title');
  await page.locator('#start-flow-start').click();await phase(page,'courses');await page.locator('#start-flow-course-start').click();await phase(page,'pose');
  await page.locator('#start-flow-hold').click();await phase(page,'countdown');await waitForCountdownThree(page);await expect(page.locator('#start-flow-countdown')).toHaveText('3');
  await page.clock.runFor(3040);await expect(page.locator('#app')).toHaveAttribute('data-phase','running');
  const settings=await page.evaluate(()=>Object.fromEntries(['deadzone','maxTilt','maxPitch','maxBank','steerTiltDeadzone','maxSteerTilt','steerCurve','turnGravity'].map(key=>[key,Number(document.getElementById('setting-'+key).value)])));
  expect(settings.turnGravity).toBe(9.8);expect(settings.maxBank).toBe(40);
  return settings;
}
function seedMatches(state){
  return state.phase==='running'&&state.collected===0&&Math.abs(state.target?.y-24)<.01
    &&state.position.y>=18.5&&state.position.y<=19.5&&state.horizontalDistance>=6&&state.horizontalDistance<=10
    &&state.bearing>=20*rad&&state.bearing<=40*rad&&Math.abs(state.bank)<=5*rad&&state.rawAdvice?.insideTurnCircle===true;
}
async function seed(page,settings,trace){
  if(sharedSeedTape){
    for(const angles of sharedSeedTape){await controls(page,angles,50);await page.clock.runFor(100);trace.push({part:'seed-replay',...(await read(page,settings)),input:angles});}
  }else{
    const tape=[];
    for(let i=0;i<100;i++){
      const state=await read(page,settings);trace.push({part:'seed',index:i,...state});
      if(seedMatches(state)){sharedSeedTape=tape;sharedSeedState=state;break;}
      if(state.phase!=='running'||state.collected!==0||state.horizontalDistance<5)break;
      // A brief LEFT bank creates the photographed target-on-the-right corner.
      // Descend/hold ALT19 only during preparation; no target-directed steering.
      const vertical=clamp((19-state.position.y)*.8,-.9,.6),actual=Math.atan2(state.velocity.y,Math.hypot(state.velocity.x,state.velocity.z));
      const wanted=Math.atan2(vertical,Math.hypot(state.velocity.x,state.velocity.z));
      const nose=clamp(state.pitch+1.5*(wanted-actual),-8*rad,8*rad),bank=i<8?-6*rad:0;
      const angles=controlAngles(nose,bank,settings);tape.push(angles);await controls(page,angles,50);await page.clock.runFor(100);
    }
  }
  const state=await read(page,settings);
  expect(seedMatches(state),'Real-control seed did not reach ALT19/TGT24/near-right corner; preserve trace instead of injecting a pose: '+JSON.stringify(state)).toBe(true);
  if(sharedSeedState){
    expect(Math.hypot(state.position.x-sharedSeedState.position.x,state.position.y-sharedSeedState.position.y,state.position.z-sharedSeedState.position.z),'Same input tape must reach a matching physical seed').toBeLessThan(.15);
    expect(Math.abs(state.speed-sharedSeedState.speed)).toBeLessThan(.01);
    expect(Math.abs(state.pitch-sharedSeedState.pitch)).toBeLessThan(.01);
    expect(Math.abs(state.bank-sharedSeedState.bank)).toBeLessThan(.01);
  }
  const replay=trace.filter(row=>row.part==='seed-replay').map(row=>row.input);
  if(replay.length)expect(replay).toEqual(sharedSeedTape);
  return state;
}
// Deliberately does not accept target, distance, heightDelta, bearing or rawAdvice.
function followDisplayedFd({ready,direction,velocity,pitch,speed,turnGravity},settings){
  if(!ready||!direction)return {pitch:0,steer:0,twist:0};
  const track=Math.atan2(velocity.x,-velocity.z),climb=Math.atan2(velocity.y,Math.hypot(velocity.x,velocity.z));
  const fdTrack=Math.atan2(direction.x,-direction.z),fdClimb=Math.atan2(direction.y,Math.hypot(direction.x,direction.z));
  return controlAngles(clamp(pitch+1.5*(fdClimb-climb),-15*rad,15*rad),clamp(Math.atan(wrap(fdTrack-track)*1.5*Math.max(speed,6)/turnGravity),-30*rad,30*rad),settings);
}

for(const camera of ['chase','cockpit'])for(const throttle of [50,65])test(`normal easy FD-only near-height recovery ${camera} fixed THR${throttle}`,async({page})=>{
  test.setTimeout(90000);await mkdir(artifactRoot,{recursive:true});
  const id=`${camera}-thr${throttle}-${Date.now()}`,trace=[],errors=[];page.on('pageerror',error=>errors.push(error.message));
  let start=null,last=null,summary=null,settings=null;
  try{
    settings=await launch(page,camera);start=await seed(page,settings,trace);
    await page.screenshot({path:`${artifactRoot}/${id}-seed.png`});
    await controls(page,followDisplayedFd(start,settings),throttle);await page.clock.runFor(100);
    let previousTrack=Math.atan2(start.velocity.x,-start.velocity.z),turn=0,clamped=0,unready=0,minimumHeightDelta=Math.abs(start.heightDelta),minimumDistance=start.distance;
    let firstGoAround=null,firstClosestPass=null;
    for(let i=0;i<450;i++){
      const state=await read(page,settings);last=state;
      const trackAngle=Math.atan2(state.velocity.x,-state.velocity.z);turn+=Math.abs(wrap(trackAngle-previousTrack));previousTrack=trackAngle;
      minimumHeightDelta=Math.min(minimumHeightDelta,Math.abs(state.heightDelta));minimumDistance=Math.min(minimumDistance,state.distance);
      if(state.director.clamped==='true')clamped++;if(!state.ready)unready++;
      trace.push({part:'FD-only',index:i,seconds:(i+1)/10,...state,turn});
      if(!firstGoAround&&state.heldMode==='go-around'){firstGoAround=state;await page.screenshot({path:`${artifactRoot}/${id}-go-around.png`});}
      if(!firstClosestPass&&state.horizontalDistance<5&&state.collected===0){firstClosestPass=state;await page.screenshot({path:`${artifactRoot}/${id}-closest-pass.png`});}
      if(state.collected>0||state.phase!=='running')break;
      expect(state.throttle).toBeCloseTo(throttle/100,6);expect(state.afterburner?.active).not.toBe(true);
      await controls(page,followDisplayedFd(state,settings));await page.clock.runFor(100);
    }
    summary={camera,throttle,acquired:last?.collected>0,turnRadians:turn,turns:turn/(2*Math.PI),clampedFrames:clamped,unreadyFrames:unready,minimumHeightDelta,minimumDistance,
      firstGoAround,firstClosestPass,seedReferenceDifference:sharedSeedState?{position:Math.hypot(start.position.x-sharedSeedState.position.x,start.position.y-sharedSeedState.position.y,start.position.z-sharedSeedState.position.z),speed:start.speed-sharedSeedState.speed,pitch:start.pitch-sharedSeedState.pitch,bank:start.bank-sharedSeedState.bank}:null};
    console.log(JSON.stringify({id,summary}));
    expect(last?.collected,'TGT1 was not acquired while following only the final displayed FD: '+JSON.stringify(summary)).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  }finally{
    await writeFile(`${artifactRoot}/${id}.json`,JSON.stringify({camera,throttle,settings,start,last,summary,errors,seedSource:seedFile??'generated-in-worker',seedTape:sharedSeedTape,seedReference:sharedSeedState,trace},null,2));
    if(!page.isClosed())await page.screenshot({path:`${artifactRoot}/${id}-final.png`}).catch(()=>{});
  }
});
