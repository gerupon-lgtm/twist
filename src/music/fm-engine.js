import {FM_PRESETS,isFmPreset} from './fm-presets.js';
export const FM_MAX_VOICES=128;
const TABLE_SIZE=2048,TWO_PI=2*Math.PI,TABLE=Float64Array.from({length:TABLE_SIZE+1},(_,i)=>Math.sin(i/TABLE_SIZE*TWO_PI));
const sine=phase=>{const p=phase*TABLE_SIZE,i=Math.floor(p);return TABLE[i]+(TABLE[i+1]-TABLE[i])*(p-i);};
const wrap=p=>p-Math.floor(p),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/** Fixed ownership and buffers: no voice allocation occurs in render(). */
export class FmEngine{
  constructor(rate=48000,capacity=FM_MAX_VOICES){
    if(!Number.isFinite(rate)||rate<8000||!Number.isInteger(capacity)||capacity<1||capacity>FM_MAX_VOICES)throw new RangeError('Invalid FM capacity/rate');
    this.rate=rate;this.capacity=capacity;this.active=new Int16Array(capacity);this.count=0;
    this.voices=Array.from({length:capacity},()=>({state:0,channel:0,note:0,velocity:0,frequency:0,preset:null,age:0,releaseAge:0,releaseLevel:0,level:0,carrier:0,doubleCarrier:0,modulator:0,filtered:0,index:0}));
    this.cc7=new Float64Array(8).fill(127);this.bend=new Float64Array(8);this.noteOns=0;this.noteOffs=0;this.maximumVoices=0;this.overflows=0;this.invalidEvents=0;
  }
  tune(v){v.frequency=440*2**((v.note-69+this.bend[v.channel]/8192*2)/12);}
  remove(v){const index=v.index,last=this.active[--this.count];this.active[index]=last;if(index<this.count)this.voices[last].index=index;v.state=0;}
  stop(channel){for(let i=0;i<this.count;){const v=this.voices[this.active[i]];if(channel===undefined||v.channel===channel)this.remove(v);else i++;}}
  handle(e,presetId){
    if(e?.type==='configure'){
      if(!Number.isInteger(e.capacity)||e.capacity<1||e.capacity>this.voices.length){this.invalidEvents++;return false;}
      this.stop();this.capacity=e.capacity;this.cc7.fill(127);this.bend.fill(0);this.noteOns=0;this.noteOffs=0;this.maximumVoices=0;this.overflows=0;this.invalidEvents=0;return true;
    }
    if(e?.type==='allNotesOff'){this.stop();return true;}
    if(!e||!Number.isInteger(e.channel)||e.channel<0||e.channel>7){this.invalidEvents++;return false;}
    const channel=e.channel;
    if(e.type==='noteOn'&&e.velocity===0)return this.handle({...e,type:'noteOff'});
    if(e.type==='noteOn'){
      if(!Number.isInteger(e.note)||e.note<0||e.note>127||!Number.isFinite(e.velocity)||e.velocity<=0||e.velocity>127||!isFmPreset(presetId)){this.invalidEvents++;return false;}
      let slot=-1;
      for(let i=0;i<this.count;i++){const v=this.voices[this.active[i]];if(v.state===1&&v.channel===channel&&v.note===e.note){slot=this.active[i];break;}}
      const retrigger=slot>=0;
      if(!retrigger){for(let i=0;i<this.capacity;i++)if(this.voices[i].state===0){slot=i;break;}}
      if(slot<0){this.overflows++;return false;}
      const v=this.voices[slot];if(!retrigger){v.index=this.count;this.active[this.count++]=slot;v.carrier=0;v.doubleCarrier=.11;v.modulator=0;v.filtered=0;}
      v.state=1;v.channel=channel;v.note=e.note;v.velocity=e.velocity/127;v.preset=FM_PRESETS[presetId];v.age=0;v.level=0;v.releaseAge=0;this.tune(v);
      this.noteOns++;this.maximumVoices=Math.max(this.maximumVoices,this.count);return true;
    }
    if(e.type==='noteOff'){
      for(let i=0;i<this.count;i++){const v=this.voices[this.active[i]];if(v.state===1&&v.channel===channel&&v.note===e.note){v.state=2;v.releaseAge=0;v.releaseLevel=v.level;}}
      this.noteOffs++;return true;
    }
    if(e.type==='pitchBend'&&Number.isFinite(e.value)){
      this.bend[channel]=clamp(e.value,-8192,8191);for(let i=0;i<this.count;i++){const v=this.voices[this.active[i]];if(v.channel===channel)this.tune(v);}return true;
    }
    if(e.type==='cc'&&Number.isFinite(e.value)){
      if(e.controller===7)this.cc7[channel]=clamp(e.value,0,127);
      else if(e.controller===120||e.controller===123)this.stop(channel);return true;
    }
    return false;
  }
  render(out){
    out.fill(0);
    for(let k=0;k<this.count;){
      const v=this.voices[this.active[k]],p=v.preset,rate=this.rate,frequency=v.frequency;
      const modFrequency=Math.min(frequency*p.ratio,rate*.4),maxIndex=Math.max(0,(rate*.45-frequency)/modFrequency-1);
      const gain=v.velocity*(this.cc7[v.channel]/127)*p.gain,filter=p.lowpass?1-Math.exp(-TWO_PI*Math.min(p.lowpass,rate*.2)/rate):1;let ended=false;
      const doubleFrequency=p.doublingCents?frequency*2**(p.doublingCents/1200):0;
      for(let i=0;i<out.length;i++){
        if(v.state===2){v.level=v.releaseLevel*Math.max(0,1-v.releaseAge/(p.release*rate));if(v.releaseAge++>=p.release*rate){this.remove(v);ended=true;break;}}
        else{const age=v.age/rate;v.level=age<p.attack?age/p.attack:p.sustain+(1-p.sustain)*Math.exp(-(age-p.attack)/p.decay*5);}
        const sustain=p.indexSustain??.2,index=Math.min(maxIndex,p.index*(sustain+(1-sustain)*Math.exp(-v.age/(p.modDecay*rate))));
        v.modulator=wrap(v.modulator+modFrequency/rate);v.carrier=wrap(v.carrier+(frequency+modFrequency*index*sine(v.modulator))/rate);
        let sample=sine(v.carrier);
        if(doubleFrequency){v.doubleCarrier=wrap(v.doubleCarrier+(doubleFrequency+modFrequency*index*sine(v.modulator))/rate);sample=sample*(1-p.doublingMix)+sine(v.doubleCarrier)*p.doublingMix;}
        if(p.body)sample=sample*(1-p.body)+sine(v.modulator)*p.body;
        if(p.drive){const x=clamp(sample*p.drive,-3,3),square=x*x;sample=x*(27+square)/(27+9*square);v.filtered+=filter*(sample-v.filtered);sample=v.filtered;}
        out[i]+=sample*v.level*gain;v.age++;
      }
      if(!ended)k++;
    }
  }
  snapshot(){let releasing=0;const voices=[];for(let i=0;i<this.count;i++){const v=this.voices[this.active[i]];if(v.state===2)releasing++;voices.push({channel:v.channel,note:v.note,frequency:v.frequency,releasing:v.state===2});}
    return {activeVoices:this.count,releasingVoices:releasing,maximumVoices:this.maximumVoices,noteOns:this.noteOns,noteOffs:this.noteOffs,overflows:this.overflows,invalidEvents:this.invalidEvents,capacity:this.capacity,voices};}
}
