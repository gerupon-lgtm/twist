/** Preflight-only tones. They never generate haptics, game state or music events. */
export const COUNTDOWN_AUDIO=Object.freeze({prepareTimeoutMs:1500,tickHz:880,goHz:1760,tickMs:90,goMs:160,volume:11});
export const validCountdownSession=value=>Number.isSafeInteger(value)&&value>0;
export const validCountdownCue=value=>value===3||value===2||value===1||value==='go';
export function countdownTone(cue){
  if(!validCountdownCue(cue))return null;
  return {hz:cue==='go'?COUNTDOWN_AUDIO.goHz:COUNTDOWN_AUDIO.tickHz,durationMs:cue==='go'?COUNTDOWN_AUDIO.goMs:COUNTDOWN_AUDIO.tickMs};
}
export function applyCountdownRegisters(registers,cue,elapsedMs){
  const tone=countdownTone(cue);
  if(!tone||!Number.isFinite(elapsedMs)||elapsedMs<0||elapsedMs>=tone.durationMs)return registers;
  const period=Math.round(3579545/2/(16*tone.hz));
  const envelope=Math.max(0,Math.min(1,elapsedMs/3,(tone.durationMs-elapsedMs)/12));
  registers[4]=period&255;registers[5]=(period>>8)&15;
  registers[10]=Math.round(COUNTDOWN_AUDIO.volume*envelope);
  registers[7]=(registers[7]|(1<<5))&~(1<<2);
  return registers;
}
