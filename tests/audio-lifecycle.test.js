import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('../src/feedback/audio.js',import.meta.url),'utf8'))
  .replace(/^import workletUrl[^\n]+/,'const workletUrl="test-worklet";')
  .replace("'./supersonic-model.js'",JSON.stringify(new URL('../src/feedback/supersonic-model.js',import.meta.url).href))
  .replace("'./countdown-audio.js'",JSON.stringify(new URL('../src/feedback/countdown-audio.js',import.meta.url).href))
  .replace("'./briefing-audio.js'",JSON.stringify(new URL('../src/feedback/briefing-audio.js',import.meta.url).href));
const {createGameAudio}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('a post-stop crash resumes through a pending suspension even while the context still reports running',async()=>{
  let context;const messages=[];
  globalThis.window={AudioContext:class{
    constructor(){context=this;this.state='suspended';this.currentTime=0;this.resumes=0;this.suspending=false;this.audioWorklet={addModule:async()=>{}};}
    resume(){this.resumes++;this.suspending=false;this.state='running';return Promise.resolve();}
    suspend(){this.suspending=true;return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
    flush(){if(this.suspending)this.state='suspended';}
  }};
  globalThis.AudioWorkletNode=class{constructor(){this.port={postMessage:m=>messages.push(m)};}connect(){}disconnect(){}};
  const audio=createGameAudio();
  try{audio.start();await audio.unlock();audio.stop();assert.equal(context.state,'running');audio.event('crash',{sound:true,sfx:true});await Promise.resolve();context.flush();assert.equal(context.resumes,2);assert.equal(context.state,'running');assert.equal(messages.at(-1).kind,'crash');}
  finally{await audio.dispose();delete globalThis.window;delete globalThis.AudioWorkletNode;}
});

test('disposing a loading preview closes its native context and cannot create a late worklet node',async()=>{
  let release,context,nodes=0;
  globalThis.window={AudioContext:class{
    constructor(){context=this;this.state='suspended';this.audioWorklet={addModule:()=>new Promise(resolve=>{release=resolve;})};}
    resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
  }};
  globalThis.AudioWorkletNode=class{constructor(){nodes++;this.port={postMessage(){}};}connect(){}disconnect(){}};
  const audio=createGameAudio();
  try{const loading=audio.unlock();await Promise.resolve();await audio.dispose();release();await loading;assert.equal(context.state,'closed');assert.equal(nodes,0);assert.equal(audio.snapshot().workletReady,false);}
  finally{await audio.dispose();delete globalThis.window;delete globalThis.AudioWorkletNode;}
});

test('scoped music clocks reject old FM/register microtasks and retain the base when only AB is cancelled',async()=>{
 const messages=[];globalThis.window={AudioContext:class{
  constructor(){this.state='suspended';this.currentTime=4;this.sampleRate=44100;this.audioWorklet={addModule:async()=>{}};}
  resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){this.state='closed';return Promise.resolve();}
 }};globalThis.AudioWorkletNode=class{constructor(){this.port={postMessage:m=>messages.push(m)};}connect(){}disconnect(){}};
 const audio=createGameAudio();try{audio.start();await audio.unlock();const stale=audio.createMusicClock();assert.equal(stale.sampleRate,44100);
  stale.event({kind:'fm',event:{type:'noteOn',channel:0,note:60,velocity:100},presetId:'lead'});audio.stopMusic();
  stale.write(0x8a,15);stale.event({kind:'fm',event:{type:'noteOn',channel:0,note:64,velocity:100},presetId:'lead'});
  const base=audio.createMusicClock(),ab=audio.createMusicLayerClock('afterburner-new');base.setScheduleTime(5);base.event({kind:'fm',event:{type:'noteOn',channel:0,note:67,velocity:100},presetId:'lead'});ab.setScheduleTime(5);ab.write(0x124,100);audio.cancelMusicLayer('afterburner-new');
  await Promise.resolve();const writes=messages.filter(m=>m.type==='musicReg').flatMap(m=>m.writes);assert.equal(writes.length,1);assert.equal(writes[0].event.note,67);assert.equal(writes[0].tag,'base');
  base.event({kind:'fm',event:{type:'noteOff',channel:0,note:67}});audio.stop();await Promise.resolve();assert.equal(messages.filter(m=>m.type==='musicReg').length,1);
 }finally{await audio.dispose();delete globalThis.window;delete globalThis.AudioWorkletNode;}
});
