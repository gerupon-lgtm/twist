import './briefing.css';
import {APP_VERSION} from './version.js';
import {BRIEFING_DRAW_SECONDS,briefingProgress,createBriefingModel,fitBriefingMap} from './briefing-model.js';

const NS='http://www.w3.org/2000/svg';
const svgNode=(tag,attributes={},text)=>{
  const node=document.createElementNS(NS,tag);
  for(const [key,value]of Object.entries(attributes))node.setAttribute(key,String(value));
  if(text!==undefined)node.textContent=text;return node;
};
const path=points=>points.map((point,index)=>`${index?'L':'M'}${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(' ');
const heightLabel=value=>`▲${Number.isInteger(value)?value:value.toFixed(1)}m`;

/** Silent view only. The caller owns preferences, flight start and all clocks. */
export function createBriefingPanel({root=document.getElementById('app'),onClose=()=>{}}={}){
  if(!root?.append)throw new TypeError('Briefing panel needs a root element');
  const element=document.createElement('section');element.id='briefing-panel';element.className='briefing-panel';
  element.hidden=true;element.setAttribute('role','dialog');element.setAttribute('aria-modal','true');element.setAttribute('aria-labelledby','briefing-title');
  element.innerHTML='<div class="briefing-sheet"><header class="briefing-header"><div><h2 id="briefing-title">Flight map</h2><p class="briefing-course-name"></p></div><button id="briefing-skip" class="briefing-close" type="button">SKIP</button></header><div class="briefing-layout"><div class="briefing-map-area"><svg id="briefing-map" role="img" aria-labelledby="briefing-map-title briefing-map-description"></svg></div><aside class="briefing-legend" aria-label="Course points and heights"><ol class="briefing-points"></ol><div class="briefing-key"><span><i class="briefing-key-route"></i> ROUTE</span><span class="briefing-ab-key"><i class="briefing-key-ab"></i> AB STRAIGHT</span><span class="briefing-landmark-key"><i class="briefing-key-tower">△</i> <span>TOWER</span></span><span class="briefing-you-key" hidden><i class="briefing-key-you">▲</i> YOU</span></div><p class="briefing-position-note"></p></aside></div><footer class="briefing-footer"><span class="briefing-tap-hint">Tap anywhere to continue</span><span class="briefing-version"></span></footer></div>';
  root.append(element);
  const mapElement=element.querySelector('#briefing-map'),area=element.querySelector('.briefing-map-area');
  const closeButton=element.querySelector('#briefing-skip'),legend=element.querySelector('.briefing-points');
  element.querySelector('.briefing-version').textContent=`v${APP_VERSION}`;
  let active=null,disposed=false,frame=null,routeLine=null,previousFocus=null;
  const now=()=>performance.now();
  const elapsed=()=>active?active.visibleSeconds+(active.visibleAt===null?0:Math.max(0,now()-active.visibleAt)/1000):0;
  const progress=()=>active?.reducedMotion?1:briefingProgress(elapsed());
  function updateProgress(){
    if(!active)return;
    const value=progress();routeLine?.setAttribute('stroke-dashoffset',String(1-value));
    element.dataset.progress=String(value);element.dataset.drawComplete=String(value>=1);
    closeButton.textContent=value>=1?'CONTINUE':'SKIP';
  }
  function animate(){
    frame=null;if(!active||disposed)return;updateProgress();
    if(progress()<1&&!document.hidden)frame=requestAnimationFrame(animate);
  }
  function render(){
    if(!active||disposed)return;
    const rect=area.getBoundingClientRect(),width=Math.max(120,rect.width),height=Math.max(120,rect.height);
    const map=fitBriefingMap(active.model,{width,height,padding:36});
    mapElement.setAttribute('viewBox',`0 0 ${width} ${height}`);
    mapElement.replaceChildren(svgNode('title',{id:'briefing-map-title'},`${active.model.name} flight map`),
      svgNode('desc',{id:'briefing-map-description'},'Starting heading points up. Follow numbered targets to EXIT. Heights are listed beside the map.'));
    mapElement.append(svgNode('path',{d:`${path(map.boundary)}Z`,class:'briefing-boundary'}));
    for(const lane of map.abStraights)mapElement.append(svgNode('path',{d:`${path(lane.corners)}Z`,class:'briefing-ab-lane','data-ab-lane':lane.id}));
    routeLine=svgNode('path',{d:map.path,class:'briefing-route',pathLength:1,'stroke-dasharray':'1 1','stroke-dashoffset':1});
    mapElement.append(routeLine);
    for(const landmark of map.landmarks){
      const symbol=landmark.kind==='tower'?'△':landmark.kind==='square'?'□':landmark.kind==='diamond'?'◇':landmark.kind==='arch'?'∩':'△';
      mapElement.append(svgNode('text',{x:landmark.x,y:landmark.y+4,class:'briefing-landmark','text-anchor':'middle','data-landmark':landmark.id},symbol));
    }
    const start=svgNode('g',{transform:`translate(${map.start.x} ${map.start.y})`,'data-map-point':'start',class:'briefing-start'});
    start.append(svgNode('path',{d:'M0 -8L5.5 6L0 3L-5.5 6Z'}),svgNode('text',{x:0,y:22,'text-anchor':'middle'},'START'));mapElement.append(start);
    for(const target of map.targets){
      const group=svgNode('g',{transform:`translate(${target.x} ${target.y})`,class:'briefing-target','data-map-point':target.id,'data-collected':target.completed});
      group.append(svgNode('circle',{r:8}),svgNode('text',{'text-anchor':'middle',y:3.5},String(target.number)));mapElement.append(group);
    }
    const exit=svgNode('g',{transform:`translate(${map.exit.x} ${map.exit.y})`,class:'briefing-exit','data-map-point':'exit','data-collected':map.exit.completed});
    exit.append(svgNode('path',{d:'M-7 -7H7V7H-7Z'}),svgNode('text',{x:0,y:-14,'text-anchor':'middle'},'EXIT'));mapElement.append(exit);
    if(map.current){
      const you=svgNode('g',{transform:`translate(${map.current.x} ${map.current.y}) rotate(${map.current.rotationDegrees})`,class:'briefing-current','data-map-point':'current','data-heading':map.current.heading});
      you.append(svgNode('path',{d:'M0 -11L7 8L0 4L-7 8Z'}));mapElement.append(you);
    }
    const north=svgNode('g',{transform:`translate(${width-22} 23)`,'data-north-heading':active.model.heading,class:'briefing-north'});
    north.append(svgNode('text',{x:0,y:-11,'text-anchor':'middle'},'N'),svgNode('path',{d:'M0 -5L-4 7L0 4L4 7Z',transform:`rotate(${map.north.rotationDegrees})`}));mapElement.append(north);
    const scale=svgNode('g',{transform:`translate(16 ${height-15})`,class:'briefing-scale','data-scale-metres':map.scale.metres});
    scale.append(svgNode('path',{d:`M0 -4V1H${map.scale.pixels}V-4`}),svgNode('text',{x:map.scale.pixels/2,y:-7,'text-anchor':'middle'},map.scale.label));mapElement.append(scale);
    updateProgress();
  }
  function fillLegend(){
    legend.replaceChildren(...active.model.route.map(item=>{
      const row=document.createElement('li');row.dataset.briefingPoint=item.id;row.dataset.collected=String(item.completed===true);
      const label=document.createElement('b');label.textContent=item.label;
      const height=document.createElement('span');height.textContent=heightLabel(item.height);row.append(label,height);return row;
    }));
    element.querySelector('.briefing-ab-key').hidden=active.model.abStraights.length===0;
    const landmarkKey=element.querySelector('.briefing-landmark-key');landmarkKey.hidden=active.model.arena.landmarks.length===0;
    landmarkKey.querySelector('span').textContent=active.model.arena.landmarks.some(item=>item.kind==='tower')?'TOWER':'LANDMARK';
    element.querySelector('.briefing-you-key').hidden=!active.model.current;
    const positionNote=element.querySelector('.briefing-position-note');
    positionNote.textContent=active.model.current?'Your position and collected targets are shown.':'Starting heading points up.';
  }
  function close(closeMethod='programmatic'){
    if(!active||disposed)return null;
    const result={origin:active.origin,seconds:elapsed(),skipped:progress()<1,closeMethod};
    active=null;cancelAnimationFrame(frame);frame=null;element.hidden=true;delete element.dataset.origin;
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});previousFocus=null;
    onClose(result);return result;
  }
  function click(event){event.stopPropagation();close(event.target.closest('#briefing-skip')?(progress()<1?'skip':'continue'):'tap');}
  function keydown(event){
    if(!active)return;
    if(event.key==='Tab'){event.preventDefault();closeButton.focus({preventScroll:true});return;}
    if(event.key==='Escape'){event.preventDefault();close('escape');}
    else if((event.key==='Enter'||event.key===' ')&&event.target!==closeButton){event.preventDefault();close('keyboard');}
  }
  function visibility(){
    if(!active)return;
    if(document.hidden&&active.visibleAt!==null){active.visibleSeconds=elapsed();active.visibleAt=null;cancelAnimationFrame(frame);frame=null;}
    else if(!document.hidden&&active.visibleAt===null){active.visibleAt=now();if(progress()<1&&frame===null)frame=requestAnimationFrame(animate);}
  }
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(render):null;
  observer?.observe(area);window.addEventListener('resize',render);document.addEventListener('visibilitychange',visibility);document.addEventListener('keydown',keydown,true);element.addEventListener('click',click);
  return {
    open({course,state=null,origin='start'}={}){
      if(disposed)throw new Error('Briefing panel is disposed');if(active)return false;
      const model=createBriefingModel(course,{state});previousFocus=document.activeElement;
      active={model,origin:origin==='pause'?'pause':'start',visibleSeconds:0,visibleAt:document.hidden?null:now(),
        reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true};
      element.querySelector('.briefing-course-name').textContent=model.name;element.dataset.origin=active.origin;
      element.dataset.course=model.id;element.dataset.targetCount=String(model.targets.length);element.hidden=false;fillLegend();render();
      if(progress()<1&&!document.hidden)frame=requestAnimationFrame(animate);closeButton.focus({preventScroll:true});return true;
    },
    close,isOpen:()=>Boolean(active),
    snapshot:()=>active?{origin:active.origin,courseId:active.model.id,seconds:elapsed(),progress:progress(),drawSeconds:active.reducedMotion?0:BRIEFING_DRAW_SECONDS}:null,
    dispose(){if(disposed)return;active=null;disposed=true;cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',render);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('keydown',keydown,true);element.removeEventListener('click',click);element.remove();},
  };
}
