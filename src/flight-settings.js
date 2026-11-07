export const FLIGHT_SETTINGS_KEY = 'twist.flight-settings.v1';
export const FLIGHT_SETTING_FIELDS = Object.freeze({
  deadzone: { label: '機首の中立範囲', min: 0, max: 8, step: 1, initial: 3, unit: '°' },
  maxTilt: { label: '機首が最大になるスマホの傾き', min: 10, max: 30, step: 1, initial: 25, unit: '°' },
  maxPitch: { label: '機首の最大角度', min: 5, max: 35, step: 1, initial: 15, unit: '°' },
  timeConstant: { label: '機首が追いつく時間の目安', min: .1, max: 1, step: .1, initial: .3, unit: '秒' },
  steerTiltDeadzone: { label: '旋回の中立範囲（ひねる）', min: 0, max: 8, step: 1, initial: 3, unit: '°' },
  maxSteerTilt: { label: '旋回が最大になるひねり', min: 5, max: 30, step: 1, initial: 15, unit: '°' },
  steerTwistDeadzone: { label: '旋回の中立範囲（回す）', min: 0, max: 8, step: 1, initial: 5, unit: '°' },
  maxSteerTwist: { label: '旋回が最大になる回し', min: 8, max: 40, step: 1, initial: 20, unit: '°' },
  steerCurve: { label: '旋回の効き方のカーブ', min: 1, max: 2, step: .1, initial: 1, unit: '' },
  maxBank: { label: '翼の最大角度', min: 5, max: 40, step: 1, initial: 40, unit: '°' },
  displayTimeConstant: { label: '固定表示の回転のならし', min: 0, max: .3, step: .01, initial: .05, unit: '秒' },
  chaseTimeConstant: { label: '追尾カメラの遅れ', min: 0, max: .5, step: .01, initial: .15, unit: '秒' },
  ladderRange: { label: '操縦席の角度線の範囲（機首から前後）', min: 5, max: 30, step: 5, initial: 10, unit: '°' },
  cockpitFov: { label: '操縦席の上下の視野', min: 60, max: 100, step: .1, initial: 0, auto: true, unit: '°' },
  radarRange: { label: 'レーダーの半径', min: 20, max: 120, step: 10, initial: 60, unit: 'm' },
  targetHeightGuide: { label: '目標高度の目印', initial: true },
});
export const DEFAULT_FLIGHT_SETTINGS = Object.freeze(Object.fromEntries(
  Object.entries(FLIGHT_SETTING_FIELDS).map(([key, field]) => [key, field.initial]),
));

export function normalizeFlightSettings(value) {
  const result = Object.fromEntries(Object.entries(FLIGHT_SETTING_FIELDS).map(([key, field]) => {
    const input = value?.[key];
    return [key, typeof field.initial==='boolean' ? typeof input==='boolean'?input:field.initial
      : field.auto && input === 0 ? 0 : Number.isFinite(input) ? Math.max(field.min, Math.min(field.max, input)) : field.initial];
  }));
  result.steerTiltDeadzone = Math.min(result.steerTiltDeadzone, result.maxSteerTilt - 1);
  result.steerTwistDeadzone = Math.min(result.steerTwistDeadzone, result.maxSteerTwist - 1);
  return result;
}

export function loadFlightSettings(storage) {
  try { return normalizeFlightSettings(JSON.parse(storage.getItem(FLIGHT_SETTINGS_KEY))); }
  catch { return { ...DEFAULT_FLIGHT_SETTINGS }; }
}

export function saveFlightSettings(storage, value) {
  try { storage.setItem(FLIGHT_SETTINGS_KEY, JSON.stringify(normalizeFlightSettings(value))); return true; }
  catch { return false; }
}
