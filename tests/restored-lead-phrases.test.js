import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {parseSmf} from '../src/vendor/scc/midi/smf.js';
import {readMidiChunks,arrangeGuitarLead} from '../tools/arrange-guitar-leads.mjs';
async function notes(path,bpm){const events=parseSmf(await readFile(new URL(path,import.meta.url))).events,beat=Math.round(60e6/bpm)/1e6,held=new Map(),rows=[];for(const e of events.filter(e=>e.channel===0)){if(e.type==='noteOn')held.set(e.note,e);else if(e.type==='noteOff'){const on=held.get(e.note);assert.ok(on);held.delete(e.note);rows.push({note:on.note,velocity:on.velocity,start:Math.round(on.time/beat*480),end:Math.round(e.time/beat*480)});}}assert.equal(held.size,0);return rows;}
for(const [id,bpm,bars]of [['overdrive',175,[44,45,48,52]],['ignition',165,[42]]])test(id+' reported Track 1 passages retain original notes, rhythm and rests',async()=>{
 const original=await notes('../public/versions/0.1.33/music/'+id+'.mid',bpm),current=await notes('../public/music/'+id+'.mid',bpm);
 for(const bar of bars){const inside=n=>n.start<bar*1920&&n.end>(bar-1)*1920;assert.deepEqual(current.filter(inside),original.filter(inside),'bar '+bar);}
});
test('Ignition FM lead uses Overdrive synth tone and level without changing its register or SCC setup',async()=>{
 const tracks=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url))),a=tracks.ignition.parts[1],b=tracks.overdrive.parts[1];
 assert.equal(a.fmPreset,'minimoog-lead');assert.equal(a.fmPreset,b.fmPreset);assert.equal(a.fmVolume??a.volume,b.fmVolume??b.volume);
 assert.equal(a.fmTranspose,undefined);assert.equal(a.waveform,4);assert.equal(a.volume,99);assert.equal(a.sccTimbre,'distortion-guitar-v1');
 const old=JSON.parse(await readFile(new URL('../public/versions/0.1.61/music/tracks.json',import.meta.url)));tracks.ignition.parts[1].fmPreset=old.ignition.parts[1].fmPreset;assert.deepEqual(tracks,old);
});
test('published phrase repair preserves other lead events, accompaniment and drums from the prior release',async()=>{
 for(const [id,bpm,bars]of [['overdrive',175,[44,45,48,52]],['ignition',165,[42]]]){
  const beforePath='../public/versions/0.1.61/music/'+id+'.mid',afterPath='../public/music/'+id+'.mid',before=await readFile(new URL(beforePath,import.meta.url)),after=await readFile(new URL(afterPath,import.meta.url)),beat=Math.round(60e6/bpm)/1e6;
  const leadChunk=arrangeGuitarLead(await readFile(new URL('../public/versions/0.1.33/music/'+id+'.mid',import.meta.url)),id).leadChunk,a=readMidiChunks(before),b=readMidiChunks(after);assert.ok(a.header.equals(b.header));
  for(let i=0;i<a.chunks.length;i++)if(i!==leadChunk)assert.ok(a.chunks[i].bytes.equals(b.chunks[i].bytes),id+' accompaniment chunk '+i);
  const all=[...await notes(beforePath,bpm),...await notes(afterPath,bpm)],affected=n=>bars.some(bar=>n.start<bar*1920&&n.end>(bar-1)*1920),windows=all.filter(affected).map(n=>[n.start,n.end]);
  const outside=bytes=>parseSmf(bytes).events.filter(e=>e.channel===0).map(e=>{const tick=Math.round(e.time/beat*480);return {...e,time:tick};}).filter(e=>!windows.some(([start,end])=>e.time>=start&&e.time<=end));
  assert.deepEqual(outside(after),outside(before),id+' unrelated lead events');
 }
});
