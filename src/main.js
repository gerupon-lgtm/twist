import './style.css';
import { Quaternion, MathUtils } from 'three';
import { CONTROL_LIMITS, orientationQuaternion, relativeAngles, compensationQuaternion, projectedTiltAngles, deviceTiltAngles, composeDevicePose, controlRates, flightRates, advanceSpeed } from './controls.js';
import { createStage } from './stage.js';
import { projectEdgeTarget } from './visibility.js';

const $ = (id) => document.getElementById(id);
const app = $('app');
const canvas = $('world');
let stage;
let phase = 'intro';
let playMode = new URLSearchParams(location.search).get('mode') === 'flight' ? 'flight' : 'explore';
let visibility = new URLSearchParams(location.search).get('view') === 'classic' ? 'classic' : 'assisted';
let flightSteering = new URLSearchParams(location.search).get('steer') === 'tilt' ? 'tilt' : 'twist';
let inputMode = null;
let reference = null;
let craftReference = null;
let referenceScreenAngle = 0;
let latestQuaternion = null;
let latestInputQuaternion = null;
let latestOrientationSample = null;
let lastOrientationAt = 0;
let lastMotionAt = 0;
let sensorListening = false;
let permissionAttempt = 0;
let waitingTimer = null;
let pendingCalibration = false;
let wakeLock = null;
let angles = { pitch: 0, steer: 0, twist: 0 };
let rates = { pitchRate: 0, yawRate: 0, bankAngle: 0, acceleration: 0, brake: 0 };
let speed = 0;
let throttle = 0;
const craftQuaternion = new Quaternion();
const neutralQuaternion = new Quaternion();
const practiceAngles = { pitch: 0, steer: 0, twist: 0 };
const heldKeys = new Set();
let keyboardActive = false;
let keyboardTwistBase = 0;
let previousCollected = 0;
let toastUntil = 0;
const screenAngle = () => screen.orientation?.angle ?? window.orientation ?? 0;
const controls = ['pitch', 'steer', 'twist'];

function setPhase(next) {
  phase = next;
  app.dataset.phase = next;
  $('pause-button').disabled = next !== 'running';
  $('recenter-button').disabled = next !== 'running' || inputMode !== 'sensor';
  $('veil').hidden = next === 'running';
  for (const mode of ['explore', 'flight']) $(`mode-${mode}`).disabled = ['waiting', 'ready', 'running'].includes(next);
  $('throttle-input').disabled = next !== 'running' || playMode !== 'flight';
  for (const view of ['assisted', 'classic']) $(`view-${view}`).disabled = ['waiting', 'ready'].includes(next);
  for (const steering of ['twist', 'tilt']) $(`steering-${steering}`).disabled = ['waiting', 'ready', 'running'].includes(next);
}

const modeNote = () => playMode === 'flight'
  ? 'スマホ本体を基準に操縦します。出力50%で出発。上昇で減速、下降で加速し、低出力では降下しやすくなります。'
  : `先端側の傾き${CONTROL_LIMITS.throttleMaximum}°で加減速が最大。中立で速度を保ちます。`;

function setThrottle(value) {
  throttle = Number.isFinite(value) ? MathUtils.clamp(value, 0, 1) : 0;
  $('throttle-input').value = String(Math.round(throttle * 100));
  $('throttle-value').textContent = `${Math.round(throttle * 100)}%`;
}

function applyVisibilityUI() {
  const assisted = visibility === 'assisted';
  app.dataset.visibility = visibility;
  $('play-mode-label').textContent = `${playMode === 'flight' ? '飛行機' : '探索'}・${assisted ? '対策' : '従来'}`;
  $('view-assisted').setAttribute('aria-pressed', String(assisted));
  $('view-classic').setAttribute('aria-pressed', String(!assisted));
  $('view-note').textContent = assisted ? '視野を広く。色と形の目印と、画面端の目標マーク。' : '従来の視野と景色。同じ位置で見え方を比べられます。';
  $('home-link').href = `./?mode=${playMode}&view=${visibility}&steer=${flightSteering}&v=0.1.7`;
}

function selectVisibility(next) {
  if (!stage || next === visibility || !['assisted', 'classic'].includes(next) || ['waiting', 'ready'].includes(phase)) return;
  visibility = next;
  stage.setVisibility(visibility);
  applyVisibilityUI();
  const url = new URL(location.href);
  url.searchParams.set('view', visibility);
  url.searchParams.set('steer', flightSteering);
  url.searchParams.set('v', '0.1.7');
  history.replaceState(null, '', url);
}
$('view-assisted').addEventListener('click', () => selectVisibility('assisted'));
$('view-classic').addEventListener('click', () => selectVisibility('classic'));

function applyModeUI() {
  const flight = playMode === 'flight';
  const twistSteering = flightSteering === 'twist';
  app.dataset.playMode = playMode;
  app.dataset.controlBasis = flight ? 'device' : 'craft';
  app.dataset.flightSteering = flightSteering;
  $('play-mode-label').textContent = flight ? '飛行機モード' : '探索モード';
  $('flight-attitude').hidden = !flight;
  $('flight-throttle').hidden = !flight;
  $('steer-control-meter').hidden = flight && twistSteering;
  $('twist-control-meter').hidden = flight && !twistSteering;
  $('pitch-label').textContent = flight ? 'スマホ上端の傾き' : '先端側の傾き';
  $('steer-label').textContent = flight ? 'スマホ右端の傾き' : '自機の左右';
  $('twist-label').textContent = flight ? 'スマホのひねり' : '左右のひねり';
  $('flight-steering-picker').hidden = !flight;
  $('steering-twist').setAttribute('aria-pressed', String(twistSteering));
  $('steering-tilt').setAttribute('aria-pressed', String(!twistSteering));
  $('steering-note').textContent = twistSteering
    ? '画面を見たままハンドルのように回す。右回しで右旋回。'
    : 'お盆のように左右の端を上下する。下げた側へ旋回。';
  $('practice-panel').open = !flight;
  $('practice-summary').hidden = !flight;
  $('mode-explore').setAttribute('aria-pressed', String(!flight));
  $('mode-flight').setAttribute('aria-pressed', String(flight));
  $('pitch-caption').textContent = flight ? '上端を起こすと機首上げ' : '先端側で加速・逆で制動';
  $('steer-caption').textContent = flight ? '下げた側へ旋回' : '下げた側へ曲がる';
  $('twist-caption').textContent = flight ? '右回しで右・左回しで左旋回' : '右で上・左で下へ曲がる';
  $('stop-hint').textContent = flight ? '停止は一時停止ボタン' : `加減速は${CONTROL_LIMITS.throttleMaximum}°で最大`;
  $('guide-pitch-title').textContent = flight ? 'スマホ本体の上端を起こす・倒す' : '自機の先端側へ倒す';
  $('guide-pitch-text').textContent = flight ? '起こすと機首上げ、前へ倒すと機首下げ' : '先端側で加速、逆側でブレーキ';
  $('guide-steer-title').textContent = flight ? (twistSteering ? 'ハンドルのように左右へひねる' : 'スマホの左右の端を上下する') : '自機の左右へ倒す';
  $('guide-steer-text').textContent = flight ? (twistSteering ? '回した側へ旋回。戻すと翼が水平へ' : '下げた側へ旋回。戻すと翼が水平へ') : '下げた側へ曲がり続ける';
  $('guide-steer-glyph').textContent = flight && twistSteering ? '↻' : '↔';
  $('guide-steer-glyph').classList.toggle('twist-glyph', flight && twistSteering);
  $('guide-steer-glyph').classList.toggle('steer-glyph', !flight || !twistSteering);
  $('guide-twist-title').textContent = flight ? '画面下のスロットル' : '左右へひねって保つ';
  $('guide-twist-text').textContent = flight ? 'エンジン出力を調整' : '右で上、左で下へ曲がり続ける';
  $('guide-third-glyph').textContent = flight ? '⇄' : '↻';
  $('guide-third-glyph').classList.toggle('twist-glyph', !flight);
  $('keyboard-guide').textContent = flight ? 'W・S 機首の上・下\nA・D 旋回 / Q・E 出力の弱・強' : 'W 加速 / S ブレーキ\nA・D 左右 / Q・E 下・上';
  $('practice-brake').textContent = flight ? '出力0%' : 'ブレーキ';
  $('dialog-note').textContent = modeNote();
  $('dialog-note').hidden = false;
  applyVisibilityUI();
}

function selectSteering(next) {
  if (!stage || next === flightSteering || !['twist', 'tilt'].includes(next) || ['waiting', 'ready', 'running'].includes(phase)) return;
  flightSteering = next;
  applyModeUI();
  const url = new URL(location.href);
  url.searchParams.set('steer', flightSteering);
  url.searchParams.set('v', '0.1.7');
  history.replaceState(null, '', url);
}
$('steering-twist').addEventListener('click', () => selectSteering('twist'));
$('steering-tilt').addEventListener('click', () => selectSteering('tilt'));

function selectMode(next) {
  if (!stage || next === playMode || ['waiting', 'ready', 'running'].includes(phase)) return;
  const resume = Boolean(inputMode) && phase !== 'error';
  permissionAttempt++;
  halt();
  stage.reset();
  reference = null;
  previousCollected = 0;
  $('toast').hidden = true;
  playMode = next;
  applyModeUI();
  stage.update(0, { mode: playMode, speed: 0, craftQuaternion });
  const url = new URL(location.href);
  url.searchParams.set('mode', playMode);
  url.searchParams.set('view', visibility);
  url.searchParams.set('steer', flightSteering);
  url.searchParams.set('v', '0.1.7');
  history.replaceState(null, '', url);
  if (resume) {
    setPhase('paused');
    dialog({ title: `${playMode === 'flight' ? '飛行機' : '探索'}モードに切り替えました`, description: 'ステージを最初からにしました。持ち方を決めて始めましょう。', note: modeNote(), action: inputMode === 'sensor' ? 'この持ち方で再開する' : '画面操作を再開する', guide: true });
  } else {
    inputMode = null;
    setPhase('intro');
    dialog({ title: '自分はそのまま。世界を動かそう。', description: '金色の光を3つ集めて出口へ。自機は最初の上向きを保ちます。', note: modeNote(), action: 'スマホの傾きで始める', guide: true });
  }
}
$('mode-explore').addEventListener('click', () => selectMode('explore'));
$('mode-flight').addEventListener('click', () => selectMode('flight'));

function dialog({ title, description, note = '', action = '再開する', guide = false, error = '' }) {
  $('dialog-title').textContent = title;
  $('dialog-description').textContent = description;
  $('dialog-note').textContent = note;
  $('dialog-note').hidden = !note;
  $('control-guide').hidden = !guide;
  $('start-button').textContent = action;
  $('start-button').disabled = false;
  $('error-message').textContent = error;
  $('error-message').hidden = !error;
  $('reset-button').hidden = !inputMode;
  $('practice-button').hidden = false;
  $('practice-button').textContent = inputMode === 'practice' ? 'スマホの傾きに切り替える' : '画面操作で試す';
  $('dialog-kicker').textContent = inputMode === 'practice' ? '画面操作・センサー未使用' : playMode === 'flight' ? '傾き操縦と画面スロットル' : '傾きとひねりの操作検証';
}

function showError(message) {
  pendingCalibration = false;
  halt();
  setPhase('error');
  dialog({ title: '傾きを確認できませんでした', description: '停止しています。下の内容を確認して、もう一度試してください。', action: 'もう一度センサーを確認する', error: message });
}

function zeroPractice() {
  heldKeys.clear();
  keyboardActive = false;
  keyboardTwistBase = 0;
  for (const axis of controls) { practiceAngles[axis] = 0; $(`practice-${axis}`).value = '0'; }
}

function halt() {
  pendingCalibration = false;
  clearTimeout(waitingTimer);
  rates = { pitchRate: 0, yawRate: 0, bankAngle: 0, acceleration: 0, brake: 0 };
  speed = 0;
  setThrottle(0);
  angles = { pitch: 0, steer: 0, twist: 0 };
  zeroPractice();
  if (stage) stage.update(0, { ...rates, mode: playMode, speed, craftQuaternion });
  wakeLock?.release().catch(() => {});
  wakeLock = null;
}

function pause(message = '止まっています。スマホを楽な持ち方に戻してから再開してください。') {
  if (!['running', 'ready', 'waiting'].includes(phase)) return;
  permissionAttempt++;
  pendingCalibration = false;
  clearTimeout(waitingTimer);
  halt();
  reference = null;
  setPhase('paused');
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

function run(mode) {
  inputMode = mode;
  app.dataset.input = mode;
  $('practice-panel').hidden = mode !== 'practice';
  $('input-mode').textContent = mode === 'sensor' ? 'スマホの傾きで操作中' : '画面操作・センサー未使用';
  zeroPractice();
  speed = 0;
  if (playMode === 'flight') { setThrottle(0.5); stage.launchFlight(); }
  if (mode === 'sensor' && craftReference && latestQuaternion) craftQuaternion.copy(compensationQuaternion(craftReference, latestQuaternion));
  else craftQuaternion.identity();
  setPhase('running');
  $('pause-button').focus({ preventScroll: true });
  keepAwake();
}

function refreshOrientations() {
  latestQuaternion = orientationQuaternion(latestOrientationSample, screenAngle());
  // A browser layout rotation is not a physical twist of the phone.
  latestInputQuaternion = orientationQuaternion(latestOrientationSample, playMode === 'flight' ? 0 : referenceScreenAngle);
}

function readPose(displayPose, inputPose, neutralReference, physicalReference) {
  craftQuaternion.copy(compensationQuaternion(physicalReference, displayPose));
  if (playMode === 'flight') return deviceTiltAngles(neutralReference, inputPose);
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
  // Some browsers only send orientation when the angle changes. Motion events
  // provide a heartbeat while a deliberately held angle is unchanged.
  window.addEventListener('devicemotion', (event) => {
    const rotation = event.rotationRate;
    if (!rotation || ![rotation.alpha, rotation.beta, rotation.gamma].every((n) => typeof n === 'number' && Number.isFinite(n))) return;
    const now = performance.now();
    const moving = Math.max(Math.abs(rotation.alpha), Math.abs(rotation.beta), Math.abs(rotation.gamma)) > 3;
    if (moving && now - lastOrientationAt > 400) {
      // Motion without a corresponding orientation must not keep old acceleration alive.
      latestQuaternion = null;
      latestInputQuaternion = null;
      latestOrientationSample = null;
      if (phase === 'running' && inputMode === 'sensor') pause('スマホの動きに対する向きの更新が届かないため停止しました。');
    } else if (!moving) lastMotionAt = now;
  });
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
  lastMotionAt = 0;
  reference = null;
  inputMode = 'sensor';
  app.dataset.input = 'sensor';
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
  pendingCalibration = false;
  clearTimeout(waitingTimer);
  referenceScreenAngle = screenAngle();
  refreshOrientations();
  reference = (playMode === 'flight' ? latestInputQuaternion : latestQuaternion).clone();
  if (!craftReference) craftReference = latestQuaternion.clone();
  angles = { pitch: 0, steer: 0, twist: 0 };
  run('sensor');
  showToast(playMode === 'flight' ? `スマホ本体の上端を起こすと機首上げ。${flightSteering === 'twist' ? 'ハンドルのようにひねって' : '左右の端を上下して'}旋回します。` : '自機の先端側を下げると加速、逆側を下げるとブレーキ。持ち直しても自機の向きは保ちます。', 4300);
}

function showToast(text, duration = 2600) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  toastUntil = performance.now() + duration;
}

function startPractice() {
  permissionAttempt++;
  pendingCalibration = false;
  clearTimeout(waitingTimer);
  halt();
  reference = null;
  craftReference = null;
  run('practice');
  showToast('画面操作の練習です。スマホの傾きは使っていません。');
}

$('start-button').addEventListener('click', () => {
  if (!stage) return;
  if (stage.getStatus().grounded) { resetStage(); if (inputMode === 'sensor') calibrate(); return; }
  if (phase === 'complete') { resetStage(); return; }
  if (phase === 'ready' || (phase === 'paused' && inputMode === 'sensor')) { calibrate(); return; }
  if (phase === 'paused' && inputMode === 'practice') { startPractice(); return; }
  requestSensors();
});
$('practice-button').addEventListener('click', () => {
  if (!stage) return;
  if (phase === 'complete') { stage.reset(); previousCollected = 0; craftReference = null; }
  inputMode === 'practice' ? requestSensors() : startPractice();
});
$('pause-button').addEventListener('click', () => pause());
$('recenter-button').addEventListener('click', () => pause('一度停止しました。自機の向きは保ったまま、今の持ち方を操作の中立に合わせ直します。'));
$('help-button').addEventListener('click', () => {
  if (phase !== 'running') return;
  pause(playMode === 'flight' ? `自機の表示向きに関係なく、スマホ本体の上端を手前へ起こすと機首上げ、前へ倒すと機首下げ。${flightSteering === 'twist' ? '画面を見たままハンドルのように右へ回すと右旋回、左へ回すと左旋回。左右の端を倒す動きは旋回に使いません。' : 'スマホの右端を下げると右旋回、左端を下げると左旋回。ひねりは旋回に使いません。'}戻すと翼は水平へ戻りますが、機首は今の角度を保ちます。スロットルはエンジンの強さで、指を離すと出力を保ちます。出力0%でも滑空するため、停止は一時停止を使います。` : '自機の先端側を下げると加速、逆側でブレーキ。自機の右側・左側を下げて旋回します。傾きを中立へ戻すと速さを保ち、ひねりで上下へ。半回転付近では上下のひねりが中立に戻ります。');
  $('control-guide').hidden = false;
});
$('practice-neutral').addEventListener('click', zeroPractice);
function pointPracticeTilt(pitch, steer, twist = practiceAngles.twist) {
  const radians = playMode === 'flight' ? 0 : MathUtils.degToRad(twist);
  practiceAngles.pitch = Math.round(pitch * Math.cos(radians) - steer * Math.sin(radians));
  practiceAngles.steer = Math.round(pitch * Math.sin(radians) + steer * Math.cos(radians));
  practiceAngles.twist = twist;
  for (const axis of controls) $(`practice-${axis}`).value = practiceAngles[axis];
}
$('practice-brake').addEventListener('click', () => {
  heldKeys.clear();
  if (playMode === 'flight') setThrottle(0);
  else { keyboardActive = false; pointPracticeTilt(25, 0); }
});
$('throttle-input').addEventListener('input', (event) => { if (phase === 'running' && playMode === 'flight') setThrottle(Number(event.target.value) / 100); });
for (const axis of controls) $(`practice-${axis}`).addEventListener('input', (event) => { keyboardActive = false; heldKeys.clear(); practiceAngles[axis] = Number(event.target.value); });

function resetStage() {
  permissionAttempt++;
  halt();
  reference = null;
  craftReference = null;
  stage.reset();
  previousCollected = 0;
  $('toast').hidden = true;
  if (inputMode === 'practice') startPractice();
  else { setPhase('paused'); dialog({ title: 'もう一度、出発しましょう', description: '持ち方を決めて、3つの光を集めに行きましょう。', note: modeNote(), action: playMode === 'flight' ? 'この持ち方で飛ぶ' : 'この持ち方で始める' }); }
}
$('reset-button').addEventListener('click', resetStage);

document.addEventListener('visibilitychange', () => { if (document.hidden) pause('画面が隠れたため停止しました。持ち方を合わせて再開してください。'); });
window.addEventListener('blur', () => { heldKeys.clear(); if (phase === 'running' || pendingCalibration) pause('画面から離れたため停止しました。'); });
const screenChanged = () => { refreshOrientations(); resize(); };
screen.orientation?.addEventListener('change', screenChanged);
if (!screen.orientation) window.addEventListener('orientationchange', screenChanged);
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

function resize() { stage?.resize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio || 1, 1.6)); }
window.addEventListener('resize', resize);

function meter(axis, limit) {
  const angle = Number.isFinite(angles[axis]) ? angles[axis] : 0;
  const value = axis === 'twist' ? MathUtils.radToDeg(Math.asin(Math.sin(MathUtils.degToRad(angle)))) : angle;
  $(`${axis}-value`).textContent = `${Math.round(value)}°`;
  const el = $(`${axis}-meter`);
  el.style.left = `${value < 0 ? 50 - Math.min(-value / limit, 1) * 50 : 50}%`;
  el.style.width = `${Math.min(Math.abs(value) / limit, 1) * 50}%`;
}

let lastHudAt = 0;
function updateEdgeMarker(state) {
  const marker = $('target-edge-marker');
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
  marker.style.left = `${projected.x}px`;
  marker.style.top = `${projected.y}px`;
  $('edge-arrow').style.transform = `rotate(${projected.rotation}deg)`;
  $('edge-label').textContent = state.targetLabel;
  const vertical = Math.abs(state.elevation) > 0.13 ? (state.elevation > 0 ? '上' : '下') : '';
  $('edge-detail').textContent = `${[projected.behind ? '後ろ' : '', vertical].filter(Boolean).join('・')} ${Math.round(state.distance)}m`.trim();
  marker.setAttribute('aria-label', `${state.targetLabel} ${$('edge-detail').textContent}`);
}

function updateHud(now, state) {
  if (now - lastHudAt < 80) return;
  lastHudAt = now;
  for (const axis of controls) meter(axis, playMode === 'explore' && axis === 'pitch' ? CONTROL_LIMITS.throttleMaximum : axis === 'twist' ? CONTROL_LIMITS.twistMaximum : CONTROL_LIMITS.tiltMaximum);
  $('speed-value').textContent = state.speed.toFixed(1);
  $('altitude-value').textContent = state.altitude.toFixed(1);
  $('nose-value').textContent = `${Math.round(MathUtils.radToDeg(state.pitch))}°`;
  $('bank-value').textContent = `${Math.round(MathUtils.radToDeg(state.bank || 0))}°`;
  $('climb-value').textContent = `${(state.verticalSpeed || 0) > 0 ? '+' : ''}${(state.verticalSpeed || 0).toFixed(1)}`;
  $('motion-state').textContent = phase !== 'running' || state.speed < 0.01 ? '停止中'
    : playMode === 'flight' ? (state.verticalSpeed > 0.1 ? '上昇中' : state.verticalSpeed < -0.1 ? '下降中' : '巡航中')
    : rates.brake > 0 ? 'ブレーキ' : rates.acceleration > 0 ? '加速中' : '速度維持';
  $('target-label').textContent = state.complete ? '到着' : state.targetLabel;
  $('target-distance').textContent = `${Math.round(state.distance)} m`;
  $('collection-count').textContent = state.collected;
  $('objective').textContent = state.collected < state.total ? '3つの光を集めて、出口へ' : '光がそろいました。出口へ';
  $('nav-arrow').style.transform = `rotate(${state.bearing * 180 / Math.PI}deg)`;
  const behind = Math.abs(state.bearing) > Math.PI / 2;
  const directlyBehind = visibility === 'assisted' && Math.abs(state.bearing) >= 175 * Math.PI / 180;
  const horizontal = behind ? (directlyBehind ? '後ろ' : state.bearing > 0 ? '右の後ろ' : '左の後ろ') : Math.abs(state.bearing) > 0.25 ? (state.bearing > 0 ? '右' : '左') : '正面';
  const vertical = Math.abs(state.elevation) > 0.13 ? (state.elevation > 0 ? '上' : '下') : '';
  $('target-direction').textContent = `${horizontal}${vertical ? `・${vertical}` : ''}`;
  app.dataset.speed = state.speed.toFixed(3);
  app.dataset.position = JSON.stringify(state.position);
  app.dataset.craftQuaternion = JSON.stringify(state.craftQuaternion);
  app.dataset.bank = String(state.bank || 0);
  app.dataset.flightPitch = String(state.pitch);
  app.dataset.heading = String(state.heading);
  app.dataset.yawRate = String(state.yawRate || 0);
  app.dataset.verticalSpeed = String(state.verticalSpeed || 0);
  app.dataset.throttle = String(state.throttle || 0);
  app.dataset.grounded = String(Boolean(state.grounded));
  app.dataset.horizontalFov = String(state.fieldOfView?.horizontal || 0);
  app.dataset.landmarkCount = String(state.landmarks?.length || 0);
  updateEdgeMarker(state);
}

let previousFrame = performance.now();
function frame(now) {
  const dt = Math.min((now - previousFrame) / 1000, 0.05);
  previousFrame = now;
  if (stage) {
    if (phase === 'running') {
      if (inputMode === 'sensor') {
        if (now - Math.max(lastOrientationAt, lastMotionAt) > 1800) pause('センサーの更新が届かなくなったため停止しました。持ち方を合わせて再開してください。');
        else if (reference && craftReference && latestOrientationSample) {
          refreshOrientations();
          angles = readPose(latestQuaternion, latestInputQuaternion, reference, craftReference);
        }
      } else {
        if (keyboardActive) {
          const pitch = playMode === 'flight' ? (heldKeys.has('w') ? 18 : 0) - (heldKeys.has('s') ? 18 : 0) : (heldKeys.has('s') ? 22 : 0) - (heldKeys.has('w') ? 18 : 0);
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
        angles = readPose(pose, pose, neutralQuaternion, neutralQuaternion);
      }
      if (phase === 'running' && angles.valid === false) pause(playMode === 'flight' ? '中立の持ち方から大きく倒れたため停止しました。画面が見やすい角度に戻して、持ち方を合わせ直してください。' : '自機の先端が見えにくい角度になったため停止しました。画面を少し戻して、操作の中立を合わせ直してください。');
    }
    rates = phase === 'running' ? (playMode === 'flight' ? flightRates(angles, 1, flightSteering) : controlRates(angles)) : { pitchRate: 0, yawRate: 0, bankAngle: 0, acceleration: 0, brake: 0 };
    if (phase === 'running') {
      if (playMode === 'explore') speed = advanceSpeed(speed, dt, rates);
      stage.update(dt, { ...rates, mode: playMode, speed, throttle, craftQuaternion });
    }
    const state = stage.getStatus();
    if (state.collected > previousCollected) { previousCollected = state.collected; showToast(state.collected === state.total ? '3つの光がそろいました。出口へ向かいましょう。' : `光を集めました。あと${state.total - state.collected}つ。`); }
    if (state.complete && phase === 'running') {
      halt();
      setPhase('complete');
      dialog({ title: '出口に到着しました', description: playMode === 'flight' ? '3つの光を集めて飛行クリア。傾きとスロットルは操作しやすかったですか？' : '3つの光を集めて、探索クリア。傾きとひねりは操作しやすかったですか？', note: '楽な持ち方に戻してから、もう一度試せます。', action: 'もう一度遊ぶ' });
    }
    if (state.grounded && phase === 'running') {
      pause('地面に近づいたため停止しました。最初から飛び直せます。');
      dialog({ title: '地面に近づいたため停止', description: '出力と機首を調整しながら飛んでみましょう。', note: '飛び直すと出発地点から出力50%で始まります。', action: '最初から飛び直す' });
    }
    updateHud(now, state);
  }
  if (now > toastUntil) $('toast').hidden = true;
  requestAnimationFrame(frame);
}

applyModeUI();
try {
  stage = createStage(canvas, { visibility });
  stage.update(0, { mode: playMode, speed: 0, craftQuaternion });
  resize();
  requestAnimationFrame(frame);
} catch (error) {
  setPhase('error');
  dialog({ title: '3D画面を表示できません', description: 'WebGLに対応したSafariやChromeで開き直してください。', action: '再読み込みする', error: error.message || '3D描画の開始に失敗しました。' });
  $('practice-button').hidden = true;
  $('start-button').addEventListener('click', () => location.reload());
}
