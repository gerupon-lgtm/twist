import { cockpitReadings, cockpitProjection, horizonSegment } from './cockpit-projection.js';
import { getGroundProximity } from './ground-proximity.js';

const $ = id => document.getElementById(id);
const point = p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
const path = points => points.map((p,i) => `${i?'L':'M'}${point(p)}`).join(' ');
const format = n => n.toFixed(1);
const box = (element,x,y,width,height) => Object.assign(element.style,{left:`${x}px`,top:`${y}px`,width:`${width}px`,height:`${height}px`});

export function updateCockpitHud(state, active) {
  const root = $('cockpit-hud'); root.hidden = !active;
  if (!active) return;
  const w = innerWidth, h = innerHeight, landscape = w>h;
  const bottom = $('bottom-panel').getBoundingClientRect();
  const radar = $('radar').getBoundingClientRect();
  const nav = document.querySelector('.navigation').getBoundingClientRect();
  const compassY = landscape ? nav.bottom+9 : Math.max(nav.bottom,radar.bottom)+10;
  const tapeY = landscape ? Math.max(radar.bottom+10, h/2-60) : Math.max(compassY+40,h/2-65);
  const tapeHeight = Math.max(70,Math.min(130,landscape?bottom.top-tapeY-12:130));
  const powerX = landscape ? Math.min(w/2-104,bottom.left-220) : w/2-104;
  const powerY = landscape ? h-45 : bottom.top-43;
  box($('cockpit-heading'),w/2-90,compassY,180,32);
  box($('cockpit-speed'),12,tapeY,58,tapeHeight);
  box($('cockpit-altitude'),w-70,tapeY,58,tapeHeight);
  box($('cockpit-power'),Math.max(76,powerX),powerY,208,36);
  const readings = cockpitReadings(state);
  const tape = (value,step,label,unit,extra='') => {
    const base = Math.round(value/step)*step;
    return `<span>${label} ${unit}</span><small>${Math.max(0,base+step)}</small><strong>${format(value)}</strong><small>${Math.max(0,base-step)}</small>${extra}`;
  };
  $('cockpit-speed').innerHTML = tape(readings.speed,2,'速度','m/s');
  $('cockpit-altitude').innerHTML = tape(readings.altitude,5,'地面まで','m',`<span>↕${readings.verticalSpeed>=0?'+':''}${format(readings.verticalSpeed)}m/s</span>`);
  const heading = Math.round(readings.heading);
  $('cockpit-heading').innerHTML = `<span>${(heading+350)%360} ┃ ${(heading+355)%360} ┃ <strong>${heading%360}°</strong> ┃ ${(heading+5)%360} ┃ ${(heading+10)%360}</span>`;
  const ground = getGroundProximity(state);
  const warning = state.grounded ? '地面に接触・停止' : [
    ['danger','low'].includes(ground.level) ? '地面注意' : '',
    state.recoveryAssist > 0 ? '失速から復帰補助中' : '',
  ].filter(Boolean).join(' / ') || '機首 ┼　進行方向 ⊙';
  $('cockpit-power').innerHTML = `<strong>出力 ${readings.power}%</strong><span>${warning}</span>`;
  const projection = cockpitProjection(state,w,h);
  const horizon = horizonSegment(projection.horizon,w,h);
  const left = 76, right = landscape ? Math.min(w-76,bottom.left-12) : w-76;
  const top = compassY+38, low = Math.max(top+20,powerY-8);
  let clip = `M${left},${top}H${right}V${low}H${left}Z`;
  const marker = $('target-edge-marker');
  if (!marker.hidden) {
    const r=marker.getBoundingClientRect();
    clip += `M${r.left-4},${r.top-4}H${r.right+4}V${r.bottom+4}H${r.left-4}Z`;
  }
  const ladder = projection.lines.map(line => {
    const start=line.points[0],end=line.points.at(-1);
    let angle=Math.atan2(end.y-start.y,end.x-start.x)*180/Math.PI;
    if(angle>90)angle-=180; if(angle< -90)angle+=180;
    return `<path d="${path(line.points)}" ${line.degrees<0?'stroke-dasharray="5 4"':''}/><text x="${end.x}" y="${end.y-4}" transform="rotate(${angle} ${end.x} ${end.y})">${line.degrees}</text>`;
  }).join('');
  const nose = projection.nose;
  let flightPath = '';
  if (projection.flightPath) {
    const p = projection.flightPath;
    let x=p.x,y=p.y;
    const inside=p.inFront && x>=left+14 && x<=right-14 && y>=top+14 && y<=low-14;
    if (!inside) {
      const dx = Math.hypot(p.local.x,p.local.y)<1e-6 ? 1 : p.local.x, dy = -p.local.y;
      const norm=Math.hypot(dx,dy) || 1;
      const radius=Math.max(10,Math.min((right-left)/2-16,(low-top)/2-16));
      x=(left+right)/2+dx/norm*radius; y=(top+low)/2+dy/norm*radius;
    }
    flightPath = `<g data-flight-path="${inside?'visible':'edge'}" transform="translate(${x} ${y})"><circle r="7"/><path d="M-15,0H-7M7,0H15M0,-7V-14"/>${inside?'':'<text x="10" y="-10">進行</text>'}</g>`;
  }
  $('cockpit-conformal').setAttribute('viewBox',`0 0 ${w} ${h}`);
  $('cockpit-conformal').innerHTML = `<defs><clipPath id="cockpit-clip"><path d="${clip}" clip-rule="evenodd"/></clipPath></defs><g clip-path="url(#cockpit-clip)">${horizon.length===2?`<path id="cockpit-horizon" d="${path(horizon)}"/>`:''}${ladder}<g data-boresight transform="translate(${nose.x} ${nose.y})"><path d="M-17,0H-6L0,5L6,0H17M0,-6V-2"/></g>${flightPath}</g>`;
  root.dataset.readings=JSON.stringify(readings);
  root.dataset.horizon=JSON.stringify(projection.horizon);
}
