import {Euler,Quaternion,Vector3} from 'three';
import {bodyViewAngles,chaseView,normalizeCameraMode} from '../flight-camera.js';
import {flightDisplayPose} from '../flight-display.js';

const Z=new Vector3(0,0,1),plain=v=>({x:v.x,y:v.y,z:v.z});
export function bodyQuaternion(value){
  if(!value||![value.x,value.y,value.z,value.w].every(Number.isFinite)||Math.hypot(value.x,value.y,value.z,value.w)<1e-10)throw new TypeError('Invalid aircraft orientation');
  return new Quaternion(value.x,value.y,value.z,value.w).normalize();
}

/** Renderer poses only. The returned transforms never alter the physical body. */
export function supersonicCameraFrame(state,{cameraMode='overlay',display='bank',phoneRoll=0,screenOffset=0,chaseAngles=null,shake={x:0,y:0,z:0}}={}){
  const body=bodyQuaternion(state.orientation),bank=state.bank??0,mode=normalizeCameraMode(cameraMode);
  const base=body.clone().multiply(new Quaternion().setFromAxisAngle(Z,bank));
  const pose=flightDisplayPose({display,bank,phoneRoll,screenOffset});
  let eyeOrientation=(display==='fixed'?base:body).clone(),offset=new Vector3(),angles=chaseAngles;
  if(mode==='chase'){
    angles=angles??bodyViewAngles(base);const rig=chaseView(angles,state.position.y,0);
    eyeOrientation=rig.orientation;offset=rig.offset;
  }else if(mode==='cockpit'){
    eyeOrientation=body.clone();offset.set(0,.3,-.8).applyQuaternion(body);
  }
  const worldQuaternion=eyeOrientation.clone().invert();
  if(mode!=='cockpit')worldQuaternion.premultiply(pose.worldBank);
  const cameraQuaternion=pose.camera.clone().multiply(new Quaternion().setFromEuler(new Euler(shake.x,shake.y,shake.z)));
  const viewPosition=new Vector3(state.position.x,state.position.y,state.position.z).add(offset);
  const forward=new Vector3(0,0,-1).applyQuaternion(eyeOrientation);
  return {worldQuaternion,cameraQuaternion,viewPosition,bodyQuaternion:body,baseQuaternion:base,
    craftQuaternion:pose.craft,displayRoll:pose.roll,viewPitch:Math.atan2(forward.y,Math.hypot(forward.x,forward.z)),
    viewAssistance:0,chaseAngles:angles};
}

export function renderRootTranslation(origin,frame,out=new Vector3()){
  return out.set(origin.x-frame.viewPosition.x,origin.y-frame.viewPosition.y,origin.z-frame.viewPosition.z).applyQuaternion(frame.worldQuaternion);
}

/** Exactly inverse(camera)*world*(absolute target - absolute eye). */
export function cameraLocalPosition(position,frame,out=new Vector3()){
  return out.set(position.x-frame.viewPosition.x,position.y-frame.viewPosition.y,position.z-frame.viewPosition.z)
    .applyQuaternion(frame.worldQuaternion).applyQuaternion(frame.cameraQuaternion.clone().invert());
}

export function projectCameraPoint(local,width,height,verticalFov){
  const focal=height/2/Math.tan(verticalFov*Math.PI/360),front=local.z<0;
  return {inFront:front,x:front?width/2+focal*local.x/-local.z:null,y:front?height/2-focal*local.y/-local.z:null,local:plain(local)};
}
