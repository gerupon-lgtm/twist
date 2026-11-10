import * as THREE from 'three';

const CAPACITY=48,SEGMENTS=6,CLEAR=.82,DEPTH=2.2;
const TRIANGLE=[0,2,1,1,2,3];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
/** Both high-speed courses share wind, with a quieter 1/10-course envelope. */
export function windPresentation(speed,reference=680){
  const cruise=clamp((speed-80)/260,0,1),supersonic=clamp((speed-340)/340,0,1);
  const strength=cruise*(.65+.35*supersonic)*(reference<=340?.85:1);
  return {strength,drift:.8+clamp(speed/180,0,4.5),length:.16+strength*.52};
}

/** Reused curved translucent ribbons; the central 78% rectangle is untouched. */
export function createSupersonicWind(){
  const geometry=new THREE.BufferGeometry(),vertices=CAPACITY*SEGMENTS*6;
  const positions=new Float32Array(vertices*3),colors=new Float32Array(vertices*4);
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,4).setUsage(THREE.DynamicDrawUsage));
  const material=new THREE.MeshBasicMaterial({color:0xedfbff,vertexColors:true,transparent:true,opacity:.88,side:THREE.DoubleSide,depthTest:false,depthWrite:false,toneMapped:false});
  const mesh=new THREE.Mesh(geometry,material);mesh.name='high-speed-wind-ribbons';mesh.frustumCulled=false;mesh.renderOrder=6;mesh.visible=false;
  const rays=Array.from({length:CAPACITY},(_,i)=>{const a=i*2.3999632297+.31,x=Math.cos(a),y=Math.sin(a),m=Math.max(Math.abs(x),Math.abs(y));return{x:x/m,y:y/m,phase:(i*.6180339887)%1};});
  let strength=0,count=0,drift=0,length=0,rimCount=0,disposed=false,lastTime=null,travel=0;
  function update({speed=0,reference=680,amount=1,timeSeconds=0,verticalFov=64,aspect=1,visible=true,reducedMotion=false}={}){
    if(disposed)return 0;
    ({strength,drift,length}=windPresentation(speed,reference));
    const seconds=clamp(timeSeconds,0,1e9);
    if(lastTime===null||seconds<lastTime)travel=0;
    else travel=(travel+clamp(seconds-lastTime,0,.1)*drift)%1;
    lastTime=seconds;
    count=visible&&!reducedMotion?Math.floor((16+32*strength)*Math.min(1,strength*3)*Math.min(1,clamp(amount,0,2))):0;
    rimCount=Math.ceil(count/3);
    mesh.visible=count>0;geometry.setDrawRange(0,count*SEGMENTS*6);if(!count)return strength;
    const halfH=Math.tan(clamp(verticalFov,20,115)*Math.PI/360)*DEPTH,halfW=halfH*clamp(aspect,.1,10),time=clamp(timeSeconds,0,1e9)%3600;
    let offset=0,colorOffset=0;
    for(let i=0;i<count;i++){
      const ray=rays[i],phase=(ray.phase+travel)%1,inner=CLEAR+phase*.22,fade=Math.sin(Math.PI*phase)*strength;
      for(let j=0;j<SEGMENTS;j++)for(const vertex of TRIANGLE){
        const s=(j+(vertex>=2?1:0))/SEGMENTS,edge=vertex%2===0?-1:1;
        let x,y;
        if(i%3===0){
          // Long air filaments sweep along each rim. Radial-only streaks are
          // clipped after a few pixels; these remain readable across the edge.
          const side=(i/3)%4,lane=((i*.381966)%1)*1.45-.725,direction=lane<0?-1:1;
          const u=Math.max(0,phase-.5)+s*Math.min(.5,phase),width=(.006+.012*strength)*Math.sin(Math.PI*s);
          const radius=.81+.23*u+edge*width,along=lane+direction*(.8*u+.04*Math.sin(Math.PI*u));
          x=side<2?(side===0?-radius:radius):along;
          y=side<2?along:(side===2?radius:-radius);
        }else{
          const curve=.025*Math.sin(s*Math.PI+time*1.5+i),width=(.006+.026*strength)*Math.sin(Math.PI*s);
          const radius=inner+s*length,tangent=curve+edge*width;
          x=ray.x*radius-ray.y*tangent;y=ray.y*radius+ray.x*tangent;
        }
        positions[offset]=x*halfW;positions[offset+1]=y*halfH;positions[offset+2]=-DEPTH;
        colors[colorOffset]=.55+.45*s;colors[colorOffset+1]=.82+.18*s;colors[colorOffset+2]=1;
        colors[colorOffset+3]=fade*Math.sin(Math.PI*s);offset+=3;colorOffset+=4;
      }
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;
    return strength;
  }
  return{mesh,update,snapshot:()=>({windVisible:mesh.visible,windStrength:strength,windCount:count,windRimCount:rimCount,windDrift:drift,windLength:length,windCapacity:CAPACITY,windCentralClear:.78}),
    dispose(){if(disposed)return;disposed=true;mesh.visible=false;mesh.removeFromParent();geometry.dispose();material.dispose();}};
}
