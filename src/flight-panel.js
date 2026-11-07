import { APP_VERSION } from './version.js';
import { FLIGHT_SETTING_FIELDS, DEFAULT_FLIGHT_SETTINGS, loadFlightSettings, saveFlightSettings } from './flight-settings.js';
import { flightReport, copyableFlightReport } from './flight-session.js';

const $ = id => document.getElementById(id);
const describeSettings = report => Object.entries(FLIGHT_SETTING_FIELDS)
  .map(([key, field]) => `${field.label} ${report.settings[key]}${field.unit}${report.inactiveSettings.includes(key) ? '（未使用）' : ''}`).join(' / ');

export function createFlightPanel(getModes) {
  let storage;
  try { storage = window.localStorage; } catch { /* Defaults also work without storage access. */ }
  let settings = loadFlightSettings(storage);
  let result = null;
  for (const [key, field] of Object.entries(FLIGHT_SETTING_FIELDS)) {
    const label = document.createElement('label');
    label.htmlFor = `setting-${key}`;
    label.dataset.settingKey = key;
    const caption = document.createElement('span'); caption.textContent = field.label;
    const value = document.createElement('output'); value.id = `setting-value-${key}`;
    value.htmlFor = label.htmlFor;
    const input = document.createElement('input');
    Object.assign(input, { type: 'range', id: label.htmlFor, min: field.min, max: field.max, step: field.step });
    label.append(caption, value, input); $('flight-settings-fields').append(label);
    input.addEventListener('input', () => {
      settings = { ...settings, [key]: Number(input.value) };
      persist();
    });
  }
  function refresh() {
    for (const [key, field] of Object.entries(FLIGHT_SETTING_FIELDS)) {
      $(`setting-${key}`).value = settings[key];
      $(`setting-value-${key}`).textContent = `${settings[key]}${field.unit}`;
    }
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
  $('settings-reset').addEventListener('click', () => { settings = { ...DEFAULT_FLIGHT_SETTINGS }; persist(); });
  $('settings-copy').addEventListener('click', () => copy(flightReport({ version: APP_VERSION, ...getModes(), settings, result: result?.result }), 'settings'));
  $('result-copy').addEventListener('click', () => { if (result) copy(result, 'result'); });
  refresh();
  return {
    getSettings: () => settings,
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
      $('result-modes').textContent = `pitch=${report.pitch} / steer=${report.steer} / display=${report.display}`;
      $('result-settings').textContent = describeSettings(report);
    },
    setPhase(phase, mode) {
      $('flight-adjustments').hidden = phase !== 'paused';
      for (const label of $('flight-settings-fields').children) label.hidden = mode !== 'flight' && label.dataset.settingKey !== 'radarRange';
      $('flight-settings-help').hidden = mode !== 'flight';
      $('adjustment-scope-note').textContent = mode === 'flight'
        ? 'レーダーと飛行機の操作を調整します。前後・左右のひねりで中立範囲と最大傾きを共用します。'
        : 'レーダーの表示範囲を調整します。探索の操縦には影響しません。';
      if (phase !== 'paused') $('flight-adjustments').open = false;
      if (phase === 'running' || mode !== 'flight') this.showResult(null);
    },
  };
}
