import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

async function cockpit(page){
  await page.setViewportSize({width:390,height:844});await page.clock.install();
  await page.goto('/?mode=flight&camera=cockpit&course=easy');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  await page.locator('#practice-button').click();await page.clock.runFor(100);
}

test('actual cockpit DOM keeps climb-limit and target-height changes continuous with the exact FPM',async({page})=>{
  await cockpit(page);
  const result=await page.evaluate(async()=>{
    const {updateGuidancePanel:update}=await import('/src/guidance-panel.js');
    const {createGuidanceProjection,guidanceDirectionAllowed}=await import('/src/guidance-layout.js');
    const d=document.getElementById('app').dataset,rad=Math.PI/180;
    const position=JSON.parse(d.position),heading=+d.heading;
    const pose={worldQuaternion:JSON.parse(d.worldQuaternion),cameraQuaternion:JSON.parse(d.cameraQuaternion),fieldOfView:{vertical:+d.verticalFov}};
    const base={...pose,mode:'flight',total:3,collected:0,position,throttle:.5,bank:0,angleOfAttack:0,heading,
      targetLabel:'光 1',orientation:JSON.parse(d.orientation)};
    const state=(climb,targetClimb=35,count=0)=>{
      const yaw=heading+45*rad,range=100;
      const relative={x:Math.sin(yaw)*range,y:Math.tan(targetClimb*rad)*range,z:-Math.cos(yaw)*range};
      const projected=createGuidanceProjection({...pose,targetLocal:{x:0,y:0,z:-1}},innerWidth,innerHeight).projectDirection(relative);
      return {...base,collected:count,targetPosition:{x:position.x+relative.x,y:position.y+relative.y,z:position.z+relative.z},targetLocal:projected.local,
        velocity:{x:Math.sin(heading)*Math.cos(climb*rad)*10,y:Math.sin(climb*rad)*10,z:-Math.cos(heading)*Math.cos(climb*rad)*10}};
    };
    const draw=(s,index)=>{
      const g=update(s,{camera:'cockpit',now:index*1000/60,dt:index?1/60:0});
      const expected=createGuidanceProjection(s,innerWidth,innerHeight).projectDirection(s.velocity);
      return {ring:g.director,fpm:g.flightPath,mode:g.mode,critical:g.criticalRecovery,
        climb:Math.atan2(g.direction.y,Math.hypot(g.direction.x,g.direction.z))/rad,
        yaw:Math.atan2(g.direction.x,-g.direction.z)/rad,
        allowed:guidanceDirectionAllowed(g.direction,g),
        fpmError:g.flightPath?Math.hypot(g.flightPath.x-expected.x,g.flightPath.y-expected.y):null};
    };
    update(base,{phase:'paused'});const startupBefore=draw(state(9.99),0),startupAfter=draw(state(10.01),1);
    update(base,{phase:'paused'});draw(state(9.99),0);const control=draw(state(9.99),1);
    // First settle the normal HUD-collision easing. Its startup motion also
    // happens with unchanged input and must not be called a boundary jump.
    update(base,{phase:'paused'});let before;
    for(let index=0;index<60;index++)before=draw(state(9.99),index);
    const after=draw(state(10.01),60);
    update(base,{phase:'paused'});const above=draw(state(0,8),0),below=draw(state(0,-8,1),1);
    return {before,after,above,below,startupBefore,startupAfter,control};
  });
  const move=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  await mkdir(new URL('../.cache/',import.meta.url),{recursive:true});
  await writeFile(new URL('../.cache/v0129-motion-boundary-result.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({boundaryMove:move(result.before.ring,result.after.ring),startupBoundaryMove:move(result.startupBefore.ring,result.startupAfter.ring),unchangedControlMove:move(result.startupBefore.ring,result.control.ring),beforeYaw:result.before.yaw,afterYaw:result.after.yaw,controlYaw:result.control.yaw}));
  for(const value of Object.values(result)){
    expect(value.ring).not.toBeNull();expect(value.fpm).not.toBeNull();expect(value.allowed).toBe(true);
    expect(value.fpmError).not.toBeNull();expect(value.fpmError).toBeLessThan(1e-7);
  }
  expect(result.after.mode).toBe('recover');expect(result.after.critical).toBe(false);
  expect(move(result.startupBefore.ring,result.startupAfter.ring)).toBeCloseTo(move(result.startupBefore.ring,result.control.ring),7);
  expect(move(result.startupBefore.ring,result.startupAfter.ring)).toBeLessThan(20);
  expect(move(result.before.ring,result.after.ring)).toBeLessThan(1);
  expect(move(result.before.fpm,result.after.fpm)).toBeLessThan(.18);
  expect(result.above.climb-result.below.climb).toBeCloseTo(2.5,6);
  expect(move(result.above.ring,result.below.ring)).toBeLessThan(25);
});

test('ordinary cockpit physics crosses the climb limit without HUD-corner jumps or hiding the pair',async({page})=>{
  await cockpit(page);
  const result=await page.evaluate(async()=>{
    const {createStage}=await import('/src/stage.js');
    const {updateGuidancePanel:update}=await import('/src/guidance-panel.js');
    const {createGuidanceProjection,guidanceDirectionAllowed}=await import('/src/guidance-layout.js');
    const canvas=document.createElement('canvas');canvas.style.cssText='position:absolute;inset:0;pointer-events:none';
    document.getElementById('app').append(canvas);
    // A diagnostic target, distinct from production course acceptance. Only
    // normal pitch-rate/throttle input is supplied to the actual physics.
    const course={id:'director-diagnostic',name:'Director diagnostic',start:{x:0,y:14,z:0},
      lights:[{x:100,y:44,z:-100},{x:100,y:30,z:-180},{x:0,y:20,z:-240}],exit:{x:0,y:14,z:-300},abStraights:[]};
    const stage=createStage(canvas,{course,cameraMode:'cockpit',visibility:'assisted'}),rad=Math.PI/180;
    stage.resize(innerWidth,innerHeight,1);stage.launchFlight();
    update(stage.getStatus(),{phase:'paused'});
    let previous=null,crossing=null,maxRingMove=0,maxFpmError=0,hidden=0,allAllowed=true,frames=0;
    try{
      for(let index=0;index<300;index++){
        const before=stage.getStatus();
        stage.update(1/60,{mode:'flight',pitchRate:before.pitch<15*rad ? .2 : 0,bankAngle:0,throttle:.8,
          turnGravity:9.8,maxBank:40,cockpitFov:70,speedSettings:{speedFov:0,streakAmount:0,highSpeedShake:false}});
        const state=stage.getStatus(),climb=Math.atan2(state.velocity.y,Math.hypot(state.velocity.x,state.velocity.z))/rad;
        const g=update(state,{camera:'cockpit',now:index*1000/60,dt:1/60});
        const expected=createGuidanceProjection(state,innerWidth,innerHeight).projectDirection(state.velocity);
        frames++;
        if(!g.director||!g.flightPath)hidden++;
        if(g.flightPath)maxFpmError=Math.max(maxFpmError,Math.hypot(g.flightPath.x-expected.x,g.flightPath.y-expected.y));
        if(g.director)allAllowed&&=guidanceDirectionAllowed(g.direction,g);
        if(previous?.ring&&g.director)maxRingMove=Math.max(maxRingMove,Math.hypot(previous.ring.x-g.director.x,previous.ring.y-g.director.y));
        const record={index,climb,ring:g.director,direction:g.direction,mode:g.mode,critical:g.criticalRecovery};
        if(!crossing&&previous?.climb<=10&&climb>10)crossing={before:previous,after:record};
        previous=record;
        if(crossing&&index>crossing.after.index+30)break;
      }
      return {crossing,maxRingMove,maxFpmError,hidden,allAllowed,frames};
    }finally{stage.dispose();canvas.remove();}
  });
  expect(result.crossing).not.toBeNull();expect(result.crossing.after.critical).toBe(false);
  expect(result.frames).toBeGreaterThan(80);expect(result.hidden).toBe(0);
  expect(result.maxRingMove).toBeLessThan(20);expect(result.maxFpmError).toBeLessThan(1e-7);
  expect(result.allAllowed).toBe(true);
});

for(const language of ['en','ja'])test(`compact next-target notice keeps all text and clears controls without losing FD/FPM ${language}`,async({page})=>{
  await page.setViewportSize({width:360,height:640});await page.clock.install();
  await page.goto('/?mode=flight&course=legacy&camera=overlay');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  await page.locator('#practice-button').click();await page.clock.runFor(100);
  const result=await page.evaluate(async language=>{
    const {updateGuidancePanel:update}=await import('/src/guidance-panel.js');
    const {createGuidanceProjection}=await import('/src/guidance-layout.js');
    const data=document.getElementById('app').dataset,rad=Math.PI/180,pose={worldQuaternion:JSON.parse(data.worldQuaternion),cameraQuaternion:JSON.parse(data.cameraQuaternion),fieldOfView:{vertical:+data.verticalFov}};
    const relative={x:Math.sin(179*rad)*100,y:31,z:-Math.cos(179*rad)*100};
    const targetLocal=createGuidanceProjection({...pose,targetLocal:relative},innerWidth,innerHeight).projectDirection(relative).local;
    const state={...pose,mode:'flight',courseId:'notice-fixture',total:8,collected:6,position:{x:0,y:14,z:0},targetPosition:{x:relative.x,y:45,z:relative.z},targetLocal,
      velocity:{x:0,y:0,z:-10},heading:0,bank:0,angleOfAttack:0,throttle:.5,targetLabel:'光 7'};
    const settings={hudLanguage:language},notice=document.getElementById('guidance-next-notice'),toast=document.getElementById('toast');
    const rectangle=element=>{const r=element.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    const snapshot=()=>{
      const bounds=rectangle(notice),children=[...notice.children];
      const reserved=['flight-essential-speed','flight-essential-altitude','bottom-panel','practice-panel','radar','guidance-director','guidance-flight-path','guidance-heading','toast'];
      return {visible:!notice.hidden,compact:notice.dataset.compact,width:bounds.width,height:bounds.height,
        title:document.getElementById('guidance-notice-target').textContent,detail:document.getElementById('guidance-notice-text').textContent,
        strongFont:parseFloat(getComputedStyle(document.getElementById('guidance-notice-text')).fontSize),
        textFits:children.every(element=>{const r=rectangle(element);return r.left>=bounds.left&&r.right<=bounds.right&&r.top>=bounds.top&&r.bottom<=bounds.bottom&&element.scrollWidth<=element.clientWidth+1;}),
        clear:reserved.every(id=>{const element=document.getElementById(id);return !element||element.hidden||!element.getClientRects().length||getComputedStyle(element).visibility==='hidden'||Number(getComputedStyle(element).opacity)===0||!overlap(bounds,rectangle(element));})};
    };
    const rows=[];
    for(const count of [7,8]){
      update(state,{phase:'paused'});toast.hidden=false;
      const atCount=collected=>({...state,collected,targetLabel:collected===8?'出口':`光 ${collected+1}`});
      update(atCount(count-1),{camera:'overlay',settings,now:0,dt:0});
      const compact=update(atCount(count),{camera:'overlay',settings,now:100,dt:.1});
      const small=snapshot();
      toast.hidden=true;
      const normal=update(atCount(count),{camera:'overlay',settings,now:200,dt:.1});
      const restored=snapshot();
      update(atCount(count),{camera:'overlay',settings,now:1900,dt:.1});
      rows.push({count,small,restored,ready:compact.driverReady&&normal.driverReady,fpm:compact.flightPath,expired:notice.hidden});
    }
    return rows;
  },language);
  for(const row of result){
    expect(row.ready).toBe(true);expect(row.fpm).not.toBeNull();expect(row.small.visible).toBe(true);
    expect(row.small.compact).toBe('true');expect(row.small.width).toBe(220);expect(row.small.height).toBe(48);
    expect(row.small.textFits).toBe(true);expect(row.small.clear).toBe(true);expect(row.small.strongFont).toBe(16);
    expect(row.small.detail).toContain('179');expect(row.small.detail).toContain('31');
    expect(row.small.title).toContain(language==='ja'?(row.count===8?'出口':'光 8'):(row.count===8?'NEXT EXIT':'NEXT TGT 8'));
    expect(row.restored.visible).toBe(true);expect(row.restored.compact).toBe('false');expect(row.restored.width).toBe(290);expect(row.restored.height).toBe(62);
    expect(row.restored.textFits).toBe(true);expect(row.restored.clear).toBe(true);expect(row.restored.strongFont).toBe(19);expect(row.expired).toBe(true);
  }
});
