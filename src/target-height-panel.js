import { targetHeightGuide } from './target-height.js';
const $=id=>document.getElementById(id);
const number=n=>Number.isInteger(n)?String(n):n.toFixed(1);
export function heightBandSvg(guide,compact=false) {
  const s=guide.scale;
  return `<svg class="height-band" viewBox="0 0 58 100" preserveAspectRatio="none" aria-hidden="true"><path class="height-axis" d="M44,4V96"/><rect class="height-band-range" x="44" y="${s.upperY}" width="12" height="${s.lowerY-s.upperY}"/><path class="height-target" d="M42,${s.targetY}H58"/><path class="height-current" d="M35,${s.currentY}L43,${s.currentY-4}V${s.currentY+4}Z"/>${compact?'':`<text x="2" y="${Math.min(92,s.upperY+3)}">${number(guide.upper)}</text><text x="2" y="${Math.max(10,s.lowerY+3)}">${number(guide.lower)}</text>`}</svg>`;
}
export function updateTargetHeightPanel(state,{phase,visibility,enabled,cockpit}) {
  const guide=enabled&&visibility==='assisted'&&phase==='running'&&!state.complete?targetHeightGuide(state):null;
  const inline=$('target-height-inline'),badge=$('cockpit-target-height');
  const parent=state.mode==='flight'?document.querySelector('.throttle-heading'):document.querySelector('.flight-line');
  if(inline.parentElement!==parent)parent.append(inline);
  inline.hidden=!guide||cockpit;badge.hidden=!guide||!cockpit;
  $('app').dataset.targetHeight=JSON.stringify(guide);
  if(!guide)return null;
  const delta=Math.abs(guide.delta)<.05?'±0m':`${guide.delta>0?'▲+':'▼−'}${Math.abs(guide.delta).toFixed(1)}m`;
  const status=guide.inside?'高さOK':guide.urgent?`${guide.direction==='up'?'▲ 早めに上へ':'▼ 早めに下へ'}`:delta;
  for(const el of [inline,badge]) {
    el.dataset.heightState=guide.inside?'inside':guide.urgent?'urgent':'outside';
    el.setAttribute('aria-label',`目標高度 ${number(guide.target)}m、取得できる高さの範囲 ${number(guide.lower)}〜${number(guide.upper)}m、差 ${delta}。${status}。進路も目標へ合わせてください。`);
    el.innerHTML=`${el===inline?heightBandSvg(guide,true):''}<span><b>目標 ${number(guide.target)}m</b><small>${delta}${guide.inside?'　高さOK':guide.urgent?`　早めに${guide.direction==='up'?'▲':'▼'}`:''}</small></span>`;
  }
  return guide;
}
