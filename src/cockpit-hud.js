import {convertSpeed,normalizeSpeedUnit} from './speed-units.js';
import { cockpitReadings, cockpitProjection, horizonSegment } from './cockpit-projection.js';
import { getGroundProximity } from './ground-proximity.js';
import { verticalSpeedIndicator } from './cockpit-aids.js';
import { viewportInsets } from './viewport-insets.js';
import { heightBandSvg } from './target-height-panel.js';
import { hudText, hudCockpitWarning, normalizeHudLanguage } from './hud-text.js';

const $ = id => document.getElementById(id);
const point = p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
const path = points => points.map((p,i) => `${i?'L':'M'}${point(p)}`).join(' ');
const format = n => n.toFixed(1);
const box = (element,x,y,width,height) => Object.assign(element.style,{left:`${x}px`,top:`${y}px`,width:`${width}px`,height:`${height}px`});

export function layoutCockpitHud(active) {
  const root = $('cockpit-hud'); root.hidden = !active;
  if (!active) return;
  const w = innerWidth, h = innerHeight;
  const insets=viewportInsets();
  const bottom = $('bottom-panel').getBoundingClientRect();
  const radar = $('radar').getBoundingClientRect(),radarShown=!$('radar').hidden;
  const nav = document.querySelector('.navigation').getBoundingClientRect();
  const practice=$('practice-panel');
  const practiceRect=$('app').dataset.startFlow==='on'&&practice&&!practice.hidden&&practice.getClientRects().length?practice.getBoundingClientRect():null;
  const tapesBottom=practiceRect?.width&&practiceRect?.height?Math.min(bottom.top,practiceRect.top):bottom.top;
  const compassY = nav.bottom+10;
  const tapeY = Math.max(h/2-65,radarShown?radar.bottom+10:0);
  const tapeHeight = Math.max(60,Math.min(130,tapesBottom-tapeY-12));
  root.dataset.compactTapes=String($('app').dataset.startFlow==='on'&&tapeHeight<80);
  let powerY = bottom.top-30,powerX=w/2-104,powerWidth=208,sideControls=false;
  // The new landscape controls occupy the sides, leaving a free middle gap.
  // Keep this legend/warning below the real flight cue instead of blocking it.
  if($('app').dataset.startFlow==='on'&&bottom.left>w/2){
    const gapLeft=Math.max(insets.left+12,practiceRect?.width?practiceRect.right+8:insets.left+12);
    const gapRight=Math.min(w-insets.right-12,bottom.left-8),gap=gapRight-gapLeft;
    if(gap>=100){
      powerWidth=Math.min(208,gap);powerX=Math.max(gapLeft,Math.min(w/2-powerWidth/2,gapRight-powerWidth));
      powerY=bottom.bottom-24;sideControls=true;
    }
  }
  let headingX=w/2-90;
  if(radarShown&&radar.top<compassY+28&&radar.bottom>compassY&&radar.left<headingX+180&&radar.right>headingX) {
    headingX=radar.left<w/2?radar.right+10:radar.left-190;
  }
  headingX=Math.max(insets.left+12,Math.min(w-insets.right-192,headingX));
  box($('cockpit-heading'),headingX,compassY,180,28);
  box($('cockpit-target-height'),headingX,compassY+32,180,32);
  box($('cockpit-exit-notice'),headingX,compassY+68,180,24);
  box($('cockpit-speed'),insets.left+12,tapeY,58,tapeHeight);
  box($('cockpit-altitude'),w-insets.right-92,tapeY,58,tapeHeight);
  box($('cockpit-vario'),w-insets.right-28,tapeY,16,tapeHeight);
  box($('cockpit-power'),powerX,powerY,powerWidth,24);
  return { w,h,compassY,powerY,insets,sideControls };
}

export function updateCockpitHud(state, active, layout = layoutCockpitHud(active), settings={}, heightGuide=null) {
  if (!active || !layout) return;
  const root = $('cockpit-hud');
  const language = normalizeHudLanguage(settings.hudLanguage);
  root.setAttribute('aria-label', language === 'ja' ? '操縦席の飛行表示' : 'FLIGHT HUD');
  const { w,h,compassY,powerY,insets } = layout;
  const readings = cockpitReadings(state);
  const tape = (value,step,label,unit,extra='') => {
    const base = Math.round(value/step)*step;
    return `<span>${label} ${unit}</span><small>${Math.max(0,base+step)}</small><strong>${format(value)}</strong><small>${Math.max(0,base-step)}</small>${extra}`;
  };
  $('cockpit-speed').innerHTML = tape(convertSpeed(readings.speed,settings.speedUnit),normalizeSpeedUnit(settings.speedUnit)==='km/h'?10:normalizeSpeedUnit(settings.speedUnit)==='kt'?5:2,hudText(language,'speed'),normalizeSpeedUnit(settings.speedUnit));
  $('cockpit-altitude').innerHTML = heightGuide
    ? `<span>${hudText(language,'altitude')} m</span><div class="height-tape-scale">${heightBandSvg(heightGuide)}<strong style="top:${Math.max(16,Math.min(84,heightGuide.scale.currentY))}%">${format(readings.altitude)}</strong></div>`
    : tape(readings.altitude,5,hudText(language,'altitude'),'m');
  $('cockpit-altitude').dataset.heightState=heightGuide?.inside?'inside':heightGuide?.urgent?'urgent':'outside';
  const vario=verticalSpeedIndicator(readings.verticalSpeed),center=50,tip=center+(vario.direction==='up'?-vario.length:vario.length);
  const bar=vario.length?`<path class="vario-bar" d="M8,${center}V${tip}"/><path d="M3,${tip+(vario.direction==='up'?6:-6)}L8,${tip}L13,${tip+(vario.direction==='up'?6:-6)}"/>`:'';
  $('cockpit-vario').innerHTML=`<svg viewBox="0 0 16 100" preserveAspectRatio="none" aria-hidden="true"${language==='ja'?'':' style="height:calc(100% - 34px)"'}><path class="vario-axis" d="M8,3V97M1,50H15"/>${bar}</svg><span>${vario.speed>=0?'+':''}${format(vario.speed)}</span><small>${language==='ja'?'m/s':'V/S<br>m/s'}</small>`;
  $('cockpit-vario').dataset.direction=vario.direction;$('cockpit-vario').dataset.length=String(vario.length);
  $('cockpit-vario').setAttribute('aria-label',language==='ja'
    ? `昇降速度 ${vario.direction==='up'?'上昇':vario.direction==='down'?'下降':'水平'} ${format(Math.abs(vario.speed))}m/s`
    : `V/S ${vario.speed>=0?'+':'−'}${format(Math.abs(vario.speed))}m/s`);
  const heading = Math.round(readings.heading);
  $('cockpit-heading').innerHTML = language==='ja'
    ? `<span>${(heading+350)%360} ┃ ${(heading+355)%360} ┃ <strong>${heading%360}°</strong> ┃ ${(heading+5)%360} ┃ ${(heading+10)%360}</span>`
    : `<span>HDG ${(heading+350)%360}│${(heading+355)%360}│<strong>${heading%360}°</strong>│${(heading+5)%360}│${(heading+10)%360}</span>`;
  const ground = getGroundProximity(state);
  const warning = hudCockpitWarning(state,ground,language);
  const power=$('cockpit-power'),warningMarkup=`<span>${warning}</span>`;
  if(power.innerHTML!==warningMarkup)power.innerHTML=warningMarkup;
  const projection = cockpitProjection(state,w,h,settings);
  const horizon = horizonSegment(projection.horizon,w,h);
  const left = insets.left+82, right = w-insets.right-102;
  const top = compassY+(!$('cockpit-exit-notice').hidden?98:$('cockpit-target-height').hidden?38:70), low = Math.max(top+20,powerY-8);
  let clip = `M${left},${top}H${right}V${low}H${left}Z`;
  const masks=[$('start-flow-view-button'),$('target-edge-marker'),$('cockpit-objective-label'),$('practice-panel')];
  if(layout.sideControls)masks.push($('bottom-panel'));
  for(const marker of masks.filter(e=>e&&!e.hidden&&e.getClientRects().length)) {
    const r=marker.getBoundingClientRect();
    const holeLeft=Math.max(left,r.left-4),holeRight=Math.min(right,r.right+4);
    const holeTop=Math.max(top,r.top-4),holeBottom=Math.min(low,r.bottom+4);
    if(holeLeft<holeRight && holeTop<holeBottom) clip += `M${holeLeft},${holeTop}H${holeRight}V${holeBottom}H${holeLeft}Z`;
  }
  const ladder = projection.lines.map(line => {
    const start=line.points[0],end=line.points.at(-1);
    let angle=Math.atan2(end.y-start.y,end.x-start.x)*180/Math.PI;
    if(angle>90)angle-=180; if(angle< -90)angle+=180;
    return `<g class="cockpit-ladder${line.degrees<0?' cockpit-ladder-below':''}" data-pitch-level="${line.degrees}"><path d="${path(line.points)}" ${line.degrees<0?'stroke-dasharray="4 5"':''}/><text x="${end.x}" y="${end.y-4}" transform="rotate(${angle} ${end.x} ${end.y})">${line.degrees}</text></g>`;
  }).join('');
  const nose = projection.nose;
  let flightPath = '';
  if (projection.flightPath) {
    const p = projection.flightPath;
    let x=p.x,y=p.y;
    const inside=p.inFront && x>=left+22 && x<=right-22 && y>=top+22 && y<=low-22;
    if (!inside) {
      const dx = Math.hypot(p.local.x,p.local.y)<1e-6 ? 1 : p.local.x, dy = -p.local.y;
      const norm=Math.hypot(dx,dy) || 1;
      const radius=Math.max(10,Math.min((right-left)/2-24,(low-top)/2-24));
      x=(left+right)/2+dx/norm*radius; y=(top+low)/2+dy/norm*radius;
    }
    const roll=Math.atan2(projection.horizon.a,-projection.horizon.b)*180/Math.PI;
    const separated=Math.hypot(p.x-nose.x,p.y-nose.y)>24;
    flightPath = `<g class="flight-path${separated?' flight-path-separated':''}" data-flight-path="${inside?'visible':'edge'}" transform="translate(${x} ${y}) rotate(${roll})"><circle r="10"/><path d="M-21,0H-10M10,0H21M0,-10V-19"/>${inside?'':`<text x="14" y="-14">${hudText(language,'flightPath')}</text>`}</g>`;
  }
  $('cockpit-conformal').setAttribute('viewBox',`0 0 ${w} ${h}`);
  $('cockpit-conformal').innerHTML = `<defs><clipPath id="cockpit-clip"><path d="${clip}" clip-rule="evenodd"/></clipPath></defs><g clip-path="url(#cockpit-clip)">${horizon.length===2?`<path id="cockpit-horizon" d="${path(horizon)}"/>`:''}${ladder}<g data-boresight transform="translate(${nose.x} ${nose.y})"><path d="M-17,0H-6L0,5L6,0H17M0,-6V-2"/></g>${flightPath}</g>`;
  root.dataset.readings=JSON.stringify(readings);
  root.dataset.horizon=JSON.stringify(projection.horizon);
}
