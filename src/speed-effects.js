import * as THREE from 'three';

const DEG=Math.PI/180;
const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
const nonnegative=value=>Number.isFinite(value)&&value>0?value:0;
const activeAfterburner=value=>value===true||value?.active===true;
const smooth=value=>value*value*(3-2*value);
const clock=value=>Number.isFinite(value)?Math.max(0,value)%3600:0;

/** Display-only output. Rotation is in radians; root applies the final camera pose/FOV once. */
export function speedPresentation(speed,settings={},afterburner={active:false},timeSeconds=0,cameraMode='overlay'){
  const velocity=nonnegative(speed),active=activeAfterburner(afterburner)&&velocity>0;
  const maximum=Number.isFinite(settings?.speedFov)?clamp(settings.speedFov,0,15):10;
  const progress=smooth(clamp((velocity-10)/20,0,1));
  const extraFov=maximum*progress+(active?3*maximum/10:0);
  const shake={x:0,y:0,z:0};
  if(settings?.highSpeedShake!==false){
    const strength=clamp((velocity-18)/27*(active?1.15:1),0,1);
    const amplitude=(cameraMode==='cockpit' ? .035 : .12)*DEG*strength,time=clock(timeSeconds);
    if(amplitude>0){
      shake.x=amplitude*(.65*Math.sin(time*17.3)+.35*Math.sin(time*29.7+.4));
      shake.y=amplitude*(.6*Math.sin(time*19.1+1.2)+.4*Math.sin(time*31.3+.2));
      shake.z=amplitude*.45*(.7*Math.sin(time*23.7+.8)+.3*Math.sin(time*37.1));
    }
  }
  return {extraFov,shake};
}

const CAPACITY=80,CENTRAL_CLEAR=.72,DEPTH=2;
/**
 * One fixed camera-local line pool. Its central 72% rectangle stays blank.
 * Per-frame update mutates only existing typed arrays/materials; no particles,
 * vectors, geometry or materials are created after initialization.
 */
export function createSpeedEffects(){
  const group=new THREE.Group();group.name='camera-speed-streaks';group.visible=false;
  group.userData.collisions=false;
  const positions=new Float32Array(CAPACITY*6),colors=new Float32Array(CAPACITY*6);
  const rays=new Float32Array(CAPACITY*2),phases=new Float32Array(CAPACITY);
  for(let i=0;i<CAPACITY;i++){
    const angle=i*2.399963229728653+.31,x=Math.cos(angle),y=Math.sin(angle),extent=Math.max(Math.abs(x),Math.abs(y));
    rays[i*2]=x/extent;rays[i*2+1]=y/extent;phases[i]=(i*.6180339887498949)%1;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setDrawRange(0,0);
  const material=new THREE.LineBasicMaterial({color:0xcdeeff,vertexColors:true,transparent:true,opacity:.3,
    depthTest:false,depthWrite:false,fog:false,toneMapped:false,blending:THREE.AdditiveBlending});
  const lines=new THREE.LineSegments(geometry,material);lines.name='peripheral-speed-lines';lines.frustumCulled=false;lines.renderOrder=8;group.add(lines);
  let visible=false,speed=0,afterburner=false,amount=1,lineCount=0,lineLength=0,verticalFov=64,aspect=1;
  function update(input={}){
    speed=nonnegative(input?.speed);afterburner=activeAfterburner(input?.afterburner)&&speed>0;
    amount=Number.isFinite(input?.amount)?clamp(input.amount,0,2):1;
    verticalFov=Number.isFinite(input?.verticalFov)?clamp(input.verticalFov,20,115):64;
    aspect=Number.isFinite(input?.aspect)&&input.aspect>0?clamp(input.aspect,.1,10):1;
    const flow=clamp((speed-4)/26,0,1.6);
    lineCount=input?.visible===false?0:Math.min(CAPACITY,Math.floor(48*flow*amount*(afterburner?1.35:1)));
    visible=lineCount>0;group.visible=visible;geometry.setDrawRange(0,lineCount*2);
    lineLength=visible?(.014+clamp(speed/45,0,1.5)*.1)*(afterburner?1.35:1):0;
    if(!visible)return;
    const time=clock(input?.timeSeconds),motionSpeed=Math.min(speed,90),drift=.65+motionSpeed*.045;
    const halfHeight=Math.tan(verticalFov*DEG/2)*DEPTH,halfWidth=halfHeight*aspect;
    material.opacity=afterburner ? .42 : .3;
    for(let i=0;i<lineCount;i++){
      const phase=(phases[i]+time*drift)%1;
      const inner=CENTRAL_CLEAR+phase*.31,outer=inner+lineLength;
      const x=rays[i*2],y=rays[i*2+1],offset=i*6;
      positions[offset]=x*inner*halfWidth;positions[offset+1]=y*inner*halfHeight;positions[offset+2]=-DEPTH;
      positions[offset+3]=x*outer*halfWidth;positions[offset+4]=y*outer*halfHeight;positions[offset+5]=-DEPTH;
      const fade=Math.sin(Math.PI*phase),tail=.07*fade,head=.8*fade;
      colors[offset]=tail;colors[offset+1]=tail;colors[offset+2]=tail;
      colors[offset+3]=head;colors[offset+4]=head;colors[offset+5]=head;
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;
  }
  return {group,update,snapshot:()=>({visible,speed,afterburner,amount,lineCount,capacity:CAPACITY,lineLength,
    centralClear:CENTRAL_CLEAR,verticalFov,aspect})};
}
