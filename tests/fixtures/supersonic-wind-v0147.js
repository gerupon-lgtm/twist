import * as THREE from 'three';

const CAPACITY=32,SEGMENTS=6,CLEAR=.82,DEPTH=2.2;
const TRIANGLE=[0,2,1,1,2,3];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
/** Both high-speed courses share wind, with a quieter 1/10-course envelope. */
export function windPresentation(speed,reference=680){
  const strength=clamp((speed-100)/300,0,1)*(reference<=340?.75:1);
  return {strength,drift:.8+clamp(speed/100,0,7),length:.12+strength*.44};
}

/** Reused curved translucent ribbons; the central 78% rectangle is untouched. */
export function createSupersonicWind(){
  const geometry=new THREE.BufferGeometry(),vertices=CAPACITY*SEGMENTS*6;
  const positions=new Float32Array(vertices*3),colors=new Float32Array(vertices*4);
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,4).setUsage(THREE.DynamicDrawUsage));
  const material=new THREE.MeshBasicMaterial({color:0xedfbff,vertexColors:true,transparent:true,opacity:.75,side:THREE.DoubleSide,depthTest:false,depthWrite:false,toneMapped:false});
  const mesh=new THREE.Mesh(geometry,material);mesh.name='high-speed-wind-ribbons';mesh.frustumCulled=false;mesh.renderOrder=6;mesh.visible=false;
  const rays=Array.from({length:CAPACITY},(_,i)=>{const a=i*2.3999632297+.31,x=Math.cos(a),y=Math.sin(a),m=Math.max(Math.abs(x),Math.abs(y));return{x:x/m,y:y/m,phase:(i*.6180339887)%1};});
  let strength=0,count=0,drift=0,length=0,disposed=false;
  function update({speed=0,reference=680,amount=1,timeSeconds=0,verticalFov=64,aspect=1,visible=true,reducedMotion=false}={}){
    if(disposed)return 0;
    ({strength,drift,length}=windPresentation(speed,reference));
    count=visible&&!reducedMotion?Math.floor((12+20*strength)*Math.min(1,strength*3)*Math.min(1,clamp(amount,0,2))):0;
    mesh.visible=count>0;geometry.setDrawRange(0,count*SEGMENTS*6);if(!count)return strength;
    const halfH=Math.tan(clamp(verticalFov,20,115)*Math.PI/360)*DEPTH,halfW=halfH*clamp(aspect,.1,10),time=clamp(timeSeconds,0,1e9)%3600;
    let offset=0,colorOffset=0;
    for(let i=0;i<count;i++){
      const ray=rays[i],phase=(ray.phase+time*drift)%1,inner=CLEAR+phase*.22,fade=Math.sin(Math.PI*phase)*strength;
      for(let j=0;j<SEGMENTS;j++)for(const vertex of TRIANGLE){
        const s=(j+(vertex>=2?1:0))/SEGMENTS,edge=vertex%2===0?-1:1;
        const curve=.025*Math.sin(s*Math.PI+time*1.5+i),width=(.004+.018*strength)*Math.sin(Math.PI*s);
        const radius=inner+s*length,tangent=curve+edge*width;
        positions[offset]=(ray.x*radius-ray.y*tangent)*halfW;
        positions[offset+1]=(ray.y*radius+ray.x*tangent)*halfH;positions[offset+2]=-DEPTH;
        colors[colorOffset]=colors[colorOffset+1]=colors[colorOffset+2]=1;
        colors[colorOffset+3]=fade*Math.sin(Math.PI*s);offset+=3;colorOffset+=4;
      }
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;
    return strength;
  }
  return{mesh,update,snapshot:()=>({windVisible:mesh.visible,windStrength:strength,windCount:count,windDrift:drift,windLength:length,windCapacity:CAPACITY,windCentralClear:.78}),
    dispose(){if(disposed)return;disposed=true;mesh.visible=false;mesh.removeFromParent();geometry.dispose();material.dispose();}};
}
