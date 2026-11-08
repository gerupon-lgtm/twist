import workletUrl from './audio-worklet.js?worker&url';
import {validSonicTransition} from './supersonic-model.js';
import {COUNTDOWN_AUDIO,validCountdownSession,validCountdownCue} from './countdown-audio.js';
import {BRIEFING_AUDIO,briefingCue} from './briefing-audio.js';

/** AudioContext construction/resume happens only through an explicit start click. */
export function createGameAudio(){
  let context=null,node=null,pending=null,poll=null,status='idle',lastState=null,wanted=false,eventTimer=null,generation=0,disposed=false;
  let load=0,maxLoad=0,peak=0,musicActive=false,varioActive=false;
  let musicSchedule=null,fmAcknowledged=null,musicSession=0,musicSequence=0;
  let lastEvent=null;
  let navigationAcknowledged=null,afterburnerAcknowledged=null,passbyAcknowledged=null,sonicAcknowledged=null;
  let musicPending=[],musicFlush=false,scheduleTime=null;
  let countdownSession=null,countdownAcknowledged=null,countdownPreparation=null,countdownEnd=null;
  let briefingSession=null,briefingAcknowledged=null,lastBriefingSession=0;
  const briefingVisible=()=>typeof document==='undefined'||!document.hidden;
  const briefingNeedsSound=()=>Boolean(briefingSession&&(briefingSession.needsFuture||briefingSession.sounding));
  const idle=()=>!wanted&&!countdownSession&&!briefingNeedsSound();
  const cancelledMusicTags=new Set();
  const post=m=>node?.port.postMessage(m);
  async function unlock(){
    if(disposed)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio){status='unsupported';return;}
    try {
      if(!context||context.state==='closed')context=new Audio();
      if(!pending)pending=(async()=>{
        await context.resume();
        if(disposed)return;
        if(!node){
          await context.audioWorklet.addModule(workletUrl);
          if(disposed)return;
          node=new AudioWorkletNode(context,'twist-audio',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]});
          node.connect(context.destination);
          node.port.onmessage=({data})=>{
            if(data.type==='metrics'){load=data.load;maxLoad=Math.max(maxLoad,load);peak=data.peak;musicActive=Boolean(data.music);varioActive=wanted&&Boolean(data.vario);musicSchedule=data.musicSchedule??null;}
            if(data.navigation)navigationAcknowledged=data.navigation;
            if(data.afterburner)afterburnerAcknowledged=data.afterburner;
            if(data.passby)passbyAcknowledged=data.passby;
            if(data.sonic)sonicAcknowledged=data.sonic;
            if(data.countdown){countdownAcknowledged=data.countdown;observeCountdownEnd(data.countdown);}
            if(data.briefing){briefingAcknowledged=data.briefing;observeBriefing(data.briefing);}
            if(data.fm)fmAcknowledged=data.fm;
          };
          poll=setInterval(()=>post({type:'poll'}),1000);
        }
        status='ready';
        if(!idle()){if(wanted&&lastState)post(lastState);}else await context.suspend();
      })().catch(()=>{status='unavailable';clearInterval(poll);node?.disconnect();node=null;}).finally(()=>{pending=null;});
      await pending;
    }catch{status='unavailable';}
  }
  function musicItem(item,at,tag='base',session=musicSession){
    if(!node||session!==musicSession||cancelledMusicTags.has(tag))return;
    musicPending.push({...item,at,tag,session,sequence:musicSequence++});
    if(!musicFlush){musicFlush=true;queueMicrotask(()=>{musicFlush=false;const writes=musicPending.filter(w=>w.session===musicSession&&!cancelledMusicTags.has(w.tag));musicPending=[];if(writes.length)post({type:'musicReg',session:musicSession,writes});});}
  }
  function musicWrite(addr,value,at,tag='base',session=musicSession){musicItem({addr,value},at,tag,session);}
  function musicClockFor(tag='base'){
    const session=musicSession;let at=null;
    return {get sampleRate(){return context?.sampleRate;},now:()=>context?.currentTime||0,setScheduleTime(time){at=time;},
      write(addr,value){musicWrite(addr,value,at,tag,session);},
      event(payload){if(payload?.kind==='fm')musicItem({...payload,event:{...payload.event}},at,tag,session);}};
  }
  function cancelCountdown(session){
    if(!countdownSession||(session!==undefined&&session!==countdownSession.id))return;
    const record=countdownSession,id=record.id;finishCountdownEnd(record,'cancelled');countdownSession=null;post({type:'countdownCancel',session:id});
    if(idle())context?.suspend().catch(()=>{});
  }
  const briefingPermitted=settings=>Boolean(settings?.sound&&settings?.sfx&&settings.volume>0);
  const briefingReady=record=>record===briefingSession&&!disposed&&Boolean(node)&&context?.state==='running'&&briefingVisible()
    &&!wanted&&!countdownSession&&record?.needsFuture&&briefingPermitted(record.settings);
  function suspendBriefingIfIdle(){if(idle())context?.suspend().catch(()=>{});}
  function observeBriefing(ack){
    const record=briefingSession;
    if(!record||ack.session!==record.id||(ack.sequence??-1)<record.sequence)return;
    record.sounding=Boolean(ack.active);
    if(ack.closed||ack.needsFuture===false)record.needsFuture=false;
    suspendBriefingIfIdle();
  }
  function cancelBriefing(session,reason='cancelled'){
    const record=briefingSession;
    if(!record||(session!==undefined&&session!==record.id))return false;
    briefingSession=null;post({type:'briefingCancel',session:record.id,reason});suspendBriefingIfIdle();return true;
  }
  function beginBriefingBus(record){
    if(!briefingReady(record))return false;
    if(!record.begun){post({type:'settings',settings:record.settings});post({type:'briefingBegin',session:record.id});record.begun=true;}
    return true;
  }
  function beginBriefing(session,settings){
    if(!validCountdownSession(session)||session<=lastBriefingSession||disposed||wanted||countdownSession
      ||!briefingVisible()||!briefingPermitted(settings))return false;
    lastBriefingSession=session;cancelBriefing(undefined,'new-map');
    const record={id:session,settings:{...settings},needsFuture:true,sounding:false,begun:false,sequence:0};briefingSession=record;
    // A preceding halt may still be suspending. Queue resume immediately,
    // including when an older warm-up promise has not resolved yet.
    const resuming=context?Promise.resolve(context.resume()).catch(()=>{}):Promise.resolve();
    const loading=unlock();
    return Promise.all([resuming,loading]).then(()=>{const ready=record===briefingSession&&beginBriefingBus(record);suspendBriefingIfIdle();return ready;},()=>{suspendBriefingIfIdle();return false;});
  }
  function finishCountdownEnd(record,reason,atSeconds=context?.currentTime??0){
    const ending=record?.goEnd;if(!ending||ending.done)return;
    ending.done=true;clearTimeout(ending.timer);
    countdownEnd={session:record.id,cue:'go',reason,atSeconds,acknowledged:ending.acknowledged};
    ending.resolve({...countdownEnd});
  }
  function observeCountdownEnd(ack){
    const record=countdownSession,ending=record?.goEnd;
    if(!ending||ending.done||ack.session!==record.id)return;
    const began=ack.history?.findLast(value=>value.session===record.id&&value.cue==='go');
    if(began){
      if(!ack.active){finishCountdownEnd(record,ack.reason,ack.atSeconds??context?.currentTime??0);return;}
      if(ack.cue==='go'&&!ending.acknowledged){
        ending.acknowledged=true;clearTimeout(ending.timer);
        const remaining=Math.max(0,(began.at+COUNTDOWN_AUDIO.goMs/1000-(context?.currentTime??began.at))*1000);
        ending.timer=setTimeout(()=>{post({type:'countdownCancel',session:record.id});finishCountdownEnd(record,'timeout');},remaining+COUNTDOWN_AUDIO.ackTimeoutMs);
      }
    }else if((ack.suppressed??0)>ending.suppressed){finishCountdownEnd(record,ack.reason);}
  }
  function beginCountdownEnd(record){
    let resolve;const promise=new Promise(done=>{resolve=done;});
    record.goEnd={promise,resolve,done:false,acknowledged:false,suppressed:countdownAcknowledged?.suppressed??0,timer:null};
    // The message expires after 100ms. If the native bus never acknowledges it,
    // cancel it before releasing BGM rather than waiting through a silent tail.
    record.goEnd.timer=setTimeout(()=>{post({type:'countdownCancel',session:record.id});finishCountdownEnd(record,'unavailable');},COUNTDOWN_AUDIO.ackTimeoutMs);
  }
  const countdownVisible=()=>typeof document==='undefined'||!document.hidden;
  const countdownReady=record=>record===countdownSession&&!disposed&&Boolean(node)&&context?.state==='running'&&countdownVisible();
  function beginCountdownBus(record,settings){
    if(!countdownReady(record)||!settings.sound||!settings.sfx||settings.volume<=0)return false;
    if(!record.begun){post({type:'settings',settings});post({type:'countdownBegin',session:record.id});record.begun=true;}
    return true;
  }
  function prepareCountdown(session,settings){
    cancelBriefing(undefined,'countdown');
    cancelCountdown();
    if(!validCountdownSession(session))return {ready:false,waitMilliseconds:0,reason:'invalid'};
    const record={id:session,begun:false,seen:new Set()};countdownSession=record;countdownEnd=null;
    const started=performance.now();
    const finish=()=>{
      const ready=beginCountdownBus(record,settings);
      const result={session,ready,waitMilliseconds:Math.max(0,performance.now()-started),reason:record!==countdownSession?'cancelled':ready?'ready':'unavailable'};
      if(record===countdownSession)countdownPreparation=result;return result;
    };
    if(!settings.sound||!settings.sfx||settings.volume<=0||!context||disposed||!countdownVisible())return finish();
    // Queue this explicit countdown's resume after halt's suspension, before
    // awaiting the older unlock. No tone is retained across the bounded wait.
    let timer;
    const timeout=new Promise(resolve=>{timer=setTimeout(resolve,COUNTDOWN_AUDIO.prepareTimeoutMs);});
    const loading=pending;
    const resuming=Promise.resolve(context.resume()).catch(()=>{}).then(()=>{
      if(idle())return context?.suspend().catch(()=>{});
    });
    const preparation=Promise.all([loading,resuming]);
    return Promise.race([preparation,timeout]).then(finish,finish).finally(()=>clearTimeout(timer));
  }
  return {
    unlock,
    warmBriefing(settings){if(!disposed&&!wanted&&!countdownSession&&briefingVisible()&&briefingPermitted(settings))return unlock();return Promise.resolve();},
    beginBriefing,
    briefingReady:session=>briefingSession?.id===session&&briefingReady(briefingSession),
    briefingCue(session,{kind,index=0,total=1,remainingSeconds}={},settings){
      const record=briefingSession,cue=briefingCue(kind,index,total);
      if(!record||record.id!==session||!cue||!briefingPermitted(settings)||!Number.isFinite(remainingSeconds)||remainingSeconds<=0
        ||remainingSeconds>BRIEFING_AUDIO.maxCueAgeSeconds||!beginBriefingBus(record))return false;
      record.sounding=true;const sequence=++record.sequence;
      post({type:'briefingTone',session,sequence,kind,index,total,expiresAt:context.currentTime+remainingSeconds});return true;
    },
    finishBriefing(session){const record=briefingSession;if(!record||record.id!==session)return;record.needsFuture=false;
      if(record.begun)post({type:'briefingVisualEnd',session});suspendBriefingIfIdle();},
    cancelBriefing,
    prepareCountdown,
    countdownTone(session,cue,settings){
      const record=countdownSession;
      if(!record||record.id!==session||!validCountdownCue(cue)||record.seen.has(cue))return false;
      record.seen.add(cue); // A missed/unready beat is consumed, never retried.
      if(cue==='go'?!wanted:wanted)return false;
      if(!beginCountdownBus(record,settings))return false;
      if(cue==='go')beginCountdownEnd(record);
      post({type:'countdownTone',session,cue,launched:wanted,expiresAt:context.currentTime+.1});return true;
    },
    waitForCountdownEnd(session){return countdownSession?.id===session&&countdownSession.goEnd
      ?countdownSession.goEnd.promise:Promise.resolve({session,cue:'go',reason:'unavailable'});},
    cancelCountdown,
    async waitForReady(){if(pending)await pending;return Boolean(node);},
    musicReady:()=>Boolean(node),
    resume:()=>context?context.resume():Promise.resolve(),
    suspendIfIdle:suspendBriefingIfIdle,
    musicClock:{
      get sampleRate(){return context?.sampleRate;},
      now:()=>context?.currentTime||0,
      setScheduleTime(time){scheduleTime=time;},
      write(addr,value){musicWrite(addr,value,scheduleTime);},
      event(payload){if(payload?.kind==='fm')musicItem({...payload,event:{...payload.event}},scheduleTime);},
    },
    createMusicClock(){return musicClockFor();},
    createMusicLayerClock(tag){return musicClockFor(tag);},
    cancelMusicLayer(tag){cancelledMusicTags.add(tag);musicPending=musicPending.filter(w=>w.tag!==tag);post({type:'musicCancel',tag});},
    stopMusic(){musicSession++;musicPending=[];scheduleTime=null;cancelledMusicTags.clear();post({type:'musicStop',session:musicSession});},
    setMusicGain(gain){post({type:'musicGain',gain});},
    configure(settings){if(briefingSession)briefingSession.settings={...settings};post({type:'settings',settings});if(!settings.sound||!settings.sfx||settings.volume<=0){cancelBriefing(undefined,'disabled');finishCountdownEnd(countdownSession,'disabled');}},
    start(){cancelBriefing(undefined,'flight');wanted=true;if(context)context.resume().catch(()=>{});if(lastState)post(lastState);},
    update(model,settings,phase,navigation=null){lastState={type:'state',model,settings,phase,navigation};if(wanted)post(lastState);},
    event(kind,settings){
      if(!node||!settings.sound||!settings.sfx)return;
      const token=generation;
      const deliver=()=>{if(token===generation){lastEvent=kind;post({type:'event',kind,settings});}};
      clearTimeout(eventTimer);if(context.state==='running'&&wanted)deliver();else context.resume().then(deliver).catch(()=>{});
      if(!wanted)eventTimer=setTimeout(()=>{post({type:'stop'});context.suspend().catch(()=>{});},1400);
    },
    passBy(payload,settings){
      if(!node||!wanted||!settings.sound||!settings.sfx||settings.passbySound===false)return;
      if(!payload||!['speed','distance','side'].every(key=>Number.isFinite(payload[key])))return;
      post({type:'passby',payload:{id:String(payload.id??''),speed:payload.speed,distance:payload.distance,side:payload.side},settings});
    },
    sonicTransition(event,settings){
      // Never resume or await an unavailable context for a transient crossing.
      if(!node||!wanted||context?.state!=='running'||!settings.sound||!settings.sfx||!validSonicTransition(event))return false;
      post({type:'sonic',event:{...event},settings});return true;
    },
    stop(){generation++;musicSession++;musicPending=[];wanted=false;cancelBriefing(undefined,'stop');cancelCountdown();varioActive=false;lastState=null;clearTimeout(eventTimer);post({type:'stop',session:musicSession});context?.suspend().catch(()=>{});},
    snapshot:()=>({status,load,maxLoad,peak,musicActive,varioActive,lastEvent,contextState:context?.state||'none',workletReady:Boolean(node),musicSchedule:musicSchedule?{...musicSchedule}:null,
      afterburner:{requested:lastState?.model?.afterburner?{...lastState.model.afterburner}:null,acknowledged:afterburnerAcknowledged?{...afterburnerAcknowledged}:null},
      passby:passbyAcknowledged?{...passbyAcknowledged}:null,
      sonic:sonicAcknowledged?{...sonicAcknowledged}:null,fm:fmAcknowledged?structuredClone(fmAcknowledged):null,musicSession,
      countdown:{session:countdownSession?.id??null,preparation:countdownPreparation?{...countdownPreparation}:null,acknowledged:countdownAcknowledged?structuredClone(countdownAcknowledged):null,end:countdownEnd?{...countdownEnd}:null},
      briefing:{session:briefingSession?.id??null,needsFuture:briefingSession?.needsFuture??false,sounding:briefingSession?.sounding??false,acknowledged:briefingAcknowledged?structuredClone(briefingAcknowledged):null},
      navigation:{requested:lastState?.navigation?{...lastState.navigation}:null,acknowledged:navigationAcknowledged?{...navigationAcknowledged}:null}}),
    resetMetrics(){load=0;maxLoad=0;peak=0;post({type:'resetMetrics'});},
    dispose(){disposed=true;generation++;wanted=false;cancelBriefing(undefined,'disposed');cancelCountdown();musicPending=[];clearInterval(poll);clearTimeout(eventTimer);node?.disconnect();node=null;return context?.close().catch(()=>{})??Promise.resolve();},
  };
}
