import {FLIGHT_TURN,flightTurnRadius} from './flight-turn.js';

const point=(x,y,z)=>Object.freeze({x,y,z});
const finalLane=(id,from,to,entry,runout)=>{
  const length=Math.hypot(to.x-from.x,to.z-from.z);
  const at=distance=>point(from.x+(to.x-from.x)*distance/length,from.y+(to.y-from.y)*distance/length,from.z+(to.z-from.z)*distance/length);
  return Object.freeze({id:`${id}-final`,from:at(entry),to:at(length-runout),width:24,heightTolerance:12});
};
const course=(id,name,start,lights,exit,entry=0,runout=0)=>Object.freeze({id,name,start:Object.freeze(start),
  lights:Object.freeze(lights.map(Object.freeze)),exit:Object.freeze(exit),
  abStraights:Object.freeze(entry?[finalLane(id,lights.at(-1),exit,entry,runout)]:[])});
/** The released short route remains an explicit comparison, not the default. */
export const LEGACY_COURSE=course('legacy','v0.1.25 比較用',point(0,14,26),[
  point(0,14,0),point(4,16,-34),point(4,18,-68),
],point(8,20,-96));
export const COURSE=LEGACY_COURSE;
export const DEFAULT_COURSE_ID='easy';
export const COURSES=Object.freeze({
  easy:course('easy','やさしい・おおきな半周',point(-150,22,200),[
    point(-150,24,130),point(-60,30,40),point(80,24,40),
  ],point(280,28,40-200*Math.sqrt(3)),90,40),
  normal:course('normal','ふつう・右から左へ',point(-180,22,300),[
    point(-180,24,230),point(-80,30,130),point(30,24,130),point(140,32,130),point(195,24,130-55*Math.sqrt(3)),
  ],point(195-490/Math.sqrt(2),30,130-55*Math.sqrt(3)-490/Math.sqrt(2)),120,40),
  hard:course('hard','むずかしい・二つのうず',point(-240,24,60),[
    point(-240,28,0),point(-240+85/Math.sqrt(2),38,-85/Math.sqrt(2)),
    point(-155+85/Math.sqrt(2),28,-85/Math.sqrt(2)),
    point(-112.5+85/Math.sqrt(2),38,-85/Math.sqrt(2)+42.5*Math.sqrt(3)),
    point(-155+85/Math.sqrt(2),28,-85/Math.sqrt(2)+85*Math.sqrt(3)),
    point(-197.5+85/Math.sqrt(2),38,-85/Math.sqrt(2)+127.5*Math.sqrt(3)),
    point(-155+85/Math.sqrt(2),28,-85/Math.sqrt(2)+170*Math.sqrt(3)),
    point(-70+85/Math.sqrt(2),38,-85/Math.sqrt(2)+170*Math.sqrt(3)),
  ],point(205+85/Math.sqrt(2),28,-85/Math.sqrt(2)-105*Math.sqrt(3)),150,50),
});
export function normalizeCourseId(id){
  return typeof id==='string'&&(id==='legacy'||Object.hasOwn(COURSES,id))?id:DEFAULT_COURSE_ID;
}
export function getCourse(id){const key=normalizeCourseId(id);return key==='legacy'?LEGACY_COURSE:COURSES[key];}

const difficulty=(lightCountRange,utilizationBand,minSignificantTurns,cruiseTimeRange)=>Object.freeze({
  lightCountRange:Object.freeze(lightCountRange),utilizationBand:Object.freeze(utilizationBand),
  minSignificantTurns,cruiseTimeRange:Object.freeze(cruiseTimeRange),
});
/** All acceptance numbers are here. Difficulty bands apply at 20 m/s only. */
export const COURSE_CRITERIA=Object.freeze({
  speeds:Object.freeze([10,20]),difficultySpeed:20,cruiseSpeed:10,bankDegrees:30,turnGravity:FLIGHT_TURN.defaultGravity,
  minimumTurnDegrees:45,maximumUtilization:1,
  limits:Object.freeze({horizontal:350,minHeight:2,maxHeight:45,heightChange:10,minLights:3,maxLights:8}),
  abMinimumLengths:Object.freeze({easy:200,normal:300,hard:300}),
  abMinimumEntryMargin:80,abMinimumExitRunout:35,
  difficulties:Object.freeze({easy:difficulty([3,4],[.3,.6],2,[60,100]),
    normal:difficulty([5,6],[.4,.8],3,[90,150]),hard:difficulty([7,8],[.6,.9],6,[120,180])}),
});
const EPSILON=1e-8;
const degrees=radians=>radians*180/Math.PI;
const isPoint=p=>p&&typeof p==='object'&&!Array.isArray(p)&&[p.x,p.y,p.z].every(Number.isFinite);

/**
 * Local three-point geometry, not a flight/visibility certificate. A corner's
 * circumradius is AC/(2 sin |turn|). U=Rmin/Rcourse is checked at BOTH 10/20;
 * U20=4*U10 in the ordinary range, so only U20 gets the difficulty lower band.
 * The old inside-rounded-polyline/3.2 m test is deliberately replaced: the new
 * reference curves pass through lights rather than cutting across their corners.
 */
export function validateCourse(input,options={}){
  const errors=[];
  const result={valid:false,courseId:null,turnRadius:null,turnRadii:{},initialHeadingChangeDegrees:null,
    segments:[],turns:[],significantTurnCount:0,qualifyingTurnCount:0,length:0,cruiseTimeSeconds:null,
    hasAscent:false,hasDescent:false,abStraights:[],abStraightsValid:false,errors};
  if(!options||typeof options!=='object'||Array.isArray(options)){
    errors.push('flight conditions must be an object');return result;
  }
  const {bankDegrees=COURSE_CRITERIA.bankDegrees,turnGravity=COURSE_CRITERIA.turnGravity}=options;
  if(!Number.isFinite(bankDegrees)||bankDegrees<=0||bankDegrees>=90)errors.push('bankDegrees must be finite and between zero and 90');
  if(!Number.isFinite(turnGravity)||turnGravity<FLIGHT_TURN.minGravity||turnGravity>FLIGHT_TURN.maxGravity)
    errors.push('turnGravity must be finite and in the supported 3..15 range');
  if(errors.length)return result;
  result.bankDegrees=bankDegrees;result.turnGravity=turnGravity;result.speeds=[...COURSE_CRITERIA.speeds];
  for(const speed of COURSE_CRITERIA.speeds){
    const radius=flightTurnRadius(speed,bankDegrees*Math.PI/180,turnGravity);
    if(!Number.isFinite(radius)||radius<=0)errors.push('flight conditions must produce finite positive turn radii');
    result.turnRadii[speed]=radius;
  }
  result.turnRadius=result.turnRadii[COURSE_CRITERIA.difficultySpeed];
  if(errors.length)return result;
  const limits=COURSE_CRITERIA.limits;
  if(!input||typeof input!=='object'||!Array.isArray(input.lights)
    ||input.lights.length<limits.minLights||input.lights.length>limits.maxLights){
    errors.push('course must contain start, 3..8 lights, and exit');return result;
  }
  const id=normalizeCourseId(options.courseId??input.id),difficultyId=id==='legacy'?'easy':id;
  const criteria=COURSE_CRITERIA.difficulties[difficultyId];result.courseId=id;result.criteria=criteria;
  if(input.lights.length<criteria.lightCountRange[0]||input.lights.length>criteria.lightCountRange[1])
    errors.push(`${difficultyId} has the wrong number of lights`);
  const points=[input.start,...input.lights,input.exit],names=['start',...input.lights.map((_,i)=>`light${i+1}`),'exit'];
  points.forEach((p,i)=>{
    if(!isPoint(p))errors.push(`${names[i]} must have finite numeric x, y, and z`);
    else if(Math.abs(p.x)>limits.horizontal||Math.abs(p.z)>limits.horizontal||p.y<limits.minHeight||p.y>limits.maxHeight)
      errors.push(`${names[i]} is outside course bounds`);
  });
  if(errors.length)return result;
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)
    if(Math.hypot(points[j].x-points[i].x,points[j].z-points[i].z)<=EPSILON)
      errors.push(`${names[i]} and ${names[j]} must have distinct horizontal positions`);
  if(errors.length)return result;
  const lines=points.slice(1).map((p,i)=>{
    const x=p.x-points[i].x,z=p.z-points[i].z,horizontalDistance=Math.hypot(x,z);
    return {x:x/horizontalDistance,z:z/horizontalDistance,horizontalDistance};
  });
  // The marked lane occupies the final approach only. Its lead-in leaves time
  // to finish the last TGT turn at cruise speed; the finish has no following turn.
  const finalStart=points.at(-2),finalLine=lines.at(-1),finalLength=finalLine.horizontalDistance;
  const lanes=Array.isArray(input.abStraights)?input.abStraights:[];
  result.abStraights=lanes.map((lane,index)=>{
    const laneErrors=[];
    if(typeof lane?.id!=='string'||!lane.id||!isPoint(lane.from)||!isPoint(lane.to)
      ||!Number.isFinite(lane.width)||lane.width<=0||!Number.isFinite(lane.heightTolerance)||lane.heightTolerance<=0){
      laneErrors.push('must contain id, finite endpoints, positive width and height tolerance');
      return {id:lane?.id??String(index),valid:false,errors:laneErrors};
    }
    const projection=p=>({along:(p.x-finalStart.x)*finalLine.x+(p.z-finalStart.z)*finalLine.z,
      cross:Math.abs((p.x-finalStart.x)*finalLine.z-(p.z-finalStart.z)*finalLine.x)});
    const from=projection(lane.from),to=projection(lane.to),length=Math.hypot(lane.to.x-lane.from.x,lane.to.z-lane.from.z);
    const entryMargin=from.along,exitRunout=finalLength-to.along;
    if(length<(COURSE_CRITERIA.abMinimumLengths[difficultyId]??200)-EPSILON)laneErrors.push('is shorter than the AB minimum');
    if(from.cross>EPSILON||to.cross>EPSILON||to.along<=from.along||to.along>finalLength+EPSILON)
      laneErrors.push('must follow the final target-to-exit straight in the forward direction');
    if(entryMargin<COURSE_CRITERIA.abMinimumEntryMargin-EPSILON)laneErrors.push('needs at least 80 m to line up after the final TGT');
    if(exitRunout<COURSE_CRITERIA.abMinimumExitRunout-EPSILON)laneErrors.push('needs at least 35 m before EXIT');
    for(const p of [lane.from,lane.to]){
      if(Math.abs(p.x)>limits.horizontal||Math.abs(p.z)>limits.horizontal||p.y<limits.minHeight||p.y>limits.maxHeight)
        laneErrors.push('is outside course bounds');
      const t=projection(p).along/finalLength,expectedHeight=finalStart.y+(points.at(-1).y-finalStart.y)*t;
      if(Math.abs(p.y-expectedHeight)>EPSILON)laneErrors.push('height must follow the final straight');
    }
    return {id:lane.id,length,width:lane.width,heightTolerance:lane.heightTolerance,entryMargin,exitRunout,
      finalApproach:true,followingTurnDegrees:0,valid:laneErrors.length===0,errors:laneErrors};
  });
  result.abStraightsValid=(id==='legacy'&&lanes.length===0)||(result.abStraights.length>0&&result.abStraights.every(lane=>lane.valid));
  if(!result.abStraightsValid){
    if(!lanes.length)errors.push(`${difficultyId} needs a marked AB straight`);
    for(const lane of result.abStraights)for(const error of lane.errors)errors.push(`AB ${lane.id} ${error}`);
  }
  result.initialHeadingChangeDegrees=degrees(Math.atan2(lines[0].x,-lines[0].z));
  const initialHeadingValid=Math.abs(result.initialHeadingChangeDegrees)<=EPSILON;
  if(!initialHeadingValid)errors.push('the first line must follow the initial north (-z) heading');
  result.turns=lines.slice(1).map((outgoing,i)=>{
    const incoming=lines[i],signed=Math.atan2(incoming.x*outgoing.z-incoming.z*outgoing.x,
      incoming.x*outgoing.x+incoming.z*outgoing.z),angle=Math.abs(signed),turnDegrees=degrees(angle);
    const reverses=Math.PI-angle<=EPSILON,straight=angle<=EPSILON;
    const chord=Math.hypot(points[i+2].x-points[i].x,points[i+2].z-points[i].z);
    const circumradius=reverses?0:straight?Infinity:chord/(2*Math.sin(angle));
    const utilizations=Object.fromEntries(COURSE_CRITERIA.speeds.map(speed=>[speed,
      reverses?Infinity:straight?0:result.turnRadii[speed]/circumradius]));
    const significant=turnDegrees>=COURSE_CRITERIA.minimumTurnDegrees-EPSILON;
    const utilization20=utilizations[COURSE_CRITERIA.difficultySpeed];
    const upperValid=Object.values(utilizations).every(u=>Number.isFinite(u)&&u<=COURSE_CRITERIA.maximumUtilization+EPSILON);
    // Only the last turn's LOWER difficulty bound is waived when it joins a
    // validated long AB approach. Its upper difficulty and physical limits stay.
    const abApproachTransition=i===lines.length-2&&id!=='legacy'&&result.abStraightsValid;
    const lowerBandExempt=abApproachTransition;
    const bandValid=!significant||((lowerBandExempt||utilization20>=criteria.utilizationBand[0]-EPSILON)&&utilization20<=criteria.utilizationBand[1]+EPSILON);
    if(reverses)errors.push(`${names[i+1]} reverses direction instead of following a course curve`);
    else if(!upperValid)errors.push(`${names[i+1]} exceeds the turn limit at a reference speed`);
    if(significant&&!bandValid)errors.push(`${names[i+1]} is outside the ${difficultyId} utilization band at 20 m/s`);
    return {at:names[i+1],signedTurnDegrees:degrees(signed),turnDegrees,circumradius,utilizations,
      utilization10:utilizations[10],utilization20,significant,upperValid,bandValid,lowerBandExempt,abApproachTransition,
      difficultyQualifying:significant&&utilization20>=criteria.utilizationBand[0]-EPSILON&&bandValid&&upperValid,
      valid:!reverses&&upperValid&&bandValid};
  });
  result.segments=lines.map((line,i)=>{
    const heightChange=points[i+1].y-points[i].y,distance=Math.hypot(line.horizontalDistance,heightChange);
    const heightValid=Math.abs(heightChange)<=limits.heightChange+EPSILON;
    if(!heightValid)errors.push(`${names[i]} -> ${names[i+1]} changes height by more than ${limits.heightChange} m`);
    result.length+=distance;if(heightChange>EPSILON)result.hasAscent=true;if(heightChange< -EPSILON)result.hasDescent=true;
    return {from:names[i],to:names[i+1],horizontalDistance:line.horizontalDistance,distance,heightChange,heightValid,
      valid:heightValid&&(i!==0||initialHeadingValid)&&(result.turns[i-1]?.valid??true)&&(result.turns[i]?.valid??true)};
  });
  result.significantTurnCount=result.turns.filter(t=>t.significant).length;
  result.qualifyingTurnCount=result.turns.filter(t=>t.difficultyQualifying).length;
  if(result.qualifyingTurnCount<criteria.minSignificantTurns)
    errors.push(`${difficultyId} needs at least ${criteria.minSignificantTurns} qualifying 45-degree turns`);
  if(!result.hasAscent||!result.hasDescent)errors.push('course must contain both ascent and descent');
  result.cruiseTimeSeconds=result.length/COURSE_CRITERIA.cruiseSpeed;
  if(result.cruiseTimeSeconds<criteria.cruiseTimeRange[0]-EPSILON||result.cruiseTimeSeconds>criteria.cruiseTimeRange[1]+EPSILON)
    errors.push(`${difficultyId} cruise time is outside ${criteria.cruiseTimeRange.join('..')} seconds`);
  result.valid=errors.length===0;return result;
}
