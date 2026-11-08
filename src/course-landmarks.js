import * as THREE from 'three';
/** Seven bounded non-colliding flags. Stage owns geometry/material disposal. */
export function createCoursePointFlags(course,surface){
 const group=new THREE.Group(),textures=[],landmarks=[];group.name='course-point-flags';group.userData.collisions=false;
 const positions=[...course.lights,course.exit];
 positions.forEach((position,index)=>{
  const name=course.pointNames[index],x=position.x+9,z=position.z+9,ground=surface.heightAt(x,z);
  landmarks.push(Object.freeze({id:'sierra-'+name,label:name,pointName:name,kind:'point-flag',position:Object.freeze({x,y:ground+8,z})}));
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,8,6),new THREE.MeshBasicMaterial({color:0x4c7280,fog:false}));stem.position.set(x,ground+4,z);group.add(stem);
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const context=canvas.getContext('2d');context.fillStyle='#f7fbf9';context.fillRect(0,0,128,128);context.strokeStyle='#25485a';context.lineWidth=6;context.strokeRect(3,3,122,122);context.fillStyle='#25485a';context.font='bold 86px sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillText(name,64,69);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
  const flag=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,fog:false,depthWrite:false}));flag.position.set(x,ground+8,z);flag.scale.set(5,5,1);flag.name='course-point-'+name;group.add(flag);
 });
 return {group,landmarks:Object.freeze(landmarks),disposeTextures(){textures.forEach(texture=>texture.dispose());}};
}
