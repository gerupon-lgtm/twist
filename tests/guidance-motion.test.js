import test from 'node:test';
import assert from 'node:assert/strict';
import {computeDirectionGuidance} from '../src/guidance.js';
import {updateGuidancePanel} from '../src/guidance-panel.js';
import {guidanceDirectionAllowed} from '../src/guidance-layout.js';

// Real guidance/render-update functions with a DOM boundary fixture. Browser
// layout and camera behavior have separate integration coverage.
const rad=Math.PI/180,identity={x:0,y:0,z:0,w:1};
const base={mode:'flight',total:3,collected:0,position:{x:0,y:0,z:0},
  targetPosition:{x:100,y:100,z:-100},targetLocal:{x:100,y:100,z:-100},
  velocity:{x:0,y:0,z:-10},bank:0,angleOfAttack:0,throttle:.5,
  worldQuaternion:identity,cameraQuaternion:identity,orientation:identity,
  fieldOfView:{vertical:90},heading:0};
class Element{
  constructor(){this.dataset={};this.style={};this.attrs=new Map();this.textContent='';this.area={left:0,right:0,top:0,bottom:0};}
  hasAttribute(k){return this.attrs.has(k);}
  toggleAttribute(k,v){if(v)this.attrs.set(k,'');else this.attrs.delete(k);}
  setAttribute(k,v){this.attrs.set(k,String(v));}
  getClientRects(){return this.area.right>this.area.left&&!this.hasAttribute('hidden')?[this.area]:[];}
  getBoundingClientRect(){return this.area;}
}
function setup(){
  const elements=new Map(),get=k=>{if(!elements.has(k))elements.set(k,new Element());return elements.get(k);};
  globalThis.document={getElementById:get,querySelector:get,documentElement:{}};
  globalThis.getComputedStyle=()=>({getPropertyValue:()=>''});
  globalThis.innerWidth=1000;globalThis.innerHeight=1000;
  updateGuidancePanel(base,{phase:'paused'});return get;
}
const near=(a,b,e=1e-7)=>assert.ok(Math.abs(a-b)<=e,`${a} vs ${b}`);
const move=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const displayClimb=g=>Math.atan2(g.direction.y,Math.hypot(g.direction.x,g.direction.z))/rad;
const frame=(state,index)=>updateGuidancePanel(state,{camera:'cockpit',now:index*1000/60,dt:index?1/60:0});

test('crossing either normal climb boundary preserves a continuous, safe cockpit ring and exact FPM',()=>{
  for(const side of [-1,1]){
    setup();const state=climb=>({...base,targetPosition:{x:100,y:side*100,z:-100},targetLocal:{x:100,y:side*100,z:-100},
      velocity:{x:0,y:Math.sin(climb*rad)*10,z:-Math.cos(climb*rad)*10}});
    const a=frame(state(side*9.99),0),b=frame(state(side*10.01),1);
    assert.equal(a.mode,'target');assert.equal(b.mode,'recover');
    assert.equal(b.criticalRecovery,false);near(displayClimb(b),side*10);
    near(a.yawErrorDegrees,15);near(b.yawErrorDegrees,15);
    assert.ok(move(a.director,b.director)<1);assert.ok(move(a.flightPath,b.flightPath)<.181);
    assert.ok(guidanceDirectionAllowed(a.direction,a));assert.ok(guidanceDirectionAllowed(b.direction,b));
    near(b.flightPath.x,500);near(b.flightPath.y,500-500*Math.tan(side*10.01*rad));
  }
});

test('an ordinary target-height reversal slews at most 2.5 degrees per frame and reaches the new target',()=>{
  setup();const state=(climb,count)=>({...base,collected:count,
    targetPosition:{x:0,y:100*Math.tan(climb*rad),z:-100},targetLocal:{x:0,y:100*Math.tan(climb*rad),z:-100}});
  let previous=frame(state(8,0),0);near(displayClimb(previous),8);
  for(let i=1;i<=90;i++){
    const next=frame(state(-8,1),i),change=displayClimb(next)-displayClimb(previous);
    assert.ok(change<=1e-7&&change>=-2.500001);
    assert.ok(guidanceDirectionAllowed(next.direction,next));
    near(next.flightPath.x,500);near(next.flightPath.y,500);
    if(i===1)near(displayClimb(next),5.5);
    previous=next;
  }
  near(displayClimb(previous),-8,.01);
});

test('removing a HUD obstacle continues from the drawn ring instead of jumping to the raw ray',()=>{
  const get=setup(),state={...base,targetPosition:{x:100,y:0,z:-100},targetLocal:{x:100,y:0,z:-100}};
  get('bottom-panel').area={left:610,right:670,top:470,bottom:530};
  let before;for(let i=0;i<60;i++)before=frame(state,i);
  get('bottom-panel').area={left:0,right:0,top:0,bottom:0};
  const after=frame(state,60);
  assert.equal(before.director.clamped,true);assert.equal(after.director.clamped,false);
  assert.ok(move(before.director,after.director)>0&&move(before.director,after.director)<6);
  assert.ok(guidanceDirectionAllowed(after.direction,after));
  near(after.flightPath.x,500);near(after.flightPath.y,500);
});

test('a normal camera climb stays on the accessible side of a HUD corner without candidate jumps',()=>{
  const get=setup();get('cockpit-altitude').area={left:610,right:670,top:450,bottom:600};
  let previous=null,visible=0;
  for(let i=0;i<20;i++){
    const angle=i*.2*rad,cameraQuaternion={x:Math.sin(angle/2),y:0,z:0,w:Math.cos(angle/2)};
    const next=frame({...base,cameraQuaternion},i);
    assert.ok(next.director);assert.ok(next.flightPath);visible++;
    assert.ok(guidanceDirectionAllowed(next.direction,next));
    if(previous)assert.ok(move(previous.director,next.director)<10);
    previous=next;
  }
  assert.equal(visible,20);
});

test('the essential flight HUD is avoided without relocating a covered true FPM',()=>{
  const get=setup(),hud=get('flight-essential-altitude');
  get('flight-essential-hud').area={left:0,right:1000,top:0,bottom:1000};
  hud.area={left:610,right:670,top:390,bottom:450};
  const clear=frame(base,0);assert.ok(clear.director);assert.ok(clear.flightPath);
  const p=clear.director;
  assert.equal(p.x+31>hud.area.left&&p.x-31<hud.area.right&&p.y+31>hud.area.top&&p.y-31<hud.area.bottom,false);
  assert.ok(guidanceDirectionAllowed(clear.direction,clear));near(clear.flightPath.x,500);near(clear.flightPath.y,500);
  hud.area={left:480,right:520,top:480,bottom:520};
  const covered=frame(base,1);assert.equal(covered.flightPath,null);assert.equal(covered.driverReady,false);
  assert.equal(covered.flightPathReason,'FPM OBSCURED');
  hud.toggleAttribute('hidden',true);
  const restored=frame(base,2);assert.ok(restored.driverReady);near(restored.flightPath.x,500);near(restored.flightPath.y,500);
});

test('critical incidence, engine-off and insufficient lift override the displayed slew immediately',()=>{
  for(const extra of [{angleOfAttack:25*rad},{angleOfAttack:-25*rad},
    {angleOfAttack:17*rad},{throttle:0},{velocity:{x:0,y:0,z:-5}}]){
    setup();frame(base,0);
    const state={...base,...extra},expected=computeDirectionGuidance(state),actual=frame(state,1);
    assert.equal(actual.mode,'recover');assert.equal(actual.criticalRecovery,true);
    near(actual.direction.x,expected.direction.x);near(actual.direction.y,expected.direction.y);near(actual.direction.z,expected.direction.z);
    assert.ok(guidanceDirectionAllowed(actual.direction,actual));
  }
});

test('a transitional climb still respects the present physical envelope and rejects invalid state',()=>{
  const before=JSON.stringify(base);
  const limited=computeDirectionGuidance({...base,angleOfAttack:16*rad},
    {turnState:{mode:'target',yawDegrees:15,climbDegrees:8}});
  assert.ok(limited.climbErrorDegrees<=1.000001);
  assert.equal(computeDirectionGuidance(base,{turnState:{mode:'target',yawDegrees:0,climbDegrees:NaN}}),null);
  assert.equal(JSON.stringify(base),before);
});
