import * as THREE from 'three';
import {surfacePhase} from './origin.js';

export const SUPERSONIC_SEA=Object.freeze({tileMetres:16384,tilesPerAxis:9,repeatMetres:128,fineMetres:8,textureSize:512});
const clamp=value=>Math.max(0,Math.min(1,value));
export function seaPatternPixel(x,z,strength=.8){
  const coarse=Math.sin(x/128*Math.PI*2+Math.sin(z/128*Math.PI*2)*.65);
  const fine=Math.sin((x+z*.5)/8*Math.PI*2)*Math.cos(z/8*Math.PI*2);
  // All periods divide 128, so neighbouring world tiles share the same texture.
  const delta=(coarse*13+fine*4)*clamp(strength);
  return [42+delta*.6,111+delta,143+delta*1.12].map(value=>Math.round(value));
}

/** Bounded ocean sheet. Geometry and UVs are local; phase follows world metres. */
export function createSupersonicSea({maxAnisotropy=1,strength=.8}={}){
  const {tileMetres:tile,tilesPerAxis:count,textureSize:size,repeatMetres:period}=SUPERSONIC_SEA;
  const pixels=new Uint8Array(size*size*4),texture=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);
  texture.name='supersonic-sea-pattern';texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;
  texture.anisotropy=Math.max(1,Math.min(8,Math.floor(maxAnisotropy||1)));
  const geometry=new THREE.PlaneGeometry(tile,tile);geometry.rotateX(-Math.PI/2);
  const positions=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
  for(let i=0;i<positions.count;i++)uv.setXY(i,positions.getX(i)/period,positions.getZ(i)/period);
  const material=new THREE.MeshBasicMaterial({map:texture,color:0xffffff,fog:true,side:THREE.DoubleSide});
  const group=new THREE.Group();group.name='supersonic-sea';group.userData.collisions=false;
  const tiles=new THREE.InstancedMesh(geometry,material,count*count);tiles.name='world-anchored-ocean-tiles';tiles.frustumCulled=false;group.add(tiles);
  const matrix=new THREE.Matrix4();let setting=null,updates=0,rebaseCount=0,disposed=false,lastOrigin=null,phase={x:0,z:0},lastTime=0;
  const wind={x:.7,z:.2};
  function setStrength(value){
    if(disposed||!Number.isFinite(value))return false;
    const next=clamp(value);if(next===setting)return false;setting=next;
    for(let z=0;z<size;z++)for(let x=0;x<size;x++){
      const rgb=seaPatternPixel((x+.5)/size*period,(z+.5)/size*period,next),at=(z*size+x)*4;
      pixels[at]=rgb[0];pixels[at+1]=rgb[1];pixels[at+2]=rgb[2];pixels[at+3]=255;
    }
    texture.needsUpdate=true;updates++;return true;
  }
  function sync(origin,timeSeconds=0){
    if(disposed)return;
    if(!lastOrigin||['x','y','z'].some(axis=>lastOrigin[axis]!==origin[axis])){
      const middle=(count-1)/2,anchorX=Math.round(origin.x/tile)*tile,anchorZ=Math.round(origin.z/tile)*tile;
      for(let z=0;z<count;z++)for(let x=0;x<count;x++){
        // CPU subtraction precedes the Float32 instanceMatrix upload.
        matrix.makeTranslation(anchorX+(x-middle)*tile-origin.x,-origin.y,anchorZ+(z-middle)*tile-origin.z);
        tiles.setMatrixAt(z*count+x,matrix);
      }
      tiles.instanceMatrix.needsUpdate=true;lastOrigin={...origin};rebaseCount++;
    }
    lastTime=timeSeconds;phase=surfacePhase(origin,period,timeSeconds,wind);texture.offset.set(phase.x,phase.z);
  }
  function dispose(){if(disposed)return;disposed=true;group.remove(tiles);tiles.dispose();geometry.dispose();material.dispose();texture.dispose();}
  setStrength(strength);
  return {group,tiles,texture,material,sync,setStrength,dispose,
    snapshot:()=>({...SUPERSONIC_SEA,strength:setting,updates,rebaseCount,phase:{...phase},timeSeconds:lastTime,
      mipmaps:texture.generateMipmaps,anisotropy:texture.anisotropy,textureCount:disposed?0:1,tileCount:disposed?0:count*count,
      coverageMetres:tile*count,wind:{...wind},disposed})};
}
