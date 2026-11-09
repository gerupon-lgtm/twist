import * as THREE from 'three';

const EMPTY = Object.freeze([]);
const LAND = Object.freeze({tileMetres:2048, tilesPerAxis:13, repeatMetres:320,
  bigMetres:320, midMetres:40, fineMetres:8, textureSize:512});
const clamp = value => Math.max(0, Math.min(1, value));
const modulo = (value, period) => ((value % period) + period) % period;
const sameOrigin = (a, b) => a && ['x','y','z'].every(axis => a[axis] === b[axis]);
const assisted = value => !['raw','classic','legacy'].includes(value);
const hash = value => {const n = Math.sin(value * 127.1 + 311.7) * 43758.5453123; return n - Math.floor(n);};

/** Flat scenery only. All instance translations are calculated as P - origin on the CPU. */
export function createSierra10World({course, maxAnisotropy=1, visibility='assisted', groundPatternStrength=.8}={}) {
  if (course?.id !== 'sierra10' || !course.gates?.length) throw new TypeError('sierra10 course required');
  const group = new THREE.Group();
  group.name = 'sierra10-world';
  const geometries = new Set(), materials = new Set(), instances = [];
  const geometry = value => (geometries.add(value), value);
  const material = value => (materials.add(value), value);
  const instance = (shape, paint, count, name, parent=group) => {
    const mesh = new THREE.InstancedMesh(shape, paint, count);
    mesh.name = name; mesh.frustumCulled = false; instances.push(mesh); parent.add(mesh); return mesh;
  };
  let origin = null, rebaseCount = 0, syncCount = 0, disposed = false, lastGate = -1;
  let showAssistance = assisted(visibility), strength = null, groundUpdates = 0, groundRebases = 0;
  let phase = {x:0,z:0};

  const {tileMetres:tile, tilesPerAxis:count, repeatMetres:period, textureSize:size} = LAND;
  const pixels = new Uint8Array(size * size * 4);
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.name = 'sierra-land-pattern'; texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true; texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.max(1, Math.min(8, Math.floor(maxAnisotropy || 1)));
  const landGeometry = geometry(new THREE.PlaneGeometry(tile, tile));
  landGeometry.rotateX(-Math.PI / 2);
  const vertices = landGeometry.getAttribute('position'), uv = landGeometry.getAttribute('uv');
  for (let i=0; i<vertices.count; i++) uv.setXY(i, vertices.getX(i)/period, vertices.getZ(i)/period);
  // 2048m tiles do not divide the 320m pattern. Each tile therefore carries its own
  // bounded UV phase; a shared offset alone would introduce seams at tile edges.
  const tilePhases = new THREE.InstancedBufferAttribute(new Float32Array(count * count * 2), 2);
  landGeometry.setAttribute('groundTilePhase', tilePhases);
  const landMaterial = material(new THREE.MeshBasicMaterial({map:texture, fog:true, side:THREE.DoubleSide}));
  landMaterial.onBeforeCompile = shader => {
    shader.vertexShader = 'attribute vec2 groundTilePhase;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>',
      '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv += groundTilePhase;\n#endif');
  };
  landMaterial.customProgramCacheKey = () => 'sierra-world-ground-phase-v1';
  const ground = new THREE.Group(); ground.name = 'sierra-ground'; group.add(ground);
  const tiles = instance(landGeometry, landMaterial, count*count, 'sierra-ground-tiles', ground);

  function setGroundPatternStrength(value) {
    if (disposed || !Number.isFinite(value)) return false;
    const next = clamp(value); if (next === strength) return false; strength = next;
    for (let z=0; z<size; z++) for (let x=0; x<size; x++) {
      const wx=(x+.5)/size*period, wz=(z+.5)/size*period;
      const large=Math.sin(wx/320*Math.PI*2)*Math.cos(wz/320*Math.PI*2);
      const fields=((Math.floor(wx/40)+Math.floor(wz/40))%2 ? 1 : -1);
      const fine=Math.sin(wx/8*Math.PI*2)*Math.cos(wz/8*Math.PI*2);
      const edge=Math.min(modulo(wx,40), modulo(wz,40)) < 1.5 ? -1 : 0;
      const delta=(large*28 + fields*18 + fine*8 + edge*22)*next;
      const at=(z*size+x)*4;
      pixels[at]=Math.round(177+delta); pixels[at+1]=Math.round(109+delta*.82);
      pixels[at+2]=Math.round(57+delta*.52); pixels[at+3]=255;
    }
    texture.needsUpdate=true; groundUpdates++; return true;
  }

  const activeMaterial = material(new THREE.MeshBasicMaterial({color:0xdf4295,fog:false}));
  const futureMaterial = material(new THREE.MeshBasicMaterial({color:0xb7aab2,transparent:true,opacity:.62}));
  const passedMaterial = material(new THREE.MeshBasicMaterial({color:0x4faaa2,transparent:true,opacity:.35,depthWrite:false}));
  const exitMaterial = material(new THREE.MeshBasicMaterial({color:0xf4c95d,fog:false}));
  const ring = geometry(new THREE.TorusGeometry(1,.035,8,64));
  const gates = course.gates.map(data => {
    const mesh = new THREE.Mesh(ring,futureMaterial); mesh.name=data.id; mesh.scale.setScalar(data.radius);
    const vec = p => new THREE.Vector3(p.x,p.y,p.z);
    mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(vec(data.right),vec(data.up),vec(data.normal)));
    group.add(mesh); return {data,mesh};
  });

  const path = course.gates.map(gate => gate.center);
  function distanceToPath(point) {
    let nearest=Infinity;
    for (let i=1;i<path.length;i++) {
      const a=path[i-1], b=path[i], dx=b.x-a.x, dz=b.z-a.z;
      const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.z-a.z)*dz)/(dx*dx+dz*dz||1)));
      nearest=Math.min(nearest,Math.hypot(point.x-a.x-t*dx,point.z-a.z-t*dz));
    }
    return nearest;
  }
  const poles=[];
  function addPole(id, base, right, seed, waypoint=false) {
    const length=Math.hypot(right.x,right.z)||1, rx=right.x/length, rz=right.z/length;
    let offset=waypoint?180:160+hash(seed)*50;
    let point;
    do {point={x:base.x+rx*offset,z:base.z+rz*offset};offset+=80;} while (distanceToPath(point)<100);
    poles.push({id,position:{x:point.x,y:0,z:point.z},height:waypoint?46:30+hash(seed+37)*20,
      angle:Math.atan2(-rz,rx),waypoint});
  }
  course.gates.forEach((gate,i) => addPole(`sierra-point-${String.fromCharCode(65+i)}`,gate.center,gate.right,i+1,true));
  for (let leg=1;leg<path.length;leg++) {
    const a=path[leg-1], b=path[leg], dx=b.x-a.x, dz=b.z-a.z, length=Math.hypot(dx,dz);
    for (let distance=400,index=0;distance<length-200;distance+=400,index++) {
      const t=distance/length, sign=index%2?1:-1;
      addPole(`sierra-pass-${leg}-${index}`,{x:a.x+dx*t,z:a.z+dz*t},{x:-dz*sign,z:dx*sign},leg*100+index);
    }
  }
  const poleGeometry=geometry(new THREE.CylinderGeometry(1,1.5,1,5));
  const poleMaterial=material(new THREE.MeshBasicMaterial({color:0x49322b}));
  const poleMesh=instance(poleGeometry,poleMaterial,poles.length,'sierra-route-poles');
  const flagGeometry=geometry(new THREE.PlaneGeometry(1,1));
  const flagMaterial=material(new THREE.MeshBasicMaterial({color:0xffe3a1,side:THREE.DoubleSide}));
  const flagMesh=instance(flagGeometry,flagMaterial,poles.length,'sierra-route-flags');
  const passObjects=Object.freeze(poles.map(pole => Object.freeze({id:pole.id,
    position:Object.freeze({x:pole.position.x,y:pole.height*.5,z:pole.position.z}),radius:Math.max(20,pole.height*.55)})));

  const mountainGeometry=geometry(new THREE.ConeGeometry(1,1,7));
  const mountainMaterial=material(new THREE.MeshLambertMaterial({color:0x7d706b,flatShading:true}));
  const mountains=[];
  for (const side of [-1,1]) for (let i=0;i<8;i++) {
    const seed=i+12+(side+1)*13;
    const height=700+hash(seed+41)*900;
    mountains.push({position:{x:side*(7500+hash(seed)*1000),y:height/2,z:-7000+i*2000},
      scale:{x:650+hash(seed+5)*500,y:height,z:800+hash(seed+17)*500}});
  }
  const mountainMesh=instance(mountainGeometry,mountainMaterial,mountains.length,'sierra-distant-mountains');
  const half=course.arena?.halfExtent??10000, ceiling=course.arena?.maxAltitude??2000;
  const boundaryGeometry=geometry(new THREE.PlaneGeometry(half*2,ceiling));
  const boundaryMaterial=material(new THREE.MeshBasicMaterial({color:0xd5b593,transparent:true,opacity:.045,depthWrite:false,side:THREE.DoubleSide}));
  const boundaries=[{x:0,z:-half,angle:0},{x:0,z:half,angle:0},{x:-half,z:0,angle:Math.PI/2},{x:half,z:0,angle:Math.PI/2}].map(data=>{
    const mesh=new THREE.Mesh(boundaryGeometry,boundaryMaterial); mesh.name='sierra-advisory-boundary';
    mesh.rotation.y=data.angle; group.add(mesh); return {data,mesh};
  });
  group.traverse(object => {object.userData.collisions=false;});
  const matrix=new THREE.Matrix4(), position=new THREE.Vector3(), rotation=new THREE.Quaternion(), scale=new THREE.Vector3();
  const yAxis=new THREE.Vector3(0,1,0);
  function put(mesh,index,absolute,dimensions,angle=0) {
    position.set(absolute.x-origin.x,absolute.y-origin.y,absolute.z-origin.z);
    scale.set(dimensions.x,dimensions.y,dimensions.z); rotation.setFromAxisAngle(yAxis,angle);
    matrix.compose(position,rotation,scale); mesh.setMatrixAt(index,matrix);
  }
  function sync(nextOrigin,timeSeconds=0,state={activeGateIndex:0}) {
    if (disposed) return;
    syncCount++;
    if (!sameOrigin(origin,nextOrigin)) {
      origin={x:nextOrigin.x,y:nextOrigin.y,z:nextOrigin.z}; rebaseCount++;
      const anchorX=Math.round(origin.x/tile)*tile, anchorZ=Math.round(origin.z/tile)*tile, middle=(count-1)/2;
      phase={x:modulo(origin.x,period)/period,z:modulo(origin.z,period)/period};
      texture.offset.set(phase.x,phase.z);
      for (let z=0;z<count;z++) for (let x=0;x<count;x++) {
        const worldX=anchorX+(x-middle)*tile, worldZ=anchorZ+(z-middle)*tile, index=z*count+x;
        matrix.makeTranslation(worldX-origin.x,-origin.y,worldZ-origin.z); tiles.setMatrixAt(index,matrix);
        tilePhases.setXY(index,modulo(worldX-origin.x,period)/period,modulo(worldZ-origin.z,period)/period);
      }
      tilePhases.needsUpdate=true; tiles.instanceMatrix.needsUpdate=true; groundRebases++;
      for (const {data,mesh} of gates) mesh.position.set(data.center.x-origin.x,data.center.y-origin.y,data.center.z-origin.z);
      for (const {data,mesh} of boundaries) mesh.position.set(data.x-origin.x,ceiling/2-origin.y,data.z-origin.z);
      poles.forEach((pole,index) => {
        put(poleMesh,index,{...pole.position,y:pole.height/2},{x:1,y:pole.height,z:1});
        const dx=Math.cos(pole.angle)*9, dz=-Math.sin(pole.angle)*9;
        put(flagMesh,index,{x:pole.position.x+dx,y:pole.height-5,z:pole.position.z+dz},{x:18,y:10,z:1},pole.angle);
      });
      mountains.forEach((mountain,index) => put(mountainMesh,index,mountain.position,mountain.scale));
      poleMesh.instanceMatrix.needsUpdate=true; flagMesh.instanceMatrix.needsUpdate=true; mountainMesh.instanceMatrix.needsUpdate=true;
    }
    const activeIndex=state.activeGateIndex??0;
    if (activeIndex!==lastGate) {
      gates.forEach(({data,mesh},i) => {mesh.material=i<activeIndex?passedMaterial:data.kind==='exit'?exitMaterial:i===activeIndex?activeMaterial:futureMaterial;});
      lastGate=activeIndex;
    }
  }
  function setVisibility(value) {
    showAssistance=assisted(value); poleMesh.visible=flagMesh.visible=showAssistance;
    boundaries.forEach(({mesh}) => {mesh.visible=showAssistance;});
  }
  setGroundPatternStrength(groundPatternStrength); setVisibility(visibility);
  return {group,sync,setVisibility,setGroundPatternStrength,getPassObjects:()=>showAssistance&&!disposed?passObjects:EMPTY,
    snapshot:()=>({visible:!disposed,origin:origin?{...origin}:null,rebaseCount,syncCount,gateCount:gates.length,
      mountainCount:mountains.length,poleCount:poles.length,geometryCount:disposed?0:geometries.size,
      materialCount:disposed?0:materials.size,ground:{kind:'land',...LAND,strength,patternScales:[320,40,8],
        rebaseCount:groundRebases,updates:groundUpdates,phase:{...phase},textureCount:disposed?0:1,tileCount:disposed?0:count*count,
        mipmaps:texture.generateMipmaps,anisotropy:texture.anisotropy,wind:{x:0,z:0},disposed},disposed}),
    dispose() {
      if (disposed) return; disposed=true;
      for (const mesh of instances) mesh.dispose();
      for (const shape of geometries) shape.dispose();
      for (const paint of materials) paint.dispose();
      texture.dispose(); group.clear();
    },
  };
}
