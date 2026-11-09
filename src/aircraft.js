import * as THREE from 'three';

/** Original, procedural twin-engine jet. Nose -Z, right +X, top +Y; no external assets. */
export function createAircraft() {
  const group = new THREE.Group(); group.name = 'original-twin-jet';
  const pale = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors:true, roughness: .55, metalness: .2 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x263d50, roughness: .65, metalness: .3 });
  const canopy = new THREE.MeshStandardMaterial({ color: 0x305869, roughness: .2, metalness: .55 });
  const nozzle = new THREE.MeshStandardMaterial({ color: 0x101f2b, roughness: .6, metalness: .6 });
  const flame = new THREE.MeshBasicMaterial({ color: 0x93e5ff, transparent: true, opacity: .8, depthWrite: false });
  const mesh = (geometry, material, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const item = new THREE.Mesh(geometry, material); item.position.set(x, y, z); item.scale.set(sx, sy, sz);
    group.add(item); return item;
  };
  // Slender, blended fighter body. Cross sections run along the nose/tail axis.
  const sections=[[-2.05,.215,.19],[-1.5,.27,.22],[-.65,.35,.25],[.65,.4,.24],[1.55,.3,.19],[2.0,.17,.13]];
  const bodyPositions=[],bodyIndices=[],segments=12;
  for(const [z,w,h]of sections)for(let i=0;i<segments;i++){const angle=i*Math.PI*2/segments;bodyPositions.push(Math.cos(angle)*w,Math.sin(angle)*h,z);}
  for(let r=0;r<sections.length-1;r++)for(let i=0;i<segments;i++){const a=r*segments+i,b=r*segments+(i+1)%segments,c=a+segments,d=b+segments;bodyIndices.push(a,b,c,b,d,c);}
  const body=new THREE.BufferGeometry();body.setAttribute('position',new THREE.Float32BufferAttribute(bodyPositions,3));body.setIndex(bodyIndices);body.computeVertexNormals();mesh(body,pale,0,0,0);
  const nose = mesh(new THREE.ConeGeometry(.215, .95, 12), dark, 0, -.015, -2.425);
  nose.rotation.x = -Math.PI / 2;
  const cockpit=mesh(new THREE.SphereGeometry(1, 12, 8), canopy, 0, .275, -1.12, .19, .19, .64);cockpit.name='fighter-canopy';
  function plate(points, material, y = 0) {
    const shape = new THREE.Shape(points.map(([x,z]) => new THREE.Vector2(x,-z)));
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: .075, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2); geometry.translate(0, y, 0);
    group.add(new THREE.Mesh(geometry, material));
  }
  for (const side of [-1,1]) {
    plate([[side*.19,-1.9],[side*.64,-.7],[side*.83,.65],[side*.25,.8]], pale, .02);
    plate([[side*.35,-.7],[side*2.05,.85],[side*1.9,1.3],[side*.45,.9]], pale);
    plate([[side*.35,1.15],[side*1.25,1.85],[side*1.05,2.1],[side*.32,1.85]], pale, .1);
    const engine = mesh(new THREE.CylinderGeometry(.29,.32,2.6,12), pale, side*.48,-.16,.62);
    engine.rotation.x = Math.PI / 2;
    const port = mesh(new THREE.CylinderGeometry(.24,.29,.38,12,1,true), nozzle, side*.48,-.16,2.05);
    port.rotation.x = Math.PI / 2;
    // Dark inset hides the pale cylinder cap and makes both exhausts readable.
    const inset=mesh(new THREE.CircleGeometry(.239,12),nozzle,side*.48,-.16,2.235);inset.name='dark-exhaust-inset';
    const finShape = new THREE.Shape([new THREE.Vector2(-.75,0),new THREE.Vector2(-1.3,.95),
      new THREE.Vector2(-1.7,1.1),new THREE.Vector2(-2.05,.05)]);
    const fin = mesh(new THREE.ExtrudeGeometry(finShape,{depth:.07,bevelEnabled:false}),pale,side*.53,.05,0);
    fin.rotation.y = Math.PI / 2; fin.rotateX(side * .18);
  }
  // Broad blue/grey camouflage, baked once into vertex colours. No textures or
  // overlapping decals are needed, so the finish stays stable at long range.
  group.updateMatrixWorld(true);
  const point=new THREE.Vector3(),colours=[0xdce7eb,0x8bb9cd,0xb2cbd7].map(c=>new THREE.Color(c));
  group.traverse(item=>{
    if(item.material!==pale)return;
    const geometry=item.geometry.index?item.geometry.toNonIndexed():item.geometry,position=geometry.getAttribute('position'),colors=new Float32Array(position.count*3);
    for(let i=0;i<position.count;i++){
      point.fromBufferAttribute(position,i).applyMatrix4(item.matrixWorld);
      const band=Math.sin(point.z*2.4+point.x*1.8)+.38*Math.cos(point.x*4-point.z);
      colours[band>.55?0:band<-.4?1:2].toArray(colors,i*3);
    }
    if(geometry!==item.geometry)item.geometry.dispose();item.geometry=geometry;geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  });
  const exhaust = [-1,1].map(side => {
    const item = mesh(new THREE.ConeGeometry(.2,1,10),flame,side*.48,-.16,2.25);
    item.rotation.x = Math.PI / 2; return item;
  });
  // Supersonic presentation only. Ordinary-course exhaust stays unchanged.
  const sonicPlume=new THREE.Group();sonicPlume.name='supersonic-engine-plumes';group.add(sonicPlume);
  const outerFlame=new THREE.MeshBasicMaterial({color:0xff9e45,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  const coreFlame=new THREE.MeshBasicMaterial({color:0xd8f0ff,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  const blueFlame=new THREE.MeshBasicMaterial({color:0x688fff,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  const plumeGeometry=new THREE.ConeGeometry(1,1,16),diamondGeometry=new THREE.OctahedronGeometry(1,0);
  const plumeParts=[];
  for(const side of [-1,1]){
    const engine=new THREE.Group();engine.position.set(side*.48,-.16,2.2);sonicPlume.add(engine);
    for(const [material,radius,length]of [[outerFlame,.4,1],[blueFlame,.24,.8],[coreFlame,.11,.5]]){
      const plume=new THREE.Mesh(plumeGeometry,material);plume.rotation.x=Math.PI/2;plume.scale.set(radius,length,radius);plume.position.z=length/2;engine.add(plume);
    }
    for(let i=0;i<4;i++){
      const diamond=new THREE.Mesh(diamondGeometry,coreFlame);diamond.scale.set(.11-i*.012,.11-i*.012,.12);diamond.position.z=.22+i*.18;engine.add(diamond);
    }
    plumeParts.push(engine);
  }
  let power = 0, afterburnerActive=false;
  let sonicAmount=0,sonicLength=0;
  function setPower(value,afterburner=false,sonic={}) {
    power = THREE.MathUtils.clamp(Number.isFinite(value) ? value : 0,0,1);
    afterburnerActive=afterburner===true&&power>0;
    flame.opacity = afterburnerActive ? .82+.18*power : .3 + .65 * power;
    flame.color.setHex(afterburnerActive?0xfff0b0:0x93e5ff);
    exhaust.forEach(item => { item.visible = power > 0; item.scale.set(afterburnerActive?1.55:1,(.15 + 1.35*power)*(afterburnerActive?2.1:1),afterburnerActive?1.55:1);
      item.position.z = 2.2 + item.scale.y / 2; });
    sonicAmount=THREE.MathUtils.clamp(((sonic.mach??0)-1)/.06,0,1);
    sonicPlume.visible=sonicAmount>0&&power>0;
    const time=Number.isFinite(sonic.timeSeconds)?sonic.timeSeconds:0;
    const flicker=1+.035*Math.sin(time*37)+.02*Math.sin(time*61);
    sonicLength=(1.5+3.8*power)*(afterburnerActive?1.3:1)*flicker;
    for(const engine of plumeParts)engine.scale.set(1+.12*Math.sin(time*29),1,sonicLength);
    outerFlame.opacity=.6*sonicAmount;blueFlame.opacity=.65*sonicAmount;coreFlame.opacity=.9*sonicAmount;
    if(sonicPlume.visible)exhaust.forEach(item=>{item.visible=false;});
  }
  setPower(0);
  return { group, setPower, diagnostics: () => ({ engines: 2, power, exhaustVisible: power > 0,
    exhaustLength: power > 0 ? (.15+1.35*power)*(afterburnerActive?2.1:1) : 0,
    exhaustOpacity: power > 0 ? flame.opacity : 0, afterburner:afterburnerActive,
    sonicExhaust:sonicPlume.visible,sonicExhaustLength:sonicPlume.visible?sonicLength:0,
    sonicExhaustColors:{core:coreFlame.color.getHex(),outer:outerFlame.color.getHex(),blue:blueFlame.color.getHex()} }) };
}
