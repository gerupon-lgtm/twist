export const FLIGHT_SETTINGS_KEY = 'twist.flight-settings.v1';
export const FLIGHT_SETTING_FIELDS = Object.freeze({
  deadzone: { label: '中立範囲', min: 0, max: 8, step: 1, initial: 3, unit: '°' },
  maxTilt: { label: '最大になるスマホの傾き', min: 10, max: 30, step: 1, initial: 25, unit: '°' },
  maxPitch: { label: '機首の最大角度', min: 5, max: 35, step: 1, initial: 15, unit: '°' },
  timeConstant: { label: '機首が追いつく時間の目安', min: .1, max: 1, step: .1, initial: .3, unit: '秒' },
  maxBank: { label: '翼の最大角度', min: 5, max: 40, step: 1, initial: 40, unit: '°' },
  displayTimeConstant: { label: '固定表示の回転のならし', min: 0, max: .3, step: .01, initial: .05, unit: '秒' },
});
export const DEFAULT_FLIGHT_SETTINGS = Object.freeze(Object.fromEntries(
  Object.entries(FLIGHT_SETTING_FIELDS).map(([key, field]) => [key, field.initial]),
));

export function normalizeFlightSettings(value) {
  return Object.fromEntries(Object.entries(FLIGHT_SETTING_FIELDS).map(([key, field]) => {
    const input = value?.[key];
    return [key, Number.isFinite(input) ? Math.max(field.min, Math.min(field.max, input)) : field.initial];
  }));
}

export function loadFlightSettings(storage) {
  try { return normalizeFlightSettings(JSON.parse(storage.getItem(FLIGHT_SETTINGS_KEY))); }
  catch { return { ...DEFAULT_FLIGHT_SETTINGS }; }
}

export function saveFlightSettings(storage, value) {
  try { storage.setItem(FLIGHT_SETTINGS_KEY, JSON.stringify(normalizeFlightSettings(value))); return true; }
  catch { return false; }
}
