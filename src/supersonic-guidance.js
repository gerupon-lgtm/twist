const DEG=180/Math.PI;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=v=>((v+180)%360+360)%360-180;
const point=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);

/** Advice only. Plan against the gate plane and the currently available shared-G budget. */
export function computeSupersonicGuidance(state,{turnState=null}={}){
 if(!state?.supersonic||!point(state.position)||!point(state.velocity)||!point(state.targetPosition))return null;
 const gate=state.targetGate??state.supersonic.activeGate;
 if(!gate||!point(gate.center)||!point(gate.normal)||!Number.isFinite(gate.radius)||gate.radius<=0)return null;
 const settings=state.supersonic.effectiveSettings??{},g=9.8;
 const v=state.velocity,speed=Math.hypot(v.x,v.y,v.z),horizontalSpeed=Math.hypot(v.x,v.z);
 const heading=horizontalSpeed>1e-8?Math.atan2(v.x,-v.z):state.heading??0;
 const climb=Math.atan2(v.y,horizontalSpeed)*DEG;
 const maxG=Number.isFinite(settings.maxG)?settings.maxG:9;
 const available=Number.isFinite(state.supersonic.availableNormalAcceleration)?Math.max(0,state.supersonic.availableNormalAcceleration):maxG*g;
 const support=g*Math.abs(Math.cos(climb/DEG));
 const lateral=Math.sqrt(Math.max(0,available*available-support*support));
 const radius=lateral>1e-8?horizontalSpeed*horizontalSpeed/lateral:Number.MAX_VALUE;
 const relative={x:gate.center.x-state.position.x,y:gate.center.y-state.position.y,z:gate.center.z-state.position.z};
 const distance=Math.hypot(relative.x,relative.y,relative.z);
 const signed=-relative.x*gate.normal.x-relative.y*gate.normal.y-relative.z*gate.normal.z;
 const crossTrack=Math.hypot(relative.x+signed*gate.normal.x,relative.y+signed*gate.normal.y,relative.z+signed*gate.normal.z);
 const normalSpeed=v.x*gate.normal.x+v.y*gate.normal.y+v.z*gate.normal.z;
 const captureTimeSeconds=Math.abs(normalSpeed)>1e-8?-signed/normalSpeed:-1;
 const crossingOffset=captureTimeSeconds>=0?{
  x:-relative.x+v.x*captureTimeSeconds,y:-relative.y+v.y*captureTimeSeconds,z:-relative.z+v.z*captureTimeSeconds}:null;
 const crossingNormal=crossingOffset?crossingOffset.x*gate.normal.x+crossingOffset.y*gate.normal.y+crossingOffset.z*gate.normal.z:0;
 const captureDistance=crossingOffset?Math.hypot(crossingOffset.x-crossingNormal*gate.normal.x,crossingOffset.y-crossingNormal*gate.normal.y,crossingOffset.z-crossingNormal*gate.normal.z):Infinity;
 // The real objective is its aperture, not a zero-radius point at its center.
 // A velocity ray already crossing that aperture needs no last-moment U-turn.
 const captureCorridor=captureTimeSeconds>=0&&captureDistance<=gate.radius+1e-9;
 const side=signed<0?-1:1;
 // When too far sideways to enter the aperture, regain an approach outside the
 // current turn circle. Once inbound, keep aiming at the gate: reactivating
 // the outward point on cross-track alone pulls a returning craft into orbit.
 // This is a staging point, not a larger capture sphere.
 const movingAway=(v.x*gate.normal.x+v.y*gate.normal.y+v.z*gate.normal.z)*side>0;
 const staging=!captureCorridor&&movingAway&&crossTrack>gate.radius*.7&&Math.abs(signed)<Math.min(12000,Math.max(2*radius,4*gate.radius));
 const lead=staging?Math.min(12000,Math.max(3*gate.radius,1.5*radius)):0;
 const aim={x:gate.center.x+side*gate.normal.x*lead,y:gate.center.y+side*gate.normal.y*lead,z:gate.center.z+side*gate.normal.z*lead};
 const dx=aim.x-state.position.x,dz=aim.z-state.position.z;
 const desiredHeading=Math.hypot(dx,dz)>1e-8?Math.atan2(dx,-dz):heading;
 let bearing=wrap((desiredHeading-heading)*DEG);
 if(Math.abs(bearing)>=175)bearing=(Math.abs(state.bank??0)>.05?Math.sign(state.bank):1)*Math.abs(bearing);
 const horizontalDistance=Math.hypot(dx,dz),threshold=2*radius*Math.sin(Math.abs(bearing)/DEG);
 const insideTurnCircle=Number.isFinite(threshold)&&horizontalDistance<threshold-gate.radius;
 const rawMode=!captureCorridor&&(staging||insideTurnCircle||Math.abs(bearing)>90)?'go-around':'target';
 const rawYawErrorDegrees=captureCorridor?0:clamp(insideTurnCircle?-Math.sign(bearing||1)*15:bearing,-15,15);
 const criticalRecovery=speed<60||Math.abs(state.angleOfAttack??0)>20/DEG||available<support;
 let mode=criticalRecovery?'recover':captureCorridor?'target':turnState?.mode??rawMode;
 let yaw=criticalRecovery||captureCorridor?0:clamp(turnState?.yawDegrees??rawYawErrorDegrees,-15,15);
 const maximumPitch=15*(Number.isFinite(settings.pitchGain)?settings.pitchGain:.35);
 const minClimbDegrees=-maximumPitch,maxClimbDegrees=state.throttle===0?0:maximumPitch;
 const desiredClimb=criticalRecovery?Math.min(0,maxClimbDegrees):captureCorridor?clamp(climb,minClimbDegrees,maxClimbDegrees):clamp(Math.atan2(aim.y-state.position.y,horizontalDistance)*DEG,minClimbDegrees,maxClimbDegrees);
 let commandedClimbDegrees=climb+clamp(desiredClimb-climb,-10,10);
 if(!criticalRecovery&&!captureCorridor&&turnState?.climbDegrees!=null)commandedClimbDegrees=clamp(turnState.climbDegrees,Math.max(minClimbDegrees,climb-10),Math.min(maxClimbDegrees,climb+10));
 if(climb<minClimbDegrees||climb>maxClimbDegrees)mode='recover';
 const commandedHeading=heading+yaw/DEG,pitch=commandedClimbDegrees/DEG;
 const direction={x:Math.sin(commandedHeading)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(commandedHeading)*Math.cos(pitch)};
 const travel=speed>1e-8?{x:v.x/speed,y:v.y/speed,z:v.z/speed}:{x:Math.sin(heading),y:0,z:-Math.cos(heading)};
 const angularErrorDegrees=Math.acos(clamp(travel.x*direction.x+travel.y*direction.y+travel.z*direction.z,-1,1))*DEG;
 return {direction,mode,rawMode,rawYawErrorDegrees,criticalRecovery,aligned:speed>.05&&angularErrorDegrees<=2,
  yawErrorDegrees:yaw,climbErrorDegrees:commandedClimbDegrees-climb,angularErrorDegrees,targetBearingDegrees:bearing,
  commandedYawDegrees:wrap(commandedHeading*DEG),commandedClimbDegrees,minClimbDegrees,maxClimbDegrees,trimDegrees:0,
  stallMarginDegrees:20-Math.abs(state.angleOfAttack??0)*DEG,insideTurnCircle,
  turnCircleRatio:captureCorridor?null:threshold>0?horizontalDistance/threshold:null,turnRadius:radius,distance,
  captureCorridor,captureTimeSeconds:captureTimeSeconds>=0?captureTimeSeconds:null,captureDistance:Number.isFinite(captureDistance)?captureDistance:null,
  approach:{point:aim,staging,signedDistance:signed,crossTrack,gateRadius:gate.radius},availableNormalAcceleration:available};
}
