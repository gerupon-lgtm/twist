import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SUPERSONIC_SETTINGS, SUPERSONIC_SETTINGS_KEY, normalizeSupersonicSettings, loadSupersonicSettings, saveSupersonicSettings } from '../src/supersonic/settings.js';
import { supersonicIntent } from '../src/supersonic/intent.js';
import { createSupersonicProfile } from '../src/supersonic/profile.js';
import { DEFAULT_FLIGHT_SETTINGS } from '../src/flight-settings.js';

test('independent settings normalize finite values and write only the new key', () => {
  const data = new Map([['twist.flight-settings.v1', '{"maxBank":17}']]);
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  assert.deepEqual(loadSupersonicSettings(storage), DEFAULT_SUPERSONIC_SETTINGS);
  const result = saveSupersonicSettings(storage, { maxG: 99, pitchGain: -.2, radarRange: Infinity, fuelMode: 'gauge', maxBank: 99 });
  assert.deepEqual(result, { saved: true, settings: { maxG: 12, pitchGain: .1, radarRange: 10000, fuelMode: 'gauge' } });
  assert.equal(data.get('twist.flight-settings.v1'), '{"maxBank":17}');
  assert.equal(data.size, 2); assert.ok(data.has(SUPERSONIC_SETTINGS_KEY));
  assert.equal(saveSupersonicSettings(null, {}).saved, false);
  assert.deepEqual(loadSupersonicSettings(null), DEFAULT_SUPERSONIC_SETTINGS);
  assert.deepEqual(normalizeSupersonicSettings({ maxG: NaN, fuelMode: 'bad' }), DEFAULT_SUPERSONIC_SETTINGS);
});
test('profile snapshots physics settings and excludes radar from its physics fingerprint', () => {
  const source = { maxG: 9, fuelMode: 'gauge', pitchGain: .35, radarRange: 10000 };
  const a = createSupersonicProfile(source); source.maxG = 3;
  assert.equal(a.maxG, 9); assert.ok(Object.isFrozen(a.effectiveSettings));
  assert.equal(a.fingerprint, createSupersonicProfile({ ...a.effectiveSettings, radarRange: 2000 }).fingerprint);
  assert.notEqual(a.fingerprint, createSupersonicProfile({ ...a.effectiveSettings, maxG: 3 }).fingerprint);
  assert.ok(Math.abs(a.maxPitchRadians - 5.25 * Math.PI / 180) < 1e-12);
});
test('angle intent keeps normal deadzones/curve/twist folding while preserving saved rate mode', () => {
  const normal = { ...DEFAULT_FLIGHT_SETTINGS, steerCurve: 2, maxBank: 17 };
  const frozen = structuredClone(normal);
  const max = supersonicIntent({ pitch: 25, steer: 15, twist: 0 }, { normalSettings: normal, pitchMode: 'rate', effectiveSettings: { pitchGain: .35 } });
  assert.equal(max.pitchMode, 'angle'); assert.equal(max.bankDemand, 1);
  assert.ok(Math.abs(max.pitchDemandRadians - 5.25 * Math.PI / 180) < 1e-12);
  assert.equal(supersonicIntent({ pitch: 3, steer: 3 }, { normalSettings: normal }).pitchDemandRadians, 0);
  const a = supersonicIntent({ twist: 20 }, { steering: 'twist', normalSettings: normal });
  const b = supersonicIntent({ twist: 160 }, { steering: 'twist', normalSettings: normal });
  assert.ok(Math.abs(a.bankDemand - b.bankDemand) < 1e-12);
  assert.equal(supersonicIntent({ steer: -9 }, { normalSettings: normal }).bankDemand, -.25);
  assert.deepEqual(normal, frozen);
});
