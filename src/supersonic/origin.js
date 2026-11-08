export const SUPERSONIC_ORIGIN_GRID=1024;
export const SUPERSONIC_ORIGIN_THRESHOLD=512;
const valid=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
const cleanZero=n=>n===0?0:n;
export const positiveModulo=(value,period)=>((value%period)+period)%period;

/** Authoritative world positions stay doubles. Only renderer copies are rebased. */
export function chooseRenderOrigin(position,previous=null){
  if(!valid(position))throw new TypeError('Render origin needs a finite world position');
  if(valid(previous)&&['x','y','z'].every(axis=>Math.abs(position[axis]-previous[axis])<=SUPERSONIC_ORIGIN_THRESHOLD))return previous;
  const origin=Object.fromEntries(['x','y','z'].map(axis=>[axis,cleanZero(Math.round(position[axis]/SUPERSONIC_ORIGIN_GRID)*SUPERSONIC_ORIGIN_GRID)]));
  return Object.freeze(origin);
}

/** Subtract BEFORE setMatrixAt/Float32Array upload, never after quantization. */
export function relativeToOrigin(position,origin,out={x:0,y:0,z:0}){
  if(!valid(position)||!valid(origin))throw new TypeError('Renderer positions must be finite');
  out.x=position.x-origin.x;out.y=position.y-origin.y;out.z=position.z-origin.z;return out;
}

export function surfacePhase(origin,period,timeSeconds=0,wind={x:0,z:0}){
  if(!valid(origin)||!Number.isFinite(period)||period<=0||!Number.isFinite(timeSeconds)||![wind.x,wind.z].every(Number.isFinite))throw new TypeError('Invalid sea phase');
  return {x:positiveModulo(origin.x+wind.x*timeSeconds,period)/period,z:positiveModulo(origin.z+wind.z*timeSeconds,period)/period};
}
