import * as THREE from 'three';
import {createAircraft} from '../aircraft.js';
import {computeFieldOfView,normalizeVisibility} from '../visibility.js';
import {advanceChaseAngles,bodyViewAngles,normalizeCameraMode} from '../flight-camera.js';
import {advanceDisplayRoll} from '../flight-display.js';
import {createSupersonicEffects,supersonicSpeedPresentation} from '../supersonic-effects.js';
import {chooseRenderOrigin,relativeToOrigin} from './origin.js';
import {bodyQuaternion,supersonicCameraFrame,renderRootTranslation,cameraLocalPosition,projectCameraPoint} from './camera.js';
import {createSupersonicWorld} from './world.js';
import {createSierra10World} from './sierra-world.js';

const SKY=0xb8dce9,plain=v=>({x:v.x,y:v.y,z:v.z}),quat=q=>({...plain(q),w:q.w});
const finite=(v,f=0)=>Number.isFinite(v)?v:f;
const disposeTree=root=>{
  const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();root.clear();
};

/** Drawing only; the fixture API takes poses, never writes to a stage/kernel. */
export function createSupersonicRenderer(canvas,{course,visibility='assisted',display='bank',cameraMode='overlay'}={}){
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch{throw new Error('3D画面を開けませんでした。WebGL 2が使えるブラウザで開き直してください。');}
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.autoClear=false;renderer.info.autoReset=false;renderer.setClearColor(SKY,1);
  const scene=new THREE.Scene();scene.background=new THREE.Color(SKY);scene.fog=new THREE.Fog(SKY,course.id==='sierra10'?9000:42000,course.id==='sierra10'?18000:64000);
  const camera=new THREE.PerspectiveCamera(64,1,2,64000);scene.add(camera);
  const root=new THREE.Group();root.name='cpu-rebased-world';scene.add(root);
  const world=(course.id==='sierra10'?createSierra10World:createSupersonicWorld)({course,maxAnisotropy:renderer.capabilities.getMaxAnisotropy(),visibility});root.add(world.group);
  scene.add(new THREE.HemisphereLight(0xf4fcff,0x658384,2.4));
  const sun=new THREE.DirectionalLight(0xfff8e7,2.6);sun.position.set(-35,65,30);scene.add(sun);
  const worldJet=createAircraft();worldJet.group.name='supersonic-physical-aircraft';root.add(worldJet.group);
  const craftScene=new THREE.Scene(),craftCamera=new THREE.OrthographicCamera(-1,1,1,-1,1,1000);craftCamera.position.z=200;
  craftScene.add(new THREE.HemisphereLight(0xf4fcff,0x7896a2,2.4));const craftSun=sun.clone();craftScene.add(craftSun);
  const craft=new THREE.Group(),overlayJet=createAircraft();overlayJet.group.rotation.x=Math.PI/2;overlayJet.group.scale.setScalar(13);craft.add(overlayJet.group);craftScene.add(craft);
  const effects=createSupersonicEffects();camera.add(effects.cameraGroup);
  let width=1,height=1,ratio=1,origin=null,originSerial=0,frame=null,lastState=null,lastInput={},disposed=false,phase='ready';
  let mode=normalizeCameraMode(cameraMode),view=normalizeVisibility(visibility),displayMode=display==='fixed'?'fixed':'bank';
  let chaseAngles=null,phoneRoll=0,fieldOfView={vertical:64,horizontal:64},baseVerticalFov=64,extraFov=0;
  function projection(input={}){
    fieldOfView=computeFieldOfView(width,height,view);
    if(mode==='cockpit'&&finite(input.cockpitFov)>=60)fieldOfView.vertical=Math.min(fieldOfView.vertical,input.cockpitFov);
    baseVerticalFov=fieldOfView.vertical;fieldOfView.vertical=Math.min(115,baseVerticalFov+extraFov);
    fieldOfView.horizontal=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(fieldOfView.vertical)/2)*width/height));
    camera.aspect=width/height;camera.fov=fieldOfView.vertical;camera.updateProjectionMatrix();
  }
  function render(){if(disposed||!frame)return;renderer.info.reset();renderer.setRenderTarget(null);renderer.clear();renderer.render(scene,camera);renderer.clearDepth();renderer.render(craftScene,craftCamera);}
  function sync(state,input={},dt=0,options={}){
    if(disposed)return;lastState=state;lastInput=input;phase=options.phase??phase;
    const time=state.simulationSeconds??0;
    phoneRoll=advanceDisplayRoll(phoneRoll,finite(input.displayTwist),Math.max(0,dt),finite(input.displayTimeConstant,.05));
    const settings={...input.speedSettings,...input,speedLines:input.speedSettings?.streakAmount??input.speedLines??input.streakAmount,...(course.flightProfile?.presentationReferenceSpeed?{presentationReferenceSpeed:course.flightProfile.presentationReferenceSpeed}:{})};
    const presentation=supersonicSpeedPresentation(state.speed,settings,state.afterburner,time,mode);extraFov=presentation.extraFov;projection(input);
    const body=bodyQuaternion(state.orientation),base=body.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),state.bank??0));
    if(mode==='chase')chaseAngles=advanceChaseAngles(chaseAngles,bodyViewAngles(base),Math.max(0,dt),finite(input.chaseTimeConstant,.15));
    frame=supersonicCameraFrame(state,{cameraMode:mode,display:displayMode,phoneRoll,screenOffset:finite(input.displayScreenOffset),chaseAngles,shake:presentation.shake});
    const nextOrigin=options.origin??chooseRenderOrigin(state.position,origin);
    if(!origin||['x','y','z'].some(k=>nextOrigin[k]!==origin[k])){origin={...nextOrigin};originSerial++;}
    root.quaternion.copy(frame.worldQuaternion);renderRootTranslation(origin,frame,root.position);
    camera.quaternion.copy(frame.cameraQuaternion);craftCamera.quaternion.copy(frame.cameraQuaternion);craft.quaternion.copy(frame.craftQuaternion);
    world.sync(origin,time,state);relativeToOrigin(state.position,origin,worldJet.group.position);worldJet.group.quaternion.copy(body);
    // The actual external solid stays scale1 and uses the same pose as the contact hull.
    worldJet.group.visible=mode==='chase';craft.visible=mode==='overlay';
    worldJet.setPower(state.throttle,state.afterburner?.active);overlayJet.setPower(state.throttle,state.afterburner?.active);
    const effectParent=mode==='overlay'?overlayJet.group:worldJet.group;if(effects.craftGroup.parent!==effectParent)effectParent.add(effects.craftGroup);
    effects.update({state:{...state,supersonic:state.supersonic??{mach:state.mach}},camera:mode,phase:state.grounded||state.complete?'terminal':phase,
      verticalFov:camera.fov,aspect:width/height,timeSeconds:time,settings});
    root.updateMatrixWorld(true);camera.updateMatrixWorld(true);render();
  }
  function resize(w,h,pixelRatio=1){if(disposed)return;width=Math.max(1,finite(w,1));height=Math.max(1,finite(h,1));ratio=THREE.MathUtils.clamp(finite(pixelRatio,1),.5,1.6);renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);
    Object.assign(craftCamera,{left:-width/2,right:width/2,top:height/2,bottom:-height/2});craftCamera.updateProjectionMatrix();if(lastState)sync(lastState,lastInput,0);}
  function change(callback){if(disposed)return;callback();if(lastState)sync(lastState,lastInput,0);}
  function snapshot(){
    if(!frame)return null;
    return {width,height,pixelRatio:ratio,origin:{...origin},originSerial,worldQuaternion:quat(frame.worldQuaternion),cameraQuaternion:quat(camera.quaternion),craftQuaternion:quat(craft.quaternion),
      worldCraftQuaternion:worldJet.group.quaternion.toArray(),worldCraftScreenQuaternion:camera.quaternion.clone().invert().multiply(frame.worldQuaternion).multiply(worldJet.group.quaternion).toArray(),
      craftScreenQuaternion:quat(craftCamera.quaternion.clone().invert().multiply(craft.quaternion)),viewPosition:plain(frame.viewPosition),viewPitch:frame.viewPitch,viewAssistance:0,displayRoll:frame.displayRoll,
      fieldOfView:{...fieldOfView},cameraClipping:{near:camera.near,far:camera.far},cameraPosition:plain(camera.position),craftScreen:{x:width/2,y:height/2},
      cameraMode:mode,display:displayMode,visibility:view,craftVisible:craft.visible||worldJet.group.visible,chaseAngles:chaseAngles?{...chaseAngles}:null,aircraft:worldJet.diagnostics(),
      speedEffects:{...effects.snapshot(),extraFov,baseVerticalFov,highSpeedShake:lastInput.highSpeedShake!==false},world:world.snapshot(),
      gpu:{geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs?.length??0,calls:renderer.info.render.calls},disposed};
  }
  /** Offscreen GPU marker through this exact root, camera and origin. No physics hooks. */
  function drawMarkerDiagnostic(absolutePosition,{radiusMetres=.15}={}){
    if(!frame||disposed)throw new Error('sync a pose before measuring');
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(radiusMetres,16,12),new THREE.MeshBasicMaterial({color:0xff00ff,fog:false,toneMapped:false}));
    relativeToOrigin(absolutePosition,origin,mesh.position);root.add(mesh);
    const hidden=root.children.filter(o=>o!==mesh).map(o=>[o,o.visible]);for(const [o]of hidden)o.visible=false;
    const previousBackground=scene.background,previousFog=scene.fog,visibleEffects=effects.cameraGroup.visible;scene.background=new THREE.Color(0);scene.fog=null;effects.cameraGroup.visible=false;
    const target=new THREE.WebGLRenderTarget(width,height,{depthBuffer:true});const pixels=new Uint8Array(width*height*4);
    renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,width,height,pixels);
    let sumX=0,sumY=0,count=0;for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;if(pixels[i]>180&&pixels[i+1]<80&&pixels[i+2]>180){sumX+=x+.5;sumY+=height-y-.5;count++;}}
    for(const [o,v]of hidden)o.visible=v;scene.background=previousBackground;scene.fog=previousFog;effects.cameraGroup.visible=visibleEffects;
    mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();target.dispose();renderer.setRenderTarget(null);render();
    const analytic=projectCameraPoint(cameraLocalPosition(absolutePosition,frame),width,height,camera.fov);
    return {pixels:count,centroid:count?{x:sumX/count,y:sumY/count}:null,analytic,origin:{...origin},originSerial,width,height};
  }
  function readFrameDiagnostic(){
    if(!frame||disposed)throw new Error('sync a pose before measuring');
    const target=new THREE.WebGLRenderTarget(width,height,{depthBuffer:true}),pixels=new Uint8Array(width*height*4);
    renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);renderer.clearDepth();renderer.render(craftScene,craftCamera);
    renderer.readRenderTargetPixels(target,0,0,width,height,pixels);target.dispose();renderer.setRenderTarget(null);render();return {width,height,pixels};
  }
  /** Real solid geometry and sea share the normal depth test in this diagnostic mask. */
  function drawContactDiagnostic(contactPoint){
    if(mode!=='chase')throw new Error('contact diagnostic requires the physical external view');
    const seaMesh=world.group.getObjectByName('world-anchored-ocean-tiles')??world.group.getObjectByName('sierra-ground-tiles');
    const seaMaterial=new THREE.MeshBasicMaterial({color:0x00ffff,side:THREE.DoubleSide,toneMapped:false});
    const solidMaterial=new THREE.MeshBasicMaterial({color:0xff00ff,toneMapped:false});
    const restore=[];for(const child of world.group.children){restore.push(()=>{child.visible=child.userData.diagnosticVisible;delete child.userData.diagnosticVisible;});child.userData.diagnosticVisible=child.visible;child.visible=['supersonic-sea','sierra-ground'].includes(child.name);}
    const oldSeaMaterial=seaMesh.material;seaMesh.material=seaMaterial;
    worldJet.group.traverse(o=>{if(!o.isMesh)return;const material=o.material,visible=o.visible;restore.push(()=>{o.material=material;o.visible=visible;});
      if(o.parent===effects.craftGroup||material.transparent)o.visible=false;else o.material=solidMaterial;});
    const oldCameraEffects=effects.cameraGroup.visible,oldCraftEffects=effects.craftGroup.visible;effects.cameraGroup.visible=effects.craftGroup.visible=false;
    const oldBackground=scene.background,oldFog=scene.fog;scene.background=new THREE.Color(0);scene.fog=null;
    const pixels=readFrameDiagnostic().pixels,projected=projectCameraPoint(cameraLocalPosition(contactPoint,frame),width,height,camera.fov);
    let nearestSolid=Infinity,nearestSea=Infinity,solidPixels=0,seaPixels=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=(y*width+x)*4,solid=pixels[i]>180&&pixels[i+1]<80&&pixels[i+2]>180,seaPixel=pixels[i]<80&&pixels[i+1]>180&&pixels[i+2]>180;
      const d=Math.hypot(x+.5-projected.x,height-y-.5-projected.y);if(solid){solidPixels++;nearestSolid=Math.min(nearestSolid,d);}if(seaPixel){seaPixels++;nearestSea=Math.min(nearestSea,d);}
    }
    for(const undo of restore.reverse())undo();seaMesh.material=oldSeaMaterial;effects.cameraGroup.visible=oldCameraEffects;effects.craftGroup.visible=oldCraftEffects;scene.background=oldBackground;scene.fog=oldFog;seaMaterial.dispose();solidMaterial.dispose();render();
    return {projected,nearestSolid,nearestSea,solidPixels,seaPixels};
  }
  return {sync,resize,snapshot,render,localPosition:p=>plain(cameraLocalPosition(p,frame)),
    setVisibility:value=>change(()=>{view=normalizeVisibility(value);world.setVisibility(view);}),setDisplay:value=>change(()=>{displayMode=value==='fixed'?'fixed':'bank';}),
    setCameraMode:value=>change(()=>{mode=normalizeCameraMode(value);chaseAngles=null;}),resetDisplayRotation:()=>change(()=>{phoneRoll=0;chaseAngles=null;lastInput={...lastInput,displayTwist:0,displayScreenOffset:0};}),
    setGroundPatternStrength(value){if(!disposed&&world.setGroundPatternStrength(value))render();},getPassObjects:world.getPassObjects,drawMarkerDiagnostic,drawContactDiagnostic,readFrameDiagnostic,
    dispose(){if(disposed)return;disposed=true;effects.dispose();world.dispose();disposeTree(worldJet.group);disposeTree(overlayJet.group);renderer.dispose();scene.clear();craftScene.clear();},
  };
}
