const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
/** Clock/envelope for a separate engine-like PSG accent, never a melody voice. */
export function createSpeedSoundClock(){
  let previousSpeed=null,observedAt=null,measuredAcceleration=0,phase=0,gain=0;
  const cue={enabled:false,hz:0,volume:0,flow:0,acceleration:0,phase:0,reason:'inactive'};
  return {
    observe(speed,seconds){
      if(!Number.isFinite(speed)||!Number.isFinite(seconds))return;
      const dt=observedAt===null?0:seconds-observedAt;
      measuredAcceleration=previousSpeed!==null&&dt>0&&dt<=.3?(speed-previousSpeed)/dt:0;
      previousSpeed=speed;observedAt=seconds;
    },
    advance(model,settings,seconds,blocked=false){
      const reference=model.speedSound?.reference,valid=Number.isFinite(reference)&&reference>0;
      const dt=clamp(seconds,0,.05),flow=valid?clamp(model.speed/reference,0,1):0;
      const supersonic=Number.isFinite(model.supersonic?.mach)&&model.supersonic.mach>=1;
      const permitted=valid&&settings.sound&&settings.sfx&&settings.speedSound===true&&model.speed>1&&!blocked&&!supersonic;
      const targetAcceleration=valid?clamp(measuredAcceleration/(reference*.12),0,1):0;
      cue.acceleration+=(targetAcceleration-cue.acceleration)*(1-Math.exp(-dt/.14));
      gain+=((permitted?1:0)-gain)*(1-Math.exp(-dt/.06));
      phase=(phase+dt*(3+9*flow))%1;
      cue.enabled=Boolean(permitted&&gain>.01);cue.flow=flow;cue.phase=phase;
      cue.hz=valid?100+430*Math.sqrt(flow)+190*cue.acceleration:0;
      const modulation=.65+.35*Math.sin(Math.PI*phase)**2,duck=model.vario?.active ? .45 : 1;
      cue.volume=cue.enabled?clamp(((5+6*flow)*modulation+1.8*cue.acceleration)*gain*duck,0,12):0;
      cue.reason=blocked?'priority':supersonic?'supersonic':!permitted?'disabled':'flow';return cue;
    },
    snapshot:()=>({...cue}),
    reset(){previousSpeed=null;observedAt=null;measuredAcceleration=0;phase=0;gain=0;Object.assign(cue,{enabled:false,hz:0,volume:0,flow:0,acceleration:0,phase:0,reason:'inactive'});},
  };
}
