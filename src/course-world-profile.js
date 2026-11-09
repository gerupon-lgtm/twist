// Optional course profile. Ordinary callers retain their existing defaults.
import {getSierraWorldProfile,SIERRA_COURSE_ID} from './courses/sierra50.js';
export const resolveCourseWorldProfile=getSierraWorldProfile;
export function courseRadarRange(course,savedRange){return course?.id==='sierra10'?5000:course?.id===SIERRA_COURSE_ID?1000:savedRange;}
export function courseStageDimensions(course){
 const p=resolveCourseWorldProfile(course);return p?{halfExtent:p.halfExtent,width:p.bounds.maxX-p.bounds.minX,depth:p.bounds.maxZ-p.bounds.minZ,minHeight:p.minFlightHeight,maxHeight:p.maxHeight,bounds:{...p.bounds}}:null;
}
export function courseRecordMetadata(course){return [SIERRA_COURSE_ID,'sierra10'].includes(course?.id)?{pointNames:[...course.pointNames],sourcePoints:course.sourcePoints.map(p=>({...p})),coordinateTransform:structuredClone(course.coordinateTransform),surface:'flat',estimatedGeography:true}:null;}
