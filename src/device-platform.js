/** UA is used only for device-specific instructions, never for game controls. */
export function isIPhone(userAgent = '') {
  return typeof userAgent === 'string' && /\biPhone\b/i.test(userAgent);
}

export const isAndroid = (userAgent = '') => typeof userAgent === 'string' && /\bAndroid\b/i.test(userAgent);
export const ORIENTATION_TYPES = ['portrait-primary','portrait-secondary','landscape-primary','landscape-secondary'];

// Read once on page entry: entering fullscreen later does not change the launch method.
export function launchMethod({ standalone = false, displayModes = [] } = {}) {
  return standalone || displayModes.some(mode => ['standalone','fullscreen','minimal-ui'].includes(mode)) ? 'installed' : 'browser';
}

export function installationAdvice({ userAgent = '', launch = 'browser' } = {}) {
  return isIPhone(userAgent) && launch === 'browser' ? '共有メニュー →「ホーム画面に追加」でアプリとして開けます。' : '';
}

/** Legacy angles are a fallback for iPhone, whose natural orientation is portrait. */
export function orientationType({ type, legacyAngle, width, height } = {}) {
  if (ORIENTATION_TYPES.includes(type)) return type;
  if (Number.isFinite(legacyAngle)) {
    return ({0:'portrait-primary',90:'landscape-primary',180:'portrait-secondary',270:'landscape-secondary'})[((legacyAngle % 360) + 360) % 360]
      ?? (width > height ? 'landscape' : 'portrait');
  }
  return width > height ? 'landscape' : 'portrait';
}

/** An interrupted flight keeps its original orientation until an explicit restart succeeds. */
export function createOrientationGuard() {
  let started = null, interrupted = false, returned = false;
  return {
    begin(type) { started = type; interrupted = false; returned = false; },
    clear() { started = null; interrupted = false; returned = false; },
    canResume: type => !interrupted || type === started,
    check(type, running) {
      if (!started) return null;
      if (running && type !== started) { interrupted = true; returned = false; return 'changed'; }
      if (!interrupted) return null;
      if (type !== started) { returned = false; return 'waiting'; }
      if (!returned) { returned = true; return 'returned'; }
      return null;
    },
  };
}

export function iPhoneOrientationNotice({ userAgent = '', landscape = false } = {}) {
  if (!isIPhone(userAgent)) return null;
  return landscape
    ? { title: 'iPhoneの画面の向き', text: '「画面縦向きのロック」は縦向き用です。横向きで遊ぶときは、開始した向きを保ってください。' }
    : { title: 'iPhoneは縦向きロックがおすすめ', text: 'コントロールセンターで「画面縦向きのロック」をオンにすると、画面の自動回転を防げます。' };
}
