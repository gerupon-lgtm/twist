import * as THREE from 'three';
export function createExitBeacon() {
  const group=new THREE.Group();group.name='assisted-exit';
  const material=new THREE.MeshBasicMaterial({color:0xffe66a,transparent:true,opacity:.35,fog:false});
  const ringGeometry=new THREE.TorusGeometry(3.1,.19,8,48);
  const rings=Array.from({length:3},(_,i)=>{const mesh=new THREE.Mesh(ringGeometry,material);if(i===1)mesh.rotation.y=Math.PI/2;if(i===2)mesh.rotation.x=Math.PI/2;group.add(mesh);return mesh;});
  const column=new THREE.Mesh(new THREE.CylinderGeometry(.14,.22,7,8),new THREE.MeshBasicMaterial({color:0xffee85,transparent:true,opacity:.5,depthWrite:false,fog:false}));column.position.y=-3.5;group.add(column);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const ctx=canvas.getContext('2d');
  ctx.strokeStyle='#5f4810';ctx.lineWidth=11;ctx.beginPath();ctx.arc(48,48,35,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#fff7a5';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(48,10);ctx.lineTo(86,48);ctx.lineTo(48,86);ctx.lineTo(10,48);ctx.closePath();ctx.stroke();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false,sizeAttenuation:false,fog:false}));halo.renderOrder=9;group.add(halo);
  let open=false,assisted=false;
  return {group,
    update({visible,unlocked,time=0,fov=64,height=844}){
      assisted=visible;open=unlocked;group.visible=assisted;column.visible=halo.visible=assisted&&open;
      const pulse=1+.045*Math.sin(time*4);for(const ring of rings)ring.scale.setScalar(open?pulse:1);
      material.opacity=open?1:.28;material.color.setHex(open?0xffed7a:0xc7b579);
      const size=42*2*Math.tan(THREE.MathUtils.degToRad(fov)/2)/Math.max(1,height);halo.scale.set(size,size,1);halo.material.opacity=.85+.15*Math.sin(time*4);
    },
    snapshot:()=>({assisted,open,rings:assisted?3:1,color:assisted?(open?'#ffed7a':'#c7b579'):null,minPixels:assisted&&open?30:0,column:assisted&&open}),
    dispose(){texture.dispose();},
  };
}
