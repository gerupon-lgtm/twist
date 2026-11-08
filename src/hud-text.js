import {FLIGHT_MODEL} from './flight-physics.js';

/** Display-only HUD vocabulary. Never translate the stage, diagnostics, or report data. */
const TEXT = Object.freeze({
  speed: ['SPD', '速度'], altitude: ['ALT', '現在高度'],
  verticalSpeed: ['V/S', '昇降速度'], heading: ['HDG', '方位'],
  throttle: ['THR', 'エンジン出力'], targetAltitude: ['TGT ALT', '目標'],
  heightSame: ['ALT OK', '高さ同じ'], heightOkay: ['ALT OK', '高さOK'],
  climb: ['CLIMB', '▲ 早めに上へ'], descend: ['DESCEND', '▼ 早めに下へ'],
  nose: ['NOSE', '機首'], bank: ['BANK', '翼の傾き'],
  flightPath: ['FPM', '進行'], radarTrack: ['TRK', '進行方向'],
  terrain: ['TERRAIN', '地面注意'], pullUp: ['PULL UP', '地面接近！'],
  stall: ['STALL', '失速から復帰補助中'], exit: ['EXIT', '出口'],
  exitOpen: ['EXIT OPEN', '出口開放・黄色と白の門へ'],
  nextTarget: ['NEXT', '次は'], flightDirector: ['FD', '目標へ向かう輪'],
  aligned: ['ALIGNED', '合っています'], target: ['TGT', '目標'],
  arrived: ['ARRIVED', '到着'], altitudeShort: ['ALT', '高さ'],
  groundClearance: ['ALT', '地面まで'], climbShort: ['V/S', '昇降'],
  guidanceLevel: ['LEVEL TO SHOW GUIDANCE', '姿勢を水平に戻すと案内を表示'],
  flightPathOut: ['FPM OUT OF VIEW', '進行方向は画面外です'],
  flightPathCovered: ['FPM OBSCURED', '進行方向の印は計器の奥です'],
  flightPathWaiting: ['FPM WHEN MOVING', '移動を始めると進行方向を表示'],
});

export const normalizeHudLanguage = value => value === 'ja' ? 'ja' : 'en';
export function hudText(language, key) {
  return TEXT[key]?.[normalizeHudLanguage(language) === 'ja' ? 1 : 0] ?? '';
}

/** Accept an existing stage status or radar target; the Japanese source label is left intact. */
export function hudTargetLabel(source, language = 'en') {
  const label = typeof source?.targetLabel === 'string' ? source.targetLabel
    : typeof source?.label === 'string' ? source.label : '';
  const exit = source?.kind === 'exit' || label === '出口'
    || (Number.isFinite(source?.collected) && Number.isFinite(source?.total)
      && source.total > 0 && source.collected >= source.total);
  if (exit) return hudText(language, 'exit');
  const parsed = /^光\s*(\d+)$/.exec(label);
  const candidate = source?.number ?? (parsed ? Number(parsed[1])
    : Number.isInteger(source?.collected) && source.collected >= 0 ? source.collected + 1 : null);
  const number = Number.isInteger(candidate) && candidate > 0 ? candidate : null;
  if (normalizeHudLanguage(language) === 'ja') return label || (number ? `光 ${number}` : '目標');
  return number ? `TGT ${number}` : 'TGT';
}

export function hudHeightDelta(delta, language = 'en', { digits = 1, equal = '高さ同じ' } = {}) {
  if (!Number.isFinite(delta)) return '—';
  const places = Number.isInteger(digits) ? Math.max(0, Math.min(3, digits)) : 1;
  if (Math.abs(delta) < .05) return normalizeHudLanguage(language) === 'ja' ? equal : 'ALT OK';
  const magnitude = Math.abs(delta).toFixed(places);
  return normalizeHudLanguage(language) === 'ja'
    ? `${delta > 0 ? '▲上に' : '▼下に'}${magnitude}m`
    : `${delta > 0 ? '▲ +' : '▼ −'}${magnitude}m`;
}

/** Horizontal direction is already shown by the rotating arrow; add only a height symbol in English. */
export function hudDirectionText(state, language = 'en', { assisted = false } = {}) {
  const bearing = Number.isFinite(state?.bearing) ? state.bearing : 0;
  const elevation = Number.isFinite(state?.elevation) ? state.elevation : 0;
  if (normalizeHudLanguage(language) === 'en') return Math.abs(elevation) > .13 ? (elevation > 0 ? '▲' : '▼') : '';
  const behind = Math.abs(bearing) > Math.PI / 2;
  const directlyBehind = assisted && Math.abs(bearing) >= 175 * Math.PI / 180;
  const horizontal = behind ? (directlyBehind ? '後ろ' : bearing > 0 ? '右の後ろ' : '左の後ろ')
    : Math.abs(bearing) > .25 ? (bearing > 0 ? '右' : '左') : '正面';
  const vertical = Math.abs(elevation) > .13 ? (elevation > 0 ? '上' : '下') : '';
  return `${horizontal}${vertical ? `・${vertical}` : ''}`;
}

export function hudGroundWarning(level, language = 'en') {
  const messages = normalizeHudLanguage(language) === 'ja'
    ? { clear: '地面との間隔', low: '低空に注意', danger: '地面接近！', stopped: '地面に接触', unknown: '高さを確認できません' }
    : { clear: '', low: 'TERRAIN', danger: 'PULL UP', stopped: 'TERRAIN', unknown: 'ALT —' };
  return messages[level] ?? messages.unknown;
}

/** One display predicate for powered recovery and an unpowered real stall. */
export function hudStallWarning(state={},language='en'){
  const assisting=Number.isFinite(state?.recoveryAssist)&&state.recoveryAssist>0;
  const stalled=assisting||Number.isFinite(state?.angleOfAttack)&&Math.abs(state.angleOfAttack)>=FLIGHT_MODEL.stallStart;
  return !stalled?'':normalizeHudLanguage(language)==='ja'&&!assisting?'失速':hudText(language,'stall');
}

export function hudCockpitWarning(state, ground, language = 'en') {
  const ja = normalizeHudLanguage(language) === 'ja';
  if (state?.grounded) return ja ? '地面に接触・停止' : 'TERRAIN';
  const stall=hudStallWarning(state,language);
  const warning = [
    ['danger', 'low'].includes(ground?.level) ? (ja ? '地面注意' : ground.level === 'danger' ? 'PULL UP' : 'TERRAIN') : '',
    stall,
    state?.inputHeld && ground?.level === 'clear' && !stall
      ? (ja ? '入力保持中・傾きを戻すと追従' : 'INPUT HOLD') : '',
  ].filter(Boolean).join(' / ');
  return warning || (ja ? '機首 ┼　進行方向 ⊙' : 'NOSE ┼　FPM ⊙');
}

const STATUS = Object.freeze({
  '停止中': 'STOP', '上昇中': 'CLIMB', '下降中': 'DESCEND', '巡航中': 'CRUISE',
  'ブレーキ': 'BRAKE', '加速中': 'ACCEL', '速度維持': 'SPD HOLD',
  '失速からの復帰補助中': 'STALL', '地面を見る補助中': 'TERRAIN', '中立で翼を戻す': 'WINGS LEVEL',
});
export function hudStatusLabel(label, language = 'en') {
  return normalizeHudLanguage(language) === 'ja' ? label : STATUS[label] ?? '';
}

export function hudObjectiveText(state, language = 'en') {
  const total=Number.isInteger(state?.total)&&state.total>0?state.total:3;
  const collected=Number.isInteger(state?.collected)&&state.collected>=0?Math.min(total,state.collected):0;
  return normalizeHudLanguage(language) === 'ja'
    ? collected < total ? `${total}つの光を集めて、出口へ` : '光がそろいました。出口へ'
    : collected < total ? `TGT ${collected}/${total} → EXIT` : 'EXIT OPEN';
}

export function hudCollectedNotice(state, language = 'en') {
  const total=Number.isInteger(state?.total)&&state.total>0?state.total:3;
  const remaining=Number.isInteger(state?.collected)&&state.collected>=0?Math.max(0,total-state.collected):total;
  return normalizeHudLanguage(language) === 'ja'
    ? remaining === 0 ? `${total}つの光がそろいました。出口へ向かいましょう。` : `光を集めました。あと${remaining}つ。`
    : remaining === 0 ? 'EXIT OPEN' : `TGT COLLECTED · ${remaining} REM`;
}
