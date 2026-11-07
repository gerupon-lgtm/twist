/** Low-priority game cue, not a navigation or aircraft instrument. */
export const NAVIGATION_BURST_MS=70;
export const NAVIGATION_TONE_HZ=880;
export const NAVIGATION_VOLUME=5;

/** Right-positive degrees. Linear gains retain a constant left+right sum. */
export function navigationCue(bearingDeg){
  if(!Number.isFinite(bearingDeg))return null;
  let bearing=((bearingDeg+180)%360+360)%360-180;
  if(bearing===-180)bearing=180;
  const pan=Math.max(-1,Math.min(1,bearing/90));
  return {pan,intervalMs:300+900*Math.abs(bearing)/180,gainLeft:(1-pan)/2,gainRight:(1+pan)/2};
}

/** A warning/vario keeps the whole cycle, including its silent gaps. */
export function navigationBlockReason({active,sound,sfx,enabled,event,cue,varioActive,bearingDeg}){
  if(!active)return 'inactive';
  if(!sound||!sfx||!enabled)return 'disabled';
  if(!Number.isFinite(bearingDeg))return 'no-target';
  if(event)return 'event';
  if(['stall','ground','buffet'].includes(cue))return 'warning';
  if(varioActive)return 'vario';
  return null;
}

export const navigationAllowed=state=>navigationBlockReason(state)===null;
