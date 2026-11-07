const finitePoint=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
/** The vertical band is necessary for collection; horizontal alignment is still required. */
export function targetHeightGuide(state={}) {
  const {position,targetPosition:target,targetRadius:radius,velocity}=state;
  if(!finitePoint(position)||!finitePoint(target)||!Number.isFinite(radius)||radius<=0||position.y<0||target.y<0)return null;
  const altitude=position.y,lower=Math.max(0,target.y-radius),upper=target.y+radius,delta=target.y-altitude;
  const inside=altitude>=lower&&altitude<=upper,direction=inside?'level':altitude<lower?'up':'down';
  const dx=target.x-position.x,dz=target.z-position.z,distance=Math.hypot(dx,dz);
  let arrivalSeconds=null,entrySeconds=null,urgent=false;
  if(finitePoint(velocity)) {
    const closing=distance>1e-6?(velocity.x*dx+velocity.z*dz)/distance:0;
    if(distance<=radius)arrivalSeconds=0;
    else if(closing>.2)arrivalSeconds=(distance-radius)/closing;
    const gap=direction==='up'?lower-altitude:altitude-upper,toward=direction==='up'?velocity.y:-velocity.y;
    entrySeconds=inside?0:toward>0?gap/toward:null;
    urgent=!inside&&arrivalSeconds!==null&&arrivalSeconds<=10&&(entrySeconds===null||entrySeconds>arrivalSeconds);
  }
  const scaleMin=Math.max(0,Math.floor(Math.min(altitude-10,lower-2)/5)*5);
  const scaleMax=Math.ceil(Math.max(altitude+10,upper+2,scaleMin+20)/5)*5;
  const y=value=>95-(value-scaleMin)/(scaleMax-scaleMin)*90;
  return {target:target.y,radius,lower,upper,altitude,delta,inside,direction,urgent,arrivalSeconds,entrySeconds,
    scale:{min:scaleMin,max:scaleMax,currentY:y(altitude),targetY:y(target.y),upperY:y(upper),lowerY:y(lower)}};
}
