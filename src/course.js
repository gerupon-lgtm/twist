import {FLIGHT_TURN,flightTurnRadius} from './flight-turn.js';

const point=(x,y,z)=>Object.freeze({x,y,z});
const course=(id,name,start,lights,exit)=>Object.freeze({id,name,start:Object.freeze(start),
  lights:Object.freeze(lights.map(Object.freeze)),exit:Object.freeze(exit)});
/** The released short route remains an explicit comparison, not the default. */
export const LEGACY_COURSE=course('legacy','v0.1.25 比較用',point(0,14,26),[
  point(0,14,0),point(4,16,-34),point(4,18,-68),
],point(8,20,-96));
export const COURSE=LEGACY_COURSE;
export const DEFAULT_COURSE_ID='easy';
export const COURSES=Object.freeze({
  easy:course('easy','やさしい・おおきな半周',point(-125,22,160),[
    point(-125,24,120),point(-62.5,30,11.747),point(62.5,24,11.747),
  ],point(125,28,120)),
  normal:course('normal','ふつう・右から左へ',point(-140,22,240),[
    point(-140,24,170),point(-85,30,74.737),point(25,24,74.737),point(135,32,74.737),point(190,24,-20.526),
  ],point(135,30,-115.788)),
  hard:course('hard','むずかしい・二つのうず',point(-190,24,80),[
    point(-190,28,20),point(-147.5,38,-53.612),point(-62.5,28,-53.612),point(-20,38,20),
    point(-62.5,28,93.612),point(-105,38,167.224),point(-62.5,28,240.836),point(22.5,38,240.836),
  ],point(65,28,167.224)),
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
  difficulties:Object.freeze({easy:difficulty([3,4],[.3,.6],2,[30,45]),
    normal:difficulty([5,6],[.4,.8],3,[45,75]),hard:difficulty([7,8],[.6,.9],6,[60,90])}),
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
    hasAscent:false,hasDescent:false,errors};
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
    const bandValid=!significant||(utilization20>=criteria.utilizationBand[0]-EPSILON&&utilization20<=criteria.utilizationBand[1]+EPSILON);
    if(reverses)errors.push(`${names[i+1]} reverses direction instead of following a course curve`);
    else if(!upperValid)errors.push(`${names[i+1]} exceeds the turn limit at a reference speed`);
    if(significant&&!bandValid)errors.push(`${names[i+1]} is outside the ${difficultyId} utilization band at 20 m/s`);
    return {at:names[i+1],signedTurnDegrees:degrees(signed),turnDegrees,circumradius,utilizations,
      utilization10:utilizations[10],utilization20,significant,upperValid,bandValid,valid:!reverses&&upperValid&&bandValid};
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
  result.qualifyingTurnCount=result.turns.filter(t=>t.significant&&t.bandValid&&t.upperValid).length;
  if(result.qualifyingTurnCount<criteria.minSignificantTurns)
    errors.push(`${difficultyId} needs at least ${criteria.minSignificantTurns} qualifying 45-degree turns`);
  if(!result.hasAscent||!result.hasDescent)errors.push('course must contain both ascent and descent');
  result.cruiseTimeSeconds=result.length/COURSE_CRITERIA.cruiseSpeed;
  if(result.cruiseTimeSeconds<criteria.cruiseTimeRange[0]-EPSILON||result.cruiseTimeSeconds>criteria.cruiseTimeRange[1]+EPSILON)
    errors.push(`${difficultyId} cruise time is outside ${criteria.cruiseTimeRange.join('..')} seconds`);
  result.valid=errors.length===0;return result;
}
