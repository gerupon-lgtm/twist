import { normalizeFlightSettings } from './flight-settings.js';

/** Counts simulated flying time; menus and waiting for sensors never advance it. */
export function createFlightSession() {
  const empty = () => ({ elapsedSeconds: 0, groundContacts: 0, recoverySeconds: 0 });
  let totals = { ...empty(), legs: 0 }, leg = empty(), pendingLeg = true, wasGrounded = false;
  const start = () => {
    if (pendingLeg) { totals.legs++; leg = empty(); pendingLeg = false; wasGrounded = false; }
  };
  return {
    start,
    advance(dt, state) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      start();
      for (const counters of [totals, leg]) {
        counters.elapsedSeconds += dt;
        if (state.recoveryAssist > 0) counters.recoverySeconds += dt;
        if (state.grounded && !wasGrounded) counters.groundContacts++;
      }
      wasGrounded = Boolean(state.grounded);
    },
    restartLeg() { pendingLeg = true; wasGrounded = false; },
    reset() { totals = { ...empty(), legs: 0 }; leg = empty(); pendingLeg = true; wasGrounded = false; },
    snapshot() { return { ...totals }; },
    lastLegSnapshot() { return { ...leg }; },
  };
}

export function flightReport({ version, pitch, steer, display = 'bank', camera = 'overlay', result, settings, stats, lastLeg, mode = 'flight', view = 'assisted', feedback, launch = 'browser', fullscreen = false }) {
  const inactiveSettings = [...(pitch === 'rate' ? ['maxPitch', 'timeConstant'] : []),
    ...(display !== 'fixed' ? ['displayTimeConstant'] : []), ...(view !== 'assisted' ? ['radarRange'] : []),
    ...(camera !== 'chase' || mode !== 'flight' ? ['chaseTimeConstant'] : [])];
  inactiveSettings.push(...(steer === 'twist' ? ['maxSteerTilt','steerTiltDeadzone'] : ['maxSteerTwist','steerTwistDeadzone']));
  if(mode!=='flight'||camera!=='cockpit')inactiveSettings.push('ladderRange','cockpitFov');
  if (mode === 'explore') for (const key of ['deadzone','maxTilt','maxPitch','timeConstant','maxBank','displayTimeConstant','maxSteerTilt','maxSteerTwist','steerTiltDeadzone','steerTwistDeadzone','steerCurve']) if (!inactiveSettings.includes(key)) inactiveSettings.push(key);
  return { version, mode, view, pitch, steer, launch: launch === 'installed' ? 'installed' : 'browser', fullscreen: Boolean(fullscreen), camera: mode === 'flight' && ['chase','cockpit'].includes(camera) ? camera : 'overlay', display: display === 'fixed' ? 'fixed' : 'bank',
    ...(['clear', 'grounded'].includes(result) ? { result } : {}),
    settings: normalizeFlightSettings(settings), inactiveSettings,
    ...(feedback ? {feedback:structuredClone(feedback)} : {}),
    ...(stats ? { stats: { ...stats } } : {}), ...(lastLeg ? { lastLeg: { ...lastLeg } } : {}) };
}

export const copyableFlightReport = report => JSON.stringify(report);
