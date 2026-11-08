/**
 * Pure sensor-world quaternion math; world up is +Z, never Three's scene +Y.
 * This estimates a horizontal forearm axis from a phone pose. It does not
 * measure an anatomical arm or identify whether wrist/body motion caused it.
 */
export const WRIST_PROJECTION = Object.freeze({
  method:'sensor-z-up-world-swing-twist-v1',
  minimumHorizontalLength:1e-3,
  minimumProjectionSum:.15,
  lengthTieTolerance:1e-12,
  minimumTwistLength:1e-12,
});
const UP=Object.freeze({x:0,y:0,z:1});
const radians=degrees=>degrees*Math.PI/180;
const degrees=angle=>angle*180/Math.PI;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const length=v=>Math.hypot(v.x,v.y,v.z);
const scale=(v,k)=>({x:v.x*k,y:v.y*k,z:v.z*k});
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const frozen=value=>Object.freeze(value);
function unitQuaternion(value){
  if(!value||!['x','y','z','w'].every(key=>Number.isFinite(value[key])))return null;
  const maximum=Math.max(...['x','y','z','w'].map(key=>Math.abs(value[key])));
  if(!(maximum>0))return null;
  const q={x:value.x/maximum,y:value.y/maximum,z:value.z/maximum,w:value.w/maximum};
  const norm=Math.hypot(q.x,q.y,q.z,q.w);
  return {x:q.x/norm,y:q.y/norm,z:q.z/norm,w:q.w/norm};
}
const inverse=q=>({x:-q.x,y:-q.y,z:-q.z,w:q.w});
function multiply(a,b){
  return {
    x:a.w*b.x+a.x*b.w+a.y*b.z-a.z*b.y,
    y:a.w*b.y-a.x*b.z+a.y*b.w+a.z*b.x,
    z:a.w*b.z+a.x*b.y-a.y*b.x+a.z*b.w,
    w:a.w*b.w-a.x*b.x-a.y*b.y-a.z*b.z,
  };
}
function shortest(q){
  // q and -q are the same rotation. Positive w chooses a shortest rotation;
  // an exact half-turn uses the first nonzero vector component for its tie.
  const first=q.x||q.y||q.z;
  return q.w<0||q.w===0&&first<0?{x:-q.x,y:-q.y,z:-q.z,w:-q.w}:q;
}
function rotate(q,v){
  const vector={x:q.x,y:q.y,z:q.z},twice=scale(cross(vector,v),2);
  return add(v,add(scale(twice,q.w),cross(vector,twice)));
}
const horizontal=v=>({x:v.x,y:v.y,z:0});
const referenceInvalid=reason=>frozen({valid:false,reason,method:WRIST_PROJECTION.method});

/** Calibration freezes both its raw orientation and estimated WORLD axes. */
export function createWristReference({rawQuaternion,screenAngle=0}={}){
  const raw=unitQuaternion(rawQuaternion);
  if(!raw)return referenceInvalid('invalid-reference-quaternion');
  if(!Number.isFinite(screenAngle))return referenceInvalid('invalid-screen-angle');
  const normalizedAngle=((screenAngle+180)%360+360)%360-180;
  const half=-radians(normalizedAngle)/2;
  const display=unitQuaternion(multiply(raw,{x:0,y:0,z:Math.sin(half),w:Math.cos(half)}));
  const top=rotate(display,{x:0,y:1,z:0}),back=rotate(display,{x:0,y:0,z:-1});
  const topHorizontal=horizontal(top),backHorizontal=horizontal(back);
  const topLength=length(topHorizontal),backLength=length(backHorizontal);
  const topUsable=topLength>=WRIST_PROJECTION.minimumHorizontalLength;
  const backUsable=backLength>=WRIST_PROJECTION.minimumHorizontalLength;
  if(!topUsable&&!backUsable)return referenceInvalid('no-horizontal-axis');
  let axis,axisSource,fallbackReason=null,projectionSumLength=null;
  if(topUsable&&backUsable){
    const sum=add(scale(topHorizontal,1/topLength),scale(backHorizontal,1/backLength));
    projectionSumLength=length(sum);
    if(projectionSumLength>=WRIST_PROJECTION.minimumProjectionSum){axis=scale(sum,1/projectionSumLength);axisSource='combined';}
    else{
      const useBack=backLength>=topLength-WRIST_PROJECTION.lengthTieTolerance;
      axis=useBack?scale(backHorizontal,1/backLength):scale(topHorizontal,1/topLength);
      axisSource=useBack?'back':'top';fallbackReason='opposed-horizontal-projections';
    }
  }else{
    axis=topUsable?scale(topHorizontal,1/topLength):scale(backHorizontal,1/backLength);
    axisSource=topUsable?'top':'back';
    fallbackReason=topUsable?'back-near-vertical':'top-near-vertical';
  }
  const pitchAxis=cross(axis,UP),pitchLength=length(pitchAxis);
  if(!(pitchLength>0))return referenceInvalid('invalid-pitch-axis');
  return frozen({
    valid:true,reason:null,method:WRIST_PROJECTION.method,
    rawQuaternion:frozen(raw),axisWorld:frozen(axis),pitchAxisWorld:frozen(scale(pitchAxis,1/pitchLength)),
    screenAngleAtCalibration:normalizedAngle,
    holdInclinationDegrees:degrees(Math.atan2(top.z,topLength)),
    axisSource,fallbackReason,
    projectionLengths:frozen({top:topLength,back:backLength}),projectionSumLength,
  });
}

const invalidReading=reason=>({wrist:0,wristPitch:0,valid:false,reason});

/**
 * Q = qCurrentRaw * inverse(qReferenceRaw) rotates in SENSOR WORLD coordinates.
 * Q = swing * twistA. Wrist pitch is the swing rotation vector projected onto
 * P=A×up, only for the new wrist mode. Legacy angles/displayTwist stay elsewhere.
 * Shortest angles can switch sign at a half-turn: no new folding is invented.
 */
export function readWristAngles(reference,currentRawQuaternion){
  if(reference?.valid!==true)return invalidReading('invalid-reference');
  const rawReference=unitQuaternion(reference.rawQuaternion),current=unitQuaternion(currentRawQuaternion);
  if(!rawReference||!current)return invalidReading('invalid-current-quaternion');
  const axis=reference.axisWorld,pitchAxis=reference.pitchAxisWorld;
  if(!axis||!pitchAxis||![axis.x,axis.y,axis.z,pitchAxis.x,pitchAxis.y,pitchAxis.z].every(Number.isFinite))return invalidReading('invalid-reference-axis');
  if(Math.abs(length(axis)-1)>1e-6||Math.abs(length(pitchAxis)-1)>1e-6||Math.abs(axis.z)>1e-6||Math.abs(pitchAxis.z)>1e-6||Math.abs(dot(axis,pitchAxis))>1e-6)return invalidReading('invalid-reference-axis');
  const relative=shortest(unitQuaternion(multiply(current,inverse(rawReference))));
  const along=dot(relative,axis),twistLength=Math.hypot(along,relative.w);
  if(twistLength<WRIST_PROJECTION.minimumTwistLength)return invalidReading('swing-twist-singularity');
  const twist={x:axis.x*along/twistLength,y:axis.y*along/twistLength,z:axis.z*along/twistLength,w:relative.w/twistLength};
  const swing=shortest(unitQuaternion(multiply(relative,inverse(twist))));
  const swingLength=Math.hypot(swing.x,swing.y,swing.z);
  const swingScale=swingLength>WRIST_PROJECTION.minimumTwistLength?2*Math.atan2(swingLength,clamp(swing.w,0,1))/swingLength:0;
  const wrist=degrees(2*Math.atan2(along,relative.w));
  const wristPitch=degrees(dot(swing,pitchAxis)*swingScale);
  if(!Number.isFinite(wrist)||!Number.isFinite(wristPitch))return invalidReading('nonfinite-projection');
  return {wrist,wristPitch,valid:true,reason:null,nearHalfTurn:Math.abs(wrist)>=179.5};
}

/** Invalid decomposition holds the last finite command; it does not pause. */
export function preserveWristInput(previous,candidate){
  if(candidate?.valid===true&&Number.isFinite(candidate.wrist)&&Number.isFinite(candidate.wristPitch))return {...candidate,held:false};
  return {
    wrist:Number.isFinite(previous?.wrist)?previous.wrist:0,
    wristPitch:Number.isFinite(previous?.wristPitch)?previous.wristPitch:0,
    valid:false,reason:candidate?.reason??'invalid-reading',held:true,
  };
}
