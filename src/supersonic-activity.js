const value=(state,key)=>state?.[key]??state?.metrics?.[key];
/** Map measured active frame intervals to numerical crossing offsets; menus never call advance. */
export function createSupersonicActivity(){
 let attemptId=null,activeSeconds=0,interruptedSeconds=0,lastSimulationSeconds=0,lastClockCarrySeconds=0,firstMach1ActiveSeconds=null,firstMach2ActiveSeconds=null;
 function begin(state){
  if(state&&state.attemptId!==attemptId){attemptId=state.attemptId;activeSeconds=0;interruptedSeconds=0;lastSimulationSeconds=state.simulationSeconds??0;lastClockCarrySeconds=Number.isFinite(state.clockCarrySeconds)?state.clockCarrySeconds:0;firstMach1ActiveSeconds=null;firstMach2ActiveSeconds=null;}
 }
 return {
  begin,
  advance(rawSeconds,state){
   if(!state||!Number.isFinite(rawSeconds)||rawSeconds<0)return;
   begin(state);
   const simulation=state.simulationSeconds,advanced=simulation-lastSimulationSeconds;
   if(!Number.isFinite(simulation))return;
   const remainder=state.timing?.terminalRemainder??state.timing?.remainingSeconds??0;
   const timing=state.timing;
   const ledger=timing&&['advancedSeconds','carriedInSeconds','carriedOutSeconds'].every(key=>Number.isFinite(timing[key])&&timing[key]>=0);
   if(ledger){
    const carryIn=timing.carriedInSeconds,carryOut=timing.carriedOutSeconds,integrated=timing.advancedSeconds;
    // Pending time was already counted in a previous active frame. A terminal
    // event inside that pending part can refund up to carryIn from that frame.
    const accepted=Math.max(-carryIn,rawSeconds-Math.max(0,Number.isFinite(remainder)?remainder:0));
    const accounted=integrated+carryOut-carryIn,unprocessed=Math.max(0,accepted-accounted);
    if(unprocessed>1e-6)interruptedSeconds+=unprocessed;
    if(integrated>0&&unprocessed<=1e-6)for(const n of [1,2]){
     const at=value(state,`firstMach${n}Seconds`);
     if(!Number.isFinite(at)||at<lastSimulationSeconds-1e-8||at>simulation+1e-8)continue;
     const event=state.events?.find(event=>n===1?event.type==='mach-crossing'&&event.thresholdMach===1&&event.direction==='up':event.type==='mach2-reached');
     // Adapter offsets already use the current raw frame boundary. Do not
     // subtract carryIn again. Metric-only snapshots retain a numeric fallback.
     const offset=Number.isFinite(event?.offsetSeconds)?event.offsetSeconds:at-lastSimulationSeconds-lastClockCarrySeconds-carryIn;
     const lower=-carryIn,upper=integrated-carryIn;
     if(offset<lower-1e-8||offset>upper+1e-8)continue;
     const measured=Math.max(0,activeSeconds+Math.max(lower,Math.min(upper,offset)));
     if(n===1&&firstMach1ActiveSeconds===null)firstMach1ActiveSeconds=measured;
     if(n===2&&firstMach2ActiveSeconds===null)firstMach2ActiveSeconds=measured;
    }
    activeSeconds=Math.max(0,activeSeconds+accepted);lastSimulationSeconds=simulation;
    lastClockCarrySeconds=Number.isFinite(state.clockCarrySeconds)?state.clockCarrySeconds:0;
    return;
   }
   const accepted=Math.max(0,rawSeconds-Math.max(0,Number.isFinite(remainder)?remainder:0));
   if(advanced<=0){if(!state.complete&&!state.grounded){activeSeconds+=accepted;interruptedSeconds+=accepted;}return;}
   const unprocessed=Math.max(0,accepted-advanced);
   if(unprocessed>1e-6)interruptedSeconds+=unprocessed;
   for(const n of [1,2]){
    const at=value(state,`firstMach${n}Seconds`);
    if(unprocessed>1e-6||!Number.isFinite(at)||at<lastSimulationSeconds-1e-8||at>simulation+1e-8)continue;
    const measured=activeSeconds+accepted*Math.max(0,Math.min(1,(at-lastSimulationSeconds)/advanced));
    if(n===1&&firstMach1ActiveSeconds===null)firstMach1ActiveSeconds=measured;
    if(n===2&&firstMach2ActiveSeconds===null)firstMach2ActiveSeconds=measured;
   }
   activeSeconds+=accepted;lastSimulationSeconds=simulation;
  },
  snapshot:()=>({attemptId,activeSeconds,interruptedSeconds,firstMach1ActiveSeconds,firstMach2ActiveSeconds}),
 };
}
