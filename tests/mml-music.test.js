import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { generateMusic,generatedTracks,MML_SONGS } from '../tools/generate-music.mjs';
import { parseMmlFragment,MML_FRAGMENTS } from '../tools/mml-fragments.mjs';
import { parseSmf } from '../src/vendor/scc/midi/smf.js';
import { prepareScore,validateTrack,createLoopStream } from '../src/music/score.js';
import { Synth } from '../src/vendor/scc/engine/synth.js';
import { PRESET_NAMES } from '../src/vendor/scc/core/presets.js';

const files=generateMusic(),config=generatedTracks();
const hash=value=>createHash('sha256').update(value).digest('hex');
const beat=(song,time)=>Math.round(time/(Math.round(60000000/song.bpm)/1000000)*480)/480;
const notes=(score,channel)=>score.events.filter(event=>event.type==='noteOn'&&event.channel===channel);

test('author MML vocabulary keeps rests, accidentals, dotted lengths and octave direction',()=>{
  const examples={
    ignitionVerse:[7,[62,69,67,65,64,60,62],[0,1,2,2.5,3,4,5]],
    ignitionChorus:[9,[74,76,78,81,79,78,76],[0,1.5,2,3,4,7,8]],
    advanceRiff:[7,[40,40,40,40,43,45,47,45,43,40],[0,1,1.5,2.5,3,3.5,4,5,5.5,6]],
    advanceMarch:[4,Array(8).fill(60),[0,1,1.5,2,3,3.25,3.5,3.75]],
    advanceBrass:[7,[64,71,69,67,66,62,64],[0,1,2,2.5,3,5,6]],
    overdriveArp:[4,[81,72,76,81,76,72,81,72,81,74,77,81,77,74,81,74],Array.from({length:16},(_,i)=>i*.25)],
    overdriveChorus:[8,[81,83,84,83,79,76,81],[0,1.5,2,3,4,6,7]],
  };
  for(const [id,[length,pitches,onsets]]of Object.entries(examples)){
    const result=parseMmlFragment(MML_FRAGMENTS[id]);
    assert.equal(result.beats,length,id+' length');
    assert.deepEqual(result.notes.map(n=>n.pitch),pitches,id+' note order');
    assert.deepEqual(result.notes.map(n=>n.beat),onsets,id+' rhythm');
  }
  assert.deepEqual(parseMmlFragment(MML_FRAGMENTS.ignitionBass).notes.map(n=>n.pitch),[38,46,36,38].flatMap(pitch=>Array(8).fill(pitch)));
  assert.deepEqual(parseMmlFragment(MML_FRAGMENTS.overdriveBass).notes.map(n=>n.pitch),Array(32).fill(45));
  assert.equal(parseMmlFragment('O4 L8 c# d- r16 >c< c.').beats,2.5);
  for(const source of ['O4 L3 c','O9 c','O4 c & c','O4 x','L c'])assert.throws(()=>parseMmlFragment(source));
});

test('source excerpts occur unchanged in the expanded arrangements',()=>{
  const placements={
    ignition:[[0,0,'ignitionVerse'],[0,96,'ignitionChorus'],[3,0,'ignitionBass']],
    advance:[[1,0,'advanceRiff'],[0,96,'advanceBrass']],
    overdrive:[[1,0,'overdriveArp'],[3,0,'overdriveBass'],[0,112,'overdriveChorus']],
  };
  for(const song of MML_SONGS){
    const score=parseSmf(files[song.id]);
    for(const [channel,start,id]of placements[song.id]){
      const source=parseMmlFragment(MML_FRAGMENTS[id]);
      const actual=notes(score,channel).filter(n=>beat(song,n.time)>=start&&beat(song,n.time)<start+source.beats);
      assert.deepEqual(actual.map(n=>[beat(song,n.time)-start,n.note]),source.notes.map(n=>[n.beat,n.pitch]),song.id+' '+id);
    }
  }
  const advance=MML_SONGS.find(song=>song.id==='advance');
  assert.deepEqual(notes(parseSmf(files.advance),9).filter(n=>n.note===38&&beat(advance,n.time)<4).map(n=>beat(advance,n.time)),[0,1,1.5,2,3,3.25,3.5,3.75]);
});

test('new arrangements have exact specified tempos, full forms and 90-110 second loops',()=>{
  assert.deepEqual(MML_SONGS.map(s=>[s.id,s.title,s.bpm,s.key]),[
    ['ignition','Ignition Sky',165,'D minor / D major'],
    ['advance','Steel Advance',145,'E minor'],
    ['overdrive','Overdrive Horizon',175,'A minor'],
  ]);
  for(const song of MML_SONGS){
    const bytes=files[song.id],score=parseSmf(bytes),tempo=Math.round(60000000/song.bpm);
    const marker=bytes.indexOf(Buffer.from([255,81,3]));
    assert.equal(bytes.readUIntBE(marker+3,3),tempo,song.id+' tempo');
    assert.equal(score.division,480);
    assert.equal(song.form.reduce((bars,[,count])=>bars+count,0)*4,song.beats);
    assert.equal(song.beats,song.id==='overdrive'?288:256);
    assert.equal(score.duration,tempo/1000000*song.beats);
    assert.ok(score.duration>=90&&score.duration<=110,song.id+' duration');
    assert.equal(config[song.id].loop.start,0);assert.equal(config[song.id].loop.end,score.duration);
    assert.equal(config.flightTempos[song.id],song.bpm);
    assert.ok(score.events.every(e=>Number.isFinite(e.time)&&e.time>=0&&e.time<=score.duration));
  }
});

test('expanded scores are reproducible while published MIDI and mix remain author-editable',async()=>{
  const again=generateMusic();
  const published=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
  for(const id of [...MML_SONGS.map(song=>song.id),'afterburner']){
    assert.equal(hash(files[id]),hash(again[id]),id+' reproducibility');
    const track=validateTrack(published[id]);
    const score=prepareScore(await readFile(new URL('../public/music/'+track.file,import.meta.url)),track);
    assert.ok(score.duration>0&&score.events.some(e=>e.type==='noteOn'),id+' valid published score');
  }
});

test('new SCC notes release without overlap or cleanup dependence, and fit compatible shared waves',()=>{
  for(const song of MML_SONGS){
    const active=new Set(),channels=new Map();let peak=0;
    for(const e of parseSmf(files[song.id]).events){
      const key=e.channel+':'+e.note;
      if(e.type==='noteOn'){
        assert.ok([0,1,3,4,9].includes(e.channel),song.id+' unexpected part');
        assert.ok(!active.has(key),song.id+' repeated active note '+key);
        if(e.channel!==9)assert.equal(channels.get(e.channel)||0,0,song.id+' overlapping SCC part');
        active.add(key);channels.set(e.channel,(channels.get(e.channel)||0)+1);
      }
      if(e.type==='noteOff'){
        assert.ok(active.has(key),song.id+' orphan note-off '+key);
        active.delete(key);channels.set(e.channel,channels.get(e.channel)-1);
      }
      if(e.type==='cc'&&e.controller===123)assert.equal(channels.get(e.channel)||0,0,song.id+' all-notes-off cleanup dependency');
      peak=Math.max(peak,[...active].filter(key=>!key.startsWith('9:')).length);
    }
    assert.equal(active.size,0,song.id+' hanging note');
    assert.equal(peak,4,song.id+' SCC voice peak');
    assert.equal(config[song.id].parts['4'].waveform,1);assert.equal(config[song.id].parts['5'].waveform,1);
  }
});

test('real SCC allocator preserves every intended note across three loops and bank/controller resets',()=>{
  for(const song of MML_SONGS){
    const synth=new Synth({write(){}}),expected=new Set();synth.init();
    for(const [part,settings]of Object.entries(config[song.id].parts))if(part!=='10')synth.setWave(PRESET_NAMES[settings.waveform],Number(part)-1);
    const prepared=prepareScore(files[song.id],validateTrack(config[song.id])),stream=createLoopStream(prepared);stream.extend(prepared.duration*3);
    for(const e of stream.events){
      if(e.channel===9)continue;
      const key=e.channel+':'+e.note;
      if(e.type==='noteOn')expected.add(key);
      if(e.type==='noteOff')expected.delete(key);
      if(e.type==='cc'&&(e.controller===120||e.controller===123))for(const key of expected)if(key.startsWith(e.channel+':'))expected.delete(key);
      synth.handle(e);
      const actual=new Set(synth.voices.active().map(v=>v.part+':'+v.note));
      assert.equal(actual.size,expected.size,song.id+' voice count at '+e.time);
      assert.ok([...expected].every(key=>actual.has(key)),song.id+' stolen note at '+e.time);
    }
    assert.equal(expected.size,0,song.id+' loop-end notes');
    assert.ok(synth.parts.every(part=>part.bend===0),song.id+' loop-end bend');
  }
});

test('three arrangements differ in melody, accompaniment and drums, with expressive guitar envelopes',()=>{
  const fingerprints=[[],[],[]];
  for(const song of MML_SONGS){
    const score=parseSmf(files[song.id]),lead=notes(score,0),guitarPart=song.id==='overdrive'?0:1;
    fingerprints[0].push(hash(JSON.stringify(lead.map(n=>[beat(song,n.time),n.note-lead[0].note]))));
    fingerprints[1].push(hash(JSON.stringify(notes(score,1).map(n=>beat(song,n.time)))));
    fingerprints[2].push(hash(JSON.stringify(notes(score,9).filter(n=>n.note===36).map(n=>beat(song,n.time)))));
    assert.ok(score.events.some(e=>e.channel===guitarPart&&e.type==='pitchBend'&&e.value!==0),song.id+' guitar bend');
    assert.ok(new Set(score.events.filter(e=>e.channel===guitarPart&&e.type==='cc'&&e.controller===7).map(e=>e.value)).size>=3,song.id+' guitar envelope');
    if(song.id!=='overdrive')assert.equal(config[song.id].parts['1'].waveform,4,song.id+' pulse brass');
  }
  for(const values of fingerprints)assert.equal(new Set(values).size,3);
  assert.ok(config.overdrive.parts['2'].volume<config.overdrive.parts['1'].volume*.5,'arpeggio underneath guitar lead');
});

test('AB Pulse is only PSG percussion: four bars, sixteen beats, 120 BPM, eight seconds',()=>{
  const score=parseSmf(files.afterburner),track=config.afterburner;
  assert.equal(score.duration,8);assert.deepEqual(track.loop,{start:0,end:8});
  assert.equal(track.bpm,120);assert.equal(track.minSeconds,3);
  assert.deepEqual(Object.keys(track.parts),['10']);
  assert.ok(score.events.every(e=>e.channel===9));
  assert.ok(score.events.filter(e=>e.type==='noteOn').every(e=>[36,38,42,45].includes(e.note)));
  assert.equal(score.events.filter(e=>e.type==='noteOn'&&e.note===42).length,64);
  assert.ok(!Object.values(config.flightSets).flat().includes('afterburner'));
});
