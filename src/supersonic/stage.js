import {createSupersonicProfile} from './profile.js';
import {SUPERSONIC_COURSE} from './course.js';
import {createSupersonicState,advanceSupersonic} from './physics.js';
import {createSupersonicRenderer} from './renderer.js';
import {abLaneStatus} from '../ab-straight.js';

const EMPTY=Object.freeze([]),copy=v=>({x:v.x,y:v.y,z:v.z}),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let attemptSerial=0;
function nextAttempt(explicit){
  attemptSerial++;
  if(explicit!==undefined&&explicit!==null){if(Number.isSafeInteger(explicit))attemptSerial=Math.max(attemptSerial,explicit);return explicit;}
  return attemptSerial;
}

/** Advisory only. Authority comes from this model's available support, never normal 40° bank. */
export function supersonicBoundaryStatus(state,profile,course){
  const half=course.arena.halfExtent,position=state.position,velocity=state.velocity;
  const lateral=Math.sqrt(Math.max(0,state.availableNormalAcceleration**2-profile.gravity**2));
  const turnRadius=lateral>1e-8?state.speed**2/lateral:null;
  const warningDistance=clamp((turnRadius??half)+state.speed*2,1000,half*.75);
  const clearance=half-Math.max(Math.abs(position.x),Math.abs(position.z));
  const inner=Math.max(0,half-warningDistance-100);
  let returnPosition={x:clamp(position.x,-inner,inner),y:position.y,z:clamp(position.z,-inner,inner)};
  let dx=returnPosition.x-position.x,dz=returnPosition.z-position.z;
  if(dx===0&&dz===0){returnPosition={x:0,y:position.y,z:0};dx=-position.x;dz=-position.z;}
  const length=Math.hypot(dx,dz),returnDirection=length?{x:dx/length,y:0,z:dz/length}:null;
  const returnHeading=returnDirection?Math.atan2(returnDirection.x,-returnDirection.z):null;
  const returnBearingDeg=returnHeading===null?null:Math.atan2(Math.sin(returnHeading-state.heading),Math.cos(returnHeading-state.heading))*180/Math.PI;
  const walls=[{d:half-position.x,v:velocity.x},{d:half+position.x,v:-velocity.x},{d:half-position.z,v:velocity.z},{d:half+position.z,v:-velocity.z}];
  const outwardSpeed=Math.max(...walls.filter(w=>Math.abs(w.d-clearance)<1e-7).map(w=>w.v));
  const approaching=outwardSpeed>.1,returning=outwardSpeed<-.1;
  const upperClearance=course.arena.maxAltitude-position.y;
  return {halfExtent:half,clearance,near:clearance<=warningDistance,outside:clearance<0,level:clearance<0?'outside':clearance<=warningDistance?'near':'clear',warningDistance,
    turnRadius,availableNormalAcceleration:state.availableNormalAcceleration,turnGravity:profile.gravity,maxBank:profile.maxBankRadians*180/Math.PI,
    returnPosition,returnDirection,returnHeading,returnBearingDeg,nearestEdge:Math.abs(position.x)>=Math.abs(position.z)?position.x<0?'west':'east':position.z<0?'north':'south',
    outwardSpeed,approaching,returning,motion:approaching?'outward':returning?'inward':state.speed>.1?'parallel':'stopped',timeToEdge:approaching?Math.max(0,clearance)/outwardSpeed:null,
    upperClearance,above:upperClearance<0,upperNear:upperClearance<=Math.max(500,Math.max(0,velocity.y)*5),maxAltitude:course.arena.maxAltitude,upperAdvisory:true};
}

/** Shared adapter also lets CPU tests exercise the real kernel with a drawing stub. */
export function createSupersonicStageAdapter(renderer,{course=SUPERSONIC_COURSE,supersonicSettings}={}){
  let requestedSettings=supersonicSettings,profile=createSupersonicProfile(requestedSettings);
  let state=createSupersonicState(profile,course,{attemptId:nextAttempt()}),disposed=false,running=false,lastInput={};
  let events=EMPTY,afterburnerMotion=EMPTY,timing;
  const clearFrame=()=>{events=EMPTY;afterburnerMotion=EMPTY;timing={requestedSeconds:0,advancedSeconds:0,
    carriedInSeconds:state.pendingSeconds,carriedOutSeconds:state.pendingSeconds,
    terminalRemainder:0,remainingSeconds:0,windowCount:0,reason:null};};
  function draw(dt=0){renderer.sync(state,lastInput,dt,{phase:running?'running':'paused'});}
  function update(dt,input={}){
    if(disposed)return;lastInput={...lastInput,...input};clearFrame();
    const canonical={...(input.supersonic??{}),paused:input.paused===true||input.supersonic?.paused===true};
    const requested=Number.isFinite(dt)&&dt>0?dt:0;
    if(canonical.paused){state=advanceSupersonic(state,canonical,0,profile,course).state;running=false;draw();return;}
    if(!running||requested===0){draw();return;}
    const frameCarriedIn=state.pendingSeconds;
    let remaining=requested,processed=0,windows=0,advanced=0,advancedCarry=0,reason=null;const frameEvents=[],motion=[];
    while(remaining>0&&!state.complete&&!state.grounded){
      const seconds=Math.min(1,remaining),result=advanceSupersonic(state,canonical,seconds,profile,course);
      const beforeAdvanced=advanced,consumed=result.timing.advancedSeconds;
      const increment=consumed+advancedCarry,nextAdvanced=advanced+increment;
      advancedCarry=increment-(nextAdvanced-advanced);advanced=nextAdvanced;
      state=result.state;windows++;processed+=seconds;
      remaining=Math.max(0,requested-processed);
      // Kernel offsets include its incoming physical carry. Translate once to
      // this raw frame: a past deferred event may have a tiny negative offset.
      for(const event of result.events)frameEvents.push(Object.freeze({...event,offsetSeconds:beforeAdvanced+event.offsetSeconds-frameCarriedIn}));
      for(const segment of result.segments)if(segment.afterburnerActive&&segment.seconds>0)motion.push(Object.freeze({from:Object.freeze(copy(segment.from)),to:Object.freeze(copy(segment.to)),seconds:segment.seconds}));
      reason=result.timing.reason;
      if(!state.complete&&!state.grounded){
        const ledger=consumed+result.timing.carriedOutSeconds-result.timing.carriedInSeconds;
        const tolerance=Math.max(1e-15,8*Number.EPSILON*Math.max(1,seconds,Math.abs(ledger)));
        if(!Number.isFinite(consumed)||Math.abs(ledger-seconds)>tolerance
          ||consumed<=0&&!(result.timing.carriedOutSeconds>result.timing.carriedInSeconds))throw new Error('supersonic kernel did not consume or carry positive time');
      }
    }
    if(state.complete||state.grounded)running=false;
    events=Object.freeze(frameEvents);afterburnerMotion=Object.freeze(motion);
    const terminalRemainder=state.complete||state.grounded?Math.max(0,requested+frameCarriedIn-advanced):0;
    timing={requestedSeconds:requested,advancedSeconds:advanced,carriedInSeconds:frameCarriedIn,carriedOutSeconds:state.pendingSeconds,
      terminalRemainder,remainingSeconds:terminalRemainder,windowCount:windows,reason};
    draw(advanced);
  }
  function getStatus(){
    const visual=renderer.snapshot()??{},gate=course.gates[Math.min(state.activeGateIndex,course.gates.length-1)];
    const target=gate.center,relative={x:target.x-state.position.x,y:target.y-state.position.y,z:target.z-state.position.z};
    const targetLocal=renderer.localPosition(target),afterburner={...state.afterburner},metrics={...state.metrics},gateResults=state.gateResults.map(row=>({...row}));
    const targetGate={id:gate.id,index:gate.index,center:copy(gate.center),normal:copy(gate.normal),right:copy(gate.right),up:copy(gate.up),radius:gate.radius};
    const sibling={...state,position:copy(state.position),velocity:copy(state.velocity),orientation:{...state.orientation},supportAcceleration:copy(state.supportAcceleration),crossingState:{...state.crossingState},afterburner,metrics,gateResults,
      effectiveSettings:{...profile.effectiveSettings},activeGate:targetGate,events,timing:{...timing},availableNormalAcceleration:state.availableNormalAcceleration,
      terminal:state.terminal?structuredClone(state.terminal):null,renderDiagnostics:visual,simulationSeconds:state.simulationSeconds,attemptId:state.attemptId};
    return {...visual,collected:state.collected,total:state.total,course:{id:course.id,name:course.name,targetCount:state.total,profile:'supersonic'},stageSize:{halfExtent:course.arena.halfExtent,width:course.arena.width,depth:course.arena.depth},
      boundary:supersonicBoundaryStatus(state,profile,course),boundaryAppearance:{advisory:true},turnGravity:profile.gravity,
      supersonic:sibling,events,afterburner,afterburnerMotion,complete:state.complete,grounded:state.grounded,mode:'flight',
      radarHeading:Math.hypot(state.velocity.x,state.velocity.z)>.1?Math.atan2(state.velocity.x,-state.velocity.z):state.heading,
      navigationTargets:state.complete?[]:course.gates.slice(state.activeGateIndex).map((g,i)=>({id:g.id,kind:g.kind,number:g.number,label:g.kind==='exit'?'出口':`門 ${g.number}`,next:i===0,position:copy(g.center)})),
      targetGate,targetGeometry:{type:'plane-disc',...targetGate},targetLabel:gate.kind==='exit'?'出口':`門 ${gate.number}`,targetPosition:copy(target),targetRadius:gate.radius,targetLocal,
      distance:Math.hypot(relative.x,relative.y,relative.z),bearing:Math.atan2(targetLocal.x,-targetLocal.z),elevation:Math.atan2(targetLocal.y,Math.hypot(targetLocal.x,targetLocal.z)),
      altitude:state.position.y,groundClearance:state.groundClearance,minimumSeaAltitude:metrics.minimumSeaAltitude,minimumSeaClearance:metrics.minimumSeaClearance,
      speed:state.speed,throttle:state.throttle,recoveryAssist:state.recoveryAssist,angleOfAttack:state.angleOfAttack,verticalSpeed:state.verticalSpeed,
      velocity:copy(state.velocity),position:copy(state.position),orientation:{...state.orientation},bank:state.bank,yawRate:state.yawRate,heading:state.heading,pitch:state.pitch,controlPitch:state.controlPitch,
      scenery:visual.world??{},groundPattern:visual.world?.sea??{},abLane:abLaneStatus(course.abStraights,state.position),landmarks:course.arena.landmarks??[],
      beaconAppearance:{core:'#ffc14b',ring:'#ffc14b',minPixels:0,columnTarget:null},exitAppearance:{position:copy(course.exit),radius:course.gates.at(-1).radius,unlocked:state.collected===state.total},
    };
  }
  function reset(options={}){
    if(disposed)return;if(options.supersonicSettings!==undefined)requestedSettings=options.supersonicSettings;
    profile=createSupersonicProfile(requestedSettings);state=createSupersonicState(profile,course,{attemptId:nextAttempt(options.attemptId)});running=false;lastInput={};clearFrame();renderer.resetDisplayRotation();draw();
  }
  clearFrame();draw();
  return {resize:renderer.resize,update,getStatus,reset,launchFlight(){if(disposed||state.complete||state.grounded)return;running=true;clearFrame();draw();},
    setVisibility:renderer.setVisibility,setGroundPatternStrength:renderer.setGroundPatternStrength,getPassObjects:renderer.getPassObjects,setDisplay:renderer.setDisplay,setCameraMode:renderer.setCameraMode,
    resetDisplayRotation:renderer.resetDisplayRotation,getRenderDiagnostics:()=>renderer.snapshot(),
    dispose(){if(disposed)return;disposed=true;renderer.dispose();},
  };
}

export function createSupersonicStage(canvas,options={}){
  const course=options.course??SUPERSONIC_COURSE;
  const renderer=createSupersonicRenderer(canvas,{...options,course});
  try{return createSupersonicStageAdapter(renderer,{...options,course});}catch(error){renderer.dispose();throw error;}
}
