import test from 'node:test';import assert from 'node:assert/strict';import {readFile,mkdtemp,copyFile,readdir,rm,writeFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {parseSmf} from '../src/vendor/scc/midi/smf.js';
import {fileURLToPath} from 'node:url';
import {arrangeGuitarLead,arrangeOverdriveCadence,readMidiChunks,writeOverdriveCadence,checkGuitarArrangements} from '../tools/arrange-guitar-leads.mjs';
const notePairs=events=>{const held=new Map(),notes=[];for(const e of events){const key=e.channel+':'+e.note;if(e.type==='noteOn')held.set(key,e);else if(e.type==='noteOff'){const on=held.get(key);assert.ok(on,'matching noteOn');held.delete(key);notes.push({on,off:e});}}assert.equal(held.size,0);return notes;};
test('published Overdrive bar 68 matches the approved two half-notes and E pedal cadence',async()=>{
 const config=JSON.parse(await readFile(new URL('../public/music/tracks.json',import.meta.url),'utf8')),track=config.overdrive;
 const song=parseSmf(await readFile(new URL('../public/music/overdrive.mid',import.meta.url))),beat=track.loop.end/288,start=268*beat,half=270*beat,end=272*beat,epsilon=beat/1000;
 const notes=notePairs(song.events).filter(p=>p.on.time>=start-epsilon&&p.on.time<end-epsilon),lead=notes.filter(p=>p.on.channel===0).sort((a,b)=>a.on.time-b.on.time);
 assert.deepEqual(lead.map(p=>p.on.note),[81,80]);
 for(let i=0;i<2;i++){assert.ok(Math.abs(lead[i].on.time-(i?half:start))<epsilon);assert.ok(Math.abs(lead[i].off.time-lead[i].on.time-2*beat)<epsilon);}
 assert.deepEqual(notes.filter(p=>p.on.channel===3).map(p=>p.on.note),Array(8).fill(40));
 for(const [from,to,expected]of [[start,half,[0,4,9]],[half,end,[4,8,11]]]){
  const classes=[...new Set(notes.filter(p=>[1,4].includes(p.on.channel)&&p.on.time>=from-epsilon&&p.on.time<to-epsilon).map(p=>p.on.note%12))].sort((a,b)=>a-b);
  assert.deepEqual(classes,expected);
 }
 assert.equal(track.fmTranspose,undefined);assert.equal(track.parts[1].fmTranspose,-12);
});
test('bar 68 edit preserves every outside event, all drum bytes and the original input',async()=>{
 const original=arrangeGuitarLead(await readFile(new URL('../public/versions/0.1.33/music/overdrive.mid',import.meta.url)),'overdrive').bytes,copy=Buffer.from(original),result=arrangeOverdriveCadence(original),before=parseSmf(original),after=parseSmf(result.bytes);
 assert.ok(original.equals(copy));assert.equal(after.duration,before.duration);assert.equal(after.division,before.division);
 const beat=98.742816/288,start=268*beat,end=272*beat,epsilon=beat/1000;
 const outside=e=>e.time<start-epsilon||e.time>=end-epsilon;
 const normalize=rows=>rows.map(e=>({...e,time:Math.round(e.time*1e9)/1e9}));
 assert.deepEqual(normalize(after.events.filter(e=>outside(e)&&!(e.type==='noteOff'&&e.channel===0&&e.note===80&&Math.abs(e.time-end)<epsilon))),normalize(before.events.filter(outside)));
 assert.deepEqual(normalize(after.events.filter(e=>e.channel===9)),normalize(before.events.filter(e=>e.channel===9)));
 const oldChunks=readMidiChunks(original),newChunks=readMidiChunks(result.bytes);assert.ok(oldChunks.header.equals(newChunks.header));
 for(let i=0;i<oldChunks.chunks.length;i++)if(!result.changedChunks.includes(i))assert.ok(oldChunks.chunks[i].bytes.equals(newChunks.chunks[i].bytes));
 assert.ok(result.bytes.equals(await readFile(new URL('../public/music/overdrive.mid',import.meta.url))));
 const changed=Buffer.from(original);changed[changed.length-1]^=1;assert.throws(()=>arrangeOverdriveCadence(changed),/baseline SHA/);
 assert.equal((await checkGuitarArrangements()).matches,true);
});
test('dedicated cadence writer only changes Overdrive, is repeatable and refuses archives or unreviewed edits',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'twist-cadence-'));
 try{
  const music=new URL('../public/music/',import.meta.url);for(const name of await readdir(music))await copyFile(new URL(name,music),join(directory,name));
  const original=arrangeGuitarLead(await readFile(new URL('../public/versions/0.1.33/music/overdrive.mid',import.meta.url)),'overdrive').bytes;
  await writeFile(join(directory,'overdrive.mid'),original);
  const before=new Map(await Promise.all((await readdir(directory)).map(async name=>[name,await readFile(join(directory,name))])));
  await writeOverdriveCadence({directory});assert.deepEqual((await readdir(directory)).sort(),[...before.keys()].sort());
  for(const [name,bytes]of before)assert.equal((await readFile(join(directory,name))).equals(bytes),name!=='overdrive.mid',name);
  const first=await readFile(join(directory,'overdrive.mid'));await writeOverdriveCadence({directory});assert.ok(first.equals(await readFile(join(directory,'overdrive.mid'))));
  await writeFile(join(directory,'overdrive.mid'),Buffer.from('unknown'));await assert.rejects(writeOverdriveCadence({directory}),/unreviewed/);
  await assert.rejects(writeOverdriveCadence({directory:fileURLToPath(new URL('../public/versions/0.1.33/music/',import.meta.url))}),/Immutable/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
