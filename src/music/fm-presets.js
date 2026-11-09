/** Independent two-operator timbres; no imported waveforms or preset values. */
export const FM_PRESETS=Object.freeze({
  lead:Object.freeze({ratio:2,index:1.65,attack:.006,decay:.12,sustain:.68,release:.07,modDecay:.09,gain:.18}),
  chords:Object.freeze({ratio:1,index:1.05,attack:.008,decay:.08,sustain:.55,release:.05,modDecay:.06,gain:.105}),
  bass:Object.freeze({ratio:1,index:2.1,indexSustain:.55,attack:.003,decay:.18,sustain:.85,release:.045,modDecay:.10,gain:.19,body:.38,drive:2.8,lowpass:3400}),
  'distortion-guitar':Object.freeze({ratio:1,index:3.5,indexSustain:.88,attack:.003,decay:.16,sustain:.88,release:.075,modDecay:.18,gain:.21,drive:12,body:.12,doublingCents:7,doublingMix:.32,lowpass:6000}),
  sequence:Object.freeze({ratio:2,index:2.2,indexSustain:.4,attack:.002,decay:.08,sustain:.62,release:.025,modDecay:.08,gain:.14}),
});
export const isFmPreset=value=>typeof value==='string'&&Object.hasOwn(FM_PRESETS,value);
export function fmPartStatus(part){
  if(part?.role==='drums')return {eligible:false,reason:'retained'};
  if(!part)return {eligible:false,reason:'missing-part'};
  const preset=part.fmPreset??(part.role==='bass'?'bass':part.role==='chords'?'chords':'lead');
  return isFmPreset(preset)?{eligible:true,preset,reason:null}:{eligible:false,reason:'unknown-preset'};
}
