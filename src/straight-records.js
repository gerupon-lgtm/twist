const finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
/** Fraction of the actual movement inside the lane's rectangular corridor. */
export function laneMovementFraction(lane,a,b){
  if(!lane||!finite(lane.from)||!finite(lane.to)||!finite(a)||!finite(b)||!Number.isFinite(lane.width)||lane.width<=0||!Number.isFinite(lane.heightTolerance)||lane.heightTolerance<=0)return 0;
  const dx=lane.to.x-lane.from.x,dz=lane.to.z-lane.from.z,length=Math.hypot(dx,dz);if(!length)return 0;
  const local=p=>{const x=p.x-lane.from.x,z=p.z-lane.from.z,along=(x*dx+z*dz)/length;return [along,(x*dz-z*dx)/length,p.y-lane.from.y-(lane.to.y-lane.from.y)*along/length];};
  const start=local(a),end=local(b),bounds=[[0,length],[-lane.width/2,lane.width/2],[-lane.heightTolerance,lane.heightTolerance]];let enter=0,exit=1;
  for(let i=0;i<3;i++){
    const delta=end[i]-start[i],[low,high]=bounds[i];
    if(Math.abs(delta)<1e-12){if(start[i]<low||start[i]>high)return 0;continue;}
    const p=(low-start[i])/delta,q=(high-start[i])/delta;enter=Math.max(enter,Math.min(p,q));exit=Math.min(exit,Math.max(p,q));if(enter>=exit)return 0;
  }
  return Math.max(0,exit-enter);
}
export function createStraightRecords(lanes=[]){
  let routes=[],rows=[],previous=null;
  const reset=next=>{routes=Array.isArray(next)?next:[];rows=routes.map(lane=>({id:lane.id,length:Math.hypot(lane.to.x-lane.from.x,lane.to.z-lane.from.z),usedAfterburner:false,afterburnerSeconds:0}));previous=null;};reset(lanes);
  return {
    reset,
    advance({position,afterburner,afterburnerMotion=[]}={}){
      if(!finite(position))return;const seconds=Number.isFinite(afterburner?.seconds)?Math.max(0,afterburner.seconds):0;
      // Stage supplies only each substep's paid portion of its travelled line.
      // Never spread a partly depleted burn across later, unpowered movement.
      if(previous&&Array.isArray(afterburnerMotion)){
        let remaining=Math.max(0,seconds-previous.seconds);
        for(const movement of afterburnerMotion){
          if(!remaining)break;
          if(!finite(movement?.from)||!finite(movement.to)||!Number.isFinite(movement.seconds)||movement.seconds<=0)continue;
          const paid=Math.min(remaining,movement.seconds);remaining-=paid;
          routes.forEach((lane,index)=>{const fraction=laneMovementFraction(lane,movement.from,movement.to);if(fraction>0){rows[index].usedAfterburner=true;rows[index].afterburnerSeconds+=paid*fraction;}});
        }
      }
      previous={position:{...position},seconds};
    },
    snapshot:()=>rows.map(row=>({...row})),
  };
}
