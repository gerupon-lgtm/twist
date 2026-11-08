import {test,expect} from '@playwright/test';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {APP_VERSION} from '../src/version.js';

// Native browser/CSS integration of the production render update. Controlled
// advisory snapshots are a render fixture, not an actual-flight acceptance test.
for(const reducedMotion of ['no-preference','reduce'])test(`alignment entry uses one native local pulse with motion=${reducedMotion}`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion});
  await page.goto('/tests/fixtures/supersonic-renderer.html');
  const html=(await readFile(new URL('../index.html',import.meta.url),'utf8')).replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
  await page.setContent(html);await page.addStyleTag({path:'src/style.css'});await page.addStyleTag({path:'src/guidance.css'});
  await page.addStyleTag({content:'#app>:not(#guidance-panel),#world{display:none!important}body{background:#527e91}.app{position:fixed;inset:0}#alignment-fixture-version{position:fixed;left:10px;top:10px;color:#fff;font:12px monospace;z-index:9}'});
  await page.evaluate(async version=>{
    const label=document.createElement('small');label.id='alignment-fixture-version';label.textContent=`v${version} alignment render fixture`;document.body.append(label);
    const {updateGuidancePanel}=await import('/src/guidance-panel.js'),identity={x:0,y:0,z:0,w:1};
    document.getElementById('app').dataset.phase='running';
    window.alignmentFixture={state:{mode:'flight',collected:0,total:3,course:{id:'alignment-fixture'},position:{x:0,y:10,z:0},targetPosition:{x:0,y:10,z:-60},targetLocal:{x:0,y:0,z:-60},
      velocity:{x:0,y:0,z:-10},worldQuaternion:identity,cameraQuaternion:identity,orientation:identity,fieldOfView:{vertical:90},heading:0,pitch:0,bank:0,angleOfAttack:0,throttle:.5,targetLabel:'光 1'},
      phase:'running',camera:'overlay',enabled:true,edges:[],calls:0,previousActive:false,last:null};
    window.setAlignmentTarget=x=>{alignmentFixture.state.targetPosition.x=x;alignmentFixture.state.targetLocal.x=x;};
    let before=performance.now();
    const frame=()=>{
      const now=performance.now(),f=alignmentFixture;
      f.last=updateGuidancePanel(f.state,{phase:f.phase,camera:f.camera,now,dt:(now-before)/1000,settings:{flightDirector:f.enabled,targetHeadingCue:false,edgeGuidance:false,nextTargetNotice:false}});before=now;f.calls++;
      const active=document.getElementById('guidance-director').dataset.alignmentPulse==='true';
      if(active!==f.previousActive){f.edges.push({now,active,serial:+document.getElementById('guidance-director').dataset.alignmentPulseSerial});f.previousActive=active;}
      f.timer=setTimeout(frame,16);
    };frame();
  },APP_VERSION);
  const director=page.locator('#guidance-director');
  await expect(director).toHaveAttribute('data-aligned','true');await expect(director).toHaveAttribute('data-alignment-pulse','false');
  const background=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
  const enter=async()=>{
    await page.evaluate(()=>setAlignmentTarget(8));await expect(director).toHaveAttribute('data-alignment-pulse-armed','true');
    await page.evaluate(()=>setAlignmentTarget(0));await expect(director).toHaveAttribute('data-alignment-pulse','true');
  };
  await enter();await page.waitForTimeout(45);
  const native=await page.evaluate(()=>{
    const g=document.getElementById('guidance-director'),circle=g.querySelector('circle'),style=getComputedStyle(circle),animation=circle.getAnimations()[0],transform=style.transform;
    return {active:g.dataset.alignmentPulse,serial:+g.dataset.alignmentPulseSerial,aligned:g.dataset.aligned,stroke:style.stroke,strokeWidth:+style.strokeWidth.replace('px',''),transform,
      scale:transform==='none'?1:new DOMMatrixReadOnly(transform).a,animation:animation?{name:animation.animationName,time:animation.currentTime,state:animation.playState,duration:animation.effect.getTiming().duration}:null,
      pair:alignmentFixture.last?.driverReady,angle:alignmentFixture.last?.alignmentFeedback,background:getComputedStyle(document.body).backgroundColor};
  });
  expect(native.pair).toBe(true);expect(native.aligned).toBe('true');expect(native.animation).not.toBeNull();expect(native.animation.duration).toBe(280);expect(native.animation.state).toBe('running');expect(native.animation.time).toBeGreaterThan(0);
  expect(native.strokeWidth).toBeGreaterThan(4);expect(native.background).toBe(background);expect(native.serial).toBe(1);
  if(reducedMotion==='reduce'){expect(native.animation.name).toBe('guidance-alignment-pulse-reduced');expect(native.scale).toBe(1);expect(native.strokeWidth).toBeLessThanOrEqual(4.6);}
  else{expect(native.animation.name).toBe('guidance-alignment-pulse');expect(native.scale).toBeGreaterThan(1);expect(native.scale).toBeLessThanOrEqual(1.081);}
  await expect(director).toHaveAttribute('data-alignment-pulse','false');await page.waitForTimeout(1000);
  await expect(director).toHaveAttribute('data-alignment-pulse-serial','1');
  // A target change cannot turn an old separation into an acquisition pulse.
  await page.evaluate(()=>setAlignmentTarget(8));await expect(director).toHaveAttribute('data-alignment-pulse-armed','true');
  await page.evaluate(()=>{alignmentFixture.state.collected=1;setAlignmentTarget(0);});await page.waitForTimeout(300);
  await expect(director).toHaveAttribute('data-alignment-pulse','false');await expect(director).toHaveAttribute('data-alignment-pulse-serial','1');
  // An invisible/restarted pair does not replay an entry from its hidden time.
  await page.evaluate(()=>{alignmentFixture.enabled=false;setAlignmentTarget(8);});await page.waitForTimeout(60);
  await page.evaluate(()=>{setAlignmentTarget(0);alignmentFixture.enabled=true;});await page.waitForTimeout(200);
  await expect(director).toHaveAttribute('data-alignment-pulse','false');
  await page.evaluate(()=>{alignmentFixture.phase='paused';});await page.waitForTimeout(60);await page.evaluate(()=>{alignmentFixture.phase='running';});await page.waitForTimeout(150);
  await expect(director).toHaveAttribute('data-alignment-pulse-serial','1');
  await enter();await page.waitForTimeout(45);
  const artifact=`.cache/v${APP_VERSION.replaceAll('.','')}-alignment-${reducedMotion}`;
  await mkdir('.cache',{recursive:true});await page.screenshot({path:artifact+'.png'});
  const final=await page.evaluate(()=>{clearTimeout(alignmentFixture.timer);return {edges:alignmentFixture.edges,calls:alignmentFixture.calls,feedback:alignmentFixture.last?.alignmentFeedback};});
  expect(final.feedback.serial).toBe(2);expect(final.edges.filter(e=>e.active)).toHaveLength(2);
  const firstOn=final.edges.find(e=>e.active&&e.serial===1),firstOff=final.edges.find(e=>!e.active&&e.serial===1&&e.now>firstOn.now);
  expect(firstOff.now-firstOn.now).toBeGreaterThanOrEqual(260);expect(firstOff.now-firstOn.now).toBeLessThan(400);
  expect(errors).toEqual([]);await writeFile(artifact+'.json',JSON.stringify({layer:'native CSS/render fixture; no physics or real-device acceptance',reducedMotion,native,firstPulseDurationMs:firstOff.now-firstOn.now,final,errors},null,2)+'\n');
});
