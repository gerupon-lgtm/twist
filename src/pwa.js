import { APP_VERSION } from './version.js';
import { isIPhone, isAndroid, launchMethod, installationAdvice, orientationType, ORIENTATION_TYPES, createOrientationGuard } from './device-platform.js';
import { createOrientationToast } from './orientation-toast.js';

const $ = id => document.getElementById(id);
export function createPwaController({ getPhase, pause, showDialog, allPlatforms = false }) {
  const userAgent = navigator.userAgent;
  const iphone = isIPhone(userAgent), android = isAndroid(userAgent);
  const launch = launchMethod({ standalone: navigator.standalone === true,
    displayModes: ['standalone','fullscreen','minimal-ui'].filter(mode => matchMedia(`(display-mode: ${mode})`).matches) });
  const guard = createOrientationGuard();
  const notice = createOrientationToast({ root: $('orientation-notice'), userAgent });
  const fullscreenEnabled = android || allPlatforms;
  let installPrompt = null, installed = launch === 'installed', generation = 0, locked = false, newerVersion = null, checking = false, orientationNoticeActive = false;
  let fullscreenAttempt = { fullscreenRequested:false, fullscreenSucceeded:false, fullscreenRequestedAt:0, fullscreenSucceededAt:0, fullscreenSource:'other' };
  const time = () => { const value = performance.now(); return Number.isFinite(value) ? Math.max(0,value) : 0; };
  const currentOrientation = () => orientationType({ type: screen.orientation?.type, legacyAngle: window.orientation, width: innerWidth, height: innerHeight });
  const fullscreen = () => Boolean(document.fullscreenElement || matchMedia('(display-mode: fullscreen)').matches);
  const canResume = () => !newerVersion && (!iphone || guard.canResume(currentOrientation()));

  function render() {
    const phase = getPhase();
    $('app').dataset.launch = launch;
    $('app').dataset.fullscreen = String(fullscreen());
    $('install-button').hidden = installed || !android || !installPrompt || phase !== 'intro';
    const advice = installationAdvice({ userAgent, launch: installed ? 'installed' : launch });
    $('installation-advice').textContent = advice;
    $('installation-advice').hidden = !advice || phase !== 'intro';
    $('release-screen-button').hidden = !fullscreenEnabled || phase !== 'paused' || !(fullscreen() || locked);
    if (!canResume()) { $('start-button').disabled = true; $('practice-button').disabled = true; }
    else $('practice-button').disabled = false;
    if (phase !== 'intro' && !(allPlatforms && orientationNoticeActive && ['paused','ready','waiting'].includes(phase))) notice.hide();
  }
  function orientationChanged() {
    if (iphone) {
      const result = guard.check(currentOrientation(),getPhase() === 'running');
      if (result === 'changed') pause('画面の向きが変わりました。開始したときの向きに戻してください。');
      if (result === 'waiting') {
        if (['waiting','ready'].includes(getPhase())) pause('開始したときの向きに戻してください。');
        if (getPhase() === 'paused') showDialog({ title: '画面の向きを戻してください', description: '開始したときの向きに戻してください。その後、持ち方を合わせ直して再開します。', action: '開始時の向きを待っています…' });
      }
      if (result === 'returned') showDialog({ title: '元の向きに戻りました', description: '持ち方を合わせ直してから、ボタンで再開してください。自動では動き出しません。', action: 'この持ち方で再開する' });
    }
    notice.refresh(); render();
  }
  async function requestFullscreenFor(attempt, source) {
    if (!fullscreenEnabled || fullscreen() || typeof document.documentElement.requestFullscreen !== 'function') return fullscreen();
    const record = { fullscreenRequested:true, fullscreenSucceeded:false, fullscreenRequestedAt:time(), fullscreenSucceededAt:0,
      fullscreenSource:['title','legacy','resume'].includes(source) ? source : 'other' };
    fullscreenAttempt = record;
    try {
      await document.documentElement.requestFullscreen();
      // A resolved promise alone is not evidence that fullscreen was actually entered.
      if (fullscreenAttempt === record && fullscreen()) {
        record.fullscreenSucceeded = true; record.fullscreenSucceededAt = time();
      }
    } catch { /* Playing remains available. */ }
    return attempt === generation && fullscreen();
  }
  async function lockOrientationFor(type, attempt) {
    if (!android) return false;
    try {
      if (ORIENTATION_TYPES.includes(type) && screen.orientation?.lock) {
        await screen.orientation.lock(type);
        if (attempt === generation) { locked = true; return true; }
        else screen.orientation.unlock?.();
      }
    } catch { /* Browser/OS may reject a lock even when the method is present. */ }
    return false;
  }
  async function requestFullscreen({ source = 'other' } = {}) {
    const attempt = ++generation;
    const entered = await requestFullscreenFor(attempt,source);
    if (attempt === generation) render();
    return attempt === generation && entered;
  }
  async function lockCurrentOrientation() {
    orientationNoticeActive = false; notice.hide();
    const type = screen.orientation?.type, attempt = ++generation;
    const result = await lockOrientationFor(type,attempt);
    if (attempt === generation) render();
    return attempt === generation && result;
  }
  async function enter({ source = 'legacy' } = {}) {
    orientationNoticeActive = false; notice.hide();
    if (!fullscreenEnabled) return;
    const attempt = ++generation;
    // The legacy start/recenter flow keeps the type held before fullscreen changes the viewport.
    const type = screen.orientation?.type;
    await requestFullscreenFor(attempt,source);
    if (attempt !== generation) return;
    await lockOrientationFor(type,attempt);
    if (attempt === generation) render();
  }
  async function release() {
    generation++;
    if (allPlatforms) { orientationNoticeActive = false; notice.hide(); }
    try { screen.orientation?.unlock?.(); } catch { /* Unsupported. */ }
    locked = false;
    try { if (document.fullscreenElement) await document.exitFullscreen?.(); } catch { /* Unsupported. */ }
    render();
    // An installed app's manifest display mode is controlled by the OS, not exitFullscreen().
    $('installed-screen-advice').hidden = !(launch === 'installed' && fullscreen());
  }
  $('release-screen-button').addEventListener('click',release);
  window.addEventListener('beforeinstallprompt',event => {
    if (!android || installed) return;
    event.preventDefault(); installPrompt = event; render();
  });
  window.addEventListener('appinstalled',() => { installed = true; installPrompt = null; render(); });
  $('install-button').addEventListener('click',async() => {
    const prompt = installPrompt; installPrompt = null; render();
    if (!prompt) return;
    try { await prompt.prompt(); await prompt.userChoice; } catch { /* The browser can decline the request. */ }
  });
  document.addEventListener('fullscreenchange',() => {
    if (fullscreenEnabled && !fullscreen() && getPhase() === 'running') {
      void release(); pause('全画面を終了したため停止しました。持ち方を合わせて再開してください。');
    }
    render();
  });

  async function checkVersion() {
    if (!import.meta.env.PROD || checking || document.hidden) return;
    checking = true;
    try {
      const response = await fetch(`./version.json?v=${APP_VERSION}&t=${Date.now()}`,{cache:'no-store'});
      if (!response.ok) return;
      const next = (await response.json()).version;
      if (/^\d+\.\d+\.\d+$/.test(next) && compareVersions(next,APP_VERSION) > 0) {
        newerVersion = next;
        pause('新しい版を公開しました。「最新版を開く」で更新してください。');
        $('update-notice').hidden = false;
        $('update-version').textContent = `v${next}`;
        render();
      }
    } catch { /* No connection does not reload or discard the current attempt. */ }
    finally { checking = false; }
  }
  $('update-button').addEventListener('click',() => {
    if (!newerVersion) return;
    const url = new URL(location.href); url.searchParams.set('v',newerVersion); location.replace(url);
  });
  document.addEventListener('visibilitychange',() => { if (!document.hidden) void checkVersion(); });
  return {
    render, enter, requestFullscreen, lockCurrentOrientation, release, orientationChanged, canResume,
    showOrientationNotice() { orientationNoticeActive = allPlatforms; notice.show(); },
    cancelEntry() { generation++; if (allPlatforms) { orientationNoticeActive = false; notice.hide(); } },
    begin() { if (!canResume()) return false; guard.begin(currentOrientation()); return true; },
    clearOrientation() { guard.clear(); },
    report: () => ({launch, fullscreen:fullscreen(), ...fullscreenAttempt}),
    initialize() {
      render(); if (allPlatforms) notice.hide(); else notice.show();
      if (import.meta.env.PROD && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`,{scope:'./',updateViaCache:'none'}).catch(() => {});
      }
      void checkVersion();
    },
  };
}

function compareVersions(a,b) {
  const left = a.split('.').map(Number), right = b.split('.').map(Number);
  for (let i=0;i<3;i++) if (left[i] !== right[i]) return left[i] - right[i];
  return 0;
}
