const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const smooth=v=>v*v*(3-2*v);
const DEG=Math.PI/180;

/** Display rounding only. Internal altitude and accessible descriptions stay in metres. */
export function formatSupersonicAltitude(metres){
  if(!Number.isFinite(metres))return '—';
  return Math.abs(metres)>=1000?`${(metres/1000).toFixed(1)}k`:metres.toFixed(1);
}
export function vaporConeIntensity(mach){
  if(!Number.isFinite(mach)||mach<=.95||mach>=1.05)return 0;
  return smooth(clamp(1-Math.abs(mach-1)/.05,0,1));
}

/** Independent visual curve: no normal speed limit or flight state is changed. */
export function supersonicSpeedPresentation(speed,settings={},afterburner={},timeSeconds=0,camera='overlay'){
  const velocity=clamp(speed,0,680),progress=smooth(velocity/680);
  const maximum=Number.isFinite(settings.speedFov)?clamp(settings.speedFov,0,15):10;
  const active=(afterburner===true||afterburner?.active===true)&&velocity>0;
  const extraFov=maximum*progress+(active?maximum*.3:0),shake={x:0,y:0,z:0};
  if(settings.highSpeedShake!==false){
    const strength=smooth(clamp((velocity-160)/520,0,1));
    const amplitude=(camera==='cockpit'?.025:.1)*DEG*strength;
    const t=Number.isFinite(timeSeconds)?Math.max(0,timeSeconds)%3600:0;
    shake.x=amplitude*(.65*Math.sin(t*17.3)+.35*Math.sin(t*29.7+.4));
    shake.y=amplitude*(.6*Math.sin(t*19.1+1.2)+.4*Math.sin(t*31.3+.2));
    shake.z=amplitude*.45*(.7*Math.sin(t*23.7+.8)+.3*Math.sin(t*37.1));
  }
  return {extraFov,shake};
}
