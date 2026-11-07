import { APP_VERSION } from './version.js';
import { FLIGHT_SETTING_FIELDS, DEFAULT_FLIGHT_SETTINGS, normalizeFlightSettings, loadFlightSettings, saveFlightSettings } from './flight-settings.js';
import { flightReport, copyableFlightReport } from './flight-session.js';
import { computeFieldOfView } from './visibility.js';
import { createRangeEditor } from './range-editor.js';

const $ = id => document.getElementById(id);
const describeSettings = report => Object.entries(FLIGHT_SETTING_FIELDS)
  .map(([key, field]) => `${field.label} ${typeof field.initial==='boolean'?(report.settings[key]?'オン':'オフ'):field.auto && report.settings[key]===0 ? '自動' : report.settings[key]+field.unit}${report.inactiveSettings.includes(key) ? '（未使用）' : ''}`).join(' / ');

export function createFlightPanel(getModes) {
  let storage;
  try { storage = window.localStorage; } catch { /* Defaults also work without storage access. */ }
  let settings = loadFlightSettings(storage);
  let result = null;
  const rangeEditors={};let beforeReset=null;
  const fovAuto=document.createElement('input');fovAuto.type='checkbox';fovAuto.id='cockpit-fov-auto';
  for (const [key, field] of Object.entries(FLIGHT_SETTING_FIELDS)) {
    const label = document.createElement('label');
    label.htmlFor = `setting-${key}`;
    label.dataset.settingKey = key;
    const caption = document.createElement('span'); caption.textContent = field.label;
    const value = document.createElement('output'); value.id = `setting-value-${key}`;
    value.htmlFor = label.htmlFor;
    const input = document.createElement('input');
    if(typeof field.initial==='boolean')Object.assign(input,{type:'checkbox',id:label.htmlFor});
    else Object.assign(input, { type: 'range', id: label.htmlFor, min: field.min, max: field.max, step: field.step });
    label.append(caption, value, input); $('flight-settings-fields').append(label);
    input.value=settings[key];
    if(input.type==='range')rangeEditors[key]=createRangeEditor(input,{name:field.label,unit:field.unit,initial:field.initial,onReset:()=>{
      settings=normalizeFlightSettings({...settings,[key]:field.initial});persist();
    }});
    if(key==='cockpitFov') {
      const autoLabel=document.createElement('label');autoLabel.className='cockpit-fov-auto';autoLabel.dataset.settingKey=key;
      autoLabel.append(fovAuto,document.createTextNode('視野を自動計算する'));$('flight-settings-fields').append(autoLabel);
    }
    input.addEventListener('input', () => {
      settings = normalizeFlightSettings({ ...settings, [key]: input.type==='checkbox'?input.checked:Number(input.value) });
      persist();
    });
  }
  function refreshLayout() {
    const modes=getModes(),maximum=computeFieldOfView(innerWidth,innerHeight,modes.view).vertical;
    const input=$('setting-cockpitFov');input.max=String(Math.floor(maximum*10)/10);
    input.value=String(settings.cockpitFov===0?maximum:Math.min(maximum,settings.cockpitFov));
    fovAuto.checked=settings.cockpitFov===0;
    const inactive=modes.mode!=='flight'||modes.camera!=='cockpit';
    fovAuto.disabled=inactive;input.disabled=inactive||fovAuto.checked;
    $('setting-ladderRange').disabled=inactive;
    $('setting-targetHeightGuide').disabled=modes.view!=='assisted';
    $('setting-value-cockpitFov').textContent=fovAuto.checked?`自動（${maximum.toFixed(1)}°）`:`${Math.min(maximum,settings.cockpitFov).toFixed(1)}°`;
    for(const editor of Object.values(rangeEditors))editor.sync();
  }
  fovAuto.addEventListener('change',()=>{
    settings={...settings,cockpitFov:fovAuto.checked?0:Math.floor(computeFieldOfView(innerWidth,innerHeight,getModes().view).vertical*10)/10};persist();
  });
  function refresh() {
    for (const [key, field] of Object.entries(FLIGHT_SETTING_FIELDS)) {
      if(typeof field.initial==='boolean')$(`setting-${key}`).checked=settings[key];else $(`setting-${key}`).value = settings[key];
      $(`setting-value-${key}`).textContent = typeof field.initial==='boolean'?'':`${settings[key]}${field.unit}`;
    }
    refreshLayout();
  }
  function persist() {
    const saved = saveFlightSettings(storage, settings);
    $('settings-status').textContent = saved ? 'このブラウザーに保存しました。' : '保存できません。この画面を開いている間だけ使えます。';
    refresh();
  }
  async function copy(report, prefix) {
    const text = copyableFlightReport(report);
    const output = $(`${prefix}-copy-text`), status = $(`${prefix}-copy-status`);
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'コピーしました。'; output.hidden = true;
    } catch {
      output.value = text; output.hidden = false; output.focus(); output.select();
      status.textContent = '自動コピーできません。下の文字列を選択してコピーしてください。';
    }
  }
  $('settings-reset').addEventListener('click', () => {
    beforeReset={...settings};$('settings-undo-reset').hidden=false;
    settings = getModes().mode === 'explore'
      ? { ...settings, radarRange: DEFAULT_FLIGHT_SETTINGS.radarRange, targetHeightGuide: true }
      : { ...DEFAULT_FLIGHT_SETTINGS };
    persist();
  });
  $('settings-undo-reset').addEventListener('click',()=>{if(beforeReset){settings=beforeReset;beforeReset=null;persist();$('settings-undo-reset').hidden=true;}});
  $('settings-copy').addEventListener('click', () => copy(flightReport({ version: APP_VERSION, ...getModes(), settings, result: result?.result }), 'settings'));
  $('result-copy').addEventListener('click', () => { if (result) copy(result, 'result'); });
  refresh();
  return {
    getSettings: () => settings,
    refreshLayout,
    report: (stats, outcome, lastLeg) => flightReport({ version: APP_VERSION, ...getModes(), settings, stats, lastLeg, result: outcome }),
    showResult(report) {
      result = report;
      $('flight-result').hidden = !report;
      $('result-copy-text').hidden = true; $('result-copy-status').textContent = '';
      if (!report) return;
      const { stats } = report;
      const last = report.lastLeg || stats;
      $('result-legs').textContent = `${stats.legs || 1}回`;
      $('result-last-elapsed').textContent = `${last.elapsedSeconds.toFixed(1)}秒`;
      $('result-last-contacts').textContent = `${last.groundContacts}回`;
      $('result-last-recovery').textContent = `${last.recoverySeconds.toFixed(1)}秒`;
      $('result-elapsed').textContent = `${stats.elapsedSeconds.toFixed(1)}秒`;
      $('result-contacts').textContent = `${stats.groundContacts}回`;
      $('result-recovery').textContent = `${stats.recoverySeconds.toFixed(1)}秒`;
      $('result-outcome').textContent = report.result === 'clear' ? 'クリア' : '墜落';
      $('result-modes').textContent = `pitch=${report.pitch} / steer=${report.steer} / display=${report.display} / camera=${report.camera}`;
      $('result-settings').textContent = describeSettings(report);
    },
    setPhase(phase, mode) {
      $('flight-adjustments').hidden = phase !== 'paused';
      const inactiveSteering = getModes().steer === 'twist' ? ['maxSteerTilt','steerTiltDeadzone'] : ['maxSteerTwist','steerTwistDeadzone'];
      for (const label of $('flight-settings-fields').children) label.hidden = (mode !== 'flight' && !['radarRange','targetHeightGuide'].includes(label.dataset.settingKey))
        || inactiveSteering.includes(label.dataset.settingKey);
      $('setting-chaseTimeConstant').disabled = mode !== 'flight' || getModes().camera !== 'chase';
      refreshLayout();
      $('flight-settings-help').hidden = mode !== 'flight';
      $('settings-reset').textContent = mode === 'flight' ? '操縦をすべて初期値へ' : '目印をすべて初期値へ';
      $('adjustment-scope-note').textContent = mode === 'flight'
        ? '機首と旋回の入力角度を別々に調整します。選んだ旋回方式の項目だけ表示します。'
        : 'レーダーの表示範囲と目標高度の目印を調整します。探索の操縦には影響しません。';
      if (phase !== 'paused') $('flight-adjustments').open = false;
      if (phase === 'running' || mode !== 'flight') this.showResult(null);
    },
  };
}
