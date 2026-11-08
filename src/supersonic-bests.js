export const SUPERSONIC_BESTS_KEY='twist.supersonic-bests.v1';
const keyValid=key=>typeof key==='string'&&/^[a-zA-Z0-9:._-]{1,240}$/.test(key)&&key!=='__proto__';
const rowValid=row=>row&&Number.isFinite(row.seconds)&&row.seconds>0&&typeof row.completedAt==='string';
/** The caller supplies the complete profile/gate/settings fingerprint. Normal PBs are never read or written. */
export function createSupersonicBestStore(storage,{now=()=>new Date().toISOString()}={}){
 const records=new Map();
 try{const data=JSON.parse(storage?.getItem(SUPERSONIC_BESTS_KEY));if(data?.version===1&&data.records&&typeof data.records==='object')for(const [key,row] of Object.entries(data.records))if(keyValid(key)&&rowValid(row))records.set(key,{seconds:row.seconds,completedAt:row.completedAt});}catch{}
 return {
  best(key){return keyValid(key)?records.get(key)?.seconds??null:null;},
  complete(key,seconds){
   if(!keyValid(key)||!Number.isFinite(seconds)||seconds<=0)return null;
   const previousBestSeconds=records.get(key)?.seconds??null,newBest=previousBestSeconds===null||seconds<previousBestSeconds;
   if(newBest)records.set(key,{seconds,completedAt:now()});
   let saved=true;try{if(!storage?.setItem)throw Error('Storage unavailable');storage.setItem(SUPERSONIC_BESTS_KEY,JSON.stringify({version:1,records:Object.fromEntries(records)}));}catch{saved=false;}
   return {courseId:'supersonic',courseKey:key,mode:'flight',seconds,bestSeconds:records.get(key).seconds,previousBestSeconds,newBest,saved};
  },
 };
}
