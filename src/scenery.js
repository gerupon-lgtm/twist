import * as THREE from 'three';

/** Static instancing keeps a whole compass of silhouettes inexpensive to render. */
export function createScenery({halfExtent=350,avoidPoints=[]}={}) {
  const extent=Number.isFinite(halfExtent)&&halfExtent>0?halfExtent:350;
  const cloudSpread=Math.max(1,extent/110);
  const goals=Array.isArray(avoidPoints)?avoidPoints.filter(point=>Number.isFinite(point?.x)&&Number.isFinite(point?.z)):[];
  const clearOfGoals=(x,z,margin)=>{
    for(let i=0;i<goals.length;i++)if(Math.hypot(x-goals[i].x,z-goals[i].z)<margin)return false;
    return true;
  };
  let seed=0x27c10d;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const group=new THREE.Group();group.name='assisted-scenery';
  group.userData.collisions=false;
  const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3();
  const batch=(geometry,material,items,name)=>{
    const mesh=new THREE.InstancedMesh(geometry,material,items.length);
    mesh.name=name??'scenery-batch';mesh.userData.collisions=false;
    items.forEach((item,i)=>{
      position.fromArray(item.p);scale.fromArray(item.s);
      rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),item.turn||0);
      matrix.compose(position,rotation,scale);mesh.setMatrixAt(i,matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);return mesh;
  };
  const far=new THREE.MeshBasicMaterial({color:0x96b4bf,fog:false});
  const farLight=new THREE.MeshBasicMaterial({color:0xb3c9ce,fog:false});
  const stone=new THREE.MeshBasicMaterial({color:0x829c9d,fog:false});
  const islands=[],ruins=[],arches=[];
  for(let i=0;i<12;i++) {
    const angle=i*Math.PI/6,radius=560+(i%3)*85,x=Math.sin(angle)*radius,z=-Math.cos(angle)*radius,y=32+(i%4)*23;
    islands.push({p:[x,y,z],s:[64+i%3*12,35+i%4*9,50+i%2*22],turn:angle});
    const columns=2+i%4;
    for(let j=0;j<columns;j++) {
      const ox=(j-(columns-1)/2)*18;
      ruins.push({p:[x+Math.cos(angle)*ox,y+28+(j%2)*10,z-Math.sin(angle)*ox],s:[7,45+(j%3)*18,7],turn:angle});
    }
    if(i%3===0) arches.push({p:[x,y+44,z],s:[44,6,10],turn:angle});
  }
  // An inverted cone reads as a floating island; separate columns/broken lintels vary its outline.
  const islandGeometry=new THREE.ConeGeometry(1,1,5);islandGeometry.rotateZ(Math.PI);
  batch(islandGeometry,far,islands,'far-floating-islands');batch(new THREE.BoxGeometry(1,1,1),farLight,ruins,'far-island-ruins');
  batch(new THREE.BoxGeometry(1,1,1),farLight,arches,'far-island-arches');
  const tower=[];
  for(const y of [12,38,64,90]) {
    for(const x of [-2.2,2.2])tower.push({p:[-36+x,y,-18],s:[1.4,22,2.8]});
    tower.push({p:[-36,y+10,-18],s:[7.5,2.5,5]});
  }
  batch(new THREE.BoxGeometry(1,1,1),stone,tower,'central-tower');
  const crown=new THREE.Mesh(new THREE.ConeGeometry(4.5,14,4),stone);crown.position.set(-36,109,-18);crown.rotation.y=Math.PI/4;group.add(crown);
  const sunMaterial=new THREE.MeshBasicMaterial({color:0xffefac,fog:false});
  const sun=new THREE.Mesh(new THREE.SphereGeometry(25,12,8),sunMaterial);sun.position.set(-420,300,-740);group.add(sun);
  const halo=new THREE.Mesh(new THREE.SphereGeometry(42,12,8),new THREE.MeshBasicMaterial({color:0xfff2c8,transparent:true,opacity:.25,depthWrite:false,fog:false}));halo.position.copy(sun.position);group.add(halo);
  // Static low detail gives low-altitude translation a reference. Keep density
  // bounded for the whole arena instead of multiplying objects with its area.
  const rocks=[],grass=[],fragments=[];
  const groundItems=(target,count,kind)=>{
    for(let attempt=0;target.length<count&&attempt<count*12;attempt++){
      const x=(random()*2-1)*extent*.92,z=(random()*2-1)*extent*.92;
      if(!clearOfGoals(x,z,17))continue;
      const width=kind==='grass' ? .15+random()*.24 : kind==='rock' ? .2+random()*.55 : .45+random()*.95;
      const height=kind==='grass' ? .3+random()*.5 : kind==='rock' ? .15+random()*.5 : .12+random()*.38;
      const depth=kind==='grass' ? .12+random()*.2 : kind==='rock' ? .2+random()*.5 : .35+random()*.55;
      target.push({p:[x,height/2+.03,z],s:[width,height,depth],turn:random()*Math.PI*2});
    }
  };
  groundItems(rocks,240,'rock');groundItems(grass,280,'grass');groundItems(fragments,120,'ruin');
  batch(new THREE.IcosahedronGeometry(1,0),new THREE.MeshBasicMaterial({color:0x8b7865,fog:false}),rocks,'speed-ground-rocks');
  batch(new THREE.ConeGeometry(1,1,3),new THREE.MeshBasicMaterial({color:0x718b65,fog:false}),grass,'speed-ground-grass');
  batch(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xc4bc9d,fog:false}),fragments,'speed-ground-ruins');
  const clouds=[],acceptedCenters=[];
  const centers=[[-55,12,26],[38,22,4],[-48,34,-48],[48,46,-72],[15,18,65],[-58,55,62],[65,8,-36],[-70,72,-10],[12,68,-82],[66,30,58],[-15,40,-80],[-60,22,-85]];
  centers.forEach(([x,y,z],i)=>{
    const cx=x*cloudSpread,cz=z*cloudSpread;
    if(clearOfGoals(cx,cz,26))acceptedCenters.push([cx,y,cz,i]);
  });
  let nearClouds=0;
  for(let attempt=0;nearClouds<24&&attempt<480;attempt++){
    const x=(random()*2-1)*extent*.9,z=(random()*2-1)*extent*.9,y=8+random()*32;
    if(!clearOfGoals(x,z,26))continue;
    acceptedCenters.push([x,y,z,12+nearClouds]);nearClouds++;
  }
  acceptedCenters.forEach(([x,y,z,i])=>{
    for(let j=0;j<3;j++)clouds.push({p:[x+(j-1)*4,y+(j===1?1.2:0),z+(i%2?1:-1)*j],s:[5+j%2,1.7+j%2*.7,3.5],turn:i*.7});
  });
  batch(new THREE.IcosahedronGeometry(1,1),new THREE.MeshBasicMaterial({color:0xf5faf6,fog:false,transparent:true,opacity:.42,depthWrite:false}),clouds,'noncolliding-cloud-puffs');
  const details=Object.freeze({islands:12,towerHeight:116,clouds:acceptedCenters.length,suns:1,fogless:true,collisions:false,batches:11,
    nearClouds,cloudPuffs:clouds.length,groundDetails:rocks.length+grass.length+fragments.length,groundBatches:3,
    groundCounts:Object.freeze({rocks:rocks.length,grass:grass.length,ruins:fragments.length})});
  return {group,details};
}
