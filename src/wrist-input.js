/** Pure new-mode normalization/selection; no storage IO. */
export const WRIST_INPUT_FIELDS=Object.freeze({
  steerWristDeadzone:Object.freeze({initial:3,min:0,max:8}),
  maxSteerWrist:Object.freeze({initial:25,min:5,max:40}),
});
export const WRIST_SENSITIVITY_PRESETS=Object.freeze({calm:30,normal:25,agile:18});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function normalizeWristInputSettings(value){
  const result=Object.fromEntries(Object.entries(WRIST_INPUT_FIELDS).map(([key,field])=>[key,Number.isFinite(value?.[key])?clamp(value[key],field.min,field.max):field.initial]));
  result.steerWristDeadzone=Math.min(result.steerWristDeadzone,result.maxSteerWrist-1);
  result.steerCurve=Number.isFinite(value?.steerCurve)?clamp(value.steerCurve,1,2):1;
  return result;
}
/** Same gain/deadzone/curve convention as normal flightRates, new wrist axis only. */
export function wristSteeringDemand(angle,settings,sensitivity=1){
  if(!Number.isFinite(angle))return 0;
  const config=normalizeWristInputSettings(settings),gain=Number.isFinite(sensitivity)?Math.max(0,sensitivity):1;
  const linear=Math.sign(angle)*clamp((Math.abs(angle)-config.steerWristDeadzone)/(config.maxSteerWrist-config.steerWristDeadzone)*gain,0,1);
  return Math.sign(linear)*Math.abs(linear)**config.steerCurve;
}
/** Valid URL > explicit saved choice > legacy tilt default. Reading never writes. */
export function resolveSteeringChoice({urlMode,storedMode}={}){
  const valid=value=>['tilt','twist','wrist'].includes(value);
  return Object.freeze(valid(urlMode)?{mode:urlMode,source:'url',persist:false}:valid(storedMode)?{mode:storedMode,source:'saved',persist:false}:{mode:'tilt',source:'default',persist:false});
}

// Integration helpers. Loading preferences is read-only; no migration is run.
export const STEERING_PREFERENCE_KEY='twist.steering.v1';
export function readSteeringChoice(storage,urlMode){
  let raw;try{raw=JSON.parse(storage?.getItem(STEERING_PREFERENCE_KEY)??'null');}catch{}
  return resolveSteeringChoice({urlMode,storedMode:typeof raw==='string'?raw:raw?.mode});
}
export function saveSteeringChoice(storage,mode){
  if(!['tilt','twist','wrist'].includes(mode))return false;
  try{if(!storage)return false;storage.setItem(STEERING_PREFERENCE_KEY,JSON.stringify({version:1,mode}));return true;}catch{return false;}
}
export const steeringMaximumKey=mode=>mode==='wrist'?'maxSteerWrist':mode==='twist'?'maxSteerTwist':'maxSteerTilt';
const modeFields=Object.freeze({tilt:['maxSteerTilt','steerTiltDeadzone'],twist:['maxSteerTwist','steerTwistDeadzone'],wrist:['maxSteerWrist','steerWristDeadzone']});
export const inactiveSteeringSettings=mode=>{const selected=Object.hasOwn(modeFields,mode)?mode:'tilt';return Object.entries(modeFields).filter(([id])=>id!==selected).flatMap(([,keys])=>keys);};

/** Wrist mode alone replaces pitch and steering. Display twist stays legacy. */
export function preserveWristPose(previous,candidate){
  const valid=candidate?.valid===true&&['wrist','wristPitch','twist'].every(key=>Number.isFinite(candidate[key]));
  if(valid)return {...candidate,pitch:candidate.wristPitch,held:false};
  return {pitch:Number.isFinite(previous?.wristPitch)?previous.wristPitch:0,
    wristPitch:Number.isFinite(previous?.wristPitch)?previous.wristPitch:0,wrist:Number.isFinite(previous?.wrist)?previous.wrist:0,
    steer:Number.isFinite(previous?.steer)?previous.steer:0,twist:Number.isFinite(previous?.twist)?previous.twist:0,
    valid:false,held:true,reason:candidate?.reason??'invalid-wrist-pose'};
}

/** Per-attempt rows keep each recalibration's own relative-angle range. */
export function createWristRecord(){
  let rows=[],current=null;
  const snapshot=()=>({method:'estimated-horizontal-forearm',calibrations:structuredClone(rows),
    calibration:current?structuredClone(current.calibration):null,source:current?.source??null,
    angleRangeDegrees:current?.samples?current.maximum-current.minimum:0,samples:current?.samples??0,heldSamples:current?.heldSamples??0});
  return {
    calibrate(reference,source){current={calibration:structuredClone(reference),source:source==='sensor'?'sensor':'virtual-practice',samples:0,heldSamples:0,minimum:0,maximum:0,angleRangeDegrees:0};rows.push(current);},
    add(angles){if(!current)return;if(angles?.held){current.heldSamples++;return;}if(angles?.valid===false||!Number.isFinite(angles?.wrist))return;
      if(current.samples===0)current.minimum=current.maximum=angles.wrist;
      else{current.minimum=Math.min(current.minimum,angles.wrist);current.maximum=Math.max(current.maximum,angles.wrist);}
      current.samples++;current.angleRangeDegrees=current.maximum-current.minimum;},
    reset(){rows=[];current=null;},snapshot,
  };
}
