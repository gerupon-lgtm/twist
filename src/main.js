import './style.css';
import { orientationQuaternion, relativeAngles, controlRates } from './controls.js';
import { createStage } from './stage.js';

const $ = (id) => document.getElementById(id);
const app = $('app');
const canvas = $('world');
let stage;
let phase = 'intro';
let inputMode = null;
let reference = null;
let latestQuaternion = null;
let lastOrientationAt = 0;
let lastMotionAt = 0;
let sensorListening = false;
let permissionAttempt = 0;
let waitingTimer = null;
let pendingCalibration = false;
let wakeLock = null;
let angles = { pitch: 0, steer: 0, twist: 0 };
let rates = { pitchRate: 0, yawRate: 0, speed: 0 };
const practiceAngles = { pitch: 0, steer: 0, twist: 0 };
const heldKeys = new Set();
let keyboardActive = false;
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
}

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
  $('dialog-kicker').textContent = inputMode === 'practice' ? '画面操作・センサー未使用' : '傾きとひねりの操作検証';
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
  for (const axis of controls) { practiceAngles[axis] = 0; $(`practice-${axis}`).value = '0'; }
}

function halt() {
  pendingCalibration = false;
  clearTimeout(waitingTimer);
  rates = { pitchRate: 0, yawRate: 0, speed: 0 };
  angles = { pitch: 0, steer: 0, twist: 0 };
  zeroPractice();
  if (stage) stage.update(0, rates);
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
  dialog({ title: '一時停止', description: message, action: inputMode === 'sensor' ? 'この持ち方で再開する' : '画面操作を再開する', guide: false });
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
  setPhase('running');
  $('pause-button').focus({ preventScroll: true });
  keepAwake();
}

function receiveOrientation(event) {
  const q = orientationQuaternion(event, screenAngle());
  if (!q) {
    latestQuaternion = null;
    if (phase === 'running' && inputMode === 'sensor') pause('3方向すべての傾きが読めなくなったため停止しました。');
    return;
  }
  latestQuaternion = q;
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
    dialog({ title: '持ち方を決めましょう', description: '画面が見やすい角度で、スマホを動かさずに持ってください。', note: 'この持ち方を、傾きもひねりもゼロの基準にします。', action: 'この持ち方で始める', guide: false });
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
      // Motion without a corresponding orientation must not keep old throttle alive.
      latestQuaternion = null;
      if (phase === 'running' && inputMode === 'sensor') pause('スマホの動きに対する向きの更新が届かないため停止しました。');
    } else if (!moving) lastMotionAt = now;
  });
  sensorListening = true;
}

async function requestSensors() {
  halt();
  const attempt = ++permissionAttempt;
  pendingCalibration = false;
  latestQuaternion = null;
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
    dialog({ title: '持ち方を確認しています', description: '今の持ち方の近くでスマホを少し動かしてください。新しい傾きが届いたら始まります。', action: '新しい傾きを待っています…' });
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
  reference = latestQuaternion.clone();
  angles = { pitch: 0, steer: 0, twist: 0 };
  run('sensor');
  showToast('今の持ち方を基準にしました。右へ少しひねると前進します。', 4300);
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
  run('practice');
  showToast('画面操作の練習です。スマホの傾きは使っていません。');
}

$('start-button').addEventListener('click', () => {
  if (!stage) return;
  if (phase === 'complete') { resetStage(); return; }
  if (phase === 'ready' || (phase === 'paused' && inputMode === 'sensor')) { calibrate(); return; }
  if (phase === 'paused' && inputMode === 'practice') { startPractice(); return; }
  requestSensors();
});
$('practice-button').addEventListener('click', () => {
  if (!stage) return;
  if (phase === 'complete') { stage.reset(); previousCollected = 0; }
  inputMode === 'practice' ? requestSensors() : startPractice();
});
$('pause-button').addEventListener('click', () => pause());
$('recenter-button').addEventListener('click', () => pause('一度停止しました。楽な持ち方に戻し、下のボタンで新しい基準を決めてください。'));
$('help-button').addEventListener('click', () => {
  if (phase !== 'running') return;
  pause('前後で上下、左右で左右に曲がります。右へのひねりで前進し、ひねりだけ戻すと前進停止。傾きを保つ間は回り続けます。');
  $('control-guide').hidden = false;
});
$('practice-neutral').addEventListener('click', zeroPractice);
for (const axis of controls) $(`practice-${axis}`).addEventListener('input', (event) => { keyboardActive = false; heldKeys.clear(); practiceAngles[axis] = Number(event.target.value); });

function resetStage() {
  permissionAttempt++;
  halt();
  stage.reset();
  previousCollected = 0;
  $('toast').hidden = true;
  if (inputMode === 'practice') startPractice();
  else { setPhase('paused'); dialog({ title: 'もう一度、出発しましょう', description: '持ち方を決めて、3つの光を集めに行きましょう。', action: 'この持ち方で始める' }); }
}
$('reset-button').addEventListener('click', resetStage);

document.addEventListener('visibilitychange', () => { if (document.hidden) pause('画面が隠れたため停止しました。持ち方を合わせて再開してください。'); });
window.addEventListener('blur', () => { heldKeys.clear(); if (phase === 'running') pause('画面から離れたため停止しました。'); });
const screenChanged = () => { latestQuaternion = null; lastOrientationAt = 0; lastMotionAt = 0; pause('画面の向きが変わったため停止しました。持ち方を合わせ直してください。'); resize(); };
screen.orientation?.addEventListener('change', screenChanged);
if (!screen.orientation) window.addEventListener('orientationchange', screenChanged);
window.addEventListener('keydown', (event) => {
  if (phase !== 'running' || inputMode !== 'practice' || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  const key = event.key.toLowerCase();
  if (['w','s','a','d','e','q'].includes(key)) { heldKeys.add(key); keyboardActive = true; event.preventDefault(); }
  if (event.code === 'Space') { event.preventDefault(); pause(); }
});
window.addEventListener('keyup', (event) => heldKeys.delete(event.key.toLowerCase()));
canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); pause('3Dの表示が中断しました。ページを再読み込みしてください。'); });

function resize() { stage?.resize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio || 1, 1.6)); }
window.addEventListener('resize', resize);

function meter(axis, limit) {
  const value = Number.isFinite(angles[axis]) ? angles[axis] : 0;
  $(`${axis}-value`).textContent = `${Math.round(value)}°`;
  const el = $(`${axis}-meter`);
  if (axis === 'twist') { el.style.width = `${Math.max(0, Math.min(value / limit, 1)) * 100}%`; }
  else { el.style.left = `${value < 0 ? 50 - Math.min(-value / limit, 1) * 50 : 50}%`; el.style.width = `${Math.min(Math.abs(value) / limit, 1) * 50}%`; }
}

let lastHudAt = 0;
function updateHud(now, state) {
  if (now - lastHudAt < 80) return;
  lastHudAt = now;
  for (const axis of controls) meter(axis, axis === 'twist' ? 32 : 25);
  $('speed-value').textContent = state.speed.toFixed(1);
  $('altitude-value').textContent = state.altitude.toFixed(1);
  $('motion-state').textContent = phase !== 'running' || state.speed < 0.01 ? '停止中' : '前進中';
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
}

let previousFrame = performance.now();
function frame(now) {
  const dt = Math.min((now - previousFrame) / 1000, 0.05);
  previousFrame = now;
  if (stage) {
    if (phase === 'running') {
      if (inputMode === 'sensor') {
        if (now - Math.max(lastOrientationAt, lastMotionAt) > 1800) pause('センサーの更新が届かなくなったため停止しました。持ち方を合わせて再開してください。');
        else if (reference && latestQuaternion) angles = relativeAngles(reference, latestQuaternion);
      } else {
        if (keyboardActive) {
          practiceAngles.pitch = (heldKeys.has('w') ? 18 : 0) - (heldKeys.has('s') ? 18 : 0);
          practiceAngles.steer = (heldKeys.has('d') ? 18 : 0) - (heldKeys.has('a') ? 18 : 0);
          practiceAngles.twist = heldKeys.has('e') ? 26 : 0;
          for (const axis of controls) $(`practice-${axis}`).value = practiceAngles[axis];
        }
        angles = { ...practiceAngles };
      }
    }
    rates = phase === 'running' ? controlRates(angles) : { pitchRate: 0, yawRate: 0, speed: 0 };
    if (phase === 'running') stage.update(dt, rates);
    const state = stage.getStatus();
    if (state.collected > previousCollected) { previousCollected = state.collected; showToast(state.collected === state.total ? '3つの光がそろいました。出口へ向かいましょう。' : `光を集めました。あと${state.total - state.collected}つ。`); }
    if (state.complete && phase === 'running') {
      halt();
      setPhase('complete');
      dialog({ title: '出口に到着しました', description: '3つの光を集めて、探索クリア。傾きとひねりは操作しやすかったですか？', note: 'ひねりを戻してから、もう一度試せます。', action: 'もう一度遊ぶ' });
    }
    updateHud(now, state);
  }
  if (now > toastUntil) $('toast').hidden = true;
  requestAnimationFrame(frame);
}

try {
  stage = createStage(canvas);
  resize();
  requestAnimationFrame(frame);
} catch (error) {
  setPhase('error');
  dialog({ title: '3D画面を表示できません', description: 'WebGLに対応したSafariやChromeで開き直してください。', action: '再読み込みする', error: error.message || '3D描画の開始に失敗しました。' });
  $('practice-button').hidden = true;
  $('start-button').addEventListener('click', () => location.reload());
}
