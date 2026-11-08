// Shared flat surface; geographic elevations currently describe gates only.
export const FLAT_COURSE_SURFACE=Object.freeze({kind:'flat',heightAt(x,z){if(!Number.isFinite(x)||!Number.isFinite(z))throw new TypeError('Finite surface coordinates required');return 0;}});
export function createCourseSurface(){return FLAT_COURSE_SURFACE;}
/** ALT remains world y; only physical clearance subtracts the surface height. */
export function courseGroundClearance(surface,position){return position.y-surface.heightAt(position.x,position.z);}
