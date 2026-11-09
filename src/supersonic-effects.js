import * as THREE from 'three';
import {vaporConeIntensity} from './supersonic-presentation.js';
import {createSonicEventConsumer} from './feedback/supersonic-model.js';
import {createSupersonicWind} from './supersonic-wind.js';
export {supersonicSpeedPresentation} from './supersonic-presentation.js';

const CAPACITY=80,CLEAR=.78,DEPTH=2.2,DEG=Math.PI/180;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));

/** Owns only cosmetic meshes. Both groups inherit the stage's final camera/craft transform. */
export function createSupersonicEffects(){
  const craftGroup=new THREE.Group(),cameraGroup=new THREE.Group();
  craftGroup.name='supersonic-vapor-cone';cameraGroup.name='supersonic-peripheral-effects';
  for(const group of [craftGroup,cameraGroup]){group.visible=false;group.userData.collisions=false;}
  const coneGeometry=new THREE.ConeGeometry(2.2,3,32,1,true);
  coneGeometry.rotateX(-Math.PI/2);coneGeometry.translate(0,0,.2);
  const coneMaterial=new THREE.MeshBasicMaterial({color:0xf5fbff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,toneMapped:false});
  const cone=new THREE.Mesh(coneGeometry,coneMaterial);cone.name='transonic-vapor';craftGroup.add(cone);
  const hazePositions=new Float32Array(72),hazeGeometry=new THREE.BufferGeometry();
  const hazeCoordinates=new Float32Array(48);let hazeIndex=0;
  const quad=(left,top,right,bottom)=>{for(const [x,y]of [[left,top],[left,bottom],[right,top],[right,top],[left,bottom],[right,bottom]]){hazeCoordinates[hazeIndex++]=x;hazeCoordinates[hazeIndex++]=y;}};
  quad(-1.05,1.05,1.05,CLEAR);quad(-1.05,-CLEAR,1.05,-1.05);quad(-1.05,CLEAR,-CLEAR,-CLEAR);quad(CLEAR,CLEAR,1.05,-CLEAR);
  hazeGeometry.setAttribute('position',new THREE.BufferAttribute(hazePositions,3).setUsage(THREE.DynamicDrawUsage));
  hazeGeometry.setAttribute('screenEdge',new THREE.BufferAttribute(hazeCoordinates,2));
  const hazeMaterial=new THREE.ShaderMaterial({transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false,
    uniforms:{strength:{value:0}},
    vertexShader:'attribute vec2 screenEdge;varying vec2 edgePosition;void main(){edgePosition=screenEdge;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 edgePosition;uniform float strength;void main(){float edge=smoothstep(0.78,1.08,max(abs(edgePosition.x),abs(edgePosition.y)));gl_FragColor=vec4(0.96,0.98,1.0,strength*edge);}'
  });
  const haze=new THREE.Mesh(hazeGeometry,hazeMaterial);haze.frustumCulled=false;haze.renderOrder=7;cameraGroup.add(haze);
  const positions=new Float32Array(CAPACITY*6),geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setDrawRange(0,0);
  const lineMaterial=new THREE.LineBasicMaterial({color:0xd7edff,transparent:true,opacity:.25,depthTest:false,depthWrite:false,toneMapped:false});
  const lines=new THREE.LineSegments(geometry,lineMaterial);lines.name='supersonic-streaks';lines.frustumCulled=false;lines.renderOrder=8;cameraGroup.add(lines);
  const shockMaterial=new THREE.MeshBasicMaterial({color:0xe9f8ff,transparent:true,opacity:0,side:THREE.DoubleSide,depthTest:false,depthWrite:false,toneMapped:false});
  const shockGeometry=new THREE.RingGeometry(.88,1,96);
  const shock=new THREE.Mesh(shockGeometry,shockMaterial);shock.name='sonic-pressure-wave';shock.frustumCulled=false;shock.renderOrder=9;cameraGroup.add(shock);
  const echoMaterial=shockMaterial.clone(),echo=new THREE.Mesh(shockGeometry,echoMaterial);
  echo.name='sonic-second-pressure-wave';echo.frustumCulled=false;echo.renderOrder=9;cameraGroup.add(echo);
  // A soft annular cloud, rather than a full-screen flash: the centre stays clear
  // for the flight director, and the screen edge briefly fills with pressure mist.
  const cloudMaterial=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,
    uniforms:{strength:{value:0}},vertexShader:'varying vec2 uvCloud;void main(){uvCloud=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 uvCloud;uniform float strength;void main(){vec2 p=uvCloud*2.0-1.0;float r=length(p);float edge=smoothstep(0.32,0.72,r)*(1.0-smoothstep(1.1,1.5,r));float mist=0.78+0.22*sin(atan(p.y,p.x)*13.0+r*21.0);gl_FragColor=vec4(0.9,0.97,1.0,strength*edge*mist);}'
  });
  const cloudGeometry=new THREE.PlaneGeometry(2,2),cloud=new THREE.Mesh(cloudGeometry,cloudMaterial);
  cloud.name='sonic-pressure-mist';cloud.frustumCulled=false;cloud.renderOrder=8;cameraGroup.add(cloud);
  const wind=createSupersonicWind();cameraGroup.add(wind.mesh);
  const wakeGeometry=new THREE.TorusGeometry(2.4,.075,8,64);
  const wakeMaterial=shockMaterial.clone();wakeMaterial.depthTest=true;
  const wake=new THREE.Mesh(wakeGeometry,wakeMaterial);wake.name='sonic-expanding-wake';craftGroup.add(wake);
  const events=createSonicEventConsumer();let burstAt=-Infinity,burst=0,shockRadius=0,visualAttempt=null;
  const rays=new Float32Array(CAPACITY*2),phases=new Float32Array(CAPACITY);
  for(let i=0;i<CAPACITY;i++){const angle=i*2.399963229728653+.31,x=Math.cos(angle),y=Math.sin(angle),size=Math.max(Math.abs(x),Math.abs(y));rays[i*2]=x/size;rays[i*2+1]=y/size;phases[i]=(i*.6180339887498949)%1;}
  let disposed=false,speed=0,mach=0,intensity=0,lineCount=0,lineLength=0,camera='overlay',running=false;
  function update(input={}){
    if(disposed)return;
    const state=input.state??{},sonic=state.supersonic;
    camera=input.camera??'overlay';running=input.phase==='running'&&Boolean(sonic);
    const t=Number.isFinite(input.timeSeconds)?Math.max(0,input.timeSeconds):0;
    if(sonic?.attemptId!==visualAttempt){visualAttempt=sonic?.attemptId;burstAt=-Infinity;}
    for(const event of events.consume(state))if(running&&event.direction==='up')burstAt=event.atSeconds;
    if(!running)burstAt=-Infinity;
    const age=t-burstAt,progress=clamp(age/.95,0,1);
    burst=running&&age>=0&&age<.95?Math.sin(Math.PI*Math.min(1,age/.045)/2)*(1-progress):0;
    speed=clamp(state.speed,0,680);mach=Number.isFinite(sonic?.mach)?sonic.mach:speed/340;
    intensity=running?vaporConeIntensity(mach):0;
    craftGroup.visible=(intensity>0||burst>0)&&camera!=='cockpit';coneMaterial.opacity=Math.min(.6,intensity*.4+burst*.24);
    const settings=input.settings??{},amount=clamp(settings.speedLines??1,0,2),flow=clamp(speed/(settings.presentationReferenceSpeed??680),0,1);
    lineCount=running?Math.min(CAPACITY,Math.floor((10+58*flow)*Math.min(1,speed/80)*amount)):0;
    lineLength=.025+.22*flow;geometry.setDrawRange(0,lineCount*2);
    const windStrength=wind.update({speed,reference:settings.presentationReferenceSpeed??680,amount,visible:running,timeSeconds:t,verticalFov:input.verticalFov,aspect:input.aspect,reducedMotion:settings.reducedMotion});
    haze.visible=(camera==='cockpit'&&(intensity>0||burst>0))||windStrength>0;
    const windHaze=windStrength*(settings.reducedMotion ? .018 : .018+.006*Math.sin(t*2.3));
    hazeMaterial.opacity=Math.min(.36,(camera==='cockpit'?intensity*.035+burst*.3:0)+windHaze);
    hazeMaterial.uniforms.strength.value=hazeMaterial.opacity;
    shock.visible=burst>0;shockMaterial.opacity=burst*.72;
    const reduced=Boolean(settings.reducedMotion),echoProgress=clamp((age-.11)/.84,0,1);
    echo.visible=burst>0&&age>=.11&&!reduced;echoMaterial.opacity=(1-echoProgress)*.65;
    cloud.visible=burst>0&&camera==='cockpit';cloudMaterial.uniforms.strength.value=reduced?burst*.18:Math.min(.72,burst*.85);
    wake.visible=burst>0&&camera==='chase';wakeMaterial.opacity=burst*.65;
    wake.scale.setScalar(input.settings?.reducedMotion?3:1+progress*5);wake.position.z=input.settings?.reducedMotion?8:2+progress*18;
    lineMaterial.opacity=.25+burst*.45;
    cameraGroup.visible=running&&(lineCount>0||haze.visible||shock.visible||wind.mesh.visible);
    if(!running)return;
    const fov=clamp(input.verticalFov??64,20,115),aspect=clamp(input.aspect??1,.1,10);
    const halfH=Math.tan(fov*DEG/2)*DEPTH,halfW=halfH*aspect;
    shockRadius=input.settings?.reducedMotion?1.05:.35+progress*1.45;
    shock.position.z=-DEPTH;shock.scale.setScalar(shockRadius*Math.max(halfW,halfH));
    echo.position.z=-DEPTH;echo.scale.setScalar((.32+echoProgress*1.65)*Math.max(halfW,halfH));
    cloud.position.z=-DEPTH;cloud.scale.set(halfW*1.05,halfH*1.05,1);
    for(let i=0;i<lineCount;i++){
      const phase=(phases[i]+t*(.6+flow*3.2))%1,inner=CLEAR+phase*.3,outer=inner+lineLength,o=i*6;
      positions[o]=rays[i*2]*inner*halfW;positions[o+1]=rays[i*2+1]*inner*halfH;positions[o+2]=-DEPTH;
      positions[o+3]=rays[i*2]*outer*halfW;positions[o+4]=rays[i*2+1]*outer*halfH;positions[o+5]=-DEPTH;
    }
    geometry.attributes.position.needsUpdate=true;
    if(haze.visible){
      for(let i=0;i<24;i++){hazePositions[i*3]=hazeCoordinates[i*2]*halfW;hazePositions[i*3+1]=hazeCoordinates[i*2+1]*halfH;hazePositions[i*3+2]=-DEPTH;}
      hazeGeometry.attributes.position.needsUpdate=true;
    }
  }
  return {craftGroup,cameraGroup,update,
    snapshot:()=>({speed,mach,coneIntensity:intensity,coneVisible:craftGroup.visible,hazeVisible:haze.visible&&cameraGroup.visible,lineCount,lineLength,capacity:CAPACITY,centralClear:CLEAR,camera,running,disposed,
      hazeOpacity:haze.visible&&cameraGroup.visible?hazeMaterial.opacity:0,
      sonicBurst:burst,shockVisible:shock.visible&&cameraGroup.visible,shockRadius,echoVisible:echo.visible&&cameraGroup.visible,mistOpacity:cloud.visible&&cameraGroup.visible?cloudMaterial.uniforms.strength.value:0,effectDepth:DEPTH,wakeVisible:wake.visible&&craftGroup.visible,sonicEvents:events.snapshot(),...wind.snapshot()}),
    dispose(){if(disposed)return;disposed=true;wind.dispose();craftGroup.visible=false;cameraGroup.visible=false;craftGroup.removeFromParent();cameraGroup.removeFromParent();for(const g of [coneGeometry,hazeGeometry,geometry,shockGeometry,wakeGeometry,cloudGeometry])g.dispose();for(const m of [coneMaterial,hazeMaterial,lineMaterial,shockMaterial,wakeMaterial,echoMaterial,cloudMaterial])m.dispose();},
  };
}
