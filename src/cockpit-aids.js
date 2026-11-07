const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

/** World elevation folds after vertical flight, while the body's control angle can continue. */
export function pitchLadderAngles(pitch=0,range=10) {
  const center=Math.asin(Math.sin((Number.isFinite(pitch)?pitch:0)*Math.PI/180))*180/Math.PI;
  const span=Number.isFinite(range)?clamp(range,5,30):10;
  return Array.from({length:35},(_,i)=>i*5-85).filter(angle=>angle!==0&&Math.abs(angle-center)<=span+1e-8);
}
export function verticalSpeedIndicator(value=0) {
  const speed=Number.isFinite(value)?value:0;
  return {speed,direction:Math.abs(speed)<.15?'level':speed>0?'up':'down',
    length:Math.abs(speed)<.15?0:clamp(Math.abs(speed)/5*46,6,46)};
}
/** A game cue, not a calibrated aircraft instrument. Faster climb means higher, closer beeps. */
export function varioCue(value=0,enabled=true) {
  if(!enabled||!Number.isFinite(value))return {active:false,hz:0,periodMs:1000,onMs:0};
  if(value>=.3) {
    const speed=clamp(value,.3,8),periodMs=clamp(720-speed*75,150,700);
    return {active:true,hz:480+speed*95,periodMs,onMs:Math.min(110,periodMs*.4)};
  }
  if(value<=-2) return {active:true,hz:clamp(170+(value+2)*8,90,170),periodMs:1500,onMs:1150};
  return {active:false,hz:0,periodMs:1000,onMs:0};
}

/** Integrate within one cycle; a changing period must never rebase against absolute time. */
export function advanceVarioPhase(value,elapsedMs,periodMs) {
  const phase=Number.isFinite(value)?value>=0&&value<1?value:((value%1)+1)%1:0;
  const elapsed=Number.isFinite(elapsedMs)?Math.max(0,elapsedMs):0;
  return Number.isFinite(periodMs)&&periodMs>0?(phase+elapsed/periodMs)%1:phase;
}
