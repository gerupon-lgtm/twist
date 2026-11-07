import { Synth } from '../vendor/scc/engine/synth.js';
import { SmfPlayer } from '../vendor/scc/engine/smf-player.js';
import { PRESET_NAMES } from '../vendor/scc/core/presets.js';
import { validateTrack,prepareScore,createLoopStream } from './score.js';
import { APP_VERSION } from '../version.js';

export function createMusicPlayer(audio,{fetchFile=fetch,base=new URL('./music/',document.baseURI)}={}){
  let loading=null,tracks=null,player=null,expander=null,generation=0,current=null,status='idle',lastTrack=null;
  let settings={},playedTracks=[];
  async function preload(){
    if(tracks)return tracks;
    if(!loading)loading=(async()=>{
      const url=new URL('tracks.json',base);url.searchParams.set('v',APP_VERSION);
      const response=await fetchFile(url);if(!response.ok)throw Error('No track config');
      const data=await response.json(),loaded={};
      for(const id of ['flight','clear']){
        const track=validateTrack(data[id]),file=new URL(track.file,base);
        if(file.origin!==base.origin||!file.pathname.startsWith(base.pathname))throw Error('MIDI must be local');
        file.searchParams.set('v',APP_VERSION);const r=await fetchFile(file);if(!r.ok)throw Error('No MIDI');
        loaded[id]={track,score:prepareScore(new Uint8Array(await r.arrayBuffer()),track)};
      }
      tracks=loaded;status='ready';return tracks;
    })().catch(()=>{status='unavailable';loading=null;return null;});
    return loading;
  }
  function stop(){generation++;clearInterval(expander);expander=null;player?.stop();player=null;audio.stopMusic();current=null;if(status==='playing')status='ready';}
  async function play(id){
    if(!settings.sound||(id==='flight'?!settings.bgm:!settings.sfx))return 'cancelled';
    if(current===id&&player?.playing)return 'played';
    stop();const token=generation;
    const library=await preload();
    if(token!==generation)return 'cancelled';
    const ready=await audio.waitForReady();if(token!==generation)return 'cancelled';
    if(!library?.[id]||!ready)return 'unavailable';
    await audio.resume();if(token!==generation)return 'cancelled';
    const {track,score}=library[id],sink=audio.musicClock;
    audio.stopMusic();audio.configure(settings);audio.setMusicGain((settings.bgmVolume??50)/100);
    const synth=new Synth(sink,{drums:true});synth.init();
    for(const [channel,part]of Object.entries(track.parts))if(Number(channel)<=8)synth.setWave(PRESET_NAMES[part.waveform],Number(channel)-1);
    const facade={
      handle(event){
        const volume=track.parts[(event.channel??0)+1]?.volume??127;
        synth.handle(event.type==='cc'&&event.controller===7?{...event,value:Math.round(event.value*volume/127)}:event);
      },
      resetControllers(){synth.resetControllers();for(const [channel,part]of Object.entries(track.parts))synth.handle({type:'cc',channel:Number(channel)-1,controller:7,value:part.volume});},
      allNotesOff:()=>synth.allNotesOff(),
    };
    const stream=id==='flight'&&track.loop?createLoopStream(score):null;
    player=new SmfPlayer({synth:facade,clock:sink,onEnd:()=>{if(token===generation){audio.stopMusic();current=null;status='ready';if(id==='clear')audio.suspendIfIdle();}}});
    const duration=stream?stream.extend(score.duration*2):score.duration;
    player.load({events:stream?stream.events:score.events,duration});player.play();
    if(stream)expander=setInterval(()=>{
      if(!player?.playing)return;
      player.duration=stream.extend(Math.max(score.duration*2,sink.now()-player.startTime+score.duration));stream.trim(player);
    },100);
    current=id;lastTrack=track.title;if(!playedTracks.includes(track.title))playedTracks.push(track.title);status='playing';return 'played';
  }
  return {
    preload,play,stop,
    setSettings(value){settings=value;audio.setMusicGain((settings.bgmVolume??50)/100);if(!settings.sound||(current==='flight'&&!settings.bgm)||(current==='clear'&&!settings.sfx))stop();},
    reset(){playedTracks=[];lastTrack=null;},
    snapshot:()=>({status,playing:Boolean(player?.playing),track:lastTrack,playedTracks:[...playedTracks],current,
      clearTrack:tracks?.clear.track.title??null,position:player?.position??0,
      loopCount:current==='flight'&&tracks?.flight.track.loop?Math.floor((player?.position||0)/tracks.flight.score.duration):0}),
  };
}
