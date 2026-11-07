import { projectRadarTarget, placeRadar, rectanglesOverlap } from './radar.js';

const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const svg = (name, attributes) => {
  const node = document.createElementNS(NS, name);
  for (const [key,value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
};
export function updateRadar(state, { visibility, phase, range }) {
  const panel = $('radar');
  panel.hidden = visibility !== 'assisted' || phase !== 'running' || state.complete;
  if (panel.hidden) return;
  const rects = ['bottom-panel','toast','practice-panel'].map($)
    .filter(el => !el.hidden && el.getClientRects().length).map(el => el.getBoundingClientRect());
  rects.push(document.querySelector('.navigation').getBoundingClientRect(), document.querySelector('.topbar').getBoundingClientRect(),
    { left: innerWidth/2-40, right: innerWidth/2+40, top: innerHeight/2-40, bottom: innerHeight/2+40 });
  const placement = placeRadar({ width: innerWidth, height: innerHeight, obstacles: rects });
  if (!placement) { panel.hidden = true; return; }
  panel.style.left = `${placement.left}px`; panel.style.top = `${placement.top}px`;
  panel.dataset.range = range; panel.dataset.heading = state.radarHeading;
  $('radar-range').textContent = `${range}m`;
  const layer = $('radar-targets'); layer.replaceChildren();
  const targets = [...(state.navigationTargets || [])].sort((a,b) => Number(a.next) - Number(b.next));
  for (const target of targets) {
    const point = projectRadarTarget({ position: state.position, target: target.position, heading: state.radarHeading, range });
    if (!point) continue;
    const x = point.x * 36, y = point.y * 36;
    const group = svg('g', { class: `radar-target${target.next ? ' radar-next' : ''}${target.kind === 'exit' ? ' radar-exit' : ''}`,
      'data-id': target.id, 'data-next': target.next, 'data-outside': point.outside, 'data-x': x, 'data-y': y });
    const mark = target.kind === 'exit' ? svg('path', { d: `M${x},${y-5}l5,5 -5,5 -5,-5Z` })
      : svg('circle', { cx: x, cy: y, r: target.next ? 4.5 : 2.5 });
    const sign = point.elevation === 'above' ? '▲' : point.elevation === 'below' ? '▼' : '＝';
    const caption = target.kind === 'exit' ? `出口${sign}` : `${target.number}${sign}${target.next ? Math.round(Math.abs(point.height))+'m' : ''}`;
    const text = svg('text', { x: Math.max(-40,Math.min(40,x)), y: Math.max(-29,Math.min(32,y + (y < -20 ? 12 : -8))),
      'text-anchor': x > 15 ? 'end' : x < -15 ? 'start' : 'middle' });
    text.textContent = caption;
    const title = svg('title', {}); title.textContent = `${target.label}・${point.elevation === 'level' ? '同じ高さ' : (point.height > 0 ? '上' : '下')+Math.round(Math.abs(point.height))+'m'}・水平距離${Math.round(point.distance)}m`;
    group.append(title, mark, text); layer.append(group);
  }
}

/** Keep a 100×50 edge marker away from the radar while retaining its arrow. */
export function avoidRadarMarker(point, bounds, extraObstacles = []) {
  const radar = $('radar');
  const obstacles = [...(radar.hidden ? [] : [radar.getBoundingClientRect()]), ...extraObstacles];
  const box = p => ({ left:p.x-50,right:p.x+50,top:p.y-25,bottom:p.y+25 });
  if (!obstacles.some(obstacle => rectanglesOverlap(box(point), obstacle, 6))) return point;
  const candidates = [...obstacles.flatMap(obstacle => [
    {x:obstacle.right+56,y:point.y},{x:obstacle.left-56,y:point.y},
    {x:point.x,y:obstacle.bottom+31},{x:point.x,y:obstacle.top-31},
  ]),
    {x:bounds.left,y:bounds.top},{x:bounds.right,y:bounds.top},{x:bounds.left,y:bounds.bottom},{x:bounds.right,y:bounds.bottom},
  ].map(p=>({x:Math.max(bounds.left,Math.min(bounds.right,p.x)),y:Math.max(bounds.top,Math.min(bounds.bottom,p.y))}));
  candidates.sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y));
  return candidates.find(p=>!obstacles.some(obstacle=>rectanglesOverlap(box(p),obstacle,6))
    && !(p.x>innerWidth/2-100 && p.x<innerWidth/2+100 && p.y>innerHeight/2-75 && p.y<innerHeight/2+75)) || point;
}
