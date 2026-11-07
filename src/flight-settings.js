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
  turnGravity: { label: '旋回の強さ', min: 3, max: 15, step: .1, initial: 9.8, unit: '' },
  displayTimeConstant: { label: '固定表示の回転のならし', min: 0, max: .3, step: .01, initial: .05, unit: '秒' },
  chaseTimeConstant: { label: '追尾カメラの遅れ', min: 0, max: .5, step: .01, initial: .15, unit: '秒' },
  ladderRange: { label: '操縦席の角度線の範囲（機首から前後）', min: 5, max: 30, step: 5, initial: 10, unit: '°' },
  cockpitFov: { label: '操縦席の上下の視野', min: 60, max: 100, step: .1, initial: 0, auto: true, unit: '°' },
  radarRange: { label: 'レーダーの半径', min: 20, max: 500, step: 10, initial: 180, unit: 'm' },
  streakAmount: {label:'空気の流線の量',min:0,max:2,step:.1,initial:1,unit:''},
  speedFov: {label:'速度による視野の広がり',min:0,max:15,step:1,initial:10,unit:'°'},
  highSpeedShake: {label:'高速時の小さな揺れ',initial:true},
  speedUnit: {label:'速度の単位',initial:'km/h',options:{'m/s':'m/s','km/h':'km/h',kt:'kt（ノット）'},unit:''},
  autoAfterburner: {label:'大きな機首下げ入力でAB',initial:false},
  autoAfterburnerAngle: {label:'自動ABの機首下げ入力',min:25,max:60,step:1,initial:35,unit:'°'},
  targetHeightGuide: { label: '目標高度の目印', initial: true },
  flightDirector: { label: '目標へ向かう輪', initial: true },
  targetHeadingCue: { label: '方位目盛りの目標の印', initial: true },
  edgeGuidance: { label: '画面の縁の目標案内', initial: true },
  nextTargetNotice: { label: '次の目標の合図', initial: true },
  audioGuidance: { label: '左右から聞こえる案内音', initial: true },
  hudLanguage: { label: 'HUDの表記', initial: 'en', options: {en:'英語',ja:'日本語'}, unit:'' },
});
export const DEFAULT_FLIGHT_SETTINGS = Object.freeze(Object.fromEntries(
  Object.entries(FLIGHT_SETTING_FIELDS).map(([key, field]) => [key, field.initial]),
));

export function normalizeFlightSettings(value) {
  const result = Object.fromEntries(Object.entries(FLIGHT_SETTING_FIELDS).map(([key, field]) => {
    const input = value?.[key];
    return [key, field.options ? typeof input==='string'&&Object.hasOwn(field.options,input)?input:field.initial : typeof field.initial==='boolean' ? typeof input==='boolean'?input:field.initial
      : field.auto && input === 0 ? 0 : Number.isFinite(input) ? Math.max(field.min, Math.min(field.max, input)) : field.initial];
  }));
  result.steerTiltDeadzone = Math.min(result.steerTiltDeadzone, result.maxSteerTilt - 1);
  result.steerTwistDeadzone = Math.min(result.steerTwistDeadzone, result.maxSteerTwist - 1);
  return result;
}
export function resetFlightSetting(value,key) {
  return normalizeFlightSettings(Object.hasOwn(FLIGHT_SETTING_FIELDS,key)?{...value,[key]:FLIGHT_SETTING_FIELDS[key].initial}:value);
}

export function loadFlightSettings(storage) {
  try { return normalizeFlightSettings(JSON.parse(storage.getItem(FLIGHT_SETTINGS_KEY))); }
  catch { return { ...DEFAULT_FLIGHT_SETTINGS }; }
}

export function saveFlightSettings(storage, value) {
  try { storage.setItem(FLIGHT_SETTINGS_KEY, JSON.stringify(normalizeFlightSettings(value))); return true; }
  catch { return false; }
}
