import test from 'node:test';import assert from 'node:assert/strict';
let Processor;globalThis.AudioWorkletProcessor=class{constructor(){this.port={postMessage(){},onmessage:null};}};globalThis.sampleRate=48000;globalThis.currentTime=10;globalThis.registerProcessor=(_id,C)=>{Processor=C;};
await import('../src/feedback/audio-worklet.js?fm-unit');
test('real worklet merges FM and registers, preserves base across AB cancellation, and rejects stopped sessions',()=>{
 const p=new Processor(),send=data=>p.port.onmessage({data});send({type:'settings',settings:{sound:true,sfx:false,volume:25}});send({type:'musicGain',gain:.5});
 send({type:'musicReg',session:0,writes:[{kind:'fm',event:{type:'configure',capacity:4},at:10,tag:'base'},{kind:'fm',event:{type:'noteOn',channel:0,note:60,velocity:100},presetId:'lead',at:10.02,tag:'base'},{addr:0x8f,value:0,at:10.01,tag:'base'},{addr:0x136,value:90,at:10.03,tag:'afterburner-1'}]});
 assert.deepEqual(p.musicQueue.slice(p.musicHead).map(w=>w.at),[10.01,10.02,10.03]);send({type:'musicCancel',tag:'afterburner-1'});assert.equal(p.musicQueue.length-p.musicHead,2);
 globalThis.currentTime=10.02;const l=new Float32Array(128),r=new Float32Array(128);p.process([],[[l,r]]);assert.ok(l.some(v=>v!==0));assert.equal(p.fm.snapshot().activeVoices,1);
 send({type:'musicStop',session:1});assert.equal(p.fm.snapshot().activeVoices,0);assert.equal(p.musicQueue.length,0);
 send({type:'musicReg',session:0,writes:[{kind:'fm',event:{type:'noteOn',channel:0,note:60,velocity:100},presetId:'lead',at:10.02}]});assert.equal(p.fm.snapshot().activeVoices,0);
 send({type:'musicReg',session:1,writes:[{kind:'fm',event:{type:'configure',capacity:2}},{kind:'fm',event:{type:'noteOn',channel:0,note:69,velocity:100},presetId:'lead'}]});assert.equal(p.fm.snapshot().activeVoices,1);send({type:'stop',session:2});assert.equal(p.fm.snapshot().activeVoices,0);p.process([],[[l,r]]);assert.ok(l.every(v=>v===0));
});
