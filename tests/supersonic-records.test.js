import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupersonicProfile } from '../src/supersonic/profile.js';
import { SUPERSONIC_COURSE } from '../src/supersonic/course.js';
import { createSupersonicState } from '../src/supersonic/physics.js';
import { supersonicBestKey, supersonicSummary } from '../src/supersonic/records.js';
test('PB key separates physics/fuel/hull/gate planes, while radar and labels preserve the key', () => {
  const p = createSupersonicProfile(), key = supersonicBestKey(p, SUPERSONIC_COURSE);
  assert.equal(key, supersonicBestKey(createSupersonicProfile({ radarRange: 2000 }), { ...SUPERSONIC_COURSE, name: 'renamed' }));
  for (const settings of [{ maxG: 3 }, { fuelMode: 'gauge' }, { pitchGain: .5 }]) assert.notEqual(key, supersonicBestKey(createSupersonicProfile(settings), SUPERSONIC_COURSE));
  const course = structuredClone(SUPERSONIC_COURSE); course.gates[0].normal.z = -1;
  assert.notEqual(key, supersonicBestKey(p, course));
  assert.notEqual(key, supersonicBestKey({ ...p, hull: [{ x: 0, y: -.5, z: 0 }] }, SUPERSONIC_COURSE));
});
test('copy summary distinguishes unobserved real active time from physical seconds and is independent', () => {
  const profile = createSupersonicProfile(), state = createSupersonicState(profile, SUPERSONIC_COURSE);
  state.metrics.firstMach1Seconds = 5.28;
  const a = supersonicSummary(state);
  assert.equal(a.firstMach1Seconds, 5.28); assert.equal(a.firstMach1ActiveSeconds, null); assert.equal(a.activeSeconds, null);
  const b = supersonicSummary(state, { activeSeconds: 10, interruptedSeconds: 3, firstMach1ActiveSeconds: 5.29 });
  assert.equal(b.activeSeconds, 10); assert.equal(b.interruptedSeconds, 3); assert.equal(b.firstMach1ActiveSeconds, 5.29);
  assert.equal(b.afterburner.unlimited, true); assert.equal(b.afterburner.fuel, 100);
  assert.notEqual(b.minimumSeaAltitude, b.minimumSeaClearance);
  b.gateResults[0].missCount = 99; assert.equal(state.gateResults[0].missCount, 0);
  assert.doesNotMatch(JSON.stringify(b), /NaN|Infinity/);
  const status = { afterburner: state.afterburner, complete: true, grounded: false, supersonic: {
    profileId: state.profileId, effectiveSettings: state.effectiveSettings, metrics: state.metrics,
    simulationSeconds: state.simulationSeconds, gateResults: state.gateResults,
  } };
  assert.equal(supersonicSummary(status).complete, true); assert.equal(supersonicSummary(status).afterburner.fuel, 100);
});
