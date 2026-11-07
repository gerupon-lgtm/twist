/** Accumulate stage counters across crash retries; menus never add time. */
export function createAfterburnerSession(){
 const empty=()=>({uses:0,seconds:0,earned:0,maxSpeed:0});
 let totals=empty(),leg=empty(),previous=empty();
 const clean=value=>Number.isFinite(value)&&value>0?value:0;
 return {
  reset(){totals=empty();leg=empty();previous=empty();},
  beginLeg(){leg=empty();previous=empty();},
  advance(state={}){
   for(const key of ['uses','seconds','earned']){
    const value=clean(state[key]);totals[key]+=Math.max(0,value-previous[key]);leg[key]=value;previous[key]=value;
   }
   leg.maxSpeed=Math.max(leg.maxSpeed,clean(state.maxSpeed));totals.maxSpeed=Math.max(totals.maxSpeed,leg.maxSpeed);
  },
  snapshot(){return {...totals};},
  lastLegSnapshot(){return {...leg};},
 };
}
