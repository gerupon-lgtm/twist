import test from 'node:test';
import assert from 'node:assert/strict';
import {createLaunchMusicGate} from '../src/feedback/launch-music.js';

const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
const settle=async()=>{await Promise.resolve();await Promise.resolve();};

test('GO gates only BGM and repeated requests release exactly the latest selection',async()=>{
  const end=deferred(),played=[];let song='ignition';
  const gate=createLaunchMusicGate({play:()=>played.push(song),stop(){}});
  gate.prepare(1);gate.start();assert.equal(gate.snapshot().phase,'await-go');
  gate.go(1,{played:true,completion:end.promise});assert.equal(gate.snapshot().phase,'cue');
  song='advance';gate.request();song='overdrive';gate.request();assert.deepEqual(played,[]);
  end.resolve();await settle();assert.deepEqual(played,['overdrive']);assert.equal(gate.snapshot().pending,false);
});
test('a cancelled completion cannot release a newer attempt and stale GO cannot replace its barrier',async()=>{
  const old=deferred(),current=deferred(),played=[];
  const gate=createLaunchMusicGate({play:()=>played.push('flight'),stop(){}});
  gate.prepare(1);gate.start();gate.go(1,{played:true,completion:old.promise});gate.stop();
  gate.prepare(2);gate.start();gate.go(1,{played:false});gate.go(2,{played:true,completion:current.promise});
  old.resolve();await settle();assert.deepEqual(played,[]);
  current.resolve();await settle();assert.deepEqual(played,['flight']);
});
test('silent and unready GO release immediately without scheduling a tail timer',()=>{
  const played=[],gate=createLaunchMusicGate({play:()=>played.push('flight'),stop(){}});
  gate.prepare(1);gate.start();gate.go(1,{played:false});assert.deepEqual(played,['flight']);
  gate.stop();gate.start();assert.deepEqual(played,['flight','flight'],'Resume has no new GO');
});
test('permission revoked at completion stays quiet until an explicit permitted request',async()=>{
  const end=deferred(),played=[];let allowed=true;
  const gate=createLaunchMusicGate({play:()=>played.push('flight'),stop(){},isAllowed:()=>allowed});
  gate.prepare(1);gate.start();gate.go(1,{played:true,completion:end.promise});
  allowed=false;gate.request();end.resolve();await settle();assert.deepEqual(played,[]);
  allowed=true;await settle();assert.deepEqual(played,[],'Permission restoration alone cannot replay');
  gate.request();await settle();assert.deepEqual(played,['flight']);
});
test('an explicit cancel also invalidates the already-playing GO session',async()=>{
  const end=deferred(),played=[],gate=createLaunchMusicGate({play:()=>played.push('flight'),stop(){}});
  gate.prepare(1);gate.start();gate.go(1,{played:true,completion:end.promise});gate.cancelSession(1);
  end.resolve();await settle();assert.deepEqual(played,[]);assert.equal(gate.snapshot().pending,false);
});
