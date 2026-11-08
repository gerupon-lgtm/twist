import { getGroundProximity } from '../ground-proximity.js';
import { varioCue } from '../cockpit-aids.js';
import { NAVIGATION_BURST_MS,NAVIGATION_TONE_HZ,NAVIGATION_VOLUME } from './navigation-audio.js';
import {supersonicFeedback,applySonicRegisters,SONIC_TRANSITION} from './supersonic-model.js';
const clamp = (n,min,max) => Math.max(min,Math.min(max,Number.isFinite(n)?n:min));
export const FEEDBACK_TUNING = Object.freeze({ buffetStart: 14, stallStart: 20, stallEnd: 70,
  engineCycle: 400, enginePulse: 5, groundPattern: [85,100,85,430], stallPattern: [100,45,55,90,160,110],
  fineCycle: 60, finePulses: 4, strongStallPattern: [180,30,120,40,260,50],
  afterburner: Object.freeze({ignitionSeconds:.12,attackSeconds:.01,releaseSeconds:.15,
    roarVolume:8,ignitionVolume:15,duckVolume:5,noiseStart:31,noiseEnd:6,roarNoise:8,
    fineOn:30,classicOn:120}) });
export const EVENT_FEEDBACK = Object.freeze({
  collect: { priority: 2, duration: 300, pattern: [30,80,70] },
  exitOpen: { priority: 2, duration: 650, pattern: [] },
  clear: { priority: 3, duration: 1300, pattern: [90,90,160,100,260] },
  crash: { priority: 3, duration: 800, pattern: [320] },
});
export function scaledPattern(pattern,scale=1) {
  const result=[];
  for(let i=0;i<pattern.length;i+=2) {
    const total=pattern[i]+(pattern[i+1]||0),on=Math.round(clamp(pattern[i]*scale,0,total));
    result.push(on); if(i+1<pattern.length) result.push(total-on);
  }
  return result;
}
export function pulseAt(pattern,elapsedMs) {
  let cycle=0;for(let i=0;i<pattern.length;i++)cycle+=pattern[i];
  if(!cycle) return false;
  let time=((Math.max(0,elapsedMs)%cycle)+cycle)%cycle;
  for(let i=0;i<pattern.length;i++){ if(time<pattern[i]) return i%2===0; time-=pattern[i]; }
  return false;
}
function afterburnerState(value) {
  const active=value?.active===true&&Number.isFinite(value.burstSeconds)&&value.burstSeconds>=0;
  return {active,burstSeconds:active?value.burstSeconds:0};
}
export function afterburnerPhase(model,seconds=model.afterburner?.burstSeconds) {
  if(model.afterburner?.active!==true||!Number.isFinite(seconds)||seconds<0)return 'off';
  return seconds<FEEDBACK_TUNING.afterburner.ignitionSeconds?'ignition':'roar';
}
/** All timing/threshold choices live here, outside the unmodified chip code. */
export function flightFeedback(state={},settings={}) {
  const angle=clamp(Math.abs(state.angleOfAttack||0)*180/Math.PI,0,180);
  const power=clamp(state.throttle,0,1),speed=clamp(state.speed,0,45);
  const afterburner=afterburnerState(state.afterburner),boost=FEEDBACK_TUNING.afterburner;
  let cue='quiet',pattern=[];
  if(state.mode!=='explore'&&getGroundProximity(state.supersonic?{...state,altitude:state.groundClearance}:state).level==='danger') {cue='ground';pattern=[...FEEDBACK_TUNING.groundPattern];}
  else if(angle>=FEEDBACK_TUNING.stallStart){cue='stall';pattern=scaledPattern(FEEDBACK_TUNING.stallPattern,.6+.4*clamp((angle-FEEDBACK_TUNING.stallStart)/(FEEDBACK_TUNING.stallEnd-FEEDBACK_TUNING.stallStart),0,1));}
  else if(angle>=FEEDBACK_TUNING.buffetStart){cue='buffet';const on=Math.round(15+(angle-FEEDBACK_TUNING.buffetStart)/(FEEDBACK_TUNING.stallStart-FEEDBACK_TUNING.buffetStart)*70);pattern=[on,300-on];}
  else if(afterburner.active&&settings.engineVibration!==false){cue='afterburner';pattern=[boost.classicOn,FEEDBACK_TUNING.engineCycle-boost.classicOn];}
  else if(power>0 && settings.engineVibration!==false){cue='engine';const on=Math.max(1,Math.round(FEEDBACK_TUNING.enginePulse*power));pattern=[on,FEEDBACK_TUNING.engineCycle-on];}
  let vibrationPattern=pattern;
  if(cue==='engine'&&settings.flightVibration!=='classic') {
    // Four pulses per request; eight entries also fit the current Vibration API limit.
    const on=Math.round(8+6*power);
    vibrationPattern=Array.from({length:FEEDBACK_TUNING.finePulses},()=>[on,FEEDBACK_TUNING.fineCycle-on]).flat();
  } else if(cue==='afterburner'&&settings.flightVibration!=='classic') {
    vibrationPattern=Array.from({length:FEEDBACK_TUNING.finePulses},()=>[boost.fineOn,FEEDBACK_TUNING.fineCycle-boost.fineOn]).flat();
  } else if(cue==='stall') vibrationPattern=scaledPattern(FEEDBACK_TUNING.strongStallPattern,.75+.25*clamp((angle-20)/50,0,1));
  const vibration=scaledPattern(vibrationPattern,clamp(settings.vibrationScale??1,0,2));
  const model={ cue, pattern:vibration, soundPattern:pattern, cycle:vibrationPattern.reduce((a,b)=>a+b,0),
    angleOfAttack:angle,power,speed,engineHz:55+power*120,wind:speed/45,
    vario:varioCue(state.verticalSpeed,settings.vario!==false&&state.mode==='flight'),afterburner };
  return state.supersonic?supersonicFeedback(state,model):model;
}

const COLLECT_NOTES=[523,784,1047],CLEAR_NOTES=[523,659,784,1047,784,1047];
export const varioMaySound=(model,eventActive=false)=>Boolean(model.vario?.active&&!eventActive&&!['stall','ground','buffet'].includes(model.cue));
function voice(regs,channel,hz,volume,noise,mixer){
  const period=Math.round(3579545/2/(16*Math.max(25,hz||25)));
  regs[channel*2]=period&255;regs[channel*2+1]=(period>>8)&15;regs[8+channel]=clamp(Math.round(volume),0,15);
  if(hz>0)mixer&=~(1<<channel);if(noise)mixer&=~(1<<(channel+3));return mixer;
}
export function sfxRegisters(model,event=null,eventMs=0,pulse=false,regs=new Uint8Array(14),varioMs=eventMs,navigation=null,afterburnerSeconds=model.afterburner?.burstSeconds,effects={}) {
  regs.fill(0);let mixer=0x3f;
  const eventActive=Boolean(event && EVENT_FEEDBACK[event] && eventMs<EVENT_FEEDBACK[event].duration);
  const warning=['ground','stall','buffet'].includes(model.cue);
  const sonicActive=Boolean(model.supersonic&&effects.sonic&&Number.isFinite(effects.sonic.elapsedMs)&&effects.sonic.elapsedMs>=0&&effects.sonic.elapsedMs<SONIC_TRANSITION.duration&&!eventActive&&!warning);
  const navigationActive=Boolean(navigation&&!eventActive&&!sonicActive&&!model.vario?.active&&!warning
    &&Number.isFinite(navigation.elapsedMs)&&navigation.elapsedMs>=0&&navigation.elapsedMs<NAVIGATION_BURST_MS);
  const boost=FEEDBACK_TUNING.afterburner,phase=afterburnerPhase(model,afterburnerSeconds);
  const release=phase==='off'?clamp(effects.afterburnerRelease,0,1):0;
  const windVolume=model.power*3+model.wind*9,windNoise=Math.round(31-model.wind*26);
  // Noise belongs to the ordinary wind throughout AB. A low tone on B adds
  // the engine roar without pinning the shared noise period at a low pitch.
  if((phase!=='off'||release>0)&&!eventActive&&!warning) {
    const duck=varioMaySound(model,eventActive)||navigationActive;
    const ignition=phase==='ignition'&&!duck;
    const envelope=ignition?clamp(Math.min(afterburnerSeconds/boost.attackSeconds,(boost.ignitionSeconds-afterburnerSeconds)/.03),0,1):0;
    const strength=phase==='off'?release:1,roar=boost.roarVolume+model.wind*4;
    const volume=duck?boost.duckVolume:roar+(boost.ignitionVolume-roar)*envelope;
    mixer=voice(regs,0,0,windVolume+(volume-windVolume)*strength,true,mixer);
    mixer=voice(regs,1,48+model.wind*22,(duck?4:ignition?13:9)*strength,false,mixer);
    regs[6]=ignition?Math.round(boost.noiseStart+(boost.noiseEnd-boost.noiseStart)*afterburnerSeconds/boost.ignitionSeconds):windNoise;
  } else {
    // Noise period is shared by A/B/C: warnings/events retain ordinary A output.
    mixer=voice(regs,0,model.power>0?model.engineHz:0,eventActive?1:windVolume,model.wind>.04||model.power>.1,mixer);
    regs[6]=windNoise;
  }
  if(!eventActive&&(model.cue==='stall'||model.cue==='ground'||model.cue==='buffet')&&pulse) {
    mixer=voice(regs,1,model.cue==='buffet'?0:model.cue==='ground'?880:180,model.cue==='buffet'?6:10,model.cue==='buffet',mixer);
    if(model.cue==='buffet')regs[6]=22;
  }
  if(eventActive) {
    if(event==='crash'){regs[6]=18;mixer=voice(regs,2,0,13*(1-eventMs/800),true,mixer);}
    else {const notes=event==='exitOpen'?[659,988,1319,1568]:event==='collect'?COLLECT_NOTES:CLEAR_NOTES;
      mixer=voice(regs,2,notes[Math.min(notes.length-1,Math.floor(eventMs/(event==='exitOpen'?155:event==='collect'?85:180)))],12*(1-eventMs/EVENT_FEEDBACK[event].duration),false,mixer);}
  }
  const passby=effects.passby;
  if(passby&&!eventActive&&!warning&&Number.isFinite(passby.elapsedMs)&&passby.elapsedMs>=0&&passby.elapsedMs<140){
    const t=passby.elapsedMs/140,sharpness=clamp(passby.speed/45,0,1);
    const envelope=Math.min(1,t/.08)*(1-t);
    mixer=voice(regs,1,900+sharpness*1500-t*700,(8+sharpness*6)*envelope,true,mixer);
    regs[6]=Math.round(14-sharpness*9+t*8);
  }
  if(!sonicActive&&varioMaySound(model,eventActive)
    &&varioMs%model.vario.periodMs<model.vario.onMs) {
    mixer=voice(regs,2,model.vario.hz,6,false,mixer);
  }
  if(navigationActive){
    const envelope=Math.min(1,navigation.elapsedMs/5,(NAVIGATION_BURST_MS-navigation.elapsedMs)/10);
    mixer=voice(regs,2,NAVIGATION_TONE_HZ,NAVIGATION_VOLUME*envelope,false,mixer);
  }
  regs[7]=mixer;
  if(model.supersonic&&!eventActive&&!warning)applySonicRegisters(regs,effects.sonic,effects.sonic?.elapsedMs);
  return regs;
}
