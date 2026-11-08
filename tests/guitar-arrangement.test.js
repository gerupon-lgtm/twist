import test from 'node:test';import assert from 'node:assert/strict';import {readFile,mkdtemp,cp,readdir,rm,symlink,unlink} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,resolve,sep} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {parseSmf} from '../src/vendor/scc/midi/smf.js';
import {noteToPeriod} from '../src/vendor/scc/engine/synth.js';
import {GUITAR_ARRANGEMENTS,GUITAR_IDS} from '../tools/guitar-arrangements.mjs';
import {arrangeGuitarLead,readMidiChunks,writeGuitarArrangements,checkGuitarArrangements} from '../tools/arrange-guitar-leads.mjs';
const source=new URL('../public/versions/0.1.33/music/',import.meta.url),hash=b=>createHash('sha256').update(b).digest('hex');
test('six explicit part-one arrangements preserve original hook anchors and every non-lead raw chunk',async()=>{
 assert.deepEqual(GUITAR_IDS,['rock','steel','horizon','storm','overdrive','ignition']);
 for(const plan of GUITAR_ARRANGEMENTS){const original=await readFile(new URL(plan.id+'.mid',source)),a=readMidiChunks(original),result=arrangeGuitarLead(original,plan.id),b=readMidiChunks(result.bytes),before=parseSmf(original),after=parseSmf(result.bytes);
  assert.equal(hash(original),plan.sha256);assert.notEqual(hash(result.bytes),plan.sha256);assert.equal(a.chunks.length,b.chunks.length);assert.ok(a.header.equals(b.header));
  for(let i=0;i<a.chunks.length;i++)if(i!==result.leadChunk)assert.ok(a.chunks[i].bytes.equals(b.chunks[i].bytes),plan.id+' chunk '+i);
  assert.deepEqual(after.events.filter(e=>e.channel!==0),before.events.filter(e=>e.channel!==0));assert.equal(after.duration,before.duration);
  const beatSeconds=Math.round(60e6/plan.bpm)/1e6,actual=after.events.filter(e=>e.channel===0&&e.type==='noteOn');for(const note of before.events.filter(e=>e.channel===0&&e.type==='noteOn')){
   const explicitBend=plan.bendHook&&((note.note===73&&Math.abs(note.time/beatSeconds-68.5)<1e-8)||(note.note===76&&Math.abs(note.time/beatSeconds-70)<1e-8));
   if(!explicitBend)assert.ok(actual.some(e=>e.note===note.note&&e.velocity===note.velocity&&Math.abs(e.time-note.time)<1e-8),plan.id+' original anchor');
  }
  assert.equal(result.fills.length,plan.fills.length);assert.ok(result.extendedNotes>0);assert.equal(result.metadataUnchanged,true);assert.ok(result.bends>0);assert.ok(after.events.some(e=>e.channel===0&&e.type==='pitchBend'&&e.value>=4096));
 }
});
test('Ignition bar18 is one continuous C#5-to-E5 three-semitone bend within the unchanged two-semitone engine range',async()=>{
 const plan=GUITAR_ARRANGEMENTS.find(p=>p.id==='ignition'),result=arrangeGuitarLead(await readFile(new URL('ignition.mid',source)),'ignition'),song=parseSmf(result.bytes),spb=Math.round(60e6/165)/1e6;
 const events=song.events.filter(e=>e.channel===0&&e.time/spb>=68.5-1e-8&&e.time/spb<=71.5+1e-8),ons=events.filter(e=>e.type==='noteOn'),offs=events.filter(e=>e.type==='noteOff');
 assert.equal(ons.length,1);assert.equal(ons[0].note,75);assert.equal(offs.length,1);assert.equal(offs[0].note,75);assert.ok(Math.abs(ons[0].time/spb-68.5)<1e-8);assert.ok(Math.abs(offs[0].time/spb-71.5)<1e-8);
 const first=events.find(e=>e.type==='pitchBend'&&Math.abs(e.time/spb-68.5)<1e-8),end=events.find(e=>e.type==='pitchBend'&&Math.abs(e.time/spb-70)<1e-8);assert.equal(first.value,-8192);assert.equal(end.value,4096);assert.equal(events.at(-1).type,'pitchBend');assert.equal(events.at(-1).value,0);
 const frequency=(note,bend=0)=>440*2**((note-69+bend*2/8192)/12);assert.equal(frequency(75,first.value),frequency(73));assert.equal(frequency(75,end.value),frequency(76));assert.equal(noteToPeriod(75+first.value*2/8192),noteToPeriod(73));assert.equal(noteToPeriod(75+end.value*2/8192),noteToPeriod(76));assert.deepEqual(result.bendHook,plan.bendHook);
});
test('guitar leads are monophonic, reset their bounded bends and preserve deliberate response rests',async()=>{
 for(const id of GUITAR_IDS){const result=arrangeGuitarLead(await readFile(new URL(id+'.mid',source)),id),song=parseSmf(result.bytes);let held=null,lastBend=0,notes=0;
  for(const e of song.events.filter(e=>e.channel===0)){if(e.type==='noteOn'){assert.equal(held,null,id+' overlapping lead');held=e.note;notes++;}if(e.type==='noteOff'){assert.equal(held,e.note);held=null;}if(e.type==='pitchBend'){assert.ok(Number.isInteger(e.value)&&e.value>=-8192&&e.value<=8191);lastBend=e.value;}}
  assert.equal(held,null);assert.equal(lastBend,0);assert.ok(notes>0);for(const fill of result.fills)for(const window of result.responseWindows)assert.ok(fill.endTick<=window.startTick||fill.startTick>=window.endTick,id+' fills synth response');
 }
});
test('every original hook attack retains its audible pitch, with only the explicit bar18 merged-bend exception',async()=>{
 for(const plan of GUITAR_ARRANGEMENTS){const original=await readFile(new URL(plan.id+'.mid',source)),before=parseSmf(original),after=parseSmf(arrangeGuitarLead(original,plan.id).bytes),spb=Math.round(60e6/plan.bpm)/1e6,attacks=new Map();let bend=0;
  for(const event of after.events.filter(e=>e.channel===0)){if(event.type==='pitchBend')bend=event.value;if(event.type==='noteOn')attacks.set(event.time.toFixed(9)+':'+event.note,event.note+bend*2/8192);}
  for(const note of before.events.filter(e=>e.channel===0&&e.type==='noteOn')){const beat=note.time/spb,exception=plan.bendHook&&((note.note===73&&Math.abs(beat-68.5)<1e-8)||(note.note===76&&Math.abs(beat-70)<1e-8));if(!exception)assert.equal(attacks.get(note.time.toFixed(9)+':'+note.note),note.note,plan.id+' hook attack at '+beat);}
 }
});
test('held original hooks stay centered on their original pitch instead of arbitrary semitone bends',async()=>{
 for(const plan of GUITAR_ARRANGEMENTS){const original=await readFile(new URL(plan.id+'.mid',source)),before=parseSmf(original),after=parseSmf(arrangeGuitarLead(original,plan.id).bytes),spb=Math.round(60e6/plan.bpm)/1e6,events=after.events.filter(e=>e.channel===0);
  for(const n of before.events.filter(e=>e.channel===0&&e.type==='noteOn')){const beat=n.time/spb,exception=plan.bendHook&&((n.note===73&&Math.abs(beat-68.5)<1e-8)||(n.note===76&&Math.abs(beat-70)<1e-8));if(exception)continue;
   const off=events.find(e=>e.type==='noteOff'&&e.note===n.note&&e.time>n.time),bends=events.filter(e=>e.type==='pitchBend'&&e.time>=n.time-1e-8&&e.time<off.time-1e-8);assert.ok(bends.length>0);
   for(const e of bends)assert.ok(Math.abs(e.value*2/8192)<=plan.vibratoCents/100+1/4096,plan.id+' original hook has a semitone bias at beat '+beat);
  }
 }
});
test('each authored final answer bends from its explicit lower note to its unchanged target by a whole tone',async()=>{
 const frequency=n=>440*2**((n-69)/12);
 for(const plan of GUITAR_ARRANGEMENTS){const result=arrangeGuitarLead(await readFile(new URL(plan.id+'.mid',source)),plan.id),events=parseSmf(result.bytes).events.filter(e=>e.channel===0),spb=Math.round(60e6/plan.bpm)/1e6;
  for(let i=0;i<plan.fills.length;i++){const phrase=plan.fills[i],fill=result.fills[i],toNote=phrase.pitches.at(-1),fromNote=toNote-2;assert.deepEqual(phrase.bendFinal,{fromNote,toNote},plan.id+' explicit answer endpoint');assert.deepEqual(fill.bendFinal,phrase.bendFinal);
   const start=fill.startTick/480*spb,end=fill.endTick/480*spb,inside=events.filter(e=>e.time>=start-1e-8&&e.time<=end+1e-8),on=inside.filter(e=>e.type==='noteOn').at(-1),off=inside.find(e=>e.type==='noteOff'&&e.note===on.note&&e.time>on.time),bends=inside.filter(e=>e.type==='pitchBend'&&e.time>=on.time-1e-8&&e.time<off.time-1e-8),span=off.time-on.time;
   assert.equal(on.note,toNote-1);assert.equal(bends[0].value,-4096);const arrival=bends.find(e=>e.value===4096);assert.ok(arrival,plan.id+' answer reaches the target');assert.ok(Math.abs((arrival.time-on.time)/span-.75)<=1/Math.round(span/spb*480)+1e-8);
   const rampStart=on.time+span*.18;for(const e of bends.filter(e=>e.time<rampStart-spb/480))assert.equal(e.value,-4096);for(let n=1;n<bends.length;n++)assert.ok(bends[n].value>=bends[n-1].value);
   assert.equal(frequency(on.note+bends[0].value/4096),frequency(fromNote));assert.equal(frequency(on.note+arrival.value/4096),frequency(toNote));assert.equal(noteToPeriod(on.note+bends[0].value/4096),noteToPeriod(fromNote));assert.equal(noteToPeriod(on.note+arrival.value/4096),noteToPeriod(toNote));
   assert.equal(inside.filter(e=>e.type==='noteOn'&&e.time>=on.time-1e-8).length,1);assert.ok(events.some(e=>e.type==='pitchBend'&&Math.abs(e.time-off.time)<1e-8&&e.value===0));
  }
 }
});
test('partial arranger refuses an unknown or modified original instead of rewriting unrelated music',async()=>{
 const original=await readFile(new URL('rock.mid',source));assert.throws(()=>arrangeGuitarLead(original,'advance'));const changed=Buffer.from(original);changed[changed.length-1]^=1;assert.throws(()=>arrangeGuitarLead(changed,'rock'),/baseline/i);
});
test('writer changes exactly the six allowlisted files and checker is read only',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'twist-guitar-'));try{await cp(source,directory,{recursive:true});const names=await readdir(directory),before=Object.fromEntries(await Promise.all(names.map(async f=>[f,hash(await readFile(join(directory,f)))])));
  const result=await writeGuitarArrangements({directory});assert.equal(result.files.length,6);assert.equal(result.protectedUnchanged,true);const changed=[];for(const f of names)if(hash(await readFile(join(directory,f)))!==before[f])changed.push(f);assert.deepEqual(changed.sort(),GUITAR_IDS.map(id=>id+'.mid').sort());assert.equal((await checkGuitarArrangements({directory})).matches,true);
 }finally{const path=resolve(directory);assert.ok(path.startsWith(resolve(tmpdir())+sep));await rm(path,{recursive:true,force:true});}
});
test('writer rejects real archive destinations reached through aliases and Windows case variants',async()=>{
 const archive=fileURLToPath(source),before=hash(await readFile(new URL('rock.mid',source))),directory=await mkdtemp(join(tmpdir(),'twist-guitar-alias-')),alias=join(directory,'archive-link');let linked=false;
 try{await symlink(archive,alias,process.platform==='win32'?'junction':'dir');linked=true;await assert.rejects(writeGuitarArrangements({directory:alias}),/Immutable release archives/);
  if(process.platform==='win32'){const otherCase=archive.replace(/[a-zA-Z]/g,c=>c===c.toLowerCase()?c.toUpperCase():c.toLowerCase());await assert.rejects(writeGuitarArrangements({directory:otherCase}),/Immutable release archives/);}
  assert.equal(hash(await readFile(new URL('rock.mid',source))),before);
 }finally{if(linked)await unlink(alias);const target=resolve(directory);assert.ok(target.startsWith(resolve(tmpdir())+sep));await rm(target,{recursive:true,force:true});}
});
