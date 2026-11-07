import {Vector3} from 'three';
import {computeDirectionGuidance,headingTargetCue,trueScreenEdge} from './guidance.js';
import {createGuidanceProjection,placeGuidanceCenter,guidanceDirectionAllowed,guidanceSafeDirections} from './guidance-layout.js';
import {advanceGuidanceTurn} from './guidance-stability.js';
import {normalizeHudLanguage,hudText,hudTargetLabel,hudHeightDelta} from './hud-text.js';

const DEG=180/Math.PI;
const FLAG_NAMES=['flightDirector','targetHeadingCue','edgeGuidance','nextTargetNotice','audioGuidance'];
const $=id=>document.getElementById(id);
const show=(element,visible)=>element?.toggleAttribute('hidden',!visible);
const text=(id,value)=>{const e=$(id);if(e&&e.textContent!==value)e.textContent=value;};
const move=(element,x,y)=>{if(element)Object.assign(element.style,{left:`${x}px`,top:`${y}px`});};
const transform=(element,x,y,rotation=0)=>element?.setAttribute('transform',`translate(${x} ${y}) rotate(${rotation})`);
const vector=v=>v&&[v.x,v.y,v.z].every(Number.isFinite)?new Vector3(v.x,v.y,v.z):null;
const plain=v=>({x:v.x,y:v.y,z:v.z});
const wrap=degrees=>((degrees+180)%360+360)%360-180;
const validCount=n=>Number.isInteger(n)&&n>=0&&n<=3;
const rect=element=>element&&!element.hasAttribute('hidden')&&element.getClientRects().length?element.getBoundingClientRect():null;
const box=(point,width,height)=>({left:point.x-width/2,right:point.x+width/2,top:point.y-height/2,bottom:point.y+height/2});
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
let history=null;

function clear(){
  history=null;show($('guidance-panel'),false);
  const toast=$('toast');if(toast){toast.style.left='';toast.style.top='';toast.style.transform='';}
  const panel=$('guidance-panel');if(panel){delete panel.dataset.guidanceDirection;delete panel.dataset.aligned;delete panel.dataset.guidanceReady;}
  const app=$('app');if(app){delete app.dataset.guidanceEdge;delete app.dataset.guidanceDirector;
    delete app.dataset.guidanceDirection;delete app.dataset.guidanceAligned;delete app.dataset.guidanceReady;}
}
function obstacleRects(camera){
  const ids=['radar','bottom-panel','practice-panel','cockpit-speed','cockpit-altitude','cockpit-vario',
    'cockpit-heading','cockpit-target-height','cockpit-exit-notice','cockpit-power','target-edge-marker','cockpit-objective-label'];
  if(camera!=='cockpit')ids.push('toast');
  return [...ids.map(id=>rect($(id))),rect(document.querySelector('.navigation')),...['.topbar .brand','.topbar .version','.topbar .feedback-metrics'].map(selector=>rect(document.querySelector(selector)))].filter(Boolean);
}
function preferredPoint(projected,width,height){
  if(projected?.inFront&&Number.isFinite(projected.x)&&Number.isFinite(projected.y))return {x:projected.x,y:projected.y};
  return projected&&trueScreenEdge(projected.local,width,height,18)||{x:width/2,y:height/2};
}
function safeBounds(width,height){
  const style=getComputedStyle(document.documentElement);
  const left=Math.max(0,parseFloat(style.getPropertyValue('--screen-safe-left'))||0);
  const right=Math.max(0,parseFloat(style.getPropertyValue('--screen-safe-right'))||0);
  return {left:left+12,right:width-right-12,top:12,bottom:height-12};
}
function directionWords(bearing,height,language='en'){
  const angle=Math.round(Math.abs(bearing)),meters=Math.round(Math.abs(height));
  if(language==='en'){
    const arrows=['↑','↗','→','↘','↓','↙','←','↖'];
    const arrow=arrows[((Math.round(bearing/45)%8)+8)%8];
    return `${arrow}${angle?`${angle}°`:''} · ${hudHeightDelta(height,language,{digits:0})}`;
  }
  return `${angle<1?'正面':`${bearing<0?'左':'右'}${angle}°`}・${meters<1?'同じ高さ':`${height<0?'下':'上'}${meters}m`}`;
}
function placeHeading(camera,bearing,heading,bounds,obstacles,language){
  const element=$('guidance-heading'),scale=$('guidance-heading-scale'),pointer=$('guidance-heading-pointer');
  let area=camera==='cockpit'?rect($('cockpit-heading')):null;
  if(camera!=='cockpit'){
    const nav=rect(document.querySelector('.navigation'));
    const center=placeGuidanceCenter({x:innerWidth/2,y:(nav?.bottom??54)+24},bounds,obstacles,{width:180,height:28});
    if(center)area=box(center,180,28);
  }
  if(!area){show(element,false);return null;}
  const width=area.right-area.left,height=area.bottom-area.top;
  const cue=headingTargetCue(bearing,{spanDegrees:10,width:Math.max(1,width-16)});
  if(!cue){show(element,false);return null;}
  show(element,true);show(scale,camera!=='cockpit');element.dataset.camera=camera;
  move(element,area.left,area.top);Object.assign(element.style,{width:`${width}px`,height:`${height}px`});
  const center=((Math.round(heading)%360)+360)%360;
  text('guidance-heading-scale',`${(center+350)%360} ┃ ${(center+355)%360} ┃ ${center}° ┃ ${(center+5)%360} ┃ ${(center+10)%360}`);
  text('guidance-heading-pointer',cue.inside?'▼':`${cue.side==='left'?'←':'→'}${Math.round(Math.abs(cue.angleDegrees))}°`);
  pointer.dataset.side=cue.side??'inside';pointer.style.left=`${8+cue.x}px`;
  element.setAttribute('aria-label',`${hudText(language,'heading')} ${directionWords(bearing,0,language).split(language==='ja'?'・':' · ')[0]}`);
  return area;
}

/**
 * Render-only update. dt is seconds, now is performance.now() milliseconds.
 * Call after all existing HUD/legacy objective updates, including while paused.
 * Completion still returns targetVisible for the completion-frame timing sample.
 */
export function updateGuidancePanel(state,{phase='running',camera='overlay',settings={},now,dt}={}){
  const root=$('guidance-panel'),app=$('app');
  if(!root||state?.mode!=='flight'||phase!=='running'){clear();return null;}
  const width=innerWidth,height=innerHeight;
  const projection=createGuidanceProjection(state,width,height);
  const mathOptions={maxPitch:settings?.maxPitch??15,maxBank:settings?.maxBank??40};
  const rawAdvice=computeDirectionGuidance(state,mathOptions);
  const target=projection?.target();
  if(!projection||!rawAdvice||!target){clear();return null;}
  const flags=Object.fromEntries(FLAG_NAMES.map(name=>[name,settings?.[name]!==false]));
  const language=normalizeHudLanguage(settings?.hudLanguage);
  const clock=Number.isFinite(now)?now:performance.now();
  const count=validCount(state.collected)?state.collected:history?.count??0;
  const retried=history&&count<history.count;
  const reset=!history||retried||history.camera!==camera||history.width!==width||history.height!==height
    ||Math.abs(history.rotation.dot(projection.rotation))<Math.cos(Math.PI/8);
  const seconds=Number.isFinite(dt)&&dt>=0?Math.min(dt,.25):Math.max(0,Math.min(.25,(clock-(history?.now??clock))/1000));
  const turn=advanceGuidanceTurn(rawAdvice,reset?null:history.turn,{now:clock,dt:seconds,targetChanged:Boolean(history&&count!==history.count)});
  const advice=turn.mode==='recover'?rawAdvice:computeDirectionGuidance(state,{...mathOptions,turnState:{mode:turn.mode,yawDegrees:turn.yawDegrees}});
  if(!advice){clear();return null;}
  let smoothed=vector(advice.direction);
  if(!reset&&history.direction)smoothed=history.direction.clone().lerp(smoothed,1-Math.exp(-seconds/.2)).normalize();
  // A previous frame's smoothing envelope cannot override this frame's limits.
  if(!guidanceDirectionAllowed(smoothed,advice))smoothed=vector(advice.direction);
  const delta=state.targetPosition.y-state.position.y;
  const absoluteBearing=Math.atan2(state.targetPosition.x-state.position.x,-(state.targetPosition.z-state.position.z))*DEG;
  const heading=Number.isFinite(state.heading)?state.heading:0;
  let bearingDeg=wrap(absoluteBearing-heading*DEG);if(bearingDeg===-180)bearingDeg=180;
  let notice=reset?null:history.notice;
  if(history&&!retried&&count>history.count&&flags.nextTargetNotice&&!state.complete){
    notice={until:clock+1800,bearing:bearingDeg,height:delta,target:{collected:count,total:state.total??3,targetLabel:state.targetLabel}};
  }
  if(!flags.nextTargetNotice||notice?.until<=clock)notice=null;
  history={count,camera,width,height,now:clock,direction:smoothed.clone(),rotation:projection.rotation.clone(),notice,turn};
  const targetVisible=target.visible;
  const result={...advice,bearingDeg,travelBearingDeg:advice.targetBearingDegrees,targetVisible,flags,
    direction:plain(smoothed),rawDirection:{...advice.direction},geometricDirection:{...rawAdvice.direction},aligned:false,driverReady:false,
    director:null,directorReason:null,flightPath:null,flightPathReason:null,edge:null};
  if(state.complete){
    show(root,false);delete root.dataset.guidanceDirection;delete root.dataset.aligned;delete root.dataset.guidanceReady;
    if(app){delete app.dataset.guidanceEdge;delete app.dataset.guidanceDirector;delete app.dataset.guidanceDirection;delete app.dataset.guidanceAligned;delete app.dataset.guidanceReady;}
    return result;
  }

  show(root,!(!flags.flightDirector&&!flags.targetHeadingCue&&!flags.edgeGuidance&&!notice));
  root.dataset.camera=camera;root.dataset.target=count===3?'exit':'light';
  root.dataset.hudLanguage=language;root.setAttribute('aria-label',language==='ja'?'次の目標への案内':'Flight guidance');
  text('guidance-path-caption',hudText(language,'flightPath'));
  app.dataset.guidanceEdge=flags.edgeGuidance?'on':'off';app.dataset.guidanceDirector=flags.flightDirector?'on':'off';
  const symbols=$('guidance-symbols');symbols.setAttribute('viewBox',`0 0 ${width} ${height}`);
  const bounds=safeBounds(width,height);
  // A temporary instruction/collection toast must not hide the only safe
  // level-flight command. Move the toast, never the measured flight path.
  const toast=$('toast');
  if(toast&&flags.flightDirector&&camera!=='cockpit'){
    const toastRect=rect(toast),bottom=rect($('bottom-panel'));
    if(toastRect){
      const reserved=obstacleRects(camera).filter(r=>r!==toastRect&&!(r.left===toastRect.left&&r.top===toastRect.top));
      for(const ray of [smoothed,vector(state.velocity)]){
        const p=ray&&projection.projectDirection(ray);
        if(p?.inFront)reserved.push(box(p,70,70));
      }
      const placed=placeGuidanceCenter({x:width/2,y:(bottom?.top??height)-toastRect.height/2-12},bounds,reserved,{width:toastRect.width,height:toastRect.height});
      if(placed){toast.style.transform='translateX(-50%)';toast.style.left=`${placed.x}px`;toast.style.top=`${placed.y-toastRect.height/2}px`;}
    }
  }else if(toast){toast.style.left='';toast.style.top='';toast.style.transform='';}
  const obstacles=obstacleRects(camera);
  const headingObstacles=[...obstacles];
  // In a downward-looking chase view, the real velocity projects near the
  // heading band. Give the measured marker and its ring first use of that area.
  for(const ray of [smoothed,vector(state.velocity)]){
    const p=ray&&projection.projectDirection(ray);
    if(p?.inFront)headingObstacles.push(box(p,76,76));
  }
  const headingArea=flags.targetHeadingCue?placeHeading(camera,bearingDeg,heading*DEG,bounds,headingObstacles,language):null;
  if(!flags.targetHeadingCue)show($('guidance-heading'),false);
  if(headingArea)obstacles.push(headingArea);

  const projected=projection.projectDirection(smoothed);
  const desired=preferredPoint(projected,width,height);
  let directorPoint=flags.flightDirector?placeGuidanceCenter(desired,bounds,obstacles,{width:62,height:62,
    accept:point=>guidanceDirectionAllowed(projection.rayFromPixel(point.x,point.y),advice),
    candidates:guidanceSafeDirections(advice).map(ray=>projection.projectDirection(ray)).filter(p=>p?.inFront)}):null;
  const director=$('guidance-director');show(director,flags.flightDirector&&Boolean(directorPoint));
  if(directorPoint){
    const direction=projection.rayFromPixel(directorPoint.x,directorPoint.y);
    const travel=vector(state.velocity),moving=travel&&travel.length()>.05;
    const aligned=Boolean(moving&&travel.normalize().dot(vector(direction))>=Math.cos(2/DEG));
    const clamped=!projected.inFront||Math.hypot(projected.x-directorPoint.x,projected.y-directorPoint.y)>.1;
    result.direction=direction;result.aligned=aligned;result.director={...directorPoint,clamped};
    result.driverReady=true;
    transform(director,directorPoint.x,directorPoint.y);director.dataset.aligned=String(aligned);director.dataset.clamped=String(clamped);
  }
  else if(flags.flightDirector)result.directorReason=hudText(language,'guidanceLevel');
  const actual=vector(state.velocity);
  const moving=actual&&actual.length()>.05;
  const actualProjection=moving?projection.projectDirection(actual.normalize()):null;
  const pathInView=actualProjection?.inFront&&actualProjection.x>=0&&actualProjection.x<=width&&actualProjection.y>=0&&actualProjection.y<=height;
  const pathCovered=pathInView&&obstacles.some(r=>overlaps(box(actualProjection,44,40),r));
  // A velocity marker is a measurement, so it must never be displaced.
  const flightPoint=flags.flightDirector&&pathInView&&!pathCovered?{x:actualProjection.x,y:actualProjection.y}:null;
  const flight=$('guidance-flight-path');show(flight,flags.flightDirector&&Boolean(flightPoint));
  // The legacy glyph also relocates offscreen; keep it suppressed while this
  // feature is enabled, including when the actual point cannot be shown.
  app.dataset.guidanceDirector=flags.flightDirector?'on':'off';
  if(flightPoint){
    transform(flight,flightPoint.x,flightPoint.y);flight.dataset.clamped='false';flight.dataset.moving='true';
    result.flightPath={...flightPoint,clamped:false,moving:true};
  }
  else if(flags.flightDirector)result.flightPathReason=hudText(language,!moving?'flightPathWaiting':!pathInView?'flightPathOut':'flightPathCovered');
  // The pair is usable only when BOTH real geometry markers can be seen.
  if(!flightPoint){
    result.driverReady=false;result.aligned=false;result.director=null;directorPoint=null;
    result.direction=plain(smoothed);show(director,false);
  }
  show($('guidance-path-caption'),false);
  const serialized=JSON.stringify(result.direction);
  root.dataset.guidanceReady=String(result.driverReady);app.dataset.guidanceReady=String(result.driverReady);
  if(result.driverReady){
    root.dataset.guidanceDirection=serialized;root.dataset.aligned=String(result.aligned);
    app.dataset.guidanceDirection=serialized;app.dataset.guidanceAligned=String(result.aligned);
  }else{delete root.dataset.guidanceDirection;delete root.dataset.aligned;delete app.dataset.guidanceDirection;delete app.dataset.guidanceAligned;}

  show($('guidance-target-point'),flags.edgeGuidance&&targetVisible);
  transform($('guidance-target-point'),target.x??0,target.y??0);
  show($('guidance-target-diamond'),count!==3);show($('guidance-exit-gate'),count===3);
  const edge=flags.edgeGuidance&&!target.inViewport?trueScreenEdge(target.local,width,height,18):null;
  const edgeArrow=$('guidance-edge-arrow');show(edgeArrow,Boolean(edge));show($('guidance-edge-label'),false);
  if(edge){
    result.edge={...edge};transform(edgeArrow,edge.x,edge.y,edge.rotation);
    edgeArrow.dataset.x=String(edge.x);edgeArrow.dataset.y=String(edge.y);edgeArrow.dataset.behind=String(edge.behind);
    const label=$('guidance-edge-label'),labelW=Math.min(126,width-48),labelH=44;
    const preferred={x:edge.x<width/3?edge.x+labelW/2+22:edge.x>width*2/3?edge.x-labelW/2-22:edge.x,
      y:edge.y<height/3?edge.y+labelH/2+22:edge.y>height*2/3?edge.y-labelH/2-22:edge.y};
    const reserved=[...obstacles,...(directorPoint?[box(directorPoint,68,68)]:[]),...(flightPoint?[box(flightPoint,50,50)]:[])];
    const placement=placeGuidanceCenter(preferred,bounds,reserved,{width:labelW,height:labelH});
    if(placement){
      show(label,true);move(label,placement.x-labelW/2,placement.y-labelH/2);label.style.width=`${labelW}px`;
      text('guidance-edge-title',`${hudTargetLabel(state,language)}${language==='ja'&&edge.behind?'・後ろ':''}`);
      text('guidance-edge-detail',`${Math.round(advice.distance)}m　${directionWords(bearingDeg,delta,language)}`);
      result.edge.label={x:placement.x-labelW/2,y:placement.y-labelH/2,width:labelW,height:labelH};
    }
  }
  const noticeElement=$('guidance-next-notice');show(noticeElement,false);
  if(notice){
    const noticeW=Math.min(290,width-40),noticeH=62;
    const nav=rect(document.querySelector('.navigation'));
    const edgeLabel=result.edge?.label;
    const reserved=[...obstacles,...(directorPoint?[box(directorPoint,68,68)]:[]),...(flightPoint?[box(flightPoint,50,50)]:[]),
      ...(edgeLabel?[{left:edgeLabel.x,right:edgeLabel.x+edgeLabel.width,top:edgeLabel.y,bottom:edgeLabel.y+edgeLabel.height}]:[])];
    const placement=placeGuidanceCenter({x:width/2,y:(nav?.bottom??50)+42},bounds,reserved,{width:noticeW,height:noticeH});
    if(placement){
      show(noticeElement,true);move(noticeElement,placement.x-noticeW/2,placement.y-noticeH/2);noticeElement.style.width=`${noticeW}px`;
      const targetName=hudTargetLabel(notice.target,language);
      const message=language==='ja'?`${hudText(language,'nextTarget')} ${directionWords(notice.bearing,notice.height,language)}`:directionWords(notice.bearing,notice.height,language);
      text('guidance-notice-target',language==='ja'?targetName:`${hudText(language,'nextTarget')} ${targetName}`);text('guidance-notice-text',message);
      result.notice={message,until:notice.until,x:placement.x-noticeW/2,y:placement.y-noticeH/2};
    }
  }
  const status=$('guidance-status');show(status,Boolean(result.directorReason||result.flightPathReason));
  if(result.directorReason||result.flightPathReason){
    text('guidance-director-reason',result.directorReason??'');text('guidance-path-reason',result.flightPathReason??'');
    const statusW=Math.min(290,width-40),statusH=result.directorReason&&result.flightPathReason?46:28;
    const nav=rect(document.querySelector('.navigation'));
    const preferred={x:width/2,y:(nav?.bottom??50)+statusH/2+12};
    const placement=placeGuidanceCenter(preferred,bounds,obstacles,{width:statusW,height:statusH})??preferred;
    move(status,placement.x-statusW/2,Math.max(12,Math.min(height-statusH-12,placement.y-statusH/2)));
    if(status)Object.assign(status.style,{width:`${statusW}px`,minHeight:`${statusH}px`});
  }
  root.dataset.mode=advice.mode;root.dataset.targetVisible=String(targetVisible);
  return result;
}
