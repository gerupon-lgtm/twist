import { Synth } from '../vendor/scc/engine/synth.js';
import { SmfPlayer } from '../vendor/scc/engine/smf-player.js';
import { PRESET_NAMES } from '../vendor/scc/core/presets.js';
import { validateTrack,prepareScore,createLoopStream } from './score.js';
import { APP_VERSION } from '../version.js';
import { trackForFlight } from './playlist.js';
import { createAfterburnerLayer } from './ab-layer.js';
import {createMusicCatalog,createLegacyMusicCatalog,resolveFlightSelection} from './catalog.js';
import {createMusicSynth} from './music-synth.js';

export function createMusicPlayer(audio,{fetchFile=fetch,base=new URL('./music/',document.baseURI)}={}){
  let loading=null,catalogLoading=null,catalog=null,config=null,tracks=null,player=null,expander=null,generation=0,current=null,pendingPlay=null,status='idle',lastTrack=null,synthStatus=null;
  let settings={},playedTracks=[],flightNumber=1,currentScoreDuration=0,currentTrackId=null;
  const afterburnerMusic=createAfterburnerLayer(audio);
  async function loadCatalog(){
    if(catalog)return catalog;
    if(!catalogLoading)catalogLoading=(async()=>{
      const url=new URL('tracks.json',base);url.searchParams.set('v',APP_VERSION);
      const response=await fetchFile(url);if(!response.ok)throw Error('No track config');
      const data=await response.json(),value=Object.hasOwn(data,'catalog')?createMusicCatalog(data):createLegacyMusicCatalog(data);
      config=data;catalog=value;return value;
    })().catch(()=>{status='unavailable';catalogLoading=null;return null;});
    return catalogLoading;
  }
  async function preload(){
    if(tracks)return tracks;
    if(!loading)loading=(async()=>{
      const value=await loadCatalog();if(!value)throw Error('No track catalog');
      const entries=Object.create(null);
      for(const id of value.preloadIds){
        try {
          const track=validateTrack(value.byId[id]),file=new URL(track.file,base);
          if(id===value.afterburnerId)Object.assign(track,{bpm:value.byId[id].bpm,minSeconds:value.byId[id].minSeconds});
          if(file.origin!==base.origin||!file.pathname.startsWith(base.pathname))throw Error('MIDI must be local');
          file.searchParams.set('v',APP_VERSION);const r=await fetchFile(file);if(!r.ok)throw Error('No MIDI');
          entries[id]={track,score:prepareScore(new Uint8Array(await r.arrayBuffer()),track)};
        } catch { /* One missing alternate must not silence the other usable tracks. */ }
      }
      if(!Object.keys(entries).length)throw Error('No usable MIDI');
      tracks={entries,flightTempos:config.flightTempos??{}};status='ready';return tracks;
    })().catch(()=>{status='unavailable';loading=null;return null;});
    return loading;
  }
  function stop(){generation++;pendingPlay=null;clearInterval(expander);expander=null;afterburnerMusic.stop();player?.stop();player=null;audio.stopMusic();current=null;currentTrackId=null;currentScoreDuration=0;if(status==='playing')status='ready';}
  async function start(id,{purpose=null,exactId=null}={}){
    const preview=purpose==='preview';
    if(!settings.sound||((preview||id==='flight')?!settings.bgm:!settings.sfx))return 'cancelled';
    if(current===id&&player?.playing&&(!preview||currentTrackId===exactId))return 'played';
    stop();const token=generation,request={id,purpose,exactId,token};pendingPlay=request;
    try {
    const library=await preload();
    if(token!==generation)return 'cancelled';
    if(!library)return 'unavailable';
    const trackId=preview?catalog.previewIds.includes(exactId)?exactId:null:id==='flight'?trackForFlight(selectedTracks(library),flightNumber):id==='clear'?selectedClear():null;
    if(!library.entries[trackId])return 'unavailable';
    const ready=await audio.waitForReady();if(token!==generation)return 'cancelled';
    if(!ready)return 'unavailable';
    try{await audio.resume();}catch{if(token!==generation)return 'cancelled';status='unavailable';return 'unavailable';}
    if(token!==generation)return 'cancelled';
    audio.stopMusic();audio.configure(settings);audio.setMusicGain((settings.bgmVolume??50)/100);
    const {track,score}=library.entries[trackId],sink=audio.createMusicClock?.()??audio.musicClock;
    const synth=new Synth(sink,{drums:true});synth.init();
    for(const [channel,part]of Object.entries(track.parts))if(Number(channel)<=8)synth.setWave(PRESET_NAMES[part.waveform],Number(channel)-1);
    const facade=createMusicSynth({scc:synth,clock:sink,track,trackId,score,engine:settings.musicEngine??'scc'});synthStatus=facade.snapshot;
    const previewLoop=preview&&!catalog.clearIds.includes(trackId)&&trackId!==catalog.afterburnerId&&trackId!==catalog.comparisonId;
    const stream=(id==='flight'||previewLoop)&&track.loop?createLoopStream(score):null;
    player=new SmfPlayer({synth:facade,clock:sink,onEnd:()=>{if(token===generation){clearInterval(expander);expander=null;afterburnerMusic.stop();audio.stopMusic();current=null;status='ready';if(id==='clear'||preview)audio.suspendIfIdle();}}});
    const duration=stream?stream.extend(score.duration*2):score.duration;
    player.load({events:stream?stream.events:score.events,duration});player.play();
    if(id==='flight'&&library.entries[catalog.afterburnerId]){
      const overlay=library.entries[catalog.afterburnerId],value=library.flightTempos[trackId],bpm=Number.isFinite(value)&&value>=30&&value<=300?value:120;
      afterburnerMusic.attach({...overlay,bpm,baseStart:player.startTime});
    }
    if(id==='flight'||stream)expander=setInterval(()=>{
      if(token!==generation||!player?.playing)return;
      if(stream){player.duration=stream.extend(Math.max(score.duration*2,sink.now()-player.startTime+score.duration));stream.trim(player);}
      if(id==='flight')afterburnerMusic.pump();
    },100);
    current=id;currentTrackId=trackId;currentScoreDuration=stream?score.duration:0;lastTrack=track.title;if(!preview&&!playedTracks.includes(track.title))playedTracks.push(track.title);status='playing';return 'played';
    } finally {if(pendingPlay===request)pendingPlay=null;}
  }
  function selection(){return catalog?resolveFlightSelection(settings.musicSet??'current',catalog):{requested:settings.musicSet??'current',ids:[],fallbackReason:null};}
  function selectedTracks(library=tracks) {const ids=selection().ids.filter(id=>library?.entries[id]);return ids.length?ids:(catalog?.legacy?catalog.legacySets.current:catalog?.flightIds??[]).filter(id=>library?.entries[id]);}
  function selectedClear(){const id=settings.clearTrackId??'clear';return catalog?.clearIds.includes(id)&&tracks?.entries[id]?id:catalog?.clearIds.find(key=>tracks?.entries[key])??null;}
  return {
    loadCatalog,preload,play:id=>start(id),playTrack:(id,{purpose}={})=>purpose==='preview'?start('preview',{purpose,exactId:id}):Promise.resolve('cancelled'),stop,
    setAfterburner(value){afterburnerMusic.setRequested(current==='flight'&&Boolean(player?.playing)&&value===true);},
    setFlightNumber(value){flightNumber=Number.isFinite(value)?Math.max(1,Math.floor(value)):1;},
    setSettings(value){const intent=current??pendingPlay?.id,changed=settings.musicSet!==value.musicSet,engineChanged=(settings.musicEngine??'scc')!==(value.musicEngine??'scc'),clearChanged=settings.clearTrackId!==value.clearTrackId;settings={...value};afterburnerMusic.setEnabled(Boolean(settings.sound&&settings.bgm&&settings.abMusic!==false));audio.setMusicGain((settings.bgmVolume??50)/100);if(!settings.sound||engineChanged||(intent==='flight'&&(!settings.bgm||changed))||(intent==='preview'&&!settings.bgm)||(intent==='clear'&&(!settings.sfx||clearChanged)))stop();},
    reset(){playedTracks=[];lastTrack=null;flightNumber=1;afterburnerMusic.reset();},
    snapshot:()=>({status,playing:Boolean(player?.playing),track:lastTrack,playedTracks:[...playedTracks],current,
      clearTrack:tracks?.entries[selectedClear()]?.track.title??null,clearTrackId:selectedClear(),position:player?.position??0,flightNumber,trackId:currentTrackId,
      musicSet:settings.musicSet??'current',flightTracks:selectedTracks().map(id=>tracks.entries[id].track.title),
      requestedMusicSet:selection().requested,effectiveFlightIds:selectedTracks(),fallbackReason:selection().fallbackReason,catalogLegacy:catalog?.legacy??null,synth:synthStatus?structuredClone(synthStatus()):null,
      afterburnerMusic:afterburnerMusic.snapshot(),
      loopCount:currentScoreDuration?Math.floor((player?.position||0)/currentScoreDuration):0}),
  };
}
