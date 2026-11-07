import {getCourse,normalizeCourseId} from './course.js';

export const COURSE_STORAGE_KEY='twist.course.v1';
const validId=id=>typeof id==='string'&&normalizeCourseId(id)===id&&getCourse(id).id===id;

/** URL selection wins only when it is valid; loading never rewrites saved preferences. */
export function loadCourseChoice(storage,search='') {
  try{
    const query=typeof search==='string'?new URLSearchParams(search)
      :search instanceof URL?search.searchParams:search instanceof URLSearchParams?search:null;
    const requested=query?.get('course');
    if(validId(requested))return requested;
  }catch{/* A malformed query still permits an existing saved choice. */}
  try{const saved=storage?.getItem(COURSE_STORAGE_KEY);if(validId(saved))return saved;}
  catch{/* The default also works when browser storage is unavailable. */}
  return normalizeCourseId();
}

/** Invalid values do not overwrite an existing valid course choice. */
export function saveCourseChoice(storage,id) {
  if(!validId(id))return false;
  try{storage.setItem(COURSE_STORAGE_KEY,id);return true;}
  catch{return false;}
}
