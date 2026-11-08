import {test,expect} from './helpers/legacy-ui.js';

for(const cameraMode of ['overlay','chase','cockpit'])test(`real AB presentation shares the renderer projection and preserves physics in ${cameraMode}`,async({page})=>{
  test.setTimeout(60000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  // This is a real saved preference. No velocity, position, collection or fuel fixture is used.
  await page.addInitScript(()=>localStorage.setItem('twist.flight-settings.v1',JSON.stringify({cockpitFov:70})));
  await page.goto(`/?mode=flight&course=legacy&camera=${cameraMode}`);
  const result=await page.evaluate(async cameraMode=>{
    const {createStage}=await import('/src/stage.js');
    const {LEGACY_COURSE}=await import('/src/course.js');
    const {cockpitProjection}=await import('/src/cockpit-projection.js');
    const {createGuidanceProjection}=await import('/src/guidance-layout.js');
    // Import the exact Three.js module already used by stage, including Vite's
    // version query, so the read-only renderer observation uses its prototype.
    const threeURL=performance.getEntriesByType('resource').map(entry=>entry.name)
      .find(url=>new URL(url).pathname.endsWith('/node_modules/.vite/deps/three.js'));
    if(!threeURL)throw Error('The live stage Three.js module was not observed');
    const THREE=await import(threeURL);
    const width=390,height=844,settingsOn=Object.freeze({streakAmount:1,speedFov:10,highSpeedShake:true});
    const settingsOff=Object.freeze({streakAmount:0,speedFov:0,highSpeedShake:false});
    const controls=Object.freeze({mode:'flight',pitchRate:0,bankAngle:0,throttle:.5,turnGravity:9.8,maxBank:30,cockpitFov:70});
    const canvasOn=document.createElement('canvas'),canvasOff=document.createElement('canvas');
    const rendered=new Map([[canvasOn,{}],[canvasOff,{}]]);
    const scenePrototype=THREE.Scene.prototype,beforeRender=scenePrototype.onBeforeRender;
    const hadOwnHook=Object.hasOwn(scenePrototype,'onBeforeRender');
    scenePrototype.onBeforeRender=function(renderer,scene,camera,...rest){
      const capture=rendered.get(renderer.domElement);
      if(capture&&camera.isPerspectiveCamera){
        const world=scene.children.find(child=>child.isGroup&&child.getObjectByName('ground-surface'));
        if(world){capture.camera=camera;capture.world=world;}
      }
      return beforeRender.call(this,renderer,scene,camera,...rest);
    };
    let stageOn=null,stageOff=null;
    const maximumDelta={position:0,velocity:0,speed:0,fuel:0,earned:0};
    let discreteMatch=true,comparedSteps=0;
    const physical=state=>({position:state.position,velocity:state.velocity,orientation:state.orientation,
      speed:state.speed,throttle:state.throttle,bank:state.bank,pitch:state.pitch,collected:state.collected,total:state.total,
      grounded:state.grounded,complete:state.complete,afterburner:state.afterburner});
    const compare=(on,off)=>{
      for(const axis of ['x','y','z']){
        maximumDelta.position=Math.max(maximumDelta.position,Math.abs(on.position[axis]-off.position[axis]));
        maximumDelta.velocity=Math.max(maximumDelta.velocity,Math.abs(on.velocity[axis]-off.velocity[axis]));
      }
      maximumDelta.speed=Math.max(maximumDelta.speed,Math.abs(on.speed-off.speed));
      maximumDelta.fuel=Math.max(maximumDelta.fuel,Math.abs(on.afterburner.fuel-off.afterburner.fuel));
      maximumDelta.earned=Math.max(maximumDelta.earned,Math.abs(on.afterburner.earned-off.afterburner.earned));
      discreteMatch&&=on.collected===off.collected&&on.complete===off.complete&&on.grounded===off.grounded
        &&on.afterburner.active===off.afterburner.active&&on.afterburner.uses===off.afterburner.uses;
      comparedSteps++;
    };
    const summary=state=>({physical:physical(state),effects:state.speedEffects,fieldOfView:state.fieldOfView,
      cameraQuaternion:state.cameraQuaternion,aircraft:state.aircraft});
    function projectionEvidence(state,canvas){
      const {camera,world}=rendered.get(canvas);
      if(!camera||!world)throw Error('The actual perspective render camera/world was not captured');
      const toPixel=worldPoint=>{
        const point=worldPoint.clone().applyMatrix4(world.matrixWorld).project(camera);
        return{x:(point.x+1)*width/2,y:(1-point.y)*height/2};
      };
      const actualTarget=toPixel(new THREE.Vector3(state.targetPosition.x,state.targetPosition.y,state.targetPosition.z));
      // The probe point lies on the measured velocity ray from the real viewing
      // position. It is used only for projection and is never assigned to stage.
      const ray=new THREE.Vector3(state.velocity.x,state.velocity.y,state.velocity.z).normalize().multiplyScalar(100)
        .add(new THREE.Vector3(state.viewPosition.x,state.viewPosition.y,state.viewPosition.z));
      const actualFpm=toPixel(ray),hud=cockpitProjection(state,width,height),guidance=createGuidanceProjection(state,width,height);
      const guided=guidance.projectDirection(state.velocity),target=guidance.target();
      const focal=height/2/Math.tan(state.fieldOfView.vertical*Math.PI/360);
      const localTarget={x:width/2+focal*state.targetLocal.x/-state.targetLocal.z,
        y:height/2-focal*state.targetLocal.y/-state.targetLocal.z};
      const errors={fpm:Math.hypot(actualFpm.x-hud.flightPath.x,actualFpm.y-hud.flightPath.y),
        guidanceFpm:Math.hypot(actualFpm.x-guided.x,actualFpm.y-guided.y),
        targetLocal:Math.hypot(actualTarget.x-localTarget.x,actualTarget.y-localTarget.y),
        guidanceTarget:Math.hypot(actualTarget.x-target.x,actualTarget.y-target.y)};
      const viewQuaternion=state.cameraQuaternion,worldQuaternion=state.worldQuaternion;
      return{actualFov:camera.fov,actualAspect:camera.aspect,projectionScaleY:camera.projectionMatrix.elements[5],
        stateFov:state.fieldOfView.vertical,baseFov:state.speedEffects.baseVerticalFov,extraFov:state.speedEffects.extraFov,
        snapshotFov:state.speedEffects.verticalFov,
        actualCameraQuaternion:{x:camera.quaternion.x,y:camera.quaternion.y,z:camera.quaternion.z,w:camera.quaternion.w},
        stateCameraQuaternion:viewQuaternion,
        worldQuaternionError:Math.max(...['x','y','z','w'].map(axis=>Math.abs(world.quaternion[axis]-worldQuaternion[axis]))),
        errors};
    }
    try{
      stageOn=createStage(canvasOn,{course:LEGACY_COURSE,cameraMode,visibility:'assisted'});
      stageOff=createStage(canvasOff,{course:LEGACY_COURSE,cameraMode,visibility:'assisted'});
      for(const stage of [stageOn,stageOff]){stage.resize(width,height,1);stage.launchFlight();}
      function step(manual,onSettings=settingsOn){
        stageOn.update(.05,{...controls,manualAfterburner:manual,speedSettings:onSettings});
        stageOff.update(.05,{...controls,manualAfterburner:manual,speedSettings:settingsOff});
        const on=stageOn.getStatus(),off=stageOff.getStatus();compare(on,off);return{on,off};
      }
      // Earn the first 25 through the unchanged light collection before making
      // the first AB request; an empty held request must not arm this test.
      let state;for(let index=0;index<48;index++)state=step(false);
      const earned={on:summary(state.on),off:summary(state.off)};
      for(let index=0;index<20;index++)state=step(true);
      const burning={on:summary(state.on),off:summary(state.off),
        onProjection:projectionEvidence(state.on,canvasOn),offProjection:projectionEvidence(state.off,canvasOff)};
      // Switch only presentation while real AB is still paid and running.
      state=step(true,settingsOff);
      const disabled={on:summary(state.on),off:summary(state.off),
        onProjection:projectionEvidence(state.on,canvasOn),offProjection:projectionEvidence(state.off,canvasOff)};
      return{earned,burning,disabled,maximumDelta,discreteMatch,comparedSteps,controlsCockpitFov:controls.cockpitFov,
        savedCockpitFov:JSON.parse(localStorage.getItem('twist.flight-settings.v1')).cockpitFov};
    }finally{
      try{stageOn?.dispose();stageOff?.dispose();}finally{
        if(hadOwnHook)scenePrototype.onBeforeRender=beforeRender;else delete scenePrototype.onBeforeRender;
      }
    }
  },cameraMode);

  for(const side of ['on','off']){
    expect(result.earned[side].physical.collected).toBe(1);
    expect(result.earned[side].physical.afterburner).toMatchObject({fuel:25,earned:25,active:false,uses:0,needsRelease:false});
    expect(result.burning[side].physical.speed).toBeGreaterThan(15);
    expect(result.burning[side].physical.afterburner).toMatchObject({active:true,uses:1});
    expect(result.burning[side].physical.afterburner.fuel).toBeGreaterThan(0);
    expect(result.burning[side].physical.afterburner.fuel).toBeLessThan(25);
    expect(result.disabled[side].physical.afterburner.active).toBe(true);
  }
  for(const phase of ['earned','burning','disabled'])expect(result[phase].on.physical).toEqual(result[phase].off.physical);
  expect(result.maximumDelta).toEqual({position:0,velocity:0,speed:0,fuel:0,earned:0});
  expect(result.discreteMatch).toBe(true);expect(result.comparedSteps).toBe(69);
  expect(result.burning.on.effects.lineCount).toBeGreaterThan(0);expect(result.burning.on.effects.extraFov).toBeGreaterThan(3);
  expect(result.burning.off.effects.lineCount).toBe(0);expect(result.burning.off.effects.extraFov).toBe(0);
  if(cameraMode!=='cockpit'){
    expect(result.burning.on.aircraft).toMatchObject({engines:2,afterburner:true,exhaustVisible:true});
    expect(result.burning.on.aircraft.exhaustLength).toBeGreaterThan(result.earned.on.aircraft.exhaustLength);
    expect(result.burning.on.aircraft.exhaustOpacity).toBeGreaterThan(result.earned.on.aircraft.exhaustOpacity);
  }
  for(const phase of ['burning','disabled'])for(const side of ['onProjection','offProjection']){
    const projection=result[phase][side];
    expect(projection.actualFov).toBeCloseTo(Math.min(115,projection.baseFov+projection.extraFov),9);
    expect(projection.actualFov).toBeCloseTo(projection.stateFov,9);expect(projection.snapshotFov).toBeCloseTo(projection.actualFov,9);
    expect(projection.actualAspect).toBeCloseTo(390/844,9);
    expect(projection.projectionScaleY).toBeCloseTo(1/Math.tan(projection.actualFov*Math.PI/360),9);
    expect(projection.actualCameraQuaternion).toEqual(projection.stateCameraQuaternion);expect(projection.worldQuaternionError).toBeLessThan(1e-12);
    for(const [name,error]of Object.entries(projection.errors))expect(error,`${cameraMode} ${phase} ${side} ${name} pixel error`).toBeLessThan(1e-6);
  }
  expect(result.disabled.on.effects).toMatchObject({lineCount:0,extraFov:0,highSpeedShake:false});
  expect(result.disabled.onProjection.actualFov).toBeCloseTo(result.disabled.onProjection.baseFov,9);
  expect(result.disabled.on.cameraQuaternion).toEqual(result.disabled.off.cameraQuaternion);
  if(cameraMode==='cockpit')expect(result.disabled.onProjection.actualFov).toBe(70);
  expect(result.controlsCockpitFov).toBe(70);expect(result.savedCockpitFov).toBe(70);expect(errors).toEqual([]);
  console.log(JSON.stringify({cameraMode,speed:result.burning.on.physical.speed,
    fuel:result.burning.on.physical.afterburner.fuel,fov:result.burning.onProjection.actualFov,
    baseFov:result.burning.onProjection.baseFov,extraFov:result.burning.onProjection.extraFov,
    lines:result.burning.on.effects.lineCount,projectionErrors:result.burning.onProjection.errors,maximumPhysicalDelta:result.maximumDelta}));
});
