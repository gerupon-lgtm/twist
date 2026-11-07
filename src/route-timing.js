export const ROUTE_SEGMENTS=Object.freeze([
  {id:'start-light1',label:'開始→光1'},{id:'light1-light2',label:'光1→光2'},
  {id:'light2-light3',label:'光2→光3'},{id:'light3-exit',label:'光3→出口'},
]);
/** Called only with active play time; menus, sensor waits and pauses are excluded. */
export function createRouteTiming() {
  let elapsed=0,ends=Array(4).fill(null);
  let exitOpened=false,exitElapsed=0,firstVisibleSeconds=null;
  return {
    reset(){
      elapsed=0;ends=Array(4).fill(null);
      exitOpened=false;exitElapsed=0;firstVisibleSeconds=null;
    },
    advance(dt,state={}){
      if(!Number.isFinite(dt)||dt<0||ends[3]!==null)return;
      const count=Number.isInteger(state.collected)&&state.collected>=0&&state.collected<=3?state.collected:0;
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
  };
}
