const freezePoint=point=>Object.freeze({x:point.x,y:point.y,z:point.z});
const finitePoint=point=>point&&[point.x,point.y,point.z].every(Number.isFinite);

export const CENTRAL_TOWER=Object.freeze({id:'central-tower',kind:'tower',label:'TOWER',
  position:freezePoint({x:-36,y:28,z:-18}),height:116});
export const DIRECTION_LANDMARKS=Object.freeze([
  {id:'north',label:'北の三角塔',color:'#2c81b7',shape:'triangle',position:{x:0,y:16,z:-315}},
  {id:'east',label:'東の四角塔',color:'#bf6559',shape:'square',position:{x:295,y:16,z:0}},
  {id:'south',label:'南のひし形',color:'#8b6bb3',shape:'diamond',position:{x:0,y:16,z:315}},
  {id:'west',label:'西のアーチ',color:'#478f73',shape:'arch',position:{x:-295,y:16,z:0}},
].map(landmark=>Object.freeze({...landmark,position:freezePoint(landmark.position)})));

export const STANDARD_ARENA=Object.freeze({id:'standard',
  bounds:Object.freeze({minX:-350,maxX:350,minZ:-350,maxZ:350}),minHeight:2,maxHeight:45,
  landmarks:Object.freeze([CENTRAL_TOWER,...DIRECTION_LANDMARKS.map(landmark=>Object.freeze({
    ...landmark,kind:landmark.shape,label:landmark.id.toUpperCase(),
  }))]),
});

/** Map metadata only. This never changes stage bounds, physics or course data. */
export function getCourseArena(course){
  const arena=course?.arena;if(!arena)return STANDARD_ARENA;
  const bounds=arena.bounds;
  if(!bounds||![bounds.minX,bounds.maxX,bounds.minZ,bounds.maxZ].every(Number.isFinite)
    ||bounds.minX>=bounds.maxX||bounds.minZ>=bounds.maxZ)throw new TypeError('Arena needs finite ordered horizontal bounds');
  const landmarks=(arena.landmarks??[]).map((landmark,index)=>{
    if(!finitePoint(landmark?.position))throw new TypeError('Arena landmark needs a finite position');
    return Object.freeze({...landmark,id:String(landmark.id??`landmark-${index+1}`),label:String(landmark.label??''),position:freezePoint(landmark.position)});
  });
  return Object.freeze({id:String(arena.id??'custom'),bounds:Object.freeze({...bounds}),
    minHeight:Number.isFinite(arena.minHeight)?arena.minHeight:0,
    maxHeight:Number.isFinite(arena.maxHeight)?arena.maxHeight:6000,landmarks:Object.freeze(landmarks)});
}
