import './style.css';
import { Quaternion, MathUtils } from 'three';
import { CONTROL_LIMITS, orientationQuaternion, relativeAngles, compensationQuaternion, projectedTiltAngles, composeDevicePose, controlRates, flightRates, advanceSpeed } from './controls.js';
import { createStage } from './stage.js';

const $ = (id) => document.getElementById(id);
const app = $('app');
const canvas = $('world');
let stage;
let phase = 'intro';
let playMode = new URLSearchParams(location.search).get('mode') === 'flight' ? 'flight' : 'explore';
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
}

const modeNote = () => playMode === 'flight'
  ? '出力50%で出発します。同じ出力でも上昇で減速、下降で加速。低出力では降下しやすくなります。'
  : `先端側の傾き${CONTROL_LIMITS.throttleMaximum}°で加減速が最大。中立で速度を保ちます。`;

function setThrottle(value) {
  throttle = Number.isFinite(value) ? MathUtils.clamp(value, 0, 1) : 0;
  $('throttle-input').value = String(Math.round(throttle * 100));
  $('throttle-value').textContent = `${Math.round(throttle * 100)}%`;
}

function applyModeUI() {
  const flight = playMode === 'flight';
  app.dataset.playMode = playMode;
  $('play-mode-label').textContent = flight ? '飛行機モード' : '探索モード';
  $('flight-attitude').hidden = !flight;
  $('flight-throttle').hidden = !flight;
  $('twist-control-meter').hidden = flight;
  $('practice-panel').open = !flight;
  $('practice-summary').hidden = !flight;
  $('mode-explore').setAttribute('aria-pressed', String(!flight));
  $('mode-flight').setAttribute('aria-pressed', String(flight));
  $('pitch-caption').textContent = flight ? '先端側を起こすと機首上げ' : '先端側で加速・逆で制動';
  $('steer-caption').textContent = flight ? '翼を傾けて旋回' : '下げた側へ曲がる';
  $('twist-caption').textContent = flight ? '回しても出力は変わらない' : '右で上・左で下へ曲がる';
  $('stop-hint').textContent = flight ? '停止は一時停止ボタン' : `加減速は${CONTROL_LIMITS.throttleMaximum}°で最大`;
  $('guide-pitch-title').textContent = flight ? '先端側を起こす・倒す' : '自機の先端側へ倒す';
  $('guide-pitch-text').textContent = flight ? '機首を上下へ向ける' : '先端側で加速、逆側でブレーキ';
  $('guide-steer-title').textContent = flight ? '翼を傾けるように倒す' : '自機の左右へ倒す';
  $('guide-steer-text').textContent = flight ? '傾けた側へ旋回' : '下げた側へ曲がり続ける';
  $('guide-twist-title').textContent = flight ? '画面下のスロットル' : '左右へひねって保つ';
  $('guide-twist-text').textContent = flight ? 'エンジン出力を調整' : '右で上、左で下へ曲がり続ける';
  $('guide-third-glyph').textContent = flight ? '⇄' : '↻';
  $('guide-third-glyph').classList.toggle('twist-glyph', !flight);
  $('keyboard-guide').textContent = flight ? 'W・S 機首の上・下\nA・D 旋回 / Q・E 出力の弱・強' : 'W 加速 / S ブレーキ\nA・D 左右 / Q・E 下・上';
  $('practice-brake').textContent = flight ? '出力0%' : 'ブレーキ';
  $('dialog-note').textContent = modeNote();
  $('dialog-note').hidden = false;
  $('home-link').href = `./?mode=${playMode}&v=0.1.5`;
}

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
  url.searchParams.set('v', '0.1.5');
  history.replaceState(null, '', url);
  if (resume) {
    setPhase('paused');
    dialog({ title: `${playMode === 'flight' ? '飛行機' : '探索'}モードに切り替えました`, description: 'ステージを最初からにしました。持ち方を決めて始めましょう。', note: modeNote(), action: inputMode === 'sensor' ? 'この持ち方で再開する' : '画面操作を再開する', guide: true });
  } else {
    inputMode = null;
    setPhase('intro');
    dialog({ title: '自分はそのまま。世界を動かそう。', description: '空中の光を3つ集めて出口へ。自機は最初の上向きを保ちます。', note: modeNote(), action: 'スマホの傾きで始める', guide: true });
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
  latestInputQuaternion = orientationQuaternion(latestOrientationSample, referenceScreenAngle);
}

function readPose(displayPose, inputPose, neutralReference, physicalReference) {
  craftQuaternion.copy(compensationQuaternion(physicalReference, displayPose));
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
  reference = latestQuaternion.clone();
  if (!craftReference) craftReference = reference.clone();
  angles = { pitch: 0, steer: 0, twist: 0 };
  run('sensor');
  showToast(playMode === 'flight' ? '先端側を起こすと機首上げ。左右で旋回し、画面下でエンジン出力を調整します。' : '自機の先端側を下げると加速、逆側を下げるとブレーキ。持ち直しても自機の向きは保ちます。', 4300);
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
  pause(playMode === 'flight' ? '先端側を手前へ起こす感覚で機首上げ、倒すと機首下げ。左右へ傾けて旋回します。スロットルはエンジンの強さで、指を離すと出力を保ちます。出力0%でも滑空するため、停止は一時停止を使います。機首は自動で水平へ戻りません。' : '自機の先端側を下げると加速、逆側でブレーキ。自機の右側・左側を下げて旋回します。傾きを中立へ戻すと速さを保ち、ひねりで上下へ。半回転付近では上下のひねりが中立に戻ります。');
  $('control-guide').hidden = false;
});
$('practice-neutral').addEventListener('click', zeroPractice);
function pointPracticeTilt(pitch, steer, twist = practiceAngles.twist) {
  const radians = MathUtils.degToRad(twist);
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
  const horizontal = behind ? (state.bearing > 0 ? '右の後ろ' : '左の後ろ') : Math.abs(state.bearing) > 0.25 ? (state.bearing > 0 ? '右' : '左') : '正面';
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
          const steer = (heldKeys.has('d') ? 18 : 0) - (heldKeys.has('a') ? 18 : 0);
          const turn = keyboardTwistBase + (playMode === 'flight' ? 0 : (heldKeys.has('e') ? 22 : 0) - (heldKeys.has('q') ? 22 : 0));
          if (playMode === 'flight' && (heldKeys.has('e') || heldKeys.has('q'))) setThrottle(throttle + ((heldKeys.has('e') ? 1 : 0) - (heldKeys.has('q') ? 1 : 0)) * dt * 0.4);
          const wrappedTurn = ((turn + 180) % 360 + 360) % 360 - 180;
          pointPracticeTilt(pitch, steer, wrappedTurn);
        }
        const pose = composeDevicePose(practiceAngles);
        angles = readPose(pose, pose, neutralQuaternion, neutralQuaternion);
      }
      if (phase === 'running' && angles.valid === false) pause('自機の先端が見えにくい角度になったため停止しました。画面を少し戻して、操作の中立を合わせ直してください。');
    }
    rates = phase === 'running' ? (playMode === 'flight' ? flightRates(angles) : controlRates(angles)) : { pitchRate: 0, yawRate: 0, bankAngle: 0, acceleration: 0, brake: 0 };
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
  stage = createStage(canvas);
  stage.update(0, { mode: playMode, speed: 0, craftQuaternion });
  resize();
  requestAnimationFrame(frame);
} catch (error) {
  setPhase('error');
  dialog({ title: '3D画面を表示できません', description: 'WebGLに対応したSafariやChromeで開き直してください。', action: '再読み込みする', error: error.message || '3D描画の開始に失敗しました。' });
  $('practice-button').hidden = true;
  $('start-button').addEventListener('click', () => location.reload());
}
