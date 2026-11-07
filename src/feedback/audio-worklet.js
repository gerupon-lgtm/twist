import { ChipMixer } from './chip-mixer.js';
import { flightFeedback, sfxRegisters, pulseAt, EVENT_FEEDBACK } from './model.js';

class TwistAudioProcessor extends AudioWorkletProcessor {
  constructor(){
    super();this.mixer=new ChipMixer(Math.round(sampleRate));this.active=false;this.event=null;
    this.eventAt=0;this.cueAt=0;this.cue='quiet';this.model=flightFeedback();this.settings={};
    this.silentModel=flightFeedback();this.registers=new Uint8Array(14);
    this.musicQueue=[];this.musicHead=0;this.musicPlaying=false;this.musicVolume=.5;
    this.busyMs=0;this.frames=0;this.untilUpdate=0;
    this.port.onmessage=({data:m})=>{
      if(m.type==='stop'){this.active=false;this.event=null;this.cue='quiet';this.cueAt=currentTime;this.musicQueue=[];this.musicHead=0;this.musicPlaying=false;this.mixer.stop();}
      if(m.type==='resetMetrics'){this.busyMs=0;this.frames=0;this.mixer.post.takePeak();}
      if(m.type==='settings'){this.settings=m.settings;this.mixer.setVolume(m.settings.volume);}
      if(m.type==='musicGain'){this.musicVolume=m.gain;}
      if(m.type==='musicStop'){this.musicQueue=[];this.musicHead=0;this.musicPlaying=false;this.mixer.stopMusic();}
      if(m.type==='musicReg'){
        this.musicPlaying=true;
        if(this.musicHead>512){this.musicQueue.splice(0,this.musicHead);this.musicHead=0;}
        for(const w of m.writes){
          if(!Number.isFinite(w.at)||w.at<=currentTime)this.mixer.writeMusic(w.addr,w.value);
          else {let i=this.musicQueue.length;while(i>this.musicHead&&this.musicQueue[i-1].at>w.at)i--;this.musicQueue.splice(i,0,w);}
        }
      }
      if(m.type==='state'){
        this.active=true;this.model=m.model;this.settings=m.settings;this.mixer.setVolume(m.settings.volume);
        if(this.cue!==m.model.cue||m.phase?.restarted){this.cue=m.model.cue;this.cueAt=currentTime-(m.phase?.elapsedMs||0)/1000;}
      }
      if(m.type==='event'&&EVENT_FEEDBACK[m.kind]){
        if(this.event&&EVENT_FEEDBACK[this.event].priority>EVENT_FEEDBACK[m.kind].priority)return;
        this.settings=m.settings;this.mixer.setVolume(m.settings.volume);this.event=m.kind;this.eventAt=currentTime;
      }
      if(m.type==='poll'){
        this.port.postMessage({type:'metrics',load:this.frames?this.busyMs/1000/(this.frames/sampleRate):0,
          peak:this.mixer.post.takePeak(),active:this.active,event:this.event,music:this.musicPlaying});this.busyMs=0;this.frames=0;
      }
    };
  }
  process(_inputs,outputs){
    const t=Date.now(),left=outputs[0]?.[0];if(!left)return true;
    if(this.event&&(currentTime-this.eventAt)*1000>=EVENT_FEEDBACK[this.event].duration)this.event=null;
    if((this.active||this.event||this.musicPlaying)&&this.settings.sound){
      if(this.untilUpdate<=0){
        const model=this.active?this.model:this.silentModel;
        this.mixer.writeSfx(sfxRegisters(model,this.event,(currentTime-this.eventAt)*1000,
          pulseAt(model.soundPattern,(currentTime-this.cueAt)*1000),this.registers));
        this.untilUpdate=sampleRate/100;
      }
      const end=currentTime+left.length/sampleRate;
      while(this.musicHead<this.musicQueue.length&&this.musicQueue[this.musicHead].at<end){
        const w=this.musicQueue[this.musicHead++];this.mixer.writeMusic(w.addr,w.value);
      }
      this.mixer.musicGain=this.musicPlaying?this.musicVolume:0;
      this.mixer.sfxGain=this.settings.sfx?1:0;
      this.untilUpdate-=left.length;this.mixer.render(left);
    }else left.fill(0);
    for(let i=1;i<outputs[0].length;i++)outputs[0][i].set(left);
    this.frames+=left.length;this.busyMs+=Date.now()-t;return true;
  }
}
registerProcessor('twist-audio',TwistAudioProcessor);
