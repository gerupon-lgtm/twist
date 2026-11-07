/** Horizontal turn tuning is independent of the unchanged lift/fall gravity. */
export const FLIGHT_TURN=Object.freeze({defaultGravity:9.8,minGravity:3,maxGravity:15,yawCap:2.5,minSpeed:6});
const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
const finite=value=>Number.isFinite(value)?value:0;
const clean=vector=>({x:finite(vector?.x),y:finite(vector?.y),z:finite(vector?.z)});

export function normalizeTurnGravity(value){
  return Number.isFinite(value)?clamp(value,FLIGHT_TURN.minGravity,FLIGHT_TURN.maxGravity):FLIGHT_TURN.defaultGravity;
}

/** Radians/second, right positive; at rest bank cannot create travel. */
export function flightYawForBank(angleRad,speed,turnGravity=FLIGHT_TURN.defaultGravity){
  if(!Number.isFinite(speed)||speed<=0||!Number.isFinite(angleRad))return 0;
  const angle=clamp(angleRad,-Math.PI/2+1e-8,Math.PI/2-1e-8);
  return clamp(normalizeTurnGravity(turnGravity)*Math.tan(angle)/Math.max(speed,FLIGHT_TURN.minSpeed),
    -FLIGHT_TURN.yawCap,FLIGHT_TURN.yawCap);
}

/** A stationary point has radius zero; straight moving travel has infinite radius. */
export function flightTurnRadius(speed,angleRad,turnGravity=FLIGHT_TURN.defaultGravity){
  if(!Number.isFinite(speed)||speed<=0)return 0;
  const rate=Math.abs(flightYawForBank(angleRad,speed,turnGravity));
  return rate>0?speed/rate:Infinity;
}

/**
 * Apply only the horizontal turn authorized for v26. The real-bank force step
 * owns horizontal magnitude and vertical velocity. The reference velocity
 * supplies heading, including thrust/stall-recovery alignment. The stage uses
 * the natural bank result and adds only the increase over its gravity-3 turn.
 * Inputs are plain xyz; no mutation or force calculation occurs here.
 */
export function applyHorizontalTurn(bankedVelocity,headingVelocity,yawRate,dt){
  const banked=clean(bankedVelocity);
  if(!Number.isFinite(dt)||dt<=0)return banked;
  const magnitude=Math.hypot(banked.x,banked.z);
  if(!magnitude||!Number.isFinite(magnitude))return banked;
  const reference=clean(headingVelocity);
  const base=Math.hypot(reference.x,reference.z)>1e-10?reference:banked;
  const rate=clamp(finite(yawRate),-FLIGHT_TURN.yawCap,FLIGHT_TURN.yawCap);
  const change=rate*dt;
  const heading=Math.atan2(base.x,-base.z)+(Number.isFinite(change)?change:0);
  return {x:Math.sin(heading)*magnitude,y:banked.y,z:-Math.cos(heading)*magnitude};
}
