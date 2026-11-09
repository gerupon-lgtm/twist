import {FLAT_COURSE_SURFACE} from '../course-surface.js';
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const point=(x,y,z)=>({x,y,z});
const finitePoint=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
const radians=degrees=>degrees*Math.PI/180;
export const SIERRA_COURSE_ID='sierra50';
export const SIERRA_SOURCE_POINTS=freeze([
 {name:'A',latitude:35.7533,longitude:-118.4233,estimatedElevation:790},
 {name:'B',latitude:35.9817,longitude:-118.4733,estimatedElevation:1160},
 {name:'C',latitude:36.1417,longitude:-118.0617,estimatedElevation:1130},
 {name:'D',latitude:36.4383,longitude:-117.9000,estimatedElevation:1100},
 {name:'E',latitude:36.7117,longitude:-117.8183,estimatedElevation:1220},
 {name:'F',latitude:36.9383,longitude:-117.5133,estimatedElevation:1580},
 {name:'G',latitude:37.1350,longitude:-117.6533,estimatedElevation:910},
]);
export const SIERRA_TRANSFORM=freeze({id:'sierra-estimate-equirectangular-v1',earthRadius:6371000,
 horizontalDivisor:50,verticalExaggeration:2,gateHeightOffset:10,roundDecimals:1,
 axisConvention:'east+x,north-z',sourceKind:'user-provided-estimates-unverified'});

/** Reproduce supplied coordinates; this is not a DEM or surveyed terrain. */
export function projectSierraCoordinates(source=SIERRA_SOURCE_POINTS,options={}){
 if(!Array.isArray(source)||source.length<2||source.some(p=>!p||typeof p.name!=='string'||!p.name||![p.latitude,p.longitude,p.estimatedElevation].every(Number.isFinite)||Math.abs(p.latitude)>90||Math.abs(p.longitude)>180)||new Set(source.map(p=>p.name)).size!==source.length)throw new TypeError('Finite distinct named geographic points required');
 if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Projection options must be an object');
 const parameters={...SIERRA_TRANSFORM,...options};
 if(![parameters.earthRadius,parameters.horizontalDivisor,parameters.verticalExaggeration].every(v=>Number.isFinite(v)&&v>0)||!Number.isFinite(parameters.gateHeightOffset)||!Number.isInteger(parameters.roundDecimals)||parameters.roundDecimals<0||parameters.roundDecimals>6)throw new TypeError('Finite positive projection scales required');
 const reference=source[0],heightDatum=Math.min(...source.map(p=>p.estimatedElevation));
 const raw=source.map(p=>({x:parameters.earthRadius*radians(p.longitude-reference.longitude)*Math.cos(radians(reference.latitude))/parameters.horizontalDivisor,
  y:(p.estimatedElevation-heightDatum)*parameters.verticalExaggeration/parameters.horizontalDivisor+parameters.gateHeightOffset,
  z:-parameters.earthRadius*radians(p.latitude-reference.latitude)/parameters.horizontalDivisor}));
 const center={x:(Math.min(...raw.map(p=>p.x))+Math.max(...raw.map(p=>p.x)))/2,z:(Math.min(...raw.map(p=>p.z))+Math.max(...raw.map(p=>p.z)))/2};
 const round=value=>Number(value.toFixed(parameters.roundDecimals));
 return freeze({parameters:{...parameters,heightDatum,reference:{latitude:reference.latitude,longitude:reference.longitude},center},
  points:source.map((p,i)=>{const rawPosition=point(raw[i].x-center.x,raw[i].y,raw[i].z-center.z);return {name:p.name,source:{...p},rawPosition,position:point(round(rawPosition.x),round(rawPosition.y),round(rawPosition.z))};})});
}

export const SIERRA_PROJECTION=projectSierraCoordinates();
/** Flat surface only; estimated elevations change gate heights, not terrain. */
export const sierraGroundHeightAt=FLAT_COURSE_SURFACE.heightAt;
export const SIERRA_WORLD_PROFILE=freeze({id:'sierra50-flat-v1',halfExtent:1850,
 bounds:{minX:-1850,maxX:1850,minZ:-1850,maxZ:1850},minFlightHeight:0,minExploreHeight:2,maxHeight:70,
 camera:{near:.1,far:5000},fog:{near:1200,far:5000},
 surface:{kind:'flat',heightAt:sierraGroundHeightAt},
 radar:{candidateEffectiveRange:1000,writeSavedValue:false}});
export function getSierraWorldProfile(course){return course?.id===SIERRA_COURSE_ID?SIERRA_WORLD_PROFILE:null;}

const positions=SIERRA_PROJECTION.points.map(row=>row.position),[A,B]=positions;
const dx=B.x-A.x,dz=B.z-A.z,firstLength=Math.hypot(dx,dz);
const start=point(A.x-150*dx/firstLength,A.y,A.z-150*dz/firstLength);
const F=positions[5],G=positions[6],finalLength=Math.hypot(G.x-F.x,G.z-F.z);
const atFinal=distance=>point(F.x+(G.x-F.x)*distance/finalLength,F.y+(G.y-F.y)*distance/finalLength,F.z+(G.z-F.z)*distance/finalLength);

/** Ordinary physics; no new speed, force or collection-radius override. */
export const SIERRA_COURSE=freeze({id:SIERRA_COURSE_ID,name:'シエラ縦断（1/50）',category:'geographic-estimate',
 start,startHeading:Math.atan2(dx,-dz),lights:positions.slice(0,6).map(p=>({...p})),exit:{...G},
 pointNames:SIERRA_SOURCE_POINTS.map(p=>p.name),sourcePoints:SIERRA_SOURCE_POINTS,coordinateTransform:SIERRA_PROJECTION.parameters,
 arena:{id:'sierra50',bounds:{...SIERRA_WORLD_PROFILE.bounds},minHeight:0,maxHeight:70,
  landmarks:positions.map((p,i)=>({id:'sierra-'+SIERRA_SOURCE_POINTS[i].name,kind:'point-flag',label:SIERRA_SOURCE_POINTS[i].name,position:{...p}}))},
 // Candidate only: 120 m to align after F, 80 m to coast before G. Real input
 // flight and AB-on/off comparison must decide whether it can be adopted.
 abStraights:[{id:'sierra50-final',from:atFinal(120),to:atFinal(finalLength-80),width:24,heightTolerance:12,
  sourceEdge:{from:'F',to:'G'},candidate:true}],
});

/** One common optional metadata seam for stage, HUD, preview and recording. */
export function sierraPointMetadata(course,targetIndex){
 if(![SIERRA_COURSE_ID,'sierra10'].includes(course?.id)||!Number.isInteger(targetIndex)||targetIndex<0||targetIndex>6)return null;
 const exit=targetIndex===6,pointName=course.pointNames?.[targetIndex];if(typeof pointName!=='string')return null;
 return freeze({pointName,kind:exit?'exit':'target',number:exit?null:targetIndex+1,label:exit?`EXIT · ${pointName}`:`TGT ${targetIndex+1} · ${pointName}`});
}
export function sierraRouteEdges(course=SIERRA_COURSE){
 const route=[course.start,...course.lights,course.exit];if(route.length!==8||!route.every(finitePoint))throw new TypeError('Sierra needs start plus A..G');
 return freeze(route.slice(1).map((to,index)=>({index,fromName:index===0?'START':course.pointNames[index-1],toName:course.pointNames[index],from:{...route[index]},to:{...to}})));
}
/** Add display labels while preserving timing IDs, seconds and nulls. */
export function withSierraSegmentLabels(rows,course=SIERRA_COURSE){
 if(![SIERRA_COURSE_ID,'sierra10'].includes(course?.id))return rows;
 if(!Array.isArray(rows)||rows.length!==7)throw new TypeError('Sierra timing needs seven existing segments');
 const edges=sierraRouteEdges(course);
 return rows.map((row,index)=>({...row,pointFrom:edges[index].fromName,pointTo:edges[index].toName,
  label:index===0?'開始→A':`${edges[index].fromName}→${edges[index].toName}`}));
}
