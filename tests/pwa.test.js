import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Vite supplies import.meta.env in the browser; keep the controller's DOM/API seam in Node.
const source=(await readFile(new URL('../src/pwa.js',import.meta.url),'utf8'))
  .replaceAll('import.meta.env.PROD','false')
  .replace(/from '(\.\/[^']+)'/g,(_,path)=>`from '${new URL(path,new URL('../src/pwa.js',import.meta.url)).href}'`);
const {createPwaController}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const iphone='Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Version/18.7 Mobile/15E148 Safari/604.1';

function setup(t,{userAgent='desktop',allPlatforms=false,installed=false,fullscreenSupported=true,request,lock}={}) {
  const previous=new Map(),calls=[],pauses=[],dialogs=[],elements=new Map();
  const define=(name,value)=>{
    previous.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
    Object.defineProperty(globalThis,name,{value,writable:true,configurable:true});
  };
  class Element extends EventTarget {
    constructor(){super();this.dataset={};this.hidden=false;this.disabled=false;this.textContent='';this.children=new Map();}
    querySelector(selector){if(!this.children.has(selector))this.children.set(selector,new Element());return this.children.get(selector);}
  }
  const document=new EventTarget();
  document.getElementById=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  document.documentElement=new Element();document.fullscreenElement=null;document.hidden=false;
  const window=new EventTarget();
  const state={phase:'intro',time:100,orientation:'portrait-primary'};
  const orientation={
    get type(){return state.orientation;},
    lock(type){calls.push(['lock',type]);return lock?lock(type):Promise.resolve();},
    unlock(){calls.push(['unlock']);},
  };
  if(fullscreenSupported)document.documentElement.requestFullscreen=()=>{
    calls.push(['fullscreen']);
    if(request)return request({document,state});
    document.fullscreenElement=document.documentElement;
    state.orientation='landscape-secondary';
    document.dispatchEvent(new Event('fullscreenchange'));
    return Promise.resolve();
  };
  document.exitFullscreen=async()=>{calls.push(['exit']);document.fullscreenElement=null;document.dispatchEvent(new Event('fullscreenchange'));};
  for(const [name,value]of Object.entries({document,window,navigator:{userAgent,standalone:installed},screen:{orientation},innerWidth:390,innerHeight:844,matchMedia:()=>({matches:false}),performance:{now:()=>state.time}}))define(name,value);
  t.after(()=>{for(const [name,descriptor]of previous){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}});
  const controller=createPwaController({allPlatforms,getPhase:()=>state.phase,pause:reason=>{pauses.push(reason);state.phase='paused';},showDialog:dialog=>dialogs.push(dialog)});
  return {controller,calls,pauses,dialogs,state,document,window,elements};
}

test('the title requests fullscreen separately from locking the orientation held at pose time',async t=>{
  const {controller,calls,state}=setup(t,{userAgent:'desktop',allPlatforms:true});
  assert.equal(await controller.requestFullscreen({source:'title'}),true);
  assert.deepEqual(calls,[['fullscreen']]);
  assert.deepEqual(controller.report(),{launch:'browser',fullscreen:true,fullscreenRequested:true,fullscreenSucceeded:true,fullscreenRequestedAt:100,fullscreenSucceededAt:100,fullscreenSource:'title'});
  state.time=180;state.orientation='landscape-primary';
  // Orientation locking remains Android-specific; desktop fullscreen does not promise a lock.
  assert.equal(await controller.lockCurrentOrientation(),false);
  assert.deepEqual(calls,[['fullscreen']]);
});

test('Android pose locking uses its current orientation after the earlier title request',async t=>{
  const {controller,calls,state}=setup(t,{userAgent:'Android',allPlatforms:true});
  await controller.requestFullscreen({source:'title'});
  state.orientation='landscape-primary';state.time=250;
  assert.equal(await controller.lockCurrentOrientation(),true);
  assert.deepEqual(calls,[['fullscreen'],['lock','landscape-primary']]);
  assert.equal(controller.report().fullscreenSource,'title');
  assert.equal(controller.report().fullscreenRequestedAt,100);
});

test('legacy enter preserves the Android type held before fullscreen changes the viewport',async t=>{
  const {controller,calls}=setup(t,{userAgent:'Android'});
  await controller.enter();
  assert.deepEqual(calls,[['fullscreen'],['lock','portrait-primary']]);
  assert.equal(controller.report().fullscreenSource,'legacy');
  await controller.enter({source:'resume'});
  assert.deepEqual(calls,[['fullscreen'],['lock','portrait-primary'],['lock','landscape-secondary']]);
  assert.equal(controller.report().fullscreenSource,'legacy');
});

test('default desktop behavior neither requests fullscreen nor acquires an orientation lock',async t=>{
  const {controller,calls}=setup(t);
  await controller.enter();
  assert.equal(await controller.requestFullscreen({source:'title'}),false);
  assert.equal(await controller.lockCurrentOrientation(),false);
  assert.deepEqual(calls,[]);
  assert.deepEqual(controller.report(),{launch:'browser',fullscreen:false,fullscreenRequested:false,fullscreenSucceeded:false,fullscreenRequestedAt:0,fullscreenSucceededAt:0,fullscreenSource:'other'});
});

test('an unsupported fullscreen API is not recorded as an actual request',async t=>{
  const {controller,calls}=setup(t,{allPlatforms:true,fullscreenSupported:false});
  assert.equal(await controller.requestFullscreen({source:'title'}),false);
  assert.equal(controller.report().fullscreenRequested,false);
  assert.equal(controller.report().fullscreenSucceeded,false);
  assert.deepEqual(calls,[]);
  assert.equal(controller.canResume(),true);
});

test('an already fullscreen installed launch is not recorded as a title request',async t=>{
  const {controller,calls,document}=setup(t,{allPlatforms:true,installed:true});
  document.fullscreenElement=document.documentElement;
  assert.equal(await controller.requestFullscreen({source:'title'}),true);
  assert.deepEqual(calls,[]);
  assert.equal(controller.report().launch,'installed');
  assert.equal(controller.report().fullscreen,true);
  assert.equal(controller.report().fullscreenRequested,false);
  assert.equal(controller.report().fullscreenSucceeded,false);
});

test('a rejected fullscreen request is recorded and still permits the legacy Android lock and play',async t=>{
  const {controller,calls,state}=setup(t,{userAgent:'Android',request:async()=>{throw Error('denied');}});
  state.time=125;
  await controller.enter({source:'resume'});
  assert.deepEqual(calls,[['fullscreen'],['lock','portrait-primary']]);
  assert.equal(controller.canResume(),true);
  assert.deepEqual(controller.report(),{launch:'browser',fullscreen:false,fullscreenRequested:true,fullscreenSucceeded:false,fullscreenRequestedAt:125,fullscreenSucceededAt:0,fullscreenSource:'resume'});
});

test('a resolved request without a fullscreen state is not reported as successful',async t=>{
  const {controller}=setup(t,{allPlatforms:true,request:async()=>{}});
  assert.equal(await controller.requestFullscreen({source:'title'}),false);
  assert.equal(controller.report().fullscreenRequested,true);
  assert.equal(controller.report().fullscreenSucceeded,false);
  assert.equal(controller.report().fullscreenSucceededAt,0);
});

test('an invalid clock or source cannot put non-finite values or arbitrary text into the report',async t=>{
  const {controller,state}=setup(t,{allPlatforms:true});
  state.time=Infinity;
  await controller.requestFullscreen({source:'untrusted source'});
  const report=controller.report();
  assert.equal(report.fullscreenSource,'other');
  assert.equal(report.fullscreenRequestedAt,0);
  assert.equal(report.fullscreenSucceededAt,0);
  assert.ok(Object.entries(report).filter(([key])=>key.endsWith('At')).every(([,value])=>Number.isFinite(value)));
});

for(const outcome of ['resolve','reject'])test(`cancelled legacy entry never locks after a late fullscreen ${outcome}`,async t=>{
  let settle;
  const {controller,calls,document}=setup(t,{userAgent:'Android',request:()=>new Promise((resolve,reject)=>{settle=()=>{
    if(outcome==='resolve'){document.fullscreenElement=document.documentElement;resolve();}
    else reject(Error('cancelled'));
  };})});
  const entering=controller.enter();
  controller.cancelEntry();settle();await entering;
  assert.deepEqual(calls,[['fullscreen']]);
});

test('a cancelled title request reports the real fullscreen outcome without approving a late continuation',async t=>{
  let settle;
  const {controller,calls,document,state}=setup(t,{allPlatforms:true,request:()=>new Promise(resolve=>{settle=()=>{
    document.fullscreenElement=document.documentElement;resolve();
  };})});
  const requesting=controller.requestFullscreen({source:'title'});
  controller.cancelEntry();state.time=200;settle();
  assert.equal(await requesting,false);
  assert.deepEqual(calls,[['fullscreen']]);
  assert.deepEqual(controller.report(),{launch:'browser',fullscreen:true,fullscreenRequested:true,fullscreenSucceeded:true,fullscreenRequestedAt:100,fullscreenSucceededAt:200,fullscreenSource:'title'});
});

test('a released pending pose lock is immediately unlocked when its late result arrives',async t=>{
  let settle;
  const {controller,calls,elements,state}=setup(t,{userAgent:'Android',lock:()=>new Promise(resolve=>{settle=resolve;})});
  const locking=controller.lockCurrentOrientation();
  await controller.release();settle();
  assert.equal(await locking,false);
  assert.deepEqual(calls,[['lock','portrait-primary'],['unlock'],['unlock']]);
  state.phase='paused';controller.render();
  assert.equal(elements.get('release-screen-button').hidden,true);
});

test('exiting fullscreen during a new-flow desktop flight pauses it, while legacy desktop is unchanged',async t=>{
  const {controller,calls,pauses,state,document,elements}=setup(t,{allPlatforms:true});
  await controller.requestFullscreen({source:'title'});
  state.phase='running';
  document.fullscreenElement=null;document.dispatchEvent(new Event('fullscreenchange'));
  assert.equal(pauses.length,1);assert.equal(state.phase,'paused');
  assert.match(pauses[0],/全画面を終了/);
  assert.ok(calls.some(([kind])=>kind==='unlock'));
  await Promise.resolve();assert.equal(elements.get('release-screen-button').hidden,true);
});

test('fullscreen changes before running do not start or pause a flight',async t=>{
  const {controller,pauses,state,document}=setup(t,{allPlatforms:true});
  await controller.requestFullscreen({source:'title'});
  document.fullscreenElement=null;document.dispatchEvent(new Event('fullscreenchange'));
  assert.equal(state.phase,'intro');assert.deepEqual(pauses,[]);
});

test('legacy desktop fullscreen exit remains outside the automatic pause policy',t=>{
  const {pauses,state,document}=setup(t);
  state.phase='running';document.dispatchEvent(new Event('fullscreenchange'));
  assert.deepEqual(pauses,[]);assert.equal(state.phase,'running');
});

test('new-flow iPhone advice starts its ten seconds at pose, including a paused or ready re-pose',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const {controller,state,elements}=setup(t,{userAgent:iphone,allPlatforms:true,fullscreenSupported:false});
  controller.initialize();
  const notice=elements.get('orientation-notice');
  assert.equal(notice.hidden,true);
  t.mock.timers.tick(15000);
  for(const phase of ['intro','paused','ready']){
    state.phase=phase;controller.showOrientationNotice();controller.render();
    assert.equal(notice.hidden,false,phase);
    t.mock.timers.tick(9999);assert.equal(notice.hidden,false,phase);
    t.mock.timers.tick(1);assert.equal(notice.hidden,true,phase);
  }
  controller.showOrientationNotice();
  await controller.lockCurrentOrientation();assert.equal(notice.hidden,true);
  controller.showOrientationNotice();controller.cancelEntry();assert.equal(notice.hidden,true);
});

test('legacy iPhone advice still starts on initialize and is hidden by legacy entry',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const {controller,elements}=setup(t,{userAgent:iphone});
  controller.initialize();const notice=elements.get('orientation-notice');
  assert.equal(notice.hidden,false);
  t.mock.timers.tick(10000);assert.equal(notice.hidden,true);
  controller.initialize();assert.equal(notice.hidden,false);
  await controller.enter();assert.equal(notice.hidden,true);
});
