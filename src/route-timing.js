export const ROUTE_SEGMENTS=Object.freeze([
  {id:'start-light1',label:'開始→光1'},{id:'light1-light2',label:'光1→光2'},
  {id:'light2-light3',label:'光2→光3'},{id:'light3-exit',label:'光3→出口'},
]);
/**
 * Called only with active play time; menus, sensor waits and pauses are excluded.
 * targetVisible describes the current target AFTER this frame's stage update.
 * Initial target time starts at 0; call advance(0, state) when play starts to
 * sample an already visible first target. Target changes are observed at the
 * end of a frame, so a new target already in view records 0s. Samples have
 * frame-level precision; no sub-frame visibility or collection is inferred.
 */
export function createRouteTiming() {
  let elapsed=0,ends=Array(4).fill(null);
  let exitOpened=false,exitElapsed=0,firstVisibleSeconds=null;
  let targetIndex=0,targetElapsed=0,targetFirstViews=Array(4).fill(null),targetsComplete=false;
  return {
    reset(){
      elapsed=0;ends=Array(4).fill(null);
      exitOpened=false;exitElapsed=0;firstVisibleSeconds=null;
      targetIndex=0;targetElapsed=0;targetFirstViews=Array(4).fill(null);targetsComplete=false;
    },
    advance(dt,state={}){
      if(!Number.isFinite(dt)||dt<0||ends[3]!==null)return;
      if(state===null||typeof state!=='object')state={};
      const validCount=Number.isInteger(state.collected)&&state.collected>=0&&state.collected<=3;
      const count=validCount?state.collected:0;

      if(!targetsComplete){
        const sameTarget=validCount&&count===targetIndex;
        // A sample after collection belongs to the NEW target only. Skipped
        // targets retain null because no visibility sample exists for them.
        if(validCount&&count>targetIndex){targetIndex=count;targetElapsed=0;}
        else targetElapsed+=dt;
        if(validCount&&count>=targetIndex){
          const completes=count===3&&state.complete===true;
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
      if(count===3)exitOpened=true;
      if(exitOpened&&firstVisibleSeconds===null&&state.exitVisible===true)firstVisibleSeconds=exitElapsed;
      // Preserve the existing segment rule: zero-time samples never complete a segment.
      if(dt===0)return;
      elapsed+=dt;
      for(let i=0;i<count;i++)if(ends[i]===null)ends[i]=elapsed;
      if(state.complete&&count===3)ends[3]=elapsed;
    },
    snapshot:()=>ROUTE_SEGMENTS.map((segment,i)=>({...segment,seconds:ends[i]===null?null:ends[i]-(i?ends[i-1]:0)})),
    exitSnapshot:()=>({opened:exitOpened,firstVisibleSeconds}),
    targetViewsSnapshot:()=>ROUTE_SEGMENTS.map(({id},i)=>({id,firstVisibleSeconds:targetFirstViews[i]})),
  };
}
