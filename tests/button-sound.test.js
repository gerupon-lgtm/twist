import test from 'node:test';
import assert from 'node:assert/strict';
import {renderButtonSound,createButtonSound} from '../src/feedback/button-sound.js';

for(const rate of [44100,48000])test(`soft PSG click ${rate}Hz has a prompt attack, quiet tail and bounded level`,()=>{
  const pcm=renderButtonSound(rate);assert.equal(pcm.length,Math.ceil(rate*.07));assert.equal(pcm[0],0);assert.equal(pcm.at(-1),0);
  assert.ok(pcm.every(Number.isFinite));const peak=Math.max(...pcm.map(Math.abs));assert.ok(peak>.089&&peak<.091);
  const rms=a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/a.length);
  const earlyPeak=Math.max(...pcm.slice(0,Math.ceil(rate*.006)).map(Math.abs));
  assert.ok(earlyPeak>=peak*.8,'The click must reach 80% peak within 6ms');
  assert.ok(rms(pcm.slice(-Math.round(rate*.004)))<rms(pcm.slice(0,Math.round(rate*.02)))*.1);
});
test('muted clicks construct no context and a delayed or cancelled resume produces no late sound',async()=>{
  let contexts=0,resumes=[],starts=0,time=0;
  const context={state:'running',resume:()=>new Promise(resolve=>resumes.push(resolve)),suspend:async()=>{},createBufferSource:()=>{starts++;throw Error('must not start');}};
  const sound=createButtonSound({ensureContext:()=>{contexts++;return context;},canSuspend:()=>true,visible:()=>true,now:()=>time});
  assert.equal(await sound.play({sound:false,sfx:true,volume:25}),false);assert.equal(contexts,0);
  const late=sound.play({sound:true,sfx:true,volume:25});time=601;resumes.shift()();assert.equal(await late,false);assert.equal(starts,0);
  const cancelled=sound.play({sound:true,sfx:true,volume:25});sound.cancel();resumes.shift()();assert.equal(await cancelled,false);assert.equal(starts,0);assert.equal(sound.active(),false);
});

function clickFixture(){
 let time=0,suspensions=0,resumeDelay=false,release;
 const sources=[];
 const context={state:'running',sampleRate:48000,destination:{},
  resume(){return resumeDelay?new Promise(resolve=>{release=resolve;}):Promise.resolve();},
  suspend(){suspensions++;this.state='suspended';return Promise.resolve();},
  createBuffer:(channels,length,rate)=>({copyToChannel(){},duration:length/rate}),
  createGain:()=>({gain:{value:0},connect(){},disconnect(){}}),
  createBufferSource(){const source={connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};sources.push(source);return source;}
 };
 const sound=createButtonSound({ensureContext:()=>context,canSuspend:()=>true,visible:()=>true,now:()=>time});
 return {sound,sources,context,setTime:value=>{time=value;},delayResume:()=>{resumeDelay=true;},resume:()=>release(),suspensions:()=>suspensions};
}
const clickSettings={sound:true,sfx:true,volume:25};
test('two taps 40ms apart both sound without cutting the first click short',async()=>{
 const f=clickFixture();try{
  assert.equal(await f.sound.play(clickSettings),true);f.setTime(40);
  assert.equal(await f.sound.play(clickSettings),true);
  assert.equal(f.sources.length,2);assert.ok(f.sources.every(s=>s.started&&!s.stopped));
 }finally{f.sound.cancel();}
});
test('a 250ms resume never plays a stale button sound',async()=>{
 const f=clickFixture();f.delayResume();try{
  const pending=f.sound.play(clickSettings);f.setTime(250);f.resume();
  assert.equal(await pending,false);assert.equal(f.sources.length,0);
 }finally{f.sound.cancel();}
});
test('a finished menu click keeps the audio context warm for the next tap',async()=>{
 const f=clickFixture();try{
  await f.sound.play(clickSettings);f.sources[0].onended();
  assert.equal(f.suspensions(),0);assert.equal(f.context.state,'running');
 }finally{f.sound.cancel();}
});
