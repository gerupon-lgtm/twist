import {projectEdgeTarget} from './visibility.js';
const overlaps=(a,b,pad=4)=>a.left<b.right+pad&&a.right>b.left-pad&&a.top<b.bottom+pad&&a.bottom>b.top-pad;
const box=(x,y,w,h)=>({left:x-w/2,right:x+w/2,top:y-h/2,bottom:y+h/2});
const valid=r=>r&&['left','right','top','bottom'].every(k=>Number.isFinite(r[k]))&&r.left<r.right&&r.top<r.bottom;
export function projectCockpitObjective({target,width,height,verticalFov,bounds,obstacles=[]}={}) {
  if(!valid(bounds))return null;
  const projected=projectEdgeTarget({target,width,height,verticalFov,bounds});
  if(projected.inView)return {...projected,kind:'point'};
  if(!projected.visible)return null;
  const candidates=[projected];
  for(let x=bounds.left;x<=bounds.right;x+=20)candidates.push({x,y:bounds.top},{x,y:bounds.bottom});
  for(let y=bounds.top;y<=bounds.bottom;y+=20)candidates.push({x:bounds.left,y},{x:bounds.right,y});
  candidates.push({x:bounds.right,y:bounds.bottom},{x:bounds.right,y:bounds.top});
  candidates.sort((a,b)=>Math.hypot(a.x-projected.x,a.y-projected.y)-Math.hypot(b.x-projected.x,b.y-projected.y));
  const free=candidates.find(p=>!obstacles.some(r=>overlaps(box(p.x,p.y,32,32),r)));
  return free?{...projected,x:free.x,y:free.y,kind:'edge'}:null;
}
export function placeObjectiveLabel(point,{bounds,obstacles=[],width=116,height=34}={}) {
  if(!point||!valid(bounds))return null;
  const choices=[{x:point.x+22,y:point.y-height/2},{x:point.x-22-width,y:point.y-height/2},
    {x:point.x-width/2,y:point.y-22-height},{x:point.x-width/2,y:point.y+22}];
  const mark=box(point.x,point.y,34,34);
  const fits=p=>p.x>=bounds.left&&p.x+width<=bounds.right&&p.y>=bounds.top&&p.y+height<=bounds.bottom
    &&![mark,...obstacles].some(r=>overlaps({left:p.x,right:p.x+width,top:p.y,bottom:p.y+height},r));
  const nearby=choices.find(fits);if(nearby)return nearby;
  for(let y=bounds.top;y+height<=bounds.bottom;y+=24)for(let x=bounds.left;x+width<=bounds.right;x+=24)if(fits({x,y}))return {x,y};
  return null;
}
