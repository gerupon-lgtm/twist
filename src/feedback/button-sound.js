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

// Prepare the waveform before a gesture; this does not construct AudioContext.
const BUTTON_RATE=48000,BUTTON_PCM=renderButtonSound(BUTTON_RATE);
export const BUTTON_MAX_DELAY_MS=200,BUTTON_IDLE_MS=1200;
export const BUTTON_RESUME_MAX_DELAY_MS=300;

/** Short overlapping voices on one context; delayed clicks are never queued. */
export function createButtonSound({ensureContext,canSuspend,visible=()=>!document.hidden,now=()=>performance.now()}){
  const voices=new Set();
  let pending=null,token=0,buffer=null,bufferContext=null,idleTimer=null,keepAwake=()=>false,played=0,suppressed=0,lastReason=null,lastResumeMs=0;
  const reject=reason=>{suppressed++;lastReason=reason;return false;};
  function prepare(settings){
    if(!settings.sound||!settings.sfx||settings.volume<=0||!visible())return null;
    const context=ensureContext();if(!context)return null;
    if(!buffer||bufferContext!==context){buffer=context.createBuffer(1,BUTTON_PCM.length,BUTTON_RATE);buffer.copyToChannel(BUTTON_PCM,0);bufferContext=context;}
    return context;
  }
  const clearIdle=()=>{clearTimeout(idleTimer);idleTimer=null;};
  function rest(context){
    clearIdle();if(voices.size||pending)return;
    idleTimer=setTimeout(()=>{idleTimer=null;if(!voices.size&&!pending&&canSuspend()&&!keepAwake())void context.suspend().catch(()=>{});},BUTTON_IDLE_MS);
  }
  function cancel(){token++;pending=null;keepAwake=()=>false;clearIdle();for(const voice of voices){voice.source.onended=null;try{voice.source.stop();}catch{/* Already ended. */}voice.source.disconnect();voice.gain.disconnect();}voices.clear();}
  function play(settings,awake=()=>false,gestureAt=now()){
    if(!settings.sound||!settings.sfx||settings.volume<=0||!visible())return Promise.resolve(reject('disabled'));
    if(now()-gestureAt>BUTTON_MAX_DELAY_MS)return Promise.resolve(reject('late'));
    if(voices.size>=4)return Promise.resolve(reject('busy'));
    let context;try{context=ensureContext();}catch{return Promise.resolve(reject('unavailable'));}
    if(!context)return Promise.resolve(reject('unsupported'));
    const deadline=context.state==='running'?BUTTON_MAX_DELAY_MS:BUTTON_RESUME_MAX_DELAY_MS;
    clearIdle();keepAwake=awake;const generation=++token;pending=generation;
    // Resume is called in the trusted click, before any asynchronous work.
    let resuming;try{resuming=context.resume();}catch{pending=null;return Promise.resolve(reject('unavailable'));}
    return Promise.resolve(resuming).then(()=>{
      if(generation!==token){if(canSuspend()&&!keepAwake())void context.suspend().catch(()=>{});return false;}
      pending=null;
      lastResumeMs=now()-gestureAt;
      if(!visible()||context.state!=='running'||lastResumeMs>deadline){rest(context);return reject('late');}
      prepare(settings);
      const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=settings.volume/100;
      source.connect(gain);gain.connect(context.destination);const voice={source,gain};voices.add(voice);
      source.onended=()=>{source.disconnect();gain.disconnect();voices.delete(voice);rest(context);};
      source.start();played++;lastReason='played';return true;
    }).catch(()=>{if(pending===generation){pending=null;rest(context);}return reject('unavailable');});
  }
  return {play,prepare,cancel,active:()=>Boolean(voices.size||pending||idleTimer),snapshot:()=>({played,suppressed,lastReason,lastResumeMs,voices:voices.size,active:Boolean(voices.size||pending||idleTimer)})};
}
