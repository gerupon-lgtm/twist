import {readFile,writeFile,readdir,realpath} from 'node:fs/promises';import {createHash} from 'node:crypto';import {resolve,sep} from 'node:path';import {fileURLToPath} from 'node:url';
import {GUITAR_ARRANGEMENTS,GUITAR_IDS} from './guitar-arrangements.mjs';
const sourceDirectory=fileURLToPath(new URL('../public/versions/0.1.33/music/',import.meta.url)),outputDirectory=fileURLToPath(new URL('../public/music/',import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const vlq=value=>{if(!Number.isInteger(value)||value<0||value>0xfffffff)throw Error('Invalid MIDI delta');const result=[value&127];while((value>>>=7)>0)result.unshift((value&127)|128);return result;};
export function readMidiChunks(input){
 const bytes=Buffer.from(input);if(bytes.toString('ascii',0,4)!=='MThd'||bytes.length<14)throw Error('Invalid SMF');
 const headerEnd=8+bytes.readUInt32BE(4);if(bytes.readUInt16BE(8)!==1||bytes.readUInt16BE(12)!==480)throw Error('Expected original format1/PPQ480');
 const chunks=[];for(let at=headerEnd;at<bytes.length;){if(at+8>bytes.length)throw Error('Truncated MIDI chunk');const length=bytes.readUInt32BE(at+4),end=at+8+length;if(end>bytes.length)throw Error('Truncated MIDI data');chunks.push({type:bytes.toString('ascii',at,at+4),bytes:bytes.subarray(at,end)});at=end;}
 if(chunks.filter(c=>c.type==='MTrk').length!==bytes.readUInt16BE(10))throw Error('MIDI track count mismatch');return {header:bytes.subarray(0,headerEnd),chunks};
}
function decodeTrack(chunk){
 const buffer=chunk.bytes;let at=8,tick=0,running=0;const events=[];
 const byte=()=>{if(at>=buffer.length)throw Error('Truncated event');return buffer[at++];};
 const length=()=>{let n=0;for(let i=0;i<4;i++){const b=byte();n=n*128+(b&127);if(!(b&128))return n;}throw Error('Invalid event delta');};
 while(at<buffer.length){tick+=length();let status=byte();if(status<128){at--;status=running;}if(!status)throw Error('Missing MIDI status');let data;
  if(status===255){const type=byte(),n=length();data=[255,type,...vlq(n),...buffer.subarray(at,at+n)];at+=n;}
  else if(status===240||status===247){const n=length();data=[status,...vlq(n),...buffer.subarray(at,at+n)];at+=n;running=0;}
  else{running=status;const kind=status&240;data=[status,byte()];if(kind!==192&&kind!==208)data.push(byte());}
  if(at>buffer.length)throw Error('Truncated payload');events.push({tick,data,order:events.length});
 }
 return events;
}
function notePairs(events,channel=0){
 const notes=[],held=new Map();for(const event of events){const [status,pitch,velocity]=event.data,kind=status&240;if((status&15)!==channel||status>=240)continue;
  if(kind===144&&velocity>0){if(held.has(pitch))throw Error('Repeated held lead note');held.set(pitch,{startTick:event.tick,pitch,velocity,original:true});}
  else if(kind===128||kind===144&&velocity===0){const n=held.get(pitch);if(!n)throw Error('Unmatched lead noteOff');held.delete(pitch);notes.push({...n,endTick:event.tick});}
 }
 if(held.size)throw Error('Hanging lead note');notes.sort((a,b)=>a.startTick-b.startTick);return notes;
}
function encodeTrack(events,preserveOrder=false){
 const priority=e=>(e.data[0]&240)===128?0:e.data[0]===255?4:(e.data[0]&240)===224?1:(e.data[0]&240)===176?2:3;
 const sorted=events.map((e,index)=>({...e,index})).sort((a,b)=>a.tick-b.tick||(preserveOrder?0:priority(a)-priority(b))||a.index-b.index);
 let previous=0;const data=[];for(const event of sorted){data.push(...vlq(event.tick-previous),...event.data);previous=event.tick;}const payload=Buffer.from(data),header=Buffer.alloc(8);header.write('MTrk');header.writeUInt32BE(payload.length,4);return Buffer.concat([header,payload]);
}
function subtractWindows(start,end,windows){let gaps=[{start,end}];for(const w of windows)gaps=gaps.flatMap(g=>w.endTick<=g.start||w.startTick>=g.end?[g]:[{start:g.start,end:Math.min(g.end,w.startTick)},{start:Math.max(g.start,w.endTick),end:g.end}].filter(p=>p.end>p.start));return gaps;}
function transformedLead(events,allTracks,plan){
 const ppq=480,spb=Math.round(60e6/plan.bpm)/1e6,ticksPerSecond=ppq/spb,tick=beats=>Math.round(beats*ppq),notes=notePairs(events),originalCount=notes.length;
 const responseWindows=['steel','horizon','storm'].includes(plan.id)?allTracks.flatMap(t=>notePairs(t.events.filter(e=>(e.data[0]&15)===4&&e.data[0]<240),4)).map(n=>({startTick:Math.max(0,n.startTick-tick(.04)),endTick:n.endTick+tick(.04)})):[];
 let bendHook=null;
 if(plan.bendHook){const h=plan.bendHook,a=notes.find(n=>n.startTick===tick(h.startBeat)&&n.pitch===h.fromNote),b=notes.find(n=>n.startTick===tick(h.toBeat)&&n.pitch===h.toNote);if(!a||!b||b.endTick!==tick(h.endBeat))throw Error('Original bar18 hook does not match');
  notes.splice(notes.indexOf(a),1,{...a,endTick:tick(69.75),bendHook:true,hookPart:'pickup',velocity:110});
  notes.splice(notes.indexOf(b),1,{...b,pitch:75,bendHook:true,hookPart:'half-step',velocity:120});bendHook=h;
 }
 notes.sort((a,b)=>a.startTick-b.startTick);const fills=[],reserved=new Set();
 const restWindows=[];
 const phrases=[...plan.fills,...(plan.restoredRests??[]).map(after=>({after,minimumGap:.75,restoreRest:true}))].sort((a,b)=>a.after-b.after);
 for(const phrase of phrases){let chosen=null;
  const {fromNote,toNote}=phrase.bendFinal??{};if(!phrase.restoreRest&&(!Number.isInteger(fromNote)||!Number.isInteger(toNote)||fromNote<0||toNote>127||toNote-fromNote!==2||toNote!==phrase.pitches.at(-1)))throw Error('Expected explicit whole-tone answer endpoints');
  for(let i=0;i<notes.length-1&&!chosen;i++){if(reserved.has(i))continue;const n=notes[i],next=notes[i+1];for(const gap of subtractWindows(n.endTick,next.startTick,responseWindows)){
    const start=Math.max(gap.start,tick(phrase.after));if(start>tick(phrase.after+24)||gap.end-start<tick(phrase.minimumGap))continue;
    chosen={index:i,start:start+tick(.025),end:Math.min(gap.end-tick(.025),start+tick(1.25))};break;
   }}
  if(!chosen)throw Error('No original rest for authored answer '+plan.id+'/'+phrase.after);reserved.add(chosen.index);
  if(phrase.restoreRest){restWindows.push({startTick:notes[chosen.index].endTick,endTick:notes[chosen.index+1].startTick});continue;}
  const span=chosen.end-chosen.start,sum=phrase.weights.reduce((a,b)=>a+b,0);let position=chosen.start;
  const added=phrase.pitches.map((pitch,i)=>{const slot=span*phrase.weights[i]/sum,startTick=Math.round(position),answerBend=i===phrase.pitches.length-1?{fromNote,toNote}:null;position+=slot;return {startTick,endTick:Math.max(startTick+4,Math.round(position-slot*.18)),pitch:answerBend?toNote-1:pitch,velocity:Math.min(104,notes[chosen.index].velocity),original:false,answerBend};});
  fills.push({startTick:added[0].startTick,endTick:added.at(-1).endTick,pitches:[...phrase.pitches],bendFinal:{fromNote,toNote},notes:added});
 }
 let extendedNotes=0;for(let i=0;i<notes.length-1;i++){const n=notes[i],next=notes[i+1];if(reserved.has(i)||n.bendHook||(n.endTick-n.startTick)/ticksPerSecond<.23)continue;
  let limit=next.startTick-tick(.12);for(const w of responseWindows)if(w.startTick>=n.endTick)limit=Math.min(limit,w.startTick);
  const extension=Math.max(0,Math.min(tick(plan.extendBeats),Math.floor((next.startTick-n.endTick)*.35),limit-n.endTick));if(extension>0){n.endTick+=extension;extendedNotes++;}
 }
 notes.push(...fills.flatMap(f=>f.notes));notes.sort((a,b)=>a.startTick-b.startTick);for(let i=1;i<notes.length;i++)if(notes[i-1].endTick>notes[i].startTick)throw Error('Arrangement would overlap lead notes');
 const output=events.filter(e=>{const kind=e.data[0]&240;return e.data[0]>=240||![128,144,224].includes(kind)&&!(kind===176&&e.data[1]===7);}).map(e=>({...e,data:[...e.data]}));
 const add=(t,data)=>output.push({tick:Math.round(t),data});let bends=0;
 const bend=(t,value)=>{const signed=Math.max(-8192,Math.min(8191,Math.round(value))),wire=signed+8192;add(t,[224,wire&127,(wire>>7)&127]);bends++;};
 notes.forEach(n=>{
  const duration=(n.endTick-n.startTick)/ticksPerSecond,start=n.startTick,end=n.endTick;
  if(n.bendHook){
   const beat=start/ppq,span=(end-start)/ppq;
   const curve=(offset,semitones)=>bend(tick(beat+offset),semitones*4096);
   if(n.hookPart==='pickup'){
    for(let i=0;i<6;i++)curve(i/24,-2+i/3);
    for(let offset=.375;offset<span-1e-8;offset+=.0625)curve(offset,.42*Math.sin((offset-.375)*4*Math.PI));
   }else{
    curve(0,0);for(let i=0;i<=8;i++)curve(.125+i*.0625,i/8);
    for(let offset=.6875;offset<span-1e-8;offset+=.0625)curve(offset,1+.42*Math.sin((offset-.6875)*4*Math.PI));
   }
   add(start,[144,n.pitch,n.velocity]);add(start,[176,7,92]);add(start+tick(.05),[176,7,120]);
   add(start+tick(span*.5),[176,7,101]);add(end-tick(n.hookPart==='pickup'?.0791666667:.15),[176,7,80]);
   add(end,[128,n.pitch,0]);bend(end,0);return;
  }
  if(n.answerBend){ // Only authored answer endings carry a whole-tone bend.
   const from=(n.answerBend.fromNote-n.pitch)*4096,to=(n.answerBend.toNote-n.pitch)*4096;
   bend(start,from);add(start,[144,n.pitch,n.velocity]);add(start,[176,7,120]);add(Math.min(end-3,start+ticksPerSecond*.035),[176,7,100]);add(Math.min(end-2,start+(end-start)*.7),[176,7,84]);
   bend(start+(end-start)*.18,from);for(let i=1;i<=24;i++){const f=i/24,smooth=f*f*(3-2*f);bend(start+(end-start)*(.18+.57*f),from+(to-from)*smooth);}
   add(end,[128,n.pitch,0]);bend(end,0);return;
  }
  // Original hook attacks retain their actual pitch, not only raw MIDI notes.
  // An incoming scoop belongs only to an independently added answer note.
  const slide=!n.original&&duration>.24;
  bend(start,slide?-2458:0);add(start,[144,n.pitch,n.velocity]);add(start,[176,7,120]);add(Math.min(end-3,start+ticksPerSecond*.035),[176,7,100]);
  add(Math.min(end-2,start+(end-start)*.7),[176,7,84]);
  if(slide)for(let i=1;i<=6;i++)bend(start+ticksPerSecond*.09*i/6,-2458*(1-i/6));
  if(duration>.4)for(let t=start+ticksPerSecond*.29;t<end-ticksPerSecond*.035;t+=ticksPerSecond/(plan.vibratoHz*8))bend(t,Math.sin((t-start)/ticksPerSecond*2*Math.PI*plan.vibratoHz)*plan.vibratoCents/100/2*8192);
  add(end,[128,n.pitch,0]);bend(end,0);
 });
 return {events:output,fills:fills.map(({notes,...row})=>row),responseWindows,restoredRests:restWindows,extendedNotes,bends,bendHook,originalCount};
}
export function arrangeGuitarLead(input,id){
 const plan=GUITAR_ARRANGEMENTS.find(row=>row.id===id);if(!plan)throw Error('Track not in guitar allowlist');if(hash(input)!==plan.sha256)throw Error('Original33 baseline SHA mismatch: '+id);
 const source=readMidiChunks(input),tracks=source.chunks.map((chunk,index)=>({index,events:chunk.type==='MTrk'?decodeTrack(chunk):[]})),lead=tracks.filter(t=>t.events.some(e=>e.data[0]===144));
 if(lead.length!==1)throw Error('Expected one channel-one track');
 const arrangement=transformedLead(lead[0].events,tracks,plan),replacement=encodeTrack(arrangement.events),bytes=Buffer.concat([source.header,...source.chunks.map((chunk,i)=>i===lead[0].index?replacement:chunk.bytes)]);
 return {bytes,leadChunk:lead[0].index,...arrangement,events:undefined,metadataUnchanged:true};
}
const overdrive57='1092b7948c977374ec622eec9c225bf422e666bc4bdbf7c01e6ffe6c2a3c73d3';
export function arrangeOverdriveCadence(input){
 if(hash(input)!==overdrive57)throw Error('Overdrive v57 baseline SHA mismatch');
 const source=readMidiChunks(input),start=268*480,half=270*480,end=272*480,sequence=[76,69,76,72,81,76,72,81,76,80,83,80,76,71,80,76];
 const changed=[];let leads=0;
 const chunks=source.chunks.map((chunk,index)=>{
  if(chunk.type!=='MTrk')return chunk.bytes;
  const original=decodeTrack(chunk),events=original.map(e=>({...e,data:[...e.data]})),notes=[];const held=new Map();
  for(const event of events){const [status,pitch,velocity]=event.data,kind=status&240;if(status>=240)continue;const key=(status&15)+':'+pitch;
   if(kind===144&&velocity>0){if(held.has(key))throw Error('Overlapping MIDI note');held.set(key,event);}
   else if(kind===128||kind===144&&velocity===0){const on=held.get(key);if(!on)throw Error('Unmatched MIDI noteOff');held.delete(key);notes.push({on,off:event,channel:status&15});}
  }
  if(held.size)throw Error('Hanging MIDI note');
  const selected=notes.filter(n=>n.on.tick>=start&&n.on.tick<end),lead=selected.filter(n=>n.channel===0).sort((a,b)=>a.on.tick-b.on.tick);
  let output=events,addedEnd=null;
  if(lead.length){
   if(++leads!==1||JSON.stringify(lead.map(n=>n.on.data[1]))!=='[81,76,81]'||lead.some(n=>n.off.tick>=end)||notes.some(n=>n.channel===0&&n.on.tick<start&&n.off.tick>=start))throw Error('Unexpected bar 68 lead');
   output=events.filter(e=>!(e.tick>=start&&e.tick<end&&e.data[0]<240&&(e.data[0]&15)===0&&([128,144,224].includes(e.data[0]&240)||(e.data[0]&240)===176&&e.data[1]===7)));
   for(const [tick,pitch]of [[start,81],[half,80]]){
    const add=(at,data)=>output.push({tick:at,data});add(tick,[224,0,64]);add(tick,[176,7,120]);add(tick,[144,pitch,lead[0].on.data[2]]);
    const off={tick:tick+960,data:[128,pitch,0]};output.push(off);if(off.tick===end)addedEnd=off;
    add(tick+48,[176,7,100]);add(tick+384,[176,7,84]);
   }
   output.sort((a,b)=>a.tick-b.tick||((a.data[0]&240)===128?-1:0)-((b.data[0]&240)===128?-1:0));
  }
  for(const channel of [1,3,4]){
   const part=selected.filter(n=>n.channel===channel).sort((a,b)=>a.on.tick-b.on.tick);if(!part.length)continue;
   if(part.length!==({1:16,3:8,4:2})[channel]||part.some(n=>n.off.tick>=end))throw Error('Unexpected bar 68 accompaniment');
   part.forEach((n,i)=>{const pitch=channel===1?sequence[i]:channel===3?40:n.on.tick<half?64:68;n.on.data[1]=pitch;n.off.data[1]=pitch;});
  }
  const outside=e=>e.tick<start||e.tick>=end;
  const same=rows=>JSON.stringify(rows.map(e=>[e.tick,e.data]));
  if(same(original.filter(outside))!==same(output.filter(e=>e!==addedEnd&&outside(e))))throw Error('Events outside bar 68 changed');
  if(same(original)===same(output))return chunk.bytes;changed.push(index);return encodeTrack(output,true);
 });
 if(leads!==1||changed.length!==4)throw Error('Expected four changed melodic tracks');
 return {bytes:Buffer.concat([source.header,...chunks]),bar:68,changedChunks:changed,bass:'E2',chords:['Am/E','E'],lead:[81,80]};
}
async function originals(){return Promise.all(GUITAR_IDS.map(async id=>{const song=arrangeGuitarLead(await readFile(resolve(sourceDirectory,id+'.mid')),id);return {id,...song,...(id==='overdrive'?{bytes:arrangeOverdriveCadence(song.bytes).bytes}:{})};}));}
async function protectedHashes(directory,allowed=GUITAR_IDS){const names=(await readdir(directory,{withFileTypes:true})).filter(e=>e.isFile()&&!allowed.some(id=>e.name===id+'.mid')).map(e=>e.name).sort();return Object.fromEntries(await Promise.all(names.map(async name=>[name,hash(await readFile(resolve(directory,name)))])));}
export async function checkGuitarArrangements({directory=outputDirectory}={}){const rows=[];for(const song of await originals()){let existing=null;try{existing=await readFile(resolve(directory,song.id+'.mid'));}catch(e){if(e.code!=='ENOENT')throw e;}rows.push({id:song.id,sha256:hash(song.bytes),matches:Boolean(existing?.equals(song.bytes))});}return {matches:rows.every(row=>row.matches),files:rows,readOnly:true};}
async function checkedOutputDirectory(directory){
 const canonical=path=>process.platform==='win32'?resolve(path).toLowerCase():resolve(path);
 const target=await realpath(resolve(directory)),archives=await realpath(fileURLToPath(new URL('../public/versions/',import.meta.url))),targetKey=canonical(target),archiveKey=canonical(archives);
 if(targetKey===archiveKey||targetKey.startsWith(archiveKey+sep))throw Error('Immutable release archives cannot be a guitar output directory');
 return target;
}
export async function writeGuitarArrangements({directory=outputDirectory}={}){
 // Use the checked real path, so a junction alias is never used for writes.
 const target=await checkedOutputDirectory(directory);
 const generated=await originals(),before=await protectedHashes(target),files=[];
 for(const song of generated){await writeFile(resolve(target,song.id+'.mid'),song.bytes);files.push({id:song.id,bytes:song.bytes.length,sha256:hash(song.bytes),fills:song.fills,extendedNotes:song.extendedNotes,bends:song.bends});}
 const after=await protectedHashes(target);if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Non-target file changed during guitar write');return {files,protectedUnchanged:true,protectedHashes:after};
}
export async function writeOverdriveCadence({directory=outputDirectory}={}){
 const target=await checkedOutputDirectory(directory),song=(await originals()).find(s=>s.id==='overdrive'),existing=await readFile(resolve(target,'overdrive.mid'));
 if(hash(existing)!==overdrive57&&!existing.equals(song.bytes))throw Error('Refusing to overwrite unreviewed Overdrive edits');
 const before=await protectedHashes(target,['overdrive']);await writeFile(resolve(target,'overdrive.mid'),song.bytes);
 const after=await protectedHashes(target,['overdrive']);if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Non-target file changed during cadence write');
 return {file:'overdrive.mid',bar:68,sha256:hash(song.bytes),protectedUnchanged:true};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const args=process.argv.slice(2);if(args.length!==1||!['--check','--write'].includes(args[0])){console.error('Use --check or --write; only six guitar part-one MID files are allowlisted.');process.exitCode=2;}else{const result=args[0]==='--write'?await writeGuitarArrangements():await checkGuitarArrangements();console.log(JSON.stringify(result,null,2));if(args[0]==='--check'&&!result.matches)process.exitCode=1;}}
