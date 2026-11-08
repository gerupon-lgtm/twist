import { CUSTOM } from '../vendor/scc/engine/synth.js';
import { PRESET_NAMES } from '../vendor/scc/core/presets.js';

export const SCC_GUITAR_TIMBRE = 'distortion-guitar-v1';
export const SCC_GUITAR_TRACK_IDS = Object.freeze(['rock','steel','horizon','storm','overdrive','ignition']);

// A rounded, driven string cycle. Limit the wavetable's own harmonics and leave
// margin below the SCC sample limit; this does not make the SCC alias-free.
const partials = [1,.22,.38,.08,.16,0,.07];
const cycle = Array.from({length:32},(_,i)=>partials.reduce((sum,gain,h)=>sum+gain*Math.sin((h+1)*i*Math.PI/16),0));
const peak = Math.max(...cycle.map(Math.abs));
const samples = cycle.map(value=>Math.round(value*120/peak));
// Quantization can introduce a small DC offset. Keep the integer cycle centered.
let dc = samples.reduce((sum,value)=>sum+value,0);
for(let i=0;dc!==0&&i<samples.length;i++){const correction=Math.sign(dc);samples[i]-=correction;dc-=correction;}
export const SCC_GUITAR_WAVE = Object.freeze(samples);

/** Only an explicit part-one tag on the six approved tracks changes SCC tone. */
export function hasSccGuitarTone(trackId,track,engine='scc'){
  return engine==='scc'&&SCC_GUITAR_TRACK_IDS.includes(trackId)&&track?.parts?.[1]?.sccTimbre===SCC_GUITAR_TIMBRE;
}

/**
 * Keep the original logical wave during allocation. The SCC's fourth/fifth
 * voices share a wave bank: a custom wave key must never steal another part's
 * voice or rewrite its shared bank. A shared guitar temporarily uses its old
 * tone; notes, timing, controllers and the allocator remain unchanged.
 */
export function createSccGuitarTone(scc,{trackId,track,engine='scc'}){
  if(!hasSccGuitarTone(trackId,track,engine))return null;
  const originalWave=PRESET_NAMES[track.parts[1].waveform];
  if(!originalWave||typeof scc.setWaveData!=='function'||typeof scc.setWave!=='function'||typeof scc.voices?.active!=='function'||!Array.isArray(scc.channelBank))return null;
  // setWaveData is global to custom parts. Do not overwrite a legacy custom part.
  if(scc.parts?.some((part,index)=>index!==0&&part.waveName===CUSTOM))return null;
  let mode='original',transitions=0;
  scc.setWaveData(SCC_GUITAR_WAVE,0);
  scc.setWave(originalWave,0);
  function synchronize(){
    const voices=scc.voices.active(),guitars=voices.filter(voice=>voice.part===0);
    const exclusive=guitars.length>0&&guitars.every(guitar=>!voices.some(other=>other.part!==0&&scc.channelBank[other.ch]===scc.channelBank[guitar.ch]));
    const next=exclusive?'custom':'original';
    // The public part-one setter changes the logical allocation key only.
    // setWave refreshes actual banks once, after allocation has finished.
    if(next==='custom'||mode!=='original')scc.setWave(next==='custom'?CUSTOM:originalWave,0);
    else scc.waveName=originalWave;
    if(next!==mode)transitions++;
    mode=next;
  }
  return {
    handle(event,dispatch){
      const allocation=Number.isInteger(event.channel)&&event.channel>=0&&event.channel<8&&(event.type==='noteOn'||event.type==='noteOff'||event.type==='cc'&&(event.controller===120||event.controller===123));
      if(!allocation){dispatch(event);return;}
      scc.waveName=originalWave;
      dispatch(event);
      synchronize();
    },
    reset(){if(mode!=='original'){scc.setWave(originalWave,0);transitions++;mode='original';}},
    snapshot:()=>({id:SCC_GUITAR_TIMBRE,part:1,originalWave,mode,transitions}),
  };
}
