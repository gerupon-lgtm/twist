import {COURSES,LEGACY_COURSE,COURSE_CRITERIA,getCourse as normalCourse,normalizeCourseId as normalizeNormalCourseId} from './course.js';
import {SUPERSONIC_COURSE} from './supersonic/course.js';
import {SIERRA_COURSE,SIERRA_COURSE_ID} from './courses/sierra50.js';
import {SIERRA10_COURSE,SIERRA10_COURSE_ID} from './courses/sierra10.js';

export {COURSE_CRITERIA};
export const NORMAL_COURSE_IDS=Object.freeze(Object.keys(COURSES));
export const ORDINARY_COURSE_IDS=Object.freeze([...NORMAL_COURSE_IDS,SIERRA_COURSE_ID]);
export const PLAYABLE_COURSE_IDS=Object.freeze([...NORMAL_COURSE_IDS,'supersonic',SIERRA_COURSE_ID,SIERRA10_COURSE_ID]);
export function normalizeCourseId(id){return id==='supersonic'||id===SIERRA_COURSE_ID||id===SIERRA10_COURSE_ID?id:normalizeNormalCourseId(id);}
export function getCourse(id){return id===SIERRA10_COURSE_ID?SIERRA10_COURSE:id==='supersonic'?SUPERSONIC_COURSE:id===SIERRA_COURSE_ID?SIERRA_COURSE:normalCourse(id);}
export function isSupersonicCourse(course){return course?.id==='supersonic'||course?.id===SIERRA10_COURSE_ID;}
export const COMPARISON_COURSE=LEGACY_COURSE;
