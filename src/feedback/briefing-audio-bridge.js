// The map sound owner uses only the existing main audio instance.
import {createBriefingAudioConsumer} from './briefing-audio.js';

/** output is the EXISTING main createGameAudio instance, never a preview/context. */
export function createBriefingAudioBridge({output,readSettings,isVisible=()=>true,isInactive=()=>true,now=()=>performance.now()}){
  let session=null,lastSession=0,visualFinished=false,staticTimer=null;
  const allowed=()=>{const value=readSettings();return value.sound&&value.sfx&&value.volume>0&&isVisible()&&isInactive();};
  const consumer=createBriefingAudioConsumer({isAllowed:allowed,isReady:()=>output.briefingReady(session),
    emit:command=>{
      if(command.session===session&&allowed())output.briefingCue(command.session,{kind:command.kind,index:command.index,
        total:command.cue.total??1,remainingSeconds:Math.max(0,command.maxAgeSeconds-command.ageSeconds)},readSettings());
    },
    cancel:command=>output.cancelBriefing(command.session,command.reason),
  });
  function finish(){const result=consumer.snapshot();if(!visualFinished&&result?.session===session&&result.status==='complete'){
    visualFinished=true;clearTimeout(staticTimer);staticTimer=null;output.finishBriefing(session);
  }}
  function stop(reason='cancelled'){clearTimeout(staticTimer);staticTimer=null;consumer.cancel(reason);session=null;visualFinished=false;}
  return {
    arm(){
      if(!allowed())return false;
      // Must be called synchronously from the existing title/course click.
      // The owner handles async errors; no .then callback is allowed to play.
      output.warmBriefing(readSettings());return true;
    },
    signal(signal){
      if(!signal||!Number.isSafeInteger(signal.session)||signal.session<=0)return;
      if(signal.type==='open'){
        if(signal.session<=lastSession)return;
        clearTimeout(staticTimer);staticTimer=null;lastSession=signal.session;session=signal.session;visualFinished=false;
        const openedAt=now(),openingSession=session;
        const preparation=signal.origin==='start'&&signal.visible!==false&&allowed()?output.beginBriefing(session,readSettings()):null;
        consumer.handle(signal);finish();
        if(signal.reducedMotion&&!visualFinished&&preparation){
          const observeReady=()=>{if(session!==openingSession)return;
            consumer.handle({...signal,type:'progress',visibleSeconds:signal.visibleSeconds+Math.max(0,now()-openedAt)/1000});finish();};
          staticTimer=setTimeout(observeReady,101);
          void Promise.resolve(preparation).then(observeReady,observeReady);
        }
        return;
      }else if(signal.session!==session)return;
      consumer.handle(signal);
      finish();
      if(signal.type==='visibility'&&signal.visible===false||['close','cancel','dispose'].includes(signal.type))stop(signal.type);
    },
    stop,
    settingsChanged(){stop('settings');},
    snapshot:()=>consumer.snapshot(),
  };
}

