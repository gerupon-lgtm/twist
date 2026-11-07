import { mkdir,writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const PPQ=480;
const vlq=n=>{const b=[n&127];while((n>>=7)>0)b.unshift((n&127)|128);return b;};
const chunk=(name,data)=>Buffer.concat([Buffer.from(name),Buffer.from([(data.length>>>24)&255,(data.length>>>16)&255,(data.length>>>8)&255,data.length&255]),Buffer.from(data)]);
function midi(tracks,bpm,beats,title){
  const tempo=Math.round(60000000/bpm),name=[...Buffer.from(title)];
  const meta=[{t:0,b:[255,81,3,(tempo>>16)&255,(tempo>>8)&255,tempo&255]},{t:0,b:[255,3,...vlq(name.length),...name]}];
  const parts=[meta,...tracks];
  const packed=parts.map(events=>{
    events=[...events,{t:Math.round(beats*PPQ),b:[255,47,0]}].sort((a,b)=>a.t-b.t||((a.b[0]&240)===128?-1:0)-((b.b[0]&240)===128?-1:0));
    let last=0;const bytes=[];for(const e of events){bytes.push(...vlq(e.t-last),...e.b);last=e.t;}return chunk('MTrk',bytes);
  });
  return Buffer.concat([chunk('MThd',[0,1,0,parts.length,PPQ>>8,PPQ&255]),...packed]);
}
function note(track,channel,beat,n,length,velocity){track.push({t:Math.round(beat*PPQ),b:[144+channel,n,velocity]},{t:Math.round((beat+length)*PPQ),b:[128+channel,n,0]});}
export function generateMusic(){
  // Hand-authored original motifs; no melody or recording from another work is used.
  const phrases=[
    [[74,78,81,83,81,78,76],[78,81,85,83,81,78,74],[79,83,86,83,81,79,78],[76,81,83,85,83,81,73]],
    [[81,78,76,74,78,81,85],[83,81,78,74,73,74,78],[86,83,81,79,78,79,83],[85,83,81,76,73,76,81]],
    [[74,76,78,81,85,83,81],[78,74,73,74,78,81,83],[79,81,83,86,88,86,83],[81,85,83,81,76,73,69]],
    [[86,85,81,78,81,83,85],[83,78,74,73,74,78,81],[83,86,88,86,83,81,79],[85,81,76,73,76,81,83]],
    [[78,81,85,86,85,81,78],[81,83,86,85,83,78,74],[83,86,90,88,86,83,81],[85,88,86,85,81,76,73]],
    [[81,85,86,85,81,78,76],[78,81,83,81,78,74,73],[79,83,86,88,86,83,79],[81,76,73,69,73,76,81]],
  ];
  const melody=[],harmony=[],bass=[],drums=[],rhythm=[0,.5,1,1.5,2.5,3,3.5];
  const chords=[[62,66],[59,62],[59,62],[61,64]],roots=[50,47,43,45];
  for(let bar=0;bar<24;bar++){
    const start=bar*4,c=bar%4;
    phrases[Math.floor(bar/4)][c].forEach((n,i)=>note(melody,0,start+rhythm[i],n,.38,88+(i%3)*3));
    for(const b of [0,2])for(const n of chords[c])note(harmony,1,start+b,n,1.7,58);
    [0,1.5,2,3].forEach((b,i)=>note(bass,2,start+b,roots[c]+(i%2?12:0),.4,78));
    for(let i=0;i<8;i++)note(drums,9,start+i*.5,42,.06,58+(i%2?0:12));
    for(const b of [0,2.5])note(drums,9,start+b,36,.08,96);
    for(const b of [1,3])note(drums,9,start+b,38,.08,84);
  }
  melody.push({t:96*PPQ,b:[176,123,0]});
  const jm=[],jh=[],jb=[],jd=[];
  [74,78,81,85,86].forEach((n,i)=>note(jm,0,i*.5,n,i===4?2.8:.38,100));
  for(const n of [62,66])note(jh,1,0,n,1.8,65);
  for(const n of [62,69])note(jh,1,2,n,2.8,70);
  note(jb,2,0,50,1.8,85);note(jb,2,2,38,2.8,85);note(jd,9,0,49,.1,90);note(jd,9,2,36,.1,100);
  jm.push({t:6*PPQ,b:[176,123,0]});
  return {flight:midi([melody,harmony,bass,drums],128,96,'Twist - Open Sky Route'),clear:midi([jm,jh,jb,jd],150,6,'Twist - Light Arrival')};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  await mkdir('public/music',{recursive:true});for(const [name,bytes]of Object.entries(generateMusic()))await writeFile(`public/music/${name}.mid`,bytes);
  console.log('Generated original flight.mid (45 seconds) and clear.mid (2.4 seconds)');
}
