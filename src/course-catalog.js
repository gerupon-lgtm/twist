import {COURSES,LEGACY_COURSE,COURSE_CRITERIA,getCourse as normalCourse,normalizeCourseId as normalizeNormalCourseId} from './course.js';
import {SUPERSONIC_COURSE} from './supersonic/course.js';

export {COURSE_CRITERIA};
export const NORMAL_COURSE_IDS=Object.freeze(Object.keys(COURSES));
export const PLAYABLE_COURSE_IDS=Object.freeze([...NORMAL_COURSE_IDS,'supersonic']);
export function normalizeCourseId(id){return id==='supersonic'?id:normalizeNormalCourseId(id);}
export function getCourse(id){return id==='supersonic'?SUPERSONIC_COURSE:normalCourse(id);}
export function isSupersonicCourse(course){return course?.id==='supersonic';}
export const COMPARISON_COURSE=LEGACY_COURSE;
