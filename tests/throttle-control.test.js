import test from 'node:test';
import assert from 'node:assert/strict';
import {createThrottleControl} from '../src/throttle-control.js';

function fixture(initial=.5) {
  class Element {
    constructor(){this.style={};this.listeners=new Map();this.children=[];this.value=String(initial*100);this.disabled=false;this.ownerDocument=document;}
    append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
    replaceWith(element){const parent=this.parent;if(parent){parent.children[parent.children.indexOf(this)]=element;element.parent=parent;}this.parent=null;}
    setAttribute(key,value){this[key]=value;}
    addEventListener(type,handler){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(handler);}
    removeEventListener(type,handler){this.listeners.get(type)?.delete(handler);}
    fire(type,values={}){const event={button:0,pointerId:1,isTrusted:true,clientX:0,clientY:0,preventDefault(){this.prevented=true;},...values};for(const fn of this.listeners.get(type)||[])fn(event);return event;}
    focus(){this.focused=true;}
    setPointerCapture(){} releasePointerCapture(){}
    getBoundingClientRect(){return {width:268};}
  }
  const document={createElement:()=>new Element()},host=new Element(),input=new Element();host.append(input);
  let value=initial;const changes=[];
  const control=createThrottleControl(input,{getValue:()=>value,onChange:next=>{value=next;changes.push(next);control.sync(next);}});
  return {host,input,control,changes,surface:host.children[0].children[1],get value(){return value;}};
}

test('throttle track taps, sub-threshold movement and vertical scroll do not jump into AB',()=>{
  const f=fixture();assert.equal(f.input.max,'120');assert.equal(f.input.step,'1');
  f.surface.fire('pointerdown',{clientX:240});f.surface.fire('pointerup',{clientX:240});assert.deepEqual(f.changes,[]);
  f.surface.fire('pointerdown');f.surface.fire('pointermove',{clientX:4});f.surface.fire('pointerup');assert.equal(f.value,.5);
  f.surface.fire('pointerdown');f.surface.fire('pointermove',{clientX:2,clientY:20});f.surface.fire('pointermove',{clientX:200,clientY:20});f.surface.fire('pointerup');assert.equal(f.value,.5);
});
test('relative drag enters AB, pointerup retains it and cancellation returns to 100 percent',()=>{
  const f=fixture();f.surface.fire('pointerdown',{clientX:30});f.surface.fire('pointermove',{clientX:160});assert.equal(f.value,1.15);
  f.surface.fire('pointerup');assert.equal(f.value,1.15);
  f.surface.fire('pointerdown');f.surface.fire('pointercancel');assert.equal(f.value,1);
  f.control.sync(1.2);assert.equal(f.changes.at(-1),1);assert.equal(f.input.value,'120');
});
test('trusted keyboard is explicit, while synthetic AB input and pointer gestures cannot activate it',()=>{
  const f=fixture();f.input.value='80';f.input.fire('input',{isTrusted:false});assert.equal(f.value,.8);
  f.input.value='120';f.input.fire('input',{isTrusted:false});assert.equal(f.value,.8);assert.equal(f.input.value,'80');
  f.input.fire('keydown',{key:'End',isTrusted:false});assert.equal(f.value,.8);
  f.input.fire('keydown',{key:'End'});assert.equal(f.value,1.2);
  f.input.fire('keydown',{key:'ArrowLeft'});assert.equal(f.value,1.19);
  f.input.fire('keydown',{key:'Home'});assert.equal(f.value,0);
  f.surface.fire('pointerdown',{isTrusted:false});f.surface.fire('pointermove',{clientX:300,isTrusted:false});assert.equal(f.value,0);
});
test('disabled controls ignore changes and dispose restores the input without live listeners',()=>{
  const f=fixture();f.input.disabled=true;f.input.fire('keydown',{key:'End'});f.input.value='90';f.input.fire('input');assert.equal(f.value,.5);assert.equal(f.input.value,'50');
  f.input.disabled=false;f.input.fire('keydown',{key:'End'});f.control.cancel();assert.equal(f.value,1);
  f.control.dispose();assert.equal(f.host.children[0],f.input);const count=f.changes.length;f.input.fire('keydown',{key:'Home'});assert.equal(f.changes.length,count);
});
