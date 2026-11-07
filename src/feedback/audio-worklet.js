import { ChipMixer } from './chip-mixer.js';
import { flightFeedback, sfxRegisters, pulseAt, EVENT_FEEDBACK,varioMaySound } from './model.js';
import { advanceVarioPhase } from '../cockpit-aids.js';
import { NAVIGATION_BURST_MS,navigationCue,navigationBlockReason } from './navigation-audio.js';

class TwistAudioProcessor extends AudioWorkletProcessor {
  constructor(){
    super();this.mixer=new ChipMixer(Math.round(sampleRate));this.active=false;this.event=null;
    this.eventAt=0;this.cueAt=0;this.cue='quiet';this.model=flightFeedback();this.settings={};
    this.silentModel=flightFeedback();this.registers=new Uint8Array(14);
    this.musicQueue=[];this.musicHead=0;this.musicPlaying=false;this.musicVolume=.5;
    this.busyMs=0;this.frames=0;this.untilUpdate=0;
    this.varioPhase=0;this.varioRunning=false;
    this.navigation=null;this.navigationBurst=null;this.navigationAt=0;this.navigationLastAt=null;this.navigationNextAt=0;this.navigationWasAllowed=false;this.navigationLastBlock='inactive';
    this.navigationMetrics={accepted:0,suppressed:0,lastPan:null,lastIntervalMs:null,lastAt:null,reason:'inactive'};
    this.port.onmessage=({data:m})=>{
      if(m.type==='stop'){this.active=false;this.event=null;this.cue='quiet';this.cueAt=currentTime;this.musicQueue=[];this.musicHead=0;this.musicPlaying=false;this.varioPhase=0;this.varioRunning=false;this.untilUpdate=0;this.navigation=null;this.endNavigation('inactive');this.mixer.stop();}
      if(m.type==='resetMetrics'){this.busyMs=0;this.frames=0;this.mixer.takePeak();this.navigationMetrics={accepted:0,suppressed:0,lastPan:null,lastIntervalMs:null,lastAt:null,reason:this.navigationMetrics.reason};this.publishNavigation();}
      if(m.type==='settings'){this.settings=m.settings;this.mixer.setVolume(m.settings.volume);this.blockNavigation();}
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
        this.navigation=m.navigation||null;this.blockNavigation();
        if(this.cue!==m.model.cue||m.phase?.restarted){this.cue=m.model.cue;this.cueAt=currentTime-(m.phase?.elapsedMs||0)/1000;}
      }
      if(m.type==='event'&&EVENT_FEEDBACK[m.kind]){
        if(this.event&&EVENT_FEEDBACK[this.event].priority>EVENT_FEEDBACK[m.kind].priority)return;
        this.settings=m.settings;this.mixer.setVolume(m.settings.volume);this.event=m.kind;this.eventAt=currentTime;
        this.blockNavigation();
      }
      if(m.type==='poll'){
        this.port.postMessage({type:'metrics',load:this.frames?this.busyMs/1000/(this.frames/sampleRate):0,
          peak:this.mixer.takePeak(),active:this.active,event:this.event,music:this.musicPlaying,
          vario:this.active&&this.settings.sound&&this.settings.sfx&&varioMaySound(this.model,Boolean(this.event)),navigation:this.navigationSnapshot()});this.busyMs=0;this.frames=0;
      }
    };
  }
  navigationSnapshot(){
    return {...this.navigationMetrics,active:Boolean(this.navigationBurst),pan:this.navigationBurst?.pan??0,
      enabled:Boolean(this.navigation?.enabled),bearingDeg:Number.isFinite(this.navigation?.bearingDeg)?this.navigation.bearingDeg:null,
      nextAt:this.navigationWasAllowed?this.navigationNextAt:null};
  }
  publishNavigation(){this.port.postMessage({type:'navigation',navigation:this.navigationSnapshot()});}
  endNavigation(reason,resetSchedule=true){
    const hadBurst=Boolean(this.navigationBurst),changed=hadBurst||this.navigationMetrics.reason!==reason;
    this.navigationBurst=null;this.navigationMetrics.reason=reason;
    if(hadBurst){this.untilUpdate=0;this.mixer.cancelNavigation();}
    if(resetSchedule){this.navigationWasAllowed=false;this.navigationLastAt=null;this.navigationNextAt=0;}
    if(changed)this.publishNavigation();
  }
  blockNavigation(){
    const reason=navigationBlockReason({active:this.active,sound:this.settings.sound,sfx:this.settings.sfx,enabled:this.navigation?.enabled,
      event:this.event,cue:this.model.cue,varioActive:Boolean(this.model.vario?.active),bearingDeg:this.navigation?.bearingDeg});
    if(reason){
      // Count blocker transitions rather than every 128-frame processing block.
      if(reason!==this.navigationLastBlock&&['event','warning','vario'].includes(reason))this.navigationMetrics.suppressed++;
      this.endNavigation(reason);
    }
    this.navigationLastBlock=reason;return reason;
  }
  stepNavigation(){
    if(this.blockNavigation())return;
    const cue=navigationCue(this.navigation.bearingDeg);
    if(!this.navigationWasAllowed){this.navigationNextAt=currentTime;this.navigationWasAllowed=true;}
    else this.navigationNextAt=(this.navigationLastAt??currentTime)+cue.intervalMs/1000;
    if(this.navigationBurst&&(currentTime-this.navigationAt)*1000>=NAVIGATION_BURST_MS)this.endNavigation('waiting',false);
    if(!this.navigationBurst&&currentTime>=this.navigationNextAt){
      this.navigationBurst=cue;this.navigationAt=currentTime;this.navigationLastAt=currentTime;this.navigationNextAt=currentTime+cue.intervalMs/1000;this.untilUpdate=0;
      this.navigationMetrics={...this.navigationMetrics,accepted:this.navigationMetrics.accepted+1,lastPan:cue.pan,
        lastIntervalMs:cue.intervalMs,lastAt:currentTime,reason:'playing'};this.publishNavigation();
    }
  }
  process(_inputs,outputs){
    const t=Date.now(),left=outputs[0]?.[0],right=outputs[0]?.[1];if(!left)return true;
    if(this.event&&(currentTime-this.eventAt)*1000>=EVENT_FEEDBACK[this.event].duration)this.event=null;
    const varioEnabled=this.active&&this.settings.sound&&this.settings.sfx&&varioMaySound(this.model,Boolean(this.event));
    if(!varioEnabled){this.varioPhase=0;this.varioRunning=false;}
    else if(!this.varioRunning){this.varioPhase=0;this.varioRunning=true;this.untilUpdate=0;}
    this.stepNavigation();
    if((this.active||this.event||this.musicPlaying)&&this.settings.sound){
      if(this.untilUpdate<=0){
        const model=this.active?this.model:this.silentModel;
        this.mixer.writeSfx(sfxRegisters(model,this.event,(currentTime-this.eventAt)*1000,
          pulseAt(model.soundPattern,(currentTime-this.cueAt)*1000),this.registers,this.varioPhase*(model.vario?.periodMs||1000),
          this.navigationBurst?{elapsedMs:(currentTime-this.navigationAt)*1000}:null));
        this.untilUpdate=sampleRate/100;
      }
      const end=currentTime+left.length/sampleRate;
      while(this.musicHead<this.musicQueue.length&&this.musicQueue[this.musicHead].at<end){
        const w=this.musicQueue[this.musicHead++];this.mixer.writeMusic(w.addr,w.value);
      }
      this.mixer.musicGain=this.musicPlaying?this.musicVolume:0;
      this.mixer.sfxGain=this.settings.sfx?1:0;
      this.untilUpdate-=left.length;this.mixer.render(left,right,this.navigationBurst?.pan??null);
    }else {left.fill(0);right?.fill(0);}
    if(varioEnabled)this.varioPhase=advanceVarioPhase(this.varioPhase,left.length/sampleRate*1000,this.model.vario.periodMs);
    for(let i=2;i<outputs[0].length;i++)outputs[0][i].set(left);
    this.frames+=left.length;this.busyMs+=Date.now()-t;return true;
  }
}
registerProcessor('twist-audio',TwistAudioProcessor);
