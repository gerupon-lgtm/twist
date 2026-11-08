import workletUrl from './audio-worklet.js?worker&url';
import {validSonicTransition} from './supersonic-model.js';
import {COUNTDOWN_AUDIO,validCountdownSession,validCountdownCue} from './countdown-audio.js';

/** AudioContext construction/resume happens only through an explicit start click. */
export function createGameAudio(){
  let context=null,node=null,pending=null,poll=null,status='idle',lastState=null,wanted=false,eventTimer=null,generation=0,disposed=false;
  let load=0,maxLoad=0,peak=0,musicActive=false,varioActive=false;
  let musicSchedule=null,fmAcknowledged=null,musicSession=0,musicSequence=0;
  let lastEvent=null;
  let navigationAcknowledged=null,afterburnerAcknowledged=null,passbyAcknowledged=null,sonicAcknowledged=null;
  let musicPending=[],musicFlush=false,scheduleTime=null;
  let countdownSession=null,countdownAcknowledged=null,countdownPreparation=null;
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
            if(data.countdown)countdownAcknowledged=data.countdown;
            if(data.fm)fmAcknowledged=data.fm;
          };
          poll=setInterval(()=>post({type:'poll'}),1000);
        }
        status='ready';
        if(wanted||countdownSession){if(wanted&&lastState)post(lastState);}else await context.suspend();
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
    const id=countdownSession.id;countdownSession=null;post({type:'countdownCancel',session:id});
    if(!wanted)context?.suspend().catch(()=>{});
  }
  const countdownVisible=()=>typeof document==='undefined'||!document.hidden;
  const countdownReady=record=>record===countdownSession&&!disposed&&Boolean(node)&&context?.state==='running'&&countdownVisible();
  function beginCountdownBus(record,settings){
    if(!countdownReady(record)||!settings.sound||!settings.sfx||settings.volume<=0)return false;
    if(!record.begun){post({type:'settings',settings});post({type:'countdownBegin',session:record.id});record.begun=true;}
    return true;
  }
  function prepareCountdown(session,settings){
    cancelCountdown();
    if(!validCountdownSession(session))return {ready:false,waitMilliseconds:0,reason:'invalid'};
    const record={id:session,begun:false,seen:new Set()};countdownSession=record;
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
      if(!wanted&&!countdownSession)return context?.suspend().catch(()=>{});
    });
    const preparation=Promise.all([loading,resuming]);
    return Promise.race([preparation,timeout]).then(finish,finish).finally(()=>clearTimeout(timer));
  }
  return {
    unlock,
    prepareCountdown,
    countdownTone(session,cue,settings){
      const record=countdownSession;
      if(!record||record.id!==session||!validCountdownCue(cue)||record.seen.has(cue))return false;
      record.seen.add(cue); // A missed/unready beat is consumed, never retried.
      if(cue==='go'?!wanted:wanted)return false;
      if(!beginCountdownBus(record,settings))return false;
      post({type:'countdownTone',session,cue,launched:wanted,expiresAt:context.currentTime+.1});return true;
    },
    cancelCountdown,
    async waitForReady(){if(pending)await pending;return Boolean(node);},
    musicReady:()=>Boolean(node),
    resume:()=>context?context.resume():Promise.resolve(),
    suspendIfIdle(){if(!wanted&&!countdownSession)context?.suspend().catch(()=>{});},
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
    configure(settings){post({type:'settings',settings});},
    start(){wanted=true;if(context)context.resume().catch(()=>{});if(lastState)post(lastState);},
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
    stop(){generation++;musicSession++;musicPending=[];wanted=false;cancelCountdown();varioActive=false;lastState=null;clearTimeout(eventTimer);post({type:'stop',session:musicSession});context?.suspend().catch(()=>{});},
    snapshot:()=>({status,load,maxLoad,peak,musicActive,varioActive,lastEvent,contextState:context?.state||'none',workletReady:Boolean(node),musicSchedule:musicSchedule?{...musicSchedule}:null,
      afterburner:{requested:lastState?.model?.afterburner?{...lastState.model.afterburner}:null,acknowledged:afterburnerAcknowledged?{...afterburnerAcknowledged}:null},
      passby:passbyAcknowledged?{...passbyAcknowledged}:null,
      sonic:sonicAcknowledged?{...sonicAcknowledged}:null,fm:fmAcknowledged?structuredClone(fmAcknowledged):null,musicSession,
      countdown:{session:countdownSession?.id??null,preparation:countdownPreparation?{...countdownPreparation}:null,acknowledged:countdownAcknowledged?structuredClone(countdownAcknowledged):null},
      navigation:{requested:lastState?.navigation?{...lastState.navigation}:null,acknowledged:navigationAcknowledged?{...navigationAcknowledged}:null}}),
    resetMetrics(){load=0;maxLoad=0;peak=0;post({type:'resetMetrics'});},
    dispose(){disposed=true;generation++;wanted=false;cancelCountdown();musicPending=[];clearInterval(poll);clearTimeout(eventTimer);node?.disconnect();node=null;return context?.close().catch(()=>{})??Promise.resolve();},
  };
}
