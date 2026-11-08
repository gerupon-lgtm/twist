/** A queued animation frame cannot move the active start boundary backwards. */
export function advanceFrameClock(previousFrame,frameAt,{maxStep=.05}={}){
  const previous=Number.isFinite(previousFrame)?previousFrame:Number.isFinite(frameAt)?frameAt:0;
  const frame=Number.isFinite(frameAt)?frameAt:previous;
  const limit=Number.isFinite(maxStep)&&maxStep>=0?maxStep:.05;
  const candidate=Math.max(previous,frame);
  // Browser start/resume timestamps can differ only by floating-point rounding.
  // Keep that boundary until the next real frame, carrying every elapsed second
  // forward instead of passing a sub-picosecond force step to the stage.
  const roundingMs=Math.max(1e-9,4*Number.EPSILON*Math.max(1,Math.abs(previous),Math.abs(frame)));
  const time=candidate-previous<=roundingMs?previous:candidate;
  return {time,dt:Math.min(limit,Math.max(0,(time-previous)/1000))};
}
