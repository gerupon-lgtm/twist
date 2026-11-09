import {FM_PRESETS,fmPartStatus} from './fm-presets.js';
import {FM_MAX_VOICES} from './fm-engine.js';
import {createSccGuitarTone} from './scc-guitar-tone.js';

/** Measure held notes plus real release tails before scheduling any sound. */
export function measureFmVoices(score,track,{sampleRate=8000}={}){
  // Note-offs and the next note-on can enter the same 128-sample block.
  // Keep two blocks plus one sample beyond the envelope's mathematical end.
  const rate=Number.isFinite(sampleRate)&&sampleRate>=8000?sampleRate:8000,blockMargin=257/rate;
  const voices=[];let maximum=0;
  for(const e of score?.events??[]){
    for(let i=voices.length-1;i>=0;i--)if(voices[i].end<=e.time)voices.splice(i,1);
    const part=track.parts[(e.channel??0)+1],status=fmPartStatus(part);if(!status.eligible||!Number.isInteger(e.channel)||e.channel<0||e.channel>7)continue;
    const held=voices.find(v=>v.channel===e.channel&&v.note===e.note&&v.end===Infinity);
    if(e.type==='noteOn'&&e.velocity>0){if(!held)voices.push({channel:e.channel,note:e.note,end:Infinity});}
    else if(e.type==='noteOff'||e.type==='noteOn'&&e.velocity===0){if(held)held.end=e.time+FM_PRESETS[status.preset].release+blockMargin;}
    else if(e.type==='cc'&&(e.controller===120||e.controller===123))for(let i=voices.length-1;i>=0;i--)if(voices[i].channel===e.channel)voices.splice(i,1);
    maximum=Math.max(maximum,voices.length);
  }
  return maximum;
}
/** Untagged SCC parts retain the original facade's exact call order. */
export function createMusicSynth({scc,clock,track,trackId,engine='scc',score}){
  const fm=new Map(),fallbacks=[],requiredVoices=measureFmVoices(score,track,{sampleRate:clock.sampleRate});
  const guitar=createSccGuitarTone(scc,{trackId,track,engine});
  if(engine==='fm')for(const [channel,part]of Object.entries(track.parts)){
    const status=fmPartStatus(part);
    if(status.eligible&&Number(channel)>8)fallbacks.push({channel:Number(channel),reason:'non-melodic-channel'});
    else if(status.eligible&&typeof clock.event==='function'&&requiredVoices<=FM_MAX_VOICES)fm.set(Number(channel)-1,status.preset);
    else if(part.role!=='drums'&&Number(channel)<=8)fallbacks.push({channel:Number(channel),reason:status.reason??(requiredVoices>FM_MAX_VOICES?'capacity':'clock-unavailable')});
  }
  if(fm.size)clock.event({kind:'fm',event:{type:'configure',capacity:Math.max(1,requiredVoices)}});
  function handle(event){
    const part=track.parts[(event.channel??0)+1];
    const volume=fm.has(event.channel)?part?.fmVolume??part?.volume??127:part?.volume??127;
    const scaled=event.type==='cc'&&event.controller===7?{...event,value:Math.round(event.value*volume/127)}:event;
    if(fm.has(event.channel))clock.event({kind:'fm',event:scaled,presetId:fm.get(event.channel)});
    else if(guitar)guitar.handle(scaled,event=>scc.handle(event));
    else scc.handle(scaled);
  }
  return {handle,
    resetControllers(){scc.resetControllers();for(const [channel,part]of Object.entries(track.parts)){
      const index=Number(channel)-1,event={type:'cc',channel:index,controller:7,value:fm.has(index)?part.fmVolume??part.volume:part.volume};
      if(fm.has(event.channel)){clock.event({kind:'fm',event:{type:'pitchBend',channel:event.channel,value:0},presetId:fm.get(event.channel)});clock.event({kind:'fm',event,presetId:fm.get(event.channel)});}
      else scc.handle(event);
    }},
    allNotesOff(){scc.allNotesOff();guitar?.reset();if(fm.size)clock.event({kind:'fm',event:{type:'allNotesOff'}});},
    snapshot:()=>({requestedEngine:engine,effectiveEngine:fm.size?'fm':'scc',fmParts:[...fm.keys()].map(n=>n+1),requiredVoices,fallbacks:fallbacks.map(row=>({...row})),...(guitar?{sccTimbre:guitar.snapshot()}:{})}),
  };
}
