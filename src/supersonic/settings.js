export const SUPERSONIC_SETTINGS_KEY = 'twist.supersonic-settings.v1';
export const DEFAULT_SUPERSONIC_SETTINGS = Object.freeze({ maxG: 9, fuelMode: 'unlimited', pitchGain: .35, radarRange: 10000 });
export const SUPERSONIC_SETTING_LIMITS = Object.freeze({
  maxG: Object.freeze({ min: 3, max: 12, step: .5 }),
  pitchGain: Object.freeze({ min: .1, max: 1, step: .05 }),
  radarRange: Object.freeze({ min: 2000, max: 20000, step: 1000 }),
});
export const SUPERSONIC_SETTING_FIELDS = Object.freeze([
  ...['maxG', 'pitchGain', 'radarRange'].map(key => Object.freeze({ key, type: 'number', ...SUPERSONIC_SETTING_LIMITS[key], defaultValue: DEFAULT_SUPERSONIC_SETTINGS[key] })),
  Object.freeze({ key: 'fuelMode', type: 'select', defaultValue: 'unlimited', options: Object.freeze([
    Object.freeze({ value: 'unlimited', label: 'UNLIMITED' }), Object.freeze({ value: 'gauge', label: 'GAUGE' }),
  ]) }),
]);

export function normalizeSupersonicSettings(value) {
  const result = { ...DEFAULT_SUPERSONIC_SETTINGS };
  for (const [key, limit] of Object.entries(SUPERSONIC_SETTING_LIMITS)) {
    if (Number.isFinite(value?.[key])) result[key] = Math.max(limit.min, Math.min(limit.max, value[key]));
  }
  if (value?.fuelMode === 'gauge' || value?.fuelMode === 'unlimited') result.fuelMode = value.fuelMode;
  return result;
}
export function loadSupersonicSettings(storage) {
  try { return normalizeSupersonicSettings(JSON.parse(storage.getItem(SUPERSONIC_SETTINGS_KEY))); }
  catch { return normalizeSupersonicSettings(); }
}
export function saveSupersonicSettings(storage, value) {
  const settings = normalizeSupersonicSettings(value);
  try { storage.setItem(SUPERSONIC_SETTINGS_KEY, JSON.stringify(settings)); return { settings, saved: true }; }
  catch { return { settings, saved: false }; }
}
