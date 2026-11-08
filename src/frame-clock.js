/** A queued animation frame cannot move the active start boundary backwards. */
export function advanceFrameClock(previousFrame,frameAt,{maxStep=.05}={}){
  const previous=Number.isFinite(previousFrame)?previousFrame:Number.isFinite(frameAt)?frameAt:0;
  const frame=Number.isFinite(frameAt)?frameAt:previous;
  const limit=Number.isFinite(maxStep)&&maxStep>=0?maxStep:.05;
  const time=Math.max(previous,frame);
  return {time,dt:Math.min(limit,Math.max(0,(time-previous)/1000))};
}
