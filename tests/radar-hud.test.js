import test from 'node:test';
import assert from 'node:assert/strict';
import {avoidRadarMarker} from '../src/radar-panel.js';

test('a legacy target marker avoids the visible essential HUD and retains its original point when that HUD is hidden',()=>{
  const area={left:240,right:378,top:160,bottom:240};
  const hud={hidden:false,getClientRects(){return this.hidden?[]:[area];},getBoundingClientRect:()=>area};
  const radar={hidden:true};
  globalThis.document={getElementById:id=>id==='radar'?radar:id==='flight-essential-altitude'?hud:null};
  globalThis.innerWidth=390;globalThis.innerHeight=844;
  const point={x:300,y:200},bounds={left:62,right:328,top:122,bottom:780};
  const placed=avoidRadarMarker(point,bounds);
  assert.equal(placed.x+50>area.left&&placed.x-50<area.right&&placed.y+25>area.top&&placed.y-25<area.bottom,false);
  assert.ok(placed.x>=bounds.left&&placed.x<=bounds.right&&placed.y>=bounds.top&&placed.y<=bounds.bottom);
  assert.deepEqual(point,{x:300,y:200});
  hud.hidden=true;assert.equal(avoidRadarMarker(point,bounds),point);
});
