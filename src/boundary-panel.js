import {stageBoundaryStatus,STAGE_HALF_EXTENT} from './boundary.js';
import {placeGuidanceCenter} from './guidance-layout.js';
import {normalizeHudLanguage} from './hud-text.js';
import {formatNavigationDistance} from './supersonic-units.js';

const $=id=>document.getElementById(id);
const show=(element,visible)=>element?.toggleAttribute('hidden',!visible);
const text=(id,value)=>{const element=$(id);if(element&&element.textContent!==value)element.textContent=value;};
const rectangle=element=>element&&!element.hasAttribute('hidden')&&element.getClientRects().length?element.getBoundingClientRect():null;
const bounds=(point,width,height)=>({left:point.x-width/2,right:point.x+width/2,top:point.y-height/2,bottom:point.y+height/2});
function hide(){
 show($('stage-boundary-warning'),false);const app=$('app');
 if(app){app.dataset.boundaryWarning='clear';delete app.dataset.boundaryReturnBearing;}
}
function obstacles(){
 const ids=['start-flow-view-button','radar','flight-essential-speed','flight-essential-altitude','bottom-panel','practice-panel','cockpit-speed','cockpit-altitude','cockpit-vario','cockpit-heading',
  'cockpit-target-height','cockpit-exit-notice','cockpit-power','target-edge-marker','cockpit-objective-label',
  'guidance-director','guidance-flight-path','guidance-target-point','guidance-edge-arrow','guidance-edge-label',
  'guidance-next-notice','guidance-heading','guidance-status','toast'];
 return [...ids.map(id=>rectangle($(id))),...['.navigation','.topbar .brand','.topbar .version','.topbar .feedback-metrics','.topbar .mode-tag']
  .map(selector=>rectangle(document.querySelector(selector)))].filter(Boolean);
}
/** Passive warning, called after guidance layout. No flight control is changed. */
export function updateBoundaryPanel(state,{phase='running',settings={},extraObstacles=[]}={}){
 const root=$('stage-boundary-warning'),app=$('app');
 if(!root||phase!=='running'||state?.complete){hide();return null;}
 const supplied=state?.boundary;
 const status=supplied&&Number.isFinite(supplied.clearance)&&typeof supplied.near==='boolean'&&typeof supplied.outside==='boolean'
  ?supplied:stageBoundaryStatus(state?.position,{heading:state?.heading,speed:state?.speed,velocity:state?.velocity,
    turnGravity:settings?.turnGravity??state?.turnGravity,maxBank:settings?.maxBank,
    halfExtent:state?.stageHalfExtent??state?.halfExtent??STAGE_HALF_EXTENT});
 if(!status){hide();return null;}
 const ceiling=Boolean(state.supersonic&&status.upperNear),horizontal=status.near&&Number.isFinite(status.returnBearingDeg);
 const level=ceiling?(status.above?'outside':'near'):status.level;
 root.dataset.level=level;root.dataset.clearance=String(status.clearance);
 root.dataset.motion=status.motion??'unknown';
 if(app)app.dataset.boundaryWarning=level;
 if(!ceiling&&!horizontal){show(root,false);if(app)delete app.dataset.boundaryReturnBearing;return {...status,visible:false,panel:null};}
 const language=normalizeHudLanguage(settings?.hudLanguage),width=innerWidth,height=innerHeight;
 const style=getComputedStyle(document.documentElement);
 const left=Math.max(0,parseFloat(style.getPropertyValue('--screen-safe-left'))||0);
 const right=Math.max(0,parseFloat(style.getPropertyValue('--screen-safe-right'))||0);
 const area={left:left+12,right:width-right-12,top:12,bottom:height-12},avoid=[...obstacles(),...extraObstacles];
 const nav=rectangle(document.querySelector('.navigation'));
 const preferred={x:width/2,y:Math.max((nav?.bottom??40)+32,height*.23)};
 let placement=null,panelWidth=0,panelHeight=0;
 for(const [w,h]of [[240,52],[180,44],[136,40]]){
  const fit=placeGuidanceCenter(preferred,area,avoid,{width:w,height:h,padding:7});
  if(fit){placement=fit;panelWidth=w;panelHeight=h;break;}
 }
 if(!placement){show(root,false);if(app)delete app.dataset.boundaryReturnBearing;return {...status,visible:false,panel:null,reason:'no-free-area'};}
 const panel=bounds(placement,panelWidth,panelHeight),outside=status.outside;
 const distance=Math.round(outside?Math.max(0,-status.clearance):Math.max(0,status.clearance));
 const distanceText=formatNavigationDistance(distance,Boolean(state.supersonic));
 text('boundary-title',ceiling&&!horizontal?(language==='ja'?'上端へ接近':'CEILING'):language==='ja'?(outside?'内側へ戻る':'嵐に接近'):(outside?'TURN BACK':'STORM'));
 text('boundary-detail',ceiling?(language==='ja'?`下降してください・高度${Math.round(state.altitude)}m`:`DESCEND · ${(state.altitude/1000).toFixed(1)}k`):language==='ja'?(outside?`外側 ${distanceText}`:`境界まで ${distanceText}`):(outside?`STORM · ${distanceText} OUT`:`TURN BACK · ${distanceText}`));
 const arrow=$('boundary-return-arrow');if(arrow)arrow.style.transform=`rotate(${ceiling&&!horizontal?180:status.returnBearingDeg}deg)`;
 root.dataset.returnBearing=String(status.returnBearingDeg);root.dataset.compact=String(panelWidth<240);root.dataset.hudLanguage=language;
 root.setAttribute('aria-label',ceiling?(language==='ja'?`上端の境界。高度${state.altitude}m、下降してください。`:`CEILING. DESCEND. ALT ${state.altitude} m.`):language==='ja'?`嵐の境界。${outside?'内側へ戻ってください。':'境界に接近しています。'}矢印の方向へ。`:`STORM. TURN BACK. ${distance}m${outside?' OUT':''}.`);
 Object.assign(root.style,{left:`${panel.left}px`,top:`${panel.top}px`,width:`${panelWidth}px`,height:`${panelHeight}px`});show(root,true);
 if(app){if(horizontal)app.dataset.boundaryReturnBearing=String(status.returnBearingDeg);else delete app.dataset.boundaryReturnBearing;}
 return {...status,visible:true,panel};
}
