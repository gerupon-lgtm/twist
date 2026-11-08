export const START_PREFERENCES_KEY='twist.start-flow.v1';
export const START_COUNTDOWN_SECONDS=3;
export const MIN_FULLSCREEN_LEAD_SECONDS=6;
export const CAMERA_MODES=Object.freeze(['overlay','chase','cockpit']);
const camera=value=>CAMERA_MODES.includes(value)?value:'overlay';
export const nextCameraMode=value=>CAMERA_MODES[(CAMERA_MODES.indexOf(camera(value))+1)%CAMERA_MODES.length];

/** New UI preferences never rewrite the existing flight/audio/course stores. */
export function createStartPreferences(storage){
  let raw;try{raw=JSON.parse(storage?.getItem(START_PREFERENCES_KEY)??'null');}catch{}
  let value={tutorialSeen:raw?.tutorialSeen===true,camera:camera(raw?.camera),inputMethod:raw?.inputMethod==='practice'?'practice':'sensor'};
  let saved=null;
  function update(patch){value={...value,...patch};try{if(!storage)throw Error('No storage');storage.setItem(START_PREFERENCES_KEY,JSON.stringify(value));saved=true;}catch{saved=false;}return {...value};}
  return {get:()=>({...value}),saved:()=>saved,markTutorialSeen:()=>update({tutorialSeen:true}),setCamera:next=>update({camera:camera(next)}),setInputMethod:next=>update({inputMethod:next==='practice'?'practice':'sensor'})};
}

/** Keep the native fullscreen hint ahead of flight; viewing menus may use it up. */
export function startCountdownPlan({now=0,fullscreenSucceededAt=0,fullscreenSucceeded=false,countdownSeconds=START_COUNTDOWN_SECONDS}={}){
  const seconds=Number.isFinite(countdownSeconds)?Math.max(0,countdownSeconds):START_COUNTDOWN_SECONDS;
  const clock=Number.isFinite(now)?now:0,entered=Number.isFinite(fullscreenSucceededAt)?fullscreenSucceededAt:0;
  const waitMilliseconds=fullscreenSucceeded?Math.max(0,entered+MIN_FULLSCREEN_LEAD_SECONDS*1000-clock-seconds*1000):0;
  return {waitMilliseconds,countdownSeconds:seconds,totalMilliseconds:waitMilliseconds+seconds*1000};
}

export function createStartRecord(){
  let record=null;
  const snapshot=()=>record?structuredClone(record):null;
  return {
    begin(now,{tutorialShown=false,firstTime=false,entrySource='title'}={}){
      const source=['title','retry','course'].includes(entrySource)?entrySource:'title';
      record={entrySource:source,entryAt:now,entryToFlightSeconds:null,titleAt:source==='title'?now:null,tutorialShown:Boolean(tutorialShown),firstTime:Boolean(firstTime),fullscreenRequested:false,fullscreenSucceeded:false,fullscreenSource:'other',fullscreenRequestedAt:0,fullscreenSucceededAt:0,countdown:false,countdownSeconds:0,startWaitSeconds:0,flightStartedAt:null,titleToFlightSeconds:null,fullscreenToFlightSeconds:null};return snapshot();
    },
    tutorial({shown,firstTime}={}){if(record){if(shown!==undefined)record.tutorialShown=Boolean(shown);if(firstTime!==undefined)record.firstTime=Boolean(firstTime);}},
    fullscreen(report){if(record&&report){for(const key of ['fullscreenRequested','fullscreenSucceeded','fullscreenSource','fullscreenRequestedAt','fullscreenSucceededAt'])if(report[key]!==undefined)record[key]=report[key];}},
    countdown(plan){if(record){record.countdown=true;record.countdownSeconds=plan.countdownSeconds;record.startWaitSeconds=plan.waitMilliseconds/1000;}},
    start(now){if(record&&record.flightStartedAt===null){record.flightStartedAt=now;record.entryToFlightSeconds=Math.max(0,(now-record.entryAt)/1000);record.titleToFlightSeconds=Number.isFinite(record.titleAt)?Math.max(0,(now-record.titleAt)/1000):null;record.fullscreenToFlightSeconds=record.fullscreenSucceeded?Math.max(0,(now-record.fullscreenSucceededAt)/1000):null;}return snapshot();},
    snapshot,
  };
}
