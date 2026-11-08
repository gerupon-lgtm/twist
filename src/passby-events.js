import {closestSegmentDistance} from './approach-records.js';
const point=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
export function createPassByTracker(){
  let previous=null,states=new Map(),elapsed=0,lastEvent=-Infinity,count=0;
  return {
    reset(){previous=null;states=new Map();elapsed=0;lastEvent=-Infinity;count=0;},
    advance(dt,{position,speed=0,velocity={x:0,z:-1},objects=[]}={}){
      if(!Number.isFinite(dt)||dt<0||!point(position))return [];
      elapsed+=dt;const before=previous??position;previous={...position};const ids=new Set(),candidates=[];
      for(const object of objects){
        if(typeof object?.id!=='string'||!point(object.position))continue;ids.add(object.id);
        const radius=Number.isFinite(object.radius)?Math.max(0,object.radius):0,limit=20+radius;
        const d=closestSegmentDistance(before,position,object.position),now=Math.hypot(position.x-object.position.x,position.y-object.position.y,position.z-object.position.z);
        let state=states.get(object.id);if(!state){state={used:false};states.set(object.id,state);}
        if(d<=limit&&!state.used){
          state.used=true;
          if(dt>0&&Number.isFinite(speed)&&speed>=12){const vx=Number.isFinite(velocity.x)?velocity.x:0,vz=Number.isFinite(velocity.z)?velocity.z:-1;const side=Math.sign((object.position.x-position.x)*-vz+(object.position.z-position.z)*vx);candidates.push({id:object.id,speed,distance:d,side});}
        }
        // Leaving the same visit must not trigger a second sound. Re-arm only
        // after this movement has been checked, for a later approach.
        if(now>limit+4)state.used=false;
      }
      for(const id of states.keys())if(!ids.has(id))states.delete(id);
      if(!candidates.length||elapsed-lastEvent<.3)return [];
      candidates.sort((a,b)=>a.distance-b.distance);lastEvent=elapsed;count++;return [candidates[0]];
    },
    snapshot:()=>({count}),
  };
}
