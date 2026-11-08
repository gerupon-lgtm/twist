// Only the small MML vocabulary used in the author's supplied specification.
// O4 C is MIDI 60; > raises the octave and < lowers it.
export function parseMmlFragment(source){
  let cursor=0,octave=4,defaultDuration=1,beat=0;
  const notes=[],semitones={c:0,d:2,e:4,f:5,g:7,a:9,b:11};
  const integer=()=>{const match=/^\d+/.exec(source.slice(cursor));if(!match)return null;cursor+=match[0].length;return Number(match[0]);};
  const checkLength=value=>{if(![1,2,4,8,16,32,64].includes(value))throw Error('Unsupported MML note length');return value;};
  while(cursor<source.length){
    const token=source[cursor++].toLowerCase();
    if(/\s/.test(token))continue;
    if(token==='o'||token==='l'){
      const value=integer();
      if(value===null)throw Error('Missing MML command value');
      if(token==='o'){if(value<0||value>8)throw Error('Invalid MML octave');octave=value;}
      else{defaultDuration=4/checkLength(value);if(source[cursor]==='.'){defaultDuration*=1.5;cursor++;}}
      continue;
    }
    if(token==='>'||token==='<'){octave+=token==='>'?1:-1;if(octave<0||octave>8)throw Error('Invalid MML octave');continue;}
    if(token!=='r'&&!Object.hasOwn(semitones,token))throw Error('Unsupported MML token: '+token);
    let accidental=0;
    if(token!=='r'&&['#','+','-'].includes(source[cursor]))accidental=source[cursor++]==='-'?-1:1;
    const explicitLength=integer();
    let duration=explicitLength===null?defaultDuration:4/checkLength(explicitLength);
    if(source[cursor]==='.'){duration*=1.5;cursor++;}
    if(token!=='r'){
      const pitch=(octave+1)*12+semitones[token]+accidental;
      if(pitch<0||pitch>127)throw Error('MML pitch outside MIDI range');
      notes.push({beat,pitch,duration});
    }
    beat+=duration;
  }
  return {notes,beats:beat};
}

// These are the author's original excerpts, copied without changing note order.
export const MML_FRAGMENTS=Object.freeze({
  ignitionBass:'O2 L8 dddddddd a#a#a#a#a#a#a#a# cccccccc dddddddd',
  ignitionVerse:'O4 L4 d a L8 g f L4 e c L2 d',
  ignitionChorus:'O5 L4 d. L8 e L4 f# a L2. g L4 f# e',
  advanceRiff:'O2 L8 e. r16 e e r e g a L4 b L8 a g L4 e',
  advanceMarch:'L4 c L8 c c L4 c L16 c c c c',
  advanceBrass:'O4 L4 e b L8 a g L2 f# L4 d e',
  overdriveBass:'O2 L8 aaaaaaaa aaaaaaaa aaaaaaaa aaaaaaaa',
  overdriveArp:'O5 L16 a c e a e c a c a d f a f d a d',
  overdriveChorus:'O5 L4 a. L8 b L4 >c< b L2 g L4 e a',
});
