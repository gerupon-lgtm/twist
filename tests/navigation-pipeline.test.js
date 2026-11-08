import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath,pathToFileURL } from 'node:url';
import path from 'node:path';

// Load the real production modules and frozen v24 fixtures. The loader replaces
// the Vite worklet URL and resolves their unchanged production-relative dependencies.
const scratch=path.dirname(fileURLToPath(import.meta.url));
const original=path.resolve(scratch,'../src/feedback');
const scratchFiles=new Set(['audio.js','audio-worklet.js','model.js','chip-mixer.js','navigation-audio.js']);
const moduleUrls=new Map();
async function moduleUrl(name){
  if(moduleUrls.has(name))return moduleUrls.get(name);
  let source=await readFile(name.startsWith('v24-')?path.join(scratch,'fixtures/navigation-v24',name):path.join(original,name),'utf8');
  if(name==='audio.js')source=source.replace(/^import workletUrl from .*;$/m,"const workletUrl='unit-worklet.js';");
  const matches=[...source.matchAll(/from\s+(['"])(\.[^'"]+)\1/g)];
  for(const match of matches.reverse()){
    const specifier=match[2],base=path.basename(specifier);
    const url=specifier.startsWith('./')&&scratchFiles.has(base)?await moduleUrl(base):pathToFileURL(path.resolve(original,specifier)).href;
    source=source.slice(0,match.index)+`from '${url}'`+source.slice(match.index+match[0].length);
  }
  const url='data:text/javascript;base64,'+Buffer.from(source).toString('base64');moduleUrls.set(name,url);return url;
}
const {ChipMixer}=await import(await moduleUrl('chip-mixer.js'));
const {ChipMixer:OriginalMixer}=await import(await moduleUrl('v24-chip-mixer.js'));
const {flightFeedback,sfxRegisters}=await import(await moduleUrl('model.js'));
const originalModel=await import(await moduleUrl('v24-model.js'));
const {navigationCue}=await import(await moduleUrl('navigation-audio.js'));
const settings={sound:true,sfx:true,volume:25,vario:true};
const flying={mode:'flight',altitude:30,groundClearance:30,verticalSpeed:0,throttle:.5,speed:6};
const model=flightFeedback(flying,settings);
const pureModel=flightFeedback({...flying,throttle:0,speed:0},settings);
const equalSamples=(a,b)=>assert.equal(a.findIndex((value,i)=>value!==b[i]),-1,'first unequal rendered sample');
const energy=values=>values.reduce((sum,value)=>sum+value*value,0);
function music(m){
  for(let i=0;i<32;i++)m.writeMusic(i,i<16?90:-90);
  for(const [addr,value]of [[0x80,140],[0x81,0],[0x8a,9],[0x8f,1]])m.writeMusic(addr,value);
  m.musicGain=.5;
}

test('ordinary center mixer matches v24 for the same SFX, retaining warnings/events/vario around the approved wind change',()=>{
  const baseline=new OriginalMixer(),next=new ChipMixer();
  for(const m of [baseline,next]){m.setVolume(37);music(m);}
  for(const [cue,event,vario]of [['engine',null,false],['stall',null,false],['ground',null,false],['buffet',null,false],['engine','collect',false],['engine','crash',false],['engine','exitOpen',false],['engine','clear',false],['engine',null,true]]){
    const state=vario?flightFeedback({...flying,verticalSpeed:2},settings):{...model,cue};
    const before=originalModel.sfxRegisters(state,event,20,true),after=sfxRegisters(state,event,20,true);
    // v29 deliberately changes wind amplitude and the shared noise period.
    // Preserve the frozen mixer comparison with identical register input, while
    // still checking every other warning/event/vario register against v24.
    for(let register=0;register<before.length;register++)if(register!==6&&register!==8)assert.equal(after[register],before[register],`unchanged SFX register ${register}`);
    before[6]=after[6];before[8]=after[8];
    equalSamples(before,after);baseline.writeSfx(before);next.writeSfx(after);
    for(let block=0;block<3;block++){
      const a=new Float32Array(128),left=new Float32Array(128),right=new Float32Array(128);
      baseline.render(a);next.render(left,right);equalSamples(a,left);equalSamples(left,right);
    }
  }
  baseline.stop();next.stop();const a=new Float32Array(128),left=new Float32Array(128),right=new Float32Array(128);
  baseline.render(a);next.render(left,right);equalSamples(a,left);equalSamples(left,right);
  // The old mixer retains its music gain after stop; the worklet gates actual
  // stopped output to zero. This comparison deliberately preserves that path.
});

test('navigation hard pans only its channel C and leaves engine/wind and music byte-identical on the other side',()=>{
  for(const pan of [-1,1]){
    const next=new ChipMixer(),background=new OriginalMixer();
    for(const m of [next,background]){m.setVolume(25);music(m);}
    next.writeSfx(sfxRegisters(model,null,0,false,new Uint8Array(14),0,{elapsedMs:20}));
    background.writeSfx(sfxRegisters(model));
    const beforeMusic=[...next.musicPsg.psg.regs],beforeScc=[...next.chip.volume];
    const left=new Float32Array(2048),right=new Float32Array(2048),center=new Float32Array(2048);
    next.render(left,right,pan);background.render(center);
    equalSamples(pan>0?left:right,center);
    assert.ok(energy(pan>0?right:left)>0);
    assert.ok((pan>0?right:left).some((v,i)=>Math.abs(v-center[i])>1e-5));
    assert.deepEqual([...next.musicPsg.psg.regs],beforeMusic);assert.deepEqual([...next.chip.volume],beforeScc);
  }
});

test('navigation left/right/center retain a constant mono sum and valid samples',()=>{
  const rendered=[];
  for(const pan of [-1,-.4,0,.4,1]){
    const m=new ChipMixer();m.writeSfx(sfxRegisters(pureModel,null,0,false,new Uint8Array(14),0,{elapsedMs:20}));
    const left=new Float32Array(2048),right=new Float32Array(2048);m.render(left,right,pan);
    assert.ok(left.every(Number.isFinite)&&right.every(Number.isFinite));
    const monoMixer=new ChipMixer();monoMixer.writeSfx(sfxRegisters(pureModel,null,0,false,new Uint8Array(14),0,{elapsedMs:20}));
    const mono=new Float32Array(2048);monoMixer.render(mono,null,pan);
    for(let i=0;i<mono.length;i++)assert.ok(Math.abs(mono[i]-(left[i]+right[i])*.5)<1e-7);
    rendered.push({left,right});
  }
  assert.ok(energy(rendered[0].left)>0);assert.equal(energy(rendered[0].right),0);
  assert.ok(energy(rendered[4].right)>0);assert.equal(energy(rendered[4].left),0);
  equalSamples(rendered[2].left,rendered[2].right);
  for(const output of rendered)for(let i=0;i<output.left.length;i++)assert.ok(Math.abs(output.left[i]+output.right[i]-rendered[2].left[i]-rendered[2].right[i])<1e-7);
});

test('cue headroom limiting retains the same mono sum near clipped music without moving the music',()=>{
  const outputs=[];
  for(const pan of [-1,0,1]){
    const m=new ChipMixer();m.setVolume(100);music(m);m.musicGain=40;
    m.writeSfx(sfxRegisters(model,null,0,false,new Uint8Array(14),0,{elapsedMs:20}));
    const left=new Float32Array(4096),right=new Float32Array(4096);m.render(left,right,pan);outputs.push({left,right});
    assert.ok(left.every(v=>Math.abs(v)<=1)&&right.every(v=>Math.abs(v)<=1));
  }
  const baseline=new OriginalMixer();baseline.setVolume(100);music(baseline);baseline.musicGain=40;baseline.writeSfx(sfxRegisters(model));
  const common=new Float32Array(4096);baseline.render(common);assert.ok(common.some(v=>Math.abs(v)===1));
  equalSamples(outputs[2].left,common);
  for(const output of outputs)for(let i=0;i<output.left.length;i++)assert.ok(Math.abs(output.left[i]+output.right[i]-outputs[1].left[i]-outputs[1].right[i])<2e-7);
});

test('mixer cancellation makes following warning/event exactly centered without a stereo tail',()=>{
  const m=new ChipMixer(),left=new Float32Array(1024),right=new Float32Array(1024);
  m.writeSfx(sfxRegisters(model,null,0,false,new Uint8Array(14),0,{elapsedMs:20}));m.render(left,right,1);
  m.cancelNavigation();m.writeSfx(sfxRegisters({...model,cue:'ground'},'collect',20,true));m.render(left,right);
  equalSamples(left,right);assert.ok(energy(left)>0);
  m.stop();m.render(left,right);assert.ok(left.every(v=>v===0)&&right.every(v=>v===0));
});

let Processor;
globalThis.AudioWorkletProcessor=class{constructor(){this.port={messages:[],postMessage(message){this.messages.push(message);}};}};
globalThis.sampleRate=48000;globalThis.currentTime=0;
globalThis.registerProcessor=(_name,constructor)=>{Processor=constructor;};
await import(await moduleUrl('audio-worklet.js'));
const send=(p,data)=>p.port.onmessage({data});
function state(p,changes={},navigation={bearingDeg:70,enabled:true}){
  send(p,{type:'state',model:flightFeedback({...flying,...changes},settings),settings,navigation});
}
function step(p,blocks=1){
  let output;
  for(let i=0;i<blocks;i++){output=[new Float32Array(128),new Float32Array(128)];p.process([], [output]);globalThis.currentTime+=128/48000;}
  return output;
}

test('worklet acknowledges accepted pan/interval and repeatedly schedules shorter intervals facing forward',()=>{
  globalThis.currentTime=10;const p=new Processor();state(p,{}, {bearingDeg:180,enabled:true});step(p,12);
  let ack=p.navigationSnapshot();assert.equal(ack.accepted,1);assert.equal(ack.lastPan,1);assert.equal(ack.lastIntervalMs,1200);
  assert.ok(p.port.messages.some(m=>m.type==='navigation'&&m.navigation.accepted===1));
  step(p,20);assert.equal(p.navigationSnapshot().active,false);
  state(p,{}, {bearingDeg:0,enabled:true});step(p,100);
  ack=p.navigationSnapshot();assert.ok(ack.accepted>=2);assert.equal(ack.lastPan,0);assert.equal(ack.lastIntervalMs,300);
  send(p,{type:'poll'});assert.equal(p.port.messages.at(-1).navigation.accepted,ack.accepted);
});

test('warnings, vario and every event cancel mid-burst and keep their entire quiet gaps reserved',()=>{
  const blockers=[{altitude:1,groundClearance:1},{angleOfAttack:15*Math.PI/180},{angleOfAttack:25*Math.PI/180},{verticalSpeed:1},...['collect','exitOpen','clear','crash'].map(event=>({event}))];
  for(const blocker of blockers){
    globalThis.currentTime=30;const p=new Processor();state(p);step(p,8);assert.equal(p.navigationSnapshot().active,true);
    if(blocker.event)send(p,{type:'event',kind:blocker.event,settings});else state(p,blocker);
    let ack=p.navigationSnapshot();assert.equal(ack.active,false);assert.equal(ack.pan,0);assert.equal(ack.suppressed,1);
    assert.ok(['warning','vario','event'].includes(ack.reason));
    const [left,right]=step(p,20);equalSamples(left,right);assert.equal(p.navigationSnapshot().accepted,1);
    if(!blocker.event){
      let sawQuietGap=false;
      for(let i=0;i<120;i++){
        step(p);
        const quiet=p.model.vario?.active?p.varioPhase*p.model.vario.periodMs>=p.model.vario.onMs:
          !originalModel.pulseAt(p.model.soundPattern,(currentTime-p.cueAt)*1000);
        if(quiet){sawQuietGap=true;assert.equal(p.navigationSnapshot().active,false);assert.equal(p.navigationSnapshot().accepted,1);}
      }
      assert.equal(sawQuietGap,true);
    }
    // Returning to an ordinary flight starts fresh rather than replaying the old burst.
    globalThis.currentTime=40;state(p);step(p,1);assert.equal(p.navigationSnapshot().accepted,2);
  }
});

test('toggle, no target, sound/SFX off, stop and resume cancel navigation immediately',()=>{
  for(const kind of ['toggle','invalid','sound','sfx','stop']){
    globalThis.currentTime=60;const p=new Processor();state(p);step(p,8);
    if(kind==='toggle')state(p,{}, {bearingDeg:70,enabled:false});
    if(kind==='invalid')state(p,{}, {bearingDeg:NaN,enabled:true});
    if(kind==='sound'||kind==='sfx')send(p,{type:'settings',settings:{...settings,[kind]:false}});
    if(kind==='stop')send(p,{type:'stop'});
    assert.equal(p.navigationSnapshot().active,false);assert.equal(p.navigationSnapshot().pan,0);
    const [left,right]=step(p,4);equalSamples(left,right);
    if(kind==='sound'||kind==='stop')assert.ok(left.every(v=>v===0));
    state(p);step(p);assert.equal(p.navigationSnapshot().accepted,2);
  }
});

test('resetting counters during a burst cannot stall the navigation scheduler',()=>{
  globalThis.currentTime=90;const p=new Processor();state(p,{}, {bearingDeg:0,enabled:true});step(p,8);
  send(p,{type:'resetMetrics'});assert.equal(p.navigationSnapshot().accepted,0);
  step(p,140);assert.ok(p.navigationSnapshot().accepted>=1);
});

test('navigation changes only C registers and its own diagnostic state',()=>{
  const base=sfxRegisters(model),navigation=sfxRegisters(model,null,0,false,new Uint8Array(14),0,{elapsedMs:20});
  for(const i of [0,1,2,3,6,8,9,11,12,13])assert.equal(navigation[i],base[i]);
  assert.equal(navigation[7]&~4,base[7]&~4);assert.ok(navigation[10]>0);
  for(const value of [NaN,-1,70,Infinity])assert.equal(sfxRegisters(model,null,0,false,new Uint8Array(14),0,{elapsedMs:value})[10],0);
});

test('audio creates no context before explicit unlock and uses stereo after the gesture',async()=>{
  let contexts=0;const nodes=[];
  class Context{
    constructor(){contexts++;this.state='suspended';this.currentTime=0;this.audioWorklet={addModule:async()=>{}};}
    resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
  }
  globalThis.window={AudioContext:Context};globalThis.AudioWorkletNode=class{
    constructor(context,_name,options){this.context=context;this.options=options;this.port={messages:[],postMessage(message){this.messages.push(message);}};nodes.push(this);}
    connect(){}disconnect(){}
  };
  const {createGameAudio}=await import(await moduleUrl('audio.js'));const audio=createGameAudio();
  try{
    audio.start();audio.update(model,settings,null,{bearingDeg:35,enabled:true});audio.event('collect',settings);
    assert.equal(contexts,0);assert.equal(audio.snapshot().workletReady,false);
    await audio.unlock();assert.equal(contexts,1);assert.deepEqual(nodes[0].options.outputChannelCount,[2]);
    assert.equal(nodes[0].port.messages.at(-1).navigation.bearingDeg,35);
    nodes[0].port.onmessage({data:{type:'navigation',navigation:{accepted:1,active:true,pan:.4}}});
    assert.equal(audio.snapshot().navigation.acknowledged.accepted,1);
    const snapshot=audio.snapshot();snapshot.navigation.acknowledged.accepted=99;assert.equal(audio.snapshot().navigation.acknowledged.accepted,1);
    const before=nodes[0].port.messages.filter(m=>m.type==='event').length;
    audio.event('collect',settings);
    assert.equal(nodes[0].port.messages.filter(m=>m.type==='event').length,before+1,'a running context receives the priority event before a same-frame passby');
    audio.stop();await Promise.resolve();
    assert.equal(nodes[0].port.messages.filter(m=>m.type==='event').length,before+1,'stop cannot replay a delivered event');
    assert.equal(nodes[0].port.messages.at(-1).type,'stop');assert.equal(audio.snapshot().contextState,'suspended');
    audio.event('collect',settings);audio.stop();await Promise.resolve();
    assert.equal(nodes[0].port.messages.filter(m=>m.type==='event').length,before+1,'an event awaiting resume is cancelled by stop');
    audio.start();audio.update(model,settings,null,{bearingDeg:-35,enabled:true});
    assert.equal(nodes[0].port.messages.at(-1).navigation.bearingDeg,-35);
  }finally{audio.dispose();delete globalThis.window;delete globalThis.AudioWorkletNode;}
});

test('stop while the worklet loads cannot replay a queued navigation state',async()=>{
  let finishModule,context;const nodes=[];
  globalThis.window={AudioContext:class{
    constructor(){context=this;this.state='suspended';this.audioWorklet={addModule:()=>new Promise(resolve=>{finishModule=resolve;})};}
    resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
  }};
  globalThis.AudioWorkletNode=class{
    constructor(){this.port={messages:[],postMessage(message){this.messages.push(message);}};nodes.push(this);}
    connect(){}disconnect(){}
  };
  const {createGameAudio}=await import(await moduleUrl('audio.js'));const audio=createGameAudio();
  try{
    audio.start();audio.update(model,settings,null,{bearingDeg:35,enabled:true});
    const ready=audio.unlock();await Promise.resolve();assert.equal(typeof finishModule,'function');
    audio.stop();finishModule();await ready;
    assert.equal(context.state,'suspended');assert.equal(nodes.length,1);assert.equal(nodes[0].port.messages.length,0);
  }finally{audio.dispose();delete globalThis.window;delete globalThis.AudioWorkletNode;}
});

after(()=>{for(const key of ['AudioWorkletProcessor','sampleRate','currentTime','registerProcessor'])delete globalThis[key];});
