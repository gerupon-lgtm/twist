import test from 'node:test';import assert from 'node:assert/strict';
import {updateBoundaryPanel} from '../src/boundary-panel.js';
class Element{
 constructor(area={left:0,right:0,top:0,bottom:0}){this.area=area;this.attrs=new Set();this.dataset={};this.style={};this.textContent='';}
 hasAttribute(name){return this.attrs.has(name);}toggleAttribute(name,force){if(force)this.attrs.add(name);else this.attrs.delete(name);}
 setAttribute(name,value){this[name]=String(value);}getClientRects(){return !this.hasAttribute('hidden')&&this.area.right>this.area.left?[this.area]:[];}getBoundingClientRect(){return this.area;}
}
const ids=['app','stage-boundary-warning','boundary-return-arrow','boundary-title','boundary-detail','navigation','flight-essential-speed','flight-essential-altitude','bottom-panel','radar','practice-panel','guidance-director','guidance-flight-path'];
function setup(width=390,height=844){
 const elements=new Map(ids.map(id=>[id,new Element()]));globalThis.innerWidth=width;globalThis.innerHeight=height;
 globalThis.document={getElementById:id=>elements.get(id)??null,querySelector:selector=>elements.get(selector.slice(1))??null,documentElement:{}};
 globalThis.getComputedStyle=()=>({getPropertyValue:()=>''});return elements;
}
test('boundary panel shows an actual inward arrow, English by default, and Japanese on request',()=>{
 const elements=setup(),state={mode:'flight',position:{x:335,y:10,z:0},heading:Math.PI/2,speed:10};
 const result=updateBoundaryPanel(state,{phase:'running'});assert.ok(result?.visible);assert.equal(elements.get('boundary-title').textContent,'STORM');
 assert.equal(result.returnBearingDeg,180);assert.equal(elements.get('boundary-return-arrow').style.transform,'rotate(180deg)');
 updateBoundaryPanel({...state,position:{x:362,y:10,z:0}},{settings:{hudLanguage:'ja'}});assert.equal(elements.get('boundary-title').textContent,'内側へ戻る');assert.equal(elements.get('stage-boundary-warning').dataset.level,'outside');
 assert.deepEqual(state.position,{x:335,y:10,z:0});
});
test('warning placement avoids the real FPM, director, navigation, radar and controls',()=>{
 const elements=setup(844,390);elements.get('navigation').area={left:84,right:314,top:8,bottom:42};
 elements.get('bottom-panel').area={left:470,right:824,top:225,bottom:380};elements.get('practice-panel').area={left:20,right:250,top:190,bottom:380};
 elements.get('radar').area={left:12,right:112,top:65,bottom:165};elements.get('guidance-flight-path').area={left:400,right:444,top:65,bottom:105};elements.get('guidance-director').area={left:450,right:510,top:80,bottom:140};
 elements.get('flight-essential-altitude').area={left:250,right:390,top:42,bottom:142};
 const result=updateBoundaryPanel({position:{x:330,y:10,z:0},heading:0,speed:20});assert.ok(result?.visible);const b=result.panel;
 for(const id of ['navigation','flight-essential-speed','flight-essential-altitude','bottom-panel','practice-panel','radar','guidance-flight-path','guidance-director']){const r=elements.get(id).area;
  assert.equal(b.left<r.right&&b.right>r.left&&b.top<r.bottom&&b.bottom>r.top,false,id);}
 assert.ok(b.left>=0&&b.right<=844&&b.top>=0&&b.bottom<=390);
});
test('clear, paused and invalid states remove the warning without retaining an arrow',()=>{
 const elements=setup();updateBoundaryPanel({position:{x:340,z:0},heading:0,speed:10});
 assert.equal(elements.get('stage-boundary-warning').hasAttribute('hidden'),false);
 updateBoundaryPanel({position:{x:0,z:0},speed:10});assert.equal(elements.get('stage-boundary-warning').hasAttribute('hidden'),true);
 assert.equal(updateBoundaryPanel({position:{x:340,z:0},speed:10},{phase:'paused'}),null);assert.equal(elements.get('app').dataset.boundaryWarning,'clear');
 assert.equal(updateBoundaryPanel({position:{x:NaN,z:0}}),null);
});
