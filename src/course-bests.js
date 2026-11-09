import {courseFlightMetadata} from './course-flight-profile.js';
export const COURSE_BESTS_KEY='twist.course-bests.v1';
const point=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
export function courseBestKey(course,mode='flight'){
  if(!course||typeof course.id!=='string'||!/^[a-z][a-z0-9-]{0,31}$/.test(course.id)||!Array.isArray(course.lights)||![course.start,...course.lights,course.exit].every(point))return null;
  const geometry=[course.start,...course.lights,course.exit],profile=mode==='explore'?null:courseFlightMetadata(course);
  const text=JSON.stringify(profile?[...geometry,profile.id]:geometry);let hash=2166136261;
  for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619)>>>0;
  return `${mode==='explore'?'explore':'flight'}:${course.id}:${hash.toString(16).padStart(8,'0')}`;
}
const validRow=row=>row&&Number.isFinite(row.seconds)&&row.seconds>0&&typeof row.completedAt==='string';
export function createCourseBestStore(storage,{now=()=>new Date().toISOString()}={}){
  let records=Object.create(null);
  try{const value=JSON.parse(storage?.getItem(COURSE_BESTS_KEY));if(value?.version===1&&value.records&&typeof value.records==='object'&&!Array.isArray(value.records))for(const [key,row]of Object.entries(value.records))if(/^(flight|explore):[a-z][a-z0-9-]{0,31}:[0-9a-f]{8}$/.test(key)&&validRow(row))records[key]={seconds:row.seconds,completedAt:row.completedAt};}catch{}
  return {
    best(course,mode){const key=courseBestKey(course,mode);return key&&records[key]?records[key].seconds:null;},
    complete(course,mode,seconds){
      const key=courseBestKey(course,mode);if(!key||!Number.isFinite(seconds)||seconds<=0)return null;
      const previousBestSeconds=records[key]?.seconds??null,newBest=previousBestSeconds===null||seconds<previousBestSeconds;
      if(newBest)records[key]={seconds,completedAt:now()};
      let saved=true;try{if(!storage?.setItem)throw Error('Storage unavailable');storage.setItem(COURSE_BESTS_KEY,JSON.stringify({version:1,records}));}catch{saved=false;}
      return {courseId:course.id,courseKey:key,mode:mode==='explore'?'explore':'flight',seconds,bestSeconds:records[key].seconds,previousBestSeconds,newBest,saved};
    },
  };
}
export function formatCourseTime(seconds){
  if(!Number.isFinite(seconds)||seconds<0)return '—';
  const tenths=Math.round(seconds*10),minutes=Math.floor(tenths/600),rest=(tenths%600)/10;
  return `${minutes}:${rest.toFixed(1).padStart(4,'0')}`;
}
