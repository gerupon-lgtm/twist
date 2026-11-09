const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
export const SONIC_TRANSITION=Object.freeze({duration:275,pattern:Object.freeze([150,35,90])});
export const sonicWarning=cue=>['ground','stall','buffet'].includes(cue);

/** Separate speed curve, leaving the ordinary 0..45 model byte-for-byte intact. */
export function supersonicFeedback(state,base){
  const speed=clamp(state.speed,0,680),wind=clamp(speed/(state.supersonic?.presentationReferenceSpeed??680),0,1);
  return {...base,speed,wind,engineHz:base.engineHz+wind*80,
    supersonic:{mach:Number.isFinite(state.supersonic?.mach)?state.supersonic.mach:speed/340}};
}
export function validSonicTransition(event){
  return event?.type==='sonic-transition'&&['up','down'].includes(event.direction)
    &&Number.isInteger(event.serial??event.id)&&(event.serial??event.id)>=0
    &&Number.isFinite(event.atSeconds)&&event.atSeconds>=0&&Number.isFinite(event.mach)&&event.mach>=0
    &&(Number.isFinite(event.attemptId)||typeof event.attemptId==='string'&&event.attemptId.length>0);
}

/** Consume before checking mute/pause/priority. No deferred event queue exists. */
export function createSonicEventConsumer(){
  let attempt=null,serial=-1,consumed=0;
  return {
    consume(state){
      if(!state?.supersonic)return [];
      const next=state.supersonic.attemptId??state.supersonic.events?.[0]?.attemptId;
      if(next===undefined||next===null)return [];
      if(typeof next==='number'&&typeof attempt==='number'&&next<attempt)return [];
      if(next!==attempt){attempt=next;serial=-1;}
      const fresh=[];
      for(const event of state.supersonic.events??[]){
        if(!validSonicTransition(event)||event.attemptId!==attempt||(event.serial??event.id)<=serial)continue;
        serial=event.serial??event.id;consumed++;fresh.push({...event});
      }
      return fresh;
    },
    reset(){attempt=null;serial=-1;consumed=0;},
    snapshot:()=>({attemptId:attempt,lastSerial:serial,consumed}),
  };
}

/** A short shared-PSG burst. The caller excludes all warning/event priorities. */
export function applySonicRegisters(regs,event,elapsedMs){
  if(!event||!['up','down'].includes(event.direction)||!Number.isFinite(elapsedMs)||elapsedMs<0||elapsedMs>=SONIC_TRANSITION.duration)return regs;
  const t=elapsedMs/SONIC_TRANSITION.duration,attack=Math.min(1,elapsedMs/6),envelope=attack*(1-t);
  const hz=event.direction==='up'?135-75*t:95+45*t,period=Math.round(3579545/2/(16*hz));
  regs[2]=period&255;regs[3]=(period>>8)&15;regs[9]=Math.round(15*envelope);
  regs[6]=Math.round(event.direction==='up'?17-12*t:6+14*t);
  regs[7]&=~((1<<1)|(1<<4));
  return regs;
}
