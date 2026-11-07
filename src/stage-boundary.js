import * as THREE from 'three';
import {STAGE_HALF_EXTENT} from './boundary.js';

/** Static storm silhouettes; visual only, with no collision or flight callbacks. */
export function createStageBoundary(options={}){
  const supplied=options?.halfExtent;
  const halfExtent=Number.isFinite(supplied)&&supplied>0?supplied:STAGE_HALF_EXTENT;
  const group=new THREE.Group();group.name='stage-storm-boundary';
  group.userData.halfExtent=halfExtent;group.userData.collisions=false;
  const geometry=new THREE.IcosahedronGeometry(1,1);
  const material=new THREE.MeshBasicMaterial({color:0x596a82,transparent:true,opacity:.84,depthWrite:false,fog:false});
  const mesh=new THREE.InstancedMesh(geometry,material,64);mesh.name='storm-perimeter-puffs';
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion();
  const color=new THREE.Color();
  for(let side=0;side<4;side++)for(let i=0;i<16;i++){
    const index=side*16+i,along=-halfExtent+(i+.5)*halfExtent/8;
    const y=28+(index%5)*3;
    position.set(side===0?halfExtent:side===1?-halfExtent:along,y,side===2?halfExtent:side===3?-halfExtent:along);
    const length=halfExtent/16+9+(index%3)*3,depth=18+(index%4)*2,height=34+(index%4)*5;
    scale.set(side<2?depth:length,height,side<2?length:depth);
    rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),((index%3)-1)*.08);
    matrix.compose(position,rotation,scale);mesh.setMatrixAt(index,matrix);
    color.setHSL(.61+(index%3)*.008,.17,.34+(index%4)*.025);mesh.setColorAt(index,color);
  }
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.computeBoundingSphere();group.add(mesh);
  return {group,
    update(timeSeconds){if(Number.isFinite(timeSeconds))material.opacity=.84+.025*Math.sin(timeSeconds*.3);},
    snapshot:()=>({kind:'storm',halfExtent,stormPuffs:64,instances:64,batches:1,collisions:false,animatedGeometry:false,opacity:material.opacity}),
  };
}
