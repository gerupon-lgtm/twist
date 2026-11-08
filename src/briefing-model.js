import {getCourseArena} from './arena.js';
import {sierraPointMetadata} from './courses/sierra50.js';

export const BRIEFING_DRAW_SECONDS=3.6;
const finitePoint=point=>point&&[point.x,point.y,point.z].every(Number.isFinite);
const point=value=>Object.freeze({x:value.x,y:value.y,z:value.z});
const wrap=value=>Math.atan2(Math.sin(value),Math.cos(value));
const escape=value=>String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[character]));
const number=value=>Number(value.toFixed(3));

export function briefingProgress(seconds){
  if(!Number.isFinite(seconds)||seconds<=0)return 0;
  return seconds>=BRIEFING_DRAW_SECONDS-1e-9?1:seconds/BRIEFING_DRAW_SECONDS;
}

/** All positions remain real world metres; camera/view settings play no part. */
export function createBriefingModel(course,{state=null,arena=getCourseArena(course)}={}){
  arena=getCourseArena({arena});
  if(!course||!Array.isArray(course.lights)||![course.start,...course.lights,course.exit].every(finitePoint))
    throw new TypeError('Briefing needs a course with finite start, target and exit points');
  const heading=Number.isFinite(course.startHeading)?course.startHeading:0;
  const collected=Number.isInteger(state?.collected)?Math.max(0,Math.min(course.lights.length,state.collected)):0;
  const targets=course.lights.map((position,index)=>Object.freeze({id:`tgt-${index+1}`,kind:'target',number:index+1,
    ...(sierraPointMetadata(course,index)??{}),label:sierraPointMetadata(course,index)?.label??`TGT ${index+1}`,height:position.y,completed:index<collected,position:point(position)}));
  const start=Object.freeze({id:'start',kind:'start',label:'START',height:course.start.y,position:point(course.start)});
  const exit=Object.freeze({id:'exit',kind:'exit',...(sierraPointMetadata(course,course.lights.length)??{}),label:sierraPointMetadata(course,course.lights.length)?.label??'EXIT',height:course.exit.y,completed:state?.complete===true,position:point(course.exit)});
  const route=Object.freeze([start,...targets,exit]);
  const abStraights=Object.freeze((course.abStraights??[]).map((lane,index)=>{
    if(!finitePoint(lane.from)||!finitePoint(lane.to)||!Number.isFinite(lane.width)||lane.width<=0)
      throw new TypeError('Briefing AB lane needs finite endpoints and positive width');
    const dx=lane.to.x-lane.from.x,dz=lane.to.z-lane.from.z,length=Math.hypot(dx,dz);
    if(!length)throw new TypeError('Briefing AB lane needs distinct endpoints');
    const x=-dz/length*lane.width/2,z=dx/length*lane.width/2;
    const corners=Object.freeze([
      point({x:lane.from.x+x,y:lane.from.y,z:lane.from.z+z}),point({x:lane.to.x+x,y:lane.to.y,z:lane.to.z+z}),
      point({x:lane.to.x-x,y:lane.to.y,z:lane.to.z-z}),point({x:lane.from.x-x,y:lane.from.y,z:lane.from.z-z}),
    ]);
    return Object.freeze({id:String(lane.id??`ab-${index+1}`),from:point(lane.from),to:point(lane.to),width:lane.width,length,corners});
  }));
  const bounds=arena.bounds;
  const boundary=Object.freeze([[bounds.minX,bounds.minZ],[bounds.maxX,bounds.minZ],[bounds.maxX,bounds.maxZ],[bounds.minX,bounds.maxZ]]
    .map(([x,z])=>point({x,y:0,z})));
  const current=finitePoint(state?.position)?Object.freeze({id:'current',label:'YOU',position:point(state.position),
    heading:Number.isFinite(state.heading)?state.heading:heading,
    rotationDegrees:wrap((Number.isFinite(state.heading)?state.heading:heading)-heading)*180/Math.PI}):null;
  return Object.freeze({id:String(course.id??'course'),name:String(course.name??''),heading,arena,start,exit,
    targets:Object.freeze(targets),route,abStraights,boundary,current,
    north:Object.freeze({x:-Math.sin(heading),y:-Math.cos(heading)}),collected});
}

/** One common scale, never the radar's per-point edge clamp. */
export function fitBriefingMap(model,{width,height,padding=36,thumbnail=false,oblique=false}={}){
  if(!model||![width,height,padding].every(Number.isFinite)||width<=padding*2||height<=padding*2||padding<0)
    throw new TypeError('Briefing map needs positive drawable dimensions');
  const cosine=Math.cos(model.heading),sine=Math.sin(model.heading),origin=model.start.position;
  const rotate=(position,ground=false)=>{
    const x=position.x-origin.x,z=position.z-origin.z;
    const right=x*cosine+z*sine,forward=-x*sine+z*cosine;
    return oblique?{x:right+forward*.22,y:forward*.72-(ground?0:position.y)*.65}:{x:right,y:forward};
  };
  const positions=[...model.route.map(item=>item.position),...model.abStraights.flatMap(lane=>lane.corners),
    ...(thumbnail?[]:[...model.boundary,...model.arena.landmarks.map(item=>item.position),...(model.current?[model.current.position]:[])])];
  const rotated=positions.map(position=>rotate(position));
  if(oblique)rotated.push(...positions.map(position=>rotate(position,true)));
  const minX=Math.min(...rotated.map(item=>item.x)),maxX=Math.max(...rotated.map(item=>item.x));
  const minY=Math.min(...rotated.map(item=>item.y)),maxY=Math.max(...rotated.map(item=>item.y));
  const scale=Math.min((width-padding*2)/Math.max(1,maxX-minX),(height-padding*2)/Math.max(1,maxY-minY));
  const middleX=(minX+maxX)/2,middleY=(minY+maxY)/2;
  const project=position=>{const rotated=rotate(position);return {x:width/2+(rotated.x-middleX)*scale,y:height/2+(rotated.y-middleY)*scale};};
  const projectGround=position=>{const rotated=rotate(position,true);return {x:width/2+(rotated.x-middleX)*scale,y:height/2+(rotated.y-middleY)*scale};};
  const decorate=item=>({...item,...project(item.position)});
  const route=model.route.map(decorate);
  const path=route.map((item,index)=>`${index?'L':'M'}${number(item.x)} ${number(item.y)}`).join(' ');
  const maxScaleMetres=(Math.min(100,width*.25))/scale;
  const exponent=10**Math.floor(Math.log10(maxScaleMetres));
  const scaleMetres=[1,2,5,10].map(value=>value*exponent).filter(value=>value<=maxScaleMetres).at(-1)??exponent;
  const north=oblique?Math.atan2(model.north.x+model.north.y*.22,-model.north.y*.72)*180/Math.PI:-model.heading*180/Math.PI;
  return {width,height,padding,oblique,metresToPixels:scale,domain:{minX,maxX,minY,maxY},project,projectGround,route,path,
    boundary:model.boundary.map(project),targets:model.targets.map(decorate),start:decorate(model.start),exit:decorate(model.exit),
    landmarks:model.arena.landmarks.map(decorate),current:model.current?decorate(model.current):null,
    abStraights:model.abStraights.map(lane=>({...lane,from:project(lane.from),to:project(lane.to),corners:lane.corners.map(project)})),
    scale:{metres:scaleMetres,pixels:scaleMetres*scale,label:scaleMetres>=1000?`${number(scaleMetres/1000)}km`:`${number(scaleMetres)}m`},
    north:{...model.north,rotationDegrees:north}};
}

export function createCoursePreviewSVG(course,{width=160,height=92,featured=false}={}){
  const model=createBriefingModel(course),markerRadius=featured?10:3,routeWidth=featured?2.8:1.7,targetColor=featured?'#df4295':'#d69736';
  const map=fitBriefingMap(model,{width,height,padding:featured?Math.min(30,width/4,height/4):11,thumbnail:true,oblique:featured});
  const ground=featured?`<path d="${briefingGridPath(model,map)}" class="briefing-ground-grid"/>${map.route.map(item=>{const foot=map.projectGround(item.position);return `<ellipse cx="${number(foot.x)}" cy="${number(foot.y)}" rx="7" ry="2.5" class="briefing-ground-foot"/><path d="M${number(foot.x)} ${number(foot.y)}L${number(item.x)} ${number(item.y)}" class="briefing-height-stem"/>`;}).join('')}`:'';
  const lanes=map.abStraights.map(lane=>`<path d="M${lane.corners.map(p=>`${number(p.x)} ${number(p.y)}`).join('L')}Z" fill="#91c4c2" fill-opacity=".5"/>`).join('');
  const targets=map.targets.map(target=>`<circle cx="${number(target.x)}" cy="${number(target.y)}" r="${markerRadius}" fill="${featured?'#f7fbf9':targetColor}" stroke="${targetColor}" stroke-width="${featured?2.5:0}"/>${featured?`<text x="${number(target.x)}" y="${number(target.y+4)}" text-anchor="middle" class="briefing-preview-number">${escape(target.pointName??target.number)}</text>`:target.pointName?`<text x="${number(target.x+markerRadius+2)}" y="${number(target.y+2)}" font-size="7" fill="#25485a">${escape(target.pointName)}</text>`:''}`).join('');
  const start=featured?`<rect x="${number(map.start.x-3)}" y="${number(map.start.y-3)}" width="6" height="6" rx="1" fill="#117f97"/><text x="${number(map.start.x)}" y="${number(map.start.y+20)}" text-anchor="middle" class="briefing-preview-label">START</text>`:`<rect x="${number(map.start.x-2)}" y="${number(map.start.y-2)}" width="4" height="4" fill="#117f97"/>`;
  const exitSize=featured?7:3;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="briefing-preview" data-map-view="${featured?'oblique':'top'}" role="img" aria-label="${escape(course.name??course.id??'Course')} route"><title>${escape(course.name??course.id??'Course')} route</title>${ground}${lanes}<path d="${map.path}" class="briefing-preview-route" fill="none" stroke="#4d7180" stroke-width="${routeWidth}" stroke-linejoin="round"/>${targets}${start}<rect x="${number(map.exit.x-exitSize)}" y="${number(map.exit.y-exitSize)}" width="${exitSize*2}" height="${exitSize*2}" fill="#fff5cc" stroke="#b67e25" stroke-width="1.5"/>${featured?`<text x="${number(map.exit.x)}" y="${number(map.exit.y-16)}" text-anchor="middle" class="briefing-preview-label">${escape(map.exit.pointName?`EXIT · ${map.exit.pointName}`:'EXIT')}</text>`:map.exit.pointName?`<text x="${number(map.exit.x+5)}" y="${number(map.exit.y+2)}" font-size="7" fill="#25485a">${escape(map.exit.pointName)}</text>`:''}</svg>`;
}

/** A quiet ground grid from the same metre coordinates as the flight route. */
export function briefingGridPath(model,map){
  const points=model.route.map(item=>item.position),minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minZ=Math.min(...points.map(p=>p.z)),maxZ=Math.max(...points.map(p=>p.z));
  const span=Math.max(1,maxX-minX,maxZ-minZ),step=10**Math.floor(Math.log10(span/6));
  const spacing=step*Math.ceil(span/step/8),segments=[];
  const segment=(a,b)=>{const from=map.projectGround(a),to=map.projectGround(b);return `M${number(from.x)} ${number(from.y)}L${number(to.x)} ${number(to.y)}`;};
  for(let x=Math.ceil(minX/spacing)*spacing;x<=maxX;x+=spacing)segments.push(segment({x,z:minZ},{x,z:maxZ}));
  for(let z=Math.ceil(minZ/spacing)*spacing;z<=maxZ;z+=spacing)segments.push(segment({x:minX,z},{x:maxX,z}));
  return segments.join(' ');
}
