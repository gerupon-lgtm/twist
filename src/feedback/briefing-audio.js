// Short preflight map cues. No music, haptics, storage or flight clock.
// The owner supplies readiness and cancellation; the view supplies visible time.
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
export const BRIEFING_AUDIO=freeze({drawSeconds:3.6,maxCueAgeSeconds:.1,maximumVolume:11});
const note=(channel,midi,atMs,durationMs,volume)=>({channel,midi,atMs,durationMs,volume});
const opening=freeze({kind:'opening',durationMs:280,notes:[
  note(0,64,0,75,9),note(0,71,85,75,9),note(0,76,170,110,10),note(1,40,0,130,7),
]});
const complete=freeze({kind:'complete',durationMs:330,notes:[
  note(0,71,0,80,9),note(0,76,90,80,10),note(0,80,180,150,10),note(1,52,0,140,7),
]});

/** Original short SFX motifs, separate from the sixteen-track music catalog. */
export function briefingCue(kind,index=0,total=1){
  if(kind==='opening')return opening;if(kind==='complete')return complete;
  if(kind!=='point'||!Number.isInteger(index)||!Number.isInteger(total)||total<1||total>8||index<0||index>=total)return null;
  const midi=72+Math.round(total===1?0:index*12/(total-1));
  return freeze({kind:'point',index,total,durationMs:70,notes:[note(2,midi,0,70,8)]});
}

/** Apply only inside the guarded private briefing PSG pass, never over another cue. */
export function applyBriefingRegisters(registers,cue,elapsedMs){
  if(!registers||!cue||!Array.isArray(cue.notes)||!Number.isFinite(elapsedMs)||elapsedMs<0)return registers;
  for(const channel of new Set(cue.notes.map(value=>value.channel))){
    const current=cue.notes.find(value=>elapsedMs>=value.atMs&&elapsedMs<value.atMs+value.durationMs);
    registers[8+channel]=0;registers[7]|=1<<channel;
    if(!current)continue;
    const age=elapsedMs-current.atMs,hz=440*2**((current.midi-69)/12),period=Math.max(1,Math.min(4095,Math.round(3579545/2/(16*hz))));
    const envelope=Math.max(0,Math.min(1,age/3,(current.durationMs-age)/15));
    registers[channel*2]=period&255;registers[channel*2+1]=(period>>8)&15;
    registers[8+channel]=Math.round(current.volume*envelope);
    registers[7]=(registers[7]|(1<<(channel+3)))&~(1<<channel);
  }
  return registers;
}

const sessionValid=value=>Number.isSafeInteger(value)&&value>0;
const finiteObservation=value=>Number.isFinite(value.visibleSeconds)&&value.visibleSeconds>=0&&Number.isFinite(value.progress)&&value.progress>=0&&value.progress<=1;

/**
 * Pure one-map consumer. emit/cancel are synchronous owners' callbacks, never
 * clocks, Context construction, haptics, music commands or persistent writes.
 */
export function createBriefingAudioConsumer({emit=()=>{},cancel=()=>{},isReady=()=>false,isAllowed=()=>false}={}){
  let current=null,lastSession=0,lastSnapshot=null;
  const snapshot=record=>record?{session:record.session,origin:record.origin,variant:record.variant,status:record.blocked??(record.complete?'complete':'active'),
    visibleSeconds:record.seconds,emitted:record.emitted,dropped:record.dropped,consumed:record.seen.size}:null;
  function silence(record,reason){
    if(!record||record.blocked)return;
    record.blocked=reason;
    if(record.openingPending){record.seen.add('opening');record.dropped++;record.openingPending=false;}
    if(record.staticPending){record.seen.add('static-complete');record.dropped++;record.staticPending=false;record.complete=true;}
    cancel({session:record.session,reason});
  }
  function deliver(record,key,kind,dueSeconds,seconds,index=0){
    if(record.seen.has(key))return;
    record.seen.add(key);const age=Math.max(0,seconds-dueSeconds);
    if(record.blocked||!isAllowed()||!isReady()||age>BRIEFING_AUDIO.maxCueAgeSeconds){record.dropped++;return;}
    const cue=briefingCue(kind,index,record.total);
    if(!cue){record.dropped++;return;}
    record.emitted++;emit({session:record.session,courseId:record.courseId,key,kind,index,cue,
      visibleSeconds:seconds,dueSeconds,ageSeconds:age,maxAgeSeconds:BRIEFING_AUDIO.maxCueAgeSeconds});
  }
  function advance(signal){
    const record=current;if(!record||signal.session!==record.session)return;
    if(!finiteObservation(signal)||signal.visibleSeconds+1e-7<record.seconds){silence(record,'invalid-clock');return;}
    record.seconds=signal.visibleSeconds;
    if(signal.visible===false)silence(record,'hidden');
    if(!isAllowed())silence(record,'disabled');
    if(record.variant==='pause-map')return;
    if(record.variant==='static-complete'){
      if(record.staticPending&&(isReady()||record.blocked||record.seconds>BRIEFING_AUDIO.maxCueAgeSeconds)){
        record.staticPending=false;deliver(record,'static-complete','complete',0,record.seconds);record.complete=true;
      }
      return;
    }
    // Only the still-current first 100ms may use a fast resume. A slow unlock
    // never brings back the opening; targets are consumed at their own frame.
    if(record.openingPending&&(isReady()||record.blocked||record.seconds>BRIEFING_AUDIO.maxCueAgeSeconds)){
      record.openingPending=false;deliver(record,'opening','opening',0,record.seconds);
    }
    record.points.forEach((point,index)=>{
      const due=point.progress*record.drawSeconds;
      if(record.seconds+1e-7>=due)deliver(record,point.id,point.kind==='exit'?'complete':'point',due,record.seconds,index);
    });
    record.complete=record.seen.has(record.points.at(-1)?.id);
  }
  return {
    handle(signal){
      if(!signal||!sessionValid(signal.session))return;
      if(signal.type==='open'){
        if(signal.session<=lastSession)return;
        if(current){silence(current,'new-map');lastSnapshot=snapshot(current);}
        lastSession=signal.session;
        const points=(Array.isArray(signal.points)?signal.points:[]).filter(point=>point?.kind==='target'||point?.kind==='exit');
        const valid=Array.isArray(signal.points)&&finiteObservation(signal)&&points.length>=2&&points.at(-1)?.kind==='exit'&&points.slice(0,-1).every(point=>point.kind==='target')
          &&points.at(-1).progress===1&&new Set(points.map(point=>point.id)).size===points.length&&points.every((point,index)=>typeof point.id==='string'&&Number.isFinite(point.progress)&&point.progress>0&&point.progress<=1
            &&(!index||point.progress>points[index-1].progress));
        current={session:signal.session,courseId:signal.courseId,origin:signal.origin,points:points.map(point=>({...point})),
          total:points.filter(point=>point.kind==='target').length,drawSeconds:signal.drawSeconds,
          variant:signal.origin==='pause'?'pause-map':signal.reducedMotion?'static-complete':'trace',seconds:0,
          openingPending:signal.origin==='start'&&!signal.reducedMotion,staticPending:signal.origin==='start'&&signal.reducedMotion,seen:new Set(),emitted:0,dropped:0,blocked:null,complete:false};
        if(signal.origin!=='start')silence(current,'pause-map');
        else if(!valid||!signal.reducedMotion&&signal.drawSeconds!==BRIEFING_AUDIO.drawSeconds)silence(current,'invalid-route');
        else if(signal.visible===false)silence(current,'hidden');
        else if(!isAllowed())silence(current,'disabled');
        advance(signal);
      }else if(signal.session===current?.session){
        if(signal.type==='progress')advance(signal);
        else if(signal.type==='visibility'&&signal.visible===false)silence(current,'hidden');
        else if(['close','cancel','dispose'].includes(signal.type)){
          silence(current,signal.reason??signal.type);lastSnapshot=snapshot(current);current=null;
        }
      }
    },
    cancel(reason='cancelled'){
      if(current){silence(current,reason);lastSnapshot=snapshot(current);current=null;}
    },
    snapshot:()=>snapshot(current)??lastSnapshot,
  };
}

