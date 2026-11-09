import './briefing.css';
import {APP_VERSION} from './version.js';
import {BRIEFING_DRAW_SECONDS,briefingProgress,createBriefingModel,fitBriefingMap,briefingGridPath} from './briefing-model.js';

const NS='http://www.w3.org/2000/svg';
let briefingObservationSession=0;
const svgNode=(tag,attributes={},text)=>{
  const node=document.createElementNS(NS,tag);
  for(const [key,value]of Object.entries(attributes))node.setAttribute(key,String(value));
  if(text!==undefined)node.textContent=text;return node;
};
const path=points=>points.map((point,index)=>`${index?'L':'M'}${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(' ');
const heightLabel=value=>`▲${Number.isInteger(value)?value:value.toFixed(1)}m`;
const distanceLabel=value=>value>=1000?`${(value/1000).toFixed(value%1000?1:0)}km`:`${Math.round(value)}m`;
const introductions={easy:'大きな半周を描いて、最後の直線へ。',normal:'右から左へ切り返し、長い直線を抜ける。',
  hard:'二つのうずをつないで、出口への直線へ。',sierra10:'A〜Fを順に通過し、亜音速でGの出口へ。',supersonic:'海と雲の間を抜け、音の壁の先へ。'};

/** View policy only: the original course/world coordinates and projection stay untouched. */
function routeViewModel(model){
  return {...model,boundary:[],arena:{...model.arena,landmarks:model.arena.landmarks.filter(item=>item.id==='central-tower')}};
}

/** View only; the optional observer owns audio and never delays this visible clock. */
export function createBriefingPanel({root=document.getElementById('app'),onClose=()=>{},onSignal=()=>{}}={}){
  if(!root?.append)throw new TypeError('Briefing panel needs a root element');
  const element=document.createElement('section');element.id='briefing-panel';element.className='briefing-panel';
  element.hidden=true;element.setAttribute('role','dialog');element.setAttribute('aria-modal','true');element.setAttribute('aria-labelledby','briefing-title');
  element.innerHTML=`<div class="briefing-sheet">
    <header class="briefing-header"><div><h2 id="briefing-title" class="briefing-course-name">Flight map</h2><p class="briefing-course-intro"></p></div><p class="briefing-route-facts"></p></header>
    <div class="briefing-layout">
      <section class="briefing-chart" aria-label="Flight route"><div class="briefing-map-area"><svg id="briefing-map" role="img" aria-labelledby="briefing-map-title briefing-map-description"></svg></div><div class="briefing-map-reference"></div></section>
      <aside class="briefing-legend" aria-label="Whole airspace, course points and heights">
        <div class="briefing-context-row"><figure class="briefing-context"><figcaption>Whole airspace</figcaption><svg id="briefing-overview" role="img" aria-label="Whole airspace boundary and landmarks"></svg><svg id="briefing-overview-scale" role="img"></svg></figure>
          <div class="briefing-key"><span><i class="briefing-key-route"></i> Route</span><span class="briefing-ab-key"><i class="briefing-key-ab"></i> <span class="briefing-ab-label">AB straight</span></span><span class="briefing-landmark-key"><i class="briefing-key-tower">△</i> <span>Tower</span></span><span class="briefing-you-key" hidden><i class="briefing-key-you">▲</i> You</span><p class="briefing-position-note"></p></div></div>
        <ol class="briefing-points"></ol>
      </aside>
    </div>
    <footer class="briefing-footer"><div class="briefing-footer-copy"><span class="briefing-tap-hint">Tap anywhere to continue</span><span class="briefing-version"></span></div><button id="briefing-skip" class="briefing-close" type="button">SKIP</button></footer>
  </div>`;
  root.append(element);
  const mapElement=element.querySelector('#briefing-map'),area=element.querySelector('.briefing-map-area');
  const closeButton=element.querySelector('#briefing-skip'),legend=element.querySelector('.briefing-points'),overview=element.querySelector('#briefing-overview');
  element.querySelector('.briefing-version').textContent=`v${APP_VERSION}`;
  let active=null,disposed=false,frame=null,routeLine=null,routeTip=null,routeTrace=null,previousFocus=null,gateNodes=[];
  const now=()=>performance.now();
  const elapsed=()=>active?active.visibleSeconds+(active.visibleAt===null?0:Math.max(0,now()-active.visibleAt)/1000):0;
  const staticMap=()=>active?.reducedMotion||active?.origin==='pause';
  const progress=()=>staticMap()?1:briefingProgress(elapsed());
  function notify(type,extra={}){
    if(!active)return;
    const signal={type,session:active.observationSession,origin:active.origin,courseId:active.model.id,
      visibleSeconds:elapsed(),progress:progress(),drawSeconds:staticMap()?0:BRIEFING_DRAW_SECONDS,
      reducedMotion:active.reducedMotion,visible:!document.hidden&&active.visibleAt!==null,points:active.signalPoints??[],...extra};
    // Sound being unsupported must never prevent rendering, skip or close.
    try{onSignal(signal);}catch{}
  }
  function updateProgress(){
    if(!active)return;
    const seconds=elapsed(),value=staticMap()?1:briefingProgress(seconds);routeLine?.setAttribute('stroke-dashoffset',String(1-value));
    const tipVisible=Boolean(routeTip&&routeTrace?.length>0&&active.origin==='start'&&!active.reducedMotion&&value<1);
    if(routeTip){
      routeTip.setAttribute('visibility',tipVisible?'visible':'hidden');
      if(tipVisible){
        const distance=value*routeTrace.length;let index=1;
        while(index<routeTrace.points.length-1&&routeTrace.points[index].distance<distance)index++;
        const from=routeTrace.points[index-1],to=routeTrace.points[index],fraction=(distance-from.distance)/(to.distance-from.distance||1);
        const x=from.x+(to.x-from.x)*fraction,y=from.y+(to.y-from.y)*fraction;
        routeTip.setAttribute('transform',`translate(${x} ${y}) rotate(${Math.atan2(to.y-from.y,to.x-from.x)*180/Math.PI+90})`);
        routeTip.dataset.nextPoint=to.id;
      }
    }
    for(const gate of gateNodes){
      const passed=!staticMap()&&value>=gate.progress;
      gate.node.dataset.passed=String(passed);gate.label.classList.toggle('is-passed',passed);
    }
    element.dataset.progress=String(value);element.dataset.drawComplete=String(value>=1);
    closeButton.textContent=value>=1?'CONTINUE':'SKIP';
    if(!active.signalOpened&&active.signalPoints){active.signalOpened=true;notify('open',{visibleSeconds:seconds,progress:value});}
    notify('progress',{visibleSeconds:seconds,progress:value});
    return value;
  }
  function animate(){
    frame=null;if(!active||disposed)return;const value=updateProgress();
    if(value<1&&!document.hidden)frame=requestAnimationFrame(animate);
  }
  function render(){
    if(!active||disposed)return;
    const rect=mapElement.getBoundingClientRect(),width=Math.max(120,rect.width),height=Math.max(120,rect.height);
    const map=fitBriefingMap(routeViewModel(active.model),{width,height,padding:38,oblique:true});
    element.dataset.fitPolicy='route-with-whole-context';
    element.dataset.mapView='oblique';
    mapElement.setAttribute('viewBox',`0 0 ${width} ${height}`);
    mapElement.replaceChildren(svgNode('title',{id:'briefing-map-title'},`${active.model.name} flight map`),
      svgNode('desc',{id:'briefing-map-description'},'An angled route map. A jet follows the numbered targets to EXIT. Height stems connect each point to the ground. The whole-airspace inset preserves the boundary and landmarks.'));
    mapElement.append(svgNode('path',{d:briefingGridPath(active.model,map),class:'briefing-ground-grid'}));
    for(const item of map.route){
      const foot=map.projectGround(item.position);
      mapElement.append(svgNode('ellipse',{cx:foot.x,cy:foot.y,rx:8,ry:3,class:'briefing-ground-foot'}),svgNode('path',{d:`M${foot.x} ${foot.y}L${item.x} ${item.y}`,class:'briefing-height-stem'}));
    }
    for(const lane of map.abStraights)mapElement.append(svgNode('path',{d:`${path(lane.corners)}Z`,class:'briefing-ab-lane','data-ab-lane':lane.id}));
    const quietRoute=svgNode('path',{d:map.path,class:'briefing-route-base'});
    routeLine=svgNode('path',{d:map.path,class:'briefing-route',pathLength:1,'stroke-dasharray':'1 1','stroke-dashoffset':1});
    mapElement.append(quietRoute,routeLine);
    const tracePoints=map.route.map(item=>({id:item.id,x:item.x,y:item.y,distance:0}));
    for(let index=1;index<tracePoints.length;index++)tracePoints[index].distance=tracePoints[index-1].distance+Math.hypot(tracePoints[index].x-tracePoints[index-1].x,tracePoints[index].y-tracePoints[index-1].y);
    routeTrace={points:tracePoints,length:tracePoints.at(-1)?.distance??0};
    // Uniform projection preserves these fractions on resize. Reuse the same
    // readonly array, rather than rebuilding an audio queue every frame.
    if(!active.signalPoints)active.signalPoints=Object.freeze(map.route.map((item,index)=>Object.freeze({
      id:item.id,kind:item.kind,number:item.number,progress:routeTrace.length>0?tracePoints[index].distance/routeTrace.length:index===map.route.length-1?1:0,
    })));
    for(const landmark of map.landmarks){
      const symbol=landmark.kind==='point-flag'?landmark.label:landmark.kind==='tower'?'△':landmark.kind==='square'?'□':landmark.kind==='diamond'?'◇':landmark.kind==='arch'?'∩':'△';
      mapElement.append(svgNode('text',{x:landmark.x,y:landmark.y+4,class:'briefing-landmark','text-anchor':'middle','data-landmark':landmark.id},symbol));
    }
    const start=svgNode('g',{transform:`translate(${map.start.x} ${map.start.y})`,'data-map-point':'start',class:'briefing-start'});
    start.append(svgNode('path',{d:'M0 -8L5.5 6L0 3L-5.5 6Z',transform:`rotate(${Math.atan2(-.22,.72)*180/Math.PI})`}),svgNode('text',{x:0,y:22,'text-anchor':'middle'},'START'));mapElement.append(start);
    gateNodes=[];
    const labels=svgNode('g',{class:'briefing-target-labels'});
    for(const target of map.targets){
      const group=svgNode('g',{transform:`translate(${target.x} ${target.y})`,class:'briefing-target','data-map-point':target.id,'data-collected':target.completed});
      group.append(svgNode('circle',{r:18}));mapElement.append(group);
      const label=svgNode('g',{transform:`translate(${target.x} ${target.y})`,class:'briefing-target-label','data-collected':target.completed});
      label.append(svgNode('text',{'text-anchor':'middle',y:5.5},String(target.pointName??target.number)));labels.append(label);
      gateNodes.push({node:group,label,progress:active.signalPoints.find(point=>point.id===target.id).progress});
    }
    const exit=svgNode('g',{transform:`translate(${map.exit.x} ${map.exit.y})`,class:'briefing-exit','data-map-point':'exit','data-collected':map.exit.completed});
    exit.append(svgNode('path',{d:'M-16 -16H16V16H-16Z'}),svgNode('text',{x:0,y:-24,'text-anchor':'middle'},active.model.exit.pointName?`EXIT · ${active.model.exit.pointName}`:'EXIT'));mapElement.append(exit);
    mapElement.append(labels);
    if(map.current){
      const ahead=map.project({...map.current.position,x:map.current.position.x+Math.sin(map.current.heading),z:map.current.position.z-Math.cos(map.current.heading)});
      const direction=Math.atan2(ahead.y-map.current.y,ahead.x-map.current.x)*180/Math.PI+90;
      const you=svgNode('g',{transform:`translate(${map.current.x} ${map.current.y}) rotate(${direction})`,class:'briefing-current','data-map-point':'current','data-heading':map.current.heading});
      you.append(svgNode('path',{d:'M0 -11L7 8L0 4L-7 8Z'}));mapElement.append(you);
    }
    routeTip=svgNode('g',{class:'briefing-trace-tip briefing-aircraft','data-aircraft':'jet','aria-hidden':'true',visibility:'hidden'});
    routeTip.append(svgNode('path',{d:'M0 -19L3 -7L5 -2L17 9L17 12L5 7L5 13L10 18L10 21L2 17L-2 17L-10 21L-10 18L-5 13L-5 7L-17 12L-17 9L-5 -2L-3 -7Z'}),
      svgNode('path',{d:'M-3 10V16M3 10V16M0 -10V-3',class:'briefing-aircraft-detail'}));mapElement.append(routeTip);
    const reference=element.querySelector('.briefing-map-reference');
    const northSvg=svgNode('svg',{viewBox:'0 0 42 30',width:42,height:30,'aria-label':'North relative to the starting heading',role:'img'});
    const north=svgNode('g',{transform:'translate(21 19)','data-north-heading':active.model.heading,class:'briefing-north'});
    north.append(svgNode('text',{x:0,y:-8,'text-anchor':'middle'},'N'),svgNode('path',{d:'M0 -5L-4 7L0 4L4 7Z',transform:`rotate(${map.north.rotationDegrees})`}));northSvg.append(north);
    const scaleSvg=svgNode('svg',{viewBox:'0 0 128 30',width:128,height:30,role:'img','aria-label':`${map.scale.label} route scale`});
    const scale=svgNode('g',{transform:'translate(14 24)',class:'briefing-scale','data-scale-metres':map.scale.metres});
    scale.append(svgNode('path',{d:`M0 -4V1H${map.scale.pixels}V-4`}),svgNode('text',{x:map.scale.pixels/2,y:-7,'text-anchor':'middle'},map.scale.label));scaleSvg.append(scale);
    const headingNote=document.createElement('span');headingNote.textContent='Angled view · route to EXIT';reference.replaceChildren(northSvg,headingNote,scaleSvg);
    const overviewRect=overview.getBoundingClientRect(),contextMap=fitBriefingMap(active.model,{width:Math.max(70,overviewRect.width),height:Math.max(70,overviewRect.height),padding:12});
    overview.setAttribute('viewBox',`0 0 ${contextMap.width} ${contextMap.height}`);overview.replaceChildren(svgNode('path',{d:`${path(contextMap.boundary)}Z`,class:'briefing-boundary'}),svgNode('path',{d:contextMap.path,class:'briefing-overview-route'}));
    for(const landmark of contextMap.landmarks){
      const symbol=landmark.kind==='point-flag'?landmark.label:landmark.kind==='tower'?'△':landmark.kind==='square'?'□':landmark.kind==='diamond'?'◇':landmark.kind==='arch'?'∩':'△';
      overview.append(svgNode('text',{x:landmark.x,y:landmark.y+2.5,class:'briefing-context-landmark','text-anchor':'middle','data-landmark':landmark.id},symbol));
    }
    if(contextMap.current)overview.append(svgNode('circle',{cx:contextMap.current.x,cy:contextMap.current.y,r:3,class:'briefing-context-current'}));
    const contextScale=element.querySelector('#briefing-overview-scale');contextScale.setAttribute('viewBox','0 0 92 18');contextScale.setAttribute('aria-label',`${contextMap.scale.label} whole-airspace scale`);contextScale.setAttribute('data-context-scale-metres',String(contextMap.scale.metres));
    contextScale.replaceChildren(svgNode('path',{d:`M5 11V15H${5+contextMap.scale.pixels}V11`,class:'briefing-context-scale-line'}),svgNode('text',{x:5+contextMap.scale.pixels/2,y:8,'text-anchor':'middle',class:'briefing-context-scale-label'},contextMap.scale.label));
    // SVG construction happens before the first paint. Start the visible clock
    // only when that initial drawing is ready; resize must not restart it.
    if(!active.signalOpened&&active.visibleAt!==null)active.visibleAt=now();
    updateProgress();
  }
  function fillLegend(){
    legend.replaceChildren(...active.model.route.map(item=>{
      const row=document.createElement('li');row.dataset.briefingPoint=item.id;row.dataset.collected=String(item.completed===true);
      const label=document.createElement('b');label.textContent=item.label;
      const height=document.createElement('span');height.textContent=heightLabel(item.height);row.append(label,height);return row;
    }));
    element.querySelector('.briefing-ab-key').hidden=active.model.abStraights.length===0;
    element.querySelector('.briefing-ab-label').textContent=`AB ${active.model.abStraights.map(lane=>distanceLabel(lane.length)).join(' / ')}`;
    const landmarkKey=element.querySelector('.briefing-landmark-key');landmarkKey.hidden=active.model.arena.landmarks.length===0;
    landmarkKey.querySelector('span').textContent=active.model.arena.landmarks.some(item=>item.kind==='tower')?'Tower':'Landmark';
    element.querySelector('.briefing-you-key').hidden=!active.model.current;
    const positionNote=element.querySelector('.briefing-position-note');
    positionNote.textContent=active.model.current?'Your position and collected targets are shown.':'Ground grid and height stems show the route in an angled view.';
  }
  function close(closeMethod='programmatic'){
    if(!active||disposed)return null;
    const result={origin:active.origin,seconds:elapsed(),skipped:progress()<1,closeMethod};
    notify('close',{closeMethod,skipped:result.skipped});
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
    if(document.hidden&&active.visibleAt!==null){active.visibleSeconds=elapsed();active.visibleAt=null;cancelAnimationFrame(frame);frame=null;notify('visibility',{visible:false});}
    else if(!document.hidden&&active.visibleAt===null){active.visibleAt=now();notify('visibility',{visible:true});const value=updateProgress();if(value<1&&frame===null)frame=requestAnimationFrame(animate);}
  }
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(render):null;
  observer?.observe(area);window.addEventListener('resize',render);document.addEventListener('visibilitychange',visibility);document.addEventListener('keydown',keydown,true);element.addEventListener('click',click);
  return {
    open({course,state=null,origin='start'}={}){
      if(disposed)throw new Error('Briefing panel is disposed');if(active)return false;
      const model=createBriefingModel(course,{state});previousFocus=document.activeElement;
      active={model,origin:origin==='pause'?'pause':'start',visibleSeconds:0,visibleAt:document.hidden?null:now(),
        observationSession:++briefingObservationSession,signalOpened:false,signalPoints:null,
        reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true};
      element.querySelector('.briefing-course-name').textContent=model.name;element.dataset.origin=active.origin;
      element.querySelector('.briefing-course-intro').textContent=introductions[model.id]??'道筋と高さを確かめて、番号順に出口へ。';
      const heights=model.route.map(item=>item.height),minimum=Math.min(...heights),maximum=Math.max(...heights);
      element.querySelector('.briefing-route-facts').textContent=`${model.targets.length} TGT　ALT ${minimum===maximum?`${minimum}m`:`${minimum}–${maximum}m`}`;
      element.dataset.course=model.id;element.dataset.targetCount=String(model.targets.length);element.hidden=false;fillLegend();render();
      if(progress()<1&&!document.hidden)frame=requestAnimationFrame(animate);closeButton.focus({preventScroll:true});return true;
    },
    close,isOpen:()=>Boolean(active),
    snapshot:()=>active?{origin:active.origin,courseId:active.model.id,seconds:elapsed(),progress:progress(),drawSeconds:staticMap()?0:BRIEFING_DRAW_SECONDS}:null,
    dispose(){if(disposed)return;notify('dispose');active=null;disposed=true;cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',render);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('keydown',keydown,true);element.removeEventListener('click',click);element.remove();},
  };
}
