import test from 'node:test';import assert from 'node:assert/strict';
import {instrumentLayout,layoutIsClear,normalizeHudLayout} from '../src/instrument-layout.js';
import {normalizeFlightSettings,saveFlightSettings,loadFlightSettings,resetFlightSetting} from '../src/flight-settings.js';
test('instrument preferences accept only the three published designs',()=>{assert.equal(normalizeHudLayout('b'),'b');for(const x of [null,'legacy','d','__proto__'])assert.equal(normalizeHudLayout(x),'a');});
test('matched instruments and lower strip avoid actual phone controls in portrait and landscape',()=>{
 for(const [width,height]of [[390,844],[360,640],[844,390]])for(const layout of ['a','b','c'])for(const sonic of [false,true]){
  const wide=width>height,controls=wide?[{left:12,right:260,top:230,bottom:378},{left:600,right:832,top:230,bottom:378}]:[{left:12,right:width-12,top:height-220,bottom:height-12}];
  const upper=[{left:12,right:112,top:90,bottom:190},{left:124,right:234,top:132,bottom:176}];
  const r=instrumentLayout({width,height,top:80,controls,upper,layout,sonic});assert.ok(layoutIsClear(r,[...controls,...upper],width,height),JSON.stringify({width,height,layout,sonic,r}));
  if(layout!=='b'){assert.equal(r.speed.width,r.altitude.width);assert.equal(r.speed.top,r.altitude.top);assert.equal(r.speed.height,r.altitude.height);assert.equal(r.mach.top,r.vario.top);}
 }
});
test('a wide screen never puts a side instrument on the real central velocity marker',()=>{
 const upper=[{left:12,right:109,top:54,bottom:147},{left:224,right:334,top:54,bottom:98},{left:716,right:820,top:56,bottom:80}],controls=[{left:12,right:285,top:225,bottom:378},{left:498,right:828,top:248,bottom:378}],marker={left:390,right:454,top:175,bottom:215};
 for(const layout of ['a','b','c']){const r=instrumentLayout({width:844,height:390,top:52,upper,controls,layout,sonic:true});assert.ok(layoutIsClear(r,[...upper,...controls,marker],844,390),JSON.stringify({layout,r}));}
});

test('small cockpit side instruments leave room for the lower nose and flight-path legend',()=>{
 const legend={left:76,right:284,top:374,bottom:398},controls=[{left:12,right:348,top:404,bottom:630}],upper=[{left:12,right:112,top:50,bottom:150},{left:124,right:234,top:132,bottom:176}];
 for(const layout of ['a','b','c']){const r=instrumentLayout({width:360,height:640,top:50,upper,controls,legend,layout,sonic:true});assert.ok(layoutIsClear(r,[...upper,...controls,legend],360,640),JSON.stringify({layout,r}));}
});
test('upgrading and changing HUD design preserves saved handling and units',()=>{
 const old={maxBank:24,turnGravity:11,speedUnit:'kt',hudLanguage:'ja'},a=normalizeFlightSettings(old),store=new Map(),storage={setItem:(k,v)=>store.set(k,v),getItem:k=>store.get(k)};
 assert.equal(a.hudLayout,'a');saveFlightSettings(storage,{...a,hudLayout:'c'});const c=loadFlightSettings(storage);assert.equal(c.hudLayout,'c');for(const k of Object.keys(old))assert.equal(c[k],old[k]);const reset=resetFlightSetting(c,'hudLayout');assert.equal(reset.hudLayout,'a');for(const k of Object.keys(old))assert.equal(reset[k],old[k]);
});
