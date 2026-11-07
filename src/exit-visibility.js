/**
 * Camera-local center: front is -Z, right +X, up +Y; verticalFov is in degrees.
 * width, height and playable bounds are CSS pixels. This tests the center only,
 * not the halo size or occlusion by scenery or other screen elements.
 */
export function exitCenterVisible(input) {
  const {target,verticalFov,width,height,bounds,near=.1,far=250}=input??{};
  if(!target||![target.x,target.y,target.z].every(Number.isFinite)
    ||!Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0
    ||!Number.isFinite(verticalFov)||verticalFov<=0||verticalFov>=180
    ||!bounds||![bounds.left,bounds.right,bounds.top,bounds.bottom].every(Number.isFinite)
    ||bounds.left>=bounds.right||bounds.top>=bounds.bottom
    ||!Number.isFinite(near)||near<=0||!Number.isFinite(far)||far<=near)return false;
  const depth=-target.z;
  if(depth<near||depth>far)return false;
  const focal=height/2/Math.tan(verticalFov*Math.PI/360);
  if(!Number.isFinite(focal))return false;
  const x=width/2+target.x/depth*focal,y=height/2-target.y/depth*focal;
  return Number.isFinite(x)&&Number.isFinite(y)
    &&x>=0&&x<=width&&y>=0&&y<=height
    &&x>=bounds.left&&x<=bounds.right&&y>=bounds.top&&y<=bounds.bottom;
}
