import workletUrl from './audio-worklet.js?worker&url';

/** AudioContext construction/resume happens only through an explicit start click. */
export function createGameAudio(){
  let context=null,node=null,pending=null,poll=null,status='idle',lastState=null,wanted=false,eventTimer=null,generation=0,disposed=false;
  let load=0,maxLoad=0,peak=0,musicActive=false,varioActive=false;
  let musicSchedule=null;
  let lastEvent=null;
  let navigationAcknowledged=null,afterburnerAcknowledged=null,passbyAcknowledged=null;
  let musicPending=[],musicFlush=false,scheduleTime=null;
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
          };
          poll=setInterval(()=>post({type:'poll'}),1000);
        }
        status='ready';
        if(wanted){if(lastState)post(lastState);}else await context.suspend();
      })().catch(()=>{status='unavailable';clearInterval(poll);node?.disconnect();node=null;}).finally(()=>{pending=null;});
      await pending;
    }catch{status='unavailable';}
  }
  function musicWrite(addr,value,at,tag='base'){
    if(!node||cancelledMusicTags.has(tag))return;
    musicPending.push({addr,value,at,tag});
    if(!musicFlush){musicFlush=true;queueMicrotask(()=>{musicFlush=false;const writes=musicPending.filter(w=>!cancelledMusicTags.has(w.tag));musicPending=[];if(writes.length)post({type:'musicReg',writes});});}
  }
  return {
    unlock,
    async waitForReady(){if(pending)await pending;return Boolean(node);},
    musicReady:()=>Boolean(node),
    resume:()=>context?context.resume():Promise.resolve(),
    suspendIfIdle(){if(!wanted)context?.suspend().catch(()=>{});},
    musicClock:{
      now:()=>context?.currentTime||0,
      setScheduleTime(time){scheduleTime=time;},
      write(addr,value){musicWrite(addr,value,scheduleTime);},
    },
    createMusicLayerClock(tag){let at=null;return {now:()=>context?.currentTime||0,setScheduleTime(time){at=time;},write(addr,value){musicWrite(addr,value,at,tag);}};},
    cancelMusicLayer(tag){cancelledMusicTags.add(tag);musicPending=musicPending.filter(w=>w.tag!==tag);post({type:'musicCancel',tag});},
    stopMusic(){musicPending=[];scheduleTime=null;cancelledMusicTags.clear();post({type:'musicStop'});},
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
    stop(){generation++;musicPending=[];wanted=false;varioActive=false;lastState=null;clearTimeout(eventTimer);post({type:'stop'});context?.suspend().catch(()=>{});},
    snapshot:()=>({status,load,maxLoad,peak,musicActive,varioActive,lastEvent,contextState:context?.state||'none',workletReady:Boolean(node),musicSchedule:musicSchedule?{...musicSchedule}:null,
      afterburner:{requested:lastState?.model?.afterburner?{...lastState.model.afterburner}:null,acknowledged:afterburnerAcknowledged?{...afterburnerAcknowledged}:null},
      passby:passbyAcknowledged?{...passbyAcknowledged}:null,
      navigation:{requested:lastState?.navigation?{...lastState.navigation}:null,acknowledged:navigationAcknowledged?{...navigationAcknowledged}:null}}),
    resetMetrics(){load=0;maxLoad=0;peak=0;post({type:'resetMetrics'});},
    dispose(){disposed=true;generation++;wanted=false;musicPending=[];clearInterval(poll);clearTimeout(eventTimer);node?.disconnect();node=null;return context?.close().catch(()=>{})??Promise.resolve();},
  };
}
