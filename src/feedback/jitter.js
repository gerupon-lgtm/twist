const delta=(n,origin)=>Math.atan2(Math.sin((n-origin)*Math.PI/180),Math.cos((n-origin)*Math.PI/180))*180/Math.PI;
/** Input ranges also include intentional hand movement; they do not prove vibration interference. */
export function createSensorJitter() {
  let samples=[],windows=0,sumPitch=0,sumSteer=0,maxPitch=0,maxSteer=0,lastWindow=null;
  const ranges=()=>{
    if(!samples.length)return {pitch:0,steer:0};
    const pitch=samples.map(s=>delta(s.pitch,samples[0].pitch)),steer=samples.map(s=>delta(s.steer,samples[0].steer));
    return {pitch:Math.max(...pitch)-Math.min(...pitch),steer:Math.max(...steer)-Math.min(...steer)};
  };
  return {
    add(time,pitch,steer){
      if(![time,pitch,steer].every(Number.isFinite))return;
      samples.push({time,pitch,steer});while(samples.length>0&&samples[0].time<time-1000)samples.shift();
      if(lastWindow===null)lastWindow=time;
      if(time-lastWindow>=1000){const r=ranges();windows++;sumPitch+=r.pitch;sumSteer+=r.steer;maxPitch=Math.max(maxPitch,r.pitch);maxSteer=Math.max(maxSteer,r.steer);lastWindow=time;}
    },
    clearWindow(){samples=[];lastWindow=null;},
    reset(){samples=[];windows=0;sumPitch=0;sumSteer=0;maxPitch=0;maxSteer=0;lastWindow=null;},
    snapshot(){return {window:ranges(),windows,meanPitchRange:windows?sumPitch/windows:0,maxPitchRange:maxPitch,
      meanSteerRange:windows?sumSteer/windows:0,maxSteerRange:maxSteer};},
  };
}
