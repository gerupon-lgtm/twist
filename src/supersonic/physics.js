import { createSupersonicProfile, supersonicFingerprint } from './profile.js';
import { SUPERSONIC_COURSE, validateSupersonicCourse } from './course.js';
import { gateCrossing, seaClearance, sweepSea, normalizeQuaternion, slerpQuaternion, rotateVector } from './gate-crossing.js';

const EPS = 1e-10;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const length = v => Math.hypot(v.x, v.y, v.z);
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scale = (v, n) => ({ x: v.x * n, y: v.y * n, z: v.z * n });
const mix = (a, b, t) => add(scale(a, 1 - t), scale(b, t));
const angle = a => Math.atan2(Math.sin(a), Math.cos(a));
const distance = (a, b) => length({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const finitePoint = p => p && ['x', 'y', 'z'].every(key => Number.isFinite(p[key]));
function multiply(a, b) { return { x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y, y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x, z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w, w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z }; }
export function supersonicOrientation(heading, pitch, bank) {
  const y = { x: 0, y: -Math.sin(heading / 2), z: 0, w: Math.cos(heading / 2) };
  const p = { x: Math.sin(pitch / 2), y: 0, z: 0, w: Math.cos(pitch / 2) };
  const b = { x: 0, y: 0, z: -Math.sin(bank / 2), w: Math.cos(bank / 2) };
  return normalizeQuaternion(multiply(multiply(y, p), b));
}
export function supersonicDrag(speed, profile) {
  const m = Math.max(0, speed) / profile.speedOfSound, d = profile.drag;
  const wave = m > d.waveStartMach && m < d.waveEndMach
    ? d.wavePeak * Math.sin(Math.PI * (m - d.waveStartMach) / (d.waveEndMach - d.waveStartMach)) ** 2 : 0;
  return d.quadraticAtMach1 * m * m + wave;
}
export function supersonicCourseFingerprint(course) {
  return supersonicFingerprint({ start: course.start, heading: course.startHeading ?? 0, arena: course.arena,
    gates: course.gates.map(({ center, normal, right, up, radius, kind }) => ({ center, normal, right, up, radius, kind })) });
}
function surfaceLevel(course,position,profile){
  return course.surface?.kind==='flat'?course.surface.heightAt(position.x,position.z):profile.seaLevel;
}
function assertProfile(profile) {
  if (!profile || !['speedOfSound', 'startSpeed', 'maxSpeed', 'gravity', 'maxG', 'integrationStep', 'pitchResponseSeconds', 'bankResponseSeconds'].every(key => Number.isFinite(profile[key]) && profile[key] > 0)
    || profile.maxG <= 1 || !Array.isArray(profile.hull) || !profile.hull.length) throw new TypeError('validated supersonic profile required');
  const check = value => { if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('nonfinite supersonic profile'); if (value && typeof value === 'object') Object.values(value).forEach(check); };
  check(profile);
}
export function createSupersonicState(profile = createSupersonicProfile(), course = SUPERSONIC_COURSE, options = {}) {
  assertProfile(profile);
  const validation = validateSupersonicCourse(course, profile);
  if (!validation.valid) throw new RangeError(validation.errors.join('; '));
  const heading = course.startHeading ?? 0, orientation = supersonicOrientation(heading, 0, 0);
  const velocity = rotateVector({ x: 0, y: 0, z: -profile.startSpeed }, orientation);
  const clearance = seaClearance(course.start, orientation, profile.hull, surfaceLevel(course,course.start,profile));
  if (options.attemptId !== undefined && !(Number.isFinite(options.attemptId) || typeof options.attemptId === 'string' && options.attemptId.length > 0)) throw new TypeError('finite or string attemptId required');
  return {
    schemaVersion: 1, profileId: profile.id, modelVersion: profile.modelVersion,
    profileFingerprint: profile.fingerprint, courseFingerprint: supersonicCourseFingerprint(course),
    effectiveSettings: { ...profile.effectiveSettings }, attemptId: options.attemptId ?? 1, eventSerial: 0,
    simulationSeconds: 0, pendingSeconds: 0, clockCarrySeconds: 0,
    position: { ...course.start }, velocity, orientation, heading, pitch: 0, bank: 0, controlPitch: 0,
    speed: profile.startSpeed, mach: profile.startSpeed / profile.speedOfSound, verticalSpeed: 0, yawRate: 0,
    throttle: .5, angleOfAttack: 0, recoveryAssist: 0, gLoad: 1,
    supportAcceleration: { x: 0, y: profile.gravity, z: 0 }, availableNormalAcceleration: profile.maxG * profile.gravity,
    groundClearance: clearance, activeGateIndex: 0, collected: 0, total: course.gates.length - 1, complete: false, grounded: false, terminal: null,
    crossingState: { sonicSide: 'subsonic' },
    afterburner: { active: false, fuel: profile.fuel.startFuel, unlimited: profile.fuelMode === 'unlimited', needsRelease: false,
      uses: 0, seconds: 0, earned: 0, consumed: 0, maxSpeed: profile.startSpeed, burstSeconds: 0, timeSeconds: 0, autoHoldSeconds: 0, autoRequest: false },
    metrics: { maximumSpeed:profile.startSpeed, maximumMach: profile.startSpeed / profile.speedOfSound, firstMach1Seconds: null, firstMach2Seconds: null,
      maximumG: 1, minimumSeaAltitude: course.start.y, minimumSeaClearance: clearance },
    gateResults: course.gates.map((gate, index) => ({ id: gate.id, index, kind: gate.kind, passedAtSeconds: null, segmentSeconds: null,
      missCount: 0, afterburnerSeconds:0,afterburnerFuel:0, minimumCenterDistance: distance(course.start, gate.center), lastCrossingRadialDistance: null })),
  };
}
function cloneState(previous) {
  if (!finitePoint(previous?.position) || !finitePoint(previous?.velocity) || !Number.isFinite(previous?.simulationSeconds) || !Number.isFinite(previous?.speed)) throw new TypeError('finite supersonic state required');
  const check = value => { if (typeof value === 'number' && !Number.isFinite(value)) throw new TypeError('nonfinite supersonic state'); if (value && typeof value === 'object') Object.values(value).forEach(check); };
  check(previous);
  if ((previous.pendingSeconds !== undefined && (!Number.isFinite(previous.pendingSeconds) || previous.pendingSeconds < 0))
    || (previous.clockCarrySeconds !== undefined && !Number.isFinite(previous.clockCarrySeconds))) throw new TypeError('finite supersonic time carries required');
  normalizeQuaternion(previous.orientation);
  return { ...previous, pendingSeconds: previous.pendingSeconds ?? 0, clockCarrySeconds: previous.clockCarrySeconds ?? 0,
    position: { ...previous.position }, velocity: { ...previous.velocity }, orientation: { ...previous.orientation },
    terminal: previous.terminal ? structuredClone(previous.terminal) : null,
    effectiveSettings: { ...previous.effectiveSettings }, supportAcceleration: { ...previous.supportAcceleration }, afterburner: { ...previous.afterburner },
    metrics: { ...previous.metrics }, crossingState: { ...previous.crossingState }, gateResults: previous.gateResults.map(row => ({ ...row })) };
}
function cleanInput(input, profile) {
  return { bank: clamp(Number.isFinite(input?.bankDemand) ? input.bankDemand : 0, -1, 1) * profile.maxBankRadians,
    pitch: clamp(Number.isFinite(input?.pitchDemandRadians) ? input.pitchDemandRadians : 0, -profile.maxPitchRadians, profile.maxPitchRadians),
    throttle: clamp(Number.isFinite(input?.throttle) ? input.throttle : .5, 0, 1), manual: input?.afterburnerRequested === true,
    auto: input?.autoAfterburner?.enabled === true,
    autoAngle: clamp(Number.isFinite(input?.autoAfterburner?.angleDegrees) ? input.autoAfterburner.angleDegrees : 35, 25, 60),
    rawPitch: Number.isFinite(input?.autoAfterburner?.pitchInputDegrees) ? input.autoAfterburner.pitchInputDegrees : 0 };
}
function forces(velocity, pitch, bank, fallbackHeading, throttle, ab, profile) {
  const speed = length(velocity), horizontal = Math.hypot(velocity.x, velocity.z);
  const heading = horizontal > EPS ? Math.atan2(velocity.x, -velocity.z) : fallbackHeading;
  const climb = speed > EPS ? Math.atan2(velocity.y, horizontal) : 0;
  const unit = speed > EPS ? scale(velocity, 1 / speed) : { x: Math.sin(heading), y: 0, z: -Math.cos(heading) };
  const right = { x: Math.cos(heading), y: 0, z: Math.sin(heading) };
  const up = { x: -Math.sin(heading) * Math.sin(climb), y: Math.cos(climb), z: Math.cos(heading) * Math.sin(climb) };
  const aoa = angle(pitch - climb), low = profile.lowSpeed;
  const stall = clamp((Math.abs(aoa) - low.stallStartRadians) / (low.stallEndRadians - low.stallStartRadians), 0, 1);
  const available = Math.min(profile.maxG * profile.gravity, profile.gravity * (speed / low.oneGSpeed) ** 2) * (1 - stall);
  // Gravity compensation and desired pitch curvature share ONE support-vector limit with yaw.
  let support = add(scale(right, profile.gravity * Math.tan(bank)), scale(up, profile.gravity * Math.cos(climb) + speed * angle(pitch - climb) / profile.pitchResponseSeconds));
  const request = length(support);
  if (request > available) support = scale(support, available / request);
  const forward = { x: Math.sin(heading) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(heading) * Math.cos(pitch) };
  const engine = ab ? profile.afterburnerThrust : profile.dryThrust * throttle;
  const acceleration = add(add(support, { x: 0, y: -profile.gravity, z: 0 }), add(scale(forward, engine), scale(unit, -supersonicDrag(speed, profile))));
  return { acceleration, support, available, aoa, recoveryAssist: Math.max(stall, 1 - Math.min(1, available / profile.gravity)) };
}
/** Heun uses velocity-normal support at both evaluations; no Euler turn-energy injection. */
function motion(state, h, input, ab, profile, cap = true) {
  const follow = (v, target, tau, seconds) => v + (target - v) * -Math.expm1(-seconds / tau);
  const pitch = follow(state.controlPitch, input.pitch, profile.pitchResponseSeconds, h);
  const bank = follow(state.bank, input.bank, profile.bankResponseSeconds, h);
  const a = forces(state.velocity, state.controlPitch, state.bank, state.heading, input.throttle, ab, profile);
  const predictor = add(state.velocity, scale(a.acceleration, h));
  const b = forces(predictor, pitch, bank, state.heading, input.throttle, ab, profile);
  let velocity = add(state.velocity, scale(add(a.acceleration, b.acceleration), h / 2));
  if (cap && length(velocity) > profile.maxSpeed) velocity = scale(velocity, profile.maxSpeed / length(velocity));
  const position = add(state.position, scale(add(state.velocity, velocity), h / 2));
  const heading = Math.hypot(velocity.x, velocity.z) > EPS ? Math.atan2(velocity.x, -velocity.z) : state.heading;
  return { velocity, position, heading, pitch, bank, orientation: supersonicOrientation(heading, pitch, bank),
    force: forces(velocity, pitch, bank, heading, input.throttle, ab, profile), peakG: Math.max(length(a.support), length(b.support)) / profile.gravity };
}
function speedCrossings(a, b, speed) {
  const d = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }, A = dot(d, d), B = 2 * dot(a, d), C = dot(a, a) - speed * speed;
  if (A < 1e-20) return [];
  const discriminant = B * B - 4 * A * C;
  if (discriminant < 0) return [];
  return [(-B - Math.sqrt(discriminant)) / (2 * A), (-B + Math.sqrt(discriminant)) / (2 * A)]
    .filter((f, i, all) => f > 1e-10 && f <= 1 + 1e-10 && (i === 0 || Math.abs(f - all[0]) > 1e-10))
    .map(f => ({ fraction: Math.min(1, f), direction: B + 2 * A * f > 0 ? 'up' : 'down' }));
}
function nearestDistance(from, to, point) {
  const d = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z }, denominator = dot(d, d);
  const t = denominator > 0 ? clamp(dot({ x: point.x - from.x, y: point.y - from.y, z: point.z - from.z }, d) / denominator, 0, 1) : 0;
  return distance(mix(from, to, t), point);
}

/** Finite raw elapsed is consumed in full; callers may use 1-second windows to bound returned arrays. */
export function advanceSupersonic(previous, rawInput, dt, profile, course) {
  assertProfile(profile);
  const state = cloneState(previous), requestedSeconds = Number.isFinite(dt) && dt > 0 ? dt : 0;
  const actualSpeed = length(state.velocity);
  if (!Number.isFinite(actualSpeed) || Math.abs(actualSpeed - state.speed) > Math.max(1e-7, actualSpeed * 1e-10) || actualSpeed > profile.maxSpeed + 1e-7) throw new RangeError('state speed must match its bounded velocity');
  if (state.profileFingerprint !== profile.fingerprint || state.courseFingerprint !== supersonicCourseFingerprint(course)) throw new RangeError('attempt configuration changed without reset');
  const segments = [], events = [], carriedInSeconds = state.pendingSeconds;
  let advancedSeconds = 0, advancedCarry = 0, remaining = 0;
  const result = reason => ({ state, segments, events, timing: { requestedSeconds, advancedSeconds,
    carriedInSeconds, carriedOutSeconds: state.pendingSeconds,
    remainingSeconds: state.grounded || state.complete ? Math.max(0, requestedSeconds + carriedInSeconds - advancedSeconds)
      : reason === 'paused' || reason === 'invalid-dt' ? requestedSeconds : 0, reason } });
  const stopAB = () => { Object.assign(state.afterburner, { active: false, needsRelease: true, autoHoldSeconds: 0, autoRequest: false }); };
  if (rawInput?.paused === true) { stopAB(); return result('paused'); }
  if (!Number.isFinite(dt) || dt < 0) return result('invalid-dt');
  if (dt === 0) return result('zero-dt');
  if (state.grounded || state.complete) { state.pendingSeconds = 0; stopAB(); return result(state.grounded ? 'sea' : 'complete'); }
  const input = cleanInput(rawInput, profile);
  const emit = (type, atSeconds, position, payload = {}, offsetSeconds = advancedSeconds) => {
    state.eventSerial++;
    events.push({ attemptId: state.attemptId, id: state.eventSerial, serial: state.eventSerial, type, atSeconds,
      offsetSeconds, position: { ...position }, ...payload });
  };
  remaining = dt + carriedInSeconds;
  state.pendingSeconds = 0;
  while (remaining > 1e-12 && !state.grounded && !state.complete) {
    const ab = state.afterburner, autoReleased = !input.auto || input.rawPitch >= -(input.autoAngle - profile.autoAfterburner.releaseDegrees);
    const autoDemand = input.auto && input.rawPitch <= -input.autoAngle;
    if (autoReleased) { ab.autoRequest = false; ab.autoHoldSeconds = 0; }
    else if (!autoDemand && !ab.autoRequest) ab.autoHoldSeconds = 0;
    if (!input.manual && autoReleased) ab.needsRelease = false;
    if (autoDemand && ab.autoHoldSeconds >= profile.autoAfterburner.holdSeconds - 1e-12) ab.autoRequest = true;
    const request = input.manual || ab.autoRequest;
    const active = request && !ab.needsRelease && (ab.unlimited || ab.fuel > EPS);
    if (!active && request && !ab.unlimited && ab.fuel <= EPS) ab.needsRelease = true;
    if (active && !ab.active) { ab.uses++; ab.burstSeconds = 0; }
    ab.active = active;
    let h = Math.min(remaining, profile.integrationStep, 1 / 120);
    if (autoDemand && !ab.autoRequest) h = Math.min(h, profile.autoAfterburner.holdSeconds - ab.autoHoldSeconds);
    if (active && !ab.unlimited) h = Math.min(h, ab.fuel / profile.fuel.drainPerSecond);
    let candidate = motion(state, h, input, active, profile, state.speed >= profile.maxSpeed - 1e-8);
    let capHit = false;
    if (state.speed < profile.maxSpeed - 1e-8 && length(candidate.velocity) > profile.maxSpeed) {
      let low = 0, high = h;
      for (let i = 0; i < 36; i++) { const mid = (low + high) / 2; if (length(motion(state, mid, input, active, profile, false).velocity) >= profile.maxSpeed) high = mid; else low = mid; }
      h = high; candidate = motion(state, h, input, active, profile); capHit = true;
    }
    const level=surfaceLevel(course,candidate.position,profile);
    const sea = sweepSea(state.position, candidate.position, level, { fromOrientation: state.orientation, toOrientation: candidate.orientation, hull: profile.hull });
    const gate = course.gates[state.activeGateIndex], hit = gateCrossing(state.position, candidate.position, gate);
    const seaFirst = sea.contact && (!hit || sea.contact.fraction <= hit.fraction + 1e-10);
    const fraction = seaFirst ? sea.contact.fraction : hit ? hit.fraction : 1;
    const elapsed = h * fraction, t0 = state.simulationSeconds, localStart = advancedSeconds;
    // Integrated clock rounding is separate from time still waiting to be
    // integrated. Keep its low part even when a large absolute clock cannot move.
    const clockIncrement = elapsed + state.clockCarrySeconds, endTime = t0 + clockIncrement;
    const nextClockCarry = clockIncrement - (endTime - t0);
    const from = { ...state.position }, fromVelocity = { ...state.velocity }, fromOrientation = { ...state.orientation };
    const to = mix(state.position, candidate.position, fraction), velocity = mix(state.velocity, candidate.velocity, fraction);
    const orientation = slerpQuaternion(state.orientation, candidate.orientation, fraction);
    const localEvents = [];
    for (const thresholdMach of [1, 1.01, .99, 2]) for (const crossing of speedCrossings(fromVelocity, candidate.velocity, thresholdMach * profile.speedOfSound)) {
      if (crossing.fraction <= fraction + 1e-10) localEvents.push({ ...crossing, thresholdMach });
    }
    if (capHit && profile.maxSpeed>=profile.speedOfSound*2-1e-8 && fraction === 1 && state.metrics.firstMach2Seconds === null && !localEvents.some(e => e.thresholdMach === 2)) localEvents.push({ fraction: 1, direction: 'up', thresholdMach: 2 });
    localEvents.sort((a, b) => a.fraction - b.fraction);
    for (const crossing of localEvents) {
      const localOffset = localStart + h * crossing.fraction;
      const at = t0 + (state.clockCarrySeconds + h * crossing.fraction), position = mix(from, candidate.position, crossing.fraction);
      if (crossing.thresholdMach === 1) {
        if (crossing.direction === 'up' && state.metrics.firstMach1Seconds === null) state.metrics.firstMach1Seconds = at;
        emit('mach-crossing', at, position, { thresholdMach: 1, mach: 1, direction: crossing.direction }, localOffset);
      } else if (crossing.thresholdMach === 2 && crossing.direction === 'up' && state.metrics.firstMach2Seconds === null) {
        state.metrics.firstMach2Seconds = at; emit('mach2-reached', at, position, { mach: 2, direction: 'up' }, localOffset);
      } else if (crossing.thresholdMach === 1.01 && crossing.direction === 'up' && state.crossingState.sonicSide === 'subsonic') {
        state.crossingState.sonicSide = 'supersonic'; emit('sonic-transition', at, position, { mach: 1.01, direction: 'up' }, localOffset);
      } else if (crossing.thresholdMach === .99 && crossing.direction === 'down' && state.crossingState.sonicSide === 'supersonic') {
        state.crossingState.sonicSide = 'subsonic'; emit('sonic-transition', at, position, { mach: .99, direction: 'down' }, localOffset);
      }
    }
    const fuelBefore = ab.fuel;
    const consumed = active && !ab.unlimited ? Math.min(fuelBefore, elapsed * profile.fuel.drainPerSecond) : 0;
    const exhausted = active && !ab.unlimited && fuelBefore <= elapsed * profile.fuel.drainPerSecond + 1e-10;
    ab.fuel = Math.max(0, ab.fuel - consumed); ab.consumed += consumed;
    ab.seconds += active ? elapsed : 0; ab.burstSeconds += active ? elapsed : 0; ab.timeSeconds += elapsed;
    if (autoDemand && !ab.autoRequest) ab.autoHoldSeconds = Math.min(profile.autoAfterburner.holdSeconds, ab.autoHoldSeconds + elapsed);
    ab.maxSpeed = Math.max(ab.maxSpeed, length(velocity));
    const row = state.gateResults[state.activeGateIndex];
    row.afterburnerSeconds=(row.afterburnerSeconds??0)+(active?elapsed:0);row.afterburnerFuel=(row.afterburnerFuel??0)+consumed;
    row.minimumCenterDistance = Math.min(row.minimumCenterDistance, nearestDistance(from, to, gate.center));
    state.position = to; state.velocity = velocity; state.orientation = orientation;
    state.controlPitch += (candidate.pitch - state.controlPitch) * fraction; state.pitch = state.controlPitch;
    state.bank += (candidate.bank - state.bank) * fraction;
    const oldHeading = state.heading;
    state.heading = Math.hypot(velocity.x, velocity.z) > EPS ? Math.atan2(velocity.x, -velocity.z) : oldHeading;
    state.yawRate = elapsed > 0 ? angle(state.heading - oldHeading) / elapsed : 0;
    state.speed = length(velocity); state.mach = state.speed / profile.speedOfSound; state.verticalSpeed = velocity.y;
    state.throttle = input.throttle; state.simulationSeconds = endTime; state.clockCarrySeconds = nextClockCarry;
    const localIncrement = elapsed + advancedCarry, nextAdvanced = advancedSeconds + localIncrement;
    advancedCarry = localIncrement - (nextAdvanced - advancedSeconds); advancedSeconds = nextAdvanced;
    const force = forces(velocity, state.controlPitch, state.bank, state.heading, input.throttle, active, profile);
    state.angleOfAttack = force.aoa; state.recoveryAssist = force.recoveryAssist;
    state.supportAcceleration = force.support; state.gLoad = length(force.support) / profile.gravity; state.availableNormalAcceleration = force.available;
    state.groundClearance = seaClearance(to, orientation, profile.hull, level);
    state.metrics.maximumSpeed=Math.max(state.metrics.maximumSpeed??0,state.speed);
    state.metrics.maximumG = Math.max(state.metrics.maximumG, state.gLoad);
    state.metrics.maximumMach = Math.max(state.metrics.maximumMach, state.mach);
    state.metrics.minimumSeaAltitude = Math.min(state.metrics.minimumSeaAltitude, from.y, to.y);
    const minimumClearance = hit && !seaFirst && fraction < 1 ? sweepSea(from, to, level,
      { fromOrientation, toOrientation: orientation, hull: profile.hull }).minimumClearance : sea.minimumClearance;
    state.metrics.minimumSeaClearance = Math.min(state.metrics.minimumSeaClearance, seaFirst ? 0 : minimumClearance);
    if (elapsed > 0) segments.push({ index: segments.length, t0, t1: endTime, seconds: elapsed,
      offsetStartSeconds: localStart, offsetEndSeconds: advancedSeconds, from, to: { ...to }, fromVelocity, toVelocity: { ...velocity },
      afterburnerActive: active, fuelConsumed: consumed, gLoad: state.gLoad });
    // Derive the tail from the same compensated consumption ledger. Repeated
    // subtraction would manufacture a second rounding residual beside it.
    remaining = Math.max(0, dt + carriedInSeconds - (advancedSeconds + advancedCarry));
    const lowAltitude=profile.fuel.lowAltitude;
    if(!seaFirst&&lowAltitude&&elapsed>0&&state.groundClearance>=0&&state.groundClearance<=lowAltitude.maxClearance&&state.speed>=lowAltitude.minSpeed){
      const reward=Math.min(profile.fuel.capacity-ab.fuel,elapsed*lowAltitude.perSecond);ab.fuel+=reward;ab.earned+=reward;
    }
    if (seaFirst) {
      state.grounded = true; state.groundClearance = 0; state.metrics.minimumSeaClearance = Math.min(state.metrics.minimumSeaClearance, 0);
      state.terminal = { type: 'sea', atSeconds: endTime, position: { ...to }, centerPosition: { ...to }, contactPoint: sea.contact.contactPoint,
        hullVertexId: sea.contact.hullVertexId, orientation: { ...orientation }, impactVelocity: { ...velocity } };
      emit('sea-contact', endTime, to, { contactPoint: sea.contact.contactPoint, hullVertexId: sea.contact.hullVertexId, orientation: { ...orientation }, speed: state.speed }); stopAB();
    } else if (hit) {
      row.lastCrossingRadialDistance = hit.radialDistance;
      if (hit.inside) {
        row.passedAtSeconds = endTime; row.segmentSeconds = endTime - (state.activeGateIndex ? state.gateResults[state.activeGateIndex - 1].passedAtSeconds : 0);
        const reward = ab.unlimited ? 0 : Math.min(profile.fuel.capacity - ab.fuel, profile.fuel.gateReward);
        ab.fuel += reward; ab.earned += reward;
        emit(gate.kind === 'exit' ? 'exit-pass' : 'gate-pass', endTime, to, { gateId: gate.id, gateIndex: state.activeGateIndex, radialDistance: hit.radialDistance, direction: hit.direction });
        state.activeGateIndex++; state.collected = Math.min(state.activeGateIndex, state.total);
        if (gate.kind === 'exit') { state.complete = true; state.terminal = { type: 'exit', atSeconds: endTime, position: { ...to }, orientation: { ...orientation } }; stopAB(); }
        else if (state.collected === state.total) emit('exit-opened', endTime, to);
      } else { row.missCount++; emit('gate-miss', endTime, to, { gateId: gate.id, gateIndex: state.activeGateIndex, radialDistance: hit.radialDistance, direction: hit.direction }); }
    }
    if (exhausted && !state.complete && !state.grounded) {
      // A simultaneous reward does not turn a held request into a new ignition.
      ab.active = false; ab.needsRelease = true; emit('afterburner-empty', endTime, to);
    }
    if (elapsed === 0 && !seaFirst) throw new Error('zero-time nonterminal physics event');
  }
  // Do not discard a positive sub-step tail. Pause/zero updates preserve this
  // budget; a later positive call merges it before running the same force steps.
  state.pendingSeconds = state.grounded || state.complete ? 0 : remaining;
  return result(state.grounded ? 'sea' : state.complete ? 'complete' : null);
}
