import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { generateMusic,generatedTracks,ROCK_TRILOGY } from '../tools/generate-music.mjs';
import { parseSmf } from '../src/vendor/scc/midi/smf.js';
import { prepareScore,validateTrack,createLoopStream } from '../src/music/score.js';
import { Synth } from '../src/vendor/scc/engine/synth.js';
import { PRESET_NAMES } from '../src/vendor/scc/core/presets.js';

const hash=value=>createHash('sha256').update(value).digest('hex');
const files=generateMusic(),config=generatedTracks();
const oldSnapshots={
  flight:['dea1e94bb504968a84630f5aed6a2d8b216e0673eb7128e0fa641908552810ad','8123971c60ce6026a6895eab99a35c960e8fc8381989e8fcb9cb558f4557cc74'],
  flight2:['571ab6d1d3431b72125b377261c191409bb58c5f314f17c6b8518f2b65ce19b1','9b6da7eba5015e9796ce1e8b26c2e85492e85ff2f7abb57f5d468dc6273cf9d8'],
  brave:['c0d9c7154868510d703884beeb80d9ce701795c51051cc3151977f25ded5b7f6','8d521ab97875835ee931fb4e53f00d8c3f5291c7907d3d15879216dc552aa0cf'],
  rock:['09d4e38b877b891eaa5548d7c7de265b21776d8fd1870f0ee00a8ae323cd201c','4e34b4fb4e97f007d07bb5b253fb5ef9fb043186540bcc8c015e81a4a7421ca9'],
  clear:['55e66ba5786464bafac92dd33c0b0b0b1fc06f7845f161f81a165689f3cba4a2','a750cda6f42c9998640c07ea81780566e3fe72d6d053a520495772893448b00a'],
  comparison:['483c0cb83048fe680fa80db340fb8bd033b7ae1d3a8fbcb708e70b005ed842f3','1090f758d13af539e493026bff6bb721ea4575a3e18f681a47ada8fb65678b0b'],
};
const notes=(score,channel)=>score.events.filter(e=>e.type==='noteOn'&&e.channel===channel);
const beatTime=(song,seconds)=>Math.round(seconds/(Math.round(60000000/song.bpm)/1000000)*480)/480;
function heldNotes(score,channel){
  const active=new Map(),result=[];
  for(const e of score.events){
    if(e.channel!==channel)continue;
    if(e.type==='noteOn')active.set(e.note,e);
    if(e.type==='noteOff'){
      const start=active.get(e.note);
      if(start)result.push({...start,length:e.time-start.time});
      active.delete(e.note);
    }
  }
  return result;
}

test('trilogy generator preserves all six preceding scores and their default configuration',()=>{
  for(const [id,[midiHash,configHash]]of Object.entries(oldSnapshots)){
    const fileId=id==='comparison'?'flight-legacy':id;
    assert.equal(hash(files[fileId]),midiHash,id+' generated MIDI changed');
    assert.equal(hash(JSON.stringify(config[id])),configHash,id+' generated configuration changed');
  }
});

test('generator remains reproducible while published MIDI and settings remain author-editable',async()=>{
  const again=generateMusic();
  for(const song of ROCK_TRILOGY){
    assert.equal(hash(files[song.id]),hash(again[song.id]),song.id+' reproducibility');
  }
  const published=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8'));
  // Release preservation is checked separately against the preceding release.
  // Author MIDI, loop and mix edits must still work without changing the generator.
  for(const id of [...Object.keys(oldSnapshots),...ROCK_TRILOGY.map(song=>song.id)]){
    const track=validateTrack(published[id]);
    const bytes=await readFile(new URL('../public/music/'+track.file,import.meta.url));
    const score=prepareScore(bytes,track);
    assert.ok(score.duration>0&&score.events.some(event=>event.type==='noteOn'),id+' playable published score');
  }
});

test('three scores have their own tempo/key/form and exact rounded-tempo 64-bar loop bounds',()=>{
  assert.deepEqual(ROCK_TRILOGY.map(s=>[s.id,s.title,s.bpm,s.key]),[
    ['steel','鋼翼の鼓動',144,'E minor'],['horizon','黎明の航跡',148,'B minor'],['storm','嵐を越えて',152,'D minor'],
  ]);
  assert.equal(new Set(ROCK_TRILOGY.map(s=>JSON.stringify(s.form))).size,3);
  for(const song of ROCK_TRILOGY){
    const bytes=files[song.id],score=parseSmf(bytes),tempo=Math.round(60000000/song.bpm);
    const tempoPosition=bytes.indexOf(Buffer.from([255,81,3]));
    assert.ok(tempoPosition>=0);assert.equal(bytes.readUIntBE(tempoPosition+3,3),tempo);
    assert.equal(score.division,480);
    assert.equal(song.form.reduce((bars,[,count])=>bars+count,0),64);
    assert.equal(song.beats,64*4);
    assert.equal(score.duration,tempo/1000000*song.beats);
    assert.equal(config[song.id].loop.start,0);assert.equal(config[song.id].loop.end,score.duration);
    assert.ok(score.duration>=101&&score.duration<=107);
    const prepared=prepareScore(bytes,validateTrack(config[song.id]));
    assert.equal(prepared.duration,score.duration);
    assert.ok(score.events.every(e=>Number.isFinite(e.time)&&e.time>=0&&e.time<=score.duration));
  }
});

test('new SCC parts are monophonic with five voices, shared compatible waves and no hanging/repeated keys',()=>{
  for(const song of ROCK_TRILOGY){
    const active=new Set(),byChannel=new Map();let peak=0;
    for(const e of parseSmf(files[song.id]).events){
      const key=e.channel+':'+e.note;
      if(e.type==='noteOn'){
        assert.ok([0,1,2,3,4,9].includes(e.channel),song.id+' unsupported channel');
        assert.ok(!active.has(key),song.id+' repeated active key '+key);
        if(e.channel!==9)assert.equal(byChannel.get(e.channel)||0,0,song.id+' polyphonic SCC part '+e.channel);
        active.add(key);byChannel.set(e.channel,(byChannel.get(e.channel)||0)+1);
      }
      if(e.type==='noteOff'){
        assert.ok(active.has(key),song.id+' orphan note-off '+key);
        active.delete(key);byChannel.set(e.channel,byChannel.get(e.channel)-1);
      }
      peak=Math.max(peak,[...active].filter(k=>!k.startsWith('9:')).length);
      if(e.type==='cc'&&e.controller===123)assert.equal(byChannel.get(e.channel)||0,0,song.id+' relies on all-notes-off cleanup');
    }
    assert.ok(peak>=4&&peak<=5,song.id+' maximum SCC voices');assert.equal(active.size,0,song.id+' hanging notes');
    assert.equal(config[song.id].parts['4'].waveform,1);assert.equal(config[song.id].parts['5'].waveform,1);
    assert.ok(Object.keys(config[song.id].parts).every(part=>['1','2','3','4','5','10'].includes(part)));
  }
});

test('actual SCC allocation keeps all intended notes through three loops and controller/shared-bank resets',()=>{
  for(const song of ROCK_TRILOGY){
    const synth=new Synth({write(){}}),expected=new Set();synth.init();
    for(const [part,settings]of Object.entries(config[song.id].parts)){
      if(part!=='10')synth.setWave(PRESET_NAMES[settings.waveform],Number(part)-1);
    }
    const prepared=prepareScore(files[song.id],validateTrack(config[song.id])),stream=createLoopStream(prepared);
    stream.extend(prepared.duration*3);
    assert.equal(stream.events.filter(e=>e.channel===0&&e.type==='cc'&&e.controller===7&&e.value===127).length,3);
    for(const e of stream.events){
      if(e.channel===9)continue;
      const key=e.channel+':'+e.note;
      if(e.type==='noteOn')expected.add(key);
      if(e.type==='noteOff')expected.delete(key);
      if(e.type==='cc'&&(e.controller===123||e.controller===120))for(const k of expected)if(k.startsWith(e.channel+':'))expected.delete(k);
      synth.handle(e);
      const actual=new Set(synth.voices.active().map(v=>v.part+':'+v.note));
      assert.equal(actual.size,expected.size,song.id+' voice count at '+e.time);
      assert.ok([...expected].every(k=>actual.has(k)),song.id+' stolen/missing note at '+e.time);
    }
    assert.equal(expected.size,0,song.id+' final loop did not release notes');
    assert.ok(synth.parts.every(part=>part.bend===0),song.id+' final controller reset');
  }
});

test('trilogy uses sustained expressive lead, steady eighth bass, short synth replies and accented rock drums',()=>{
  const oldLeadRates=['flight','flight2','brave'].map(id=>notes(parseSmf(files[id]),0).length/48);
  for(const song of ROCK_TRILOGY){
    const score=parseSmf(files[song.id]),lead=heldNotes(score,0),bass=notes(score,3),synth=heldNotes(score,4);
    assert.ok(lead.length/64<Math.min(...oldLeadRates)*.65,song.id+' lead too busy');
    assert.ok(lead.filter(n=>beatTime(song,n.length)>=1.2).length>=lead.length*.45,song.id+' too few held lead tones');
    assert.ok(lead.some(n=>beatTime(song,n.length)>=2.2),song.id+' missing broad sustain');
    assert.ok(lead.some((n,i)=>i&&n.note-lead[i-1].note>=7),song.id+' missing upward leap');
    assert.equal(bass.length,64*8,song.id+' bass count');
    bass.forEach((n,i)=>assert.equal(beatTime(song,n.time),i*.5,song.id+' bass gap'));
    assert.ok(synth.length>0&&synth.length<=32,song.id+' synth density');
    assert.ok(synth.every(n=>beatTime(song,n.length)<=.25),song.id+' synth reply length');
    const bends=score.events.filter(e=>e.type==='pitchBend'&&e.channel===0);
    assert.ok(bends.some(e=>e.value>0)&&bends.some(e=>e.value<0));
    assert.ok(bends.every(e=>Math.abs(e.value)<=1024),song.id+' exaggerated bend');
    assert.equal(bends.at(-1).value,0,song.id+' final bend reset');
    const volumes=score.events.filter(e=>e.type==='cc'&&e.controller===7&&e.channel===0);
    assert.ok(new Set(volumes.map(e=>e.value)).size>=4,song.id+' missing lead envelope');
    assert.ok(score.events.some(e=>e.type==='cc'&&e.channel===3&&e.controller===7),song.id+' bass envelope');
    const drums=notes(score,9);assert.ok(drums.some(n=>n.note===36)&&drums.some(n=>n.note===38)&&drums.some(n=>n.note===42));
    assert.ok(drums.some(n=>n.note===45||n.note===47),song.id+' section fills');
    assert.ok(config[song.id].parts['1'].volume<config.rock.parts['1'].volume);
    assert.ok(config[song.id].parts['10'].volume<config.rock.parts['10'].volume);
  }
});

test('new melodies and accompaniment rhythms are distinct beyond transposition',()=>{
  const melodies=[],leadRhythms=[],guitarRhythms=[],drumRhythms=[];
  for(const song of ROCK_TRILOGY){
    const score=parseSmf(files[song.id]),lead=notes(score,0),first=lead[0].note;
    melodies.push(hash(JSON.stringify(lead.map(n=>n.note-first))));
    leadRhythms.push(hash(JSON.stringify(lead.map(n=>beatTime(song,n.time)))));
    guitarRhythms.push(hash(JSON.stringify(notes(score,1).map(n=>beatTime(song,n.time)))));
    drumRhythms.push(hash(JSON.stringify(notes(score,9).filter(n=>n.note===36).map(n=>beatTime(song,n.time)))));
    // The middle section has fewer attacks than the preceding refrain.
    const middleStart=song.form.slice(0,4).reduce((bars,[,count])=>bars+count,0)*4;
    const before=lead.filter(n=>beatTime(song,n.time)>=middleStart-32&&beatTime(song,n.time)<middleStart).length;
    const middle=lead.filter(n=>beatTime(song,n.time)>=middleStart&&beatTime(song,n.time)<middleStart+32).length;
    assert.ok(middle<before,song.id+' missing section contrast');
  }
  for(const values of [melodies,leadRhythms,guitarRhythms,drumRhythms])assert.equal(new Set(values).size,3);
});

test('old playlist and individual sets survive, new trio and complete seven-song ordering are explicit',()=>{
  assert.deepEqual(config.flightPlaylist,['flight','flight2']);
  assert.deepEqual(config.flightSets.brave,['brave']);assert.deepEqual(config.flightSets.rock,['rock']);
  for(const id of ['steel','horizon','storm'])assert.deepEqual(config.flightSets[id],[id]);
  assert.deepEqual(config.flightSets.newrock,['steel','horizon','storm']);
  assert.deepEqual(config.flightSets.all,['flight','flight2','brave','rock','steel','horizon','storm']);
  for(const ids of Object.values(config.flightSets)){
    assert.ok(ids.length<=8);assert.equal(new Set(ids).size,ids.length);
    assert.ok(ids.every(id=>config[id]&&files[id]));
  }
});
