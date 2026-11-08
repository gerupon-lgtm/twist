import {getCourseArena} from './arena.js';

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
    label:`TGT ${index+1}`,height:position.y,completed:index<collected,position:point(position)}));
  const start=Object.freeze({id:'start',kind:'start',label:'START',height:course.start.y,position:point(course.start)});
  const exit=Object.freeze({id:'exit',kind:'exit',label:'EXIT',height:course.exit.y,completed:state?.complete===true,position:point(course.exit)});
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
export function fitBriefingMap(model,{width,height,padding=36,thumbnail=false}={}){
  if(!model||![width,height,padding].every(Number.isFinite)||width<=padding*2||height<=padding*2||padding<0)
    throw new TypeError('Briefing map needs positive drawable dimensions');
  const cosine=Math.cos(model.heading),sine=Math.sin(model.heading),origin=model.start.position;
  const rotate=position=>{
    const x=position.x-origin.x,z=position.z-origin.z;
    return {x:x*cosine+z*sine,y:-x*sine+z*cosine};
  };
  const positions=[...model.route.map(item=>item.position),...model.abStraights.flatMap(lane=>lane.corners),
    ...(thumbnail?[]:[...model.boundary,...model.arena.landmarks.map(item=>item.position),...(model.current?[model.current.position]:[])])];
  const rotated=positions.map(rotate);
  const minX=Math.min(...rotated.map(item=>item.x)),maxX=Math.max(...rotated.map(item=>item.x));
  const minY=Math.min(...rotated.map(item=>item.y)),maxY=Math.max(...rotated.map(item=>item.y));
  const scale=Math.min((width-padding*2)/Math.max(1,maxX-minX),(height-padding*2)/Math.max(1,maxY-minY));
  const middleX=(minX+maxX)/2,middleY=(minY+maxY)/2;
  const project=position=>{const rotated=rotate(position);return {x:width/2+(rotated.x-middleX)*scale,y:height/2+(rotated.y-middleY)*scale};};
  const decorate=item=>({...item,...project(item.position)});
  const route=model.route.map(decorate);
  const path=route.map((item,index)=>`${index?'L':'M'}${number(item.x)} ${number(item.y)}`).join(' ');
  const maxScaleMetres=(Math.min(100,width*.25))/scale;
  const exponent=10**Math.floor(Math.log10(maxScaleMetres));
  const scaleMetres=[1,2,5,10].map(value=>value*exponent).filter(value=>value<=maxScaleMetres).at(-1)??exponent;
  return {width,height,padding,metresToPixels:scale,domain:{minX,maxX,minY,maxY},project,route,path,
    boundary:model.boundary.map(project),targets:model.targets.map(decorate),start:decorate(model.start),exit:decorate(model.exit),
    landmarks:model.arena.landmarks.map(decorate),current:model.current?decorate(model.current):null,
    abStraights:model.abStraights.map(lane=>({...lane,from:project(lane.from),to:project(lane.to),corners:lane.corners.map(project)})),
    scale:{metres:scaleMetres,pixels:scaleMetres*scale,label:scaleMetres>=1000?`${number(scaleMetres/1000)}km`:`${number(scaleMetres)}m`},
    north:{...model.north,rotationDegrees:-model.heading*180/Math.PI}};
}

export function createCoursePreviewSVG(course,{width=160,height=92,featured=false}={}){
  const markerRadius=featured?5:3,routeWidth=featured?2.2:1.7,targetColor=featured?'#df4295':'#d69736';
  const map=fitBriefingMap(createBriefingModel(course),{width,height,padding:featured?14:11,thumbnail:true});
  const lanes=map.abStraights.map(lane=>`<path d="M${lane.corners.map(p=>`${number(p.x)} ${number(p.y)}`).join('L')}Z" fill="#91c4c2" fill-opacity=".5"/>`).join('');
  const targets=map.targets.map(target=>`<circle cx="${number(target.x)}" cy="${number(target.y)}" r="${markerRadius}" fill="${targetColor}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="briefing-preview" role="img" aria-label="${escape(course.name??course.id??'Course')} route"><title>${escape(course.name??course.id??'Course')} route</title>${lanes}<path d="${map.path}" fill="none" stroke="#4d7180" stroke-width="${routeWidth}" stroke-linejoin="round"/>${targets}<path d="M${number(map.start.x)} ${number(map.start.y-5)}l4 8-4-2-4 2Z" fill="#117f97"/><rect x="${number(map.exit.x-3)}" y="${number(map.exit.y-3)}" width="6" height="6" fill="#fff5cc" stroke="#b67e25" stroke-width="1.5"/></svg>`;
}
