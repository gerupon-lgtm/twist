const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const finite=(v,f=0)=>Number.isFinite(v)?v:f;
const angles=ray=>({heading:Math.atan2(ray.x,-ray.z),climb:Math.atan2(ray.y,Math.hypot(ray.x,ray.z))});
const direction=(heading,climb)=>({x:Math.sin(heading)*Math.cos(climb),y:Math.sin(climb),z:-Math.cos(heading)*Math.cos(climb)});

/** Smooth command offsets from actual track, so turning does not eat the lead.
 * previous.direction is the last ray actually drawn after HUD placement/clamp.
 * The caller still enforces the advice's current direction/angle limits.
 */
export function advanceSupersonicGuidanceDirection(previous,desired,{velocity,heading=0,dt=0,timeConstant=.2}={}){
  const horizontal=Math.hypot(finite(velocity?.x),finite(velocity?.z));
  const track={heading:horizontal>1e-9?Math.atan2(velocity.x,-velocity.z):finite(heading),climb:Math.atan2(finite(velocity?.y),horizontal)};
  const goal=angles(desired),before=previous?.direction?angles(previous.direction):goal;
  const oldTrack=previous?.direction&&Number.isFinite(previous.track?.heading)&&Number.isFinite(previous.track?.climb)?previous.track:track;
  const goalYaw=wrap(goal.heading-track.heading),goalClimb=goal.climb-track.climb;
  const beforeYaw=previous?.direction?wrap(before.heading-oldTrack.heading):goalYaw;
  const beforeClimb=previous?.direction?before.climb-oldTrack.climb:goalClimb;
  const seconds=Math.max(0,finite(dt)),tau=Math.max(0,finite(timeConstant,.2)),blend=tau===0?1:-Math.expm1(-seconds/tau);
  return {direction:direction(track.heading+beforeYaw+wrap(goalYaw-beforeYaw)*blend,track.climb+beforeClimb+(goalClimb-beforeClimb)*blend),track};
}
