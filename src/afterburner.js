/** Fuel, rewards, and engine limits live together; units are seconds and m/s. */
export const AFTERBURNER_TUNING = Object.freeze({
  maxFuel: 100,
  startFuel: 0,
  targetReward: 25,
  exitReward: 40,
  comboWindow: 10,
  comboStep: 5,
  comboMaxBonus: 15,
  lowAltitude: 12,
  lowAltitudeMinSpeed: 6,
  lowAltitudeRate: 4,
  drainRate: 12,
  extraThrust: 18,
  maxSpeed: 45,
  autoAngle: 35,
  minAutoAngle: 25,
  maxAutoAngle: 60,
  autoHoldSeconds: .18,
  autoReleaseDegrees: 5,
});

const tuning = AFTERBURNER_TUNING;
const nonnegative = value => Number.isFinite(value) ? Math.max(0, value) : 0;
const add = (a, b) => Math.min(Number.MAX_VALUE, a + b);
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

export function createAfterburnerState() {
  return { fuel: tuning.startFuel, active: false, needsRelease: false,
    uses: 0, seconds: 0, earned: 0, maxSpeed: 0, burstSeconds: 0, timeSeconds: 0,
    combo: 0, lastTargetSeconds: null, autoHoldSeconds: 0, autoRequest: false };
}

function cleanState(previous) {
  return { fuel: clamp(nonnegative(previous?.fuel), 0, tuning.maxFuel),
    active: previous?.active === true, needsRelease: previous?.needsRelease === true,
    uses: Math.floor(nonnegative(previous?.uses)), seconds: nonnegative(previous?.seconds),
    earned: nonnegative(previous?.earned), maxSpeed: nonnegative(previous?.maxSpeed),
    burstSeconds: nonnegative(previous?.burstSeconds), timeSeconds: nonnegative(previous?.timeSeconds),
    combo: Math.floor(nonnegative(previous?.combo)),
    lastTargetSeconds: Number.isFinite(previous?.lastTargetSeconds) && previous.lastTargetSeconds >= 0
      ? previous.lastTargetSeconds : null,
    autoHoldSeconds: clamp(nonnegative(previous?.autoHoldSeconds), 0, tuning.autoHoldSeconds),
    autoRequest: previous?.autoRequest === true };
}

function credit(state, amount) {
  const received = Math.min(tuning.maxFuel - state.fuel, amount);
  return { ...state, fuel: state.fuel + received, earned: add(state.earned, received) };
}

/** Count newly collected targets, not the cumulative collected total. */
export function awardAfterburner(previous, reward = {}) {
  const { targets = 0, exit = false } = reward ?? {};
  let state = cleanState(previous);
  const count = Math.floor(nonnegative(targets));
  if (count > 0) {
    const interval = state.lastTargetSeconds === null ? Infinity : state.timeSeconds - state.lastTargetSeconds;
    let combo = interval >= 0 && interval <= tuning.comboWindow ? state.combo : 0;
    // At most four distinct bonuses exist; avoid a loop proportional to input.
    const initial = Math.min(count, 4);
    let reward = 0;
    for (let i = 0; i < initial; i += 1) {
      reward += tuning.targetReward + Math.min(tuning.comboMaxBonus, combo * tuning.comboStep);
      combo = add(combo, 1);
    }
    reward += (count - initial) * (tuning.targetReward + tuning.comboMaxBonus);
    state = credit({ ...state, combo: add(combo, count - initial), lastTargetSeconds: state.timeSeconds }, reward);
  }
  return exit === true ? credit(state, tuning.exitReward) : state;
}

/** Pause/completion preserves rewards and statistics, but requires a release. */
export function stopAfterburner(previous) {
  return { ...cleanState(previous), active: false, needsRelease: true,
    autoHoldSeconds: 0, autoRequest: false };
}

/** Observe before a collision/completion replaces the actual velocity. */
export function observeAfterburnerSpeed(previous, speed) {
  const state = cleanState(previous);
  return { ...state, maxSpeed: Math.max(state.maxSpeed, nonnegative(speed)) };
}

/** Pure gauge step. activeSeconds is paid time; split the force step at expiry. */
export function advanceAfterburner(previous, dt, input = {}) {
  input ??= {};
  let state = cleanState(previous);
  const wasActive = state.active;
  if (input.running !== true || input.flight !== true || input.grounded === true) {
    return { state: stopAfterburner(state), activeSeconds: 0, ignited: false, ended: wasActive };
  }
  const elapsed = nonnegative(dt);
  const manual = input.manualRequest === true;
  const angle = Number.isFinite(input.autoAngle)
    ? clamp(input.autoAngle, tuning.minAutoAngle, tuning.maxAutoAngle) : tuning.autoAngle;
  const pitch = Number.isFinite(input.pitchInputDegrees) ? input.pitchInputDegrees : 0;
  const autoReleased = input.autoEnabled !== true || pitch >= -(angle - tuning.autoReleaseDegrees);
  let autoDelay = 0;
  if (input.autoEnabled !== true || autoReleased) {
    state.autoRequest = false; state.autoHoldSeconds = 0;
  } else if (!state.autoRequest) {
    if (pitch <= -angle) {
      autoDelay = Math.max(0, tuning.autoHoldSeconds - state.autoHoldSeconds);
      state.autoHoldSeconds = Math.min(tuning.autoHoldSeconds, state.autoHoldSeconds + elapsed);
      state.autoRequest = state.autoHoldSeconds >= tuning.autoHoldSeconds;
    } else state.autoHoldSeconds = 0;
  }
  const request = manual || state.autoRequest;
  const requestedSeconds = manual ? elapsed : state.autoRequest ? Math.max(0, elapsed - autoDelay) : 0;
  // A held auto input is not a release while it is waiting for its dwell time.
  if (!manual && autoReleased) state.needsRelease = false;
  const rawAutoDemand = input.autoEnabled === true && pitch <= -angle;
  if ((request || rawAutoDemand) && state.fuel <= 0) state.needsRelease = true;
  const activeSeconds = request && !state.needsRelease ? Math.min(requestedSeconds, state.fuel / tuning.drainRate) : 0;
  const ignited = !wasActive && activeSeconds > 0;
  const exhausted = activeSeconds > 0 && activeSeconds >= state.fuel / tuning.drainRate;
  state.fuel = exhausted ? 0 : Math.max(0, state.fuel - activeSeconds * tuning.drainRate);
  state.active = request && !state.needsRelease && state.fuel > 0 && (wasActive || activeSeconds > 0);
  if (exhausted) state.needsRelease = true;
  if (ignited) { state.uses = add(state.uses, 1); state.burstSeconds = 0; }
  state.seconds = add(state.seconds, activeSeconds);
  state.burstSeconds = add(state.burstSeconds, activeSeconds);
  state.timeSeconds = add(state.timeSeconds, elapsed);
  state.maxSpeed = Math.max(state.maxSpeed, nonnegative(input.speed));
  if (activeSeconds === 0 && Number.isFinite(input.groundClearance)
    && input.groundClearance > 0 && input.groundClearance < tuning.lowAltitude
    && Number.isFinite(input.speed) && input.speed >= tuning.lowAltitudeMinSpeed) {
    state = credit(state, tuning.lowAltitudeRate * (1 - input.groundClearance / tuning.lowAltitude) * elapsed);
  }
  return { state, activeSeconds, ignited, ended: (wasActive || ignited) && !state.active };
}
