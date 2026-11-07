const validTotal=count=>Number.isInteger(count)&&count>=3&&count<=8;
const routeSegments=count=>Array.from({length:count+1},(_,index)=>({
  id:index===0?'start-light1':index===count?`light${count}-exit`:`light${index}-light${index+1}`,
  label:index===0?'開始→光1':index===count?`光${count}→出口`:`光${index}→光${index+1}`,
}));
export const ROUTE_SEGMENTS=Object.freeze(routeSegments(3));
/**
 * Called only with active play time; menus, sensor waits and pauses are excluded.
 * targetVisible describes the current target AFTER this frame's stage update.
 * Initial target time starts at 0; call advance(0, state) when play starts to
 * sample an already visible first target. Target changes are observed at the
 * end of a frame, so a new target already in view records 0s. Samples have
 * frame-level precision; no sub-frame visibility or collection is inferred.
 */
export function createRouteTiming(count=3) {
  let total=validTotal(count)?count:3,segments=routeSegments(total);
  let elapsed=0,ends=Array(total+1).fill(null);
  let exitOpened=false,exitElapsed=0,firstVisibleSeconds=null;
  let targetIndex=0,targetElapsed=0,targetFirstViews=Array(total+1).fill(null),targetsComplete=false;
  return {
    reset(count=total){
      if(validTotal(count))total=count;
      segments=routeSegments(total);
      elapsed=0;ends=Array(total+1).fill(null);
      exitOpened=false;exitElapsed=0;firstVisibleSeconds=null;
      targetIndex=0;targetElapsed=0;targetFirstViews=Array(total+1).fill(null);targetsComplete=false;
    },
    advance(dt,state={}){
      if(!Number.isFinite(dt)||dt<0||ends[total]!==null)return;
      if(state===null||typeof state!=='object')state={};
      // A sample from another selected course cannot contaminate these clocks.
      // Missing total remains compatible with the original timing API.
      if(state.total!==undefined&&state.total!==total)return;
      const validCount=Number.isInteger(state.collected)&&state.collected>=0&&state.collected<=total;
      const count=validCount?state.collected:0;

      if(!targetsComplete){
        const sameTarget=validCount&&count===targetIndex;
        // A sample after collection belongs to the NEW target only. Skipped
        // targets retain null because no visibility sample exists for them.
        if(validCount&&count>targetIndex){targetIndex=count;targetElapsed=0;}
        else targetElapsed+=dt;
        if(validCount&&count>=targetIndex){
          const completes=count===total&&state.complete===true;
          // A completion sample may reveal an exit that was already active;
          // jumping straight to complete never invents an active exit frame.
          if((!completes||sameTarget)&&targetFirstViews[targetIndex]===null&&state.targetVisible===true){
            targetFirstViews[targetIndex]=targetElapsed;
          }
          if(completes)targetsComplete=true;
        }
      }

      // v0.1.24 exit timing remains separate from the new target sample.
      // Opening is observed at this frame's end, so visibility on the same frame is 0s.
      if(exitOpened&&firstVisibleSeconds===null)exitElapsed+=dt;
      if(count===total)exitOpened=true;
      if(exitOpened&&firstVisibleSeconds===null&&state.exitVisible===true)firstVisibleSeconds=exitElapsed;
      // Preserve the existing segment rule: zero-time samples never complete a segment.
      if(dt===0)return;
      elapsed+=dt;
      for(let i=0;i<count;i++)if(ends[i]===null)ends[i]=elapsed;
      if(state.complete&&count===total)ends[total]=elapsed;
    },
    snapshot:()=>segments.map((segment,i)=>({...segment,seconds:ends[i]===null?null:ends[i]-(i?ends[i-1]:0)})),
    exitSnapshot:()=>({opened:exitOpened,firstVisibleSeconds}),
    targetViewsSnapshot:()=>segments.map(({id},i)=>({id,firstVisibleSeconds:targetFirstViews[i]})),
  };
}
