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
export function generateLegacyMusic(){
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

// All motifs below are original. Each section changes rhythm, register and density.
export const HARD_SONGS=[
  {id:'flight',title:'蒼穹突破',bpm:160,root:45,variant:0},
  {id:'flight2',title:'遺跡の閃光',bpm:168,root:50,variant:1},
];
const SECTIONS=[['intro',4],['verse',12],['bridge',8],['chorus',16],['break',8]];
function hardSong({bpm,root,variant,title}) {
  const tracks=Array.from({length:6},()=>[]),beats=192;
  const hit=(part,beat,pitch,length,velocity)=>{
    if(beat>=beats)return;note(tracks[part],part===5?9:part,beat,pitch,Math.min(length,beats-beat),velocity);
  };
  const rhythms=[[[0,.25],[.5,.25],[.75,.2],[1.5,.4],[2,.25],[2.75,.2],[3,.25],[3.5,.4]],
    [[0,.65],[1,.25],[1.5,.25],[2.25,.2],[2.5,.4],[3.25,.2],[3.5,.4]],
    [[0,.3],[.5,.3],[1,.7],[2,.3],[2.5,.3],[3,.7]],
    [[.25,.2],[.75,.2],[1,.3],[1.75,.2],[2.5,.3],[3,.3],[3.5,.4]]];
  const motifs=variant?[[0,12,7,5,3,7,2,0],[7,5,3,2,0,-2,2,7],[12,10,7,5,3,2,0,7],[3,7,12,14,12,7,5,2]]:
    [[0,7,3,2,0,-2,0,-5],[3,5,7,12,10,7,5,3],[12,7,10,12,14,12,7,3],[7,10,12,7,5,3,2,0]];
  let bar=0;
  for(const [section,count]of SECTIONS) for(let local=0;local<count;local++,bar++) {
    const offset=bar*4,quiet=section==='break',chorus=section==='chorus';
    const progression=section==='bridge'?[5,-2,3,7]:quiet?[-4,5,7,7]:variant?[0,-4,-2,7]:[0,-4,-2,-5];
    const degree=progression[local%4],bass=root+degree,third=[-4,-2,3,-5,7].includes(degree)?4:3;
    if(section!=='intro'||local>=2) {
      const motif=motifs[(Math.floor(local/2)+(chorus?2:0))%motifs.length];
      const rhythm=quiet?[[0,1.2],[2.5,.8]]:rhythms[(local+variant+(section==='bridge'?1:0))%rhythms.length];
      rhythm.forEach(([time,length],i)=>{
        const interval=motif[(i+local%2)%motif.length],pitch=bass+(chorus?36:24)+(interval===3?third:interval);
        hit(0,offset+time,pitch,length,chorus?111:quiet?68:102);
        hit(4,offset+time+.5,pitch,Math.min(length,.35),quiet?30:48);
      });
    }
    const arpStep=chorus&&local%4!==3?.25:.5;
    if(!quiet||local%2===0)for(let i=0;i<(quiet?4:4/arpStep);i++) {
      const intervals=[0,third,7,12,7,third,14,7];
      hit(1,offset+i*arpStep,bass+12+intervals[(i+variant*2)%8],arpStep*.72,quiet?38:chorus?75:64);
    }
    for(const time of quiet?[0]:[.5,1.5,2.5,3.5])hit(2,offset+time,bass+12+(local%2?third:7),quiet?1.7:.18,quiet?36:76);
    const bassStep=chorus&&local%4===3?.25:.5;
    for(let i=0;i<(quiet?2:4/bassStep);i++)hit(3,offset+i*(quiet?2:bassStep),bass+([0,0,7,12][(i+variant)%4]),quiet?1.4:bassStep*.77,quiet?62:109);
    const hats=quiet?[0,2]:Array.from({length:chorus?16:8},(_,i)=>i*(chorus?.25:.5));
    for(const time of hats)hit(5,offset+time,42,.045,quiet?34:chorus?65:52);
    for(const time of quiet?[0]:[0,1.5,2,chorus?2.75:3.5])hit(5,offset+time,36,.07,quiet?72:118);
    for(const time of quiet?[3]:[1,3])hit(5,offset+time,38,.075,quiet?55:110);
    if(local===count-1&&!quiet)for(let i=0;i<6;i++)hit(5,offset+2.5+i*.25,[38,45,38,47,50,38][i],.07,90+i*5);
    if(local===0&&!quiet)hit(5,offset,49,.1,94);
  }
  tracks.forEach((track,i)=>track.push({t:beats*PPQ,b:[176+(i===5?9:i),123,0]}));
  return midi(tracks,bpm,beats,`Twist original - ${title}`);
}
function hardClear(){
  const a=[],b=[],c=[],d=[],e=[];
  [69,76,81,83,85,88,81].forEach((pitch,i)=>note(a,0,i<6?i*.5:4,pitch,i===6?3.6:.35,113));
  for(const pitch of [61,64]){note(b,1,0,pitch,1.8,72);note(b,1,4,pitch+12,3.6,82);}
  for(const [time,pitch]of [[0,45],[2,52],[4,33]])note(c,2,time,pitch,time===4?3.6:1.6,108);
  for(const [i,pitch]of [69,76,81,85,88,85,81].entries())note(d,3,.25+i*.5,pitch,.25,46);
  for(const time of [0,1,2,3,4])note(e,9,time,time===4?49:time%2?38:36,.08,115);
  a.push({t:8*PPQ,b:[176,123,0]});return midi([a,b,c,d,e],160,8,'Twist original - Victory Lift');
}
export const BRAVE_SONG={id:'brave',title:'勇進の航路',bpm:170,beats:192};
function braveSong() {
  // A new E-minor composition. No supplied MML notes, waves or envelopes are used.
  const tracks=Array.from({length:6},()=>[]),{beats,bpm,title}=BRAVE_SONG;
  const hit=(part,at,pitch,length,velocity=100)=>{
    if(at>=beats)return;
    note(tracks[part],part===5?9:part,at,pitch,Math.min(length,beats-at),velocity);
  };
  const volume=(part,at,value)=>tracks[part].push({t:Math.round(at*PPQ),b:[176+part,7,value]});
  const chords=[[40,3],[36,4],[43,4],[38,4],[40,3],[45,3],[36,4],[47,4]];
  const scale=[0,2,3,5,7,8,10,12,14,15,17,19];
  const themes=[
    [0,2,4,3,7,6,4,2], [4,7,8,7,5,4,3,1],
    [7,4,5,3,2,4,1,0], [2,3,5,4,7,6,4,1],
    [7,9,8,7,4,6,5,4], [9,7,8,6,4,3,1,4],
    [4,5,7,8,9,7,5,3], [8,7,4,6,3,2,1,0],
  ];
  const rhythms=[[[0,.7],[1,.2],[1.25,.2],[1.75,.2],[2,.45],[2.75,.2],[3,.2],[3.5,.4]],
    [[0,.2],[.5,.45],[1.25,.2],[1.5,.2],[2,.7],[3,.2],[3.25,.2],[3.75,.2]],
    [[0,1.2],[1.5,.2],[1.75,.2],[2.25,.2],[2.5,.2],[3,.2],[3.25,.2],[3.5,.45]],
    [[0,.45],[.75,.2],[1,.2],[1.5,.45],[2.25,.2],[2.5,.2],[3,.45],[3.75,.2]]];
  for(let bar=0;bar<48;bar++) {
    const at=bar*4,intro=bar<4,bridge=bar>=16&&bar<24,chorus=bar>=24&&bar<40;
    const [root,third]=chords[(bar+(bridge?3:0))%8];
    const theme=themes[(Math.floor((bar-4+48)%48/2)+(chorus?4:0))%8];
    const rhythm=intro?[[0,.2],[.75,.2],[1.5,.2],[2,.7],[3,.2],[3.5,.4]]:rhythms[(bar+(bridge?2:0))%4];
    rhythm.forEach(([beat,length],i)=>{
      const pitch=(chorus?76:64)+scale[theme[i%theme.length]];
      hit(0,at+beat,pitch,length,chorus?118:108);
      volume(0,at+beat,127);volume(0,at+beat+Math.min(.1,length*.5),length>.4?86:72);
      // Echo is gated before the next note, so the fifth SCC voice never steals itself.
      hit(4,at+beat+.25,pitch,Math.min(length,.18),43);
    });
    for(let i=0;i<16;i++) {
      // Continuous short bass pairs leave audible gaps without a quiet section.
      const bassPattern=[0,0,12,0,7,0,12,7];
      hit(3,at+i*.25,root+bassPattern[(i+bar%2*2)%8],i%4===0?.19:.13,i%4===0?116:92);
      volume(3,at+i*.25,127);volume(3,at+i*.25+.08,74);
      if(i%2===0||chorus)hit(1,at+i*.25,root+24+[0,third,7,12,7,third,12,7][i%8],.16,chorus?69:58);
    }
    for(const beat of [0,.75,1.5,2.5,3.25])hit(2,at+beat,root+12+(bar%2?third:7),bridge?.36:.14,chorus?82:70);
    for(let i=0;i<16;i++)hit(5,at+i*.25,42,.04,i%2?40:60);
    for(const beat of [0,.75,2,2.75])hit(5,at+beat,36,.07,122);
    for(const beat of [1,3])hit(5,at+beat,38,.07,116);
    if(bar%8===7)for(let i=0;i<4;i++)hit(5,at+3+i*.25,[38,47,45,38][i],.07,100+i*7);
    if([0,4,16,24,40].includes(bar))hit(5,at,49,.1,104);
  }
  tracks.forEach((track,i)=>track.push({t:beats*PPQ,b:[176+(i===5?9:i),123,0]}));
  return midi(tracks,bpm,beats,`Twist original - ${title}`);
}
export function generateMusic(){
  const legacy=generateLegacyMusic();
  return Object.fromEntries([...HARD_SONGS.map(song=>[song.id,hardSong(song)]),['brave',braveSong()],['rock',rockSong()],['clear',hardClear()],['flight-legacy',legacy.flight],...ROCK_TRILOGY.map(song=>[song.id,trilogySong(song)])]);
}
export const ROCK_SONG={id:'rock',title:'黒曜の翼',bpm:156,beats:192};
function rockSong(){
  // Original D-minor rock: fewer attacks, sustained lead with small pitch bends, power chords.
  const tracks=Array.from({length:6},()=>[]),{bpm,beats,title}=ROCK_SONG;
  const hit=(part,at,pitch,length,velocity)=>{if(at<beats)note(tracks[part],part===5?9:part,at,pitch,Math.min(length,beats-at),velocity);};
  const cc=(part,at,value)=>tracks[part].push({t:Math.round(at*PPQ),b:[176+part,7,value]});
  const bend=(at,value)=>tracks[0].push({t:Math.round(at*PPQ),b:[224,value&127,(value>>7)&127]});
  const roots=[38,34,43,45,38,41,43,45];
  const themes=[[0,7,5,3,2,0],[3,5,7,10,7,5],[7,12,10,7,5,3],[5,7,8,7,5,2],
    [12,10,7,10,14,12],[10,12,15,14,12,7],[7,5,3,0,2,-2],[3,7,5,2,0,-2]];
  const rhythms=[[[0,.65],[1,.4],[1.75,.65],[2.75,.2],[3.25,.65]],[[0,1.25],[1.5,.4],[2.25,.65],[3.25,.65]],
    [[0,.4],[.75,.65],[1.75,.4],[2.5,1.3]],[[0,.65],[1,.4],[1.5,.65],[2.5,.4],[3.25,.65]]];
  for(let bar=0;bar<48;bar++){
    const at=bar*4,chorus=bar>=24&&bar<40,bridge=bar>=16&&bar<24,root=roots[(bar+(bridge?2:0))%8];
    const theme=themes[(Math.floor(bar/2)+(chorus?4:0))%8];
    const rhythm=bar<4?[[0,.4],[1,.65],[2,.4],[3,.65]]:rhythms[bar%4];
    rhythm.forEach(([time,length],i)=>{
      const pitch=62+theme[i%theme.length]+(chorus?12:0);hit(0,at+time,pitch,length,119);cc(0,at+time,127);cc(0,at+time+.09,95);cc(0,at+time+Math.min(.3,length*.65),78);
      bend(at+time,8192);
      if(length>=.6){bend(at+time+.2,8704);bend(at+time+.35,7936);bend(at+time+.5,8576);bend(at+time+length-.02,8192);}
      if(chorus&&i%2===0)hit(4,at+time,pitch-12,length*.85,56);
    });
    // Guitar rhythm uses two simultaneous notes (root/fifth); no running arpeggio.
    for(const time of bridge?[0,2]:[0,.75,1.5,2.5,3.25]){
      const gate=bridge?1.3:.3;hit(1,at+time,root+12,gate,96);hit(2,at+time,root+19,gate,87);
    }
    for(let i=0;i<8;i++)hit(3,at+i*.5,root+(i===7&&bar%4===3?12:0),.38,i%2?92:108);
    for(let i=0;i<8;i++)hit(5,at+i*.5,42,.05,i%2?46:61);
    for(const time of [0,2,chorus?2.75:2.5])hit(5,at+time,36,.08,121);
    for(const time of [1,3])hit(5,at+time,38,.08,119);
    if(bar%8===7)for(let i=0;i<4;i++)hit(5,at+3+i*.25,[38,45,47,38][i],.08,105+i*6);
    if([0,4,16,24,40].includes(bar))hit(5,at,49,.12,108);
  }
  tracks.forEach((track,i)=>track.push({t:beats*PPQ,b:[176+(i===5?9:i),123,0]}));
  return midi(tracks,bpm,beats,`Twist original - ${title}`);
}

// Three independent, hand-authored scores. A phrase spans two bars; tuples are
// [beat, MIDI pitch, held beats]. Rests and long notes are part of each melody.
// No external MIDI/MML, recordings, melodies, waves or envelopes are used.
export const ROCK_TRILOGY=[
  {id:'steel',title:'鋼翼の鼓動',bpm:144,beats:256,key:'E minor',
    form:[['intro',4],['verse',12],['lift',8],['chorus',16],['bridge',8],['final',12],['turn',4]]},
  {id:'horizon',title:'黎明の航跡',bpm:148,beats:256,key:'B minor',
    form:[['intro',4],['verse',12],['lift',8],['chorus',12],['bridge',8],['final',16],['turn',4]]},
  {id:'storm',title:'嵐を越えて',bpm:152,beats:256,key:'D minor',
    form:[['intro',8],['verse',8],['lift',8],['chorus',16],['bridge',8],['final',12],['turn',4]]},
];
const TRILOGY_SCORE={
  steel:{
    roots:{intro:[40,40,36,47],verse:[40,36,45,47,40,43,38,47],lift:[36,38,40,47],chorus:[40,43,38,45,36,43,45,47],bridge:[45,36,40,38],turn:[36,38,47,47]},
    melody:{
      intro:[[[0,64,.7],[1,71,.7],[2,76,1.5],[4,74,.7],[5,71,1.7]],[[0,67,.7],[1,71,.7],[2,74,1.5],[4,78,.7],[5,74,.7],[6,71,.8]]],
      verse:[[[0,64,1.3],[1.5,71,.7],[2.5,74,1.2],[4,76,1.7],[6,71,.7]],[[0,72,1.2],[1.5,71,.7],[2.5,67,1.2],[4,69,.7],[5,71,1.7]],
        [[0,64,.7],[1,67,.7],[2,71,1.7],[4.5,74,1.2],[6,72,.7]],[[0,71,1.7],[2,66,.7],[3,69,.7],[4,71,1.2],[5.5,74,.7],[6.5,71,.7]]],
      lift:[[[0,72,1.7],[2,76,.7],[3,74,.7],[4,78,1.7],[6,76,.7]],[[0,74,.7],[1,78,1.7],[3,81,.7],[4,78,1.2],[5.5,74,.7],[6.5,71,.7]]],
      chorus:[[[0,76,1.7],[2,83,1.2],[3.5,81,.7],[4.5,79,1.2],[6,78,.7]],[[0,79,1.2],[1.5,78,.7],[2.5,74,1.2],[4,76,2.7]],
        [[0,76,.7],[1,79,1.7],[3,83,.7],[4,81,1.2],[5.5,79,1.2]],[[0,78,1.7],[2,74,.7],[3,76,.7],[4,71,1.2],[5.5,74,.7],[6.5,78,.7]]],
      bridge:[[[0,69,2.7],[3.5,72,.7],[4.5,71,1.7]],[[.5,67,1.7],[3,66,.7],[4,71,2.7]]],
      turn:[[[0,76,1.2],[1.5,74,.7],[2.5,72,1.2],[4,74,1.7],[6,71,.7]],[[0,71,.7],[1,74,.7],[2,78,1.2],[4,74,1.2],[5.5,71,1.7]]],
    },
    bass:[0,0,0,7,0,0,7,0],response:[76,71],
  },
  horizon:{
    roots:{intro:[35,43,38,42],verse:[35,38,45,40,43,45,42,42],lift:[43,45,35,42],chorus:[35,43,38,45,40,43,42,42],bridge:[40,35,43,42],turn:[43,45,42,42]},
    melody:{
      intro:[[[.5,66,1.2],[2,71,2.7],[5.5,73,.7],[6.5,74,.7]],[[0,78,2.7],[3.5,76,.7],[5,73,1.7]]],
      verse:[[[.5,71,1.7],[2.5,78,1.2],[4,76,1.7],[6,74,.7]],[[0,73,1.2],[1.5,74,.7],[3,78,1.7],[5,76,1.2],[6.5,73,.7]],
        [[0,74,2.2],[2.5,78,.7],[4,83,1.7],[6.5,81,.7]],[[.5,79,1.2],[2,78,.7],[3.5,76,1.2],[5,73,1.7]]],
      lift:[[[0,79,1.7],[2,78,.7],[3.5,76,1.2],[5,81,1.7]],[[.5,78,1.2],[2,81,1.2],[3.5,83,2.2],[6,82,.7]]],
      chorus:[[[0,78,2.2],[2.5,83,1.2],[4,81,.7],[5,78,1.7]],[[.5,79,1.2],[2,83,1.7],[4,86,2.2],[6.5,83,.7]],
        [[0,81,1.7],[2,78,.7],[3.5,76,1.2],[5,79,1.7]],[[0,78,1.2],[1.5,76,.7],[3,73,1.7],[5,78,2.2]]],
      bridge:[[[1,71,2.2],[4,74,1.7],[6.5,78,.7]],[[0,79,2.7],[3.5,78,1.2],[5.5,73,1.2]]],
      turn:[[[0,79,1.7],[2.5,81,1.2],[4,78,2.2],[6.5,76,.7]],[[.5,73,1.2],[2,78,1.7],[4.5,82,.7],[6,78,1.2]]],
    },
    bass:[0,0,7,0,0,12,0,7],response:[78,74],
  },
  storm:{
    roots:{intro:[38,38,34,45],verse:[38,34,36,45,38,41,34,45],lift:[43,34,36,45],chorus:[38,34,41,36,43,34,45,45],bridge:[34,38,43,45],turn:[34,36,45,45]},
    melody:{
      intro:[[[0,62,.45],[.75,62,.45],[2.5,69,1.2],[4.5,65,.7],[6,64,.7]],[[.5,62,1.2],[2.5,69,.7],[4,73,1.2],[6.5,69,.7]]],
      verse:[[[0,62,.7],[1.5,69,1.2],[3.5,67,.7],[5,65,1.7]],[[.5,65,1.2],[2.5,69,.7],[4.5,70,1.2],[6.5,69,.7]],
        [[0,67,1.2],[2,74,.7],[3.5,72,1.2],[5.5,69,1.2]],[[.75,69,.7],[2.5,65,1.2],[4.5,64,.7],[6,61,1.2]]],
      lift:[[[.5,67,1.2],[2.5,70,.7],[4,74,1.7],[6.5,72,.7]],[[0,72,1.2],[2,76,.7],[3.5,73,1.2],[5.5,69,1.2]]],
      chorus:[[[0,74,1.2],[1.75,81,1.2],[3.5,79,.7],[5,77,1.7]],[[.5,77,1.2],[2.5,82,1.2],[4.5,81,.7],[6,77,1.2]],
        [[0,79,.7],[1.5,81,1.2],[3.5,77,1.2],[5.5,74,1.2]],[[.75,76,1.2],[2.5,73,.7],[4,69,1.7],[6.5,73,.7]]],
      bridge:[[[0,65,2.2],[3.5,62,1.2],[5.5,69,1.2]],[[1,67,1.7],[4,64,1.2],[6,61,.7]]],
      turn:[[[.5,70,1.2],[2.5,72,.7],[4,73,1.2],[6,69,1.2]],[[0,73,.7],[1.5,76,1.2],[3.5,73,.7],[5,69,1.7]]],
    },
    bass:[0,0,0,7,0,12,0,7],response:[74,69],
  },
};

function trilogySong({id,bpm,beats,title,form}){
  const score=TRILOGY_SCORE[id],tracks=Array.from({length:6},()=>[]);
  const hit=(part,at,pitch,length,velocity)=>note(tracks[part],part===5?9:part,at,pitch,Math.min(length,beats-at),velocity);
  const cc=(part,at,value)=>tracks[part].push({t:Math.round(at*PPQ),b:[176+(part===5?9:part),7,value]});
  const bend=(at,value)=>tracks[0].push({t:Math.round(at*PPQ),b:[224,value&127,(value>>7)&127]});
  let bar=0;
  for(const [section,count]of form){
    const singing=section==='chorus'||section==='final',quiet=section==='bridge';
    const phraseBank=score.melody[section==='final'?'chorus':section];
    const roots=score.roots[section==='final'?'chorus':section];
    for(let local=0;local<count;local++,bar++){
      const at=bar*4,root=roots[local%roots.length];
      if(local%2===0){
        const phrase=phraseBank[(Math.floor(local/2)+(section==='final'?1:0))%phraseBank.length];
        for(const [time,pitch,length]of phrase){
          // Guitar attack falls into a held tone; vibrato starts after the attack.
          const start=at+time,end=start+length;
          hit(0,start,pitch,length,singing?110:quiet?93:103);
          cc(0,start,118);cc(0,start+.08,101);cc(0,start+Math.min(.28,length*.55),quiet?82:87);
          bend(start,8192);
          if(length>=1.2){
            // Small scoops stay well within the engine's two-semitone bend range.
            bend(start+.12,id==='storm'?7168:7680);bend(start+.25,8192);
            for(let n=0,t=start+.55;t<end-.08;n++,t+=.18)bend(t,8192+(n%2?-288:352));
          }
          bend(end-.02,8192);cc(0,end-.045,68);
        }
      }
      // Distinct root/fifth chugs; each SCC part remains strictly monophonic.
      const guitar=quiet?[[0,1.25],[2.5,.8]]:id==='steel'?
        (singing?[[0,.27],[.5,.22],[1.5,.3],[2,.27],[2.5,.22],[3.5,.3]]:Array.from({length:8},(_,i)=>[i*.5,i%2?.2:.26])):
        id==='horizon'?(singing?[[0,.42],[1,.3],[1.75,.4],[2.75,.4],[3.5,.32]]:[[0,.65],[1.5,.35],[2.5,.65]]):
        (singing?[[0,.3],[.75,.28],[1.5,.35],[2.5,.3],[3.25,.32]]:[[0,.22],[.5,.22],[1.75,.3],[2.25,.22],[3,.4]]);
      for(const [time,length]of guitar){
        hit(1,at+time,root+12,length,quiet?66:96);hit(2,at+time,root+19,length,quiet?60:86);
        for(const part of [1,2]){cc(part,at+time,116);cc(part,at+time+Math.min(.12,length*.6),quiet?88:76);}
      }
      // Eight steady bass attacks in every bar, including quieter sections.
      for(let i=0;i<8;i++){
        const pitch=root+score.bass[(i+(id==='horizon'&&local%4===3?2:0))%8];
        hit(3,at+i*.5,pitch,id==='storm'?.32:.38,quiet?78:i%2?94:106);
        cc(3,at+i*.5,115);cc(3,at+i*.5+.14,84);
      }
      // Brief synth answers once per four bars, instead of an arpeggio.
      // Horizon answers in the guitar rest so dynamic SCC bank allocation cannot
      // steal its sustained lead despite the score staying within five notes.
      if(local%4===3&&!quiet)for(let i=0;i<(id==='horizon'?1:2);i++)hit(4,at+(id==='horizon'?3.2:3+i*.45),score.response[(i+Math.floor(local/4))%2],.24,singing?52:43);
      const fill=local===count-1&&section!=='turn';
      for(let i=0;i<8;i++)hit(5,at+i*.5,42,.045,quiet?(i%2?30:44):(i%2?45:60));
      const kicks=quiet?[0,2]:id==='steel'?[0,1.5,2,3.5]:id==='horizon'?[0,2,2.75]:[0,.75,2,2.5];
      for(const time of kicks)if(!fill||time<3)hit(5,at+time,36,.075,quiet?91:115);
      for(const time of [1,3])if(!fill||time<3)hit(5,at+time,38,.075,quiet?79:110);
      if(fill)for(let i=0;i<4;i++)hit(5,at+3+i*.25,(id==='steel'?[38,38,45,38]:id==='horizon'?[38,47,45,38]:[45,38,47,38])[i],.065,93+i*5);
      if(local===0&&!quiet)hit(5,at,49,.11,96);
    }
  }
  tracks.forEach((track,i)=>track.push({t:beats*PPQ,b:[176+(i===5?9:i),123,0]}));
  return midi(tracks,bpm,beats,`Twist original - ${title}`);
}

export function generatedTracks(){
  const parts={'1':{waveform:1,volume:94},'2':{waveform:4,volume:74},'3':{waveform:0,volume:68},'4':{waveform:1,volume:92},'5':{waveform:1,volume:54},'10':{volume:100}};
  return {flightPlaylist:['flight','flight2'],flightSets:{brave:['brave'],rock:['rock'],steel:['steel'],horizon:['horizon'],storm:['storm'],newrock:['steel','horizon','storm'],all:['flight','flight2','brave','rock','steel','horizon','storm']},
    rock:{title:ROCK_SONG.title,file:'rock.mid',loop:{start:0,end:Math.round(60000000/ROCK_SONG.bpm)/1000000*ROCK_SONG.beats},parts:{'1':{waveform:1,volume:111},'2':{waveform:0,volume:55},'3':{waveform:0,volume:49},'4':{waveform:1,volume:88},'5':{waveform:1,volume:43},'10':{volume:104}}},
    brave:{title:BRAVE_SONG.title,file:'brave.mid',loop:{start:0,end:Math.round(60000000/BRAVE_SONG.bpm)/1000000*BRAVE_SONG.beats},parts:{'1':{waveform:4,volume:101},'2':{waveform:1,volume:66},'3':{waveform:0,volume:64},'4':{waveform:1,volume:96},'5':{waveform:1,volume:44},'10':{volume:105}}},
    ...Object.fromEntries(HARD_SONGS.map(song=>[song.id,{title:song.title,file:`${song.id}.mid`,loop:{start:0,end:Math.round(60000000/song.bpm)/1000000*192},parts}])),
    ...Object.fromEntries(ROCK_TRILOGY.map(song=>[song.id,{title:song.title,file:`${song.id}.mid`,loop:{start:0,end:Math.round(60000000/song.bpm)/1000000*song.beats},parts:{'1':{waveform:1,volume:101},'2':{waveform:0,volume:51},'3':{waveform:0,volume:45},'4':{waveform:1,volume:83},'5':{waveform:1,volume:38},'10':{volume:96}}}])),
    clear:{title:'突破の凱歌',file:'clear.mid',parts:{'1':{waveform:4,volume:96},'2':{waveform:1,volume:78},'3':{waveform:1,volume:88},'4':{waveform:1,volume:50},'10':{volume:98}}},
    comparison:{title:'ひかりの航路（比較）',file:'flight-legacy.mid',loop:{start:0,end:45},parts:{'1':{waveform:4,volume:96},'2':{waveform:2,volume:78},'3':{waveform:0,volume:96},'10':{volume:85}}}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  await mkdir('public/music',{recursive:true});for(const [name,bytes]of Object.entries(generateMusic()))await writeFile(`public/music/${name}.mid`,bytes);
  await writeFile('public/music/tracks.json',JSON.stringify(generatedTracks(),null,2)+'\n');
  console.log('Generated originals: preserved preceding six MIDI tracks; added steel / horizon / storm, 64 bars each.');
}
