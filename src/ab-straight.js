/** Geometric telemetry only: this neither moves the craft nor changes capture. */
export function abLaneStatus(lanes,position){
  if(!Array.isArray(lanes)||!position||![position.x,position.y,position.z].every(Number.isFinite))return null;
  let nearest=null;
  for(const lane of lanes){
    const dx=lane.to.x-lane.from.x,dz=lane.to.z-lane.from.z,length=Math.hypot(dx,dz);
    if(!Number.isFinite(length)||length<=0)continue;
    const along=((position.x-lane.from.x)*dx+(position.z-lane.from.z)*dz)/length;
    const progress=along/length,clamped=Math.max(0,Math.min(1,progress));
    const x=lane.from.x+dx*clamped,z=lane.from.z+dz*clamped,y=lane.from.y+(lane.to.y-lane.from.y)*clamped;
    const centerDistance=Math.hypot(position.x-x,position.z-z),entryDistance=Math.hypot(position.x-lane.from.x,position.y-lane.from.y,position.z-lane.from.z);
    const inside=progress>=0&&progress<=1&&centerDistance<=lane.width/2&&Math.abs(position.y-y)<=lane.heightTolerance;
    const status={id:lane.id,inside,progress,length,centerDistance,entryDistance};
    if(nearest===null||centerDistance<nearest.centerDistance)nearest=status;
  }
  return nearest;
}
