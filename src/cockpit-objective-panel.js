import {projectCockpitObjective,placeObjectiveLabel} from './cockpit-objective.js';
const $=id=>document.getElementById(id);
let geometry=null,drawnShape='';
export function layoutCockpitObjective(layout) {
  geometry=null;if(!layout)return;
  const {w,h,compassY,powerY,insets}=layout;
  const top=compassY+($('cockpit-exit-notice').hidden?70:98);
  const area={left:insets.left+82,right:w-insets.right-102,top,bottom:powerY-8};
  const bounds={left:area.left+17,right:area.right-17,top:area.top+17,bottom:area.bottom-17};
  const obstacles=['radar','cockpit-speed','cockpit-altitude','cockpit-vario','cockpit-heading','cockpit-target-height','cockpit-exit-notice','practice-panel']
    .map($).filter(el=>!el.hidden&&el.getClientRects().length).map(el=>el.getBoundingClientRect());
  geometry={w,h,area,bounds,obstacles};
}
export function updateCockpitObjective(state,active) {
  const svg=$('cockpit-objective'),label=$('cockpit-objective-label');
  if(!active||!geometry||state.visibility!=='assisted'||state.complete){svg.setAttribute('hidden','');label.hidden=true;return;}
  const {w,h,area,bounds,obstacles}=geometry;
  const mark=projectCockpitObjective({target:state.targetLocal,width:w,height:h,verticalFov:state.fieldOfView.vertical,bounds,obstacles});
  if(!mark){svg.setAttribute('hidden','');label.hidden=true;return;}
  const exit=state.collected===state.total;
  svg.removeAttribute('hidden');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.dataset.kind=mark.kind;svg.dataset.target=exit?'exit':'light';
  svg.dataset.x=String(mark.x);svg.dataset.y=String(mark.y);svg.dataset.behind=String(mark.behind);
  const shape=mark.kind==='edge'?'<path d="M0,-14L10,8 0,3 -10,8Z"/>'
    :exit?'<path d="M-14,-6V-14H-6M6,-14H14V-6M14,6V14H6M-6,14H-14V6M-7,9V-8H7V9"/>'
      :'<path d="M0,-14L14,0 0,14 -14,0Z"/><path class="objective-center" d="M-3,0H3M0,-3V3"/>';
  if(drawnShape!==shape){svg.innerHTML=`<g>${shape}</g>`;drawnShape=shape;}
  svg.firstElementChild.setAttribute('transform',`translate(${mark.x} ${mark.y}) rotate(${mark.kind==='edge'?mark.rotation:0})`);
  const delta=state.targetPosition.y-state.position.y;
  const height=Math.abs(delta)<.05?'高さ同じ':`${delta>0?'▲上に':'▼下に'}${Math.abs(delta).toFixed(1)}m`;
  const name=`${state.targetLabel}${mark.behind?'・後ろ':mark.kind==='edge'?'・表示域外':''}`;
  const detail=`${Math.round(state.distance)}m　${height}`;
  const text=`${name} ${detail}`;svg.setAttribute('aria-label',text);
  const placement=placeObjectiveLabel(mark,{bounds:area,obstacles});
  label.hidden=!placement;
  if(placement){label.dataset.target=exit?'exit':'light';label.querySelector('strong').textContent=name;label.querySelector('span').textContent=detail;label.style.transform=`translate(${placement.x}px,${placement.y}px)`;}
}
