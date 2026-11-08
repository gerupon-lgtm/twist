import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {COUNTDOWN_AUDIO,countdownTone,applyCountdownRegisters} from '../src/feedback/countdown-audio.js';
import {flightFeedback} from '../src/feedback/model.js';

const source=(await readFile(new URL('../src/feedback/audio.js',import.meta.url),'utf8'))
  .replace(/^import workletUrl[^\n]+/,'const workletUrl="test-worklet";')
  .replace("'./supersonic-model.js'",JSON.stringify(new URL('../src/feedback/supersonic-model.js',import.meta.url).href))
  .replace("'./countdown-audio.js'",JSON.stringify(new URL('../src/feedback/countdown-audio.js',import.meta.url).href));
const {createGameAudio}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const settings={sound:true,sfx:true,volume:25,vario:false};
function fixture(t,{deferModule=false}={}){
  const messages=[];let context;
  globalThis.window={AudioContext:class{
    constructor(){context=this;this.state='suspended';this.currentTime=0;this.resumes=0;this.defer=false;this.audioWorklet={addModule:()=>deferModule?new Promise(resolve=>{this.completeModule=resolve;}):Promise.resolve()};}
    resume(){this.resumes++;if(this.defer)return new Promise(resolve=>{this.release=()=>{this.state='running';resolve();};});this.state='running';return Promise.resolve();}
    suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
  }};
  globalThis.AudioWorkletNode=class{constructor(){this.port={postMessage:m=>messages.push(m)};}connect(){}disconnect(){}};
  const audio=createGameAudio();
  t.after(async()=>{await audio.dispose();delete globalThis.window;delete globalThis.AudioWorkletNode;});
  return {audio,messages,context:()=>context};
}

test('3/2/1 have the same pitch, GO is higher, and registers use a short bounded envelope',()=>{
  assert.deepEqual([3,2,1].map(n=>countdownTone(n)),Array(3).fill({hz:880,durationMs:90}));
  assert.deepEqual(countdownTone('go'),{hz:1760,durationMs:160});assert.equal(countdownTone(0),null);
  const regs=()=>{const r=new Uint8Array(14);r[7]=63;return r;};
  const before=regs();assert.equal(applyCountdownRegisters(before,3,0)[10],0);
  const tick=applyCountdownRegisters(regs(),3,20),go=applyCountdownRegisters(regs(),'go',20);
  assert.equal(tick[10],11);assert.equal(tick[7]&(1<<2),0);assert.ok(tick[7]&(1<<5));
  assert.ok((go[4]+256*go[5])<(tick[4]+256*tick[5]));
  assert.deepEqual(applyCountdownRegisters(regs(),3,90),regs());assert.deepEqual(applyCountdownRegisters(regs(),3,NaN),regs());
});
test('audio prepares a private preflight session, consumes duplicate beats, and gates GO on actual start',async t=>{
  const {audio,messages,context}=fixture(t);await audio.unlock();assert.equal(context().state,'suspended');
  const ready=await audio.prepareCountdown(1,settings);assert.equal(ready.ready,true);assert.ok(ready.waitMilliseconds>=0);
  assert.equal(audio.countdownTone(1,3,settings),true);assert.equal(audio.countdownTone(1,3,settings),false);
  assert.equal(audio.countdownTone(1,'go',settings),false,'preflight alone cannot trigger GO');
  audio.cancelCountdown(1);await audio.prepareCountdown(2,settings);audio.start();
  assert.equal(audio.countdownTone(2,'go',settings),true);assert.equal(audio.countdownTone(2,'go',settings),false);
  assert.deepEqual(messages.filter(m=>m.type==='countdownTone').map(m=>[m.session,m.cue,m.launched]),[[1,3,false],[2,'go',true]]);
  audio.stop();assert.equal(audio.countdownTone(2,2,settings),false);assert.equal(context().state,'suspended');
});
test('muted audio does not wait and an unready beat is consumed rather than replayed after resume',async t=>{
  const {audio,messages,context}=fixture(t);await audio.unlock();
  const muted=audio.prepareCountdown(1,{...settings,sfx:false});assert.equal(typeof muted?.then,'undefined');assert.equal(muted.ready,false);
  assert.equal(audio.countdownTone(1,3,{...settings,sfx:false}),false);assert.equal(audio.countdownTone(1,3,settings),false);
  t.mock.timers.enable({apis:['setTimeout']});context().defer=true;
  const pending=audio.prepareCountdown(2,settings);t.mock.timers.tick(COUNTDOWN_AUDIO.prepareTimeoutMs);
  const result=await pending;assert.equal(result.ready,false);assert.equal(audio.countdownTone(2,3,settings),false);
  audio.cancelCountdown(2);context().release();await Promise.resolve();await Promise.resolve();
  assert.equal(context().state,'suspended');assert.equal(messages.filter(m=>m.type==='countdownTone').length,0);
  context().defer=false;await audio.prepareCountdown(3,settings);assert.equal(audio.countdownTone(3,2,settings),true);
  assert.equal(audio.countdownTone(2,1,settings),false,'old session cannot reach a fresh context');
});
test('zero volume consumes the beat without starting it, even after volume is restored',async t=>{
  const {audio,messages}=fixture(t);await audio.unlock();
  await audio.prepareCountdown(1,{...settings,volume:0});
  assert.equal(audio.countdownTone(1,3,{...settings,volume:0}),false);
  assert.equal(audio.countdownTone(1,3,settings),false);
  assert.equal(messages.filter(m=>m.type==='countdownTone').length,0);
});
test('the initial gesture can finish loading after halt suspended it and still prepare all three beats',async t=>{
  const {audio,messages,context}=fixture(t,{deferModule:true});
  const loading=audio.unlock();await Promise.resolve();
  assert.equal(typeof context().completeModule,'function');audio.stop();
  const preparation=audio.prepareCountdown(1,settings);context().completeModule();
  const ready=await preparation;await loading;
  assert.equal(ready.ready,true);assert.equal(context().state,'running');
  for(const cue of [3,2,1])assert.equal(audio.countdownTone(1,cue,settings),true);
  assert.deepEqual(messages.filter(m=>m.type==='countdownTone').map(m=>m.cue),[3,2,1]);
});
test('a cancelled old module preparation cannot resume audio or suspend a newer countdown',async t=>{
  const {audio,messages,context}=fixture(t,{deferModule:true});
  const loading=audio.unlock();await Promise.resolve();audio.stop();
  const old=audio.prepareCountdown(1,settings);audio.cancelCountdown(1);
  const current=audio.prepareCountdown(2,settings);context().completeModule();
  assert.equal((await old).ready,false);assert.equal((await current).ready,true);await loading;
  assert.equal(context().state,'running');assert.equal(audio.countdownTone(1,3,settings),false);
  assert.equal(audio.countdownTone(2,3,settings),true);assert.equal(messages.filter(m=>m.type==='countdownTone').length,1);
});
test('a second gesture resumes after halt before awaiting its older unresolved native resume',async t=>{
  const {audio,context}=fixture(t);await audio.unlock();t.mock.timers.enable({apis:['setTimeout']});
  let firstResume;
  context().resume=()=>{
    context().state='running';
    if(firstResume){firstResume();return Promise.resolve();}
    return new Promise(resolve=>{firstResume=resolve;});
  };
  const loading=audio.unlock();audio.stop();const preparation=audio.prepareCountdown(2,settings);
  t.mock.timers.tick(COUNTDOWN_AUDIO.prepareTimeoutMs);
  assert.equal((await preparation).ready,true);await loading;
  assert.equal(context().state,'running');assert.equal(audio.countdownTone(2,3,settings),true);
});
test('cancelling an awaited native resume cannot create a delayed countdown',async t=>{
  const {audio,messages,context}=fixture(t);let completeModule;
  const loading=audio.unlock();await Promise.resolve();
  // The explicit context may already have its module; use a suspended resume
  // to exercise the same late completion contract without replacing the synth.
  await loading;context().defer=true;
  const preparation=audio.prepareCountdown(4,settings);completeModule=context().release;
  audio.cancelCountdown(4);completeModule();await preparation;
  assert.equal(audio.countdownTone(4,3,settings),false);assert.equal(context().state,'suspended');
  assert.equal(messages.filter(m=>m.type==='countdownTone').length,0);
});
test('production worklet renders preflight tones without music/flight, rejects stale sessions and yields to warnings',async()=>{
  let Processor;const messages=[];
  globalThis.AudioWorkletProcessor=class{constructor(){this.port={postMessage:m=>messages.push(m),onmessage:null};}};
  globalThis.sampleRate=48000;globalThis.currentTime=10;globalThis.registerProcessor=(_name,C)=>{Processor=C;};
  try{
    await import('../src/feedback/audio-worklet.js?unit-countdown');
    const p=new Processor(),send=data=>p.port.onmessage({data}),tone=(session,cue,extra={})=>send({type:'countdownTone',session,cue,launched:cue==='go',expiresAt:currentTime+.1,...extra});
    const process=()=>{p.untilUpdate=0;const out=new Float32Array(128);p.process([],[[out]]);return out;};
    send({type:'settings',settings});send({type:'countdownBegin',session:1});tone(1,3);globalThis.currentTime=10.02;
    assert.ok(process().some(v=>v!==0));assert.equal(p.active,false);assert.equal(p.musicPlaying,false);assert.equal(p.countdownSnapshot().accepted,1);
    tone(1,3);assert.equal(p.countdownSnapshot().reason,'duplicate');
    globalThis.currentTime=10.2;assert.ok(process().every(v=>v===0));
    send({type:'countdownCancel',session:1});send({type:'countdownBegin',session:2});send({type:'countdownBegin',session:1});tone(1,2);
    assert.equal(p.countdownSnapshot().session,2);assert.equal(p.countdownSnapshot().reason,'stale');
    tone(2,'go',{launched:false});assert.equal(p.countdownSnapshot().reason,'not-launched');
    tone(2,2,{expiresAt:currentTime-1});assert.equal(p.countdownSnapshot().reason,'expired');tone(2,2);assert.equal(p.countdownSnapshot().reason,'duplicate');
    tone(2,1);assert.equal(p.countdownSnapshot().active,true);
    const warning=flightFeedback({mode:'flight',speed:10,altitude:1,throttle:.5},settings);
    send({type:'state',model:warning,settings});assert.equal(p.countdownSnapshot().active,false);assert.equal(p.countdownSnapshot().reason,'warning');
    send({type:'countdownBegin',session:3});tone(3,3);assert.equal(p.countdownSnapshot().reason,'warning');
    send({type:'state',model:flightFeedback({mode:'flight',speed:10,altitude:22,throttle:.5},settings),settings});tone(3,2);
    send({type:'musicReg',writes:[{addr:1,value:9,at:20,tag:'base'}]});const queue=[...p.musicQueue];
    send({type:'countdownCancel',session:3});assert.deepEqual(p.musicQueue,queue);
    send({type:'countdownBegin',session:4});tone(4,'go');assert.equal(p.countdownSnapshot().active,true);
    send({type:'event',kind:'collect',settings});assert.equal(p.countdownSnapshot().active,false);
    send({type:'stop'});tone(4,1);assert.equal(p.countdownSnapshot().reason,'stale');assert.ok(process().every(v=>v===0));
    assert.ok(messages.some(m=>m.countdown?.history.some(row=>row.hz===1760)));
    const accepted=p.countdownSnapshot().accepted;
    send({type:'settings',settings:{...settings,volume:0}});send({type:'countdownBegin',session:5});tone(5,3);
    assert.equal(p.countdownSnapshot().reason,'volume');assert.ok(process().every(v=>v===0));
    send({type:'settings',settings});tone(5,3);assert.equal(p.countdownSnapshot().reason,'duplicate');assert.equal(p.countdownSnapshot().accepted,accepted);
  }finally{delete globalThis.AudioWorkletProcessor;delete globalThis.sampleRate;delete globalThis.currentTime;delete globalThis.registerProcessor;}
});
