import test from 'node:test';
import assert from 'node:assert/strict';
import {updateEssentialHud} from '../src/essential-hud.js';

test('an unchanged stall warning is not rewritten into its live status region',()=>{
  const previous=globalThis.document,nodes=new Map();let writes=0,text='';
  for(const id of ['flight-essential-hud','flight-essential-height','flight-essential-vario','flight-warning-text','target-height-inline','flight-essential-vario-label','flight-essential-vario-value','flight-essential-details','flight-essential-alert','ground-warning-text'])nodes.set(id,{hidden:false,dataset:{},textContent:'',setAttribute(){}});
  Object.defineProperty(nodes.get('flight-warning-text'),'textContent',{get:()=>text,set:value=>{writes++;text=value;}});
  globalThis.document={getElementById:id=>nodes.get(id)};
  const display={phase:'paused',mode:'flight',camera:'overlay',language:'ja'},state={angleOfAttack:25*Math.PI/180,recoveryAssist:0,verticalSpeed:0};
  try{
    updateEssentialHud(state,display);assert.equal(text,'失速');assert.equal(writes,1);
    updateEssentialHud(state,display);assert.equal(writes,1);
    updateEssentialHud({...state,recoveryAssist:.1},display);assert.equal(text,'失速から復帰補助中');assert.equal(writes,2);
    updateEssentialHud({...state,angleOfAttack:0},display);assert.equal(text,'');assert.equal(writes,3);
    updateEssentialHud({...state,angleOfAttack:0},display);assert.equal(writes,3);
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
