import { supersonicFingerprint } from './profile.js';
import { normalizeSupersonicSettings } from './settings.js';

const finite = value => Number.isFinite(value) ? value : null;
/** Visual preferences and course labels do not split physics PBs; hull/planes do. */
export function supersonicBestKey(profile, course, value = profile.effectiveSettings) {
  const { maxG, fuelMode, pitchGain } = normalizeSupersonicSettings(value);
  return `supersonic:${supersonicFingerprint({ profile: profile.fingerprint, modelVersion: profile.modelVersion,
    hullId: profile.hullId, hullScale: profile.hullScale, hull: profile.hull, maxG, fuelMode, pitchGain,
    start: course.start, startHeading: course.startHeading ?? 0,
    gates: course.gates.map(({ center, normal, right, up, radius, kind }) => ({ center, normal, right, up, radius, kind })) })}`;
}
/** Physical event seconds and actually observed active seconds remain separate. */
export function supersonicSummary(source, record = {}) {
  const state = source?.supersonic ?? source;
  if (!state || typeof state !== 'object') throw new TypeError('supersonic state required');
  const metrics = state.metrics ?? state.records ?? state;
  const ab = state.afterburner ?? source.afterburner ?? record.afterburner ?? metrics.afterburner ?? {};
  const settings = state.effectiveSettings ?? record.effectiveSettings ?? metrics.effectiveSettings;
  return {
    profileId: state.profileId ?? metrics.profileId ?? null, profileFingerprint: state.profileFingerprint ?? metrics.profileFingerprint ?? null, courseFingerprint: state.courseFingerprint ?? metrics.courseFingerprint ?? null,
    attemptId: state.attemptId ?? metrics.attemptId ?? null, effectiveSettings: settings ? normalizeSupersonicSettings(settings) : null,
    fuelMode: state.fuelMode ?? settings?.fuelMode ?? (ab.unlimited === true ? 'unlimited' : 'gauge'),
    simulationSeconds: finite(state.simulationSeconds ?? metrics.simulationSeconds),
    activeSeconds: finite(record.activeSeconds ?? metrics.activeSeconds), interruptedSeconds: finite(record.interruptedSeconds ?? metrics.interruptedSeconds),
    maximumMach: finite(metrics.maximumMach), firstMach1Seconds: finite(metrics.firstMach1Seconds), firstMach2Seconds: finite(metrics.firstMach2Seconds),
    firstMach1ActiveSeconds: finite(record.firstMach1ActiveSeconds ?? metrics.firstMach1ActiveSeconds), firstMach2ActiveSeconds: finite(record.firstMach2ActiveSeconds ?? metrics.firstMach2ActiveSeconds),
    maximumG: finite(metrics.maximumG), maxG: finite(state.maxG ?? settings?.maxG),
    minimumSeaAltitude: finite(metrics.minimumSeaAltitude), minimumSeaClearance: finite(metrics.minimumSeaClearance),
    gateResults: (state.gateResults ?? metrics.gateResults ?? []).map(row => ({ id: row.id, index: row.index, kind: row.kind,
      passedAtSeconds: finite(row.passedAtSeconds), segmentSeconds: finite(row.segmentSeconds), missCount: row.missCount,
      minimumCenterDistance: finite(row.minimumCenterDistance), lastCrossingRadialDistance: finite(row.lastCrossingRadialDistance) })),
    afterburner: { seconds: finite(ab.seconds), uses: finite(ab.uses), consumed: finite(ab.consumed), earned: finite(ab.earned),
      maxSpeed: finite(ab.maxSpeed), unlimited: ab.unlimited === true, fuel: finite(ab.fuel) },
    complete: (state.complete ?? source.complete ?? metrics.complete) === true, grounded: (state.grounded ?? source.grounded ?? metrics.grounded) === true,
  };
}
