import { ChipMixer } from './chip-mixer.js';
import { flightFeedback, sfxRegisters, pulseAt, EVENT_FEEDBACK,varioMaySound,afterburnerPhase,FEEDBACK_TUNING } from './model.js';
import { advanceVarioPhase } from '../cockpit-aids.js';
import { NAVIGATION_BURST_MS,navigationCue,navigationBlockReason } from './navigation-audio.js';
import {sonicWarning,validSonicTransition} from './supersonic-model.js';
import {countdownTone as toneForCountdown,applyCountdownRegisters,validCountdownSession,validCountdownCue} from './countdown-audio.js';
import {FmEngine} from '../music/fm-engine.js';
import {sonicBoomDuration,sonicBoomSample,sonicBoomDucking} from './sonic-boom.js';
import {briefingCue,applyBriefingRegisters} from './briefing-audio.js';
import {createSpeedSoundClock} from './speed-sound.js';

class TwistAudioProcessor extends AudioWorkletProcessor {
  constructor(){
    super();this.mixer=new ChipMixer(Math.round(sampleRate));this.active=false;this.event=null;
    this.eventAt=0;this.cueAt=0;this.cue='quiet';this.model=flightFeedback();this.stateAt=0;this.settings={};
    this.silentModel=flightFeedback();this.registers=new Uint8Array(14);
    this.speedClock=createSpeedSoundClock();
    this.musicQueue=[];this.musicHead=0;this.musicPlaying=false;this.musicVolume=.5;
    this.musicSession=0;this.fm=new FmEngine(sampleRate);this.fmEnabled=false;this.fmBuffer=new Float32Array(128);
    this.cancelledMusicTags=new Set();this.afterburnerReleaseAt=null;this.passby=null;this.passbyAt=0;
    this.musicScheduleMetrics={layerWrites:0,layerCancellations:0,lastLayerAt:null,lastLayerTag:null};
    this.passbyMetrics={accepted:0,suppressed:0,reason:'inactive',id:null};
    this.sonic=null;this.sonicAt=0;this.sonicAttempt=null;this.sonicSerial=-1;
    this.sonicBuffer=new Float32Array(128);
    this.sonicDuckBuffer=new Float32Array(128);
    this.sonicMetrics={accepted:0,suppressed:0,reason:'inactive',id:null,direction:null};
    this.countdownSession=null;this.countdownCancelled=0;this.countdownSeen=new Set();this.countdown=null;this.countdownAt=0;
    this.countdownMetrics={accepted:0,suppressed:0,reason:'inactive',history:[]};
    this.briefing=null;this.briefingLastSession=0;this.briefingRegisters=new Uint8Array(14);
    this.briefingMetrics={accepted:0,suppressed:0,reason:'inactive',history:[]};
    this.busyMs=0;this.frames=0;this.untilUpdate=0;
    this.varioPhase=0;this.varioRunning=false;
    this.navigation=null;this.navigationBurst=null;this.navigationAt=0;this.navigationLastAt=null;this.navigationNextAt=0;this.navigationWasAllowed=false;this.navigationLastBlock='inactive';
    this.navigationMetrics={accepted:0,suppressed:0,lastPan:null,lastIntervalMs:null,lastAt:null,reason:'inactive'};
    this.port.onmessage=({data:m})=>{
      if(['musicReg','musicStop','stop'].includes(m.type)&&m.session!==undefined){
        if(!Number.isSafeInteger(m.session)||m.session<this.musicSession||m.type==='musicReg'&&m.session!==this.musicSession)return;
        if(m.type!=='musicReg')this.musicSession=m.session;
      }
      if(m.type==='stop'||m.type==='musicStop'){this.fm.stop();this.fmEnabled=false;}
      if(m.type==='settings'&&!m.settings.sound){this.fm.stop();this.fmEnabled=false;this.musicQueue=this.musicQueue.slice(this.musicHead).filter(w=>w.kind!=='fm');this.musicHead=0;}
      if(m.type==='stop'){this.speedClock.reset();this.endBriefing('stop');this.cancelCountdownBus(this.countdownSession);this.active=false;this.event=null;this.cue='quiet';this.cueAt=currentTime;this.musicQueue=[];this.musicHead=0;this.cancelledMusicTags.clear();this.musicPlaying=false;this.varioPhase=0;this.varioRunning=false;this.untilUpdate=0;this.navigation=null;this.afterburnerReleaseAt=null;this.endSonic('inactive');this.endPassby('inactive');this.endNavigation('inactive');this.mixer.stop();}
      if(m.type==='resetMetrics'){this.busyMs=0;this.frames=0;this.mixer.takePeak();this.navigationMetrics={accepted:0,suppressed:0,lastPan:null,lastIntervalMs:null,lastAt:null,reason:this.navigationMetrics.reason};this.publishNavigation();}
      if(m.type==='settings'){this.settings=m.settings;this.mixer.setVolume(m.settings.volume);this.untilUpdate=0;this.blockBriefing();this.blockCountdown();this.blockSonic();this.blockNavigation();this.blockPassby();if(!this.settings.sound||!this.settings.sfx)this.afterburnerReleaseAt=null;}
      if(m.type==='countdownBegin'&&validCountdownSession(m.session)&&m.session>this.countdownCancelled&&(this.countdownSession===null||m.session>=this.countdownSession)){
        this.endBriefing('countdown');
        if(this.countdownSession!==m.session){this.countdownSession=m.session;this.countdownSeen.clear();this.endCountdown('new-session');}
      }
      if(m.type==='countdownCancel')this.cancelCountdownBus(m.session);
      if(m.type==='briefingBegin'&&validCountdownSession(m.session)&&m.session>this.briefingLastSession){
        this.endBriefing('new-map');this.briefingLastSession=m.session;
        this.briefing={session:m.session,sequence:0,seen:new Set(),needsFuture:true,closed:false,motif:null,point:null};
        this.briefingMetrics.reason='ready';this.blockBriefing();this.publishBriefing();
      }
      if(m.type==='briefingCancel'&&m.session===this.briefing?.session)this.endBriefing(m.reason??'cancelled');
      if(m.type==='briefingVisualEnd'&&m.session===this.briefing?.session){this.briefing.needsFuture=false;this.stepBriefing();this.publishBriefing();}
      if(m.type==='briefingTone')this.receiveBriefing(m);
      if(m.type==='countdownTone'){
        const valid=validCountdownCue(m.cue)&&validCountdownSession(m.session)&&m.session===this.countdownSession;
        let reason=!valid?'stale':this.countdownSeen.has(m.cue)?'duplicate':null;
        if(!reason){
          this.countdownSeen.add(m.cue);
          reason=!Number.isFinite(m.expiresAt)||currentTime>m.expiresAt?'expired':m.cue==='go'?m.launched!==true?'not-launched':null:m.launched===true?'already-launched':null;
          reason=reason??this.countdownBlockReason();
        }
        if(reason){this.countdownMetrics.suppressed++;this.countdownMetrics.reason=reason;}
        else {
          const tone=toneForCountdown(m.cue);this.countdown={cue:m.cue,...tone};this.countdownAt=currentTime;this.untilUpdate=0;
          this.countdownMetrics.accepted++;this.countdownMetrics.reason='playing';
          this.countdownMetrics.history.push({session:m.session,cue:m.cue,hz:tone.hz,at:currentTime});
          if(this.countdownMetrics.history.length>16)this.countdownMetrics.history.shift();
        }
        this.publishCountdown();
      }
      if(m.type==='musicGain'){this.musicVolume=m.gain;}
      if(m.type==='musicStop'){this.musicQueue=[];this.musicHead=0;this.cancelledMusicTags.clear();this.musicPlaying=false;this.mixer.stopMusic();}
      if(m.type==='musicCancel'){
        this.cancelledMusicTags.add(m.tag);
        this.musicQueue=this.musicQueue.slice(this.musicHead).filter(w=>w.tag!==m.tag);this.musicHead=0;
        this.musicScheduleMetrics.layerCancellations++;
      }
      if(m.type==='musicReg'){
        this.musicPlaying=true;
        if(this.musicHead>512){this.musicQueue.splice(0,this.musicHead);this.musicHead=0;}
        for(const w of m.writes){
          if(this.cancelledMusicTags.has(w.tag))continue;
          if(!Number.isFinite(w.at)||w.at<=currentTime)this.applyMusicWrite(w);
          else {let i=this.musicQueue.length;while(i>this.musicHead&&this.musicQueue[i-1].at>w.at)i--;this.musicQueue.splice(i,0,w);}
        }
      }
      if(m.type==='state'){
        this.speedClock.observe(m.model.speed,currentTime);
        if(this.model.afterburner?.active&&!m.model.afterburner?.active)this.afterburnerReleaseAt=currentTime;
        if(m.model.afterburner?.active||!m.settings.sound||!m.settings.sfx)this.afterburnerReleaseAt=null;
        this.active=true;this.model=m.model;this.stateAt=currentTime;this.settings=m.settings;this.mixer.setVolume(m.settings.volume);
        this.endBriefing('flight');
        this.navigation=m.navigation||null;this.blockCountdown();this.blockSonic();this.blockNavigation();this.blockPassby();this.untilUpdate=0;
        if(this.cue!==m.model.cue||m.phase?.restarted){this.cue=m.model.cue;this.cueAt=currentTime-(m.phase?.elapsedMs||0)/1000;}
      }
      if(m.type==='event'&&EVENT_FEEDBACK[m.kind]){
        if(this.event&&EVENT_FEEDBACK[this.event].priority>EVENT_FEEDBACK[m.kind].priority)return;
        this.settings=m.settings;this.mixer.setVolume(m.settings.volume);this.event=m.kind;this.eventAt=currentTime;
        this.endBriefing('event');
        this.blockCountdown();this.blockSonic();this.blockNavigation();this.blockPassby();this.untilUpdate=0;
      }
      if(m.type==='sonic'){
        const e=m.event,valid=validSonicTransition(e),serial=e?.serial??e?.id;
        let reason=valid?null:'invalid';
        if(valid){
          const older=typeof e.attemptId==='number'&&typeof this.sonicAttempt==='number'&&e.attemptId<this.sonicAttempt;
          if(older||e.attemptId===this.sonicAttempt&&serial<=this.sonicSerial)reason='duplicate';
          else {this.sonicAttempt=e.attemptId;this.sonicSerial=serial;reason=this.sonicBlockReason();}
        }
        if(reason){this.sonicMetrics.suppressed++;this.sonicMetrics.reason=reason;}
        else {this.sonic={...e};this.sonicAt=currentTime;this.sonicMetrics={...this.sonicMetrics,accepted:this.sonicMetrics.accepted+1,reason:'playing',id:e.id,direction:e.direction};this.untilUpdate=0;this.blockNavigation();this.endPassby('sonic');}
        this.publishSonic();
      }
      if(m.type==='passby'){
        const valid=m.payload&&['speed','distance','side'].every(key=>Number.isFinite(m.payload[key]));
        const reason=!valid?'invalid':this.passbyBlockReason();
        if(reason){this.passbyMetrics.suppressed++;this.passbyMetrics.reason=reason;}
        else {this.passby=m.payload;this.passbyAt=currentTime;this.untilUpdate=0;this.passbyMetrics={...this.passbyMetrics,accepted:this.passbyMetrics.accepted+1,reason:'playing',id:m.payload.id};}
        this.publishPassby();
      }
      if(m.type==='poll'){
        this.port.postMessage({type:'metrics',load:this.frames?this.busyMs/1000/(this.frames/sampleRate):0,
          peak:this.mixer.takePeak(),active:this.active,event:this.event,music:this.musicPlaying,speedSound:this.speedClock.snapshot(),
          vario:this.active&&this.settings.sound&&this.settings.sfx&&varioMaySound(this.model,Boolean(this.event||this.sonic||this.countdown)),navigation:this.navigationSnapshot(),afterburner:this.afterburnerSnapshot(),passby:this.passbySnapshot(),sonic:this.sonicSnapshot(),countdown:this.countdownSnapshot(),briefing:this.briefingSnapshot(),fm:{...this.fm.snapshot(),prePostPeak:this.mixer.fmPrePostPeak??0,pending:this.musicQueue.slice(this.musicHead).filter(w=>w.kind==='fm').length},musicSchedule:{...this.musicScheduleMetrics,pending:this.musicQueue.length-this.musicHead}});this.busyMs=0;this.frames=0;
      }
    };
  }
  briefingBlockReason(){
    if(!this.settings.sound||!this.settings.sfx)return 'disabled';if(this.settings.volume<=0)return 'volume';
    if(this.active)return 'flight';if(this.event)return 'event';if(this.countdownSession!==null)return 'countdown';return null;
  }
  briefingSnapshot(){const record=this.briefing;return {...this.briefingMetrics,history:this.briefingMetrics.history.map(row=>({...row})),
    session:record?.session??null,sequence:record?.sequence??0,active:Boolean(record&&(record.motif||record.point)),
    needsFuture:record?.needsFuture??false,closed:record?.closed??true,atSeconds:currentTime};}
  publishBriefing(){this.port.postMessage({type:'briefing',briefing:this.briefingSnapshot()});}
  endBriefing(reason){
    const record=this.briefing;if(!record||record.closed)return;
    record.closed=true;record.needsFuture=false;record.motif=null;record.point=null;this.briefingMetrics.reason=reason;this.untilUpdate=0;
    if(!this.active&&!this.event&&!this.countdown&&!this.sonic&&!this.passby&&!this.navigationBurst)this.mixer.stopSfx();
    this.publishBriefing();
  }
  blockBriefing(){const reason=this.briefingBlockReason();if(reason)this.endBriefing(reason);return reason;}
  receiveBriefing(message){
    const record=this.briefing,validPoint=message.kind!=='point'||Number.isInteger(message.index)&&Number.isInteger(message.total),
      cue=validPoint?briefingCue(message.kind,message.index,message.total):null,key=message.kind==='point'?`point-${message.index}`:message.kind;
    let reason=!record||record.session!==message.session?'stale':!Number.isSafeInteger(message.sequence)||message.sequence<=record.sequence?'duplicate':null;
    if(!reason){record.sequence=message.sequence;
      reason=record.closed?'closed':record.seen.has(key)?'duplicate':!cue?'invalid':!Number.isFinite(message.expiresAt)||currentTime>message.expiresAt?'expired':this.briefingBlockReason();
      record.seen.add(key);
    }
    if(reason){this.briefingMetrics.suppressed++;this.briefingMetrics.reason=reason;}
    else{
      if(message.kind==='point')record.point={cue,at:currentTime};
      else {record.motif={cue,at:currentTime};if(message.kind==='complete'){record.point=null;record.needsFuture=false;}}
      this.briefingMetrics.accepted++;this.briefingMetrics.reason='playing';
      this.briefingMetrics.history.push({session:message.session,sequence:message.sequence,kind:message.kind,index:message.index,total:message.total,at:currentTime,durationMs:cue.durationMs});
      if(this.briefingMetrics.history.length>16)this.briefingMetrics.history.shift();this.untilUpdate=0;
    }
    this.publishBriefing();
  }
  stepBriefing(){
    const record=this.briefing;if(!record||record.closed)return;
    if(this.blockBriefing())return;
    let ended=false;
    for(const key of ['motif','point'])if(record[key]&&(currentTime-record[key].at)*1000>=record[key].cue.durationMs){record[key]=null;ended=true;this.untilUpdate=0;}
    if(!record.needsFuture&&!record.motif&&!record.point){this.endBriefing('finished');return;}
    if(ended){this.briefingMetrics.reason='waiting';this.publishBriefing();}
  }
  applyMusicWrite(w){
    if(w.kind==='fm'){
      const accepted=this.fm.handle(w.event,w.presetId);
      if(accepted&&w.event.type==='configure'){this.fmEnabled=true;this.mixer.fmPrePostPeak=0;}
      return;
    }
    this.mixer.writeMusic(w.addr,w.value);
    if(w.tag?.startsWith('afterburner-')){this.musicScheduleMetrics.layerWrites++;this.musicScheduleMetrics.lastLayerAt=currentTime;this.musicScheduleMetrics.lastLayerTag=w.tag;}
  }
  countdownBlockReason(){
    if(!this.settings.sound||!this.settings.sfx)return 'disabled';
    if(this.settings.volume<=0)return 'volume';
    if(this.event&&(currentTime-this.eventAt)*1000<EVENT_FEEDBACK[this.event].duration)return 'event';
    if(this.active&&sonicWarning(this.model.cue))return 'warning';return null;
  }
  countdownSnapshot(){return {...this.countdownMetrics,history:this.countdownMetrics.history.map(value=>({...value})),session:this.countdownSession,active:Boolean(this.countdown),cue:this.countdown?.cue??null,atSeconds:currentTime};}
  publishCountdown(){this.port.postMessage({type:'countdown',countdown:this.countdownSnapshot()});}
  endCountdown(reason){if(!this.countdown)return;this.countdown=null;this.countdownMetrics.reason=reason;this.untilUpdate=0;this.publishCountdown();}
  cancelCountdownBus(session){
    if(!validCountdownSession(session))return;
    this.countdownCancelled=Math.max(this.countdownCancelled,session);
    if(session===this.countdownSession){this.endCountdown('cancelled');this.countdownSession=null;this.publishCountdown();}
  }
  blockCountdown(){const reason=this.countdownBlockReason();if(reason)this.endCountdown(reason);return reason;}
  sonicBlockReason(){
    if(!this.active)return 'inactive';if(!this.model.supersonic)return 'profile';
    if(!this.settings.sound||!this.settings.sfx)return 'disabled';
    if(this.event&&(currentTime-this.eventAt)*1000<EVENT_FEEDBACK[this.event].duration)return 'event';
    if(sonicWarning(this.model.cue))return 'warning';return null;
  }
  sonicSnapshot(){return {...this.sonicMetrics,active:Boolean(this.sonic)};}
  publishSonic(){this.port.postMessage({type:'sonic',sonic:this.sonicSnapshot()});}
  endSonic(reason){if(!this.sonic)return;this.sonic=null;this.sonicMetrics.reason=reason;this.untilUpdate=0;this.publishSonic();}
  blockSonic(){const reason=this.sonicBlockReason();if(reason)this.endSonic(reason);return reason;}
  afterburnerSeconds(){
    const seconds=this.model.afterburner?.burstSeconds;
    return Number.isFinite(seconds)?seconds+Math.max(0,currentTime-this.stateAt):0;
  }
  afterburnerSnapshot(){
    const active=Boolean(this.active&&this.settings.sound&&this.settings.sfx&&this.model.afterburner?.active);
    const burstSeconds=active?this.afterburnerSeconds():0;
    let phase=active?afterburnerPhase(this.model,burstSeconds):this.afterburnerRelease()>0?'release':'off';
    const eventActive=Boolean(this.event&&(currentTime-this.eventAt)*1000<EVENT_FEEDBACK[this.event].duration);
    if(active&&(eventActive||['ground','stall','buffet'].includes(this.model.cue)))phase='suppressed';
    else if(active&&(varioMaySound(this.model,eventActive)||this.navigationBurst))phase='roar';
    return {active,burstSeconds,phase};
  }
  afterburnerRelease(){return this.active&&this.settings.sound&&this.settings.sfx&&this.afterburnerReleaseAt!==null?Math.max(0,1-(currentTime-this.afterburnerReleaseAt)/FEEDBACK_TUNING.afterburner.releaseSeconds):0;}
  passbyBlockReason(){
    if(!this.active)return 'inactive';if(!this.settings.sound||!this.settings.sfx||this.settings.passbySound===false)return 'disabled';
    if(this.event&&(currentTime-this.eventAt)*1000<EVENT_FEEDBACK[this.event].duration)return 'event';
    if(['ground','stall','buffet'].includes(this.model.cue))return 'warning';if(this.sonic)return 'sonic';return null;
  }
  passbySnapshot(){return {...this.passbyMetrics,active:Boolean(this.passby),speed:this.passby?.speed??null};}
  publishPassby(){this.port.postMessage({type:'passby',passby:this.passbySnapshot()});}
  endPassby(reason){const changed=Boolean(this.passby)||this.passbyMetrics.reason!==reason;this.passby=null;this.passbyMetrics.reason=reason;if(changed){this.untilUpdate=0;this.publishPassby();}}
  blockPassby(){const reason=this.passbyBlockReason();if(reason)this.endPassby(reason);return reason;}
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
      event:this.event||this.sonic||this.countdown,cue:this.model.cue,varioActive:Boolean(this.model.vario?.active),bearingDeg:this.navigation?.bearingDeg});
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
    this.stepBriefing();const briefingActive=Boolean(this.briefing&&!this.briefing.closed&&(this.briefing.motif||this.briefing.point));
    this.blockCountdown();if(this.countdown&&(currentTime-this.countdownAt)*1000>=this.countdown.durationMs)this.endCountdown('finished');
    this.blockSonic();if(this.sonic&&(currentTime-this.sonicAt)>=sonicBoomDuration(this.sonic.direction))this.endSonic('finished');
    this.blockPassby();if(this.passby&&(currentTime-this.passbyAt)*1000>=140)this.endPassby('finished');
    const varioEnabled=this.active&&this.settings.sound&&this.settings.sfx&&varioMaySound(this.model,Boolean(this.event||this.sonic||this.countdown));
    if(!varioEnabled){this.varioPhase=0;this.varioRunning=false;}
    else if(!this.varioRunning){this.varioPhase=0;this.varioRunning=true;this.untilUpdate=0;}
    this.stepNavigation();
    const speedCue=this.speedClock.advance(this.active?this.model:this.silentModel,this.settings,left.length/sampleRate,
      !this.active||Boolean(this.event||this.sonic||this.countdown||briefingActive||this.passby||this.navigationBurst)||sonicWarning(this.model.cue));
    if((this.active||this.event||this.musicPlaying||this.countdown||briefingActive)&&this.settings.sound){
      if(this.untilUpdate<=0){
        const model=this.active?this.model:this.silentModel;
        this.mixer.writeSfx(sfxRegisters(model,this.event,(currentTime-this.eventAt)*1000,
          pulseAt(model.soundPattern,(currentTime-this.cueAt)*1000),this.registers,this.varioPhase*(model.vario?.periodMs||1000),
          this.navigationBurst?{elapsedMs:(currentTime-this.navigationAt)*1000}:null,this.afterburnerSeconds(),
          {speed:speedCue,afterburnerRelease:this.afterburnerRelease(),passby:this.passby?{...this.passby,elapsedMs:(currentTime-this.passbyAt)*1000}:null,sonic:this.sonic?{...this.sonic,elapsedMs:(currentTime-this.sonicAt)*1000}:null}));
        if(this.countdown&&!this.countdownBlockReason())applyCountdownRegisters(this.registers,this.countdown.cue,(currentTime-this.countdownAt)*1000);
        if(this.countdown)this.mixer.writeSfx(this.registers);
        if(briefingActive){this.briefingRegisters.fill(0);this.briefingRegisters[7]=63;
          for(const key of ['motif','point']){const tone=this.briefing[key];if(tone)applyBriefingRegisters(this.briefingRegisters,tone.cue,(currentTime-tone.at)*1000);}
          this.mixer.writeSfx(this.briefingRegisters);
        }
        this.untilUpdate=sampleRate/100;
      }
      const end=currentTime+left.length/sampleRate;
      while(this.musicHead<this.musicQueue.length&&this.musicQueue[this.musicHead].at<end){
        const w=this.musicQueue[this.musicHead++];this.applyMusicWrite(w);
      }
      this.mixer.musicGain=this.musicPlaying?this.musicVolume:0;
      this.mixer.sfxGain=this.settings.sfx?1:0;
      let fm=null;if(this.fmEnabled){if(this.fmBuffer.length!==left.length)this.fmBuffer=new Float32Array(left.length);this.fm.render(this.fmBuffer);fm=this.fmBuffer;}
      let impact=null,duck=null;
      if(this.sonic){
        if(this.sonicBuffer.length!==left.length){this.sonicBuffer=new Float32Array(left.length);this.sonicDuckBuffer=new Float32Array(left.length);}
        for(let i=0;i<left.length;i++){
          const seconds=currentTime-this.sonicAt+i/sampleRate;
          this.sonicBuffer[i]=sonicBoomSample(seconds,this.sonic.direction);this.sonicDuckBuffer[i]=sonicBoomDucking(seconds,this.sonic.direction);
        }
        impact=this.sonicBuffer;duck=this.sonicDuckBuffer;
      }
      this.untilUpdate-=left.length;this.mixer.render(left,right,this.navigationBurst?.pan??null,fm,impact,duck);
    }else {left.fill(0);right?.fill(0);}
    if(varioEnabled)this.varioPhase=advanceVarioPhase(this.varioPhase,left.length/sampleRate*1000,this.model.vario.periodMs);
    for(let i=2;i<outputs[0].length;i++)outputs[0][i].set(left);
    this.frames+=left.length;this.busyMs+=Date.now()-t;return true;
  }
}
registerProcessor('twist-audio',TwistAudioProcessor);
