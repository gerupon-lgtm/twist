import {createHash} from 'node:crypto';
export function renderFmCompat(Engine,rate,preset){
 const engine=new Engine(rate,4),hash=createHash('sha256');
 const render=length=>{const out=new Float32Array(length);engine.render(out);hash.update(out);};
 engine.handle({type:'noteOn',channel:0,note:60,velocity:110},preset);
 engine.handle({type:'noteOn',channel:1,note:67,velocity:95},preset);render(127);render(4096);
 engine.handle({type:'cc',channel:0,controller:7,value:64});engine.handle({type:'pitchBend',channel:1,value:4096});render(1537);
 engine.handle({type:'noteOff',channel:0,note:60});render(8192);
 engine.handle({type:'allNotesOff'});render(512);return hash.digest('hex');
}
