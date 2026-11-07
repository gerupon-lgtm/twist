import workletUrl from './audio-worklet.js?worker&url';

/** AudioContext construction/resume happens only through an explicit start click. */
export function createGameAudio(){
  let context=null,node=null,pending=null,poll=null,status='idle',lastState=null,wanted=false,eventTimer=null,generation=0;
  let load=0,maxLoad=0,peak=0,musicActive=false,varioActive=false;
  let musicPending=[],musicFlush=false,scheduleTime=null;
  const post=m=>node?.port.postMessage(m);
  async function unlock(){
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio){status='unsupported';return;}
    try {
      if(!context||context.state==='closed')context=new Audio();
      if(!pending)pending=(async()=>{
        await context.resume();
        if(!node){
          await context.audioWorklet.addModule(workletUrl);
          node=new AudioWorkletNode(context,'twist-audio',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1]});
          node.connect(context.destination);
          node.port.onmessage=({data})=>{if(data.type==='metrics'){load=data.load;maxLoad=Math.max(maxLoad,load);peak=data.peak;musicActive=Boolean(data.music);varioActive=wanted&&Boolean(data.vario);}};
          poll=setInterval(()=>post({type:'poll'}),1000);
        }
        status='ready';
        if(wanted){if(lastState)post(lastState);}else await context.suspend();
      })().catch(()=>{status='unavailable';clearInterval(poll);node?.disconnect();node=null;}).finally(()=>{pending=null;});
      await pending;
    }catch{status='unavailable';}
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
      write(addr,value){
        if(!node)return;
        musicPending.push({addr,value,at:scheduleTime});
        if(!musicFlush){musicFlush=true;queueMicrotask(()=>{musicFlush=false;if(musicPending.length)post({type:'musicReg',writes:musicPending});musicPending=[];});}
      },
    },
    stopMusic(){musicPending=[];scheduleTime=null;post({type:'musicStop'});},
    setMusicGain(gain){post({type:'musicGain',gain});},
    configure(settings){post({type:'settings',settings});},
    start(){wanted=true;if(context)context.resume().catch(()=>{});if(lastState)post(lastState);},
    update(model,settings,phase){lastState={type:'state',model,settings,phase};if(wanted)post(lastState);},
    event(kind,settings){
      if(!node||!settings.sound||!settings.sfx)return;
      const token=generation;
      clearTimeout(eventTimer);context.resume().then(()=>{if(token===generation)post({type:'event',kind,settings});}).catch(()=>{});
      if(!wanted)eventTimer=setTimeout(()=>{post({type:'stop'});context.suspend().catch(()=>{});},1400);
    },
    stop(){generation++;musicPending=[];wanted=false;varioActive=false;lastState=null;clearTimeout(eventTimer);post({type:'stop'});context?.suspend().catch(()=>{});},
    snapshot:()=>({status,load,maxLoad,peak,musicActive,varioActive,contextState:context?.state||'none',workletReady:Boolean(node)}),
    resetMetrics(){load=0;maxLoad=0;peak=0;post({type:'resetMetrics'});},
    dispose(){clearInterval(poll);clearTimeout(eventTimer);node?.disconnect();context?.close();},
  };
}
