const SIZE=2048,TWO_PI=2*Math.PI;
// Principal, octave, fifth and mixture ranks. Prepared once, never in render().
const RANKS=[1,.65,.35,.55,.18,.2,.12,.35];
const ORGAN_TABLES=[1,2,4,8].map(count=>{
 const normalization=Math.sqrt(RANKS.slice(0,count).reduce((sum,gain)=>sum+gain*gain,0));
 return Float64Array.from({length:SIZE+1},(_,i)=>{
  let value=0;for(let harmonic=1;harmonic<=count;harmonic++)value+=RANKS[harmonic-1]*Math.sin(i/SIZE*TWO_PI*harmonic);
  return value/normalization;
 });
});
export function organTable(frequency,rate){
 const limit=rate*.4/(frequency*1.08);
 return ORGAN_TABLES[limit>=8?3:limit>=4?2:limit>=2?1:0];
}
export function tableSample(phase,table){const p=phase*SIZE,i=Math.floor(p);return table[i]+(table[i+1]-table[i])*(p-i);}

// Band-limited saw carrier; FM still modulates its instantaneous frequency.
export function sawSample(phase,step){
 const dt=Math.min(.499999,Math.abs(step));let value=2*phase-1;
 if(dt>0&&phase<dt){const t=phase/dt;value-=t+t-t*t-1;}
 else if(dt>0&&phase>1-dt){const t=(phase-1)/dt;value-=t*t+t+t+1;}
 return value;
}
export function saturate(value){const x=Math.max(-3,Math.min(3,value)),square=x*x;return x*(27+square)/(27+9*square);}

/** Four-pole resonant low-pass; linear feedback is solved before the stages. */
export class ResonantLowpass{
 constructor(rate){this.rate=rate;this.reset();}
 reset(){this.z1=0;this.z2=0;this.z3=0;this.z4=0;this.g=0;this.feedback=0;}
 setCutoff(cutoff,resonance){
  const tangent=Math.tan(Math.PI*Math.max(20,Math.min(this.rate*.18,cutoff))/this.rate);
  this.g=tangent/(1+tangent);this.feedback=Math.max(0,Math.min(.85,resonance))*4;
 }
 process(input){
  const g=this.g,k=this.feedback,one=1-g;
  const s1=one*this.z1,s2=one*this.z2,s3=one*this.z3,s4=one*this.z4;
  const memory=((s1*g+s2)*g+s3)*g+s4;
  const driven=(input-k*memory)/(1+k*g*g*g*g);
  const y1=g*driven+s1,y2=g*y1+s2,y3=g*y2+s3,y4=g*y3+s4;
  this.z1=2*y1-this.z1;this.z2=2*y2-this.z2;this.z3=2*y3-this.z3;this.z4=2*y4-this.z4;
  return y4*(1+k*.25);
 }
}
