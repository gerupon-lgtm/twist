import { normalizeFlightSettings } from './flight-settings.js';

/** Counts simulated flying time; menus and waiting for sensors never advance it. */
export function createFlightSession() {
  let elapsedSeconds = 0, groundContacts = 0, recoverySeconds = 0, wasGrounded = false;
  return {
    advance(dt, state) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      elapsedSeconds += dt;
      if (state.recoveryAssist > 0) recoverySeconds += dt;
      if (state.grounded && !wasGrounded) groundContacts++;
      wasGrounded = Boolean(state.grounded);
    },
    restartLeg() { wasGrounded = false; },
    reset() { elapsedSeconds = 0; groundContacts = 0; recoverySeconds = 0; wasGrounded = false; },
    snapshot() { return { elapsedSeconds, groundContacts, recoverySeconds }; },
  };
}

export function flightReport({ version, pitch, steer, settings, stats }) {
  return { version, pitch, steer, settings: normalizeFlightSettings(settings), ...(stats ? { stats: { ...stats } } : {}) };
}

export const copyableFlightReport = report => JSON.stringify(report);
