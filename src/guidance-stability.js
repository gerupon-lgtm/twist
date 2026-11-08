const clamp=(n,low,high)=>Math.min(high,Math.max(low,n));
/** Display-only hysteresis. Final mode/yaw is fed back into pure guidance math. */
export function advanceGuidanceTurn(raw,previous,{now=0,dt=0,targetChanged=false}={}){
  const clock=Number.isFinite(now)?now:0;
  const rawMode=raw?.rawMode??raw?.mode;
  const rawYaw=clamp(raw?.rawYawErrorDegrees??raw?.yawErrorDegrees??0,-15,15);
  const sign=rawYaw<0?-1:1;
  const seconds=Number.isFinite(dt)?clamp(dt,0,.05):0;
  const requestedClimb=raw?.commandedClimbDegrees;
  const previousClimb=previous?.climbDegrees;
  const climbDegrees=Number.isFinite(requestedClimb)?
    (Number.isFinite(previousClimb)&&rawMode!=='recover'?
      previousClimb+clamp(requestedClimb-previousClimb,-150*seconds,150*seconds):requestedClimb):undefined;
  if(rawMode==='recover')return {mode:'recover',yawDegrees:0,climbDegrees,turnSign:previous?.turnSign??sign,changedAt:clock};
  if(!previous)return {mode:rawMode==='go-around'?'go-around':'target',yawDegrees:rawYaw,climbDegrees,turnSign:sign,changedAt:clock};
  const ratio=Number.isFinite(raw?.turnCircleRatio)?raw.turnCircleRatio:null;
  const bearing=Number.isFinite(raw?.targetBearingDegrees)?raw.targetBearingDegrees:0;
  let mode=previous.mode==='go-around'?'go-around':'target',changedAt=previous.changedAt;
  let turnSign=previous.turnSign??sign;
  const mayChange=clock-changedAt>=600;
  if(targetChanged||previous.mode==='recover'){
    mode=rawMode==='go-around'?'go-around':'target';changedAt=clock;turnSign=sign;
  }else if(mode==='target'&&mayChange&&((ratio!==null&&ratio<.9)||Math.abs(bearing)>95)){
    mode='go-around';changedAt=clock;turnSign=sign;
  }else if(mode==='go-around'&&mayChange&&(ratio===null||ratio>1.1)&&Math.abs(bearing)<85){
    mode='target';changedAt=clock;
  }
  const desired=mode==='go-around'?turnSign*15:clamp(bearing,-15,15);
  const before=Number.isFinite(previous.yawDegrees)?previous.yawDegrees:0;
  const yawDegrees=before+Math.sign(desired-before)*Math.min(Math.abs(desired-before),150*seconds);
  return {mode,yawDegrees:clamp(yawDegrees,-15,15),climbDegrees,turnSign,changedAt};
}
