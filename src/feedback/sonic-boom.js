/** Original procedural double crack and low pressure tail; no audio asset. */
export const SONIC_BOOM_SECONDS = 1.35;
export const sonicBoomDuration=direction=>direction==='down'?.85:SONIC_BOOM_SECONDS;
export function sonicBoomDucking(seconds,direction='up'){
  if(direction==='down'||!Number.isFinite(seconds)||seconds<0||seconds>=SONIC_BOOM_SECONDS)return 1;
  return 1-.65*Math.min(1,seconds/.003)*Math.exp(-seconds*3)*(1-seconds/SONIC_BOOM_SECONDS);
}
export function sonicBoomSample(seconds, direction = 'up') {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds >= sonicBoomDuration(direction)) return 0;
  const seed = Math.sin(Math.floor(seconds * 48000) * 12.9898 + 78.233) * 43758.5453;
  const noise = 2 * (seed - Math.floor(seed)) - 1;
  if(direction==='up'){
    const attack=Math.min(1,seconds/.0015),tail=Math.exp(-seconds*4)*(1-seconds/SONIC_BOOM_SECONDS);
    const crack=Math.exp(-seconds*28)+(seconds>=.055?.8*Math.exp(-(seconds-.055)*32):0);
    const body=Math.sin(2*Math.PI*(110*seconds-22*seconds*seconds))+.35*Math.sin(2*Math.PI*185*seconds);
    return attack*(.95*noise*crack+.95*body*tail+.45*Math.sin(2*Math.PI*390*seconds)*Math.exp(-seconds*18)+.23*noise*tail);
  }
  // Keep the previous, softer downward crossing intact.
  const attack = Math.min(1, seconds / .002);
  const tail = Math.exp(-seconds * 8) * (1 - seconds / .85);
  const rumble = Math.sin(2 * Math.PI * (58 * seconds - 18 * seconds * seconds));
  // Deterministic broadband crack: independent of render block size or refresh rate.
  const crack = Math.exp(-seconds * 105) + (seconds >= .065 ? .7 * Math.exp(-(seconds - .065) * 95) : 0);
  return attack * (.42 * rumble * tail + .22 * noise * crack) * (direction === 'down' ? .55 : 1);
}
