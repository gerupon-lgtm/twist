import * as THREE from 'three';

export const GROUND_PATTERN=Object.freeze({repeatMetres:64,coarseMetres:16,fineMetres:4,textureSize:512,coverageMetres:20000});
const BASE=[154,80,47],clamp=value=>Math.max(0,Math.min(1,value));
const modulo=(value,size)=>((value%size)+size)%size;
const deltaAt=(x,z)=>{
  const coarse=(Math.floor(x/16)+Math.floor(z/16))%2===0?17:-12;
  const fine=(Math.floor(x/4)+Math.floor(z/4))%2===0?5:-4;
  const edge=Math.min(modulo(x,16),modulo(z,16))<.25?-27:Math.min(modulo(x,4),modulo(z,4))<.125?10:0;
  return coarse+fine+edge;
};
/** World metres, so the island and the outer sheet share the same pattern. */
export function groundPatternPixel(x,z,strength=.8){
  const s=Number.isFinite(strength)?clamp(strength):.8;
  const delta=deltaAt(x,z)*s;
  return BASE.map((value,index)=>Math.round(value+delta*[1,.92,.72][index]));
}

/** One repeating image replaces hundreds of central-only paving boxes. */
export function createGroundPattern({maxAnisotropy=1,strength=.8}={}){
  const {textureSize:size,repeatMetres}=GROUND_PATTERN;
  const pixels=new Uint8Array(size*size*4);
  const texture=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);
  texture.name='assisted-world-ground-pattern';texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
  texture.generateMipmaps=true;
  texture.anisotropy=Math.max(1,Math.min(8,Math.floor(Number.isFinite(maxAnisotropy)?maxAnisotropy:1)));
  const material=new THREE.MeshBasicMaterial({color:0xffffff,map:texture,fog:false});
  let setting=null,updates=0,disposed=false;
  function setStrength(value){
    if(disposed||!Number.isFinite(value))return false;
    const next=clamp(value);if(next===setting)return false;
    setting=next;
    for(let z=0;z<size;z++)for(let x=0;x<size;x++){
      const delta=deltaAt((x+.5)/size*repeatMetres,(z+.5)/size*repeatMetres)*next,offset=(z*size+x)*4;
      pixels[offset]=Math.round(BASE[0]+delta);pixels[offset+1]=Math.round(BASE[1]+delta*.92);
      pixels[offset+2]=Math.round(BASE[2]+delta*.72);pixels[offset+3]=255;
    }
    texture.needsUpdate=true;updates++;return true;
  }
  setStrength(Number.isFinite(strength)?strength:.8);
  function applyWorldUV(mesh){
    const positions=mesh.geometry.getAttribute('position'),uv=mesh.geometry.getAttribute('uv');
    for(let i=0;i<positions.count;i++)uv.setXY(i,
      (positions.getX(i)*mesh.scale.x+mesh.position.x)/repeatMetres,
      (-positions.getY(i)*mesh.scale.y+mesh.position.z)/repeatMetres);
    uv.needsUpdate=true;
  }
  const snapshot=()=>({...GROUND_PATTERN,strength:setting,updates,mipmaps:texture.generateMipmaps,
    minFilter:'linear-mipmap-linear',anisotropy:texture.anisotropy,repeatWrapping:true,
    coverage:{minX:-10000,maxX:10000,minZ:-10000,maxZ:10000},textureCount:1});
  function dispose(){if(disposed)return;disposed=true;texture.dispose();material.dispose();}
  return {texture,material,setStrength,applyWorldUV,snapshot,dispose};
}
