import { EVENT_FEEDBACK, scaledPattern } from './model.js';
export function createHaptics(vibrate) {
  let armed=false,next=0,cue='',eventUntil=0,eventTimer=null,cueAt=0;
  const send=pattern=>{try {vibrate?.(pattern);}catch{/* Vibration rejection never stops flight. */}};
  return {
    arm(){armed=true;},
    update(model,settings,now){
      if(!armed||!vibrate)return;
      if(!settings.vibration||settings.vibrationScale===0){if(cue||eventUntil)this.stop();return;}
      if(now<eventUntil)return;
      if(eventUntil){clearTimeout(eventTimer);eventUntil=0;cue='';next=0;}
      if(!model.pattern.some(n=>n>0)){if(cue)this.stop();return;}
      const restarted=cue!==model.cue||now>=next;
      if(restarted){
        send(model.pattern);
        // Shared warning rhythms restart together; deliberately different rhythms keep the sound clock.
        const sharedCycle=model.cycle===model.soundPattern.reduce((sum,n)=>sum+n,0);
        if(cue!==model.cue||sharedCycle)cueAt=now;
        cue=model.cue;next=now+model.cycle;
      }
      return {restarted,elapsedMs:now-cueAt};
    },
    event(kind,settings,now){
      const event=EVENT_FEEDBACK[kind];if(!armed||!vibrate||!settings.vibration||!settings.vibrationScale||!event)return;
      if(now<eventUntil&&EVENT_FEEDBACK[cue]?.priority>event.priority)return;
      send(0);send(scaledPattern(event.pattern,settings.vibrationScale));eventUntil=now+event.duration;cue=kind;next=eventUntil;
      clearTimeout(eventTimer);eventTimer=setTimeout(()=>this.stop(),event.duration);
    },
    stop(){clearTimeout(eventTimer);if(armed)send(0);next=0;cue='';eventUntil=0;},
  };
}
