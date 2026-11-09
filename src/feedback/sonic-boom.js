/** Original procedural double crack and low pressure tail; no audio asset. */
export const SONIC_BOOM_SECONDS = .85;
export function sonicBoomSample(seconds, direction = 'up') {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds >= SONIC_BOOM_SECONDS) return 0;
  const attack = Math.min(1, seconds / .002);
  const tail = Math.exp(-seconds * 8) * (1 - seconds / SONIC_BOOM_SECONDS);
  const rumble = Math.sin(2 * Math.PI * (58 * seconds - 18 * seconds * seconds));
  // Deterministic broadband crack: independent of render block size or refresh rate.
  const seed = Math.sin(Math.floor(seconds * 48000) * 12.9898 + 78.233) * 43758.5453;
  const noise = 2 * (seed - Math.floor(seed)) - 1;
  const crack = Math.exp(-seconds * 105) + (seconds >= .065 ? .7 * Math.exp(-(seconds - .065) * 95) : 0);
  return attack * (.42 * rumble * tail + .22 * noise * crack) * (direction === 'down' ? .55 : 1);
}
