const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=v=>Math.atan2(Math.sin(v),Math.cos(v));
/** Test pilot outputs controls only; it never changes position, velocity or attitude. */
export function sierra10Pilot(state,course){
 const gate=course.gates[Math.min(state.activeGateIndex,course.gates.length-1)],dx=gate.center.x-state.position.x,dz=gate.center.z-state.position.z,horizontal=Math.hypot(dx,dz),speed=state.speed;
 const bearing=wrap(Math.atan2(dx,-dz)-state.heading),lookahead=Math.max(200,horizontal),yawRate=4*speed*Math.sin(bearing)/lookahead;
 const maxBank=Math.atan(Math.sqrt(9*9-1));
 return {bankDemand:clamp(Math.atan(speed*yawRate/9.8)/maxBank,-1,1),pitchDemandRadians:clamp(Math.atan2((gate.center.y-state.position.y)*1.8,Math.max(200,horizontal)),-5.25*Math.PI/180,5.25*Math.PI/180),throttle:1,afterburnerRequested:state.activeGateIndex===6};
}
