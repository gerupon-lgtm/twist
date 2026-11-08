import { normalizeFlightSettings } from './flight-settings.js';
import { FLIGHT_SETTING_FIELDS } from './flight-settings.js';
import { changedSettings } from './setting-differences.js';

/** Counts active play time supplied by the caller; menus and sensor waits never advance it. */
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

export function flightReport({ version, pitch, steer, display = 'bank', camera = 'overlay', result, settings, stats, lastLeg, mode = 'flight', view = 'assisted', feedback, input, segments, approaches, abStraights, passbys, courseTime, exitDiscovery, targetViews, course, stageSize, afterburner, launch = 'browser', fullscreen = false }) {
  const normalized=normalizeFlightSettings(settings);
  const inactiveSettings = [...(pitch === 'rate' ? [...(mode==='flight'&&normalized.flightDirector?[]:['maxPitch']), 'timeConstant'] : []),
    ...(display !== 'fixed' ? ['displayTimeConstant'] : []), ...(view !== 'assisted' ? ['radarRange'] : []),
    ...(camera !== 'chase' || mode !== 'flight' ? ['chaseTimeConstant'] : [])];
  inactiveSettings.push(...(steer === 'twist' ? ['maxSteerTilt','steerTiltDeadzone'] : ['maxSteerTwist','steerTwistDeadzone']));
  if(mode!=='flight'||camera!=='cockpit')inactiveSettings.push('ladderRange','cockpitFov');
  if(view!=='assisted')inactiveSettings.push('targetHeightGuide','streakAmount','groundPatternStrength');
  if(mode==='flight'&&!normalized.autoAfterburner)inactiveSettings.push('autoAfterburnerAngle');
  if(mode!=='flight')inactiveSettings.push('speedFov','highSpeedShake','autoAfterburner','autoAfterburnerAngle');
  if(mode!=='flight')inactiveSettings.push('flightDirector','targetHeadingCue','edgeGuidance','nextTargetNotice','audioGuidance');
  if (mode === 'explore') for (const key of ['deadzone','maxTilt','maxPitch','timeConstant','maxBank','turnGravity','displayTimeConstant','maxSteerTilt','maxSteerTwist','steerTiltDeadzone','steerTwistDeadzone','steerCurve']) if (!inactiveSettings.includes(key)) inactiveSettings.push(key);
  return { version, mode, view, pitch, steer, launch: launch === 'installed' ? 'installed' : 'browser', fullscreen: Boolean(fullscreen), camera: mode === 'flight' && ['chase','cockpit'].includes(camera) ? camera : 'overlay', display: display === 'fixed' ? 'fixed' : 'bank',
    ...(['clear', 'grounded'].includes(result) ? { result } : {}),
    settings: normalized, changedSettings:changedSettings(FLIGHT_SETTING_FIELDS,normalized), inactiveSettings,
    ...(feedback ? {feedback:structuredClone(feedback)} : {}),
    ...(input ? {input:structuredClone(input)} : {}),
    ...(segments ? {segments:structuredClone(segments)} : {}),
    ...(approaches ? {approaches:structuredClone(approaches)} : {}),
    ...(abStraights ? {abStraights:structuredClone(abStraights)} : {}),
    ...(passbys ? {passbys:structuredClone(passbys)} : {}),
    ...(courseTime ? {courseTime:structuredClone(courseTime)} : {}),
    ...(exitDiscovery ? {exitDiscovery:structuredClone(exitDiscovery)} : {}),
    ...(targetViews ? {targetViews:structuredClone(targetViews)} : {}),
    ...(course ? {course:structuredClone(course)} : {}),
    ...(stageSize ? {stageSize:structuredClone(stageSize)} : {}),
    ...(afterburner ? {afterburner:structuredClone(afterburner)} : {}),
    ...(stats ? { stats: { ...stats } } : {}), ...(lastLeg ? { lastLeg: { ...lastLeg } } : {}) };
}

export const copyableFlightReport = report => JSON.stringify(report);
