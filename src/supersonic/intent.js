import { normalizeFlightSettings } from '../flight-settings.js';
import {wristSteeringDemand} from '../wrist-input.js';
import { normalizeSupersonicSettings } from './settings.js';

const rad = degrees => degrees * Math.PI / 180;
const demand = (angle, deadzone, maximum) => Number.isFinite(angle)
  ? Math.sign(angle) * Math.min(1, Math.max(0, (Math.abs(angle) - deadzone) / (maximum - deadzone))) : 0;

/** Keep calibrated angle signs/deadzones/curves; only the new aircraft's authority differs. */
export function supersonicIntent(angles, options = {}) {
  const normal = normalizeFlightSettings(options.normalSettings ?? options.settings);
  const effective = normalizeSupersonicSettings(options.effectiveSettings ?? options.supersonicSettings);
  const twist = Number.isFinite(angles?.twist) ? Math.asin(Math.sin(rad(angles.twist))) * 180 / Math.PI : 0;
  const turn = options.steering === 'wrist' ? wristSteeringDemand(angles?.wrist, {...normal,steerCurve:1}) : options.steering === 'twist'
    ? demand(twist, normal.steerTwistDeadzone, normal.maxSteerTwist)
    : demand(angles?.steer, normal.steerTiltDeadzone, normal.maxSteerTilt);
  return {
    bankDemand: Math.sign(turn) * Math.abs(turn) ** normal.steerCurve,
    pitchMode: 'angle',
    pitchDemandRadians: demand(angles?.pitch, normal.deadzone, normal.maxTilt) * rad(15 * effective.pitchGain),
    throttle: Number.isFinite(options.throttle) ? Math.max(0, Math.min(1, options.throttle)) : .5,
    afterburnerRequested: options.afterburnerRequested === true || options.manualAfterburner === true,
    autoAfterburner: {
      enabled: options.autoAfterburner?.enabled ?? normal.autoAfterburner,
      pitchInputDegrees: Number.isFinite(angles?.pitch) ? angles.pitch : 0,
      angleDegrees: Number.isFinite(options.autoAfterburner?.angleDegrees) ? options.autoAfterburner.angleDegrees : normal.autoAfterburnerAngle,
    },
    paused: options.paused === true,
  };
}
