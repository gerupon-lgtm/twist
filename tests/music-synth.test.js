import test from 'node:test';import assert from 'node:assert/strict';
import {createMusicSynth,measureFmVoices} from '../src/music/music-synth.js';
import {validateTrack} from '../src/music/score.js';
const track=()=>validateTrack({file:'test.mid',parts:{1:{waveform:4,volume:64,role:'lead',fmPreset:'lead'},2:{waveform:1,volume:100,role:'bass'},3:{waveform:1,volume:70,role:'chords',fmPreset:'invalid'},10:{volume:80,role:'drums'}}});
test('FM routes lead and bass, preserves drums and reports invalid timbres while applying CC7 once',()=>{
 const reg=[],fm=[];const scc={handle:e=>reg.push(e),resetControllers(){},allNotesOff(){reg.push('allOff');}};
 const f=createMusicSynth({scc,clock:{event:e=>fm.push(e)},track:track(),engine:'fm',score:{events:[],duration:1}});
 assert.equal(track().parts[1].role,'lead');assert.equal(f.snapshot().fmParts.join(','),'1,2');
 f.handle({type:'noteOn',channel:0,note:70,velocity:90});f.handle({type:'cc',channel:0,controller:7,value:100});
 f.handle({type:'noteOn',channel:1,note:40,velocity:100});f.handle({type:'noteOn',channel:2,note:64,velocity:80});f.handle({type:'noteOn',channel:9,note:36,velocity:100});
 assert.equal(reg.length,2);assert.equal(fm.find(w=>w.event.type==='cc').event.value,Math.round(100*64/127));assert.equal(fm.find(w=>w.event.type==='noteOn'&&w.event.channel===0).event.note,70);
 assert.equal(fm.at(-1).presetId,'bass');
 assert.equal(f.snapshot().fallbacks[0].channel,3);f.allNotesOff();assert.equal(fm.at(-1).event.type,'allNotesOff');assert.equal(reg.at(-1),'allOff');
});
test('FM capacity analysis includes release overlap, repeated notes and channel cleanup',()=>{
 const t=track(),events=[{time:0,type:'noteOn',channel:0,note:60,velocity:100},{time:.1,type:'noteOff',channel:0,note:60},{time:.11,type:'noteOn',channel:0,note:62,velocity:100},{time:.12,type:'noteOn',channel:0,note:62,velocity:100},{time:.2,type:'cc',channel:0,controller:123,value:0}];
 assert.equal(measureFmVoices({events,duration:.3},t),2);
 const boundary=[{time:0,type:'noteOn',channel:0,note:60,velocity:100},{time:.1,type:'noteOff',channel:0,note:60},{time:.17,type:'noteOn',channel:0,note:62,velocity:100}];
 for(const sampleRate of [undefined,8000,44100,48000])assert.equal(measureFmVoices({events:boundary},t,{sampleRate}),2);
});
test('SCC facade keeps its old controller/volume sequence and supports old configs',()=>{
 const events=[],scc={handle:e=>events.push(e),resetControllers:()=>events.push('reset'),allNotesOff:()=>events.push('off')};
 const f=createMusicSynth({scc,clock:{event(){throw Error('SCC must not send FM');}},track:track(),engine:'scc'});
 f.resetControllers();f.handle({type:'cc',channel:0,controller:7,value:127});f.handle({type:'pitchBend',channel:0,value:200});
 assert.equal(events[0],'reset');assert.equal(events.at(-2).value,64);assert.equal(events.at(-1).value,200);assert.deepEqual(f.snapshot().fmParts,[]);
});
test('mislabelled channel-ten upper metadata safely retains the drum path instead of sending invalid FM',()=>{
 const track=validateTrack({file:'drums.mid',parts:{10:{volume:80,role:'lead',fmPreset:'lead'}}}),notes=[{type:'noteOn',time:0,channel:9,note:36,velocity:100}],received=[],events=[];
 const synth=createMusicSynth({scc:{handle:e=>received.push(e),resetControllers(){},allNotesOff(){}},clock:{event:e=>events.push(e)},track,score:{events:notes},engine:'fm'});
 synth.handle(notes[0]);assert.deepEqual(received,notes);assert.deepEqual(events,[]);assert.equal(measureFmVoices({events:notes},track),0);assert.equal(synth.snapshot().effectiveEngine,'scc');assert.deepEqual(synth.snapshot().fallbacks,[{channel:10,reason:'non-melodic-channel'}]);
});

test('FM transposition preserves paired notes, bends, other parts and the original score',()=>{
 const raw={file:'test.mid',parts:{1:{role:'lead',fmPreset:'lead',fmTranspose:-12},2:{role:'bass',fmPreset:'bass'}}},t=validateTrack(raw);
 const events=[{type:'noteOn',channel:0,note:69,velocity:100},{type:'pitchBend',channel:0,value:4096},{type:'noteOn',channel:1,note:40,velocity:100},{type:'noteOff',channel:0,note:69},{type:'noteOn',channel:0,note:72,velocity:0}],original=JSON.stringify(events);
 for(const engine of ['fm','scc']){
  const received=[],synth=createMusicSynth({scc:{handle:event=>received.push(event),resetControllers(){},allNotesOff(){}},clock:{event:w=>{if(w.event.type!=='configure')received.push(w.event);}},track:t,engine,score:{events}});
  events.forEach(synth.handle);assert.equal(synth.snapshot().fallbacks.length,0);
  assert.deepEqual(received.map(e=>e.note),engine==='fm'?[57,undefined,40,57,60]:[69,undefined,40,69,72]);
  assert.equal(received[1],events[1]);assert.equal(received[2],events[2]);assert.equal(JSON.stringify(events),original);
 }
 for(const value of [-25,25,1.5,NaN,'-12',null])assert.throws(()=>validateTrack({...raw,parts:{1:{...raw.parts[1],fmTranspose:value}}}));
});

test('a transposition outside MIDI range keeps the original SCC part and reports the fallback',()=>{
 const t=validateTrack({file:'test.mid',parts:{1:{role:'lead',fmPreset:'lead',fmTranspose:-12}}}),events=[{type:'noteOn',channel:0,note:0,velocity:100},{type:'noteOff',channel:0,note:0}],received=[],fm=[];
 for(const score of [{events},undefined]){
  const synth=createMusicSynth({scc:{handle:e=>received.push(e),resetControllers(){},allNotesOff(){}},clock:{event:e=>fm.push(e)},track:t,engine:'fm',score});
  assert.equal(synth.snapshot().effectiveEngine,'scc');assert.deepEqual(synth.snapshot().fallbacks,[{channel:1,reason:'transpose-range-or-score'}]);events.forEach(synth.handle);
 }
 assert.deepEqual(received,[...events,...events]);assert.equal(fm.length,0);
});
