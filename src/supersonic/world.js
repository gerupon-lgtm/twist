import * as THREE from 'three';
import {createSupersonicSea} from './sea.js';
import {normalizeVisibility} from '../visibility.js';

const EMPTY=Object.freeze([]),WIND=Object.freeze({x:8,z:4});
const cloudBands=Object.freeze([{min:400,max:800},{min:2000,max:2400}]);
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453123;return v-Math.floor(v);};
const same=(a,b)=>a&&['x','y','z'].every(k=>a[k]===b[k]);

/** Only scenery. Every location uploaded to a GPU buffer is already P - origin. */
export function createSupersonicWorld({course,maxAnisotropy=1,visibility='assisted',groundPatternStrength=.8}={}){
  if(!course?.gates?.length)throw new TypeError('supersonic course required');
  const group=new THREE.Group();group.name='supersonic-world';
  const sea=createSupersonicSea({maxAnisotropy,strength:groundPatternStrength});group.add(sea.group);
  const geometry=new Set(),materials=new Set(),instances=[];
  const ownGeometry=g=>(geometry.add(g),g),ownMaterial=m=>(materials.add(m),m);
  const active=ownMaterial(new THREE.MeshBasicMaterial({color:0xffc14b,fog:false}));
  const future=ownMaterial(new THREE.MeshBasicMaterial({color:0x9aaeb8,transparent:true,opacity:.48}));
  const passed=ownMaterial(new THREE.MeshBasicMaterial({color:0x5e9c9c,transparent:true,opacity:.22,depthWrite:false}));
  const exit=ownMaterial(new THREE.MeshBasicMaterial({color:0x91f4d5,fog:false}));
  const gateGeometry=ownGeometry(new THREE.TorusGeometry(1,.034,6,64));
  const gates=course.gates.map(gate=>{
    const mesh=new THREE.Mesh(gateGeometry,future);mesh.name=gate.id;mesh.scale.setScalar(gate.radius);
    const basis=new THREE.Matrix4().makeBasis(new THREE.Vector3(...['x','y','z'].map(k=>gate.right[k])),new THREE.Vector3(...['x','y','z'].map(k=>gate.up[k])),new THREE.Vector3(...['x','y','z'].map(k=>gate.normal[k])));
    mesh.quaternion.setFromRotationMatrix(basis);group.add(mesh);return {gate,mesh};
  });
  const islandGeometry=ownGeometry(new THREE.ConeGeometry(1,1,9));
  const islandMaterial=ownMaterial(new THREE.MeshLambertMaterial({color:0x658984,flatShading:true}));
  const islands=(course.arena?.landmarks??[]).filter(p=>p.kind==='island').map(data=>{
    const mesh=new THREE.Mesh(islandGeometry,islandMaterial);mesh.name=data.id;
    const h=data.height??data.position.y*2;mesh.scale.set(h*1.25,h,h*.95);group.add(mesh);return {data,mesh};
  });
  // Fixed seeded clouds: world positions and wind age survive every origin shift.
  const cloudGeometry=ownGeometry(new THREE.IcosahedronGeometry(1,0));
  const cloudDefinitions=[],passes=[];
  const cloudLayers=cloudBands.map((band,layer)=>{
    const material=ownMaterial(new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:layer?.56:.68,depthWrite:false,flatShading:true}));
    const mesh=new THREE.InstancedMesh(cloudGeometry,material,64*3);mesh.name=`cloud-layer-${layer}`;mesh.frustumCulled=false;instances.push(mesh);group.add(mesh);
    for(let i=0;i<64;i++){
      const seed=layer*64+i+1;
      const position={x:(i%8-3.5)*5000+(hash(seed)-.5)*1800,y:band.min+100+hash(seed+91)*(band.max-band.min-200),z:(Math.floor(i/8)-3.5)*5000+(hash(seed+37)-.5)*1800};
      const live={...position};
      const publicPosition=Object.freeze({get x(){return live.x;},get y(){return live.y;},get z(){return live.z;}});
      const pass={id:`sonic-cloud-${layer}-${i}`,position:publicPosition,radius:155};passes.push(pass);
      cloudDefinitions.push({layer,index:i,position,live,pass,seed});
    }
    return mesh;
  });
  const passObjects=Object.freeze(passes.map(Object.freeze));
  // Low opacity boundary is an advisory reference; it has no collider.
  const half=course.arena?.halfExtent??20000;
  const boundaryGeometry=ownGeometry(new THREE.PlaneGeometry(half*2,2000));
  const boundaryMaterial=ownMaterial(new THREE.MeshBasicMaterial({color:0x5daeb9,transparent:true,opacity:.035,depthWrite:false,side:THREE.DoubleSide}));
  const boundaryData=[{x:0,z:-half,angle:0},{x:0,z:half,angle:0},{x:-half,z:0,angle:Math.PI/2},{x:half,z:0,angle:Math.PI/2}];
  const boundaries=boundaryData.map(data=>{const mesh=new THREE.Mesh(boundaryGeometry,boundaryMaterial);mesh.rotation.y=data.angle;mesh.name='advisory-airspace-boundary';group.add(mesh);return {data,mesh};});
  let origin=null,time=0,rebaseCount=0,syncCount=0,lastGate=-1,disposed=false,view=normalizeVisibility(visibility);
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
  function sync(nextOrigin,timeSeconds=0,state={}){
    if(disposed)return;time=Math.max(0,Number.isFinite(timeSeconds)?timeSeconds:0);syncCount++;
    if(!same(origin,nextOrigin)){
      origin={...nextOrigin};rebaseCount++;
      for(const {gate,mesh}of gates)mesh.position.set(gate.center.x-origin.x,gate.center.y-origin.y,gate.center.z-origin.z);
      for(const {data,mesh}of islands)mesh.position.set(data.position.x-origin.x,data.position.y-origin.y,data.position.z-origin.z);
      for(const {data,mesh}of boundaries)mesh.position.set(data.x-origin.x,1000-origin.y,data.z-origin.z);
    }
    sea.sync(origin,time);
    for(const def of cloudDefinitions){
      const x=def.position.x+WIND.x*time,z=def.position.z+WIND.z*time;
      Object.assign(def.live,{x,y:def.position.y,z});
      for(let puff=0;puff<3;puff++){
        const seed=def.seed*3+puff;
        position.set(x+(puff-1)*105-origin.x,def.position.y+(hash(seed+17)-.5)*16-origin.y,z+(hash(seed+51)-.5)*80-origin.z);
        scale.set(115+hash(seed+71)*50,55+hash(seed+11)*24,90+hash(seed+21)*45);
        matrix.compose(position,rotation,scale);cloudLayers[def.layer].setMatrixAt(def.index*3+puff,matrix);
      }
    }
    for(const mesh of cloudLayers)mesh.instanceMatrix.needsUpdate=true;
    const activeIndex=state.activeGateIndex??0;
    if(activeIndex!==lastGate){gates.forEach(({mesh,gate},i)=>{mesh.material=i<activeIndex?passed:i===activeIndex?(gate.kind==='exit'?exit:active):future;});lastGate=activeIndex;}
  }
  function setVisibility(value){view=normalizeVisibility(value);for(const mesh of cloudLayers)mesh.visible=view==='assisted';for(const {mesh}of boundaries)mesh.visible=view==='assisted';}
  setVisibility(visibility);
  return {group,sync,setVisibility,setGroundPatternStrength:sea.setStrength,getPassObjects:()=>view==='assisted'?passObjects:EMPTY,
    snapshot:()=>({visible:true,origin:origin?{...origin}:null,rebaseCount,syncCount,timeSeconds:time,gateCount:gates.length,islandCount:islands.length,
      cloudCount:cloudDefinitions.length,cloudInstanceCount:cloudDefinitions.length*3,cloudLayers:cloudBands.map(b=>({...b})),cloudWind:{...WIND},cloudPhase:time,
      geometryCount:disposed?0:geometry.size,materialCount:disposed?0:materials.size,sea:sea.snapshot(),disposed}),
    dispose(){if(disposed)return;disposed=true;sea.dispose();for(const m of instances)m.dispose();for(const g of geometry)g.dispose();for(const m of materials)m.dispose();group.clear();},
  };
}
