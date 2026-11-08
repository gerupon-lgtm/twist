import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('../src/feedback/audio.js',import.meta.url),'utf8')).replace(/^import workletUrl[^\n]+/,'const workletUrl="test-worklet";');
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
