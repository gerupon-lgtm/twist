import {instrumentLayout,normalizeHudLayout} from './instrument-layout.js';
import {viewportInsets} from './viewport-insets.js';
import {convertSpeed,normalizeSpeedUnit} from './speed-units.js';
import {formatSupersonicAltitude} from './supersonic-presentation.js';
import {hudText} from './hud-text.js';
import {getGroundProximity} from './ground-proximity.js';
import {readSharedFlightHud,placeHudBox} from './shared-flight-hud.js';
const $=id=>document.getElementById(id);
const rect=e=>e&&!e.hidden&&e.getClientRects().length?e.getBoundingClientRect():null;
const place=(e,b)=>{Object.assign(e.style,{left:`${b.left}px`,top:`${b.top}px`,width:`${b.width}px`,height:`${b.height}px`});};
const text=(e,s)=>{if(e.textContent!==s)e.textContent=s;};
let mounted=null;
function primary(node,type,stable=false){
 const label=stable?(type==='speed'?'flight-essential-speed-label':'ground-clearance'):'';
 const value=stable?(type==='speed'?'speed-value':'altitude-value'):'';
 node.classList.add('instrument-reading');node.dataset.managedHud='true';
 const body=`<span class="instrument-label"><span${label?` id="${label}"`:''}></span><small${stable&&type==='speed'?' id="speed-unit"':''}></small></span><svg class="instrument-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48"/><path d="M16,82L20,78M80,78L84,82M2,50H7M93,50H98"/></svg><small class="instrument-tick instrument-tick-upper"></small><strong class="instrument-number"${value?` id="${value}"`:''}></strong><small class="instrument-tick instrument-tick-lower"></small>${type==='altitude'?'<svg class="instrument-alt-band" viewBox="0 0 8 100" preserveAspectRatio="none" aria-hidden="true" hidden><path d="M1,0V100"/><rect x="2" width="5"/></svg>':''}${stable&&type==='altitude'?'<span id="ground-height-meter" hidden><i></i></span>':''}`;
 node.innerHTML=stable&&type==='altitude'?`<div id="ground-proximity">${body}</div>`:body;
 return {node,label:node.querySelector('.instrument-label>span'),unit:node.querySelector('.instrument-label>small'),value:node.querySelector('strong'),upper:node.querySelector('.instrument-tick-upper'),lower:node.querySelector('.instrument-tick-lower'),band:node.querySelector('.instrument-alt-band')};
}
function secondary(node,stable=false){
 node.classList.add('instrument-secondary');node.dataset.managedHud='true';
 node.innerHTML=`<span class="instrument-vario-label"${stable?' id="flight-essential-vario-label"':''}>V/S</span><div class="instrument-vario-line"><strong${stable?' id="flight-essential-vario-value"':''}></strong><small>m/s</small></div>`;
 return {node,label:node.querySelector('span'),value:node.querySelector('strong')};
}
/** Keep established reading IDs, but use one positioning model in every flight camera. */
export function createInstrumentHud(){
 if(mounted?.root.isConnected)return mounted;
 const app=$('app'),root=document.createElement('section');root.id='flight-instruments';root.hidden=true;root.setAttribute('aria-label','FLIGHT INSTRUMENTS');
 const frames=[0,1].map(()=>{const e=document.createElement('div');e.className='instrument-frame';e.setAttribute('aria-hidden','true');root.append(e);return e;});
 const slots=Object.fromEntries(['speed','mach','altitude','vario'].map(name=>{const e=document.createElement('div');e.className='instrument-slot';e.id=`instrument-${name}-slot`;root.append(e);return[name,e];}));
 // Auxiliary target/warning messages retain their original source of truth.
 $('flight-essential-hud').append($('flight-essential-details'),$('flight-essential-alert'));
 const speed=[primary($('cockpit-speed'),'speed'),primary($('flight-essential-speed'),'speed',true)];
 const altitude=[primary($('cockpit-altitude'),'altitude'),primary($('flight-essential-altitude'),'altitude',true)];
 const vario=[secondary($('cockpit-vario')),secondary($('flight-essential-vario'),true)];
 for(const r of speed)slots.speed.append(r.node);for(const r of altitude)slots.altitude.append(r.node);for(const r of vario)slots.vario.append(r.node);
 const mach=$('supersonic-mach-g');mach.dataset.managedHud='true';slots.mach.append(mach);app.append(root);app.dataset.instrumentHud='on';$('cockpit-hud').dataset.managedInstruments='true';
 let geometry=null;
 function obstacles(){return !root.hidden&&geometry?[...geometry.groups,...[$('flight-essential-details'),$('flight-essential-alert')].map(rect).filter(Boolean)]:[];}
 function update(state,{phase,mode,camera,settings,language='en',heightGuide=null}={}){
  root.hidden=phase!=='running';app.dataset.hudLayout=normalizeHudLayout(settings.hudLayout);
  if(root.hidden){geometry=null;return;}
  const flight=mode==='flight',cockpit=flight&&camera==='cockpit',index=cockpit?0:1,sonic=Boolean(state.supersonic),layout=app.dataset.hudLayout;
  for(let i=0;i<2;i++)for(const group of [speed,altitude,vario])group[i].node.hidden=i!==index;
  const unit=normalizeSpeedUnit(settings.speedUnit),spd=convertSpeed(state.speed,unit),alt=sonic?(state.altitude??state.position.y):state.groundClearance;
  const altText=sonic?formatSupersonicAltitude(alt):Number.isFinite(alt)?alt.toFixed(1):'—';
  const step=unit==='km/h'?10:unit==='kt'?5:2,base=Math.round(spd/step)*step;
  for(const r of speed){text(r.label,hudText(language,'speed'));text(r.unit,unit);text(r.value,spd.toFixed(1));text(r.upper,String(base+step));text(r.lower,String(Math.max(0,base-step)));}
  const altStep=sonic?(alt>=1000?100:20):5,altBase=Math.round(alt/altStep)*altStep,display=n=>sonic?formatSupersonicAltitude(n):String(n);
  for(const r of altitude){text(r.label,hudText(language,'altitude'));text(r.unit,'m');text(r.value,altText);text(r.upper,display(altBase+altStep));text(r.lower,display(Math.max(0,altBase-altStep)));r.node.setAttribute('aria-label',`ALT ${Number.isFinite(alt)?alt.toFixed(1):'—'} m`);r.band.hidden=!heightGuide;if(heightGuide){const band=r.band.querySelector('rect');band.setAttribute('y',heightGuide.scale.upperY);band.setAttribute('height',Math.max(1,heightGuide.scale.lowerY-heightGuide.scale.upperY));}}
  const v=Number.isFinite(state.verticalSpeed)?state.verticalSpeed:0;
  const proximity=getGroundProximity({altitude:state.groundClearance,verticalSpeed:v,grounded:state.grounded});for(const r of altitude)r.node.dataset.groundLevel=proximity.level;
  for(const r of vario){text(r.label,`${v>.1?'↑':v<-.1?'↓':'↔'} ${language==='ja'?'昇降':'V/S'}`);text(r.value,`${v>=0?'+':''}${v.toFixed(1)}`);r.node.dataset.direction=v>.1?'up':v<-.1?'down':'level';r.node.setAttribute('aria-label',`V/S ${v.toFixed(1)} m/s`);}
  mach.hidden=!sonic;slots.mach.hidden=!sonic&&layout==='b';slots.vario.hidden=!flight;
  const safe=viewportInsets(),nav=document.querySelector('.navigation').getBoundingClientRect();
  const details=$('flight-essential-details'),alert=$('flight-essential-alert');details.hidden=cockpit||$('flight-essential-height').hidden;
  Object.assign(details.style,{left:`${innerWidth-safe.right-116}px`,top:`${nav.bottom+12}px`,width:'104px'});
  const shared=readSharedFlightHud();if(shared)placeHudBox(details,shared.targetHeight);else details.style.height='';
  const controls=[$('bottom-panel'),$('practice-panel')].map(rect).filter(Boolean);
  const view=rect($('start-flow-view-button'));if(shared&&view&&!controls.some(r=>view.left>=r.left&&view.right<=r.right&&view.top>=r.top&&view.bottom<=r.bottom))controls.push(view);
  Object.assign(alert.style,{left:`${innerWidth-safe.right-116}px`,top:`${details.hidden?nav.bottom+12:details.getBoundingClientRect().bottom+6}px`,width:'104px',transform:'none'});
  const upper=[$('radar'),details,alert].map(rect).filter(Boolean);
  if(shared)upper.push(shared.heading,shared.targetHeight);else{const view=rect($('start-flow-view-button'));if(view)upper.push(view);}
  let legend=shared?.legend??rect($('cockpit-power'));
  if(shared?.legendInUpper){upper.push(shared.legend);legend=null;}
  geometry=instrumentLayout({width:innerWidth,height:innerHeight,safe,top:nav.bottom+10,upper,controls,legend,layout,sonic,vario:flight,focusY:shared?.focusY??(camera==='chase'?innerHeight*.28:innerHeight/2),bandAcross:Boolean(shared&&innerWidth>=600&&innerHeight<=500&&app.dataset.flowInputMethod==='practice')});
  root.dataset.layout=layout;root.dataset.compact=String(geometry.compact);root.dataset.columns=String(geometry.columns);
  for(const name of ['speed','altitude','vario','mach'])if(geometry[name])place(slots[name],geometry[name]);
  for(let i=0;i<frames.length;i++){frames[i].hidden=!geometry.groups[i]||layout==='c';if(geometry.groups[i])place(frames[i],geometry.groups[i]);}
  const available=geometry.speed.width*(layout==='c'?.88:1)-(layout==='a'?14:10),maxLength=Math.max(spd.toFixed(1).length,altText.length);
  root.style.setProperty('--instrument-number-size',`${Math.min(layout==='b'&&geometry.compact?20:22,Math.floor(available/(.68*maxLength)))}px`);
  root.dataset.geometry=JSON.stringify(geometry);
 }
 return mounted={update,obstacles,root};
}
