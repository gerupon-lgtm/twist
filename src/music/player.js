import { Synth } from '../vendor/scc/engine/synth.js';
import { SmfPlayer } from '../vendor/scc/engine/smf-player.js';
import { PRESET_NAMES } from '../vendor/scc/core/presets.js';
import { validateTrack,prepareScore,createLoopStream } from './score.js';
import { APP_VERSION } from '../version.js';
import { flightTrackSets,trackForFlight } from './playlist.js';

export function createMusicPlayer(audio,{fetchFile=fetch,base=new URL('./music/',document.baseURI)}={}){
  let loading=null,tracks=null,player=null,expander=null,generation=0,current=null,status='idle',lastTrack=null;
  let settings={},playedTracks=[],flightNumber=1,currentScoreDuration=0,currentTrackId=null;
  async function preload(){
    if(tracks)return tracks;
    if(!loading)loading=(async()=>{
      const url=new URL('tracks.json',base);url.searchParams.set('v',APP_VERSION);
      const response=await fetchFile(url);if(!response.ok)throw Error('No track config');
      const data=await response.json(),sets=flightTrackSets(data),ids=[...new Set(Object.values(sets).flat())],entries=Object.create(null);
      for(const id of [...ids,'clear']){
        try {
          const track=validateTrack(data[id]),file=new URL(track.file,base);
          if(file.origin!==base.origin||!file.pathname.startsWith(base.pathname))throw Error('MIDI must be local');
          file.searchParams.set('v',APP_VERSION);const r=await fetchFile(file);if(!r.ok)throw Error('No MIDI');
          entries[id]={track,score:prepareScore(new Uint8Array(await r.arrayBuffer()),track)};
        } catch { /* One missing alternate must not silence the other usable tracks. */ }
      }
      if(!Object.keys(entries).length)throw Error('No usable MIDI');
      tracks={entries,sets:Object.fromEntries(Object.entries(sets).map(([key,list])=>[key,list.filter(id=>entries[id])]))};status='ready';return tracks;
    })().catch(()=>{status='unavailable';loading=null;return null;});
    return loading;
  }
  function stop(){generation++;clearInterval(expander);expander=null;player?.stop();player=null;audio.stopMusic();current=null;currentTrackId=null;currentScoreDuration=0;if(status==='playing')status='ready';}
  async function play(id){
    if(!settings.sound||(id==='flight'?!settings.bgm:!settings.sfx))return 'cancelled';
    if(current===id&&player?.playing)return 'played';
    stop();const token=generation;
    const library=await preload();
    if(token!==generation)return 'cancelled';
    const ready=await audio.waitForReady();if(token!==generation)return 'cancelled';
    const trackId=id==='flight'?trackForFlight(selectedTracks(library),flightNumber):id;
    if(!library?.entries[trackId]||!ready)return 'unavailable';
    try{await audio.resume();}catch{if(token!==generation)return 'cancelled';status='unavailable';return 'unavailable';}
    if(token!==generation)return 'cancelled';
    const {track,score}=library.entries[trackId],sink=audio.musicClock;
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
      if(token!==generation||!player?.playing)return;
      player.duration=stream.extend(Math.max(score.duration*2,sink.now()-player.startTime+score.duration));stream.trim(player);
    },100);
    current=id;currentTrackId=trackId;currentScoreDuration=stream?score.duration:0;lastTrack=track.title;if(!playedTracks.includes(track.title))playedTracks.push(track.title);status='playing';return 'played';
  }
  function selectedTracks(library=tracks) {return library?.sets[settings.musicSet]?.length?library.sets[settings.musicSet]:library?.sets.current??[];}
  return {
    preload,play,stop,
    setFlightNumber(value){flightNumber=Number.isFinite(value)?Math.max(1,Math.floor(value)):1;},
    setSettings(value){const changed=settings.musicSet!==value.musicSet;settings=value;audio.setMusicGain((settings.bgmVolume??50)/100);if(!settings.sound||(current==='flight'&&(!settings.bgm||changed))||(current==='clear'&&!settings.sfx))stop();},
    reset(){playedTracks=[];lastTrack=null;flightNumber=1;},
    snapshot:()=>({status,playing:Boolean(player?.playing),track:lastTrack,playedTracks:[...playedTracks],current,
      clearTrack:tracks?.entries.clear?.track.title??null,position:player?.position??0,flightNumber,trackId:currentTrackId,
      musicSet:settings.musicSet??'current',flightTracks:selectedTracks().map(id=>tracks.entries[id].track.title),
      loopCount:current==='flight'&&currentScoreDuration?Math.floor((player?.position||0)/currentScoreDuration):0}),
  };
}
