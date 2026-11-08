import {FLIGHT_TURN,flightTurnRadius} from './flight-turn.js';
const DEG = Math.PI / 180;
const clamp = (n,low,high) => Math.min(high,Math.max(low,n));
const validVector = v => v && [v.x,v.y,v.z].every(Number.isFinite);
const wrap = degrees => ((degrees+180)%360+360)%360-180;
const normalized = v => {
  if (!validVector(v)) return null;
  const scale=Math.max(Math.abs(v.x),Math.abs(v.y),Math.abs(v.z));
  if (!scale) return null;
  const x=v.x/scale,y=v.y/scale,z=v.z/scale,length=Math.hypot(x,y,z);
  return {x:x/length,y:y/length,z:z/length};
};

/** Relative angle in degrees; x is a pixel position within the entire heading tape. */
export function headingTargetCue(relativeBearingDegrees,options={}) {
  if (!options || typeof options!=='object') return null;
  const {spanDegrees=20,width=180}=options;
  if (!Number.isFinite(relativeBearingDegrees) || !Number.isFinite(spanDegrees) || spanDegrees<=0 || spanDegrees>180
    || !Number.isFinite(width) || width<=0) return null;
  const wrapped=wrap(relativeBearingDegrees);
  const angleDegrees=wrapped===-180?180:wrapped;
  const inside=Math.abs(angleDegrees)<=spanDegrees;
  return {inside,x:width/2+clamp(angleDegrees/spanDegrees,-1,1)*width/2,
    side:inside?null:angleDegrees<0?'left':'right',angleDegrees};
}

/**
 * Camera-relative vector (+X right, +Y up, -Z ahead). This only finds the edge;
 * caller decides visibility using the renderer's projection/FOV. It deliberately
 * knows nothing about the central HUD's smaller free rectangle.
 */
export function trueScreenEdge(targetCamera,width,height,margin=24) {
  if (!validVector(targetCamera) || ![width,height,margin].every(Number.isFinite)
    || width<=0 || height<=0 || margin<0 || margin>=Math.min(width,height)/2) return null;
  if (!normalized(targetCamera)) return null;
  const behind=targetCamera.z>0;
  // Behind is shown like the navigation compass: a horizontal ground-plane
  // bearing, with straight behind pointing down. Height is a separate ▲/▼ cue.
  const dxInput=targetCamera.x,dyInput=behind?targetCamera.z:-targetCamera.y;
  let dx=dxInput,dy=dyInput;
  const scale=Math.max(Math.abs(dx),Math.abs(dy));
  if (!scale) return null;
  dx/=scale;dy/=scale;
  const reach=Math.min(dx?((width/2-margin)/Math.abs(dx)):Infinity,
    dy?((height/2-margin)/Math.abs(dy)):Infinity);
  return {x:clamp(width/2+dx*reach,margin,width-margin),
    y:clamp(height/2+dy*reach,margin,height-margin),
    rotation:(Math.atan2(dx,-dy)/DEG+360)%360,behind};
}

function bodyForward(state) {
  if (state.orientation != null) {
    const q=state.orientation;
    if (![q.x,q.y,q.z,q.w].every(Number.isFinite)) return null;
    const scale=Math.max(Math.abs(q.x),Math.abs(q.y),Math.abs(q.z),Math.abs(q.w));
    if (!scale) return null;
    const length=Math.hypot(q.x/scale,q.y/scale,q.z/scale,q.w/scale);
    const x=q.x/scale/length,y=q.y/scale/length,z=q.z/scale/length,w=q.w/scale/length;
    return {x:-2*(x*z+w*y),y:2*(w*x-y*z),z:2*(x*x+y*y)-1};
  }
  const heading=state.heading??0,pitch=state.pitch??0;
  if (![heading,pitch].every(Number.isFinite)) return null;
  return {x:Math.sin(heading)*Math.cos(pitch),y:Math.sin(pitch),z:-Math.cos(heading)*Math.cos(pitch)};
}

/**
 * Display advice only: world xyz unit direction, radians in existing state,
 * degrees in named return values/options. No input or force is changed.
 * The caller owns smoothing and uses direction just like the flightpath marker.
 */
export function computeDirectionGuidance(state,options={}) {
  if (!options || typeof options!=='object') return null;
  const {maxPitch=15,maxBank=40,turnGravity=state?.turnGravity??FLIGHT_TURN.defaultGravity,turnState=null}=options;
  if (!state || !validVector(state.position) || !validVector(state.targetPosition)
    || ![maxPitch,maxBank,turnGravity].every(Number.isFinite) || maxPitch<=0 || maxPitch>=90 || maxBank<=0 || maxBank>=90
    || (state.velocity!=null && !validVector(state.velocity))
    || ['bank','angleOfAttack','speed','throttle'].some(k=>state[k]!=null && !Number.isFinite(state[k]))
    || (turnState!=null && (typeof turnState!=='object' || !['target','go-around'].includes(turnState.mode)
      || !Number.isFinite(turnState.yawDegrees) || (turnState.climbDegrees!=null && !Number.isFinite(turnState.climbDegrees))))) return null;
  const relative={x:state.targetPosition.x-state.position.x,y:state.targetPosition.y-state.position.y,
    z:state.targetPosition.z-state.position.z};
  const target=normalized(relative);
  if (!target) return null;
  const distance=Math.hypot(relative.x,relative.y,relative.z);
  const actualSpeed=state.velocity?Math.hypot(state.velocity.x,state.velocity.y,state.velocity.z):state.speed??0;
  if (!Number.isFinite(actualSpeed) || actualSpeed<0 || !Number.isFinite(distance)) return null;
  const forward=bodyForward(state);
  const travel=(actualSpeed>.05 && state.velocity?normalized(state.velocity):forward);
  if (!travel) return null;
  const horizontalSpeed=Math.hypot(travel.x,travel.z);
  const heading=horizontalSpeed>1e-8?Math.atan2(travel.x,-travel.z):
    forward?Math.atan2(forward.x,-forward.z):0;
  const currentClimb=Math.atan2(travel.y,horizontalSpeed)/DEG;
  const targetHeading=Math.hypot(target.x,target.z)>1e-8?Math.atan2(target.x,-target.z):heading;
  let bearing=wrap((targetHeading-heading)/DEG);
  // Near the exact rear there are two equally useful turns. Hold existing bank
  // sign, or choose right, so sub-pixel input noise does not reverse the cue.
  if (Math.abs(bearing)>=175) bearing=(Math.abs(state.bank??0)>3*DEG?Math.sign(state.bank):1)*Math.abs(bearing);
  const turnSide=bearing<0?-1:1;
  const radius=flightTurnRadius(actualSpeed,maxBank*DEG,turnGravity);
  if (!Number.isFinite(radius)) return null;
  // A line from a target inside the turn circle has no tangent. Turning toward
  // it at the same radius would orbit forever; initially lead away, then join.
  const horizontalDistance=Math.hypot(relative.x,relative.z);
  // Guidance aims to enter the existing collection sphere, not hit a point.
  // A reachable sphere must not trigger a last-second turn away from it.
  const targetRadius=Number.isFinite(state.targetRadius)&&state.targetRadius>0?state.targetRadius:0;
  const captureRadius=.8*Math.sqrt(Math.max(0,targetRadius*targetRadius-relative.y*relative.y));
  const side=radius*Math.sin(Math.abs(bearing)*DEG);
  const discriminant=side*side-2*radius*captureRadius+captureRadius*captureRadius;
  const tangentThreshold=discriminant>0?side+Math.sqrt(discriminant):0;
  const nearThreshold=discriminant>0?Math.max(0,side-Math.sqrt(discriminant)):0;
  const nearReachable=captureRadius>0&&horizontalDistance<=nearThreshold+.1;
  const insideTurnCircle=!nearReachable&&horizontalDistance<tangentThreshold-.1;
  const turnCircleRatio=!nearReachable&&tangentThreshold>1e-6?horizontalDistance/tangentThreshold:null;
  let rawMode=insideTurnCircle || Math.abs(bearing)>90?'go-around':'target';
  let rawYawErrorDegrees=rawMode==='go-around'?(insideTurnCircle?-turnSide:turnSide)*15:clamp(bearing,-15,15);
  // Caller may hold a maneuver across a noisy boundary and slew its yaw toward
  // the next maneuver. Only display advice changes; recovery always wins below.
  let mode=turnState?.mode??rawMode;
  let yaw=turnState?clamp(turnState.yawDegrees,-15,15):rawYawErrorDegrees;
  const bank=Math.min(Math.abs(state.bank??0),maxBank*DEG);
  // Existing lift law: L/g=(v/10)^2*(1+4.5*alpha). Solve for alpha to
  // support level flight at the current speed and bank, with a 3° stall margin.
  const rawTrim=Math.max(0,((10/Math.max(actualSpeed,.01))**2/Math.cos(bank)-1)/4.5)/DEG;
  const trimDegrees=Math.min(rawTrim,17);
  const engineOff=state.throttle===0;
  const maxClimbDegrees=Math.min(engineOff?0:10,clamp(maxPitch-trimDegrees,-Math.min(10,maxPitch),10));
  const minClimbDegrees=-Math.min(10,maxPitch);
  const attackDegrees=(state.angleOfAttack??0)/DEG;
  let desired=mode==='go-around'?0:Math.atan2(relative.y,Math.hypot(relative.x,relative.z))/DEG;
  // Critical recovery still overrides guidance immediately. Merely crossing a
  // normal climb limit returns toward that same limit, without a level-flight
  // discontinuity at the boundary.
  const criticalRecovery=engineOff || rawTrim>=17 || Math.abs(attackDegrees)>=17 || maxClimbDegrees<0;
  const recovering=criticalRecovery || currentClimb<minClimbDegrees || currentClimb>maxClimbDegrees;
  // The ordinary climb envelope limits vertical advice. Cancelling its turn
  // would make an otherwise reachable rising corner unreachable. Only critical
  // recovery cancels horizontal guidance immediately.
  if (recovering) {
    mode='recover';
    if (criticalRecovery) {
      yaw=0;rawMode='recover';rawYawErrorDegrees=0;
      desired=Math.min(desired,0,maxClimbDegrees);
    }
    if (attackDegrees>17) desired=Math.min(desired,currentClimb-Math.min(10,attackDegrees-17+2));
    if (attackDegrees < -17) desired=Math.max(desired,currentClimb+Math.min(10,-attackDegrees-17+2));
  }
  desired=clamp(desired,minClimbDegrees,maxClimbDegrees);
  // If the aircraft is already outside the safe global range, a ten-degree
  // step returns toward it. Only recover mode can temporarily remain outside.
  const climbStep=clamp(desired-currentClimb,-10,10);
  const positiveMargin=Math.max(0,17-attackDegrees),negativeMargin=Math.max(0,17+attackDegrees);
  let commandedClimbDegrees=currentClimb+(climbStep>0?Math.min(climbStep,positiveMargin):
    Math.max(climbStep,-negativeMargin));
  // A normal target/maneuver transition may finish its bounded display slew;
  // it must still fit today's climb, incidence and ten-degree step limits.
  if (!recovering && turnState?.climbDegrees!=null) {
    const low=Math.max(minClimbDegrees,currentClimb-10,currentClimb-negativeMargin);
    const high=Math.min(maxClimbDegrees,currentClimb+10,currentClimb+positiveMargin);
    commandedClimbDegrees=clamp(turnState.climbDegrees,low,high);
  }
  const commandedHeading=heading+yaw*DEG;
  const pitch=commandedClimbDegrees*DEG;
  const direction={x:Math.sin(commandedHeading)*Math.cos(pitch),y:Math.sin(pitch),
    z:-Math.cos(commandedHeading)*Math.cos(pitch)};
  const angularErrorDegrees=Math.acos(clamp(travel.x*direction.x+travel.y*direction.y+travel.z*direction.z,-1,1))/DEG;
  return {direction,mode,rawMode,rawYawErrorDegrees,criticalRecovery,aligned:actualSpeed>.05 && angularErrorDegrees<=2,
    yawErrorDegrees:yaw,climbErrorDegrees:commandedClimbDegrees-currentClimb,angularErrorDegrees,
    targetBearingDegrees:bearing,commandedYawDegrees:wrap(commandedHeading/DEG),
    commandedClimbDegrees,maxClimbDegrees,minClimbDegrees,trimDegrees,
    stallMarginDegrees:17-Math.abs(attackDegrees),insideTurnCircle,turnCircleRatio,turnRadius:radius,distance};
}
