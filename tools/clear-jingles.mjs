/** Three original short victory themes. No legacy score, MIDI or MML is imported. */
const freeze=value=>{if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;};
const line=(channel,rows)=>rows.map(([beat,pitch,length,velocity=100])=>({channel,beat,pitch,length,velocity}));
const harmony=rows=>rows.flatMap(([beat,low,high,length])=>[
 {channel:2,beat,pitch:low,length,velocity:76},{channel:4,beat,pitch:high,length,velocity:68},
]);
export const PROTECTED_MIDI_FILES=Object.freeze(['flight.mid','flight2.mid','brave.mid','rock.mid','steel.mid','horizon.mid','storm.mid','ignition.mid','advance.mid','overdrive.mid','afterburner.mid','clear.mid','flight-legacy.mid']);
export const CLEAR_JINGLES=freeze([
 {
  id:'clear-ignition',title:'凱旋の点火',midiTitle:'Twist original - Victory Ignition',bpm:165,beats:8,key:'C major',
  // Open fifth, a separated answer, then a semitone lift into a long tonic.
  notes:[...line(1,[[0,67,.7,108],[1,76,.45,103],[1.75,74,.8,102],[3,79,.9,108],[4.5,83,.45,106],[5.25,84,2,113]]),
   ...harmony([[0,60,67,.7],[3,55,62,.7],[5.25,60,64,1.5]]),
   ...line(3,[[0,36,.5,110],[1.75,43,.5,102],[3,41,.75,105],[5.25,48,1.75,109]]),
   ...line(10,[[0,36,.1,111],[0,49,.15,92],[.75,42,.08,63],[1.5,38,.12,101],[2.5,36,.1,106],[3.5,38,.12,104],[4,45,.1,86],[4.25,47,.1,90],[5.25,36,.1,112],[5.25,49,.15,96]])],
 },
 {
  id:'clear-advance',title:'鋼の勝利',midiTitle:'Twist original - Steel Victory',bpm:145,beats:8,key:'E minor',
  // A low, spacious call with heavy separated footfalls, rather than a slowed riff.
  notes:[...line(1,[[0,64,.8,108],[1.5,60,.45,102],[2.75,67,1,110],[4.25,62,.6,101],[5.5,64,1.75,113]]),
   ...harmony([[0,52,59,.75],[2.75,50,57,.75],[5.5,52,59,1.5]]),
   ...line(3,[[0,40,.8,112],[1.5,35,.5,103],[2.75,38,.75,107],[5.5,40,1.5,112]]),
   ...line(10,[[0,36,.12,114],[0,42,.08,65],[1.5,38,.13,109],[2.75,36,.12,111],[3.75,38,.13,106],[4.5,45,.12,95],[5.5,36,.12,115],[5.5,49,.15,92]])],
 },
 {
  id:'clear-overdrive',title:'閃光の帰還',midiTitle:'Twist original - Flash Return',bpm:175,beats:8,key:'G minor',
  // Seven punctuated guitar notes; accompaniment drops away under the final note.
  notes:[...line(1,[[0,67,.25,107],[.5,70,.35,102],[1.25,74,.75,110],[2.25,72,.35,102],[3,77,.75,111],[4,74,.5,104],[5,79,2.25,113]]),
   ...harmony([[0,55,62,.4],[2.25,53,60,.4],[5,55,62,1.25]]),
   ...line(3,[[0,43,.35,111],[.75,50,.35,102],[2.25,41,.4,108],[3.5,43,.4,105],[5,43,1.25,112]]),
   ...line(10,[[0,36,.1,113],[0,49,.15,91],[1.5,38,.12,106],[2.25,36,.1,110],[3.5,38,.12,107],[4.25,45,.1,90],[4.5,47,.1,95],[5,36,.1,114],[5,49,.15,96]])],
 },
]);

const PPQ=480;
function variable(value){
 if(!Number.isSafeInteger(value)||value<0||value>0x0fffffff)throw new RangeError('Invalid SMF delta');
 const out=[value&127];while((value>>>=7)>0)out.unshift((value&127)|128);return out;
}
function chunk(name,bytes){const header=Buffer.alloc(8);header.write(name,0,4,'ascii');header.writeUInt32BE(bytes.length,4);return Buffer.concat([header,Buffer.from(bytes)]);}
function trackBytes(events,endTick){
 const sorted=[...events].sort((a,b)=>a.tick-b.tick||a.order-b.order);let cursor=0;const bytes=[];
 for(const event of sorted){bytes.push(...variable(event.tick-cursor),...event.bytes);cursor=event.tick;}
 bytes.push(...variable(endTick-cursor),0xff,0x2f,0);return chunk('MTrk',bytes);
}
function encode(song){
 const endTick=song.beats*PPQ,tempo=Math.round(60e6/song.bpm),title=Buffer.from(song.midiTitle,'utf8');
 const conductor=trackBytes([
  {tick:0,order:0,bytes:[0xff,0x03,...variable(title.length),...title]},
  {tick:0,order:1,bytes:[0xff,0x51,3,(tempo>>>16)&255,(tempo>>>8)&255,tempo&255]},
  {tick:0,order:2,bytes:[0xff,0x58,4,4,2,24,8]},
 ],endTick);
 const channels=[1,2,3,4,10],tracks=[conductor];
 for(const part of channels){
  const ch=part-1,events=[{tick:0,order:0,bytes:[0xb0|ch,7,127]}];
  if(part!==10)events.push({tick:0,order:0,bytes:[0xe0|ch,0,64]});
  for(const note of song.notes.filter(note=>note.channel===part)){
   const start=Math.round(note.beat*PPQ),end=Math.round((note.beat+note.length)*PPQ);
   if(start<0||end<=start||end>endTick||!Number.isInteger(note.pitch)||note.pitch<0||note.pitch>127||!Number.isInteger(note.velocity)||note.velocity<1||note.velocity>127)throw new RangeError('Invalid composed note');
   events.push({tick:start,order:2,bytes:[0x90|ch,note.pitch,note.velocity]},{tick:end,order:1,bytes:[0x80|ch,note.pitch,0]});
  }
  // Actual noteOff events precede the release margin; cleanup does not cut the cadence.
  events.push({tick:endTick,order:3,bytes:[0xb0|ch,123,0]});
  if(part!==10)events.push({tick:endTick,order:3,bytes:[0xe0|ch,0,64]});
  tracks.push(trackBytes(events,endTick));
 }
 const header=Buffer.alloc(6);header.writeUInt16BE(1,0);header.writeUInt16BE(tracks.length,2);header.writeUInt16BE(PPQ,4);
 return Buffer.concat([chunk('MThd',header),...tracks]);
}
export function generateClearJingles(){return Object.fromEntries(CLEAR_JINGLES.map(song=>[song.id,encode(song)]));}
export function generatedClearTracks(){
 return Object.fromEntries(CLEAR_JINGLES.map(song=>[song.id,{title:song.title,file:song.id+'.mid',bpm:song.bpm,beats:song.beats,parts:{
  1:{waveform:song.id==='clear-overdrive'?1:4,volume:99,role:'lead',fmPreset:'lead'},
  2:{waveform:1,volume:53,role:'chords',fmPreset:'chords'},
  3:{waveform:0,volume:86,role:'bass',fmPreset:null},
  4:{waveform:1,volume:48,role:'chords',fmPreset:'chords'},
  10:{volume:88,role:'drums',fmPreset:null},
 }}]));
}
