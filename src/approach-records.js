const finitePoint=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function closestSegmentDistance(a,b,p){
  if(!finitePoint(a)||!finitePoint(b)||!finitePoint(p))return null;
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,den=dx*dx+dy*dy+dz*dz;
  const t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/den)):0;
  return Math.hypot(a.x+dx*t-p.x,a.y+dy*t-p.y,a.z+dz*t-p.z);
}
/** Observations only. A swept closest approach never changes collection. */
export function createApproachRecords(count=3){
  let total=count,rows=[],previous=null,finished=false;
  const reset=n=>{total=Number.isInteger(n)&&n>=3&&n<=8?n:3;rows=Array.from({length:total+1},()=>({closestDistance:null,nearMisses:0,nearMissRadius:15,visiting:false}));previous=null;finished=false;};reset(total);
  function observe(index,a,b,target,acquired){
    const row=rows[index];if(!row||!finitePoint(target))return;
    const nearest=closestSegmentDistance(a,b,target);if(nearest===null)return;
    row.closestDistance=row.closestDistance===null?nearest:Math.min(row.closestDistance,nearest);
    if(acquired){row.visiting=false;return;}
    if(nearest<=15)row.visiting=true;
    // A wider exit threshold avoids counting repeated 15m boundary jitter.
    if(row.visiting&&distance(b,target)>=18){row.nearMisses++;row.visiting=false;}
  }
  return {
    reset,
    advance(dt,state={}){
      if(finished||!Number.isFinite(dt)||dt<0||state.total!==total||!finitePoint(state.position)||!finitePoint(state.targetPosition)||!Number.isInteger(state.collected)||state.collected<0||state.collected>total)return;
      const index=state.collected,position={...state.position},target={...state.targetPosition};
      if(previous){
        const acquired=index>previous.index||state.complete===true;
        observe(previous.index,previous.position,position,previous.target,acquired);
        if(index!==previous.index&&!state.complete)observe(index,position,position,target,false);
      }else observe(index,position,position,target,state.complete===true);
      previous={index,position,target};finished=state.complete===true;
    },
    snapshot:()=>rows.map(({visiting,...record})=>({...record})),
  };
}
