import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createBriefingAudioBridge} from '../src/feedback/briefing-audio-bridge.js';

const audioUrl=new URL('../src/feedback/audio.js',import.meta.url);
const audioSource=(await readFile(audioUrl,'utf8')).replace(/^import workletUrl[^\n]+/,'const workletUrl="unit-worklet";')
  .replace(/from\s+(['"])(\.[^'"]+)\1/g,(_all,_quote,path)=>`from '${new URL(path,audioUrl).href}'`);
const {createGameAudio}=await import('data:text/javascript;base64,'+Buffer.from(audioSource).toString('base64'));
const settings={sound:true,sfx:true,volume:25,bgm:true,vario:false};
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
function restoreGlobals(t,values){const old=new Map(Object.keys(values).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  for(const [key,value]of Object.entries(values))Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
  t.after(()=>{for(const [key,value]of old){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}});
}
function audioFixture(t,{moduleGate=null,queuedSuspend=false}={}){
  const messages=[];let context,node,contexts=0;
  restoreGlobals(t,{window:{AudioContext:class{
    constructor(){context=this;contexts++;this.state='suspended';this.currentTime=0;this.suspending=false;this.resumes=0;this.audioWorklet={addModule:()=>moduleGate??Promise.resolve()};}
    resume(){this.resumes++;this.suspending=false;this.state='running';return Promise.resolve();}
    suspend(){this.suspending=true;if(!queuedSuspend)this.state='suspended';return Promise.resolve();}
    flush(){if(this.suspending)this.state='suspended';}close(){this.state='closed';return Promise.resolve();}
  }},AudioWorkletNode:class{constructor(){node=this;this.port={postMessage:message=>messages.push(message)};}connect(){}disconnect(){}},document:{hidden:false}});
  const audio=createGameAudio();t.after(()=>audio.dispose());
  return {audio,messages,context:()=>context,contexts:()=>contexts,receive:briefing=>node.port.onmessage({data:{briefing}})};
}

test('warm is silent, begin resumes after halt, and visual end waits for the latest sound ACK',async t=>{
  const f=audioFixture(t,{queuedSuspend:true});await f.audio.warmBriefing(settings);assert.equal(f.contexts(),1);
  assert.equal(f.messages.some(message=>message.type==='briefingTone'||message.type==='musicReg'||message.type==='event'),false);
  f.audio.stop();await f.audio.beginBriefing(1,settings);f.context().flush();assert.equal(f.context().state,'running');assert.equal(f.audio.briefingReady(1),true);
  assert.equal(f.audio.briefingCue(1,{kind:'complete',remainingSeconds:.1},settings),true);f.audio.finishBriefing(1);
  f.receive({session:1,sequence:0,active:false,needsFuture:false,closed:true});assert.equal(f.context().suspending,false,'An earlier ACK cannot refund a later sound');
  f.receive({session:1,sequence:1,active:false,needsFuture:false,closed:true});assert.equal(f.context().suspending,true);
});
test('late module work cannot begin the cancelled map or suspend the current map',async t=>{
  const gate=deferred(),f=audioFixture(t,{moduleGate:gate.promise});
  const warm=f.audio.warmBriefing(settings),old=f.audio.beginBriefing(1,settings);f.audio.cancelBriefing(1);
  const current=f.audio.beginBriefing(2,settings);gate.resolve();await Promise.all([warm,old,current]);
  assert.deepEqual(f.messages.filter(message=>message.type==='briefingBegin').map(message=>message.session),[2]);
  assert.equal(f.context().state,'running');assert.equal(f.audio.briefingReady(2),true);assert.equal(f.audio.briefingReady(1),false);
});
test('late cancelled intro preparation and ACK cannot stop a new countdown or GO',async t=>{
  const gate=deferred(),f=audioFixture(t,{moduleGate:gate.promise});
  const warm=f.audio.warmBriefing(settings),intro=f.audio.beginBriefing(1,settings);f.audio.cancelBriefing(1);
  const countdown=f.audio.prepareCountdown(1,settings);gate.resolve();await Promise.all([warm,intro,countdown]);
  assert.equal(f.context().state,'running');assert.equal(f.messages.some(message=>message.type==='briefingBegin'),false);
  f.audio.start();assert.equal(f.audio.countdownTone(1,'go',settings),true);f.receive({session:1,sequence:1,active:false,needsFuture:false,closed:true});
  assert.equal(f.context().state,'running');assert.equal(f.audio.cancelBriefing(1),false);
});
test('sound, SFX and zero-volume permissions prevent intro Context creation',async t=>{
  const f=audioFixture(t);for(const value of [{...settings,sound:false},{...settings,sfx:false},{...settings,volume:0}]){
    await f.audio.warmBriefing(value);assert.equal(f.audio.beginBriefing(1,value),false);
  }assert.equal(f.contexts(),0);assert.deepEqual(f.messages,[]);
});

test('a static map gives a fast resume one cue, drops a late resume, and cancels hidden work',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  for(const variant of ['fast','late','hidden']){
    const ready=deferred(),cues=[],cancelled=[];let now=0,canSound=false;
    const bridge=createBriefingAudioBridge({readSettings:()=>settings,now:()=>now,output:{warmBriefing(){},
      beginBriefing:()=>ready.promise,briefingReady:()=>canSound,briefingCue:(session,cue)=>cues.push({session,...cue}),
      cancelBriefing:(session,reason)=>cancelled.push({session,reason}),finishBriefing(){}}});
    const open={type:'open',session:1,origin:'start',courseId:'fixture',visibleSeconds:0,progress:1,drawSeconds:0,reducedMotion:true,visible:true,
      points:[{id:'tgt-1',kind:'target',progress:.5},{id:'exit',kind:'exit',progress:1}]};
    bridge.signal(open);assert.equal(cues.length,0);
    if(variant==='hidden')bridge.signal({...open,type:'visibility',visible:false});
    now=variant==='late'?200:20;canSound=true;ready.resolve(true);await settle();t.mock.timers.tick(150);
    assert.equal(cues.length,variant==='fast'?1:0,variant);if(cues.length)assert.equal(cues[0].kind,'complete');
    bridge.stop();
  }
});

let Processor;
async function processorFixture(t,rate=48000){
  const messages=[];restoreGlobals(t,{sampleRate:rate,currentTime:0,AudioWorkletProcessor:class{constructor(){this.port={postMessage:message=>messages.push(message)};}},registerProcessor:(_name,value)=>{Processor=value;}});
  if(!Processor)await import('../src/feedback/audio-worklet.js?unit-briefing');
  const p=new Processor();p.port.postMessage=message=>messages.push(message);
  const send=message=>p.port.onmessage({data:message});send({type:'settings',settings});
  return {p,send,messages,tone:(kind,sequence=1,extra={})=>send({type:'briefingTone',session:1,kind,index:0,total:3,sequence,expiresAt:currentTime+.1,...extra}),
    process:seconds=>{globalThis.currentTime=seconds;const left=new Float32Array(128),right=new Float32Array(128);p.process([],[[left,right]]);return {left,right};}};
}
test('the real worklet produces intro PCM, closes naturally and keeps music and flight inactive',async t=>{
  const f=await processorFixture(t);f.send({type:'briefingBegin',session:1});f.tone('opening');
  const out=f.process(.02);assert.ok(out.left.some(value=>value!==0));assert.equal(f.p.active,false);assert.equal(f.p.musicPlaying,false);
  f.tone('complete',2);f.send({type:'briefingVisualEnd',session:1});f.process(.04);
  assert.equal(f.p.briefingSnapshot().active,true);const end=f.process(.351);
  assert.equal(f.p.briefingSnapshot().closed,true);assert.equal(f.p.briefingSnapshot().reason,'finished');assert.ok(end.left.every(value=>value===0));
  assert.deepEqual(f.p.musicQueue,[]);assert.equal(f.p.countdownSnapshot().accepted,0);
});
test('duplicate, expired and malformed intro messages cannot replay; stale cancel leaves countdown intact',async t=>{
  const f=await processorFixture(t);f.send({type:'briefingBegin',session:1});f.tone('point');f.tone('point',2);
  assert.equal(f.p.briefingSnapshot().accepted,1);assert.equal(f.p.briefingSnapshot().reason,'duplicate');
  f.tone('point',3,{index:1,expiresAt:-1});assert.equal(f.p.briefingSnapshot().reason,'expired');
  f.tone('point',4,{index:undefined});assert.equal(f.p.briefingSnapshot().reason,'invalid');
  f.send({type:'countdownBegin',session:5});f.send({type:'countdownTone',session:5,cue:3,launched:false,expiresAt:.1});
  f.send({type:'briefingCancel',session:1});assert.equal(f.p.countdownSnapshot().active,true);
  assert.ok(f.process(.02).left.some(value=>value!==0));assert.equal(f.p.briefingSnapshot().closed,true);
});
test('worklet permission revocation clears intro and no later point can reactivate that session',async t=>{
  const f=await processorFixture(t);f.send({type:'briefingBegin',session:1});f.tone('opening');assert.ok(f.process(.02).left.some(value=>value!==0));
  f.send({type:'settings',settings:{...settings,sfx:false}});assert.ok(f.process(.03).left.every(value=>value===0));
  f.send({type:'settings',settings});f.tone('point',2);assert.equal(f.p.briefingSnapshot().reason,'closed');assert.ok(f.process(.04).left.every(value=>value===0));
});
test('authored opening, point overlap and completion remain finite and unclipped at 44.1/48k',async t=>{
  for(const rate of [44100,48000])await t.test(`${rate}Hz`,async child=>{
    const f=await processorFixture(child,rate);f.send({type:'settings',settings:{...settings,volume:100}});f.send({type:'briefingBegin',session:1});f.tone('opening');
    let point=false,closing=false,peak=0,clipped=0;
    for(let index=0;index<Math.ceil(.8*rate/128);index++){
      const seconds=index*128/rate;globalThis.currentTime=seconds;
      if(seconds>=.14&&!point){f.tone('point',2);point=true;}
      if(seconds>=.4&&!closing){f.tone('complete',3);f.send({type:'briefingVisualEnd',session:1});closing=true;}
      const {left,right}=f.process(seconds);for(const value of [...left,...right]){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));if(Math.abs(value)>=.999999)clipped++;}
    }
    assert.ok(peak>0);assert.equal(clipped,0,`${rate}Hz hard-clipped samples`);assert.equal(f.p.briefingSnapshot().reason,'finished');
  });
});
