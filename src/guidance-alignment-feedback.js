export const GUIDANCE_ALIGNMENT_FEEDBACK=Object.freeze({separateDegrees:3,alignedDegrees:2,durationMs:280,cooldownMs:900});

export function createGuidanceAlignmentFeedback(){
  const {separateDegrees,alignedDegrees,durationMs,cooldownMs}=GUIDANCE_ALIGNMENT_FEEDBACK;
  let context=null,wasUsable=false,armed=false,pulseAt=null,lastPulseAt=null,lastNow=0,serial=0;
  function snapshot(){
    const age=pulseAt===null?durationMs:Math.max(0,lastNow-pulseAt),active=pulseAt!==null&&age<durationMs;
    return {active,armed,serial,startedAt:active?pulseAt:null,lastPulseAt,remainingMs:active?durationMs-age:0,progress:active?age/durationMs:0};
  }
  // A pause or a hidden/context-changed pair cannot carry arming or a pulse
  // into its next display. Retain cooldown/serial; resetting is not a new entry.
  function reset(){context=null;wasUsable=false;armed=false;pulseAt=null;return snapshot();}
  function advance({now,phase='running',usable=false,angularErrorDegrees,courseId='',targetId='',camera='overlay'}={}){
    if(!Number.isFinite(now)||now<0||now<lastNow){reset();return snapshot();}
    lastNow=now;if(pulseAt!==null&&now-pulseAt>=durationMs)pulseAt=null;
    if(phase!=='running'||usable!==true||!Number.isFinite(angularErrorDegrees)||angularErrorDegrees<0){reset();return snapshot();}
    const nextContext=JSON.stringify([String(courseId),String(targetId),String(camera)]);
    if(!wasUsable||context!==nextContext){reset();context=nextContext;wasUsable=true;return snapshot();}
    if(angularErrorDegrees>=separateDegrees)armed=true;
    else if(angularErrorDegrees<=alignedDegrees&&armed){
      // An entry inside cooldown is consumed now, never queued for later play.
      armed=false;
      if(lastPulseAt===null||now-lastPulseAt>=cooldownMs){pulseAt=lastPulseAt=now;serial++;}
    }
    return snapshot();
  }
  return {advance,reset,snapshot};
}
