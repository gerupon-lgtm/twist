import { DRUM_ADDR } from '../vendor/scc/engine/psg-drums.js';

const validBpm=value=>Number.isFinite(value)&&value>=30&&value<=300;
const boundary=(time,origin,step)=>origin+Math.max(0,Math.ceil((time-origin-1e-8)/step))*step;

/** An additive, drum-only score. It never resets the melody's Synth or clock. */
export function createAfterburnerLayer(audio){
  let context=null,enabled=true,requested=false,plan=null,serial=0,startCount=0;
  const now=()=>audio.musicClock?.now()??0;
  function cancel(){if(plan)audio.cancelMusicLayer?.(plan.tag);plan=null;}
  function begin(){
    if(!context||!enabled||!requested||plan||!audio.createMusicLayerClock)return;
    const beat=60/context.bpm,startAt=boundary(now()+.03,context.baseStart,beat),tag=`afterburner-${++serial}`;
    plan={tag,clock:audio.createMusicLayerClock(tag),startAt,stopAt:null,index:0,cycle:0,counted:false};
  }
  function pump(){
    if(!plan)return;
    const time=now(),p=plan,c=context;
    if(time>=p.startAt&&!p.counted){p.counted=true;startCount++;}
    if(p.stopAt!==null&&time>=p.stopAt){cancel();return;}
    const horizon=time+.15,beat=60/c.bpm;
    while(plan===p){
      const event=c.events[p.index],at=p.startAt+(p.cycle*c.loopBeats+event.beat)*beat;
      if(at>horizon||(p.stopAt!==null&&at>=p.stopAt))break;
      // Only channel-10 note-ons reach the shared music drum bus. In particular,
      // the score's controller-reset and all-notes-off events are never forwarded.
      if(at>=time-.025&&event.velocity>0){p.clock.setScheduleTime(at);p.clock.write(DRUM_ADDR+event.note,event.velocity);}
      if(++p.index===c.events.length){p.index=0;p.cycle++;}
    }
    p.clock.setScheduleTime(null);
  }
  return {
    attach({track,score,bpm,baseStart}){
      cancel();requested=false;context=null;
      if(!track||!score||!validBpm(track.bpm)||!validBpm(bpm)||!Number.isFinite(baseStart))return;
      // A melodic replacement would contend for the five SCC voices. Reject it
      // locally while retaining the ordinary flight music.
      const notes=score.events.filter(e=>e.type==='noteOn'&&e.velocity>0);
      if(!notes.length||notes.some(e=>e.channel!==9||!Number.isFinite(e.time)||!Number.isInteger(e.note)||e.note<35||e.note>81||!Number.isFinite(e.velocity)))return;
      const volume=track.parts?.['10']?.volume??100,loopBeats=score.duration*track.bpm/60;
      if(!Number.isFinite(loopBeats)||loopBeats<=0)return;
      context={title:track.title,bpm,baseStart,loopBeats,minSeconds:Number.isFinite(track.minSeconds)?Math.max(2,Math.min(10,track.minSeconds)):3,
        events:notes.map(e=>({beat:e.time*track.bpm/60,note:e.note,velocity:Math.max(0,Math.min(127,Math.round(e.velocity*volume/127)))})).sort((a,b)=>a.beat-b.beat)};
    },
    setEnabled(value){enabled=value!==false;if(!enabled){requested=false;cancel();}},
    setRequested(value){
      requested=value===true;
      if(!enabled)return;
      if(requested){if(plan)plan.stopAt=null;else begin();}
      else if(plan&&plan.stopAt===null)plan.stopAt=boundary(Math.max(now()+.03,plan.startAt+context.minSeconds),context.baseStart,60/context.bpm*4);
      pump();
    },
    pump,
    stop(){requested=false;cancel();context=null;},
    reset(){requested=false;cancel();context=null;startCount=0;},
    snapshot(){const time=now();return {requested,enabled,available:Boolean(context),active:Boolean(plan&&time>=plan.startAt&&(plan.stopAt===null||time<plan.stopAt)),
      pending:Boolean(plan&&time<plan.startAt),track:context?.title??null,bpm:context?.bpm??null,startCount,startAt:plan?.startAt??null,
      stopAt:plan?.stopAt??null,minSeconds:context?.minSeconds??null,holdRemaining:plan?Math.max(0,plan.startAt+context.minSeconds-time):0};},
  };
}
