import {Quaternion,Vector3} from 'three';
const finiteVector=v=>v&&[v.x,v.y,v.z].every(Number.isFinite);
const rect=r=>r&&[r.left,r.right,r.top,r.bottom].every(Number.isFinite)&&r.left<r.right&&r.top<r.bottom;
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const DEG=180/Math.PI,wrap=degrees=>((degrees+180)%360+360)%360-180;
/** UI placement may reduce a command, never enlarge it or reverse its sign. */
export function guidanceDirectionAllowed(direction,advice){
  if(!finiteVector(direction)||!Math.hypot(direction.x,direction.y,direction.z)||!advice
    ||!['commandedYawDegrees','yawErrorDegrees','commandedClimbDegrees','climbErrorDegrees','minClimbDegrees','maxClimbDegrees']
      .every(k=>Number.isFinite(advice[k])))return false;
  const heading=Math.atan2(direction.x,-direction.z)*DEG;
  const climb=Math.atan2(direction.y,Math.hypot(direction.x,direction.z))*DEG;
  const currentHeading=advice.commandedYawDegrees-advice.yawErrorDegrees;
  const currentClimb=advice.commandedClimbDegrees-advice.climbErrorDegrees;
  const yaw=wrap(heading-currentHeading),change=climb-currentClimb,epsilon=1e-6;
  const yawLimit=advice.mode==='recover'&&advice.criticalRecovery!==false?0:Math.min(15,Math.abs(advice.yawErrorDegrees));
  const climbLimit=Math.min(10,Math.abs(advice.climbErrorDegrees));
  if(Math.abs(yaw)>yawLimit+epsilon||yaw*advice.yawErrorDegrees< -epsilon
    ||Math.abs(change)>climbLimit+epsilon||change*advice.climbErrorDegrees< -epsilon)return false;
  let low=advice.minClimbDegrees,high=advice.maxClimbDegrees;
  // Only the math's own recovery step may remain beyond its global range.
  if(advice.mode==='recover'){
    low=Math.min(low,advice.commandedClimbDegrees);high=Math.max(high,advice.commandedClimbDegrees);
  }
  return climb>=low-epsilon&&climb<=high+epsilon;
}
/** Nearest allowed yaw/climb; one invalid axis must not reset the other. */
export function clampGuidanceDirection(direction,advice){
  if(!finiteVector(direction)||!advice||!['commandedYawDegrees','yawErrorDegrees','commandedClimbDegrees',
    'climbErrorDegrees','minClimbDegrees','maxClimbDegrees'].every(key=>Number.isFinite(advice[key])))return null;
  const ray=(yaw,climb)=>({x:Math.sin(yaw/DEG)*Math.cos(climb/DEG),y:Math.sin(climb/DEG),z:-Math.cos(yaw/DEG)*Math.cos(climb/DEG)});
  if(advice.mode==='recover'&&advice.criticalRecovery!==false)return ray(advice.commandedYawDegrees,advice.commandedClimbDegrees);
  const currentYaw=advice.commandedYawDegrees-advice.yawErrorDegrees,currentClimb=advice.commandedClimbDegrees-advice.climbErrorDegrees;
  const yawStep=clamp(advice.yawErrorDegrees,-15,15),climbStep=clamp(advice.climbErrorDegrees,-10,10);
  let low=advice.minClimbDegrees,high=advice.maxClimbDegrees;
  if(advice.mode==='recover'){low=Math.min(low,advice.commandedClimbDegrees);high=Math.max(high,advice.commandedClimbDegrees);}
  low=Math.max(low,currentClimb+Math.min(0,climbStep));high=Math.min(high,currentClimb+Math.max(0,climbStep));
  if(low>high+1e-6)return null;
  const yaw=clamp(wrap(Math.atan2(direction.x,-direction.z)*DEG-currentYaw),Math.min(0,yawStep),Math.max(0,yawStep));
  const climb=clamp(Math.atan2(direction.y,Math.hypot(direction.x,direction.z))*DEG,low,high);
  return ray(currentYaw+yaw,climb);
}
export function guidanceSafeDirections(advice){
  if(!advice)return [];
  const points=[];
  for(const yawFraction of [0,.25,.5,.75,1])for(const climbFraction of [0,.25,.5,.75,1]){
    const yaw=(advice.commandedYawDegrees-advice.yawErrorDegrees*(1-yawFraction))/DEG;
    const climb=(advice.commandedClimbDegrees-advice.climbErrorDegrees*(1-climbFraction))/DEG;
    const ray={x:Math.sin(yaw)*Math.cos(climb),y:Math.sin(climb),z:-Math.cos(yaw)*Math.cos(climb)};
    if(guidanceDirectionAllowed(ray,advice))points.push(ray);
  }
  return points;
}
function quaternion(q){
  if(!q||![q.x,q.y,q.z,q.w].every(Number.isFinite))return null;
  const scale=Math.max(Math.abs(q.x),Math.abs(q.y),Math.abs(q.z),Math.abs(q.w));
  return scale?new Quaternion(q.x/scale,q.y/scale,q.z/scale,q.w/scale).normalize():null;
}

/** Exactly the renderer's world-root rotation followed by inverse camera pose. */
export function createGuidanceProjection(state,width,height){
  const fov=state?.fieldOfView?.vertical;
  if(![width,height,fov].every(Number.isFinite)||width<=0||height<=0||fov<=0||fov>=180)return null;
  const world=quaternion(state.worldQuaternion),camera=quaternion(state.cameraQuaternion??{x:0,y:0,z:0,w:1});
  if(!world||!camera)return null;
  const rotation=camera.invert().multiply(world).normalize(),inverse=rotation.clone().invert();
  const focal=height/2/Math.tan(fov*Math.PI/360);
  if(!Number.isFinite(focal)||focal<=0)return null;
  const projectLocal=local=>{
    const inFront=local.z< -1e-8;
    return {local:{x:local.x,y:local.y,z:local.z},inFront,
      x:inFront?width/2+focal*local.x/-local.z:null,
      y:inFront?height/2-focal*local.y/-local.z:null};
  };
  return {width,height,focal,rotation,
    projectDirection(direction){
      if(!finiteVector(direction)||!Math.hypot(direction.x,direction.y,direction.z))return null;
      return projectLocal(new Vector3(direction.x,direction.y,direction.z).applyQuaternion(rotation));
    },
    rayFromPixel(x,y){
      if(![x,y].every(Number.isFinite))return null;
      const v=new Vector3((x-width/2)/focal,-(y-height/2)/focal,-1).normalize().applyQuaternion(inverse);
      return {x:v.x,y:v.y,z:v.z};
    },
    target(){
      if(!finiteVector(state.targetLocal))return null;
      const projected=projectLocal(state.targetLocal);
      const inViewport=projected.inFront&&projected.x>=0&&projected.x<=width&&projected.y>=0&&projected.y<=height;
      const near=state.cameraClipping?.near??.1,far=state.cameraClipping?.far??250,depth=-state.targetLocal.z;
      const validClip=Number.isFinite(near)&&Number.isFinite(far)&&near>0&&far>near;
      return {...projected,inViewport,visible:inViewport&&validClip&&depth>=near&&depth<=far};
    },
  };
}

/** Closest available center; dimensions include the entire visible mark/label. */
export function placeGuidanceCenter(point,bounds,obstacles=[],{width=48,height=48,padding=5,accept=()=>true,candidates:extra=[]}={}){
  if(!point||![point.x,point.y,width,height,padding].every(Number.isFinite)||width<=0||height<=0||padding<0||!rect(bounds))return null;
  const halfW=width/2,halfH=height/2;
  const limits={left:bounds.left+halfW,right:bounds.right-halfW,top:bounds.top+halfH,bottom:bounds.bottom-halfH};
  if(limits.left>limits.right||limits.top>limits.bottom)return null;
  const blocked=obstacles.filter(rect);
  const fit=p=>accept(p)&&!blocked.some(r=>p.x+halfW>r.left-padding&&p.x-halfW<r.right+padding
    &&p.y+halfH>r.top-padding&&p.y-halfH<r.bottom+padding);
  const bound=p=>({x:clamp(p.x,limits.left,limits.right),y:clamp(p.y,limits.top,limits.bottom)});
  const initial=bound(point);
  if(fit(initial))return initial;
  const candidates=extra.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
  for(const r of blocked){
    const left=r.left-halfW-padding,right=r.right+halfW+padding;
    const top=r.top-halfH-padding,bottom=r.bottom+halfH+padding;
    candidates.push({x:left,y:initial.y},{x:right,y:initial.y},{x:initial.x,y:top},{x:initial.x,y:bottom},
      {x:left,y:top},{x:right,y:top},{x:left,y:bottom},{x:right,y:bottom});
  }
  for(const x of [limits.left,(limits.left+limits.right)/2,limits.right])for(const y of [limits.top,(limits.top+limits.bottom)/2,limits.bottom])candidates.push({x,y});
  const free=candidates.map(bound).filter(fit);
  free.sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y));
  return free[0]??null;
}
