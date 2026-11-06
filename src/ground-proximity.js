/** Display thresholds only. This module never changes the flight or stop logic. */
export const GROUND_PROXIMITY_LIMITS = Object.freeze({
  stopClearance: 2,
  lowClearance: 5,
  dangerClearance: 3.5,
  lowSeconds: 3,
  dangerSeconds: 1.5,
  meterClearance: 12,
});

/**
 * Clearance is the height above ground level 0, not the gap to the 2 m stop.
 * ratio is a height meter (0..12 m -> 0..1), not a measure of warning severity.
 * A descending time estimate assumes the current vertical speed stays constant.
 * Unknown height returns a finite placeholder with known=false; callers must
 * display an unknown distance rather than treating that placeholder as 0 m.
 * Missing vertical speed disables prediction but retains height-based warnings.
 */
export function getGroundProximity(input) {
  const known = Number.isFinite(input?.altitude);
  const descentKnown = Number.isFinite(input?.verticalSpeed);
  const clearance = known ? Math.max(0, input.altitude) : 0;
  const descending = descentKnown && input.verticalSpeed < 0;
  const secondsToStop = known && descending
    ? Math.min(Number.MAX_VALUE,
      Math.max(0, clearance - GROUND_PROXIMITY_LIMITS.stopClearance) / -input.verticalSpeed)
    : null;
  let level;
  if (input?.grounded === true) level = 'stopped';
  else if (!known) level = 'unknown';
  else if (clearance <= GROUND_PROXIMITY_LIMITS.dangerClearance
    || (secondsToStop !== null && secondsToStop <= GROUND_PROXIMITY_LIMITS.dangerSeconds)) level = 'danger';
  else if (clearance <= GROUND_PROXIMITY_LIMITS.lowClearance
    || (secondsToStop !== null && secondsToStop <= GROUND_PROXIMITY_LIMITS.lowSeconds)) level = 'low';
  else level = 'clear';
  return {
    clearance,
    level,
    ratio: Math.max(0, Math.min(1, clearance / GROUND_PROXIMITY_LIMITS.meterClearance)),
    known,
    descentKnown,
    descending,
    secondsToStop,
  };
}
