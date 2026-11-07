import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {updateGuidancePanel} from '../src/guidance-panel.js';
import {guidanceDirectionAllowed} from '../src/guidance-layout.js';

// A small DOM boundary fixture: real guidance math and renderer update run;
// no browser, canvas or layout engine is started by these cases.
class Element {
  constructor(){this.dataset={};this.style={};this.attrs=new Map();this.textContent='';this.area={left:0,right:0,top:0,bottom:0};}
  hasAttribute(name){return this.attrs.has(name);}
  toggleAttribute(name,force){if(force)this.attrs.set(name,'');else this.attrs.delete(name);}
  setAttribute(name,value){this.attrs.set(name,String(value));}
  getClientRects(){return !this.hasAttribute('hidden')&&this.area.right>this.area.left?[this.area]:[];}
  getBoundingClientRect(){return this.area;}
}
const markup=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ids=[...markup.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
const identity={x:0,y:0,z:0,w:1};
const base={mode:'flight',collected:0,total:3,position:{x:0,y:10,z:0},targetPosition:{x:0,y:10,z:-30},
  targetLocal:{x:0,y:0,z:-30},velocity:{x:0,y:0,z:-10},worldQuaternion:identity,cameraQuaternion:identity,
  fieldOfView:{vertical:90},heading:0,throttle:.5,targetLabel:'光 1'};
function setup(){
  const elements=new Map([...ids,'app','bottom-panel','radar','practice-panel','cockpit-heading','navigation','topbar'].map(id=>[id,new Element()]));
  globalThis.document={getElementById:id=>elements.get(id)??null,querySelector:selector=>elements.get(selector.slice(1)),documentElement:{}};
  globalThis.getComputedStyle=()=>({getPropertyValue:()=>''});globalThis.innerWidth=390;globalThis.innerHeight=844;
  updateGuidancePanel(base,{phase:'paused'});return elements;
}
test('a target inside the viewport has no replacement edge arrow, even outside the cockpit clear area',()=>{
  const elements=setup();const result=updateGuidancePanel({...base,targetLocal:{x:-4.5,y:0,z:-10}},{now:0,dt:0});
  assert.equal(result.targetVisible,true);assert.equal(result.edge,null);assert.equal(elements.get('guidance-edge-arrow').hasAttribute('hidden'),true);
});
test('rear arrows stay on the physical viewport edge and off flags restore legacy ownership',()=>{
  const elements=setup();const result=updateGuidancePanel({...base,targetLocal:{x:0,y:0,z:10}},{now:0,dt:0});
  assert.equal(result.edge.x,195);assert.equal(result.edge.y,826);assert.equal(elements.get('app').dataset.guidanceEdge,'on');
  const settings=Object.fromEntries(['flightDirector','targetHeadingCue','edgeGuidance','nextTargetNotice','audioGuidance'].map(k=>[k,false]));
  assert.equal(updateGuidancePanel(base,{settings,now:100,dt:.1}).targetVisible,true);
  assert.equal(elements.get('app').dataset.guidanceEdge,'off');assert.equal(elements.get('guidance-panel').hasAttribute('hidden'),true);
});
test('complete returns its visibility sample and clears driver attributes from the finished display',()=>{
  const elements=setup();updateGuidancePanel(base,{now:0,dt:0});
  assert.ok(elements.get('app').dataset.guidanceDirection);
  const result=updateGuidancePanel({...base,collected:3,complete:true},{now:100,dt:.1});
  assert.equal(result.targetVisible,true);assert.equal(elements.get('guidance-panel').hasAttribute('hidden'),true);
  assert.equal(elements.get('app').dataset.guidanceDirection,undefined);
});
test('a blocked view hides the old relocated path and reports the unavailable guidance',()=>{
  const elements=setup();elements.get('bottom-panel').area={left:0,right:390,top:0,bottom:844};
  const result=updateGuidancePanel(base,{now:0,dt:0});
  assert.equal(result.director,null);assert.equal(result.flightPath,null);
  assert.equal(elements.get('app').dataset.guidanceDirector,'on');
  assert.equal(result.directorReason,'LEVEL TO SHOW GUIDANCE');
  assert.equal(elements.get('app').dataset.guidanceDirection,undefined);
});

test('narrow landscape hides an unsafe ring instead of inventing climb or the wrong turn',()=>{
  const elements=setup();globalThis.innerWidth=844;globalThis.innerHeight=390;
  elements.get('bottom-panel').area={left:450,right:520,top:150,bottom:240};
  const result=updateGuidancePanel({...base,targetPosition:{x:30,y:10,z:-50},targetLocal:{x:30,y:0,z:-50}},{now:0,dt:0});
  assert.equal(result.director,null);assert.equal(result.driverReady,false);assert.equal(guidanceDirectionAllowed(result.direction,result),true);
  assert.equal(result.directorReason,'LEVEL TO SHOW GUIDANCE');
  assert.equal(result.flightPath.x,422);assert.equal(result.flightPath.y,195);
});
test('steep attitude leaves the actual flightpath at its exact pixel and hides the unsafe ring',()=>{
  setup();globalThis.innerWidth=844;globalThis.innerHeight=390;
  const angle=40*Math.PI/180,q={x:Math.sin(angle/2),y:0,z:0,w:Math.cos(angle/2)};
  const result=updateGuidancePanel({...base,worldQuaternion:q,targetLocal:{x:0,y:30*Math.sin(angle),z:-30*Math.cos(angle)}},{now:0,dt:0});
  assert.equal(result.director,null);assert.equal(result.driverReady,false);assert.ok(result.directorReason);
  assert.ok(Math.abs(result.flightPath.y-(195-195*Math.tan(angle)))<1e-8);
});
test('an offscreen velocity has an explicit reason and no relocated circle',()=>{
  const elements=setup();globalThis.innerWidth=844;globalThis.innerHeight=390;
  const angle=60*Math.PI/180,q={x:Math.sin(angle/2),y:0,z:0,w:Math.cos(angle/2)};
  const result=updateGuidancePanel({...base,worldQuaternion:q,targetLocal:{x:0,y:30*Math.sin(angle),z:-30*Math.cos(angle)}},{now:0,dt:0});
  assert.equal(result.flightPath,null);assert.equal(result.flightPathReason,'FPM OUT OF VIEW');
  assert.equal(elements.get('guidance-flight-path').hasAttribute('hidden'),true);
});
test('a collection notice lasts 1.8 seconds and retry removes it',()=>{
  const elements=setup();updateGuidancePanel(base,{now:0,dt:0});
  updateGuidancePanel({...base,collected:1,targetPosition:{x:16,y:21,z:-24},targetLabel:'光 2'},{now:100,dt:.1,settings:{hudLanguage:'ja'}});
  assert.equal(elements.get('guidance-notice-text').textContent,'次は 右34°・上11m');
  assert.equal(elements.get('guidance-next-notice').hasAttribute('hidden'),false);
  updateGuidancePanel({...base,collected:1},{now:1900,dt:.1});
  assert.equal(elements.get('guidance-next-notice').hasAttribute('hidden'),true);
  updateGuidancePanel(base,{now:2000,dt:.1});assert.equal(elements.get('guidance-next-notice').hasAttribute('hidden'),true);
});

test('a visible safe ring without the true FPM cannot expose follow-driver data',()=>{
 const elements=setup();elements.get('bottom-panel').area={left:180,right:210,top:400,bottom:440};
 const result=updateGuidancePanel({...base,targetPosition:{x:30,y:10,z:-50},targetLocal:{x:30,y:0,z:-50}},{now:0,dt:0});
 assert.equal(result.flightPath,null);assert.equal(result.driverReady,false);assert.equal(elements.get('app').dataset.guidanceDirection,undefined);
 assert.equal(result.flightPathReason,'FPM OBSCURED');assert.equal(elements.get('guidance-status').hasAttribute('hidden'),false);
 assert.equal(result.directorReason,null);
});
test('panel applies held turn state before safety and crosses boundary reversals through zero',()=>{
 setup();const bearing=34*Math.PI/180,threshold=2*(100/(9.8*Math.tan(40*Math.PI/180)))*Math.sin(bearing);
 const frame=(ratio,now,dt=1/60)=>{const distance=threshold*ratio,x=distance*Math.sin(bearing),z=-distance*Math.cos(bearing);
   return updateGuidancePanel({...base,targetPosition:{x,y:10,z},targetLocal:{x,y:0,z}},{now,dt});};
 let result=frame(1.2,0,0);assert.equal(result.mode,'target');assert.equal(result.yawErrorDegrees,15);
 result=frame(.85,100);assert.equal(result.mode,'target');assert.equal(result.rawMode,'go-around');
 result=frame(.85,600);assert.equal(result.mode,'go-around');assert.equal(result.yawErrorDegrees,12.5);
 let previous=result.yawErrorDegrees;
 for(let i=1;i<=30;i++){result=frame(1.05,600+i*1000/60);assert.equal(result.mode,'go-around');assert.ok(Math.abs(result.yawErrorDegrees-previous)<=2.500001);
   assert.equal(guidanceDirectionAllowed(result.direction,result),true);previous=result.yawErrorDegrees;}
 assert.equal(previous,-15);result=frame(1.2,1300);assert.equal(result.mode,'target');assert.equal(result.yawErrorDegrees,-12.5);
 const crossing=[];for(let i=1;i<=12;i++){result=frame(1.2,1300+i*1000/60);crossing.push(result.yawErrorDegrees);}
 assert.ok(crossing.some(value=>Math.abs(value)<1e-8));assert.equal(crossing.at(-1),15);
});

test('five and eight lights keep guidance on lights after number three and switch to EXIT only at total',()=>{
  for(const total of [5,8]){
    const elements=setup(),state={...base,total,collected:3,targetLabel:'光 4',targetLocal:{x:0,y:0,z:10}};
    const before=JSON.stringify(state);updateGuidancePanel(state,{now:0,dt:0});
    assert.equal(elements.get('guidance-panel').dataset.target,'light');
    assert.equal(elements.get('guidance-target-diamond').hasAttribute('hidden'),false);
    assert.equal(elements.get('guidance-exit-gate').hasAttribute('hidden'),true);
    assert.equal(elements.get('guidance-edge-title').textContent,'TGT 4');
    updateGuidancePanel({...state,collected:total,targetLabel:'出口'},{now:100,dt:.1});
    assert.equal(elements.get('guidance-panel').dataset.target,'exit');
    assert.equal(elements.get('guidance-target-diamond').hasAttribute('hidden'),true);
    assert.equal(elements.get('guidance-exit-gate').hasAttribute('hidden'),false);
    assert.equal(elements.get('guidance-edge-title').textContent,'EXIT');
    assert.equal(JSON.stringify(state),before);
  }
});

test('course changes clear old next-target notices and later collection uses the new total',()=>{
  const elements=setup();
  updateGuidancePanel({...base,courseId:'normal',total:5},{now:0,dt:0});
  updateGuidancePanel({...base,courseId:'normal',total:5,collected:1,targetLabel:'光 2'},{now:100,dt:.1});
  assert.equal(elements.get('guidance-next-notice').hasAttribute('hidden'),false);
  updateGuidancePanel({...base,courseId:'hard',total:8,collected:3,targetLabel:'光 4'},{now:200,dt:.1});
  assert.equal(elements.get('guidance-next-notice').hasAttribute('hidden'),true);
  updateGuidancePanel({...base,courseId:'hard',total:8,collected:4,targetLabel:'光 5'},{now:300,dt:.1});
  assert.equal(elements.get('guidance-notice-target').textContent,'NEXT TGT 5');
});

test('guidance uses the configured shared turn strength and rejects invalid total',()=>{
  const elements=setup();
  const weak=updateGuidancePanel(base,{now:0,dt:0,settings:{turnGravity:3}});
  updateGuidancePanel(base,{phase:'paused'});
  const strong=updateGuidancePanel(base,{now:100,dt:0,settings:{turnGravity:9.8}});
  assert.ok(Math.abs(weak.turnRadius/strong.turnRadius-9.8/3)<1e-9);
  assert.equal(updateGuidancePanel({...base,total:9},{now:200,dt:.1}),null);
  assert.equal(elements.get('guidance-panel').hasAttribute('hidden'),true);
});
test('English is default for target/next notice/reasons and Japanese switches back without mutating state',()=>{
 const elements=setup();updateGuidancePanel(base,{now:0,dt:0});
 const state={...base,collected:1,targetPosition:{x:16,y:21,z:-24},targetLocal:{x:16,y:11,z:24},targetLabel:'光 2'};
 updateGuidancePanel(state,{now:100,dt:.1});
 assert.equal(elements.get('guidance-notice-target').textContent,'NEXT TGT 2');
 assert.match(elements.get('guidance-notice-text').textContent,/↗34°.*▲ \+11m/);
 assert.equal(elements.get('guidance-edge-title').textContent,'TGT 2');
 assert.doesNotMatch(elements.get('guidance-edge-detail').textContent,/[\u3040-\u30ff\u3400-\u9fff]/);
 updateGuidancePanel(state,{now:200,dt:.1,settings:{hudLanguage:'ja'}});
 assert.equal(elements.get('guidance-notice-text').textContent,'次は 右34°・上11m');
 assert.equal(elements.get('guidance-edge-title').textContent,'光 2・後ろ');assert.equal(state.targetLabel,'光 2');
 updateGuidancePanel({...state,collected:3,targetLabel:'出口'},{now:300,dt:.1});
 assert.equal(elements.get('guidance-edge-title').textContent,'EXIT');
});
