import { normalizeSupersonicSettings } from './settings.js';
import { SUPERSONIC_AIRCRAFT_HULL, SUPERSONIC_AIRCRAFT_HULL_ID, SUPERSONIC_AIRCRAFT_HULL_SCALE } from './aircraft-hull.js';

const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
/** Stable JSON fingerprint, calculated at attempt creation, never in a physics substep. */
export function supersonicFingerprint(value) {
  const ordered = item => Array.isArray(item) ? item.map(ordered) : item && typeof item === 'object'
    ? Object.fromEntries(Object.keys(item).sort().map(key => [key, ordered(item[key])])) : item;
  const text = JSON.stringify(ordered(value));
  let a = 2166136261, b = 2246822519;
  for (let i = 0; i < text.length; i++) { a = Math.imul(a ^ text.charCodeAt(i), 16777619); b = Math.imul(b ^ text.charCodeAt(i), 3266489917); }
  return `s1-${(a >>> 0).toString(16).padStart(8, '0')}${(b >>> 0).toString(16).padStart(8, '0')}`;
}
export const SUPERSONIC_PROFILE_DEFAULTS = freeze({
  id: 'supersonic-v1', schemaVersion: 1, modelVersion: 1,
  speedOfSound: 340, startSpeed: 200, maxSpeed: 680, gravity: 9.8,
  referencePitchDegrees: 15, pitchResponseSeconds: .3, bankResponseSeconds: .25,
  dryThrust: 8, afterburnerThrust: 32.4, integrationStep: 1 / 120,
  autoAfterburner: { holdSeconds: .18, releaseDegrees: 5 },
  drag: { quadraticAtMach1: 8, waveStartMach: .9, waveEndMach: 1.1, wavePeak: 4 },
  fuel: { capacity: 100, startFuel: 100, drainPerSecond: 1.5, gateReward: 20 },
  seaLevel: 0, maxAltitude: 6000,
  lowSpeed: { oneGSpeed: 60, stallStartRadians: 20 * Math.PI / 180, stallEndRadians: 70 * Math.PI / 180 },
  hull: SUPERSONIC_AIRCRAFT_HULL, hullId: SUPERSONIC_AIRCRAFT_HULL_ID, hullScale: SUPERSONIC_AIRCRAFT_HULL_SCALE,
});
export function createSupersonicProfile(value) {
  const effectiveSettings = normalizeSupersonicSettings(value);
  const { maxG, fuelMode, pitchGain } = effectiveSettings;
  const physics = { ...SUPERSONIC_PROFILE_DEFAULTS, maxG, fuelMode, pitchGain };
  return freeze({ ...physics, effectiveSettings, maxBankRadians: Math.atan(Math.sqrt(maxG * maxG - 1)),
    maxPitchRadians: physics.referencePitchDegrees * pitchGain * Math.PI / 180,
    fingerprint: supersonicFingerprint(physics) });
}
