import test from 'node:test';
import assert from 'node:assert/strict';
import {validateTrack} from '../src/music/score.js';
import {readFileSync} from 'node:fs';
import {createMusicSynth} from '../src/music/music-synth.js';
import {Synth,CUSTOM,noteToPeriod} from '../src/vendor/scc/engine/synth.js';
import {PRESET_NAMES} from '../src/vendor/scc/core/presets.js';
import {channelAddr,waveAddr} from '../src/vendor/scc/core/scc-ext-registers.js';
import {SCC_GUITAR_TIMBRE,SCC_GUITAR_TRACK_IDS,SCC_GUITAR_WAVE} from '../src/music/scc-guitar-tone.js';

test('an explicit SCC guitar timbre survives score validation while FM and part volume stay unchanged',()=>{
  const part={waveform:4,volume:99,role:'lead',fmPreset:'lead',sccTimbre:'distortion-guitar-v1'};
  const raw={file:'ignition.mid',title:'Ignition Sky',parts:{1:part,4:{waveform:1,volume:79,role:'bass',fmPreset:null}},loop:{start:0,end:93.090816}};
  const before=JSON.stringify(raw),track=validateTrack(raw);
  assert.deepEqual(track.parts[1],part);
  assert.deepEqual(track.parts[4],raw.parts[4]);assert.deepEqual(track.loop,raw.loop);assert.equal(JSON.stringify(raw),before);
});

const makeTrack=(tag=SCC_GUITAR_TIMBRE)=>validateTrack({file:'test.mid',parts:{
  1:{waveform:1,volume:99,role:'lead',fmPreset:'lead',sccTimbre:tag},
  2:{waveform:1,volume:96,role:'chords',fmPreset:'chords'},
  3:{waveform:1,volume:87,role:'chords',fmPreset:'chords'},
  4:{waveform:1,volume:92,role:'bass',fmPreset:null},
  5:{waveform:1,volume:56,role:'lead',fmPreset:'lead'},
  10:{waveform:0,volume:80,role:'drums',fmPreset:null},
}});
function instrument({track=makeTrack(),trackId='rock',engine='scc',fmClock=true}={}){
  const writes=[],registers=new Map(),fm=[],clock={sampleRate:48000,write:(address,value)=>{writes.push([address,value]);registers.set(address,value);}};
  if(fmClock)clock.event=event=>fm.push(event);
  const scc=new Synth(clock,{drums:true});scc.init();
  for(const [part,settings]of Object.entries(track.parts))if(Number(part)<=8)scc.setWave(PRESET_NAMES[settings.waveform],Number(part)-1);
  const facade=createMusicSynth({scc,clock,track,trackId,engine,score:{events:[],duration:1}});facade.resetControllers();
  return {scc,facade,writes,registers,fm};
}
const voices=scc=>scc.voices.active().filter(voice=>voice.part!==0).map(({part,note,velocity,ch,startedAt})=>({part,note,velocity,ch,startedAt}));
const bankWaves=({scc,registers})=>[...new Set(voices(scc).map(voice=>scc.channelBank[voice.ch]))].map(bank=>({bank,wave:Array.from({length:32},(_,i)=>registers.get(waveAddr(bank,i)))}));

test('SCC metadata keeps every original field except six guitar tags and the explicitly revised FM assignments',()=>{
  const current=JSON.parse(readFileSync(new URL('../public/music/tracks.json',import.meta.url))),old=JSON.parse(readFileSync(new URL('../public/versions/0.1.33/music/tracks.json',import.meta.url)));
  for(const id of SCC_GUITAR_TRACK_IDS){assert.equal(current[id].parts[1].sccTimbre,SCC_GUITAR_TIMBRE,id);delete current[id].parts[1].sccTimbre;}
  assert.equal(current.overdrive.parts[2].fmVolume,90);delete current.overdrive.parts[2].fmVolume;
  for(const data of [current,old])for(const track of Object.values(data))if(track?.file)for(const part of Object.values(track.parts))delete part.fmPreset;
  assert.deepEqual(current,old);
});

test('the 32-sample guitar cycle is centered and leaves sample and level margin',()=>{
  assert.equal(SCC_GUITAR_WAVE.length,32);assert.ok(Object.isFrozen(SCC_GUITAR_WAVE));
  assert.ok(SCC_GUITAR_WAVE.every(value=>Number.isInteger(value)&&value>=-120&&value<=120));
  assert.equal(SCC_GUITAR_WAVE.reduce((sum,value)=>sum+value,0),0);
  const rms=Math.sqrt(SCC_GUITAR_WAVE.reduce((sum,value)=>sum+value*value,0)/32);
  assert.ok(rms>=60&&rms<=95,`wave RMS ${rms}`);
});

test('missing, unknown, non-target and wrong-part tags retain the original SCC register sequence',()=>{
  const events=[{type:'noteOn',channel:0,note:72,velocity:96},{type:'cc',channel:0,controller:7,value:81},{type:'pitchBend',channel:0,value:4096},{type:'noteOn',channel:9,note:36,velocity:100},{type:'noteOff',channel:0,note:72}];
  const baseline=instrument({track:makeTrack(null)});for(const event of events)baseline.facade.handle(event);baseline.facade.allNotesOff();
  for(const [name,options]of [
    ['missing id',{trackId:null}],
    ['not approved',{trackId:'brave'}],
    ['unknown tag',{track:makeTrack('unknown-guitar')}],
    ['missing tag',{track:makeTrack(null)}],
    ['wrong part',{track:validateTrack({file:'test.mid',parts:{...makeTrack(null).parts,2:{...makeTrack(null).parts[2],sccTimbre:SCC_GUITAR_TIMBRE}}})}],
  ]){
    const actual=instrument(options);for(const event of events)actual.facade.handle(event);actual.facade.allNotesOff();
    assert.deepEqual(actual.writes,baseline.writes,name);assert.equal(actual.facade.snapshot().sccTimbre,undefined,name);
  }
});

test('a shared guitar bank keeps all other notes, allocation and waveform unchanged, then recovers its custom tone',()=>{
  const baseline=instrument({track:makeTrack(null)}),guitar=instrument();
  const events=[
    {type:'noteOn',channel:1,note:50,velocity:96},
    {type:'noteOn',channel:2,note:57,velocity:87},
    {type:'noteOn',channel:3,note:38,velocity:92},
    {type:'noteOn',channel:0,note:72,velocity:96},
    {type:'noteOn',channel:4,note:67,velocity:56},
    {type:'noteOff',channel:4,note:67},
  ];
  for(const [index,event]of events.entries()){
    baseline.facade.handle(event);guitar.facade.handle(event);
    assert.deepEqual(voices(guitar.scc),voices(baseline.scc),`other voices at event ${index}`);
    assert.deepEqual(bankWaves(guitar),bankWaves(baseline),`other bank waves at event ${index}`);
    if(index===3)assert.equal(guitar.scc.waveName,CUSTOM);
    if(index===4)assert.equal(guitar.scc.waveName,'saw');
  }
  assert.equal(guitar.scc.waveName,CUSTOM);assert.equal(guitar.scc.customVersion,1);
  baseline.facade.allNotesOff();guitar.facade.allNotesOff();
  assert.equal(guitar.scc.voices.active().length,0);assert.equal(guitar.scc.waveName,'saw');
});

test('CC7 and rapid pitch bends preserve the old scaling and two-semitone range without waveform resends',()=>{
  const baseline=instrument({track:makeTrack(null)}),guitar=instrument();
  for(const row of [baseline,guitar])row.facade.handle({type:'noteOn',channel:0,note:75,velocity:101});
  const baseAt=baseline.writes.length,guitarAt=guitar.writes.length;
  const events=[{type:'cc',channel:0,controller:7,value:100},...Array.from({length:200},(_,i)=>({type:'pitchBend',channel:0,value:i%2?4096:-8192}))];
  for(const event of events){baseline.facade.handle(event);guitar.facade.handle(event);}
  assert.deepEqual(guitar.writes.slice(guitarAt),baseline.writes.slice(baseAt));
  assert.equal(guitar.scc.parts[0].cc7,Math.round(100*99/127));assert.equal(guitar.scc.parts[0].bend,1);
  for(const [bend,note]of [[-8192,73],[4096,76],[0,75]]){
    guitar.facade.handle({type:'pitchBend',channel:0,value:bend});
    const address=channelAddr(guitar.scc.voices.active()[0].ch),period=guitar.registers.get(address.freqLo)|(guitar.registers.get(address.freqHi)<<8);
    assert.equal(period,noteToPeriod(note));
  }
  assert.equal(guitar.scc.customVersion,1);
});

test('both immediate channel-stop messages restore the original tone and permit a clean next phrase',()=>{
  const guitar=instrument();
  for(const controller of [120,123]){
    guitar.facade.handle({type:'noteOn',channel:0,note:72,velocity:96});assert.equal(guitar.scc.waveName,CUSTOM);
    guitar.facade.handle({type:'cc',channel:0,controller,value:0});
    assert.equal(guitar.scc.voices.active().length,0);assert.equal(guitar.scc.waveName,'saw');
  }
  guitar.facade.handle({type:'noteOn',channel:0,note:74,velocity:96});guitar.facade.allNotesOff();guitar.facade.allNotesOff();
  assert.equal(guitar.scc.voices.active().length,0);assert.equal(guitar.scc.waveName,'saw');assert.equal(guitar.scc.customVersion,1);
});

test('SCC guitar metadata does not alter FM preset, routing or fallback sound',()=>{
  for(const fmClock of [true,false]){
    const a=instrument({track:makeTrack(null),engine:'fm',fmClock}),b=instrument({engine:'fm',fmClock});
    // Both real FM routing and an unavailable-clock fallback retain the old
    // SCC registers and the same upper-part messages.
    const events=[{type:'noteOn',channel:0,note:73,velocity:99},{type:'pitchBend',channel:0,value:-8192},{type:'cc',channel:0,controller:7,value:80},{type:'noteOn',channel:3,note:38,velocity:99},{type:'noteOn',channel:9,note:36,velocity:90}];
    for(const event of events){a.facade.handle(event);b.facade.handle(event);}
    a.facade.allNotesOff();b.facade.allNotesOff();
    assert.deepEqual(b.writes,a.writes);assert.deepEqual(b.fm,a.fm);assert.equal(b.facade.snapshot().sccTimbre,undefined);
    assert.deepEqual(b.facade.snapshot().fmParts,a.facade.snapshot().fmParts);
  }
});
