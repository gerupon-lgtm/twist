import {projectSierraCoordinates,SIERRA_SOURCE_POINTS} from './sierra50.js';
import {FLAT_COURSE_SURFACE} from '../course-surface.js';
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const point=(x,y,z)=>({x,y,z});
export const SIERRA10_COURSE_ID='sierra10';
export const SIERRA10_PROJECTION=projectSierraCoordinates(SIERRA_SOURCE_POINTS,{horizontalDivisor:10,verticalExaggeration:1,gateHeightOffset:60,roundDecimals:0});
export const SIERRA10_FLIGHT_PROFILE=freeze({id:'sierra10-subsonic-v1',startSpeed:150,maxSpeed:300,maxAltitude:2000,
 // Full dry thrust balances drag at 250m/s; AB momentum coasts rather than disappearing.
 dryThrust:8*(250/340)**2,afterburnerThrust:20,presentationReferenceSpeed:300,validationSpeeds:[150,250,300],
 fuel:{capacity:100,startFuel:60,drainPerSecond:4,gateReward:12,lowAltitude:{maxClearance:160,minSpeed:100,perSecond:.75}},
 settings:{maxG:9,fuelMode:'gauge',pitchGain:.35,radarRange:5000}});
const positions=SIERRA10_PROJECTION.points.map(p=>p.position),[A,B]=positions,dx=B.x-A.x,dz=B.z-A.z,length=Math.hypot(dx,dz);
const start=point(A.x-1000*dx/length,A.y,A.z-1000*dz/length);
const gates=positions.map((center,index)=>{const from=index?positions[index-1]:start,dx=center.x-from.x,dz=center.z-from.z,d=Math.hypot(dx,dz),normal=point(-dx/d,0,-dz/d);
 return {id:`sierra10-${SIERRA_SOURCE_POINTS[index].name}`,index,number:index+1,pointName:SIERRA_SOURCE_POINTS[index].name,kind:index===6?'exit':'gate',center:{...center},radius:40,normal,right:point(normal.z,0,-normal.x),up:point(0,1,0)};});
const F=positions[5],G=positions[6],finalLength=Math.hypot(G.x-F.x,G.z-F.z),at=d=>point(F.x+(G.x-F.x)*d/finalLength,F.y+(G.y-F.y)*d/finalLength,F.z+(G.z-F.z)*d/finalLength);
export const SIERRA10_COURSE=freeze({id:SIERRA10_COURSE_ID,profile:'supersonic',category:'geographic-estimate',name:'シエラ縦断（1/10・亜音速）',choiceLabel:'シエラ縦断（1/10）',choiceDetail:'亜音速',targetCount:6,
 start,startHeading:Math.atan2(dx,-dz),gates,lights:positions.slice(0,6).map(p=>({...p})),exit:{...G},pointNames:SIERRA_SOURCE_POINTS.map(p=>p.name),sourcePoints:SIERRA_SOURCE_POINTS,coordinateTransform:SIERRA10_PROJECTION.parameters,
 flightProfile:SIERRA10_FLIGHT_PROFILE,surface:FLAT_COURSE_SURFACE,
 arena:{id:'sierra10',halfExtent:10000,width:20000,depth:20000,seaLevel:0,maxAltitude:2000,minHeight:0,maxHeight:2000,bounds:{minX:-10000,maxX:10000,minZ:-10000,maxZ:10000},
  landmarks:positions.map((p,i)=>({id:'sierra10-'+SIERRA_SOURCE_POINTS[i].name,kind:'point-flag',label:SIERRA_SOURCE_POINTS[i].name,position:{...p}}))},
 abStraights:[{id:'sierra10-final',from:at(250),to:at(finalLength-150),width:160,heightTolerance:80,sourceEdge:{from:'F',to:'G'}}]});
