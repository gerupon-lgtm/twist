// Pure visible-route sound policy; native output is verified separately.
import test from 'node:test';
import assert from 'node:assert/strict';
import {BRIEFING_AUDIO,briefingCue,applyBriefingRegisters,createBriefingAudioConsumer} from '../src/feedback/briefing-audio.js';

const points=[{id:'start',kind:'start',progress:0},{id:'tgt-1',kind:'target',progress:.1},
  {id:'tgt-2',kind:'target',progress:.35},{id:'tgt-3',kind:'target',progress:.65},{id:'exit',kind:'exit',progress:1}];
const observation=(type='progress',seconds=0,extra={})=>({type,session:1,courseId:'fixture',origin:'start',visibleSeconds:seconds,
  progress:Math.min(1,seconds/3.6),drawSeconds:3.6,reducedMotion:false,visible:true,points,...extra});
function fixture(){const cues=[],cancels=[],state={ready:true,allowed:true};
  const consumer=createBriefingAudioConsumer({emit:value=>cues.push(value),cancel:value=>cancels.push(value),isReady:()=>state.ready,isAllowed:()=>state.allowed});
  return {consumer,cues,cancels,state};}

test('authored motifs are short and bounded; current 3/5/8 and Sonic5 target pitches rise',()=>{
  assert.equal(BRIEFING_AUDIO.drawSeconds,3.6);assert.equal(briefingCue('opening').durationMs,280);assert.equal(briefingCue('complete').durationMs,330);
  for(const total of [3,5,8]){const notes=Array.from({length:total},(_,i)=>briefingCue('point',i,total).notes[0].midi);
    assert.ok(notes.every((note,i)=>!i||note>notes[i-1]));}
  for(const kind of ['opening','complete','point'])for(const note of briefingCue(kind,0,3).notes){assert.ok(Number.isFinite(note.midi));assert.ok(note.volume>0&&note.volume<=11);assert.ok(note.durationMs>0&&note.durationMs<=150);}
  assert.equal(briefingCue('clear'),null);
});
test('the actual path milestones emit once despite repeated frame and resize observations',()=>{
  const f=fixture();f.consumer.handle(observation('open'));
  for(const seconds of [0,.36,.36,1.26,2.34,3.6,3.6,6])f.consumer.handle(observation('progress',seconds));
  assert.deepEqual(f.cues.map(cue=>cue.key),['opening','tgt-1','tgt-2','tgt-3','exit']);
  assert.equal(f.consumer.snapshot().status,'complete');
});
test('late readiness and a frame jump consume missed sounds instead of catching up',()=>{
  const f=fixture();f.state.ready=false;f.consumer.handle(observation('open'));f.state.ready=true;
  f.consumer.handle(observation('progress',.2));f.consumer.handle(observation('progress',.4));f.consumer.handle(observation('progress',2));
  f.state.ready=false;f.consumer.handle(observation('progress',2.34));f.state.ready=true;f.consumer.handle(observation('progress',2.35));f.consumer.handle(observation('progress',3.6));
  assert.deepEqual(f.cues.map(cue=>cue.key),['tgt-1','exit']);assert.equal(f.consumer.snapshot().dropped,3);
});
test('hidden and mute do not rearm the same map; a stale close cannot cancel a new map',()=>{
  for(const cause of ['hidden','mute']){const f=fixture();f.consumer.handle(observation('open'));
    if(cause==='hidden')f.consumer.handle(observation('visibility',.2,{visible:false}));else {f.state.allowed=false;f.consumer.handle(observation('progress',.2));}
    f.state.allowed=true;f.consumer.handle(observation('visibility',.2,{visible:true}));f.consumer.handle(observation('progress',3.6));assert.equal(f.cues.length,1);
    f.consumer.handle(observation('open',0,{session:2}));f.consumer.handle(observation('close',3.6,{session:1}));
    assert.equal(f.consumer.snapshot().session,2);assert.equal(f.cues.at(-1).key,'opening');}
});
test('paused MAP is silent and reduced-motion has one static completion without target bursts',()=>{
  const pause=fixture();pause.consumer.handle(observation('open',0,{origin:'pause',drawSeconds:0,progress:1}));pause.consumer.handle(observation('progress',3.6,{origin:'pause',drawSeconds:0,progress:1}));assert.equal(pause.cues.length,0);assert.equal(pause.consumer.snapshot().status,'pause-map');
  const reduced=fixture();reduced.consumer.handle(observation('open',0,{reducedMotion:true,drawSeconds:0,progress:1}));
  reduced.consumer.handle(observation('progress',4,{reducedMotion:true,drawSeconds:0,progress:1}));
  assert.deepEqual(reduced.cues.map(cue=>cue.key),['static-complete']);
});
test('a static completion accepts only a current fast resume and drops a late preparation',()=>{
  for(const [seconds,expected] of [[.02,1],[.2,0]]){
    const f=fixture();f.state.ready=false;f.consumer.handle(observation('open',0,{reducedMotion:true,drawSeconds:0,progress:1}));
    f.state.ready=true;f.consumer.handle(observation('progress',seconds,{reducedMotion:true,drawSeconds:0,progress:1}));
    assert.equal(f.cues.length,expected);assert.equal(f.consumer.snapshot().status,'complete');
  }
});
test('nonfinite or reversed clocks cancel rather than holding a future sound',()=>{
  for(const seconds of [NaN,-1]){const f=fixture();f.consumer.handle(observation('open'));f.consumer.handle(observation('progress',seconds));assert.equal(f.consumer.snapshot().status,'invalid-clock');}
  const f=fixture();f.consumer.handle(observation('open'));f.consumer.handle(observation('progress',1));f.consumer.handle(observation('progress',.5));assert.equal(f.consumer.snapshot().status,'invalid-clock');
});
test('private PSG registers have finite notes and clear their own envelope after the end',()=>{
  for(const kind of ['opening','complete','point']){const cue=briefingCue(kind,1,3),registers=new Uint8Array(14);registers[7]=63;
    applyBriefingRegisters(registers,cue,20);assert.ok([...registers.slice(8,11)].some(value=>value>0));
    applyBriefingRegisters(registers,cue,cue.durationMs);for(const channel of new Set(cue.notes.map(note=>note.channel)))assert.equal(registers[8+channel],0);}
});

