import test from 'node:test';
import assert from 'node:assert/strict';
import { flightReport, copyableFlightReport } from '../src/flight-session.js';
import { DEFAULT_FLIGHT_SETTINGS } from '../src/flight-settings.js';

const sonicRecord = () => ({
  profileId: 'supersonic-v1', profileFingerprint: 'physics-fixture', courseFingerprint: 'planes-fixture', attemptId: 7,
  effectiveSettings: { maxG: 9, fuelMode: 'unlimited', pitchGain: .35, radarRange: 10000 },
  configuredSettings: { maxG: 12, fuelMode: 'gauge', pitchGain: .4, radarRange: 14000 },
  simulationSeconds: 6, activeSeconds: 6, interruptedSeconds: 0,
  maximumMach: 1.02, firstMach1Seconds: 5.280857, firstMach2Seconds: null,
  firstMach1ActiveSeconds: 5.280857, firstMach2ActiveSeconds: null,
  maximumG: 2.4, maxG: 9, minimumSeaAltitude: 1500, minimumSeaClearance: 1499.52,
  gateResults: [
    { id: 'gate-1', index: 0, kind: 'gate', passedAtSeconds: 5, segmentSeconds: 5, missCount: 1, minimumCenterDistance: 2, lastCrossingRadialDistance: 2 },
    { id: 'gate-2', index: 1, kind: 'gate', passedAtSeconds: null, segmentSeconds: null, missCount: 0, minimumCenterDistance: 5000, lastCrossingRadialDistance: null },
  ],
  afterburner: { seconds: 6, uses: 1, consumed: 0, earned: 0, maxSpeed: 346.8, unlimited: true, fuel: 100 },
  complete: false, grounded: false,
  renderOrigin: { x: 0, y: 1024, z: 16384 },
  renderDiagnostics: {
    origin: { x: 0, y: 1024, z: 16384 }, originSerial: 2,
    world: { sea: { phase: { x: .25, z: .75 } }, cloudLayers: [{ minHeight: 400, maxHeight: 800 }] },
    gpu: { calls: 8, geometries: 12, textures: 1 },
  },
  activityClockMeaning: {
    activeSeconds: 'observed-running-frame-time-excluding-terminal-remainder',
    interruptedSeconds: 'unprocessed-active-time-not-menu-or-pause-duration',
  },
});

test('Sonic report deeply snapshots settings, gate records, nullable timings and render diagnostics', () => {
  const source = sonicRecord(), expected = structuredClone(source);
  const report = flightReport({ version: '0.1.32', pitch: 'angle', steer: 'tilt', supersonic: source });
  assert.notStrictEqual(report.supersonic, source);
  assert.notStrictEqual(report.supersonic.renderDiagnostics.world.cloudLayers, source.renderDiagnostics.world.cloudLayers);

  source.effectiveSettings.maxG = 3;
  source.configuredSettings.fuelMode = 'unlimited';
  source.gateResults[0].missCount = 99;
  source.gateResults[1].passedAtSeconds = 9;
  source.afterburner.seconds = 99;
  source.renderOrigin.z = -1000;
  source.renderDiagnostics.origin.y = -1000;
  source.renderDiagnostics.world.sea.phase.x = .99;
  source.renderDiagnostics.world.cloudLayers[0].minHeight = 0;
  source.activityClockMeaning.interruptedSeconds = 'changed';

  const copy = JSON.parse(copyableFlightReport(report));
  assert.deepEqual(copy.supersonic, expected);
  assert.equal(copy.supersonic.firstMach2ActiveSeconds, null);
  assert.equal(copy.supersonic.gateResults[1].segmentSeconds, null);
  assert.equal(copy.supersonic.effectiveSettings.maxG, 9);
  assert.equal(copy.supersonic.configuredSettings.maxG, 12);
  assert.notEqual(copy.supersonic.minimumSeaAltitude, copy.supersonic.minimumSeaClearance);

  const sourceAfterChanges = structuredClone(source);
  report.supersonic.gateResults[0].minimumCenterDistance = 999;
  report.supersonic.renderDiagnostics.world.cloudLayers.push({ minHeight: 2000, maxHeight: 2400 });
  assert.deepEqual(source, sourceAfterChanges);
});

test('normal report retains its established fields and values when Sonic reporting is added', () => {
  const settings = { ...DEFAULT_FLIGHT_SETTINGS, maxBank: 17 };
  const stats = { elapsedSeconds: 10, groundContacts: 1, recoverySeconds: 2, legs: 2 };
  const lastLeg = { elapsedSeconds: 3, groundContacts: 0, recoverySeconds: 0 };
  const course = { id: 'easy', name: 'normal baseline', targetCount: 3 };
  const segments = [{ id: 'start-light1', seconds: 3.1, closestDistance: 3.2, nearMisses: 0 }];
  const courseTime = { courseKey: 'flight:easy:fixture', mode: 'flight', seconds: null, bestSeconds: 45.2 };
  const options = { version: '0.1.31', mode: 'flight', view: 'assisted', pitch: 'angle', steer: 'tilt',
    camera: 'overlay', display: 'bank', settings, stats, lastLeg, course, segments, courseTime };
  const normal = flightReport(options);
  assert.deepEqual(normal, {
    version: '0.1.31', mode: 'flight', view: 'assisted', pitch: 'angle', steer: 'tilt', launch: 'browser', fullscreen: false,
    camera: 'overlay', display: 'bank', settings, changedSettings: ['maxBank'],
    inactiveSettings: ['displayTimeConstant', 'chaseTimeConstant', 'maxSteerTwist', 'steerTwistDeadzone', 'ladderRange', 'cockpitFov', 'autoAfterburnerAngle'],
    stats, lastLeg, course, segments, courseTime,
  });
  assert.equal(Object.hasOwn(normal, 'supersonic'), false);

  const sonic = flightReport({ ...options, supersonic: sonicRecord() });
  const { supersonic: ignoredSonic, inactiveSettings: ignoredSonicInactive, ...sonicCommon } = sonic;
  const { inactiveSettings: ignoredNormalInactive, ...normalCommon } = normal;
  assert.deepEqual(sonicCommon, normalCommon);
  assert.equal(Object.hasOwn(JSON.parse(copyableFlightReport(normal)), 'supersonic'), false);
  assert.equal(settings.maxBank, 17);
});

test('Sonic marks only its replaced normal settings inactive and does not duplicate existing inactive keys', () => {
  const cases = [
    {
      modes: { camera: 'overlay', display: 'bank', view: 'assisted', pitch: 'angle', steer: 'tilt' },
      normal: ['displayTimeConstant', 'chaseTimeConstant', 'maxSteerTwist', 'steerTwistDeadzone', 'ladderRange', 'cockpitFov', 'autoAfterburnerAngle'],
      added: ['maxPitch', 'timeConstant', 'maxBank', 'turnGravity', 'radarRange', 'groundPatternStrength'],
    },
    {
      modes: { camera: 'cockpit', display: 'bank', view: 'assisted', pitch: 'angle', steer: 'twist' },
      normal: ['displayTimeConstant', 'chaseTimeConstant', 'maxSteerTilt', 'steerTiltDeadzone', 'autoAfterburnerAngle'],
      added: ['maxPitch', 'timeConstant', 'maxBank', 'turnGravity', 'radarRange', 'groundPatternStrength'],
    },
    {
      modes: { camera: 'chase', display: 'fixed', view: 'classic', pitch: 'rate', steer: 'twist' },
      normal: ['timeConstant', 'radarRange', 'maxSteerTilt', 'steerTiltDeadzone', 'ladderRange', 'cockpitFov', 'targetHeightGuide', 'streakAmount', 'groundPatternStrength', 'autoAfterburnerAngle'],
      added: ['maxPitch', 'maxBank', 'turnGravity'],
    },
  ];
  for (const fixture of cases) {
    const normal = flightReport({ mode: 'flight', ...fixture.modes });
    const sonic = flightReport({ mode: 'flight', ...fixture.modes, supersonic: sonicRecord() });
    assert.deepEqual(normal.inactiveSettings, fixture.normal);
    assert.deepEqual(sonic.inactiveSettings, [...fixture.normal, ...fixture.added]);
    assert.equal(new Set(sonic.inactiveSettings).size, sonic.inactiveSettings.length);
    for (const shared of ['deadzone', 'maxTilt', 'steerCurve', 'speedUnit', 'hudLanguage']) assert.equal(sonic.inactiveSettings.includes(shared), false);
  }
});
