import {nextCameraMode,startCountdownPlan} from './start-flow-state.js';

/** UI navigation only. The existing main run() remains the sole flight boundary. */
export function createStartFlowController({ui,map,pwa,preferences,briefingPreferences,record,read,actions,now=()=>performance.now()}){
  let step='title',returnStep='title',helpReturn='title',tutorialIndex=0,tutorialFrom='first',fresh=false,token=0,timer=null;
  let countdownSession=null,resultData={},countdownAudioPreparation=null;
  let briefing={shown:false,skipped:false,seconds:0,revisits:[]};
  function settings(){const state=read();ui.setSettings({camera:state.camera,inputMethod:preferences.get().inputMethod,briefingMode:briefingPreferences.getMode(),steering:state.steering,mode:state.mode,courseId:state.course.id});}
  function show(next,data={}){step=next;settings();ui.show(next,data);}
  function cancel(){
    if(countdownSession!==null)actions.countdownAudio?.({type:'cancel',session:countdownSession});
    countdownSession=null;token++;clearTimeout(timer);timer=null;if(step==='title')show('title',{loading:false,disabled:false});
  }
  function courses(){cancel();ui.setCourses(actions.courseCards());show('courses',{selectedCourseId:read().course.id,camera:read().camera,playMode:read().mode});}
  function pose(message='楽な持ち方で構えて、ボタンを押してください。',error=''){
    show('pose',{title:'構える',description:message,message,note:preferences.get().inputMethod==='practice'?'画面の操作で飛行します。':'この持ち方を操作の中立にします。',error,disabled:false,loading:false,inputMethod:preferences.get().inputMethod});
    pwa.showOrientationNotice?.();
  }
  function openMap(origin){
    show('briefing');if(origin==='start'){briefing.shown=true;briefingPreferences.markShown(read().course);}
    map.open({course:read().course,state:origin==='pause'?read().state:null,origin});
  }
  function beginFresh({preserveSession=false,retry=false}={}){
    cancel();resultData={};if(actions.prepareFresh({preserveSession})===false)return;fresh=true;briefing={shown:false,skipped:false,seconds:0,revisits:[]};
    if(retry||record.snapshot()?.flightStartedAt!=null){record.begin(now(),{firstTime:false,tutorialShown:false,entrySource:retry?'retry':'course'});record.fullscreen(pwa.report());}
    if(briefingPreferences.shouldShow(read().course))openMap('start');else pose();
  }
  function startCountdown(mode,reason){
    if(read().phase==='running')return;
    if(countdownSession!==null&&step==='countdown')return;
    cancel();const generation=token;
    if(!fresh){actions.launch(mode,reason);return;}
    countdownSession=generation;actions.ready();
    const begin=()=>{
      if(generation!==token)return;if(document.hidden){cancel();return;}
      const snapshot=record.snapshot()??{};
      const plan=startCountdownPlan({now:now(),fullscreenSucceeded:snapshot.fullscreenSucceeded,fullscreenSucceededAt:snapshot.fullscreenSucceededAt});record.countdown(plan);
      const countdown=()=>{
        if(generation!==token)return;if(document.hidden){cancel();return;}
        let number=3;show('countdown',{number});actions.countdownAudio?.({type:'tick',session:generation,number});
        const tick=()=>{
          if(generation!==token)return;if(document.hidden){cancel();return;}
          number--;if(number>0){show('countdown',{number});actions.countdownAudio?.({type:'tick',session:generation,number});timer=setTimeout(tick,1000);}
          else if(pwa.canResume()){if(actions.launch(mode,reason)===false){cancel();pose('開始できませんでした。画面の向きを確認して、もう一度構えてください。');}}
          else {cancel();pose('画面の向きを確認して、もう一度構えてください。');}
        };
        timer=setTimeout(tick,1000);
      };
      if(plan.waitMilliseconds>0){show('countdown',{number:'…'});timer=setTimeout(countdown,plan.waitMilliseconds);}else countdown();
    };
    const preparing=actions.countdownAudio?.({type:'prepare',session:generation});
    if(preparing&&typeof preparing.then==='function'){
      show('countdown',{number:'…'});
      void preparing.then(value=>{if(generation===token){countdownAudioPreparation=value??null;begin();}},()=>{if(generation===token)begin();});
    }else {countdownAudioPreparation=preparing??null;begin();}
  }
  async function action(name,value){
    switch(name){
      case 'start':{
        cancel();const generation=token,firstTime=!preferences.get().tutorialSeen;
        show('title',{loading:true,disabled:true});
        record.begin(now(),{tutorialShown:firstTime,firstTime});
        const request=pwa.requestFullscreen({source:'title'});record.fullscreen(pwa.report());await request;
        if(generation!==token||document.hidden)return;record.fullscreen(pwa.report());
        if(firstTime){tutorialIndex=0;tutorialFrom='first';show('tutorial',{slide:0,index:0});}else courses();break;
      }
      case 'help':cancel();helpReturn=step==='pause'?'pause':'title';tutorialIndex=0;tutorialFrom='help';show('tutorial',{slide:0,index:0});break;
      case 'tutorial-next':
        if(tutorialIndex<2){tutorialIndex++;show('tutorial',{slide:tutorialIndex,index:tutorialIndex});}
        else{preferences.markTutorialSeen();tutorialFrom==='help'?show(helpReturn,{description:read().pauseReason}):courses();}break;
      case 'tutorial-back':tutorialIndex=Math.max(0,tutorialIndex-1);show('tutorial',{slide:tutorialIndex,index:tutorialIndex});break;
      case 'tutorial-skip':preferences.markTutorialSeen();tutorialFrom==='help'?show(helpReturn,{description:read().pauseReason}):courses();break;
      case 'course-select':actions.selectCourse(value);courses();break;
      case 'course-start':beginFresh();break;
      case 'camera-select':actions.setCamera(value);preferences.setCamera(read().camera);settings();break;
      case 'camera-cycle':actions.setCamera(nextCameraMode(read().camera));preferences.setCamera(read().camera);settings();break;
      case 'input-method':preferences.setInputMethod(value);settings();break;
      case 'briefing-mode':briefingPreferences.setMode(value);settings();break;
      case 'hold':{
        const mode=preferences.get().inputMethod;show('pose',{loading:true,disabled:true,message:mode==='sensor'?'傾きと持ち方を確認しています。':'開始の準備をしています。',inputMethod:mode});
        if(!pwa.begin()){pose('画面の向きを戻してから、構えてください。');break;}
        void pwa.lockCurrentOrientation();actions.hold(mode);break;
      }
      case 'resume':{
        const generation=++token;actions.unlock?.();const request=pwa.requestFullscreen({source:'resume'});await request;
        if(generation!==token||document.hidden)return;
        if(fresh||preferences.get().inputMethod!==read().input){pose('持ち方を確認して、ボタンで再開してください。');break;}
        if(pwa.begin()){void pwa.lockCurrentOrientation();actions.hold(preferences.get().inputMethod);}break;
      }
      case 'recenter':cancel();pose('楽な持ち方に合わせ直して、ボタンを押してください。');break;
      case 'map':cancel();openMap('pause');break;
      case 'settings':returnStep=step;cancel();if(['waiting','ready','error'].includes(read().phase))actions.cancelPending(fresh);actions.openSettings();show('settings');break;
      case 'settings-close':actions.closeSettings();if(returnStep==='courses')courses();else if(returnStep==='pose')pose();else if(returnStep==='pause')show('pause',{description:read().pauseReason});else if(returnStep==='result')show('result',resultData);else show('title');break;
      case 'retry':beginFresh({preserveSession:read().state.grounded,retry:true});break;
      case 'course-exit':if(read().phase==='complete'||read().state.grounded){actions.endFlight();courses();}else show('confirm-exit');break;
      case 'confirm-exit':case 'confirm-course-exit':cancel();actions.endFlight();courses();break;
      case 'cancel-exit':case 'confirm-cancel':show('pause',{description:read().pauseReason});break;
      case 'copy':actions.copyResult();break;
      case 'mode-select':actions.selectMode(value);settings();break;
      case 'title':case 'back':cancel();actions.cancelPending(fresh);show('title');break;
      case 'courses':cancel();actions.cancelPending(fresh);if(!fresh&&read().input)show('confirm-exit');else courses();break;
      case 'countdown-cancel':cancel();actions.cancelPending(fresh);pose();break;
    }
  }
  return {
    action,settings,showTitle:()=>show('title'),showCourses:courses,poseReady:startCountdown,
    onRunning(){
      if(fresh&&countdownSession!==null){actions.countdownAudio?.({type:'go',session:countdownSession});countdownSession=null;}
      fresh=false;record.start(now());show('play');
    },
    paused(message){cancel();show('pause',{description:message,inputMethod:preferences.get().inputMethod,camera:read().camera});},
    dialog(data){
      const state=read();
      if(state.phase==='paused'){show('pause',{description:data.description,inputMethod:preferences.get().inputMethod,camera:state.camera});return;}
      if(['waiting','ready','error'].includes(state.phase)){
        if(step==='countdown'&&state.phase==='ready')return;
        show('pose',{title:data.title,message:data.error||data.description,description:data.description,error:data.error,loading:state.phase==='waiting',disabled:state.phase==='waiting',inputMethod:preferences.get().inputMethod});
      }
    },
    result(data={}){resultData={...data};cancel();show('result',resultData);},
    mapClosed(info){if(info.origin==='start'){briefing={...briefing,...info,shown:true};pose();}else{briefing.revisits.push(info);show('pause',{description:read().pauseReason});}},
    snapshot:()=>({step,fresh,startup:record.snapshot(),briefing:structuredClone(briefing),countdownAudio:countdownAudioPreparation?{...countdownAudioPreparation}:null}),
    cancel,
    dispose(){cancel();map.dispose();ui.hide();},
  };
}
