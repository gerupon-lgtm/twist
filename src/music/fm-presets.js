/** Independent two-operator timbres; no imported waveforms or preset values. */
export const FM_PRESETS=Object.freeze({
  lead:Object.freeze({ratio:2,index:1.65,attack:.006,decay:.12,sustain:.68,release:.07,modDecay:.09,gain:.12}),
  chords:Object.freeze({ratio:1,index:1.05,attack:.008,decay:.08,sustain:.55,release:.05,modDecay:.06,gain:.07}),
});
export const isFmPreset=value=>typeof value==='string'&&Object.hasOwn(FM_PRESETS,value);
export function fmPartStatus(part){
  if(!['lead','chords'].includes(part?.role))return {eligible:false,reason:part?.role==='bass'||part?.role==='drums'?'retained':'missing-role'};
  return isFmPreset(part.fmPreset)?{eligible:true,preset:part.fmPreset,reason:null}:{eligible:false,reason:'unknown-preset'};
}
