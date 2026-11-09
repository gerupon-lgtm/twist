/** Independent two-operator timbres; no imported waveforms or preset values. */
export const FM_PRESETS=Object.freeze({
  lead:Object.freeze({ratio:2,index:1.65,attack:.006,decay:.12,sustain:.68,release:.07,modDecay:.09,gain:.12}),
  chords:Object.freeze({ratio:1,index:1.05,attack:.008,decay:.08,sustain:.55,release:.05,modDecay:.06,gain:.07}),
  bass:Object.freeze({ratio:1,index:1.4,attack:.004,decay:.16,sustain:.72,release:.045,modDecay:.08,gain:.115}),
  'distortion-guitar':Object.freeze({ratio:1,index:2.4,indexSustain:.65,attack:.004,decay:.16,sustain:.78,release:.075,modDecay:.14,gain:.105,drive:3.4,lowpass:5200}),
});
export const isFmPreset=value=>typeof value==='string'&&Object.hasOwn(FM_PRESETS,value);
export function fmPartStatus(part){
  if(part?.role==='drums')return {eligible:false,reason:'retained'};
  if(!part)return {eligible:false,reason:'missing-part'};
  const preset=part.fmPreset??(part.role==='bass'?'bass':part.role==='chords'?'chords':'lead');
  return isFmPreset(preset)?{eligible:true,preset,reason:null}:{eligible:false,reason:'unknown-preset'};
}
