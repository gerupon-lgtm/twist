import {FLIGHT_TURN,flightTurnRadius} from './flight-turn.js';
import {SIERRA_COURSE_ID,SIERRA_WORLD_PROFILE} from './courses/sierra50.js';
export const SIERRA_GEOMETRY_CRITERIA=Object.freeze({speeds:Object.freeze([10,20,45]),bankDegrees:30,
 turnGravity:FLIGHT_TURN.defaultGravity,maximumUtilization:1,maximumSlopeDegrees:5,
 minimumStraight:300,minimumEntryMargin:120,minimumExitRunout:80});
const EPS=1e-7,finitePoint=p=>p&&[p.x,p.y,p.z].every(Number.isFinite),degrees=r=>r*180/Math.PI;
const wrap=r=>Math.atan2(Math.sin(r),Math.cos(r));
const inside=p=>{const b=SIERRA_WORLD_PROFILE.bounds;return p.x>=b.minX&&p.x<=b.maxX&&p.z>=b.minZ&&p.z<=b.maxZ&&p.y>=0&&p.y<=70;};

/** A local geometry result is not a flight, rendering or device certificate. */
export function validateSierraGeometry(course,options={}){
 const errors=[],result={valid:false,geometryOnly:true,flightVerified:false,errors,segments:[],turns:[],abStraights:[],routeLength:0,totalLength:0};
 if(!options||typeof options!=='object'||Array.isArray(options)){errors.push('options must be an object');return result;}
 const bankDegrees=options.bankDegrees??SIERRA_GEOMETRY_CRITERIA.bankDegrees,turnGravity=options.turnGravity??SIERRA_GEOMETRY_CRITERIA.turnGravity;
 if(!Number.isFinite(bankDegrees)||bankDegrees<=0||bankDegrees>=90||!Number.isFinite(turnGravity)||turnGravity<FLIGHT_TURN.minGravity||turnGravity>FLIGHT_TURN.maxGravity){errors.push('unsupported bank or turn gravity');return result;}
 if(course?.id!==SIERRA_COURSE_ID||!Array.isArray(course.lights)||course.lights.length!==6||JSON.stringify(course.pointNames)!==JSON.stringify(['A','B','C','D','E','F','G'])){errors.push('Sierra must have A..F targets and G EXIT');return result;}
 const points=[course.start,...course.lights,course.exit],names=['START',...course.pointNames];
 if(!points.every(finitePoint)){errors.push('finite start and A..G points required');return result;}
 points.forEach((p,i)=>{if(!inside(p))errors.push(names[i]+' outside Sierra-only bounds/height');});
 if(!Number.isFinite(course.startHeading)){errors.push('finite initial heading required');return result;}
 const lines=points.slice(1).map((to,i)=>{const from=points[i],dx=to.x-from.x,dz=to.z-from.z,dy=to.y-from.y,length=Math.hypot(dx,dz);return {dx,dz,dy,length,distance:Math.hypot(length,dy),heading:Math.atan2(dx,-dz)};});
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)if(Math.hypot(points[j].x-points[i].x,points[j].z-points[i].z)<=EPS)errors.push('duplicate or vertical-only point');
 if(lines.some(line=>line.length<=EPS)){errors.push('positive horizontal segments required');return result;}
 if(Math.abs(lines[0].length-150)>EPS||Math.abs(points[0].y-points[1].y)>EPS||Math.abs(wrap(lines[0].heading-lines[1].heading))>EPS||Math.abs(wrap(lines[0].heading-course.startHeading))>EPS)errors.push('start must be 150 m before A on the A-to-B heading');
 result.segments=lines.map((line,i)=>{const slopeDegrees=degrees(Math.atan2(line.dy,line.length));if(Math.abs(slopeDegrees)>SIERRA_GEOMETRY_CRITERIA.maximumSlopeDegrees)errors.push(names[i]+' -> '+names[i+1]+' exceeds candidate slope limit');result.totalLength+=line.distance;if(i>0)result.routeLength+=line.distance;return {from:names[i],to:names[i+1],horizontalDistance:line.length,distance:line.distance,heightChange:line.dy,slopeDegrees};});
 const radii=Object.fromEntries(SIERRA_GEOMETRY_CRITERIA.speeds.map(speed=>[speed,flightTurnRadius(speed,bankDegrees*Math.PI/180,turnGravity)]));result.turnRadii=radii;
 result.turns=lines.slice(1).map((line,i)=>{const turn=wrap(line.heading-lines[i].heading),angle=Math.abs(turn),straight=angle<=EPS,reverses=Math.PI-angle<=EPS,chord=Math.hypot(points[i+2].x-points[i].x,points[i+2].z-points[i].z),radius=straight?null:reverses?0:chord/(2*Math.sin(angle));
  const utilizations=Object.fromEntries(SIERRA_GEOMETRY_CRITERIA.speeds.map(speed=>[speed,straight?0:radius>0?radii[speed]/radius:Number.MAX_VALUE])),valid=!reverses&&Object.values(utilizations).every(value=>Number.isFinite(value)&&value<=1+EPS);
  if(!valid)errors.push(names[i+1]+' exceeds the physical turn limit');return {at:names[i+1],signedTurnDegrees:degrees(turn),circumradius:radius,utilizations,valid};});
 result.hasLongStraight=lines.slice(1).some(line=>line.length>=SIERRA_GEOMETRY_CRITERIA.minimumStraight);if(!result.hasLongStraight)errors.push('at least one 300 m geographic straight required');
 const F=points.at(-2),G=points.at(-1),line=lines.at(-1),ux=line.dx/line.length,uz=line.dz/line.length;
 const project=p=>({along:(p.x-F.x)*ux+(p.z-F.z)*uz,cross:Math.abs((p.x-F.x)*uz-(p.z-F.z)*ux)});
 if(!Array.isArray(course.abStraights)||course.abStraights.length!==1)errors.push('one explicit final AB candidate required');
 else result.abStraights=course.abStraights.map(lane=>{const laneErrors=[];if(!finitePoint(lane.from)||!finitePoint(lane.to)||!Number.isFinite(lane.width)||lane.width<=0||!Number.isFinite(lane.heightTolerance)||lane.heightTolerance<=0){errors.push('invalid AB endpoints/width');return {valid:false};}
  const from=project(lane.from),to=project(lane.to),length=to.along-from.along,exitRunout=line.length-to.along;
  if(from.cross>EPS||to.cross>EPS||length<=0||to.along>line.length+EPS)laneErrors.push('must follow F to G in forward order');
  if(length<300-EPS||from.along<120-EPS||exitRunout<80-EPS)laneErrors.push('needs 300 m lane, 120 m entry, 80 m runout');
  for(const p of [lane.from,lane.to])if(!inside(p)||Math.abs(p.y-(F.y+(G.y-F.y)*project(p).along/line.length))>EPS)laneErrors.push('lane position/height must follow the route');
  errors.push(...laneErrors);return {valid:laneErrors.length===0,length,entryMargin:from.along,exitRunout,errors:laneErrors};});
 result.valid=errors.length===0;return result;
}
