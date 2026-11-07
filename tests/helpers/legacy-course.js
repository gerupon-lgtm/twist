/** Retain the released route/turn setting for prior-feature comparisons. New defaults have their own course tests. */
export function useLegacyCourse(test){
 test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
   if(!/^https?:$/.test(location.protocol))return;
   const url=new URL(location.href);if(!url.searchParams.has('course')){url.searchParams.set('course','legacy');history.replaceState(null,'',url);}
   try{const parsed=JSON.parse(localStorage.getItem('twist.flight-settings.v1')||'{}'),saved=parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};
    for(const [key,value]of Object.entries({speedUnit:'m/s',speedFov:0,highSpeedShake:false,streakAmount:0}))if(!Object.hasOwn(saved,key))saved[key]=value;
    if(!Object.hasOwn(saved,'turnGravity'))saved.turnGravity=3;
    if(!Object.hasOwn(saved,'radarRange'))saved.radarRange=60;
    localStorage.setItem('twist.flight-settings.v1',JSON.stringify(saved));
   }catch{}
  });
 });
}
