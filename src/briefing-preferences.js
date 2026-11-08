export const BRIEFING_STORAGE_KEY='twist.briefing.v1';
const MODES=new Set(['every','first','off']);
const validPoint=point=>point&&[point.x,point.y,point.z].every(Number.isFinite);

function courseKey(course){
  if(!course||typeof course.id!=='string'||!/^[a-z][a-z0-9-]{0,31}$/.test(course.id)||!Array.isArray(course.lights)
    ||![course.start,...course.lights,course.exit].every(validPoint))return null;
  const points=[course.start,...course.lights,course.exit].map(point=>[point.x,point.y,point.z]);
  let bounds;try{bounds=getCourseArena(course).bounds;}catch{return null;}
  const layout=JSON.stringify([course.id,points,Number.isFinite(course.startHeading)?course.startHeading:0,
    [bounds.minX,bounds.maxX,bounds.minZ,bounds.maxZ]]);
  let hash=2166136261;for(let i=0;i<layout.length;i++)hash=Math.imul(hash^layout.charCodeAt(i),16777619)>>>0;
  return `${course.id}:${hash.toString(16).padStart(8,'0')}`;
}

/** This dedicated store never reads or writes flight settings or best times. */
export function createBriefingPreferences(storage){
  let mode='every',seen=new Set();
  try{
    const saved=JSON.parse(storage?.getItem(BRIEFING_STORAGE_KEY));
    if(saved?.version===1){
      if(MODES.has(saved.mode))mode=saved.mode;
      if(Array.isArray(saved.seen))seen=new Set(saved.seen.filter(value=>typeof value==='string'&&/^[a-z][a-z0-9-]{0,31}:[0-9a-f]{8}$/.test(value)));
    }
  }catch{/* Memory-only preferences still work when local storage is unavailable. */}
  const save=()=>{try{storage?.setItem(BRIEFING_STORAGE_KEY,JSON.stringify({version:1,mode,seen:[...seen]}));return Boolean(storage?.setItem);}catch{return false;}};
  return {
    getMode:()=>mode,
    setMode(next){if(!MODES.has(next))return false;if(mode===next)return true;mode=next;save();return true;},
    shouldShow(course){const key=courseKey(course);return key!==null&&mode!=='off'&&(mode==='every'||!seen.has(key));},
    markShown(course){const key=courseKey(course);if(key===null)return false;if(!seen.has(key)){seen.add(key);save();}return true;},
  };
}
import {getCourseArena} from './arena.js';

