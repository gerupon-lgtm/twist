export const FEEDBACK_SETTINGS_KEY = 'twist.feedback-settings.v1';
export const MUSIC_PREVIEW_SETTINGS_KEY = 'twist.music-preview.v1';
export const DEFAULT_MUSIC_PREVIEW_TRACK_ID = 'clear-overdrive';
export const FEEDBACK_FIELDS = Object.freeze({
  sound: { label: '音', initial: true },
  volume: { label: '全体の音量', initial: 25, min: 0, max: 100, step: 1, unit: '%' },
  sfx: { label: '効果音', initial: true },
  speedSound: {label:'速度・加速のSE',initial:true},
  vario: { label: '上昇・下降の音（バリオ）', initial: true },
  bgm: { label: 'BGM', initial: true },
  bgmVolume: { label: 'BGMの音量', initial: 50, min: 0, max: 100, step: 1, unit: '%' },
  musicEngine: {label:'BGMの音色',initial:'scc',options:{scc:'SCC',fm:'FM（ドラム以外）'}},
  musicSet: { label: '飛行中の曲', initial: 'ignition', options: { current: '採用7曲を順番に', rock: '黒曜の翼', newrock: '鋼翼・黎明・嵐の3曲', steel: '鋼翼の鼓動', horizon: '黎明の航跡', storm: '嵐を越えて', proposals: 'Ignition以降の3曲', ignition: 'Ignition Sky', advance: 'Steel Advance', overdrive: 'Overdrive Horizon', all: 'すべての飛行曲' },legacyOptions:{flight:'蒼穹突破',flight2:'遺跡の閃光',brave:'勇進の航路'} },
  clearTrackId:{label:'クリア時の曲',initial:'clear',options:{clear:'突破の凱歌','clear-ignition':'凱旋の点火','clear-advance':'鋼の勝利','clear-overdrive':'閃光の帰還'}},
  abMusic: {label:'ABでBGMを切り替える',initial:true},
  passbySound: {label:'すれ違う音',initial:true},
  vibration: { label: '振動', initial: true, group: 'vibration' },
  vibrationScale: { label: '振動の強さ（振動する時間の倍率）', initial: 1, min: 0, max: 2, step: .1, unit: '倍', group: 'vibration' },
  engineVibration: { label: '通常飛行の震え', initial: true, group: 'vibration' },
  flightVibration: { label: '通常飛行の振動間隔', initial: 'fine', options: { fine: '細かな震え（新）', classic: 'これまでの間隔' }, group: 'vibration' },
});
export function normalizeFeedbackSettings(value) {
  return Object.fromEntries(Object.entries(FEEDBACK_FIELDS).map(([key,field]) => [key,
    field.options ? Object.hasOwn(field.options,value?.[key])||Object.hasOwn(field.legacyOptions??{},value?.[key]) ? value[key] : field.initial
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

/** Preview selection has its own store; loading never migrates/writes game settings. */
export function loadMusicPreviewSettings(storage){
  try{const value=JSON.parse(storage.getItem(MUSIC_PREVIEW_SETTINGS_KEY));return {trackId:typeof value?.trackId==='string'&&/^[a-z][a-z0-9_-]{0,47}$/i.test(value.trackId)?value.trackId:null};}
  catch{return {trackId:null};}
}
export function saveMusicPreviewSettings(storage,value,catalog){
  if(!catalog?.previewIds.includes(value?.trackId))return false;
  try{storage.setItem(MUSIC_PREVIEW_SETTINGS_KEY,JSON.stringify({trackId:value.trackId}));return true;}catch{return false;}
}
