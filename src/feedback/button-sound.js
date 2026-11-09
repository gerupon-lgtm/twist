import {PsgStage} from '../vendor/scc/core/psg-stage.js';
import {WindowConverter} from '../vendor/scc/core/window-converter.js';
import {SCC_COMPAT} from '../vendor/scc/core/config.js';

/** An isolated PSG voice: it cannot overwrite flight warnings or music. */
export function renderButtonSound(rate=48000){
  const samples=new Float32Array(Math.ceil(rate*.07)),psg=new PsgStage(),clock=new WindowConverter(SCC_COMPAT.clock,rate);
  const period=Math.round(SCC_COMPAT.clock/(32*520));
  psg.psg.writeReg(0,period&255);psg.psg.writeReg(1,period>>8);
  psg.psg.writeReg(7,0x3e);psg.psg.writeReg(8,8);
  const smoothing=1-Math.exp(-2*Math.PI*900/rate);let low=0,peak=0;
  for(let i=0;i<samples.length;i++){
    low+=smoothing*(psg.sample(clock.nextL())-low);
    samples[i]=low*Math.sin(Math.PI*i/(samples.length-1))**2;peak=Math.max(peak,Math.abs(samples[i]));
  }
  if(peak>0)for(let i=0;i<samples.length;i++)samples[i]*=.09/peak;
  samples[0]=samples[samples.length-1]=0;return samples;
}

/** Uses the game's context, with no retained click after an audio-resume delay. */
export function createButtonSound({ensureContext,canSuspend,visible=()=>!document.hidden,now=()=>performance.now()}){
  let voice=null,pending=null,token=0,buffer=null,bufferRate=0,played=0,suppressed=0,lastReason=null,lastResumeMs=0;
  const reject=reason=>{suppressed++;lastReason=reason;return false;};
  function cancel(){token++;pending=null;if(voice){voice.source.onended=null;try{voice.source.stop();}catch{/* Already ended. */}voice.source.disconnect();voice.gain.disconnect();voice=null;}}
  function play(settings,keepAwake=()=>false,gestureAt=now()){
    if(!settings.sound||!settings.sfx||settings.volume<=0||!visible())return Promise.resolve(reject('disabled'));
    if(voice||pending)return Promise.resolve(reject('busy'));
    let context;try{context=ensureContext();}catch{return Promise.resolve(reject('unavailable'));}
    if(!context)return Promise.resolve(reject('unsupported'));
    const generation=++token;pending=generation;
    // Resume is called in the trusted click, before any asynchronous work.
    return Promise.resolve(context.resume()).then(()=>{
      if(generation!==token)return false;
      pending=null;
      lastResumeMs=now()-gestureAt;
      if(!visible()||context.state!=='running'||lastResumeMs>600){if(canSuspend()&&!keepAwake())void context.suspend().catch(()=>{});return reject('late');}
      if(!buffer||bufferRate!==context.sampleRate){const pcm=renderButtonSound(context.sampleRate);buffer=context.createBuffer(1,pcm.length,context.sampleRate);buffer.copyToChannel(pcm,0);bufferRate=context.sampleRate;}
      const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=settings.volume/100;
      source.connect(gain);gain.connect(context.destination);voice={source,gain};
      source.onended=()=>{source.disconnect();gain.disconnect();if(voice?.source===source)voice=null;if(canSuspend()&&!keepAwake())void context.suspend().catch(()=>{});};
      source.start();played++;lastReason='played';return true;
    }).catch(()=>{if(pending===generation)pending=null;return reject('unavailable');});
  }
  return {play,cancel,active:()=>Boolean(voice||pending),snapshot:()=>({played,suppressed,lastReason,lastResumeMs,active:Boolean(voice||pending)})};
}
