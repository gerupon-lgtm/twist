import { targetHeightGuide } from './target-height.js';
import { hudText, hudHeightDelta, normalizeHudLanguage } from './hud-text.js';
import {formatSupersonicAltitude} from './supersonic-presentation.js';
const $=id=>document.getElementById(id);
const number=n=>Number.isInteger(n)?String(n):n.toFixed(1);
export function heightBandSvg(guide,compact=false,supersonic=false) {
  const s=guide.scale;
  const display=supersonic?formatSupersonicAltitude:number;
  return `<svg class="height-band" viewBox="0 0 58 100" preserveAspectRatio="none" aria-hidden="true"><path class="height-axis" d="M44,4V96"/><rect class="height-band-range" x="44" y="${s.upperY}" width="12" height="${s.lowerY-s.upperY}"/><path class="height-target" d="M42,${s.targetY}H58"/><path class="height-current" d="M35,${s.currentY}L43,${s.currentY-4}V${s.currentY+4}Z"/>${compact?'':`<text x="2" y="${Math.min(92,s.upperY+3)}">${display(guide.upper)}</text><text x="2" y="${Math.max(10,s.lowerY+3)}">${display(guide.lower)}</text>`}</svg>`;
}
export function updateTargetHeightPanel(state,{phase,visibility,enabled,cockpit,language='en',inlineParent=null}) {
  const guide=enabled&&visibility==='assisted'&&phase==='running'&&!state.complete?targetHeightGuide(state):null;
  const inline=$('target-height-inline'),badge=$('cockpit-target-height');
  const parent=inlineParent||(state.mode==='flight'?document.querySelector('.throttle-heading'):document.querySelector('.flight-line'));
  if(inline.parentElement!==parent)parent.append(inline);
  inline.hidden=!guide||cockpit;badge.hidden=!guide||!cockpit;
  $('app').dataset.targetHeight=JSON.stringify(guide);
  if(!guide)return null;
  const ja=normalizeHudLanguage(language)==='ja';
  const display=state.supersonic?formatSupersonicAltitude:number;
  const delta=hudHeightDelta(guide.delta,language);
  const status=guide.inside?hudText(language,'heightOkay'):guide.urgent?hudText(language,guide.direction==='up'?'climb':'descend'):delta;
  for(const el of [inline,badge]) {
    el.dataset.heightState=guide.inside?'inside':guide.urgent?'urgent':'outside';
    el.setAttribute('aria-label',ja
      ? `現在高度 ${guide.altitude.toFixed(1)}m、目標高度 ${number(guide.target)}m、取得できる高さの範囲 ${number(guide.lower)}〜${number(guide.upper)}m、差 ${delta}。${status}。進路も目標へ合わせてください。`
      : `ALT ${guide.altitude.toFixed(1)}m, TGT ALT ${number(guide.target)}m, ALT BAND ${number(guide.lower)}–${number(guide.upper)}m, ${delta}. ${status}.`);
    const cue=guide.inside?hudText(language,'heightOkay'):guide.urgent?(ja?`早めに${guide.direction==='up'?'▲':'▼'}`:hudText(language,guide.direction==='up'?'climb':'descend')):'';
    const current=el===inline&&inlineParent?'':`<strong class="current-height">${ja?'現在':'ALT '}${state.supersonic?display(guide.altitude):guide.altitude.toFixed(1)}m</strong>　`;
    const markup=`${el===inline?heightBandSvg(guide,true,Boolean(state.supersonic)):''}<span><b>${current}${hudText(language,'targetAltitude')} ${display(guide.target)}m</b><small>${delta}${cue?`　${cue}`:''}</small></span>`;
    if(el._heightMarkup!==markup){el.innerHTML=markup;el._heightMarkup=markup;}
  }
  return guide;
}
