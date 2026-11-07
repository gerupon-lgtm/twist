/** Physics and records keep m/s; only the display boundary converts speed. */
export const SPEED_UNITS = Object.freeze(['m/s', 'km/h', 'kt']);
export const DEFAULT_SPEED_UNIT = 'km/h';

export function normalizeSpeedUnit(value) {
  return SPEED_UNITS.includes(value) ? value : DEFAULT_SPEED_UNIT;
}

export function convertSpeed(speed, unit = DEFAULT_SPEED_UNIT) {
  if (!Number.isFinite(speed) || speed <= 0) return 0;
  const selected = normalizeSpeedUnit(unit);
  return speed * (selected === 'km/h' ? 3.6 : selected === 'kt' ? 3600 / 1852 : 1);
}
