import { CONTROL_LIMITS, flightRates } from './controls.js';
import { normalizeFlightSettings } from './flight-settings.js';
import {wristSteeringDemand} from './wrist-input.js';

const radians = degrees => degrees * Math.PI / 180;

export function flightPitchTarget(tilt, settings) {
  const { deadzone, maxTilt, maxPitch } = normalizeFlightSettings(settings);
  if (!Number.isFinite(tilt)) return 0;
  return Math.sign(tilt) * Math.min(1, Math.max(0, (Math.abs(tilt) - deadzone) / (maxTilt - deadzone))) * radians(maxPitch);
}

/** Exact exponential following per frame, capped at the former rotation rate. */
export function followFlightPitch(current, target, dt, timeConstant = .3) {
  if (![current, target, dt].every(Number.isFinite) || dt <= 0) return 0;
  const tau = normalizeFlightSettings({ timeConstant }).timeConstant;
  const error = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  const rate = error * -Math.expm1(-dt / tau) / dt;
  return Math.max(-CONTROL_LIMITS.pitchRate, Math.min(CONTROL_LIMITS.pitchRate, rate));
}

export function flightCommands(angles, { pitchMode = 'angle', steering = 'tilt', settings, currentPitch = 0, dt = 0 } = {}) {
  const config = normalizeFlightSettings(settings);
  const rates = flightRates(angles, 1, steering, config);
  // The legacy rate implementation remains untouched; only the new mode overrides bank.
  if (steering === 'wrist') rates.bankAngle = wristSteeringDemand(angles?.wrist, config) * radians(config.maxBank);
  if (pitchMode === 'rate') return rates;
  const pitchTarget = flightPitchTarget(angles?.pitch, config);
  return { ...rates, pitchTarget, pitchRate: followFlightPitch(currentPitch, pitchTarget, dt, config.timeConstant) };
}
