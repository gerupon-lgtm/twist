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
  let loading=null,catalogLoading=null,catalog=null,config=null,tracks=null,player=null,expander=null,generation=0,current=null,pendingPlay=null,status='idle',lastTrack=null,synthStatus=null,preloaded=false,afterburnerRequested=false;
  const entryLoads=new Map(),failedEntries=new Set();
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
  async function library(){
    const value=await loadCatalog();if(!value)return null;
    return tracks??={entries:Object.create(null),flightTempos:config.flightTempos??{}};
  }
  async function loadEntry(id){
    const value=await library();if(!value||!Object.hasOwn(catalog.byId,id))return null;
    if(value.entries[id])return value.entries[id];
    if(!entryLoads.has(id)){
      const request=(async()=>{
        const track=validateTrack(catalog.byId[id]),file=new URL(track.file,base);
        if(id===catalog.afterburnerId)Object.assign(track,{bpm:catalog.byId[id].bpm,minSeconds:catalog.byId[id].minSeconds});
        if(file.origin!==base.origin||!file.pathname.startsWith(base.pathname))throw Error('MIDI must be local');
        file.searchParams.set('v',APP_VERSION);const response=await fetchFile(file);if(!response.ok)throw Error('No MIDI');
        const entry={track,score:prepareScore(new Uint8Array(await response.arrayBuffer()),track)};value.entries[id]=entry;failedEntries.delete(id);return entry;
      })().catch(()=>{failedEntries.add(id);return null;}).finally(()=>entryLoads.delete(id));entryLoads.set(id,request);
    }
    return entryLoads.get(id);
  }
  const requestedClear=()=>catalog?.clearIds.includes(settings.clearTrackId??'clear')?settings.clearTrackId??'clear':catalog?.clearIds[0]??null;
  async function warmup(){
    const value=await library();if(!value)return null;
    const ids=[];
    if(settings.sound&&settings.bgm){ids.push(trackForFlight(selection().ids,flightNumber));if(settings.abMusic!==false)ids.push(catalog.afterburnerId);}
    if(settings.sound&&settings.sfx)ids.push(requestedClear());
    await Promise.all([...new Set(ids.filter(Boolean))].map(loadEntry));return value;
  }
  async function preload(){
    if(preloaded)return tracks;
    if(!loading)loading=(async()=>{
      const value=await library();if(!value)throw Error('No track catalog');
      // Keep the full-library API, but never make current playback await it.
      const first=trackForFlight(selection().ids,flightNumber),queue=[...new Set([first,catalog.afterburnerId,requestedClear(),...catalog.preloadIds].filter(Boolean))];let index=0;
      await Promise.all([0,1].map(async()=>{while(index<queue.length)await loadEntry(queue[index++]);}));
      if(!Object.keys(value.entries).length)throw Error('No usable MIDI');
      preloaded=true;if(status!=='playing')status='ready';return value;
    })().catch(()=>{if(status!=='playing')status='unavailable';loading=null;return null;});
    return loading;
  }
  function stop(){generation++;pendingPlay=null;afterburnerRequested=false;clearInterval(expander);expander=null;afterburnerMusic.stop();player?.stop();player=null;audio.stopMusic();current=null;currentTrackId=null;currentScoreDuration=0;if(status==='playing')status='ready';}
  async function start(id,{purpose=null,exactId=null}={}){
    const preview=purpose==='preview';
    if(!settings.sound||((preview||id==='flight')?!settings.bgm:!settings.sfx))return 'cancelled';
    if(current===id&&player?.playing&&(!preview||currentTrackId===exactId))return 'played';
    stop();const token=generation,request={id,purpose,exactId,token};pendingPlay=request;
    try {
    const available=await library();
    if(token!==generation)return 'cancelled';
    if(!available)return 'unavailable';
    const preferred=selectedTracks(),first=preview?catalog.previewIds.includes(exactId)?exactId:null:id==='flight'?trackForFlight(preferred,flightNumber):id==='clear'?requestedClear():null;
    const defaultFlightIds=catalog.legacy?(catalog.legacySets.current??[]):catalog.flightIds;
    const candidates=preview?[first]:id==='flight'?[first,...preferred,...defaultFlightIds]:id==='clear'?[first,...catalog.clearIds]:[];
    let trackId=null;
    for(const candidate of new Set(candidates.filter(Boolean))){const entry=await loadEntry(candidate);if(token!==generation)return 'cancelled';if(entry){trackId=candidate;break;}}
    if(!trackId)return 'unavailable';
    const ready=await audio.waitForReady();if(token!==generation)return 'cancelled';
    if(!ready)return 'unavailable';
    try{await audio.resume();}catch{if(token!==generation)return 'cancelled';status='unavailable';return 'unavailable';}
    if(token!==generation)return 'cancelled';
    audio.stopMusic();audio.configure(settings);audio.setMusicGain((settings.bgmVolume??50)/100);
    const {track,score}=available.entries[trackId],sink=audio.createMusicClock?.()??audio.musicClock;
    const synth=new Synth(sink,{drums:true});synth.init();
    for(const [channel,part]of Object.entries(track.parts))if(Number(channel)<=8)synth.setWave(PRESET_NAMES[part.waveform],Number(channel)-1);
    const facade=createMusicSynth({scc:synth,clock:sink,track,trackId,score,engine:settings.musicEngine??'scc'});synthStatus=facade.snapshot;
    const previewLoop=preview&&!catalog.clearIds.includes(trackId)&&trackId!==catalog.afterburnerId&&trackId!==catalog.comparisonId;
    const stream=(id==='flight'||previewLoop)&&track.loop?createLoopStream(score):null;
    player=new SmfPlayer({synth:facade,clock:sink,onEnd:()=>{if(token===generation){clearInterval(expander);expander=null;afterburnerMusic.stop();audio.stopMusic();current=null;status='ready';if(id==='clear'||preview)audio.suspendIfIdle();}}});
    const duration=stream?stream.extend(score.duration*2):score.duration;
    player.load({events:stream?stream.events:score.events,duration});player.play();
    if(id==='flight'||stream)expander=setInterval(()=>{
      if(token!==generation||!player?.playing)return;
      if(stream){player.duration=stream.extend(Math.max(score.duration*2,sink.now()-player.startTime+score.duration));stream.trim(player);}
      if(id==='flight')afterburnerMusic.pump();
    },100);
    current=id;currentTrackId=trackId;currentScoreDuration=stream?score.duration:0;lastTrack=track.title;if(!preview&&!playedTracks.includes(track.title))playedTracks.push(track.title);status='playing';
    if(id==='flight'&&catalog.afterburnerId){
      const owner=player,value=available.flightTempos[trackId],bpm=Number.isFinite(value)&&value>=30&&value<=300?value:120;
      const attach=overlay=>{if(!overlay||token!==generation||player!==owner||current!=='flight')return;
        afterburnerMusic.attach({...overlay,bpm,baseStart:owner.startTime});afterburnerMusic.setRequested(afterburnerRequested);};
      if(available.entries[catalog.afterburnerId])attach(available.entries[catalog.afterburnerId]);
      else void loadEntry(catalog.afterburnerId).then(attach);
    }
    return 'played';
    } finally {if(pendingPlay===request)pendingPlay=null;}
  }
  function selection(){return catalog?resolveFlightSelection(settings.musicSet??'current',catalog):{requested:settings.musicSet??'current',ids:[],fallbackReason:null};}
  function selectedTracks() {const ids=selection().ids.filter(id=>!failedEntries.has(id));return ids.length?ids:(catalog?.legacy?catalog.legacySets.current:catalog?.flightIds??[]).filter(id=>!failedEntries.has(id));}
  function selectedClear(){const id=settings.clearTrackId??'clear';return catalog?.clearIds.includes(id)&&tracks?.entries[id]?id:catalog?.clearIds.find(key=>tracks?.entries[key])??null;}
  return {
    loadCatalog,preload,warmup,play:id=>start(id),playTrack:(id,{purpose}={})=>purpose==='preview'?start('preview',{purpose,exactId:id}):Promise.resolve('cancelled'),stop,
    setAfterburner(value){afterburnerRequested=current==='flight'&&Boolean(player?.playing)&&value===true;afterburnerMusic.setRequested(afterburnerRequested);},
    setFlightNumber(value){flightNumber=Number.isFinite(value)?Math.max(1,Math.floor(value)):1;},
    setSettings(value){const intent=current??pendingPlay?.id,changed=settings.musicSet!==value.musicSet,engineChanged=(settings.musicEngine??'scc')!==(value.musicEngine??'scc'),clearChanged=settings.clearTrackId!==value.clearTrackId;settings={...value};afterburnerMusic.setEnabled(Boolean(settings.sound&&settings.bgm&&settings.abMusic!==false));audio.setMusicGain((settings.bgmVolume??50)/100);if(!settings.sound||engineChanged||(intent==='flight'&&(!settings.bgm||changed))||(intent==='preview'&&!settings.bgm)||(intent==='clear'&&(!settings.sfx||clearChanged)))stop();},
    reset(){playedTracks=[];lastTrack=null;flightNumber=1;afterburnerMusic.reset();},
    snapshot:()=>({status,playing:Boolean(player?.playing),track:lastTrack,playedTracks:[...playedTracks],current,
      clearTrack:tracks?.entries[selectedClear()]?.track.title??null,clearTrackId:selectedClear(),position:player?.position??0,flightNumber,trackId:currentTrackId,
      musicSet:settings.musicSet??'current',flightTracks:selectedTracks().map(id=>catalog.byId[id].title),
      requestedMusicSet:selection().requested,effectiveFlightIds:selectedTracks(),fallbackReason:selection().fallbackReason,catalogLegacy:catalog?.legacy??null,synth:synthStatus?structuredClone(synthStatus()):null,
      afterburnerMusic:afterburnerMusic.snapshot(),
      loopCount:currentScoreDuration?Math.floor((player?.position||0)/currentScoreDuration):0}),
  };
}
