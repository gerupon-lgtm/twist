import {courseFlightMetadata} from './course-flight-profile.js';
import './afterburner.css';
import {createThrottleControl} from './throttle-control.js';
import {updateAfterburnerPanel} from './afterburner-panel.js';
import {createAfterburnerSession} from './afterburner-session.js';
import {convertSpeed,normalizeSpeedUnit} from './speed-units.js';
import './style.css';
import './guidance.css';
import './boundary.css';
import './speedfeel-results.css';
import './essential-hud.css';
import {updateEssentialHud} from './essential-hud.js';
import './instrument-hud.css';
import {createInstrumentHud} from './instrument-hud.js';
import {updateSharedFlightHud} from './shared-flight-hud.js';
import {viewportInsets} from './viewport-insets.js';
import {getCourse,COURSE_CRITERIA,NORMAL_COURSE_IDS,ORDINARY_COURSE_IDS,PLAYABLE_COURSE_IDS,isSupersonicCourse} from './course-catalog.js';
import {courseStageDimensions,courseRecordMetadata,courseRadarRange} from './course-world-profile.js';
import {SIERRA_COURSE_ID,withSierraSegmentLabels} from './courses/sierra50.js';
import {SIERRA10_COURSE_ID} from './courses/sierra10.js';
import {createSupersonicStage} from './supersonic/stage.js';
import {createSupersonicProfile} from './supersonic/profile.js';
import {supersonicIntent} from './supersonic/intent.js';
import {loadSupersonicSettings} from './supersonic/settings.js';
import {supersonicSummary,supersonicBestKey} from './supersonic/records.js';
import {createSupersonicBestStore} from './supersonic-bests.js';
import {createSupersonicActivity} from './supersonic-activity.js';
import {createSupersonicPanel,formatSupersonicAltitude} from './supersonic-panel.js';
import {formatNavigationDistance} from './supersonic-units.js';
import {loadCourseChoice,saveCourseChoice} from './course-choice.js';
import {STAGE_HALF_EXTENT} from './boundary.js';
import {updateBoundaryPanel} from './boundary-panel.js';
import {updateGuidancePanel} from './guidance-panel.js';
import { Quaternion, MathUtils } from 'three';
import { CONTROL_LIMITS, orientationQuaternion, relativeAngles, compensationQuaternion, projectedTiltAngles, deviceTiltAngles, composeDevicePose, controlRates, advanceSpeed } from './controls.js';
import { createStage } from './stage.js';
import { projectEdgeTarget, normalizeVisibility } from './visibility.js';
import { updateRadar, avoidRadarMarker } from './radar-panel.js';
import { getGroundProximity } from './ground-proximity.js';
import { APP_VERSION } from './version.js';
import { flightCommands } from './flight-input.js';
import { createFlightPanel } from './flight-panel.js';
import { createFlightSession } from './flight-session.js';
import { normalizeCameraMode } from './flight-camera.js';
import { layoutCockpitHud, updateCockpitHud } from './cockpit-hud.js';
import { updateTargetHeightPanel } from './target-height-panel.js';
import { createRangeEditor } from './range-editor.js';
import { preserveTiltInput } from './controls.js';
import {createWristReference,readWristAngles} from './wrist-controls.js';
import {readSteeringChoice,saveSteeringChoice,createWristRecord,preserveWristPose} from './wrist-input.js';
import { createRouteTiming } from './route-timing.js';
import {createApproachRecords} from './approach-records.js';
import {createStraightRecords} from './straight-records.js';
import {createPassByTracker} from './passby-events.js';
import {createCourseBestStore,courseBestKey} from './course-bests.js';
import {formatCourseTime} from './course-bests.js';
import {createStartPreferences,createStartRecord} from './start-flow-state.js';
import {advanceFrameClock} from './frame-clock.js';
import {createStartFlowController} from './start-flow-controller.js';
import {createStartFlowPanel} from './start-flow-panel.js';
import {createBriefingPreferences} from './briefing-preferences.js';
import {createBriefingPanel} from './briefing-panel.js';
import {createCoursePreviewSVG} from './briefing-model.js';
import {radarUpgradeOffer} from './radar-upgrade.js';
import { exitCenterVisible } from './exit-visibility.js';
import { layoutCockpitObjective,updateCockpitObjective } from './cockpit-objective-panel.js';
import { createFeedbackController } from './feedback/controller.js';
import { createPwaController } from './pwa.js';
import { normalizeHudLanguage, hudText, hudTargetLabel, hudHeightDelta, hudDirectionText, hudGroundWarning, hudStatusLabel, hudObjectiveText, hudCollectedNotice } from './hud-text.js';
import './button-theme.css';

const $ = (id) => document.getElementById(id);
const app = $('app');
const canvas = $('world');
let stage;
let courseStorage;try{courseStorage=localStorage;}catch{}
const flowParameters=new URLSearchParams(location.search);
const flowEnabled=!(flowParameters.get('dev')==='1'&&flowParameters.get('flow')==='legacy');
const flowDev=flowParameters.get('dev')==='1';
const startPreferences=createStartPreferences(courseStorage),startRecord=createStartRecord();
const briefingPreferences=createBriefingPreferences(courseStorage);
let flowUI=null,flowCoordinator=null,briefingUI=null,flowPermissionAwaiting=false;
app.dataset.startFlow=flowEnabled?'on':'legacy';
let selectedCourse=getCourse(loadCourseChoice(courseStorage,location.search));
let phase = 'intro';
let playMode = flowEnabled ? flowDev&&flowParameters.get('mode')==='explore'?'explore':'flight' : flowParameters.get('mode')==='flight'?'flight':'explore';
if(playMode==='explore'&&isSupersonicCourse(selectedCourse))selectedCourse=getCourse('easy');
let visibility = normalizeVisibility(new URLSearchParams(location.search).get('view'));
// URL names stay compatible: tilt = ひねる (raise/lower phone sides), twist = 回す (in-plane turn).
const steeringChoice=readSteeringChoice(courseStorage,flowParameters.get('steer'));
let flightSteering = steeringChoice.mode;
let wristReference=null;const wristRecord=createWristRecord();
let pitchMode = new URLSearchParams(location.search).get('pitch') === 'rate' ? 'rate' : 'angle';
let flightDisplay = new URLSearchParams(location.search).get('display') === 'fixed' ? 'fixed' : 'bank';
let cameraMode = normalizeCameraMode(flowParameters.has('camera')?flowParameters.get('camera'):flowEnabled?startPreferences.get().camera:'overlay');
const flightSession = createFlightSession();
const afterburnerSession=createAfterburnerSession();
const routeTiming=createRouteTiming(selectedCourse.lights.length);
const approaches=createApproachRecords(selectedCourse.lights.length),straights=createStraightRecords(selectedCourse.abStraights),passbys=createPassByTracker();
const courseBests=createCourseBestStore(courseStorage);let courseTime=null,radarOffer=radarUpgradeOffer(courseStorage);
const sonicBests=createSupersonicBestStore(courseStorage),sonicActivity=createSupersonicActivity();
let sonicPanel=null,instrumentHud=null;
let passScenery=null,passTargetId=null,passCandidates=[];
const feedback = createFeedbackController();
const pwa = createPwaController({ getPhase: () => phase, pause, showDialog: dialog,allPlatforms:flowEnabled,isCountdownActive:()=>flowEnabled&&flowCoordinator?.snapshot().step==='countdown' });
let inputMode = null;
let inputHeld=false,lastPauseReason='',exitNoticeUntil=0,activeFrameAt=0;
const inputTransitions=[];
function sonicMode(){return playMode==='flight'&&isSupersonicCourse(selectedCourse);}
function sierra10Mode(){return selectedCourse.id===SIERRA10_COURSE_ID;}
function effectivePitchMode(){return sonicMode()?'angle':pitchMode;}
function currentSonicProfile(state=stage?.getStatus()){return createSupersonicProfile(state?.supersonic?.effectiveSettings??sonicPanel?.getSettings()??loadSupersonicSettings(courseStorage),selectedCourse);}
function sonicBestKey(){return supersonicBestKey(currentSonicProfile(),selectedCourse);}
function recordedSegments(){
  if(sonicMode()){
    const rows=stage?.getStatus().supersonic?.gateResults??[];
    return withSierraSegmentLabels(selectedCourse.gates.map((gate,index)=>({id:gate.id,index,label:index===0?'開始→門1':gate.kind==='exit'?`門${index}→出口`:`門${index}→門${index+1}`,
      seconds:rows[index]?.segmentSeconds??null,closestDistance:rows[index]?.minimumCenterDistance??null,nearMisses:rows[index]?.missCount??0,passedAtSeconds:rows[index]?.passedAtSeconds??null,afterburnerSeconds:rows[index]?.afterburnerSeconds??0,afterburnerFuel:rows[index]?.afterburnerFuel??0})),selectedCourse);
  }
  const records=approaches.snapshot(),rows=routeTiming.snapshot().map((segment,index)=>({...segment,...records[index]}));return withSierraSegmentLabels(rows,selectedCourse);
}
function courseTimeSnapshot(){
  if(courseTime)return {...courseTime};
  if(sonicMode()){const key=sonicBestKey();return {courseId:selectedCourse.id,courseKey:key,mode:'flight',seconds:null,bestSeconds:sonicBests.best(key),newBest:false,saved:null};}
  return {courseId:selectedCourse.id,courseKey:courseBestKey(selectedCourse,playMode),mode:playMode,seconds:null,bestSeconds:courseBests.best(selectedCourse,playMode),newBest:false,saved:null};
}
function sonicReport(){
  const state=stage?.getStatus();if(!sonicMode()||!state?.supersonic)return null;
  return {...supersonicSummary(state.supersonic,sonicActivity.snapshot()),configuredSettings:sierra10Mode()?currentSonicProfile().effectiveSettings:sonicPanel?.getSettings(),renderOrigin:state.supersonic.renderDiagnostics?.origin,renderDiagnostics:state.supersonic.renderDiagnostics,
    activityClockMeaning:{activeSeconds:'observed-running-frame-time-excluding-terminal-remainder',interruptedSeconds:'unprocessed-active-time-not-menu-or-pause-duration'}};
}
function stageDimensions(){return sonicMode()?{halfExtent:selectedCourse.arena.halfExtent,width:selectedCourse.arena.width,depth:selectedCourse.arena.depth,minHeight:0,maxHeight:selectedCourse.arena.maxAltitude}:courseStageDimensions(selectedCourse)??{halfExtent:STAGE_HALF_EXTENT,width:STAGE_HALF_EXTENT*2,depth:STAGE_HALF_EXTENT*2};}
const flightPanel = createFlightPanel(() => ({ pitch: effectivePitchMode(), steer: flightSteering, display: flightDisplay, camera: cameraMode, mode: playMode, view: visibility, feedback: feedback.report(), input: {basis:playMode==='flight'?(flightSteering==='wrist'?'estimated-forearm-world':'screen'):'craft',screenAngle:inputMode==='sensor'?(screen.orientation?.angle??window.orientation??0):0,current:inputMode,transitions:inputTransitions,held:inputHeld,lastPauseReason,...(playMode==='flight'&&flightSteering==='wrist'?{wrist:wristRecord.snapshot()}: {})}, segments:recordedSegments(), approaches:approaches.snapshot(),abStraights:straights.snapshot(),passbys:passbys.snapshot(),courseTime:courseTimeSnapshot(), exitDiscovery:routeTiming.exitSnapshot(), targetViews:routeTiming.targetViewsSnapshot(), course:{id:selectedCourse.id,name:selectedCourse.name,targetCount:selectedCourse.lights.length,...(playMode==='flight'&&courseFlightMetadata(selectedCourse)?{flightProfile:courseFlightMetadata(selectedCourse)}:{}),...(courseRecordMetadata(selectedCourse)?{geography:courseRecordMetadata(selectedCourse),radarRange:courseRadarRange(selectedCourse)}:{})}, stageSize:stageDimensions(), ...(playMode==='flight'?{afterburner:{...afterburnerSession.snapshot(),remainingFuel:stage?.getStatus().afterburner?.fuel??0,lastLeg:afterburnerSession.lastLegSnapshot()}}:{}), ...(flowEnabled?{startup:startRecord.snapshot(),briefing:flowCoordinator?.snapshot().briefing}:{}),...(sonicMode()?{supersonic:sonicReport()}:{}),...pwa.report() }));
sonicPanel=createSupersonicPanel({storage:courseStorage,settingsHost:$('flight-settings-fields'),onChange:()=>{lastHudAt=0;if(stage)updateHud(performance.now(),stage.getStatus());}});
if(flowEnabled)instrumentHud=createInstrumentHud();
function makeStage(){
  return sonicMode()?createSupersonicStage(canvas,{visibility,display:flightDisplay,cameraMode,course:selectedCourse,supersonicSettings:sonicPanel.getSettings()})
    :createStage(canvas,{visibility,display:flightDisplay,cameraMode,course:selectedCourse,turnGravity:flightPanel.getSettings().turnGravity});
}
const radarNotice=$('radar-upgrade-notice'),radarAdjustments=$('flight-adjustments');let radarOfferSeen=false;
$('setting-radarRange').closest('label').after(radarNotice);
function resetRouteRecords(){wristRecord.reset();routeTiming.reset(selectedCourse.lights.length);approaches.reset(selectedCourse.lights.length);straights.reset(selectedCourse.abStraights);passbys.reset();courseTime=null;passScenery=null;passTargetId=null;passCandidates=[];}
function resetRoute(){
  if(sonicMode()){stage.reset({supersonicSettings:sonicPanel.getSettings()});sonicActivity.begin(stage.getStatus().supersonic);}else stage.reset();
  afterburnerSession.beginLeg();resetRouteRecords();exitNoticeUntil=0;
}
function passObjects(state){
  const scenery=stage.getPassObjects(),targetId=state.collected<state.total?`target-${selectedCourse.id}-${state.collected+1}`:null;
  if(scenery!==passScenery||targetId!==passTargetId){passScenery=scenery;passTargetId=targetId;passCandidates=targetId?[...scenery,{id:targetId,position:{...state.targetPosition},radius:state.targetRadius}]:scenery;}
  return passCandidates;
}
function renderRadarUpgrade(){
  const open=!sonicMode()&&phase==='paused'&&!radarAdjustments.hidden&&radarAdjustments.open;
  if(radarOffer&&(!open&&radarOfferSeen||flightPanel.getSettings().radarRange!==radarOffer.current))radarOffer=null;
  radarNotice.hidden=!(radarOffer&&open);
}
function markRadarOfferShown(){if(radarOffer&&phase==='paused'&&radarAdjustments.open&&!radarNotice.hidden){radarOffer.shown();radarOfferSeen=true;}}
if(typeof IntersectionObserver==='function'){
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.8))markRadarOfferShown();},{threshold:.8});
  observer.observe(radarNotice.querySelector('p'));
}else{
  const visible=()=>{const r=radarNotice.querySelector('p').getBoundingClientRect(),v=$('veil').getBoundingClientRect();if(r.height>0&&r.top>=Math.max(0,v.top)&&r.bottom<=Math.min(innerHeight,v.bottom)&&r.left>=Math.max(0,v.left)&&r.right<=Math.min(innerWidth,v.right))markRadarOfferShown();};
  $('veil').addEventListener('scroll',visible,{passive:true});window.addEventListener('resize',visible);radarAdjustments.addEventListener('toggle',()=>requestAnimationFrame(visible));
}
radarAdjustments.addEventListener('toggle',renderRadarUpgrade);$('setting-radarRange').addEventListener('input',renderRadarUpgrade);
$('radar-upgrade-accept').addEventListener('click',()=>{if(!radarOffer||phase!=='paused'||!radarAdjustments.open)return;markRadarOfferShown();flightPanel.setSetting('radarRange',radarOffer.next);radarOffer=null;renderRadarUpgrade();});
$('radar-upgrade-keep').addEventListener('click',()=>{if(!radarOffer||phase!=='paused'||!radarAdjustments.open)return;markRadarOfferShown();radarOffer=null;renderRadarUpgrade();});
function setInputMode(next,reason) {
  if(inputMode!==next){inputTransitions.push({from:inputMode,to:next,reason,phase,at:new Date().toISOString()});if(inputTransitions.length>8)inputTransitions.shift();}
  inputMode=next;app.dataset.input=next??'';
}
let reference = null;
let craftReference = null;
let referenceScreenAngle = 0;
let latestQuaternion = null;
let latestInputQuaternion = null;
let latestOrientationSample = null;
let lastOrientationAt = 0;
let sensorListening = false;
let permissionAttempt = 0;
let platformStartAttempt = 0;
let waitingTimer = null;
let pendingCalibration = false;
let wakeLock = null;
let angles = { pitch: 0, steer: 0, twist: 0 };
let rates = { pitchRate: 0, yawRate: 0, bankAngle: 0, acceleration: 0, brake: 0 };
let speed = 0;
let throttle = 0;
let manualAfterburner=false;
let throttleControl=null;
const craftQuaternion = new Quaternion();
const neutralQuaternion = new Quaternion();
const practiceAngles = { pitch: 0, steer: 0, twist: 0 };
const heldKeys = new Set();
let keyboardActive = false;
let keyboardTwistBase = 0;
let previousCollected = 0;
let toastUntil = 0;
let lastFlightSnapshot = null;
const screenAngle = () => screen.orientation?.angle ?? window.orientation ?? 0;
const controls = ['pitch', 'steer', 'twist'];

function panelPhase(next=phase){return flowEnabled&&flowCoordinator?.snapshot().step==='settings'?'paused':next;}
function setPhase(next) {
  phase = next;
  if(next!=='running')$('flight-essential-hud').hidden=true;
  app.dataset.phase = next;
  flightPanel.setPhase(panelPhase(next), playMode);
  $('pause-button').disabled = next !== 'running';
  $('recenter-button').disabled = next !== 'running';
  $('recenter-button').textContent=inputMode==='practice'?'スマホの傾きに切替':'持ち方を合わせ直す';
  $('veil').hidden = next === 'running';
  for (const mode of ['explore', 'flight']) $(`mode-${mode}`).disabled = ['waiting', 'ready', 'running'].includes(next);
  $('throttle-input').disabled = next !== 'running' || playMode !== 'flight';
  for (const display of ['bank', 'fixed']) $(`display-${display}`).disabled = ['waiting', 'ready'].includes(next);
  for (const value of ['overlay','chase','cockpit']) $(`camera-${value}`).disabled = ['waiting','ready'].includes(next);
  for (const view of ['assisted', 'classic']) $(`view-${view}`).disabled = ['waiting', 'ready'].includes(next);
  for (const pitch of ['angle', 'rate']) $(`pitch-${pitch}`).disabled = ['waiting', 'ready', 'running'].includes(next);
  for (const steering of ['twist', 'tilt', 'wrist']) $(`steering-${steering}`).disabled = ['waiting', 'ready', 'running'].includes(next);
  $('course-select').disabled=['waiting','ready','running'].includes(next);
  pwa.render();
  renderRadarUpgrade();
}

const modeNote = () => sierra10Mode()?'角度方式で操縦します。出力50%・150m/sで出発。ABは300m/sまで、9Gの旋回と有限の燃料ゲージを使います。':sonicMode()?'角度方式で操縦します。出力50%・200m/sで出発し、右端の先へ出力を動かすとAB。再開は慣性を保ちます。':playMode === 'flight'
  ? (effectivePitchMode() === 'angle' ? '中立で機首も水平へ戻ります。上昇で減速、下降で加速。出力50%で出発します。' : '中立でも機首の角度は残ります。逆へ倒して水平へ戻し、出力を上げて失速から復帰。')
  : `先端側の傾き${CONTROL_LIMITS.throttleMaximum}°で加減速が最大。中立で速度を保ちます。`;
const lightColor = () => visibility === 'assisted' ? 'ピンクの' : '金色の';
const modeIntroduction = () => sierra10Mode()?'シエラ縦断を1/10の縮尺で。A〜Fの門を順にくぐり、Gの出口へ。地面は平らで、音速は超えません。':sonicMode()?'40km四方の高速空域。5枚の門を順番にくぐり、最後の出口へ。ABを使って音速を超える試作です。':playMode === 'flight'
  ? `${flightPanel.getSettings().flightDirector ? '白い進行方向の印を輪へ近づけます。重なると輪が緑になります。' : flightDisplay === 'fixed' ? '自機の上向きを保ち、景色が回ります。' : '自機は画面内の定位置。右へ曲がると機体も右へ傾きます。'}${lightColor()}光を${selectedCourse.lights.length}つ集めて出口へ。`
  : `自機はスマホと一緒に傾かず、最初の上向きを保ちます。${lightColor()}光を${selectedCourse.lights.length}つ集めて出口へ。`;

function setThrottle(value) {
  throttle = Number.isFinite(value) ? MathUtils.clamp(value, 0, 1.2) : 0;
  if(throttle>=1.1)manualAfterburner=true;else if(throttle<=1)manualAfterburner=false;
  $('throttle-input').value = String(Math.round(throttle * 100));
  $('throttle-value').textContent = manualAfterburner?'100% AB':`${Math.round(Math.min(1,throttle) * 100)}%`;
  throttleControl?.sync(throttle);
}

function applyVisibilityUI() {
  const assisted = visibility === 'assisted';
  if (phase === 'intro') $('dialog-description').textContent = modeIntroduction();
  app.dataset.visibility = visibility;
  app.dataset.display = flightDisplay;
  app.dataset.camera = playMode === 'flight' ? cameraMode : 'overlay';
  for (const value of ['overlay','chase','cockpit']) $(`camera-${value}`).setAttribute('aria-pressed',String(cameraMode === value));
  $('camera-note').textContent = { overlay:'今までの景色と上向きの自機。',chase:'立体機を後ろから少し遅れて追います。',cockpit:'操縦席から見る。地面の近さは高度と警告で確認。' }[cameraMode];
  $('display-bank').setAttribute('aria-pressed', String(flightDisplay === 'bank'));
  $('display-fixed').setAttribute('aria-pressed', String(flightDisplay === 'fixed'));
  $('display-note').textContent = flightDisplay === 'fixed' ? '面内回転を打ち消す。地平線で翼の傾きを表示。' : '機体を旋回側へ傾ける、今までの表示。';
  $('play-mode-label').textContent = `${playMode === 'flight' ? '飛行機' : '探索'}・${assisted ? '対策' : '従来'}`;
  $('view-assisted').setAttribute('aria-pressed', String(assisted));
  $('view-classic').setAttribute('aria-pressed', String(!assisted));
  $('view-note').textContent = assisted ? 'レーダー、ピンクの光と白い輪、画面端の目標マーク。' : '従来の視野と景色。同じ位置で見え方を比べられます。';
  $('home-link').href = `./?mode=${playMode}&view=${visibility}&steer=${flightSteering}&pitch=${pitchMode}&display=${flightDisplay}&camera=${cameraMode}&course=${selectedCourse.id}&music=${feedback.report().settings.musicSet}&v=${APP_VERSION}`;
}

function selectVisibility(next) {
  if (!stage || next === visibility || !['assisted', 'classic'].includes(next) || ['waiting', 'ready'].includes(phase)) return;
  visibility = next;
  stage.setVisibility(visibility);
  applyVisibilityUI();
  flightPanel.refreshLayout();
  const url = new URL(location.href);
  url.searchParams.set('view', visibility);
  url.searchParams.set('steer', flightSteering);
  url.searchParams.set('pitch', pitchMode);
  url.searchParams.set('display', flightDisplay);
  url.searchParams.set('v', APP_VERSION);
  history.replaceState(null, '', url);
}
$('view-assisted').addEventListener('click', () => selectVisibility('assisted'));
$('view-classic').addEventListener('click', () => selectVisibility('classic'));

function selectDisplay(next) {
  if (!stage || next === flightDisplay || !['bank', 'fixed'].includes(next) || ['waiting', 'ready'].includes(phase)) return;
  flightDisplay = next;
  stage.setDisplay(next);
  applyVisibilityUI();
  flightPanel.refreshLayout();
  if (phase === 'intro') $('dialog-description').textContent = modeIntroduction();
  const url = new URL(location.href);
  url.searchParams.set('display', flightDisplay);
  url.searchParams.set('v', APP_VERSION);
  history.replaceState(null, '', url);
}
$('display-bank').addEventListener('click', () => selectDisplay('bank'));
$('display-fixed').addEventListener('click', () => selectDisplay('fixed'));

function selectCamera(next) {
  if (!stage || ['waiting','ready'].includes(phase) || next === cameraMode) return;
  if(flowEnabled&&flowCoordinator?.snapshot().step!=='courses'&&(next==='overlay'||cameraMode==='overlay'))return;
  cameraMode = normalizeCameraMode(next);
  stage.setCameraMode(cameraMode);
  applyVisibilityUI(); flightPanel.setPhase(panelPhase(),playMode);
  const url = new URL(location.href);
  url.searchParams.set('camera',cameraMode); url.searchParams.set('v',APP_VERSION);
  history.replaceState(null,'',url);
}
for (const value of ['overlay','chase','cockpit']) $(`camera-${value}`).addEventListener('click',()=>{selectCamera(value);if(flowEnabled){startPreferences.setCamera(cameraMode);flowCoordinator?.settings();}});

function applyCourseUI(){
  const select=$('course-select');
  if(!select.querySelector('option[value="sierra50"]')){const option=document.createElement('option');option.value=SIERRA_COURSE_ID;option.textContent=getCourse(SIERRA_COURSE_ID).name;select.append(option);}
  if(playMode==='flight'&&!select.querySelector('option[value="supersonic"]')){const option=document.createElement('option');option.value='supersonic';option.textContent='高速空域（試作）';select.append(option);}
  const sonicOption=select.querySelector('option[value="supersonic"]');if(sonicOption){sonicOption.hidden=playMode!=='flight';sonicOption.disabled=playMode!=='flight';}
  if(!select.querySelector('option[value="sierra10"]')){const option=document.createElement('option');option.value=SIERRA10_COURSE_ID;option.textContent=getCourse(SIERRA10_COURSE_ID).name;select.append(option);}
  const lowOption=select.querySelector('option[value="sierra10"]');lowOption.hidden=playMode!=='flight';lowOption.disabled=playMode!=='flight';
  const sierraOption=select.querySelector('option[value="sierra50"]');
  if(sonicOption&&sonicOption.nextElementSibling!==sierraOption)select.insertBefore(sonicOption,sierraOption);
  if(selectedCourse.id==='legacy'&&!select.querySelector('option[value="legacy"]')){
    const option=document.createElement('option');option.value='legacy';option.hidden=true;option.textContent='比較用（旧配置）';select.append(option);
  }
  select.value=selectedCourse.id;
  const range=COURSE_CRITERIA.difficulties?.[selectedCourse.id]?.cruiseTimeRange;
  $('course-note').textContent=sierra10Mode()?'推定座標1/10・門A〜F→出口G・150〜300m/s・最大9G':sonicMode()?'40km四方・門5枚＋出口・ABでM2を試す':selectedCourse.id===SIERRA_COURSE_ID?'推定座標1/50・光A〜F→出口G・レーダー1000m（コース用）':selectedCourse.id==='legacy'?'v0.1.25 比較用（旧配置）':`光${selectedCourse.lights.length}個${range?`・約${range[0]}〜${range[1]}秒`:''}`;
}
function applyModeUI() {
  applyCourseUI();
  const flight = playMode === 'flight';
  sonicPanel?.setCourse(selectedCourse);sonicPanel?.setActive(sonicMode());app.dataset.profile=sonicMode()?'supersonic':'normal';
  const twistSteering = flightSteering === 'twist',wristSteering=flightSteering === 'wrist';
  const basics = $('basic-controls'), guide = $('control-guide');
  if (flight) basics.append(guide);
  else basics.before(guide);
  basics.hidden = !flight || guide.hidden;
  for (const axis of ['pitch', 'steer']) {
    $(`practice-${axis}`).min = flight ? (wristSteering&&axis==='steer'?'-40':'-30') : '-25';
    $(`practice-${axis}`).max = flight ? (wristSteering&&axis==='steer'?'40':'30') : '25';
  }
  if (phase === 'intro') $('dialog-description').textContent = modeIntroduction();
  app.dataset.playMode = playMode;
  app.dataset.controlBasis = flight ? 'screen' : 'craft';
  app.dataset.flightSteering = flightSteering;
  app.dataset.pitchMode = effectivePitchMode();
  $('flight-pitch-picker').hidden = !flight||sonicMode();
  $('flight-display-picker').hidden = !flight;
  $('flight-camera-picker').hidden = !flight;
  $('basic-controls').open = !flight;
  $('pitch-angle').setAttribute('aria-pressed', String(effectivePitchMode() === 'angle'));
  $('pitch-rate').setAttribute('aria-pressed', String(effectivePitchMode() === 'rate'));
  $('pitch-note').textContent = effectivePitchMode() === 'angle' ? '中立へ戻すと、機首も水平へ' : '中立でも機首角度を保つ。逆へ倒して戻す';
  $('play-mode-label').textContent = flight ? '飛行機モード' : '探索モード';
  $('flight-attitude').hidden = !flight;
  $('flight-throttle').hidden = !flight;
  $('steer-control-meter').hidden = flight && twistSteering;
  $('twist-control-meter').hidden = flight && !twistSteering;
  $('pitch-label').textContent = flight ? '画面上辺の傾き' : '先端側の傾き';
  $('steer-label').textContent = flight ? (wristSteering?'手首の回転':'左右のひねり') : '自機の左右';
  $('twist-label').textContent = '左右に回す角度';
  $('flight-steering-picker').hidden = !flight;
  $('motion-explanation').hidden = !flight;
  $('steering-twist').setAttribute('aria-pressed', String(twistSteering));
  $('steering-tilt').setAttribute('aria-pressed', String(flightSteering === 'tilt'));
  $('steering-wrist').setAttribute('aria-pressed', String(wristSteering));
  $('steering-note').textContent = wristSteering ? '楽な持ち方で手首を回します。前腕の水平な向きはスマホから推定します。' : twistSteering
    ? 'スマホの面を保って回す。時計回りで右旋回。'
    : '右端・左端を上下にひねる。下げた側へ旋回。';
  $('practice-panel').open = !flight;
  $('practice-summary').hidden = false;
  $('mode-explore').setAttribute('aria-pressed', String(!flight));
  $('mode-flight').setAttribute('aria-pressed', String(flight));
  $('pitch-caption').textContent = flight ? (effectivePitchMode() === 'angle' ? '画面上辺で機首角度・中立で水平' : '画面上辺を起こすと機首上げ') : '先端側で加速・逆で制動';
  $('steer-caption').textContent = flight ? (wristSteering?'手首を回した側へ旋回':'下げた側へ旋回') : '下げた側へ曲がる';
  $('twist-caption').textContent = flight ? '右回しで右・左回しで左旋回' : '右回しで上・左回しで下';
  $('stop-hint').textContent = flight ? '停止は一時停止ボタン' : `加減速は${CONTROL_LIMITS.throttleMaximum}°で最大`;
  $('stop-hint').hidden = flight;
  $('ground-clearance').textContent = flight ? '地面まで' : '高さ';
  $('ground-height-meter').hidden = !flight;
  $('ground-warning-text').hidden = !flight;
  $('guide-pitch-title').textContent = flight ? '画面の上辺を起こす・倒す' : '自機の先端側へ倒す';
  $('guide-pitch-text').textContent = flight ? (effectivePitchMode() === 'angle' ? '起こすと上、倒すと下。中立で水平へ' : '起こすと機首上げ、前へ倒すと機首下げ') : '先端側で加速、逆側でブレーキ';
  $('guide-steer-title').textContent = flight ? (wristSteering ? '楽な持ち方で手首を回す' : twistSteering ? '面を保って左右に回す' : '左右の端を上下にひねる') : '自機の左右へ倒す';
  $('guide-steer-text').textContent = flight ? (wristSteering ? '手首を回した側へ旋回。戻すと翼が水平へ' : twistSteering ? '回した側へ旋回。戻すと翼が水平へ' : '下げた側へ旋回。戻すと翼が水平へ') : '下げた側へ曲がり続ける';
  $('guide-steer-glyph').textContent = flight && (twistSteering||wristSteering) ? '↻' : '↔';
  $('guide-steer-glyph').classList.toggle('twist-glyph', flight && (twistSteering||wristSteering));
  $('guide-steer-glyph').classList.toggle('steer-glyph', !flight || !(twistSteering||wristSteering));
  $('guide-twist-title').textContent = flight ? '画面下のスロットル' : 'スマホを左右に回して保つ';
  $('guide-twist-text').textContent = sierra10Mode()?'110%でAB点火・100%で解除。門の通過と低空で燃料を補充します。':sonicMode()?'110%でAB点火・100%へ戻すと解除。燃料は設定で無制限／ゲージを選べます。':flight ? '光・低空でAB補充／110%点火・100%解除' : '右回しで上、左回しで下へ曲がる';
  $('guide-third-glyph').textContent = flight ? '⇄' : '↻';
  $('guide-third-glyph').classList.toggle('twist-glyph', !flight);
  $('keyboard-guide').textContent = flight ? 'W・S 機首の上・下\nA・D 旋回 / Q・E 出力の弱・強' : 'W 加速 / S ブレーキ\nA・D 左右 / Q・E 下・上';
  $('practice-brake').textContent = flight ? '出力0%' : 'ブレーキ';
  $('dialog-note').textContent = modeNote();
  $('dialog-note').hidden = false;
  applyVisibilityUI();
}

function selectSteering(next) {
  if (!stage || !['twist', 'tilt', 'wrist'].includes(next) || ['waiting', 'ready', 'running'].includes(phase)) return;
  saveSteeringChoice(courseStorage,next);
  if(next===flightSteering)return;
  flightSteering = next;
  applyModeUI();
  flightPanel.setPhase(panelPhase(),playMode);
  const url = new URL(location.href);
  url.searchParams.set('steer', flightSteering);
  url.searchParams.set('pitch', pitchMode);
  url.searchParams.set('display', flightDisplay);
  url.searchParams.set('v', APP_VERSION);
  history.replaceState(null, '', url);
}
$('steering-twist').addEventListener('click', () => selectSteering('twist'));
$('steering-tilt').addEventListener('click', () => selectSteering('tilt'));
$('steering-wrist').addEventListener('click', () => selectSteering('wrist'));

function selectPitch(next) {
  if(sonicMode())return;
  if (!stage || next === pitchMode || !['angle', 'rate'].includes(next) || ['waiting', 'ready', 'running'].includes(phase)) return;
  pitchMode = next;
  applyModeUI();
  flightPanel.refreshLayout();
  const url = new URL(location.href);
  url.searchParams.set('pitch', pitchMode);
  url.searchParams.set('display', flightDisplay);
  url.searchParams.set('v', APP_VERSION);
  history.replaceState(null, '', url);
}
$('pitch-angle').addEventListener('click', () => selectPitch('angle'));
$('pitch-rate').addEventListener('click', () => selectPitch('rate'));

function selectMode(next) {
  if (!stage || next === playMode || ['waiting', 'ready', 'running'].includes(phase)) return;
  if(next==='explore'&&isSupersonicCourse(selectedCourse))selectCourse('easy');
  const resume = Boolean(inputMode) && phase !== 'error';
  permissionAttempt++;
  halt();
  pwa.clearOrientation();
  resetRoute();
  reference = null;
  previousCollected = 0;
  $('toast').hidden = true;
  playMode = next;
  flightSession.reset();afterburnerSession.reset();
  feedback.reset();
  flightPanel.showResult(null);
  flightPanel.setPhase(panelPhase(), playMode);
  applyModeUI();
  stage.update(0, { mode: playMode, speed: 0, craftQuaternion });
  const url = new URL(location.href);
  url.searchParams.set('mode', playMode);
  url.searchParams.set('view', visibility);
  url.searchParams.set('steer', flightSteering);
  url.searchParams.set('pitch', pitchMode);
  url.searchParams.set('display', flightDisplay);
  url.searchParams.set('v', APP_VERSION);
  history.replaceState(null, '', url);
  if (resume) {
    setPhase('paused');
    dialog({ title: `${playMode === 'flight' ? '飛行機' : '探索'}モードに切り替えました`, description: 'ステージを最初からにしました。持ち方を決めて始めましょう。', note: modeNote(), action: inputMode === 'sensor' ? 'この持ち方で再開する' : '画面操作を再開する', guide: true });
  } else {
    setInputMode(null,'mode-reset');
    setPhase('intro');
    dialog({ title: '自分はそのまま。世界を動かそう。', description: modeIntroduction(), note: modeNote(), action: 'スマホの傾きで始める', guide: true });
  }
}
function selectCourse(id){
  const next=getCourse(id);
  if(playMode==='explore'&&isSupersonicCourse(next))return;
  if(!stage||next.id===selectedCourse.id||['waiting','ready','running'].includes(phase))return;
  const resume=Boolean(inputMode)&&phase!=='error';
  permissionAttempt++;halt();pwa.clearOrientation();
  selectedCourse=next;saveCourseChoice(courseStorage,next.id);
  stage.dispose();
  try{stage=makeStage();if(sonicMode())sonicActivity.begin(stage.getStatus().supersonic);}
  catch(error){stage=null;setPhase('error');dialog({title:'コースを開けませんでした',description:'ページを再読み込みして、もう一度お試しください。',action:'再読み込みする',error:error.message});return;}
  reference=null;previousCollected=0;exitNoticeUntil=0;resetRouteRecords();flightSession.reset();afterburnerSession.reset();feedback.reset();
  $('toast').hidden=true;flightPanel.showResult(null);resize();stage.update(0,{mode:playMode,speed:0,craftQuaternion});
  const url=new URL(location.href);url.searchParams.set('course',next.id);url.searchParams.set('v',APP_VERSION);history.replaceState(null,'',url);
  applyModeUI();
  if(resume){setPhase('paused');dialog({title:'コースを変更しました',description:sonicMode()?modeIntroduction():`${next.name}。光${next.lights.length}個を集めて出口へ。最初から始めます。`,note:modeNote(),action:inputMode==='sensor'?'この持ち方で再開する':'画面操作を再開する',guide:true});}
  else{setInputMode(null,'course-reset');setPhase('intro');dialog({title:'自分はそのまま。世界を動かそう。',description:modeIntroduction(),note:modeNote(),action:'スマホの傾きで始める',guide:true});}
}
$('course-select').addEventListener('change',event=>selectCourse(event.target.value));
$('mode-explore').addEventListener('click', () => selectMode('explore'));
$('mode-flight').addEventListener('click', () => selectMode('flight'));

function dialog({ title, description, note = '', action = '再開する', guide = false, error = '' }) {
  $('motion-explanation').open = false;
  $('dialog-title').textContent = title;
  $('dialog-description').textContent = description;
  $('dialog-note').textContent = note;
  $('dialog-note').hidden = !note;
  $('control-guide').hidden = !guide;
  $('basic-controls').hidden = !guide || playMode !== 'flight';
  $('start-button').textContent = action;
  $('start-button').disabled = false;
  $('error-message').textContent = error;
  $('error-message').hidden = !error;
  $('reset-button').hidden = !inputMode;
  $('practice-button').hidden = false;
  $('practice-button').textContent = inputMode === 'practice' ? 'スマホの傾きに切り替える' : '画面で操縦（スマホ傾きは無効）';
  $('dialog-kicker').textContent = inputMode === 'practice' ? '画面操作・センサー未使用' : playMode === 'flight' ? '傾き操縦と画面スロットル' : '傾きと回転の操作検証';
  pwa.render();
  if(flowEnabled)flowCoordinator?.dialog({title,description,note,action,error});
}

function showError(message) {
  pendingCalibration = false;
  halt();
  setPhase('error');
  dialog({ title: '傾きを確認できませんでした', description: '停止しています。下の内容を確認して、もう一度試してください。', action: 'もう一度センサーを確認する', error: flowEnabled?`${message} 傾きが使えない場合は「設定」で操作の方法を「画面で操縦」に変更できます。`:message });
}

function zeroPractice() {
  heldKeys.clear();
  keyboardActive = false;
  keyboardTwistBase = 0;
  for (const axis of controls) { practiceAngles[axis] = 0; $(`practice-${axis}`).value = '0'; practiceEditors[axis]?.sync(); }
}

function halt() {
  inputHeld=false;
  throttleControl?.cancel();
  feedback.stop();
  pendingCalibration = false;
  clearTimeout(waitingTimer);
  rates = { pitchRate: 0, yawRate: 0, bankAngle: 0, acceleration: 0, brake: 0 };
  speed = 0;
  setThrottle(0);
  angles = { pitch: 0, steer: 0, twist: 0 };
  zeroPractice();
  if (stage) stage.update(0, { ...rates, mode: playMode, speed, craftQuaternion,...(sonicMode()?{paused:true}:{}) });
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}

function pause(message = '止まっています。スマホを楽な持ち方に戻してから再開してください。') {
  if (!['running', 'ready', 'waiting'].includes(phase)) return;
  lastPauseReason=message;
  flowCoordinator?.cancel();
  permissionAttempt++;
  pendingCalibration = false;
  clearTimeout(waitingTimer);
  halt();
  reference = null;
  setPhase('paused');
  // Publish the final active-frame records before a pause/copy can read them.
  // The regular HUD is throttled; the observations themselves are already held.
  if(stage)updateHud(performance.now(),stage.getStatus());
  dialog({ title: '一時停止', description: message, note: modeNote(), action: inputMode === 'sensor' ? 'この持ち方で再開する' : '画面操作を再開する', guide: false });
}

async function keepAwake() {
  try {
    if ('wakeLock' in navigator && !document.hidden && phase === 'running') {
      const lock = await navigator.wakeLock.request('screen');
      if (phase !== 'running') await lock.release();
      else wakeLock = lock;
    }
  } catch { /* Unsupported or denied does not prevent play. */ }
}

function run(mode,reason) {
  if (document.hidden || !pwa.begin()) return false;
  lastFlightSnapshot = null;
  if (playMode === 'flight') flightSession.start();
  setInputMode(mode,reason);
  $('practice-panel').hidden = mode !== 'practice';
  $('input-mode').textContent = mode === 'sensor' ? 'スマホの傾きで操作中' : '画面操作・センサー未使用';
  zeroPractice();
  speed = 0;
  if (playMode === 'flight') { stage.resetDisplayRotation(); setThrottle(0.5); stage.launchFlight(); }
  if (mode === 'sensor' && craftReference && latestQuaternion) craftQuaternion.copy(compensationQuaternion(craftReference, latestQuaternion));
  else craftQuaternion.identity();
  setPhase('running');
  activeFrameAt=performance.now();
  if(flowEnabled||sonicMode())previousFrame=activeFrameAt;
  const initial=stage.getStatus();if(sonicMode())sonicActivity.begin(initial.supersonic);routeTiming.advance(0,{...initial,targetVisible:targetCenterInViewport(initial)});approaches.advance(0,initial);straights.advance(initial);passbys.advance(0,{...initial,objects:passObjects(initial)});
  feedback.start({flightNumber:flightSession.snapshot().legs});
  $('pause-button').focus({ preventScroll: true });
  keepAwake();
  if(flowEnabled)flowCoordinator?.onRunning();
  return true;
}

function refreshOrientations() {
  latestQuaternion = orientationQuaternion(latestOrientationSample, screenAngle());
  // A browser layout rotation is not a physical twist of the phone.
  latestInputQuaternion = orientationQuaternion(latestOrientationSample, playMode === 'flight' ? 0 : referenceScreenAngle);
}

function readPose(displayPose, inputPose, neutralReference, physicalReference) {
  craftQuaternion.copy(compensationQuaternion(physicalReference, displayPose));
  if (playMode === 'flight') {
    const legacy=deviceTiltAngles(neutralReference,inputPose,inputMode==='sensor'?screenAngle():0);
    if(flightSteering!=='wrist')return legacy;
    const reading=readWristAngles(wristReference,inputPose);
    // Fixed-display compensation remains the existing local screen twist.
    return {...legacy,...reading,pitch:reading.wristPitch,twist:relativeAngles(neutralReference,inputPose).twist};
  }
  const neutralCompensation = compensationQuaternion(neutralReference, displayPose);
  return {
    ...projectedTiltAngles(craftQuaternion, neutralCompensation),
    twist: relativeAngles(neutralReference, inputPose).twist,
  };
}

function receiveOrientation(event) {
  const sample = { alpha: event.alpha, beta: event.beta, gamma: event.gamma };
  const q = orientationQuaternion(sample, screenAngle());
  if (!q) {
    latestQuaternion = null;
    latestInputQuaternion = null;
    latestOrientationSample = null;
    if (phase === 'running' && inputMode === 'sensor') pause('3方向すべての傾きが読めなくなったため停止しました。');
    return;
  }
  latestOrientationSample = sample;
  refreshOrientations();
  lastOrientationAt = performance.now();
  if (pendingCalibration && phase === 'waiting') {
    pendingCalibration = false;
    clearTimeout(waitingTimer);
    finishCalibration();
    return;
  }
  if (phase === 'waiting') {
    clearTimeout(waitingTimer);
    setPhase('ready');
    dialog({ title: '持ち方を決めましょう', description: '画面が見やすい角度で、スマホを動かさずに持ってください。この持ち方を操作の中立にします。', note: modeNote(), action: playMode === 'flight' ? 'この持ち方で飛ぶ' : 'この持ち方で始める', guide: false });
  }
}

function attachSensors() {
  if (sensorListening) return;
  window.addEventListener('deviceorientation', receiveOrientation);
  sensorListening = true;
}

async function requestSensors() {
  if (inputMode !== 'sensor') craftReference = null;
  halt();
  const attempt = ++permissionAttempt;
  pendingCalibration = false;
  latestQuaternion = null;
  latestInputQuaternion = null;
  latestOrientationSample = null;
  lastOrientationAt = 0;
  reference = null;
  setInputMode('sensor','request-sensors');
  if (!window.isSecureContext) { showError('センサーにはHTTPSのページが必要です。公開URLをSafariやChromeで直接開いてください。'); return; }
  if (!('DeviceOrientationEvent' in window)) { showError('この端末・ブラウザーでは傾きを取得できません。スマホのSafariやChromeで公開URLを直接開いてください。'); return; }
  setPhase('waiting');
  dialog({ title: '傾きを確認しています', description: 'センサー利用を許可したら、スマホを少し動かしてください。', action: 'センサーを待っています…' });
  $('start-button').disabled = true;
  try {
    // Both requests are initiated from the user's click, before the first await.
    const permissions = [];
    if (typeof DeviceOrientationEvent.requestPermission === 'function') permissions.push(DeviceOrientationEvent.requestPermission());
    if (typeof window.DeviceMotionEvent?.requestPermission === 'function') permissions.push(DeviceMotionEvent.requestPermission());
    const results = await Promise.all(permissions);
    if (attempt !== permissionAttempt) return;
    if (results.some((permission) => permission !== 'granted')) { showError('動きと向きへのアクセスが許可されていません。ブラウザーのサイト設定を確認してから、もう一度試してください。'); return; }
    attachSensors();
    waitingTimer = setTimeout(() => { if (attempt === permissionAttempt && phase === 'waiting') showError('3方向の傾きデータが届きませんでした。アプリ内ブラウザーではなく、SafariやChromeで直接開いて試してください。'); }, 6000);
  } catch {
    if (attempt === permissionAttempt) showError('センサー利用を開始できませんでした。ページを開き直して、開始ボタンからもう一度許可してください。');
  }
}

function calibrate() {
  if (!pwa.canResume()) return;
  if (!latestQuaternion || performance.now() - lastOrientationAt > 1200) {
    pendingCalibration = true;
    setPhase('waiting');
    dialog({ title: '持ち方を確認しています', description: '今の持ち方の近くでスマホを少し動かしてください。新しい傾きが届いたら始まります。', note: modeNote(), action: '新しい傾きを待っています…' });
    $('start-button').disabled = true;
    clearTimeout(waitingTimer);
    waitingTimer = setTimeout(() => { if (pendingCalibration) showError('新しい傾きが届きませんでした。ページを開き直して試してください。'); }, 6000);
    return;
  }
  finishCalibration();
}

function finishCalibration() {
  if (!pwa.canResume()) return;
  pendingCalibration = false;
  clearTimeout(waitingTimer);
  referenceScreenAngle = screenAngle();
  refreshOrientations();
  reference = (playMode === 'flight' ? latestInputQuaternion : latestQuaternion).clone();
  if (!craftReference) craftReference = latestQuaternion.clone();
  wristReference=createWristReference({rawQuaternion:latestInputQuaternion,screenAngle:referenceScreenAngle});
  if(flightSteering==='wrist')wristRecord.calibrate(wristReference,'sensor');
  angles = { pitch: 0, steer: 0, twist: 0 };
  if(flowEnabled){flowCoordinator.poseReady('sensor','held-pose-start');return;}
  run('sensor','held-pose-start');
  showToast(playMode === 'flight' ? `画面の上辺を起こすと機首上げ。${flightSteering === 'wrist' ? '楽な持ち方で手首を回して' : flightSteering === 'twist' ? '面を保って左右に回して' : '左右の端を上下にひねって'}旋回します。` : '自機の先端側を下げると加速、逆側を下げるとブレーキ。持ち直しても自機の向きは保ちます。', 4300);
}

function showToast(text, duration = 2600) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  toastUntil = performance.now() + duration;
}

function startPractice(reason='resume-screen') {
  if (!pwa.canResume()) return;
  permissionAttempt++;
  pendingCalibration = false;
  clearTimeout(waitingTimer);
  halt();
  reference = null;
  craftReference = null;
  wristReference=createWristReference({rawQuaternion:neutralQuaternion,screenAngle:0});
  if(flightSteering==='wrist')wristRecord.calibrate(wristReference,'virtual-practice');
  if(flowEnabled){flowCoordinator.poseReady('practice',reason);return;}
  run('practice',reason);
  showToast('画面操作の練習です。スマホの傾きは使っていません。');
}

$('start-button').addEventListener('click', async () => {
  if (!stage) { location.reload(); return; }
  if (!pwa.canResume()) return;
  feedback.unlock();
  if (['ready','paused','complete'].includes(phase)) {
    const attempt = permissionAttempt, startAttempt = ++platformStartAttempt;
    await pwa.enter();
    if (attempt !== permissionAttempt || startAttempt !== platformStartAttempt || document.hidden || !pwa.canResume()) return;
  }
  if (stage.getStatus().grounded) { resetStage({ preserveSession: true }); if (inputMode === 'sensor') calibrate(); return; }
  if (phase === 'complete') { resetStage(); return; }
  if (phase === 'ready' || (phase === 'paused' && inputMode === 'sensor')) { calibrate(); return; }
  if (phase === 'paused' && inputMode === 'practice') { startPractice(); return; }
  requestSensors();
});
$('practice-button').addEventListener('click', async () => {
  if (!stage || !pwa.canResume() || phase==='running') return;
  if(inputMode==='sensor'&&!window.confirm('画面操作へ切り替えると、スマホを傾けても操縦できなくなります。画面のゲージで操縦するモードへ切り替えますか？'))return;
  const sourcePhase=phase,sourceMode=inputMode;
  feedback.unlock();
  if (inputMode !== 'practice') {
    const attempt = permissionAttempt, startAttempt = ++platformStartAttempt;
    await pwa.enter();
    if (attempt !== permissionAttempt || startAttempt !== platformStartAttempt || phase!==sourcePhase || inputMode!==sourceMode || document.hidden || !pwa.canResume()) return;
  }
  if (phase === 'complete' || stage.getStatus().grounded) {
    pwa.clearOrientation();
    if (phase === 'complete') { flightSession.reset();afterburnerSession.reset(); feedback.reset(); }
    else flightSession.restartLeg();
    resetRoute(); previousCollected = 0; craftReference = null;
  }
  inputMode === 'practice' ? requestSensors() : startPractice('screen-button-confirmed');
});
$('pause-button').addEventListener('click', () => pause());
$('recenter-button').addEventListener('click', () => {
  if(flowEnabled){pause();void flowCoordinator.action('recenter');return;}
  if(inputMode==='practice'){
    pause('画面操作を止めました。スマホの傾きへの切替を確認します。');
    $('practice-button').click();return;
  }
  pause(playMode === 'flight' ? '一度停止しました。今の持ち方を操作の中立に合わせ直します。' : '一度停止しました。自機の向きは保ったまま、今の持ち方を操作の中立に合わせ直します。');
  void pwa.enter();
});
$('help-button').addEventListener('click', () => {
  if(flowEnabled){pause();void flowCoordinator.action('help');return;}
  if (phase !== 'running') return;
  pause(playMode === 'flight' ? `画面の上辺を起こすと機首上げ、前へ倒すと機首下げ。${flightSteering === 'wrist' ? '手首を右へ回すと右旋回、左へ回すと左旋回。前腕の方向は持ち方からの推定です。' : flightSteering === 'twist' ? '面を保って時計回りに回すと右旋回、反時計回りで左旋回。' : '左右の端を上下にひねり、右端を下げると右旋回、左端を下げると左旋回。'}中立で翼は水平へ戻り、${effectivePitchMode() === 'angle' ? '機首も水平へ戻ります。' : '機首は今の角度を保ちます。'}画面のスロットルで出力を調整。出力0%でも滑空します。停止は一時停止を使います。` : '自機の先端側を下げると加速、逆側でブレーキ。自機の右側・左側を下げて旋回します。中立で速さを保ち、スマホを右へ回すと上、左へ回すと下へ曲がります。半回転付近では上下操作は中立に戻ります。');
  $('control-guide').hidden = false;
  $('basic-controls').hidden = playMode !== 'flight';
  $('basic-controls').open = true;
  $('motion-explanation').open = playMode === 'flight';
});
$('practice-neutral').addEventListener('click', zeroPractice);
function pointPracticeTilt(pitch, steer, twist = practiceAngles.twist) {
  const radians = playMode === 'flight' ? 0 : MathUtils.degToRad(twist);
  practiceAngles.pitch = Math.round(pitch * Math.cos(radians) - steer * Math.sin(radians));
  practiceAngles.steer = Math.round(pitch * Math.sin(radians) + steer * Math.cos(radians));
  practiceAngles.twist = twist;
  for (const axis of controls) { $(`practice-${axis}`).value = practiceAngles[axis];practiceEditors[axis]?.sync(); }
}
$('practice-brake').addEventListener('click', () => {
  heldKeys.clear();
  if (playMode === 'flight') setThrottle(0);
  else { keyboardActive = false; pointPracticeTilt(25, 0); }
});
throttleControl=createThrottleControl($('throttle-input'),{getValue:()=>throttle,onChange:value=>{if(phase==='running'&&playMode==='flight')setThrottle(value);else throttleControl?.sync(throttle);}});
const practiceEditors=Object.fromEntries(controls.map(axis=>[axis,createRangeEditor($(`practice-${axis}`),{
  name:axis==='pitch'?'画面の上辺':axis==='steer'?'画面の右辺':'回し角度',unit:'°',initial:0,showValue:true,
})]));
for (const axis of controls) $(`practice-${axis}`).addEventListener('input', (event) => { keyboardActive = false; heldKeys.clear(); practiceAngles[axis] = Number(event.target.value); });

function resetStage({ preserveSession = false } = {}) {
  if(flowEnabled&&flowCoordinator){void flowCoordinator.action('retry');return;}
  pwa.clearOrientation();
  if (!preserveSession) { flightSession.reset();afterburnerSession.reset(); feedback.reset(); }
  else flightSession.restartLeg();
  flightPanel.showResult(null);
  permissionAttempt++;
  halt();
  reference = null;
  craftReference = null;
  resetRoute();
  previousCollected = 0;
  $('toast').hidden = true;
  if (inputMode === 'practice') startPractice();
  else { setPhase('paused'); dialog({ title: 'もう一度、出発しましょう', description: `持ち方を決めて、${selectedCourse.lights.length}つの光を集めに行きましょう。`, note: modeNote(), action: playMode === 'flight' ? 'この持ち方で飛ぶ' : 'この持ち方で始める' }); }
}
$('reset-button').addEventListener('click', () => resetStage());

function leavePage(message, { blur = false } = {}) {
  if(flowEnabled&&blur&&flowPermissionAwaiting&&phase==='waiting')return;
  if(flowEnabled&&(!blur||phase==='running'||flowCoordinator?.snapshot().step==='countdown'))flowCoordinator?.cancel();
  // Fullscreen/lock may still be awaiting an OS response even in intro or paused.
  platformStartAttempt++;
  pwa.cancelEntry();
  feedback.stop(); heldKeys.clear();
  // A permission prompt can blur the window while waiting. Preserve that original flow.
  if (!blur || phase === 'running' || pendingCalibration) pause(message);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) leavePage('画面が隠れたため停止しました。持ち方を合わせて再開してください。'); });
window.addEventListener('blur', () => leavePage('画面から離れたため停止しました。', { blur: true }));
window.addEventListener('pagehide',() => leavePage('画面から離れたため停止しました。'));
const screenChanged = () => { refreshOrientations(); resize(); pwa.orientationChanged(); };
screen.orientation?.addEventListener('change', screenChanged);
window.addEventListener('orientationchange', screenChanged);
window.addEventListener('keydown', (event) => {
  if (phase !== 'running' || inputMode !== 'practice' || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  const key = event.key.toLowerCase();
  if (['w','s','a','d','e','q'].includes(key)) {
    if (!keyboardActive) keyboardTwistBase = practiceAngles.twist;
    heldKeys.add(key); keyboardActive = true; event.preventDefault();
  }
  if (event.code === 'Space') { event.preventDefault(); pause(); }
});
window.addEventListener('keyup', (event) => heldKeys.delete(event.key.toLowerCase()));
canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); pause('3Dの表示が中断しました。ページを再読み込みしてください。'); });

function resize() { stage?.resize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio || 1, 1.6)); flightPanel.refreshLayout(); }
window.addEventListener('resize', () => { resize(); pwa.orientationChanged(); });

function meter(axis, limit) {
  const input=axis==='steer'&&playMode==='flight'&&flightSteering==='wrist'?angles.wrist:angles[axis];
  const angle = Number.isFinite(input) ? input : 0;
  const value = axis === 'twist' ? MathUtils.radToDeg(Math.asin(Math.sin(MathUtils.degToRad(angle)))) : angle;
  $(`${axis}-value`).textContent = `${Math.round(value)}°`;
  const el = $(`${axis}-meter`);
  el.style.left = `${value < 0 ? 50 - Math.min(-value / limit, 1) * 50 : 50}%`;
  el.style.width = `${Math.min(Math.abs(value) / limit, 1) * 50}%`;
}

let lastHudAt = 0;
let lastHudPhase = null;
function updateGroundProximity(state, language='en') {
  const proximity = getGroundProximity({ altitude: state.groundClearance, verticalSpeed: state.verticalSpeed, grounded: state.grounded });
  const flight = playMode === 'flight';
  const level = flight ? proximity.level : 'clear';
  $('ground-proximity').dataset.level = level;
  $('ground-height-meter').style.setProperty('--clearance-ratio', String(proximity.ratio));
  $('altitude-value').textContent = state.supersonic?formatSupersonicAltitude(state.altitude??state.position.y):proximity.known ? proximity.clearance.toFixed(1) : '—';
  if(state.supersonic)$('altitude-value').setAttribute('aria-label',`ALT ${state.altitude??state.position.y} m`);else $('altitude-value').removeAttribute('aria-label');
  const message = hudGroundWarning(level,language);
  if ($('ground-warning-text').textContent !== message) $('ground-warning-text').textContent = message;
  if($('ground-warning-text').dataset.level!==level)$('ground-warning-text').dataset.level=level;
  const warningHidden=!flight||!['low','danger','stopped','unknown'].includes(level);
  if($('ground-warning-text').hidden!==warningHidden)$('ground-warning-text').hidden=warningHidden;
  const edge = $('ground-edge-warning');
  edge.dataset.level = level;
  edge.hidden = !flight || phase !== 'running' || !['low', 'danger'].includes(level);
  app.dataset.groundLevel = flight ? level : 'hidden';
  app.dataset.groundClearance = proximity.known ? String(proximity.clearance) : '';
}

function updateEdgeMarker(state, language='en',extraObstacles=[]) {
  const marker = $('target-edge-marker');
  marker.dataset.target=state.collected===state.total?'exit':'light';
  if(playMode==='flight'&&cameraMode==='cockpit'&&visibility==='assisted'&&phase==='running'){
    marker.hidden=true;app.dataset.edgeStatus='hud';return;
  }
  if (visibility !== 'assisted' || phase !== 'running' || state.complete || !state.targetLocal) {
    marker.hidden = true;
    app.dataset.edgeStatus = 'hidden';
    return;
  }
  const width = window.innerWidth, height = window.innerHeight;
  const cx = width / 2, cy = height / 2;
  let left = 12, right = width - 12, top = 12, bottom = height - 12;
  const nav = document.querySelector('.navigation').getBoundingClientRect();
  const hud = $('bottom-panel').getBoundingClientRect();
  top = Math.max(top, nav.bottom + 12);
  if (hud.left < cx && hud.right > cx) bottom = Math.min(bottom, hud.top - 12);
  else if (hud.left >= cx) right = Math.min(right, hud.left - 12);
  else left = Math.max(left, hud.right + 12);
  if (!$('practice-panel').hidden && width >= 600 && height <= 500) {
    const practice = $('practice-panel').getBoundingClientRect();
    if (practice.right < cx) left = Math.max(left, practice.right + 12);
  }
  if (!$('toast').hidden) top = Math.max(top, $('toast').getBoundingClientRect().bottom + 12);
  const projected = projectEdgeTarget({
    target: state.targetLocal, width, height, verticalFov: state.fieldOfView.vertical,
    bounds: { left: left + 50, top: top + 25, right: right - 50, bottom: bottom - 25 },
    avoid: { left: cx - 100, top: cy - 75, right: cx + 100, bottom: cy + 75 },
  });
  marker.hidden = !projected.visible;
  app.dataset.edgeStatus = projected.visible ? 'shown' : projected.inView ? 'onscreen' : 'hidden';
  app.dataset.edgeBehind = String(projected.behind);
  if (!projected.visible) return;
  const cockpitObstacles = cameraMode === 'cockpit' && playMode === 'flight'
    ? ['cockpit-speed','cockpit-altitude','cockpit-heading','cockpit-target-height','cockpit-power','cockpit-vario'].filter(id=>!$(id).hidden).map(id=>$(id).getBoundingClientRect()) : [];
  const placed = avoidRadarMarker(projected, { left:left+50,top:top+25,right:right-50,bottom:bottom-25 }, [...cockpitObstacles,...extraObstacles]);
  marker.style.left = `${placed.x}px`;
  marker.style.top = `${placed.y}px`;
  $('edge-arrow').style.transform = `rotate(${language==='en'&&projected.behind?Math.atan2(state.targetLocal.x,-state.targetLocal.z)*180/Math.PI:projected.rotation}deg)`;
  $('edge-label').textContent = hudTargetLabel(state,language);
  const vertical = Math.abs(state.elevation) > 0.13 ? (state.elevation > 0 ? '上' : '下') : '';
  $('edge-detail').textContent = language==='ja'
    ? `${[projected.behind ? '後ろ' : '', vertical].filter(Boolean).join('・')} ${formatNavigationDistance(state.distance,Boolean(state.supersonic))}`.trim()
    : `${formatNavigationDistance(state.distance,Boolean(state.supersonic))} ${hudHeightDelta(state.targetPosition.y-state.position.y,language)}`;
  marker.setAttribute('aria-label', `${hudTargetLabel(state,language)} ${$('edge-detail').textContent}`);
}

function targetCenterInPlayArea(state){
  return exitCenterVisible({target:state.targetLocal,verticalFov:state.fieldOfView.vertical,
    near:state.cameraClipping.near,far:state.cameraClipping.far,width:innerWidth,height:innerHeight,
    bounds:{left:0,right:innerWidth,top:document.querySelector('.navigation').getBoundingClientRect().bottom,bottom:$('bottom-panel').getBoundingClientRect().top}});
}
function targetCenterInViewport(state){
  return exitCenterVisible({target:state.targetLocal,verticalFov:state.fieldOfView.vertical,
    near:state.cameraClipping.near,far:state.cameraClipping.far,width:innerWidth,height:innerHeight,
    bounds:{left:0,right:innerWidth,top:0,bottom:innerHeight}});
}
function updateHud(now, state) {
  if (now - lastHudAt < 80 && phase === lastHudPhase) return;
  lastHudAt = now;
  lastHudPhase = phase;
  feedback.updateDiagnostics();
  const settings = flightPanel.getSettings();
  // Only the passive, running HUD changes language. Source state and record values stay Japanese.
  const language=phase==='running'?normalizeHudLanguage(settings.hudLanguage):'ja';
  $('flight-essential-speed-label').textContent=language==='ja'?(playMode==='flight'?'速度':'移動速度'):'SPD';
  $('ground-clearance').textContent=hudText(language,playMode==='flight'?'groundClearance':'altitudeShort');
  $('nose-value').parentElement.firstChild.textContent=`${hudText(language,'nose')} `;
  $('bank-value').parentElement.firstChild.textContent=`${hudText(language,'bank')} `;
  $('climb-value').parentElement.firstChild.textContent=`${hudText(language,'climbShort')} `;
  document.querySelector('.throttle-heading label').textContent=hudText(language,'throttle');
  if(inputMode)$('input-mode').textContent=language==='ja'
    ? inputMode==='sensor'?'スマホの傾きで操作中':'画面操作・センサー未使用'
    : inputMode==='sensor'?'TILT CTRL':'SCREEN CTRL';
  $('play-mode-label').textContent=language==='ja'
    ? `${playMode==='flight'?'飛行機':'探索'}・${visibility==='assisted'?'対策':'従来'}`
    : `${playMode==='flight'?'FLIGHT':'EXPLORE'} · ${visibility==='assisted'?'ASSIST':'CLASSIC'}`;
  document.querySelector('.navigation').setAttribute('aria-label',language==='ja'?'次の目的地':'NEXT TGT');
  document.querySelector('.collection').setAttribute('aria-label',language==='ja'?'集めた光':'TGT COLLECTED');
  for (const axis of controls) meter(axis, playMode === 'flight'
    ? axis === 'pitch' ? settings.maxTilt : axis === 'steer' ? (flightSteering==='wrist'?settings.maxSteerWrist:settings.maxSteerTilt) : settings.maxSteerTwist
    : axis === 'pitch' ? CONTROL_LIMITS.throttleMaximum : axis === 'twist' ? CONTROL_LIMITS.twistMaximum : CONTROL_LIMITS.tiltMaximum);
  $('speed-value').textContent = convertSpeed(state.speed,flightPanel.getSettings().speedUnit).toFixed(1);
  $('speed-unit').textContent=normalizeSpeedUnit(flightPanel.getSettings().speedUnit);
  updateAfterburnerPanel(state,flightPanel.getSettings());
  updateGroundProximity(state,language);
  $('nose-value').textContent = `${Math.round(MathUtils.radToDeg(state.pitch))}°`;
  $('bank-value').textContent = `${Math.round(MathUtils.radToDeg(state.bank || 0))}°`;
  $('climb-value').textContent = `${(state.verticalSpeed || 0) > 0 ? '+' : ''}${(state.verticalSpeed || 0).toFixed(1)}`;
  const assistLabel = state.recoveryAssist > .05 ? '失速からの復帰補助中'
    : state.viewAssistance > .05 ? '地面を見る補助中' : '中立で翼を戻す';
  $('view-assist-note').textContent = hudStatusLabel(assistLabel,language);
  const motionLabel = phase !== 'running' || state.speed < 0.01 ? '停止中'
    : playMode === 'flight' ? (state.verticalSpeed > 0.1 ? '上昇中' : state.verticalSpeed < -0.1 ? '下降中' : '巡航中')
    : rates.brake > 0 ? 'ブレーキ' : rates.acceleration > 0 ? '加速中' : '速度維持';
  $('motion-state').textContent = hudStatusLabel(motionLabel,language);
  $('target-label').textContent = state.complete ? hudText(language,'arrived') : hudTargetLabel(state,language);
  $('target-distance').textContent = formatNavigationDistance(state.distance,Boolean(state.supersonic),{space:true});
  $('collection-count').textContent = state.collected;
  $('collection-total').textContent='/ '+state.total;
  $('objective').textContent = hudObjectiveText(state,language);
  $('nav-arrow').style.transform = `rotate(${state.bearing * 180 / Math.PI}deg)`;
  $('target-direction').textContent = hudDirectionText(state,language,{assisted:visibility==='assisted'});
  app.dataset.speed = state.speed.toFixed(3);
  app.dataset.position = JSON.stringify(state.position);
  app.dataset.craftQuaternion = JSON.stringify(state.craftQuaternion);
  app.dataset.craftScreenQuaternion = JSON.stringify(state.craftScreenQuaternion);
  if(state.craftScreen){app.style.setProperty('--craft-screen-x',state.craftScreen.x+'px');app.style.setProperty('--craft-screen-y',state.craftScreen.y+'px');}
  app.dataset.cameraQuaternion = JSON.stringify(state.cameraQuaternion);
  app.dataset.worldQuaternion = JSON.stringify(state.worldQuaternion);
  app.dataset.displayRoll = String(state.displayRoll || 0);
  app.dataset.targetLocal = JSON.stringify(state.targetLocal);
  app.dataset.bank = String(state.bank || 0);
  app.dataset.flightPitch = String(state.pitch);
  app.dataset.heading = String(state.heading);
  app.dataset.yawRate = String(state.yawRate || 0);
  app.dataset.verticalSpeed = String(state.verticalSpeed || 0);
  app.dataset.throttle = String(state.throttle || 0);
  app.dataset.afterburner=JSON.stringify(state.afterburner??{});
  app.dataset.flightProfile=JSON.stringify(state.flightProfile??null);
  app.dataset.speedEffects=JSON.stringify(state.speedEffects??{});
  app.dataset.recoveryAssist = String(state.recoveryAssist || 0);
  app.dataset.angleOfAttack = String(state.angleOfAttack);
  app.dataset.wrist=JSON.stringify({angle:Number.isFinite(angles.wrist)?angles.wrist:0,pitch:Number.isFinite(angles.wristPitch)?angles.wristPitch:0,held:Boolean(angles.held),calibration:wristReference});
  app.dataset.session = JSON.stringify(flightSession.snapshot());
  app.dataset.pitchTarget = String(rates.pitchTarget || 0);
  app.dataset.grounded = String(Boolean(state.grounded));
  app.dataset.viewPitch = String(state.viewPitch || 0);
  app.dataset.viewAssistance = String(state.viewAssistance || 0);
  app.dataset.horizontalFov = String(state.fieldOfView?.horizontal || 0);
  app.dataset.cameraClipping = JSON.stringify(state.cameraClipping??null);
  app.dataset.landmarkCount = String(state.landmarks?.length || 0);
  app.dataset.beaconAppearance = JSON.stringify(state.beaconAppearance);
  app.dataset.scenery = JSON.stringify(state.scenery);
  app.dataset.aircraft = JSON.stringify(state.aircraft);
  app.dataset.worldCraftScreenQuaternion = JSON.stringify(state.worldCraftScreenQuaternion);
  app.dataset.craftVisible = String(state.craftVisible);
  app.dataset.orientation = JSON.stringify(state.orientation);
  app.dataset.velocity = JSON.stringify(state.velocity);
  app.dataset.viewPosition = JSON.stringify(state.viewPosition);
  app.dataset.verticalFov = String(state.fieldOfView.vertical);
  app.dataset.navigationTargets = JSON.stringify(state.navigationTargets);
  app.dataset.exitAppearance=JSON.stringify(state.exitAppearance);
  app.dataset.inputHeld=String(inputHeld);
  app.dataset.segments=JSON.stringify(recordedSegments());
  app.dataset.approaches=JSON.stringify(approaches.snapshot());app.dataset.abStraights=JSON.stringify(straights.snapshot());app.dataset.passbys=JSON.stringify(passbys.snapshot());app.dataset.courseTime=JSON.stringify(courseTimeSnapshot());
  app.dataset.groundPattern=JSON.stringify(state.groundPattern);app.dataset.abLane=JSON.stringify(state.abLane);
  app.dataset.exitDiscovery=JSON.stringify(routeTiming.exitSnapshot());
  app.dataset.targetViews=JSON.stringify(routeTiming.targetViewsSnapshot());
  app.dataset.course=JSON.stringify(state.course);app.dataset.stageSize=JSON.stringify(state.stageSize);app.dataset.turnGravity=String(state.turnGravity);app.dataset.boundary=JSON.stringify(state.boundary);
  app.dataset.supersonic=JSON.stringify(state.supersonic??null);
  const cockpitActive = playMode === 'flight' && cameraMode === 'cockpit' && phase === 'running';
  $('cockpit-exit-notice').hidden=!(cockpitActive&&visibility==='assisted'&&state.collected===state.total&&now<exitNoticeUntil);
  $('cockpit-exit-notice').textContent=hudText(language,'exitOpen')+(state.pointName?` · ${state.pointName}`:'');
  const sharedHudActive=flowEnabled&&phase==='running'&&playMode==='flight'&&cameraMode!=='overlay';
  const heightGuide=updateTargetHeightPanel(state,{phase,visibility,enabled:settings.targetHeightGuide,cockpit:cockpitActive,language,inlineParent:$('flight-essential-height'),shared:sharedHudActive});
  updateEssentialHud({...state,inputHeld},{phase,mode:playMode,camera:cameraMode,language});
  flowUI?.refreshPlayControls();
  updateSharedFlightHud({enabled:sharedHudActive,layout:settings.hudLayout,safe:viewportInsets()});
  updateRadar(state, { phase, visibility, range: state.supersonic?courseRadarRange(selectedCourse,sonicPanel.getSettings().radarRange):courseRadarRange(selectedCourse,settings.radarRange),language,extraObstacles:state.supersonic?sonicPanel.getObstacleRects():[] });
  if([SIERRA_COURSE_ID,SIERRA10_COURSE_ID].includes(selectedCourse.id))app.dataset.courseRadar=JSON.stringify({effectiveRange:courseRadarRange(selectedCourse,settings.radarRange),savedRange:settings.radarRange,source:'course-profile'});else delete app.dataset.courseRadar;
  const cockpitLayout = layoutCockpitHud(cockpitActive);
  if(state.supersonic)sonicPanel.updateState(state,{phase,camera:cameraMode,now,hudLanguage:language});
  instrumentHud?.update(state,{phase,mode:playMode,camera:cameraMode,settings,language,heightGuide});
  const instrumentObstacles=instrumentHud?.obstacles()??[];
  if(state.supersonic){
    updateCockpitHud({...state,inputHeld},cockpitActive,cockpitLayout,{...settings,hudLanguage:language},heightGuide);
    const sonicObstacles=[...sonicPanel.getObstacleRects(),...instrumentObstacles];
    if(!instrumentHud)updateRadar(state,{phase,visibility,range:courseRadarRange(selectedCourse,sonicPanel.getSettings().radarRange),language,extraObstacles:sonicObstacles});
    updateEdgeMarker(state,language,sonicObstacles);layoutCockpitObjective(cockpitLayout,sonicObstacles);
  }else{
    updateEdgeMarker(state,language,instrumentObstacles);
    updateCockpitHud({...state,inputHeld}, cockpitActive, cockpitLayout, {...settings,hudLanguage:language}, heightGuide);
    layoutCockpitObjective(cockpitLayout,instrumentObstacles);
  }
  app.dataset.supersonicPanel=JSON.stringify(sonicPanel.snapshot());
  flowUI?.refreshPlayControls();
  if(flowEnabled&&flowCoordinator){const flow=flowCoordinator.snapshot();app.dataset.startup=JSON.stringify(flow.startup);app.dataset.briefing=JSON.stringify(flow.briefing);}
}

let previousFrame = performance.now();
function frame(now) {
  const frameStart=performance.now();
  // A queued rAF can precede the click/timer that launched this flight.
  // Keep both movement and active-time records at the actual start boundary.
  const clock=flowEnabled||sonicMode()?advanceFrameClock(previousFrame,now):null;
  const rawDt=clock?Math.max(0,(clock.time-previousFrame)/1000):null;
  const dt = sonicMode()?rawDt:clock?clock.dt:Math.min((now - previousFrame) / 1000, 0.05);
  if(clock)now=clock.time;
  previousFrame = now;
  if (stage) {
    stage.setGroundPatternStrength(sonicMode()?.8:flightPanel.getSettings().groundPatternStrength);
    if (phase === 'running') {
      if (inputMode === 'sensor') {
        // An unchanged held pose may produce no new events. Keep its last valid value while visible.
        if (reference && craftReference && latestOrientationSample) {
          refreshOrientations();
          angles = (playMode==='flight'&&flightSteering==='wrist'?preserveWristPose:preserveTiltInput)(angles,readPose(latestQuaternion, latestInputQuaternion, reference, craftReference));inputHeld=angles.held;
        }
      } else {
        if (keyboardActive) {
          const pitchExtent = effectivePitchMode() === 'angle' ? flightPanel.getSettings().maxTilt : 18;
          const pitch = playMode === 'flight' ? (heldKeys.has('w') ? pitchExtent : 0) - (heldKeys.has('s') ? pitchExtent : 0) : (heldKeys.has('s') ? 22 : 0) - (heldKeys.has('w') ? 18 : 0);
          const lateral = (heldKeys.has('d') ? 18 : 0) - (heldKeys.has('a') ? 18 : 0);
          const steer = playMode === 'flight' && flightSteering === 'twist' ? 0 : lateral;
          const turn = playMode === 'flight'
            ? (flightSteering === 'twist' ? lateral : keyboardTwistBase)
            : keyboardTwistBase + (heldKeys.has('e') ? 22 : 0) - (heldKeys.has('q') ? 22 : 0);
          if (playMode === 'flight' && (heldKeys.has('e') || heldKeys.has('q'))) setThrottle(throttle + ((heldKeys.has('e') ? 1 : 0) - (heldKeys.has('q') ? 1 : 0)) * dt * 0.4);
          const wrappedTurn = ((turn + 180) % 360 + 360) % 360 - 180;
          pointPracticeTilt(pitch, steer, wrappedTurn);
        }
        const pose = composeDevicePose(practiceAngles);
        angles = (playMode==='flight'&&flightSteering==='wrist'?preserveWristPose:preserveTiltInput)(angles,readPose(pose, pose, neutralQuaternion, neutralQuaternion));inputHeld=angles.held;
      }
    }
    if(phase==='running'&&playMode==='flight'&&flightSteering==='wrist')wristRecord.add(angles);
    const sonicInput=sonicMode()?supersonicIntent(angles,{steering:flightSteering,normalSettings:flightPanel.getSettings(),effectiveSettings:stage.getStatus().supersonic.effectiveSettings,throttle:Math.min(1,throttle),manualAfterburner}):null;
    rates = phase === 'running' ? (sonicInput?{pitchRate:0,yawRate:0,bankAngle:sonicInput.bankDemand*Math.atan(Math.sqrt(stage.getStatus().supersonic.effectiveSettings.maxG**2-1)),pitchTarget:sonicInput.pitchDemandRadians,acceleration:0,brake:0}
      :playMode === 'flight' ? flightCommands(angles, { pitchMode, steering: flightSteering, settings: flightPanel.getSettings(), currentPitch: stage.getStatus().controlPitch, dt }) : controlRates(angles)) : { pitchRate: 0, yawRate: 0, bankAngle: 0, acceleration: 0, brake: 0 };
    const wasRunning=phase==='running',wasFlying = wasRunning && playMode === 'flight';
    if (phase === 'running' && (!(flowEnabled||sonicMode()) || dt > 0)) {
      if (playMode === 'explore') speed = advanceSpeed(speed, dt, rates);
      stage.update(dt, { ...rates, mode: playMode, speed, throttle:Math.min(1,throttle), manualAfterburner, pitchInputDegrees:angles.pitch, speedSettings:flightPanel.getSettings(), craftQuaternion,...(sonicInput?{supersonic:sonicInput}:{}),
        ...(playMode === 'flight' ? { displayTwist: angles.twist,
          displayScreenOffset: inputMode === 'sensor' ? screenAngle() - referenceScreenAngle : 0,
          displayTimeConstant: flightPanel.getSettings().displayTimeConstant,
          chaseTimeConstant: flightPanel.getSettings().chaseTimeConstant,
          cockpitFov: flightPanel.getSettings().cockpitFov, turnGravity:flightPanel.getSettings().turnGravity, maxBank:flightPanel.getSettings().maxBank } : {}) });
    }
    const state = stage.getStatus();
    if(state.supersonic)sonicPanel.observeEvents(state,{phase,now});
    let activeSeconds=wasRunning?Math.max(0,(now-activeFrameAt)/1000):0;
    if(wasRunning&&state.supersonic){sonicActivity.advance(activeSeconds,state.supersonic);activeSeconds=Math.max(0,activeSeconds-(state.supersonic.timing?.terminalRemainder??0));}
    if(wasRunning){
      const targetVisible=targetCenterInViewport(state);
      routeTiming.advance(activeSeconds,{...state,targetVisible,exitVisible:state.collected===state.total&&targetCenterInPlayArea(state)});activeFrameAt=now;
      approaches.advance(activeSeconds,state);straights.advance(state);
    }
    if (wasFlying) {flightSession.advance(activeSeconds, state);afterburnerSession.advance(state.afterburner);}
    if (phase === 'running' && playMode === 'flight' && !state.grounded) {
      lastFlightSnapshot = { throttle: state.throttle, pitch: state.pitch,
        verticalSpeed: state.verticalSpeed, inputPitch: angles.pitch,
        deadzone: flightPanel.getSettings().deadzone };
    }

    if (state.collected > previousCollected) {
      previousCollected = state.collected; feedback.event('collect');
      const language=normalizeHudLanguage(flightPanel.getSettings().hudLanguage);
      if(state.collected===state.total&&visibility==='assisted'){exitNoticeUntil=now+3500;feedback.exitOpened();showToast(language==='ja'?(state.pointName?`出口 ${state.pointName}が開きました。黄色と白の門へ向かいましょう。`:'出口が開きました。黄色と白の門へ向かいましょう。'):hudText(language,'exitOpen')+(state.pointName?` · ${state.pointName}`:''));}
      else showToast(hudCollectedNotice(state,language));
    }
    if (state.complete && phase === 'running') {
      const segments=sonicMode()?recordedSegments():routeTiming.snapshot();
      if(segments.every(segment=>Number.isFinite(segment.seconds)))courseTime=sonicMode()?sonicBests.complete(sonicBestKey(),sonicActivity.snapshot().activeSeconds):courseBests.complete(selectedCourse,playMode,segments.reduce((sum,segment)=>sum+segment.seconds,0));
      halt();
      setPhase('complete');
      feedback.event('clear');
      dialog({ title: '出口に到着しました', description: sierra10Mode()?'A〜Fの門とGの出口を通過しました。シエラ1/10クリア。':sonicMode()?'5枚の門と出口を通過しました。高速空域クリア。':playMode === 'flight' ? `${state.total}つの光を集めて飛行クリア。傾きとスロットルは操作しやすかったですか？` : `${state.total}つの光を集めて、探索クリア。傾きと回転は操作しやすかったですか？`, note: '楽な持ち方に戻してから、もう一度試せます。', action: 'もう一度遊ぶ' });
      flightPanel.showResult(flightPanel.report(flightSession.snapshot(), 'clear', flightSession.lastLegSnapshot()));
      flowCoordinator?.result({newBest:courseTime?.newBest===true});
    }
    if (state.grounded && phase === 'running') {
      let description = '地面まで0mで接触しました。';
      if (lastFlightSnapshot) {
        const s = lastFlightSnapshot;
        const nose = Math.round(MathUtils.radToDeg(s.pitch));
        const noseText = Math.abs(nose) < 1 ? '機首ほぼ水平' : `機首${nose > 0 ? '上' : '下'}${Math.abs(nose)}°`;
        const operation = Math.abs(s.inputPitch) <= s.deadzone ? '中立'
          : `${s.inputPitch < 0 ? '前倒し' : '手前へ起こし'}${Math.round(Math.abs(s.inputPitch))}°`;
        description = `接地直前：出力${Math.round(s.throttle * 100)}%・${noseText}・下降${Math.max(0, -s.verticalSpeed).toFixed(1)}m/s。前後操作：${operation}。`;
      }
      if(sonicMode())description=`機体の一部が${sierra10Mode()?'地面':'海面'}に接触しました。中心高度${state.altitude.toFixed(2)}m／最下部の${sierra10Mode()?'地面':'海面'}からの高さ${state.groundClearance.toFixed(2)}m。`;
      pause(sonicMode()?`機体が${sierra10Mode()?'地面':'海面'}に接触して停止しました。最初から飛び直せます。`:'地面に接触して停止しました。最初から飛び直せます。');
      feedback.event('crash');
      dialog({ title: sonicMode()?`${sierra10Mode()?'地面':'海面'}に接触して停止`:'地面に接触して停止', description, note: '飛び直すと出発地点から出力50%で始まります。', action: '最初から飛び直す' });
      flightPanel.showResult(flightPanel.report(flightSession.snapshot(), 'grounded', flightSession.lastLegSnapshot()));
      flowCoordinator?.result(sonicMode()?{title:sierra10Mode()?'地面に接触しました':'海面に接触しました',description}:undefined);
    }
    updateHud(now, state);
    updateCockpitObjective(state,playMode==='flight'&&cameraMode==='cockpit'&&phase==='running',{language:phase==='running'?flightPanel.getSettings().hudLanguage:'ja'});
    const sonicObstacles=[...(state.supersonic?sonicPanel.getObstacleRects():[]),...(instrumentHud?.obstacles()??[])];
    const guidance=updateGuidancePanel(state,{phase,camera:cameraMode,settings:flightPanel.getSettings(),now,dt,extraObstacles:sonicObstacles});
    updateBoundaryPanel(state,{phase,settings:flightPanel.getSettings(),extraObstacles:sonicObstacles});
    feedback.update(state,angles,inputMode,flightSteering,now,{enabled:phase==='running'&&playMode==='flight'&&flightPanel.getSettings().audioGuidance,bearingDeg:guidance?.bearingDeg});
    if(phase==='running')for(const event of passbys.advance(activeSeconds,{...state,objects:passObjects(state)}))feedback.passBy(event);
  }
  feedback.frameTiming(performance.now()-frameStart);
  if (now > toastUntil) $('toast').hidden = true;
  requestAnimationFrame(frame);
}

function prepareFlowFresh({preserveSession=false}={}){
  if(!stage){location.reload();return false;}
  permissionAttempt++;flowPermissionAwaiting=false;pendingCalibration=false;clearTimeout(waitingTimer);halt();pwa.clearOrientation();
  if(preserveSession)flightSession.restartLeg();else{flightSession.reset();afterburnerSession.reset();feedback.reset();}
  reference=null;craftReference=null;resetRoute();previousCollected=0;setInputMode(null,'new-course-flow');
  $('toast').hidden=true;flightPanel.showResult(null);setPhase('intro');updateHud(performance.now(),stage.getStatus());return true;
}
function courseCard(id){
  const course=getCourse(id),range=COURSE_CRITERIA.difficulties[id]?.cruiseTimeRange;
  const bestSeconds=isSupersonicCourse(course)?sonicBests.best(supersonicBestKey(createSupersonicProfile(sonicPanel.getSettings(),course),course)):courseBests.best(course,playMode);
  return {id,name:course.name,choiceLabel:course.choiceLabel,choiceDetail:course.choiceDetail,targetCount:course.lights.length,timeHint:range?'目安 '+range[0]+'〜'+range[1]+'秒':'',bestSeconds,bestLabel:formatCourseTime(bestSeconds),previewSvg:createCoursePreviewSVG(course),
    createPreviewSVG:({width,height})=>createCoursePreviewSVG(course,{width,height,featured:true}),
    ...(id===SIERRA10_COURSE_ID?{detail:'門A〜F→出口G · 推定地理1/10 · 約19.9km · 亜音速',timeHint:'150〜300m/s・高度60〜139m・最大9G'}:id==='supersonic'?{detail:'門5枚＋出口 · 40km四方 · ABでM2'}:id===SIERRA_COURSE_ID?{detail:'光A〜F→出口G · 推定地理1/50 · 約3.9km',timeHint:playMode==='flight'?'初速25m/s · 通常上限60m/s · AB無制限/上限75m/s':'6つの光とGの出口を探索'}:{})};
}
function cancelFlowPending(fresh){
  permissionAttempt++;flowPermissionAwaiting=false;pendingCalibration=false;clearTimeout(waitingTimer);pwa.cancelEntry();halt();reference=null;
  if(['waiting','ready','error'].includes(phase))setPhase(fresh?'intro':'paused');
}
function setupStartFlow(){
  if(!flowEnabled||flowUI)return;
  flowUI=createStartFlowPanel({enabled:true,dev:flowDev,onAction:(name,value)=>{void flowCoordinator?.action(name,value);}});
  briefingUI=createBriefingPanel({root:app,onClose:info=>flowCoordinator?.mapClosed(info),onSignal:signal=>feedback.briefingAudio(signal)});
  flowCoordinator=createStartFlowController({ui:flowUI,map:briefingUI,pwa,preferences:startPreferences,briefingPreferences,record:startRecord,
    read:()=>({phase,mode:playMode,camera:cameraMode,steering:flightSteering,input:inputMode,course:selectedCourse,state:stage?.getStatus()??{grounded:false},pauseReason:lastPauseReason,result:{newBest:phase==='complete'&&courseTime?.newBest===true}}),
    actions:{
      courseCards:()=>(playMode==='flight'?PLAYABLE_COURSE_IDS:ORDINARY_COURSE_IDS).map(courseCard),
      prepareFresh:prepareFlowFresh,cancelPending:cancelFlowPending,
      selectCourse:id=>selectCourse(id),selectMode:mode=>{if(flowDev)selectMode(mode);},setCamera:value=>selectCamera(value),
      ready:()=>setPhase('ready'),launch:(mode,reason)=>run(mode,reason),unlock:()=>feedback.unlock(),
      countdownPaint:()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(resolve,0)))),
      countdownAudio:signal=>feedback.countdownAudio(signal),briefingAudio:signal=>feedback.briefingAudio(signal),
      hold:mode=>{
        if(!stage){location.reload();return;}
        feedback.unlock();
        if(mode==='practice'){startPractice('explicit-screen-method');return;}
        if(sensorListening){calibrate();return;}
        flowPermissionAwaiting=true;const pending=requestSensors(),attempt=permissionAttempt;if(phase==='waiting')pendingCalibration=true;
        void pending.finally(()=>{if(attempt===permissionAttempt)flowPermissionAwaiting=false;});
      },
      openSettings:()=>{feedback.stop();flightPanel.setPhase('paused',playMode);$('flight-adjustments').open=true;},
      closeSettings:()=>{feedback.stop();$('flight-adjustments').open=false;flightPanel.setPhase(phase,playMode);},
      endFlight:()=>{prepareFlowFresh();},copyResult:()=>$('result-copy').click(),
    }});
  flowUI.setSettings({version:APP_VERSION});flowCoordinator.showTitle();
}

applyModeUI();
try {
  stage = makeStage();if(sonicMode())sonicActivity.begin(stage.getStatus().supersonic);
  stage.update(0, { mode: playMode, speed: 0, craftQuaternion });
  stage.setGroundPatternStrength(sonicMode()?.8:flightPanel.getSettings().groundPatternStrength);renderRadarUpgrade();
  resize();
  setupStartFlow();
  pwa.initialize();
  requestAnimationFrame(frame);
} catch (error) {
  setupStartFlow();
  setPhase('error');
  dialog({ title: '3D画面を表示できません', description: 'WebGLに対応したSafariやChromeで開き直してください。', action: '再読み込みする', error: error.message || '3D描画の開始に失敗しました。' });
  $('practice-button').hidden = true;
}
