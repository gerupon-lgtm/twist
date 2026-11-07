export const FEEDBACK_SETTINGS_KEY = 'twist.feedback-settings.v1';
export const FEEDBACK_FIELDS = Object.freeze({
  sound: { label: '音', initial: true },
  volume: { label: '全体の音量', initial: 25, min: 0, max: 100, step: 1, unit: '%' },
  sfx: { label: '効果音', initial: true },
  vario: { label: '上昇・下降の音（バリオ）', initial: true },
  bgm: { label: 'BGM', initial: true },
  bgmVolume: { label: 'BGMの音量', initial: 50, min: 0, max: 100, step: 1, unit: '%' },
  musicSet: { label: '飛行中の曲', initial: 'current', options: { current: 'これまでの2曲', brave: '別案：勇進の航路', all: '3曲を順番に' } },
  vibration: { label: '振動', initial: true, group: 'vibration' },
  vibrationScale: { label: '振動の強さ（振動する時間の倍率）', initial: 1, min: 0, max: 2, step: .1, unit: '倍', group: 'vibration' },
  engineVibration: { label: '通常飛行の震え', initial: true, group: 'vibration' },
  flightVibration: { label: '通常飛行の振動間隔', initial: 'fine', options: { fine: '細かな震え（新）', classic: 'これまでの間隔' }, group: 'vibration' },
});
export function normalizeFeedbackSettings(value) {
  return Object.fromEntries(Object.entries(FEEDBACK_FIELDS).map(([key,field]) => [key,
    field.options ? Object.hasOwn(field.options,value?.[key]) ? value[key] : field.initial
      : typeof field.initial === 'boolean' ? typeof value?.[key] === 'boolean' ? value[key] : field.initial
      : Number.isFinite(value?.[key]) ? Math.max(field.min,Math.min(field.max,value[key])) : field.initial]));
}
export function loadFeedbackSettings(storage) {
  try { return normalizeFeedbackSettings(JSON.parse(storage.getItem(FEEDBACK_SETTINGS_KEY))); }
  catch { return normalizeFeedbackSettings(); }
}
export function saveFeedbackSettings(storage,value) {
  try { storage.setItem(FEEDBACK_SETTINGS_KEY,JSON.stringify(normalizeFeedbackSettings(value))); return true; }
  catch { return false; }
}
