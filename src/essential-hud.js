import {hudStallWarning,normalizeHudLanguage} from './hud-text.js';
import {viewportInsets} from './viewport-insets.js';

const $=id=>document.getElementById(id);
/** Display only. Existing speed, altitude and target-height nodes keep their IDs. */
export function updateEssentialHud(state,{phase,mode,camera,language='en'}={}){
  const panel=$('flight-essential-hud'),flight=mode==='flight',ja=normalizeHudLanguage(language)==='ja';
  panel.hidden=phase!=='running'||flight&&camera==='cockpit';
  panel.dataset.mode=flight?'flight':'explore';
  panel.setAttribute('aria-label',ja?flight?'飛行の速度と高度':'探索の速度と高さ':flight?'FLIGHT READINGS':'EXPLORE READINGS');
  const height=$('flight-essential-height'),vario=$('flight-essential-vario'),warning=$('flight-warning-text');
  height.hidden=$('target-height-inline').hidden;
  vario.hidden=!flight;
  $('flight-essential-vario-label').textContent=ja?'昇降':'V/S';
  const vertical=Number.isFinite(state.verticalSpeed)?state.verticalSpeed:0;
  $('flight-essential-vario-value').textContent=`${vertical>0?'+':''}${vertical.toFixed(1)}`;
  $('flight-essential-details').hidden=height.hidden&&vario.hidden;
  const warningText=flight?(hudStallWarning(state,language)||(state.inputHeld?ja?'入力保持中':'INPUT HOLD':'')):'';
  if(warning.textContent!==warningText)warning.textContent=warningText;
  const warningHidden=!warningText;if(warning.hidden!==warningHidden)warning.hidden=warningHidden;
  const alert=$('flight-essential-alert'),alertHidden=warning.hidden&&$('ground-warning-text').hidden;if(alert.hidden!==alertHidden)alert.hidden=alertHidden;
  if(panel.hidden)return;
  const safe=viewportInsets(),navigation=document.querySelector('.navigation').getBoundingClientRect(),bar=document.querySelector('.topbar').getBoundingClientRect(),top=Math.max(navigation.bottom,bar.bottom);
  // Normally SPD sits below radar. Landscape and any intersecting exploration
  // input panel use the other fixed slot beside radar, keeping inputs open.
  const speedCard=$('flight-essential-speed'),controls=$('bottom-panel').getBoundingClientRect();speedCard.style.width='76px';
  const proposed={left:safe.left+12,right:safe.left+88,top:top+124,bottom:top+124+speedCard.getBoundingClientRect().height};
  const coveredByExploreInputs=!flight&&proposed.left<controls.right&&proposed.right>controls.left&&proposed.top<controls.bottom&&proposed.bottom+8>controls.top;
  const besideRadar=innerWidth>=600&&innerHeight<=500||coveredByExploreInputs;
  Object.assign(speedCard.style,{left:`${safe.left+(besideRadar?124:12)}px`,top:`${top+(besideRadar?12:124)}px`});
  Object.assign($('flight-essential-altitude').style,{left:`${innerWidth-safe.right-104}px`,top:`${top+12}px`,width:'92px'});
  if(!flight)$('app').style.setProperty('--explore-toast-bottom',`${Math.max(12,innerHeight-$('bottom-panel').getBoundingClientRect().top+10)}px`);
}
