import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupersonicBestStore,SUPERSONIC_BESTS_KEY} from '../src/supersonic-bests.js';
test('high-speed bests are separate by supplied physics key and never overwrite normal records',()=>{
 const values=new Map([['twist.course-bests.v1','normal untouched']]);const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const store=createSupersonicBestStore(storage,{now:()=> 'test'});
 assert.equal(store.complete('supersonic:g9:unlimited:courseA',62).newBest,true);
 assert.equal(store.complete('supersonic:g9:gauge:courseA',70).previousBestSeconds,null);
 assert.equal(store.complete('supersonic:g9:unlimited:courseA',64).newBest,false);
 assert.equal(values.get('twist.course-bests.v1'),'normal untouched');
 const loaded=createSupersonicBestStore(storage);assert.equal(loaded.best('supersonic:g9:unlimited:courseA'),62);
 assert.equal(loaded.best('supersonic:g12:unlimited:courseA'),null);assert.ok(values.has(SUPERSONIC_BESTS_KEY));
});
test('failed storage keeps only an explicit in-session best and invalid completion never saves',()=>{
 const store=createSupersonicBestStore({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
 assert.equal(store.complete('valid-key',60).saved,false);assert.equal(store.best('valid-key'),60);
 for(const seconds of [0,-1,NaN,Infinity])assert.equal(store.complete('valid-key',seconds),null);
 assert.equal(store.complete('__proto__',1),null);assert.equal(store.best('valid-key'),60);
});
