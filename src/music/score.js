import { parseSmf } from '../vendor/scc/midi/smf.js';
import { PRESET_NAMES } from '../vendor/scc/core/presets.js';

export function validateTrack(track){
  if(!track||typeof track.file!=='string'||!track.file.endsWith('.mid')||/[:?#\\]/.test(track.file)||track.file.startsWith('/')||track.file.split('/').includes('..'))throw Error('Invalid MIDI path');
  const parts={};
  for(const [channel,part]of Object.entries(track.parts||{})){
    const n=Number(channel);if(!Number.isInteger(n)||n<1||n>10||n===9)throw Error('Invalid MIDI channel');
    const wave=part.waveform??0,volume=part.volume??100;
    if(!Number.isInteger(wave)||wave<0||wave>=PRESET_NAMES.length||!Number.isFinite(volume)||volume<0||volume>127)throw Error('Invalid part');
    parts[n]={waveform:wave,volume};
  }
  if(track.loop&&(!Number.isFinite(track.loop.start)||!Number.isFinite(track.loop.end)||track.loop.start<0||track.loop.end>3600||track.loop.end-track.loop.start<.1))throw Error('Invalid loop');
  return {file:track.file,title:typeof track.title==='string'?track.title:track.file,parts,loop:track.loop?{...track.loop}:null};
}
export function prepareScore(bytes,track){
  const song=parseSmf(bytes),start=track.loop?.start??0,end=track.loop?.end??song.duration;
  if(!Number.isFinite(end)||start>=end)throw Error('Invalid MIDI interval');
  const active=new Map(),controllers=new Map();
  for(const event of song.events){
    if(event.time>=start)break;
    const key=`${event.channel}:${event.note}`;
    if(event.type==='noteOn')active.set(key,event);
    if(event.type==='noteOff')active.delete(key);
    if(event.type==='cc'){
      controllers.set(`${event.channel}:cc:${event.controller}`,event);
      if(event.controller===120||event.controller===123)for(const [k,n]of active)if(n.channel===event.channel)active.delete(k);
    }
    if(event.type==='pitchBend')controllers.set(`${event.channel}:bend`,event);
  }
  const defaults=[];
  for(const channel of [0,1,2,3,4,5,6,7,9]){defaults.push({type:'cc',channel,controller:7,value:127,time:0});if(channel!==9)defaults.push({type:'pitchBend',channel,value:0,time:0});}
  const events=[...defaults,...[...controllers.values(),...active.values()].map(e=>({...e,time:0})),
    ...song.events.filter(e=>e.time>=start&&e.time<end).map(e=>({...e,time:e.time-start}))];
  if(!events.some(e=>e.type==='noteOn'))throw Error('No notes in MIDI interval');
  const duration=end-start;
  for(const channel of [0,1,2,3,4,5,6,7,9])events.push({type:'cc',channel,controller:123,value:0,time:duration});
  return {events,duration,title:track.title};
}

/** Expand ahead of the original SmfPlayer, keeping exact event times at loop boundaries. */
export function createLoopStream(score){
  const events=[];let cycles=0;
  return {
    events,
    extend(until){
      while(cycles*score.duration<until){
        const offset=cycles++*score.duration;
        for(const event of score.events)events.push({...event,time:event.time+offset});
      }
      return cycles*score.duration;
    },
    trim(player){if(player.index>score.events.length*2){events.splice(0,player.index);player.index=0;}},
  };
}
