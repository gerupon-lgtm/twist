import workletUrl from './audio-worklet.js?worker&url';

/** AudioContext construction/resume happens only through an explicit start click. */
export function createGameAudio(){
  let context=null,node=null,pending=null,poll=null,status='idle',lastState=null,wanted=false,eventTimer=null,generation=0;
  let load=0,maxLoad=0,peak=0;
  const post=m=>node?.port.postMessage(m);
  async function unlock(){
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio){status='unsupported';return;}
    try {
      if(!context)context=new Audio();
      await context.resume();
      if(node){status='ready';return;}
      if(!pending)pending=(async()=>{
        await context.audioWorklet.addModule(workletUrl);
        node=new AudioWorkletNode(context,'twist-audio',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1]});
        node.connect(context.destination);
        node.port.onmessage=({data})=>{if(data.type==='metrics'){load=data.load;maxLoad=Math.max(maxLoad,load);peak=data.peak;}};
        poll=setInterval(()=>post({type:'poll'}),1000);status='ready';
        if(wanted&&lastState)post(lastState);else await context.suspend();
      })().catch(()=>{status='unavailable';pending=null;});
      await pending;
    }catch{status='unavailable';}
  }
  return {
    unlock,
    start(){wanted=true;if(context)context.resume().catch(()=>{});if(lastState)post(lastState);},
    update(model,settings,phase){lastState={type:'state',model,settings,phase};if(wanted)post(lastState);},
    event(kind,settings){
      if(!node||!settings.sound||!settings.sfx)return;
      const token=generation;
      clearTimeout(eventTimer);context.resume().then(()=>{if(token===generation)post({type:'event',kind,settings});}).catch(()=>{});
      if(!wanted)eventTimer=setTimeout(()=>{post({type:'stop'});context.suspend().catch(()=>{});},1400);
    },
    stop(){generation++;wanted=false;lastState=null;clearTimeout(eventTimer);post({type:'stop'});context?.suspend().catch(()=>{});},
    snapshot:()=>({status,load,maxLoad,peak,contextState:context?.state||'none',workletReady:Boolean(node)}),
    resetMetrics(){load=0;maxLoad=0;peak=0;post({type:'resetMetrics'});},
    dispose(){clearInterval(poll);clearTimeout(eventTimer);node?.disconnect();context?.close();},
  };
}
