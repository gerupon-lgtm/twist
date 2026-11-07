import {flightTurnRadius,normalizeTurnGravity} from './flight-turn.js';

export const STAGE_HALF_EXTENT=350;
const clamp=(n,low,high)=>Math.min(high,Math.max(low,n));
const wrap=degrees=>((degrees+180)%360+360)%360-180;
/** A square visual arena warning only: never changes position or motion. */
export function stageBoundaryStatus(position,options={}){
  if(!position||![position.x,position.z].every(Number.isFinite)||!options||typeof options!=='object')return null;
  const {halfExtent=STAGE_HALF_EXTENT}=options;
  if(!Number.isFinite(halfExtent)||halfExtent<=0)return null;
  const heading=Number.isFinite(options.heading)?options.heading%(Math.PI*2):0;
  const speed=Number.isFinite(options.speed)?Math.max(0,options.speed):0;
  const turnGravity=normalizeTurnGravity(options.turnGravity);
  const maxBank=Number.isFinite(options.maxBank)&&options.maxBank>=0&&options.maxBank<90?options.maxBank:40;
  const radius=flightTurnRadius(speed,maxBank*Math.PI/180,turnGravity);
  const minimum=Math.min(60,halfExtent*.6),maximum=Math.max(minimum,halfExtent*.75);
  const warningDistance=clamp(Number.isFinite(radius)?Math.max(minimum,radius*1.3+speed*2):maximum,minimum,maximum);
  const clearance=halfExtent-Math.max(Math.abs(position.x),Math.abs(position.z));
  const outside=clearance<0,near=clearance<=warningDistance;
  const innerHalf=Math.max(0,halfExtent-warningDistance-10);
  let returnPosition={x:clamp(position.x,-innerHalf,innerHalf),y:Number.isFinite(position.y)?position.y:0,z:clamp(position.z,-innerHalf,innerHalf)};
  let dx=returnPosition.x-position.x,dz=returnPosition.z-position.z;
  if(dx===0&&dz===0){returnPosition={x:0,y:returnPosition.y,z:0};dx=-position.x;dz=-position.z;}
  const scale=Math.max(Math.abs(dx),Math.abs(dz));
  let returnDirection=null,returnHeading=null,returnBearingDeg=null;
  if(scale>0){
    const x=dx/scale,z=dz/scale,length=Math.hypot(x,z);
    returnDirection={x:x/length,y:0,z:z/length};
    returnHeading=Math.atan2(returnDirection.x,-returnDirection.z);
    returnBearingDeg=wrap((returnHeading-heading)*180/Math.PI);
    if(returnBearingDeg===-180)returnBearingDeg=180;
  }
  const nearestEdge=Math.abs(position.x)>=Math.abs(position.z)?position.x<0?'west':'east':position.z<0?'north':'south';
  const suppliedVelocity=options.velocity;
  const velocity=suppliedVelocity&&[suppliedVelocity.x,suppliedVelocity.z].every(Number.isFinite)
    ?suppliedVelocity:{x:Math.sin(heading)*speed,z:-Math.cos(heading)*speed};
  const wallMotion=[
    {distance:halfExtent-position.x,outward:velocity.x},{distance:halfExtent+position.x,outward:-velocity.x},
    {distance:halfExtent-position.z,outward:velocity.z},{distance:halfExtent+position.z,outward:-velocity.z},
  ].filter(wall=>Math.abs(wall.distance-clearance)<=1e-7);
  const outwardSpeed=Math.max(...wallMotion.map(wall=>wall.outward));
  const approaching=outwardSpeed>.1,returning=outwardSpeed<-.1;
  const motion=approaching?'outward':returning?'inward':Math.hypot(velocity.x,velocity.z)>.1?'parallel':'stopped';
  const timeToEdge=approaching?Math.max(0,clearance)/outwardSpeed:null;
  return {halfExtent,clearance,near,outside,level:outside?'outside':near?'near':'clear',warningDistance,
    turnRadius:Number.isFinite(radius)?radius:null,turnGravity,maxBank,returnPosition,returnDirection,returnHeading,returnBearingDeg,nearestEdge,
    outwardSpeed,motion,approaching,returning,timeToEdge};
}
